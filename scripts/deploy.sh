#!/bin/bash
# PathLab Digital Pathology Cloud - Automated Linux Deploy Script
# Designed for Ubuntu 20.04/22.04 LTS VM instances

echo "================================================================="
echo "Initializing PathLab Cloud Infrastructure Deployment..."
echo "================================================================="

# 1. Update OS package lists
echo "[1/6] Updating system package repositories..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install Git, curl, Nginx, and prerequisite utilities
echo "[2/6] Installing necessary utilities (Git, curl, Nginx)..."
sudo apt-get install -y git curl nginx ufw

# 3. Install Docker and Docker Compose
echo "[3/6] Installing Docker engine..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose (V2)
echo "Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# Ensure current user is in docker group
sudo usermod -aG docker $USER

# 4. Configure Firewall (UFW)
echo "[4/6] Configuring Security firewall rules..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # Port 22
sudo ufw allow http         # Port 80
sudo ufw allow https        # Port 443
# Note: Port 5001 is kept closed to direct public access to enforce secure proxying through Nginx
sudo ufw --force enable

# 5. Configure Nginx Reverse Proxy for Frontend (Port 3000) and Backend (Port 5001)
echo "[5/6] Setting up Nginx virtual hosts configurations..."
# Fix Permission Denied bug by using 'sudo tee' instead of raw redirection '>'
cat << 'EOF' | sudo tee /etc/nginx/sites-available/pathlab > /dev/null
server {
    listen 80;
    server_name _; # Responds to any public IP/DNS

    # Next.js Frontend reverse proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express.js Backend API reverse proxy
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Adjust file upload limits for large report PDFs
        client_max_body_size 10M;
    }

    # Static local uploads fallback directory proxy
    location /uploads/ {
        proxy_pass http://localhost:5001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Recommended Production Step: To configure SSL/HTTPS via Let's Encrypt, run:
#   sudo apt-get install -y certbot python3-certbot-nginx
#   sudo certbot --nginx -d <your-domain-name>

# Activate the configuration and reload Nginx
sudo ln -sf /etc/nginx/sites-available/pathlab /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
sudo systemctl enable nginx

# 6. Start PathLab Container Stack via Docker Compose
echo "[6/6] Launching containerized application services..."
# Make sure we are in the root directory containing docker-compose.yml
docker compose up -d

echo "================================================================="
echo "Deployment Complete!"
echo "Next.js Web Client is accessible on: http://<vm-public-ip>"
echo "Express Server API is accessible on: http://<vm-public-ip>/api"
echo "================================================================="
