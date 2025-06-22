# Splash Backend Deployment Guide

## Quick Start (for experienced users)
```bash
# 1. Configure AWS CLI
aws configure

# 2. Create ECR repo
aws ecr create-repository --repository-name splash-backend --region us-east-1

# 3. Build and push
docker build -t splash-backend .
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag splash-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/splash-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/splash-backend:latest

# 4. Create RDS and App Runner via console
# 5. Update apprunner.yaml with credentials
# 6. Deploy!
```

## Overview
This guide walks through deploying the Splash backend to AWS using App Runner and RDS PostgreSQL.

## Architecture
- **AWS App Runner**: Hosts the FastAPI container (auto-scaling, managed SSL)
- **Amazon RDS**: PostgreSQL database (free tier eligible)
- **Amazon ECR**: Container registry for Docker images

## Prerequisites

### 1. AWS Account Setup
If you don't have an AWS account:
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the signup process (credit card required)
4. **Important**: You'll get 12 months of free tier access

### 2. Install AWS CLI

#### macOS
```bash
# Using Homebrew
brew install awscli

# Or download the installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

#### Linux
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### Windows
Download and run the MSI installer from:
https://awscli.amazonaws.com/AWSCLIV2.msi

#### Verify Installation
```bash
aws --version
# Should show: aws-cli/2.x.x Python/3.x.x
```

### 3. Create IAM User for CLI Access

1. Go to AWS Console → IAM → Users → Add User
2. User name: `splash-deploy`
3. Select "Programmatic access"
4. Attach existing policies:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AWSAppRunnerFullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonVPCFullAccess` (for security groups)
5. Create user and **save the credentials**:
   - Access Key ID
   - Secret Access Key

### 4. Configure AWS CLI

```bash
aws configure
```

Enter when prompted:
- AWS Access Key ID: (from step 3)
- AWS Secret Access Key: (from step 3)
- Default region name: `us-east-1` (or your preferred region)
- Default output format: `json`

Test configuration:
```bash
aws sts get-caller-identity
# Should show your account details
```

### 5. Install Docker

#### macOS
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version
```

#### Windows
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and ensure WSL 2 is enabled

### 6. Clone the Repository
```bash
git clone <your-repo-url>
cd splash
```

## Step-by-Step Deployment

### 1. Set Up RDS PostgreSQL

1. Go to AWS Console → RDS → Create Database
2. Choose:
   - Engine: PostgreSQL 15.x
   - Template: Free tier
   - DB instance identifier: `splash-db`
   - Master username: `tally`
   - Master password: (generate secure password)
   - DB instance class: `db.t4g.micro` (or `db.t3.micro`)
   - Storage: 20 GB gp3
   - Public access: No (more secure)
   - Initial database name: `splash`

3. After creation, note the endpoint (e.g., `splash-db.c10gmikqa1sm.us-east-2.rds.amazonaws.com`)

### 2. Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name splash-backend

# Get your account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

# Login to ECR
aws ecr get-login-password | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

### 3. Set Up ECR Lifecycle Policy (Important for Free Tier)

To stay within the 500MB ECR free tier limit, set up automatic image cleanup:

```bash
# Create lifecycle policy
cat > ecr-lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep only 1 latest image",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["latest"],
        "countType": "imageCountMoreThan",
        "countNumber": 1
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images after 1 day (minimum allowed)",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF

# Apply the policy
aws ecr put-lifecycle-policy --repository-name splash-backend --lifecycle-policy-text file://ecr-lifecycle-policy.json

# Clean up
rm ecr-lifecycle-policy.json
```

**Note**: AWS ECR lifecycle policies have a minimum of 1 day for automatic deletion. For immediate cleanup of untagged images, use:

```bash
# Delete untagged images immediately (manual cleanup)
aws ecr list-images --repository-name splash-backend --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json
# If any untagged images exist, delete them:
aws ecr batch-delete-image --repository-name splash-backend --image-ids imageDigest=DIGEST_FROM_ABOVE
```

This ensures:
- Only 1 `latest` image is kept
- Old images are automatically deleted after 1 day
- Manual immediate cleanup is available when needed
- You stay under the 500MB free tier limit

### 4. Build and Push Docker Image

```bash
cd backend

# Build the image for x86_64 (App Runner architecture)
docker build --platform linux/amd64 -t splash-backend .

# Tag for ECR
docker tag splash-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/splash-backend:latest

# Push to ECR (overwrites previous image)
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/splash-backend:latest

# Clean up untagged images immediately after push
UNTAGGED_IMAGES=$(aws ecr list-images --repository-name splash-backend --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json)
if [ "$UNTAGGED_IMAGES" != "[]" ]; then
  echo "Deleting untagged images..."
  aws ecr batch-delete-image --repository-name splash-backend --image-ids "$UNTAGGED_IMAGES"
  echo "Untagged images deleted"
else
  echo "No untagged images to delete"
fi
```

### 5. DO NOT Update apprunner.yaml with Secrets!

**Important**: Never commit passwords to Git. Instead, we'll add them directly in the App Runner console.

The `apprunner.yaml` file already has placeholder values - leave them as is:
```yaml
- name: DATABASE_URL
  value: "postgresql://postgres:YOUR_PASSWORD@splash-db.xxxxx.us-east-2.rds.amazonaws.com:5432/splash"
- name: ADMIN_PASSWORD
  value: "CHANGE_IN_CONSOLE"
