# Project Handoff Documentation - Splash Resume Management Platform

## Immediate Action Items

### 1. Database Migration: RDS → Supabase

The current production backend uses AWS RDS (PostgreSQL) for data storage. There's a requirement to migrate to Supabase for better integration with the frontend authentication flow and team workflow preferences. Additionally, for local development, instead of using the current local PostgreSQL container, you should set up Supabase locally to ensure schema synchronization between development and production environments.

当前生产后端使用 AWS RDS (PostgreSQL) 进行数据存储。需要迁移到 Supabase 以更好地与前端认证流程和团队工作流程偏好集成。此外，对于本地开发，应该设置本地 Supabase 而不是使用当前的本地 PostgreSQL 容器，以确保开发和生产环境之间的架构同步。

**Current Setup:**
- Production: AWS RDS PostgreSQL instance
- Local Development: PostgreSQL container in `docker-compose.yml`
- Backend connects to `postgres://splash:splash@postgres:5432/splash` locally

**Migration Requirements:**
- Set up Supabase project for production database
- Set up Supabase locally using Docker (use Supabase CLI with `supabase start`)
- Use Supabase's PostgreSQL database for both local development and production
- Migrate existing RDS schema and data to Supabase instance

**Important Technical Considerations:**

Continue using SQLModel/SQLAlchemy in the backend rather than switching to Supabase's client libraries. This approach maintains type safety, existing model definitions, and familiar ORM patterns. Configure the backend to connect directly to Supabase's PostgreSQL instance using the connection string.

在后端继续使用 SQLModel/SQLAlchemy，而不是切换到 Supabase 的客户端库。这种方法保持了类型安全、现有模型定义和熟悉的 ORM 模式。配置后端直接连接到 Supabase 的 PostgreSQL 实例，使用连接字符串。

**Critical:** Use Supabase's session pooler (port 6543) instead of the direct database connection (port 5432). This is essential because AWS App Runner scales containers up and down frequently, and the session pooler handles connection management much better under these conditions, preventing connection exhaustion.

**关键：** 使用 Supabase 的会话池（端口 6543）而不是直接数据库连接（端口 5432）。这很重要，因为 AWS App Runner 会频繁地扩展和缩减容器，会话池在这些条件下能更好地处理连接管理，防止连接耗尽。

### 2. Waitlist Logic Migration

The current waitlist implementation includes integration with Klaviyo for email marketing and maintains a unified schema across the application. During the database migration, ensure that all existing waitlist entries are preserved, the Klaviyo integration continues to function without interruption, and the unified schema structure remains intact across all components. No breaking changes should be introduced to the waitlist API endpoints, and existing user data integrity must be maintained.

当前的等待列表实现包括与 Klaviyo 的邮件营销集成，并在整个应用程序中维护统一的架构。在数据库迁移期间，确保保留所有现有的等待列表条目，Klaviyo 集成继续正常运行不中断，统一架构结构在所有组件中保持完整。不应对等待列表 API 端点引入破坏性更改，必须维护现有用户数据完整性。

Test the migration thoroughly in a staging environment before applying to production. The waitlist is a critical user-facing feature that directly impacts lead generation and user onboarding.

在应用到生产环境之前，在预发布环境中彻底测试迁移。等待列表是直接影响潜在客户生成和用户引导的关键面向用户功能。

### 3. Klaviyo Email Consent Compliance (GDPR)

The current implementation needs GDPR compliance updates for email consent management. Key requirements include adding explicit email consent collection with proper opt-in mechanisms, updating the Klaviyo API integration to use the "Subscribe Profiles" endpoint instead of just adding users to lists, implementing proper consent status handling (`SUBSCRIBED`, `NEVER_SUBSCRIBED`, `UNSUBSCRIBED`), ensuring consent checkboxes are NOT pre-checked (GDPR requirement), and adding a consent field to the `WaitlistCreate` model with default value of `false`.

当前实现需要针对邮件同意管理的 GDPR 合规性更新。关键要求包括添加明确的邮件同意收集机制和适当的选择加入机制，更新 Klaviyo API 集成以使用"订阅配置文件"端点而不是仅将用户添加到列表中，实现适当的同意状态处理（`SUBSCRIBED`、`NEVER_SUBSCRIBED`、`UNSUBSCRIBED`），确保同意复选框未预先选中（GDPR 要求），以及向 `WaitlistCreate` 模型添加默认值为 `false` 的同意字段。

