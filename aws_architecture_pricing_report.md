# PathLab Digital Pathology Cloud — AWS Architecture & Pricing Report
## B.Tech CSE Semester IV Case Study Project

---

## 1. Cloud Architecture & VPC Design

To support scalability, security, high availability, and disaster recovery, the cloud architecture is designed using a multi-tier Virtual Private Cloud (VPC) on AWS.

```
                    [ Internet ]
                         │
                  [ Internet Gateway ]
                         │
                 [ Route 53 (DNS) ]
                         │
             [ Application Load Balancer ] (Public Subnet)
                /                     \
       [ EC2 App Server 1 ]    [ EC2 App Server 2 ] (Private Subnet - Target Group)
       (Availability Zone A)   (Availability Zone B)
                \                     /
            [ Amazon Aurora MySQL DB ] (Private DB Subnet)
              (Primary / Read-Write)
                         │ (Replication)
            [ Amazon Aurora MySQL DB ] (Private DB Subnet)
               (Reader / Read-Only)
                         │
                 [ Amazon S3 ] (Cloud Report Storage)
```

### Networking & Security Group Configuration

- **VPC Subnets**:
  - **Public Subnets**: Houses the Application Load Balancer (ALB) and NAT Gateways.
  - **Private Subnets**: Houses the EC2 virtual machines running the Dockerized Next.js frontend and Express backend. (Direct ingress from Load Balancer only).
  - **Database Subnets**: Houses the Amazon Aurora MySQL Database cluster. (Ingress allowed only from Private App subnets).
  - **Internet Gateway (IGW)**: Provides internet connectivity for public subnets.
  - **NAT Gateway**: Allows private subnet instances to access the internet (e.g. for S3 uploads, package updates) without exposing them directly.

- **Firewall Rules & Security Groups (SGs)**:
  - **ALB Security Group**:
    - *Ingress*: Allow port 80 (HTTP) and port 443 (HTTPS) from `0.0.0.0/0` (anywhere).
    - *Egress*: Allow traffic to App Server SG on port 80/3000/5001.
  - **App Server Security Group**:
    - *Ingress*: Allow TCP port 80 (HTTP) from ALB SG. Allow port 22 (SSH) from secure bastion host or administrator IP only.
    - *Egress*: Allow all outbound traffic.
  - **Database Security Group**:
    - *Ingress*: Allow TCP port 3306 (MySQL) from App Server SG only.
    - *Egress*: Deny all outbound traffic (database has no business initiating outbound internet requests).

---

## 2. Linux System Administration & Nginx Reference

This section maps standard Linux administration tasks required to support the PathLab deployment.

### System Control (systemctl)
- **Nginx Web Server Management**:
  ```bash
  # Check status of Nginx
  sudo systemctl status nginx
  
  # Restart Nginx after editing virtual hosts configuration
  sudo systemctl restart nginx
  
  # Enable Nginx to launch automatically on VM bootup
  sudo systemctl enable nginx
  ```
- **Docker Engine Management**:
  ```bash
  sudo systemctl start docker
  sudo systemctl restart docker
  sudo systemctl enable docker
  ```

### Linux File Permissions & Directory Structuring
Ensure the application files are secured on the Linux VM:
```bash
# Set owner and group permissions for files to deployer
sudo chown -R ubuntu:www-data /app/pathlab

# Set directory permissions (Read, Write, Execute for owner; Read & Execute for group/others)
find /app/pathlab -type d -exec chmod 755 {} \;

# Set file permissions (Read & Write for owner; Read for group/others)
find /app/pathlab -type f -exec chmod 644 {} \;

# Restrict .env credentials file to read/write only by the owner
chmod 600 /app/pathlab/backend/.env
```

### Log Management & Monitoring
- **View Nginx access and error logs**:
  ```bash
  tail -f /var/log/nginx/access.log
  tail -f /var/log/nginx/error.log
  ```
