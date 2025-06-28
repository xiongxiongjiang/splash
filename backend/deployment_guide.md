# Splash Backend Deployment Guide
# Splash 后端部署指南

This guide provides the streamlined deployment process for the Splash backend using Supabase and our automated deployment script.

本指南提供了使用 Supabase 和自动化部署脚本的 Splash 后端简化部署流程。

## Quick Deployment
## 快速部署

```bash
# 1. Configure AWS CLI (one-time setup)
# 1. 配置 AWS CLI（一次性设置）
aws configure

# 2. Navigate to backend directory
# 2. 进入后端目录
cd backend

# 3. Run deployment script
# 3. 运行部署脚本
./deploy.sh
```

The deployment script handles:
- Docker image building for App Runner (x86_64 architecture)
- ECR repository management and cleanup
- App Runner service updates
- Deployment monitoring

部署脚本处理以下任务：
- 为 App Runner 构建 Docker 镜像（x86_64 架构）
- ECR 仓库管理和清理
- App Runner 服务更新
- 部署监控

## Prerequisites
## 前置条件

### 1. AWS CLI Setup
### 1. AWS CLI 设置

Install AWS CLI:

安装 AWS CLI：

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Windows
# Download and run: https://awscli.amazonaws.com/AWSCLIV2.msi
# 下载并运行：https://awscli.amazonaws.com/AWSCLIV2.msi
```

### 2. Create AWS Access Keys
### 2. 创建 AWS 访问密钥

You need programmatic access keys for AWS CLI:

您需要为 AWS CLI 创建程序化访问密钥：

1. Go to AWS Console → IAM → Users → Create User
2. User name: `splash-deploy`
3. Attach policies directly:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AWSAppRunnerFullAccess`
4. Create user, then go to Security credentials tab
5. Click "Create access key" → "Command Line Interface (CLI)"
6. **Save these credentials securely**:
   - Access Key ID (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - Secret Access Key (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

1. 前往 AWS 控制台 → IAM → 用户 → 创建用户
2. 用户名：`splash-deploy`
3. 直接附加策略：
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AWSAppRunnerFullAccess`
4. 创建用户后，进入安全凭证选项卡
5. 点击"创建访问密钥" → "命令行界面 (CLI)"
6. **安全保存这些凭证**：
   - 访问密钥 ID（例如：`AKIAIOSFODNN7EXAMPLE`）
   - 秘密访问密钥（例如：`wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`）

### 3. Configure AWS CLI
### 3. 配置 AWS CLI

Configure with your access keys:

使用您的访问密钥进行配置：

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID**: Your access key from step 2
- **AWS Secret Access Key**: Your secret key from step 2
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

出现提示时，输入：
- **AWS 访问密钥 ID**：步骤 2 中的访问密钥
- **AWS 秘密访问密钥**：步骤 2 中的秘密密钥
- **默认区域**：`us-east-1`（或您偏好的区域）
- **默认输出格式**：`json`

Test configuration:

测试配置：

```bash
aws sts get-caller-identity
# Should show your account details
# 应该显示您的账户详情
```

### 4. Docker Installation
### 4. Docker 安装

Ensure Docker is installed and running:

确保 Docker 已安装并正在运行：

```bash
docker --version
```

### 5. Initial Infrastructure Setup
### 5. 初始基础设施设置

These are one-time setup steps:

这些是一次性设置步骤：

#### Create ECR Repository
#### 创建 ECR 仓库

```bash
aws ecr create-repository --repository-name splash-backend
```

#### Set Up Supabase Project (if not done)
#### 设置 Supabase 项目（如果尚未完成）

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note down your project credentials:
   - Project URL (SUPABASE_URL): Found in Project Settings → API
   - Service role key (SUPABASE_SERVICE_ROLE_KEY): Found in Project Settings → API
   - JWT secret (SUPABASE_JWT_SECRET): Found in Project Settings → API → JWT Settings
4. Run the database migration in SQL Editor

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 记录您的项目凭证：
   - 项目 URL (SUPABASE_URL)：在项目设置 → API 中找到
   - 服务角色密钥 (SUPABASE_SERVICE_ROLE_KEY)：在项目设置 → API 中找到
   - JWT 密钥 (SUPABASE_JWT_SECRET)：在项目设置 → API → JWT 设置中找到
4. 在 SQL 编辑器中运行数据库迁移

#### Create App Runner Service (first time only)
#### 创建 App Runner 服务（仅首次）

The deployment script will detect if you need to create the service and provide the exact command.

部署脚本会检测是否需要创建服务并提供确切的命令。

## Deployment Process
## 部署流程

### Understanding deploy.sh
### 理解 deploy.sh

The deployment script performs these steps:

部署脚本执行以下步骤：

1. **AWS Authentication Check**: Verifies AWS CLI is configured
2. **ECR Login**: Authenticates Docker with your ECR registry
3. **Image Build**: Creates x86_64 Docker image for App Runner
4. **Image Push**: Uploads to ECR with automatic tagging
5. **Cleanup**: Removes old untagged images to stay within free tier limits
6. **Service Update**: Updates App Runner service with new image
7. **Deployment Trigger**: Initiates deployment and provides monitoring links

1. **AWS 身份验证检查**：验证 AWS CLI 是否已配置
2. **ECR 登录**：使用您的 ECR 仓库验证 Docker
3. **镜像构建**：为 App Runner 创建 x86_64 Docker 镜像
4. **镜像推送**：上传到 ECR 并自动标记
5. **清理**：删除旧的未标记镜像以保持在免费套餐限制内
6. **服务更新**：使用新镜像更新 App Runner 服务
7. **部署触发**：启动部署并提供监控链接

### Running the Deployment
### 运行部署

```bash
cd backend
./deploy.sh
```

Expected output:

预期输出：

```
🚀 Starting Splash Backend Deployment...

📋 Deployment Configuration:
   AWS Account: 123456789012
   Region: us-east-1
   ECR Repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/splash-backend

1️⃣ Logging into ECR...
2️⃣ Building Docker image for x86_64...
3️⃣ Tagging image for ECR...
4️⃣ Pushing image to ECR...
5️⃣ Cleaning up untagged images in ECR...
6️⃣ Updating App Runner service...
   ✅ Service update initiated
   ✅ Deployment started with Operation ID: abc123

   📊 Monitor deployment progress at:
   https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services/tally

   🌐 Service URL: https://xyz.us-east-1.awsapprunner.com
   📚 API Docs: https://xyz.us-east-1.awsapprunner.com/docs
   🏥 Health Check: https://xyz.us-east-1.awsapprunner.com/health

✅ Deployment script completed!
```

## Environment Configuration
## 环境配置

### App Runner Environment Variables
### App Runner 环境变量

Set these in the App Runner console (not in code):

在 App Runner 控制台中设置这些变量（不在代码中）：

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
LOG_LEVEL=info
```

**Required Environment Variables:**

- `SUPABASE_URL`: Your Supabase project URL (found in Project Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for backend operations (found in Project Settings → API)
- `SUPABASE_JWT_SECRET`: JWT secret for token verification (found in Project Settings → API → JWT Settings)

**必需的环境变量：**

- `SUPABASE_URL`: 您的 Supabase 项目 URL（在项目设置 → API 中找到）
- `SUPABASE_SERVICE_ROLE_KEY`: 用于后端操作的服务角色密钥（在项目设置 → API 中找到）
- `SUPABASE_JWT_SECRET`: 用于令牌验证的 JWT 密钥（在项目设置 → API → JWT 设置中找到）

**Security Note**: Never commit these values to Git. Set them directly in the AWS console.

**安全说明**：永远不要将这些值提交到 Git。直接在 AWS 控制台中设置。

## Monitoring Deployment
## 监控部署

### Check Deployment Status
### 检查部署状态

```bash
# Monitor through AWS console link provided by deploy.sh
# Or use CLI:
# 通过 deploy.sh 提供的 AWS 控制台链接监控
# 或使用 CLI：
aws apprunner list-operations --service-arn YOUR_SERVICE_ARN
```

### Test Deployed Service
### 测试已部署的服务

```bash
# Health check
# 健康检查
curl https://your-app-url/health

# API documentation
# API 文档
open https://your-app-url/docs

# Admin panel
# 管理面板
open https://your-app-url/admin
```

## Troubleshooting
## 故障排除

### Common Issues
### 常见问题

#### Deploy Script Fails
#### 部署脚本失败

```bash
# Check AWS credentials
# 检查 AWS 凭证
aws sts get-caller-identity

# Verify Docker is running
# 验证 Docker 是否运行
docker info

# Check repository exists
# 检查仓库是否存在
aws ecr describe-repositories --repository-names splash-backend
```

#### App Runner Service Not Found
#### 找不到 App Runner 服务

If this is your first deployment, create the App Runner service:

如果这是您的首次部署，请创建 App Runner 服务：

```bash
# The deploy.sh script will show you the exact command needed
# Example:
# deploy.sh 脚本会显示需要的确切命令
# 示例：
aws apprunner create-service \
  --service-name 'tally' \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/splash-backend:latest",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "SUPABASE_URL": "https://your-project-id.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY",
          "SUPABASE_JWT_SECRET": "YOUR_SUPABASE_JWT_SECRET"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": false
  }'
```

#### Database Connection Issues
#### 数据库连接问题

- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correctly set in App Runner environment variables
- Check Supabase project status in dashboard
- Ensure database tables are created via migration

- 验证 App Runner 环境变量中正确设置了 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
- 在仪表板中检查 Supabase 项目状态
- 确保通过迁移创建了数据库表

#### ECR Storage Limits

The script automatically cleans up old images, but if you hit the 500MB free tier limit:

```bash
# Manual cleanup of all images
aws ecr list-images --repository-name splash-backend --query 'imageIds[*]' --output json | \
  jq '.[] | select(.imageTag != "latest")' | \
  aws ecr batch-delete-image --repository-name splash-backend --image-ids file:///dev/stdin
```

## Cost Optimization

### Free Tier Usage

- **ECR**: 500MB storage (script manages this)
- **App Runner**: Pay per use (~$5-10/month typical)
- **Supabase**: Free tier with generous limits

### Reducing Costs

- Use smallest App Runner instance size (0.25 vCPU, 0.5 GB RAM)
- Set up auto-scaling with min instances = 1
- Monitor usage through AWS Cost Explorer and Supabase dashboard

## Security Best Practices

### Environment Variables

- Never commit secrets to Git
- Use secure service role keys for SUPABASE_SERVICE_ROLE_KEY
- Consider AWS Secrets Manager for production

### Database Security

- Supabase handles database security and encryption
- Use Row Level Security (RLS) policies in Supabase
- Rotate service role keys regularly

### Access Control

- Use IAM roles with least privilege
- Rotate AWS access keys regularly
- Enable CloudTrail for audit logging

## Maintenance

### Regular Tasks

#### Weekly

```bash
# Deploy latest changes
./deploy.sh
```

#### Monthly

```bash
# Check ECR storage usage
aws ecr describe-repositories --repository-names splash-backend

# Review AWS costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### Database Maintenance

- Monitor Supabase dashboard metrics
- Database backups are handled automatically by Supabase
- Plan for scaling using Supabase's infrastructure

## Support

### Logs and Debugging

- App Runner logs: AWS Console → App Runner → Your Service → Logs
- Application metrics: Available in App Runner service dashboard
- Database metrics: Supabase Dashboard → Your Project → Database

### Getting Help

- AWS documentation: [App Runner User Guide](https://docs.aws.amazon.com/apprunner/)
- Check deploy.sh script for detailed error messages
- Review CloudFormation events if using infrastructure as code

---

This deployment guide focuses on the stable, automated process using deploy.sh. The script handles all the complexity while providing clear feedback and monitoring capabilities.