```

### 6. Create App Runner Service

#### Option A: Using AWS CLI (Recommended - Secure)

```bash
# First, set your passwords as environment variables (don't type them in your shell history)
read -s -p "Enter RDS Password: " RDS_PASSWORD
echo
read -s -p "Enter Admin Password: " ADMIN_PASSWORD
echo

# Create the App Runner service using AWS CLI
aws apprunner create-service \
  --service-name "splash-backend" \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/splash-backend:latest",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "postgresql://tally:'$RDS_PASSWORD'@splash-db.c10gmikqa1sm.us-east-2.rds.amazonaws.com:5432/splash",
          "ADMIN_USERNAME": "admin",
          "ADMIN_PASSWORD": "'$ADMIN_PASSWORD'",
          "LOG_LEVEL": "info"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \

# Clear the password variables
unset RDS_PASSWORD ADMIN_PASSWORD
```

This approach:
- Never writes passwords to disk
- Passwords don't appear in shell history
- Completely CLI-based
- More secure than editing files

#### Option B: Using AWS Console

1. Go to AWS Console → App Runner → Create Service
2. Source:
   - Container registry: Amazon ECR
   - Select your pushed image
3. Deployment:
   - Manual trigger
   - Create new service role
4. Configure:
   - Service name: `splash-backend`
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Add environment variables manually
5. Auto scaling:
   - Min: 1, Max: 3
6. Health check path: `/health`
7. Create & Deploy

### 7. Configure Security Groups

1. Find your RDS security group in EC2 console
2. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: App Runner service security group

### 8. Test Your Deployment

```bash
# Your App Runner URL will be shown in the console
APP_URL="https://xxxxx.us-east-2.awsapprunner.com"

# Test health endpoint
curl $APP_URL/health

# View API docs
open $APP_URL/docs
```

### 9. Add Custom Domain (Optional)

To use your own domain instead of the App Runner URL:

1. **In App Runner Console**:
   - Go to your `splash-backend` service
   - Click **"Custom domains"** tab
   - Click **"Link domain"**
   - Enter your domain (e.g., `api.yourdomain.com`)

2. **Add DNS Record**:
   App Runner will provide a CNAME record like:
   ```
   CNAME: api.yourdomain.com → xxxxx.us-east-2.awsapprunner.com
   ```

3. **SSL Certificate**:
   - AWS automatically provisions and manages SSL certificates
   - No additional setup required

**Recommended domain structure**:
- API: `api.yourdomain.com`
- Frontend: `yourdomain.com` or `app.yourdomain.com`

## Local Development

Local development continues to work as before:

```bash
docker-compose up
```

This uses SQLite locally with hot-reload enabled.

## Environment Variables

### Production (App Runner)
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_USERNAME`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password
- `LOG_LEVEL`: `info` (default)

### Local Development
- `DATABASE_URL`: SQLite connection (set in docker-compose.yml)
- `RELOAD_FLAG`: `--reload` (enables hot reload)
- `LOG_LEVEL`: `debug`

## Security Best Practices

### Never Commit Secrets
- Don't put passwords in `apprunner.yaml`
- Don't commit `.env` files with real credentials
- Use `.env.example` files with placeholders

### Better Secret Management (Optional)
For production, consider using AWS Secrets Manager:
1. Store DATABASE_URL in Secrets Manager
2. Grant App Runner permission to read secrets
3. Reference secrets in App Runner configuration

This adds ~$0.40/month but is more secure than environment variables.

## Monitoring

- App Runner metrics: AWS Console → App Runner → Your Service → Metrics
- Application logs: AWS Console → App Runner → Your Service → Logs
- RDS metrics: AWS Console → RDS → Your Database → Monitoring

## Cost Estimate

- RDS Free Tier: $0/month (first year)
- App Runner: ~$5/month (1 instance)
- ECR: <$1/month
- **Total: ~$6/month**

## Troubleshooting

### First-Time AWS Setup Issues

#### "Access Denied" Errors
- Ensure your IAM user has all required permissions
- Check you're in the correct AWS region
- Verify AWS CLI is using the right credentials: `aws sts get-caller-identity`

#### Docker Login Fails
```bash
# Make sure to replace <account> with your actual AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### Region Mismatch
- Ensure all resources (ECR, RDS, App Runner) are in the same region
- Check your default region: `aws configure get region`

### Database Connection Issues
- Verify RDS security group allows App Runner
- Check DATABASE_URL format: `postgresql://username:password@endpoint:5432/dbname`
- Ensure RDS is in "available" state (can take 5-10 minutes)
- Test connection locally: `psql -h <endpoint> -U postgres -d splash`

### App Runner Deployment Fails
- Check ECR image exists: `aws ecr describe-images --repository-name splash-backend`
- Verify environment variables are set correctly in App Runner console
- Review deployment logs in App Runner console
- Ensure the ECR repository is in the same region as App Runner

### Health Check Failing
- Ensure `/health` endpoint returns 200 status
- Check application logs for startup errors
- Verify port 8000 is correctly configured
- Database connection issues often cause health check failures

### Common DATABASE_URL Mistakes
```bash
# Wrong (missing port or database name)
postgresql://postgres:password@splash-db.xxxxx.rds.amazonaws.com

# Correct
postgresql://postgres:password@splash-db.xxxxx.rds.amazonaws.com:5432/splash
```