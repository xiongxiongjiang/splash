# Local Development Guide
# 本地开发指南

This guide explains how to run the Splash application locally for development.

本指南说明如何在本地运行 Splash 应用程序进行开发。

## Prerequisites
## 前置条件

- Docker and Docker Compose installed
- Git repository cloned locally

- 已安装 Docker 和 Docker Compose
- 已在本地克隆 Git 仓库

## Quick Start - Full Stack
## 快速开始 - 全栈

Run the entire application (frontend + backend + database):

运行整个应用程序（前端 + 后端 + 数据库）：

```bash
# Start all services
# 启动所有服务
docker-compose up

# Or run in background
# 或在后台运行
docker-compose up -d

# View logs
# 查看日志
docker-compose logs -f

# Stop all services
# 停止所有服务
docker-compose down
```

Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Admin Panel: http://localhost:8000/admin

访问地址：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs
- 管理面板：http://localhost:8000/admin

## Frontend-Only Development
## 仅前端开发

When you only need to work on frontend features and connect to a remote backend:

当您只需要开发前端功能并连接到远程后端时：

```bash
# Start only frontend
# 仅启动前端
docker-compose up frontend

# Or run in background
# 或在后台运行
docker-compose up -d frontend
```

Configure the backend URL in `/frontend/.env.local`:

在 `/frontend/.env.local` 中配置后端 URL：

```bash
# Point to remote backend
# 指向远程后端
NEXT_PUBLIC_API_URL=https://your-remote-backend.com

# Or point to local backend running separately
# 或指向单独运行的本地后端
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Alternative: Run frontend without Docker**

**替代方案：不使用 Docker 运行前端**

```bash
cd frontend
npm install
npm run dev
```

## Backend-Only Development
## 仅后端开发

When you only need to work on backend/API features:

当您只需要开发后端/API 功能时：

```bash
# Start backend + database (backend depends on postgres, so both start)
# 启动后端 + 数据库（后端依赖 postgres，所以两者都会启动）
docker-compose up backend

# Or run in background
# 或在后台运行
docker-compose up -d backend
```

This gives you:
- Backend API: http://localhost:8000
- PostgreSQL database: localhost:5432
- Hot reload enabled for backend code changes

这将为您提供：
- 后端 API：http://localhost:8000
- PostgreSQL 数据库：localhost:5432
- 为后端代码更改启用热重载

**Alternative: Run backend without Docker**

**替代方案：不使用 Docker 运行后端**

```bash
# Start only database
# 仅启动数据库
docker-compose up postgres

# Run backend locally
# 本地运行后端
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://splash:splash@localhost:5432/splash"
export GEMINI_API_KEY="your-api-key"
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Development Workflows
## 开发工作流程

### Scenario 1: Full-Stack Development
### 场景 1：全栈开发

Working on both frontend and backend simultaneously:

同时开发前端和后端：

```bash
# Start everything
# 启动所有服务
docker-compose up

# Make changes to code in ./frontend/ or ./backend/
# 在 ./frontend/ 或 ./backend/ 中修改代码

# Changes are automatically reflected (hot reload)
# 更改会自动反映（热重载）
```

### Scenario 2: Frontend Development with Remote Backend
### 场景 2：使用远程后端进行前端开发

Working on UI/UX while using a deployed backend:

在使用已部署的后端时开发 UI/UX：

```bash
# Configure remote backend in frontend/.env.local
# 在 frontend/.env.local 中配置远程后端
echo "NEXT_PUBLIC_API_URL=https://your-deployed-backend.com" > frontend/.env.local

# Start only frontend
# 仅启动前端
docker-compose up frontend
```

### Scenario 3: Backend API Development
### 场景 3：后端 API 开发

Working on API endpoints, database models, or business logic:

开发 API 端点、数据库模型或业务逻辑：

```bash
# Start backend services (includes postgres automatically)
# 启动后端服务（自动包含 postgres）
docker-compose up backend

# Test API with curl or Postman
# 使用 curl 或 Postman 测试 API
curl http://localhost:8000/health

# Use API documentation
# 使用 API 文档
open http://localhost:8000/docs
```

### Scenario 4: Database-Only for External Tools
### 场景 4：仅数据库用于外部工具

Running just PostgreSQL for database work with external tools:

仅运行 PostgreSQL 以便使用外部工具进行数据库工作：

```bash
# Start only database
# 仅启动数据库
docker-compose up postgres

# Connect with psql
# 使用 psql 连接
psql -h localhost -p 5432 -U splash -d splash

# Or use GUI tools like pgAdmin, DBeaver, etc.
# 或使用 GUI 工具如 pgAdmin、DBeaver 等
# Host: localhost, Port: 5432, User: splash, Password: splash, Database: splash
```

## Environment Configuration
## 环境配置

### Frontend Environment Variables
### 前端环境变量

Create `/frontend/.env.local`:

创建 `/frontend/.env.local`：

```bash
# Supabase configuration
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
# 后端 API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development settings
# 开发设置
NODE_ENV=development
```

### Backend Environment Variables
### 后端环境变量

Create `/backend/.env.local` (optional, docker-compose provides defaults):

