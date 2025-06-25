# Splash Backend Deployment Guide
# Splash 后端部署指南

This guide provides the streamlined deployment process for the Splash backend, using our automated deployment script.

本指南提供了使用自动化部署脚本的 Splash 后端简化部署流程。

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
   - `AmazonRDSFullAccess` (for database setup)
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
   - `AmazonRDSFullAccess`（用于数据库设置）
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

#### Set Up RDS Database (if not done)
#### 设置 RDS 数据库（如果尚未完成）

1. Go to AWS Console → RDS → Create Database
2. Choose PostgreSQL, Free tier template
3. Database name: `splash`, Username: `tally`
4. Note the endpoint for App Runner configuration

1. 前往 AWS 控制台 → RDS → 创建数据库
2. 选择 PostgreSQL，免费套餐模板
3. 数据库名称：`splash`，用户名：`tally`
4. 记录端点用于 App Runner 配置

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
DATABASE_URL=postgresql://tally:PASSWORD@your-rds-endpoint:5432/splash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
LOG_LEVEL=info
```

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
          "DATABASE_URL": "YOUR_DATABASE_URL",
          "ADMIN_USERNAME": "admin",
          "ADMIN_PASSWORD": "YOUR_ADMIN_PASSWORD"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": false
  }'
```

#### Database Connection Issues
#### 数据库连接问题

- Verify RDS security group allows App Runner connections
- Check DATABASE_URL format in App Runner environment variables
- Ensure RDS is in "available" state

- 验证 RDS 安全组允许 App Runner 连接
- 检查 App Runner 环境变量中的 DATABASE_URL 格式
- 确保 RDS 处于"可用"状态

#### ECR Storage Limits
#### ECR 存储限制

The script automatically cleans up old images, but if you hit the 500MB free tier limit:

脚本会自动清理旧镜像，但如果您达到 500MB 免费套餐限制：

```bash
# Manual cleanup of all images
# 手动清理所有镜像
aws ecr list-images --repository-name splash-backend --query 'imageIds[*]' --output json | \
  jq '.[] | select(.imageTag != "latest")' | \
  aws ecr batch-delete-image --repository-name splash-backend --image-ids file:///dev/stdin
```

## Cost Optimization
## 成本优化

### Free Tier Usage
### 免费套餐使用

- **ECR**: 500MB storage (script manages this)
- **App Runner**: Pay per use (~$5-10/month typical)
- **RDS**: Free tier for first 12 months

- **ECR**：500MB 存储（脚本管理）
- **App Runner**：按使用付费（通常约 $5-10/月）
- **RDS**：前 12 个月免费套餐

### Reducing Costs
### 降低成本

- Use smallest App Runner instance size (0.25 vCPU, 0.5 GB RAM)
- Set up auto-scaling with min instances = 1
- Monitor usage through AWS Cost Explorer

- 使用最小的 App Runner 实例大小（0.25 vCPU，0.5 GB RAM）
- 设置自动扩展，最小实例数 = 1
- 通过 AWS Cost Explorer 监控使用情况

## Security Best Practices
## 安全最佳实践

### Environment Variables
### 环境变量

- Never commit secrets to Git
- Use secure passwords for ADMIN_PASSWORD
- Consider AWS Secrets Manager for production

- 永远不要将机密信息提交到 Git
- 为 ADMIN_PASSWORD 使用安全密码
- 考虑在生产环境中使用 AWS Secrets Manager

### Database Security
### 数据库安全

- RDS should not be publicly accessible
- Use security groups to restrict database access to App Runner only
- Enable encryption at rest

- RDS 不应公开访问
- 使用安全组将数据库访问限制为仅 App Runner
- 启用静态加密

### Access Control
### 访问控制

- Use IAM roles with least privilege
- Rotate AWS access keys regularly
- Enable CloudTrail for audit logging

- 使用最小权限的 IAM 角色
- 定期轮换 AWS 访问密钥
- 启用 CloudTrail 进行审计日志记录

## Maintenance
## 维护

### Regular Tasks
### 定期任务

#### Weekly
#### 每周

```bash
# Deploy latest changes
# 部署最新更改
./deploy.sh
```

#### Monthly
#### 每月

```bash
# Check ECR storage usage
# 检查 ECR 存储使用情况
aws ecr describe-repositories --repository-names splash-backend

# Review AWS costs
# 查看 AWS 成本
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### Database Maintenance
### 数据库维护

- Monitor RDS performance metrics
- Set up automated backups (enabled by default)
- Plan for database scaling if needed

- 监控 RDS 性能指标
- 设置自动备份（默认启用）
- 根据需要规划数据库扩展

## Support
## 支持

### Logs and Debugging
### 日志和调试

- App Runner logs: AWS Console → App Runner → Your Service → Logs
- Application metrics: Available in App Runner service dashboard
- Database metrics: RDS console → Your database → Monitoring

- App Runner 日志：AWS 控制台 → App Runner → 您的服务 → 日志
- 应用程序指标：在 App Runner 服务仪表板中可用
- 数据库指标：RDS 控制台 → 您的数据库 → 监控

### Getting Help
### 获取帮助

- AWS documentation: [App Runner User Guide](https://docs.aws.amazon.com/apprunner/)
- Check deploy.sh script for detailed error messages
- Review CloudFormation events if using infrastructure as code

- AWS 文档：[App Runner 用户指南](https://docs.aws.amazon.com/apprunner/)
- 检查 deploy.sh 脚本的详细错误消息
- 如果使用基础设施即代码，请查看 CloudFormation 事件

---

This deployment guide focuses on the stable, automated process using deploy.sh. The script handles all the complexity while providing clear feedback and monitoring capabilities.

本部署指南专注于使用 deploy.sh 的稳定自动化流程。该脚本处理所有复杂性，同时提供清晰的反馈和监控功能。