- **View Express.js application container output**:
  ```bash
  docker logs -f pathlab-backend
  ```
- **Inspect system-level logs for troubleshooting**:
  ```bash
  tail -n 100 /var/log/syslog
  ```

### Automating Tasks via Cron (Crontab)
To automate the database backup script at **2:00 AM every night**:
1. Open the system crontab editor:
   ```bash
   crontab -e
   ```
2. Add the following line:
   ```cron
   0 2 * * * /bin/bash /app/pathlab/scripts/backup.sh >> /var/log/pathlab_backup.log 2>&1
   ```

---

## 3. AWS Pricing Strategy & Budget Estimation
*Regions evaluated: US East (N. Virginia)*

### Service Tiers Price Breakdown

| Tier | Compute (EC2) | Database (RDS/Aurora) | Storage (S3 + EBS) | Bandwidth & Extras | Monthly Total |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Basic (Dev/Test)** | 1x `t3.medium` (4GB RAM) <br>**$30.37/mo** | 1x `db.t3.medium` (MySQL)<br>**$32.12/mo** | 30GB EBS gp3 + 50GB S3<br>**$4.75/mo** | NAT Gateway + Logs<br>**$12.00/mo** | **~$79.24** |
| **Professional (Production)** | 2x `t3.large` (8GB RAM)<br>**$121.48/mo** | Multi-AZ `db.r6g.large`<br>**$198.56/mo** | 100GB EBS + 500GB S3<br>**$25.20/mo** | ALB + NAT Gateway + Bandwidth<br>**$52.00/mo** | **~$397.24** |
| **Enterprise (High Availability)**| 4x `c6g.xlarge` (Auto Scale)<br>**$394.20/mo** | Aurora Multi-AZ Cluster<br>**$440.00/mo** | 500GB EBS + 2TB S3<br>**$92.00/mo** | Global ALB + CloudFront + NATs<br>**$115.00/mo** | **~$1,041.20** |

---

## 4. Backup, Disaster Recovery & Redundancy

### RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
- **RPO (Recovery Point Objective)**: **24 hours**. 
  *Strategy*: Nightly snapshot backups of Amazon RDS database and hourly write logs saved to S3.
- **RTO (Recovery Time Objective)**: **4 hours**.
  *Strategy*: Pre-configured infrastructure blueprints using Terraform/CloudFormation, allowing rapid redeployment of virtual servers and attaching backup volumes.

### Disaster Recovery Models (AWS Multi-Region)
1. **Pilot Light (Cost: ~$120/mo extra)**:
   - Primary database replicates to a read-replica in another region (e.g. US West).
   - Core server templates (AMI) exist in standby region.
   - If US East goes offline, DNS (Route 53) failover initiates, EC2 apps are spun up, and database replica is promoted to primary.
2. **Warm Standby (Cost: ~$350/mo extra)**:
   - Active database replication.
   - Minimal instances are always running in standby region to receive traffic instantly.
   - Scales up to full workload capacity during emergency failovers.

---

## 5. Cloud Optimization & Cost Reduction Recommendations

To lower the Total Cost of Ownership (TCO) for PathLab operations, we recommend the following AWS budget guidelines:

1. **Implement S3 Lifecycle Policies**:
   - Diagnostic PDF reports remain on standard S3 for 90 days.
   - Automatically transition reports to **S3 Standard-IA (Infrequent Access)** after 90 days (saves 40% on storage costs).
   - Archive older records (older than 2 years) to **S3 Glacier Flexible Archive** (saves 85%).
2. **Compute Savings Plans & Reserved Instances**:
   - Commit to a 1-year or 3-year term for base compute requirements. This cuts EC2 and RDS monthly charges by **up to 72%** compared to on-demand pricing.
3. **Auto Scaling Policies**:
   - Configure Auto Scaling Groups (ASG) to dynamically scale down EC2 instances to a single VM during off-peak hours (10:00 PM to 6:00 AM) and scale up during the day.