创建 `/backend/.env.local`（可选，docker-compose 提供默认值）：

```bash
# Database (override docker-compose default)
# 数据库（覆盖 docker-compose 默认值）
DATABASE_URL=postgresql+asyncpg://splash:splash@postgres:5432/splash

# AI Integration
# AI 集成
GEMINI_API_KEY=your-gemini-api-key

# Admin Panel
# 管理面板
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Development
# 开发
LOG_LEVEL=debug
```

## Useful Commands
## 有用的命令

### Docker Management
### Docker 管理

```bash
# View running containers
# 查看运行中的容器
docker ps

# View all compose services status
# 查看所有 compose 服务状态
docker-compose ps

# Restart a specific service
# 重启特定服务
docker-compose restart backend

# View logs for a specific service
# 查看特定服务的日志
docker-compose logs -f frontend

# Remove all containers and volumes (fresh start)
# 删除所有容器和卷（全新开始）
docker-compose down -v

# Rebuild images after dependency changes
# 依赖更改后重建镜像
docker-compose build --no-cache
```

### Database Management
### 数据库管理

```bash
# Access database shell
# 访问数据库 shell
docker-compose exec postgres psql -U splash -d splash

# Backup database
# 备份数据库
docker-compose exec postgres pg_dump -U splash splash > backup.sql

# Restore database
# 恢复数据库
docker-compose exec -T postgres psql -U splash -d splash < backup.sql

# Reset database (delete all data)
# 重置数据库（删除所有数据）
docker-compose down -v
docker-compose up postgres
```

### Development Debugging
### 开发调试

```bash
# SSH into backend container
# SSH 进入后端容器
docker-compose exec backend bash

# SSH into frontend container
# SSH 进入前端容器
docker-compose exec frontend sh

# Check backend health
# 检查后端健康状态
curl http://localhost:8000/health

# View real-time logs
# 查看实时日志
docker-compose logs -f backend frontend
```

## Troubleshooting
## 故障排除

### Common Issues
### 常见问题

#### Port Already in Use
#### 端口已被使用

```bash
# Check what's using port 3000 or 8000
# 检查什么在使用端口 3000 或 8000
lsof -i :3000
lsof -i :8000

# Kill the process or use different ports in docker-compose
# 终止进程或在 docker-compose 中使用不同端口
```

#### Database Connection Issues
#### 数据库连接问题

```bash
# Ensure postgres is running and healthy
# 确保 postgres 正在运行且健康
docker-compose ps
docker-compose logs postgres

# Check if database exists
# 检查数据库是否存在
docker-compose exec postgres psql -U splash -l
```

#### Frontend Not Connecting to Backend
#### 前端无法连接到后端

1. Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
2. Ensure backend is running: `curl http://localhost:8000/health`
3. Check browser network tab for CORS errors

1. 检查 frontend/.env.local 中的 `NEXT_PUBLIC_API_URL`
2. 确保后端正在运行：`curl http://localhost:8000/health`
3. 检查浏览器网络选项卡中的 CORS 错误

#### Hot Reload Not Working
#### 热重载不工作

```bash
# Restart the specific service
# 重启特定服务
docker-compose restart frontend
# or
docker-compose restart backend

# Check file permissions and volume mounts
# 检查文件权限和卷挂载
```

#### Docker Build Failures
#### Docker 构建失败

```bash
# Clean rebuild
# 清理重建
docker-compose build --no-cache

# Remove unused images and containers
# 删除未使用的镜像和容器
docker system prune -a
```

## Performance Tips
## 性能提示

### Faster Development
### 更快的开发

1. **Use .dockerignore**: Ensure node_modules and .next are ignored
2. **Volume Mounting**: Code changes reflect immediately without rebuilds
3. **Parallel Development**: Run frontend and backend separately when needed
4. **Database Persistence**: Use named volumes to persist data between restarts

1. **使用 .dockerignore**：确保忽略 node_modules 和 .next
2. **卷挂载**：代码更改立即反映，无需重建
3. **并行开发**：需要时分别运行前端和后端
4. **数据库持久化**：使用命名卷在重启之间持久化数据

### Resource Management
### 资源管理

```bash
# Limit memory usage for services
# 限制服务的内存使用
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 512M

# Use slim images where possible
# 尽可能使用精简镜像
# Already using alpine versions
```

## IDE Integration
## IDE 集成

### VS Code
For optimal development experience:

为了获得最佳开发体验：

1. Install Docker extension
2. Use Remote-Containers for development inside containers
3. Configure workspace settings for TypeScript and Python

1. 安装 Docker 扩展
2. 使用 Remote-Containers 在容器内开发
3. 为 TypeScript 和 Python 配置工作区设置

### Database Tools
### 数据库工具

Connect to local PostgreSQL:
- Host: localhost
- Port: 5432  
- Username: splash
- Password: splash
- Database: splash

连接到本地 PostgreSQL：
- 主机：localhost
- 端口：5432
- 用户名：splash
- 密码：splash
- 数据库：splash

---

This guide covers the most common local development scenarios. Choose the approach that best fits your current development needs.

本指南涵盖了最常见的本地开发场景。选择最适合您当前开发需求的方法。