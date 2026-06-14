#!/bin/bash
# Exit on error
set -e


# Clear screen for a neat output if TERM is set
if [ -n "$TERM" ] && [ "$TERM" != "dumb" ]; then
  clear
fi
echo "================================================================="
echo "  🛠️  PATHLAB LOCAL MYSQL INSTALLER & CONFIGURER (NO-DOCKER)"
echo "================================================================="
echo ""

# 1. Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
  echo "❌ Error: Homebrew is not installed on your Mac."
  echo "Please install it by running:"
  echo '   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi

# 2. Install MySQL via Homebrew
echo "📥 Step 1: Installing MySQL via Homebrew..."
if brew list mysql &>/dev/null; then
  echo "✓ MySQL is already installed via Homebrew."
else
  brew install mysql
fi
echo ""

# 3. Start MySQL service
echo "🚀 Step 2: Starting MySQL service..."
# Check if service is already running
if brew services list | grep -qE "mysql[[:space:]]+started"; then
  echo "✓ MySQL service is already running."
else
  brew services start mysql
fi

echo "⏳ Waiting 5 seconds for MySQL to initialize..."
sleep 5
echo ""

# Resolve mysql path using brew prefix if not directly in PATH
if command -v mysql &> /dev/null; then
  MYSQL_BIN="mysql"
else
  BREW_PREFIX=$(brew --prefix)
  MYSQL_BIN="${BREW_PREFIX}/bin/mysql"
fi

# 4. Configure password & database
echo "🔑 Step 3: Configuring root password and creating database..."

# Check if we can connect with no password (default Brew install state)
if "$MYSQL_BIN" -u root -e "status" &>/dev/null; then
  echo "Setting local MySQL root password to 'rootpassword'..."
  "$MYSQL_BIN" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'rootpassword'; FLUSH PRIVILEGES;" || true
  echo "✓ Password updated successfully."
else
  # Check if we can already connect with 'rootpassword'
  if "$MYSQL_BIN" -u root -prootpassword -e "status" &>/dev/null; then
    echo "✓ Root password is already set to 'rootpassword'."
  else
    echo "⚠️ Warning: Could not connect to MySQL with empty password or 'rootpassword'."
    echo "If you have a custom root password, please set DB_PASSWORD in backend/.env to match it."
  fi
fi
echo ""

# 5. Seed Database Schema
echo "🌱 Step 4: Seeding database schema.sql..."
if "$MYSQL_BIN" -u root -prootpassword -e "USE pathlab_db;" &>/dev/null; then
  echo "✓ Database 'pathlab_db' already exists. Re-applying schema.sql..."
fi

"$MYSQL_BIN" -u root -prootpassword < schema.sql
echo "✓ Database created and seeded successfully!"

echo ""
echo "================================================================="
echo "🎉 Setup Complete!"
echo "You can now run './dev.sh' to start frontend and backend locally"
echo "without needing Docker at all!"
echo "================================================================="