This is both a legal compliance issue and affects email deliverability rates.

这既是法律合规问题，也影响邮件送达率。

## Project Structure & Development Recommendations

### Monorepo Structure - Strongly Recommended

I strongly recommend maintaining the current monorepo structure rather than splitting into separate repositories. The current setup provides significant development and operational benefits through unified development environment, shared configuration, easier code reviews, simplified dependency management, better developer experience, and integrated testing capabilities.

我强烈建议保持当前的 monorepo 结构，而不是拆分为单独的仓库。当前设置通过统一开发环境、共享配置、更轻松的代码审查、简化的依赖管理、更好的开发者体验和集成测试功能提供了显著的开发和运营优势。

**Key Advantages:**
- **Unified Development Environment:** Docker Compose allows running the entire stack with a single `docker-compose up` command
- **Shared Configuration:** Environment variables, build scripts, and deployment configs are centralized and consistent
- **Easier Code Reviews:** Changes across frontend and backend can be reviewed together, ensuring full-stack consistency
- **Simplified Dependency Management:** No need to coordinate versions across multiple repositories
- **Better Developer Experience:** New team members can get the entire project running in minutes
- **Integrated Testing:** End-to-end tests can be run across the full stack easily

**主要优势：**
- **统一开发环境：** Docker Compose 允许用单个 `docker-compose up` 命令运行整个技术栈
- **共享配置：** 环境变量、构建脚本和部署配置都是集中和一致的
- **更轻松的代码审查：** 前端和后端的更改可以一起审查，确保全栈一致性
- **简化依赖管理：** 无需在多个仓库之间协调版本
- **更好的开发者体验：** 新团队成员可以在几分钟内运行整个项目
- **集成测试：** 可以轻松地在整个技术栈上运行端到端测试

The project includes a comprehensive development guide that documents the setup process, common tasks, and troubleshooting steps. This documentation investment and the established workflows would be lost if splitting the repositories.

项目包含一个全面的开发指南，记录了设置过程、常见任务和故障排除步骤。如果拆分仓库，这些文档投资和已建立的工作流程将会丢失。

### Backend Deployment Strategy

The backend is configured for AWS App Runner deployment with several important considerations including container scaling, environment variable management, health checks, and MCP integration for AI tool connectivity.

后端配置为 AWS App Runner 部署，需要考虑几个重要因素，包括容器扩展、环境变量管理、健康检查和用于 AI 工具连接的 MCP 集成。

**Architecture Considerations:**
- **Container Scaling:** App Runner automatically scales based on traffic, but this affects database connections (hence the Supabase session pooler requirement)
- **Environment Variables:** All configuration is externalized through environment variables for security and flexibility
- **Health Checks:** Proper health check endpoints are implemented at `/health` for reliable deployments
- **MCP Integration:** The backend exposes MCP (Model Context Protocol) endpoints at `/mcp` for AI tool integration

**架构考虑因素：**
- **容器扩展：** App Runner 根据流量自动扩展，但这会影响数据库连接（因此需要 Supabase 会话池）
- **环境变量：** 所有配置都通过环境变量外部化，以确保安全性和灵活性
- **健康检查：** 在 `/health` 实现了适当的健康检查端点，以确保可靠的部署
- **MCP 集成：** 后端在 `/mcp` 公开 MCP（模型上下文协议）端点，用于 AI 工具集成

**Deployment Documentation:**
The deployment configuration is documented in `deployment_guide.md` with step-by-step instructions. Ensure the new team reviews this thoroughly before making any infrastructure changes. The deployment process is optimized for the current architecture and scaling requirements.

**部署文档：**
部署配置在 `deployment_guide.md` 中有详细记录，包含分步说明。确保新团队在进行任何基础设施更改之前彻底审查此文档。部署过程针对当前架构和扩展要求进行了优化。

## fixes, Handoff and things to consider
- oauth redirects fix
- liteLLM migration
- demo
- consider
  - register tools against backend 



**Key Files for Onboarding:**
- `README.md` - Main project overview and setup
- `DEPLOYMENT.md` - Production deployment guide
- `backend/demo/README.md` - MCP integration and testing
- `docs/api.md` - API documentation and workflow examples

**入职关键文件：**
- `README.md` - 主要项目概述和设置
- `DEPLOYMENT.md` - 生产部署指南
- `backend/demo/README.md` - MCP 集成和测试
- `docs/api.md` - API 文档和工作流程示例 