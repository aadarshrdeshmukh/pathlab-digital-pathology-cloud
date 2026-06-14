# 🧬 PathLab — Digital Pathology Cloud

> **AWS Case Study Project** — B.Tech CSE Semester IV, ITM Skills University

A full-stack Laboratory Management Portal built for Digital Pathology & Laboratory Services. Designed as a centralized cloud platform supporting operational management, analytics, reporting, secure access control, monitoring, and future multi-branch expansion.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![Express](https://img.shields.io/badge/Express-4.x-000?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3%20%7C%20RDS%20%7C%20CloudWatch-FF9900?logo=amazonaws)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [AWS Services Used](#-aws-services-used)
- [Automation Scripts](#-automation-scripts)
- [Screenshots](#-screenshots)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      AWS Cloud                          │
│                                                         │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Nginx   │───▶│   Next.js    │    │   AWS S3     │  │
│   │ (Port 80)│    │  (Port 3000) │    │  ┌────────┐  │  │
│   └──────────┘    └──────┬───────┘    │  │reports/ │  │  │
│        │                 │            │  │backups/ │  │  │
│        │          ┌──────▼───────┐    │  └────────┘  │  │
│        └─────────▶│  Express.js  │───▶│              │  │
│                   │  (Port 5001) │    └──────────────┘  │
│                   └──────┬───────┘                      │
│                          │                              │
│                   ┌──────▼───────┐    ┌──────────────┐  │
│                   │    MySQL     │    │  CloudWatch   │  │
│                   │  (Port 3306) │    │  Monitoring   │  │
│                   └──────────────┘    └──────────────┘  │
│                                                         │
│              EC2 Instance (t2.micro)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, Tailwind CSS, Lucide Icons, Framer Motion |
| **Backend** | Express.js 4, Node.js 18 |
| **Database** | MySQL 8.0 (AWS RDS / Docker) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **File Storage** | AWS S3 (with local fallback) |
| **Hosting** | AWS EC2 (Ubuntu 22.04) |
| **Reverse Proxy** | Nginx |
| **Containerization** | Docker + Docker Compose |
| **Monitoring** | AWS CloudWatch, custom shell scripts |

---

## ✨ Features

### 🔐 Access Control
- JWT-based authentication with secure password hashing
- **Role-Based Access Control (RBAC)** — Admin, Technician, Doctor
- Route-level protection on both frontend and backend
- Admin-only executive reporting portal

### 📊 Operational Dashboards
- Real-time KPI cards (Patients, Pending Tests, Reports, Active Staff)
- Interactive bar chart with live data
- Recent test queue with status indicators
- Multi-branch selector (scalability ready)

### 🧪 Workflow Management
- Patient registration with search and pagination
- Test request lifecycle (Pending → Processing → Completed)
- Priority tracking (Low / Medium / High / Critical)
- PDF report upload with S3 cloud storage

### 📈 Executive Reporting (Admin Only)
- Aggregated organizational metrics
- Test completion rate visualization
- Priority & staff role breakdowns
- Recent activity feed

### 🛡 Compliance & Auditability
- `audit_logs` table tracking all data mutations
- Automatic `updated_at` timestamps on records
- Foreign key constraints ensuring data integrity
- `.env` file protection (600 permissions)

### ☁️ Cloud Infrastructure
- Custom VPC with public/private subnets across 2 AZs
- Security groups isolating app and database tiers
- IAM roles for secure S3 access (no hardcoded credentials)
- CloudWatch dashboard with CPU alarm + SNS email alerts

---

## 📁 Project Structure

```
pathlab-digital-pathology-cloud/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── requireRole.js       # Role-based access control
│   ├── routes/
│   │   ├── auth.js              # Login, register, profile
│   │   ├── patients.js          # CRUD patients
│   │   ├── tests.js             # Test requests + status updates
│   │   ├── reports.js           # Report upload (S3) + executive
│   │   └── stats.js             # Dashboard aggregated stats
│   ├── utils/
│   │   └── auditLog.js          # Audit trail logger
│   ├── db.js                    # MySQL connection pool
│   ├── server.js                # Express app entry point
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── dashboard/page.js    # Main dashboard with charts
│   │   ├── executive/page.js    # Admin-only executive report
│   │   ├── login/page.js        # Authentication page
│   │   ├── patients/page.js     # Patient management
│   │   ├── reports/page.js      # Report viewing & upload
│   │   ├── tests/page.js        # Test request management
│   │   ├── page.js              # Landing page
│   │   └── globals.css          # Design system
│   ├── components/
│   │   ├── Navbar.js            # Navigation with branch selector
│   │   ├── Sidebar.js           # Page sidebar navigation
│   │   └── StatCard.js          # KPI stat card component
│   ├── lib/api.js               # Axios API client
│   └── package.json
├── scripts/
│   ├── backup.sh                # Automated DB backup → S3
│   ├── deploy.sh                # EC2 provisioning & deployment
│   └── monitor.sh               # System health monitoring
├── schema.sql                   # Complete database schema + seed data
├── docker-compose.yml           # 3-service container stack
├── Dockerfile.backend           # Backend container image
├── Dockerfile.frontend          # Frontend container image
├── aws_architecture_pricing_report.md  # AWS pricing & architecture docs
└── dev.sh                       # Local development runner
```

---

## 🚀 Getting Started

### Prerequisites
- **Docker** & **Docker Compose** installed
- **Node.js 18+** (for local development without Docker)

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/<your-username>/pathlab-digital-pathology-cloud.git
cd pathlab-digital-pathology-cloud

# Create .env file from example
cp backend/.env.example .env

# Start all services (MySQL + Backend + Frontend)
docker compose up -d

# Wait ~30s for MySQL to initialize, then visit:
# http://localhost:3000
```

### Option 2: Local Development

```bash
# Clone and enter project
git clone https://github.com/<your-username>/pathlab-digital-pathology-cloud.git
cd pathlab-digital-pathology-cloud

# Run the local dev script (handles everything)
chmod +x dev.sh
./dev.sh
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pathlab.com` | `admin123` |
| Technician | `tech@pathlab.com` | `tech123` |
| Doctor | `doctor@pathlab.com` | `doctor123` |

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=pathlab_db
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000

# AWS S3 (optional — falls back to local storage if not set)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
```

---

## ☁️ AWS Services Used

| Service | Purpose |
|---------|---------|
| **EC2** (t2.micro) | Application hosting — Ubuntu 22.04 with Docker |
| **S3** | Report PDF storage & database backup storage |
| **VPC** | Custom network with public/private subnets, IGW, security groups |
| **IAM** | Users (pathlab-admin, pathlab-readonly) + EC2 S3 role |
| **CloudWatch** | Monitoring dashboard, CPU alarm, metrics |
| **SNS** | Email alert notifications for CloudWatch alarms |

---

## ⚙️ Automation Scripts

| Script | Schedule | Description |
|--------|----------|-------------|
| `scripts/backup.sh` | Daily 2:00 AM | MySQL dump → gzip → S3 upload → 7-day pruning |
| `scripts/monitor.sh` | Every 15 min | CPU, RAM, disk monitoring with alert thresholds |
| `scripts/deploy.sh` | Manual | Full EC2 provisioning (Nginx, Docker, UFW, app deploy) |

---

## 📸 Screenshots

> Screenshots of the deployed application and AWS infrastructure are maintained in the `screenshots/` directory for the project submission.

---

## 📄 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | User login, returns JWT |
| POST | `/api/auth/register` | Admin | Register new staff member |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| GET | `/api/patients` | ✅ | List patients (paginated, searchable) |
| POST | `/api/patients` | ✅ | Add new patient |
| GET | `/api/tests` | ✅ | List test requests |
| POST | `/api/tests` | ✅ | Create test request |
| PATCH | `/api/tests/:id` | ✅ | Update test status |
| GET | `/api/reports` | ✅ | List reports |
| POST | `/api/reports` | ✅ | Upload report PDF |
| GET | `/api/reports/executive` | Admin | Executive summary report |
| GET | `/api/dashboard` | ✅ | Aggregated dashboard stats |
| GET | `/api/health` | ❌ | Health check endpoint |

---

## 👤 Author

**Adarsh R Deshmukh**
B.Tech CSE — ITM Skills University, Semester IV

---

## 📝 License

This project is developed as an academic case study for AWS Cloud Computing coursework.
