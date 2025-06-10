# Splash - Resume Management Platform

A full-stack application with FastAPI backend and Next.js frontend for resume management.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system
  - [Install Docker Desktop](https://docs.docker.com/get-docker/) (includes Docker Compose)
  - Verify installation: `docker --version` and `docker-compose --version`

### Docker Setup Explained

**What is Docker Compose?**
Docker Compose is a tool for defining and running multi-container Docker applications. It uses a YAML file to configure your application's services, then with a single command, you create and start all services.

**Our Setup:**
- `docker-compose.yml`: Development configuration with hot-reload
- Each service (frontend/backend) runs in its own container
- Containers communicate via internal Docker network

### Run Everything
```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Stop Services
```bash
docker-compose down
```

## 📁 Project Structure
```
splash/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
└── docker-compose.yml
```

## 🛠️ Development

### Making Changes
- Code changes are automatically reflected (hot reload enabled)
- Backend: Edit files in `backend/` - FastAPI auto-reloads
- Frontend: Edit files in `frontend/` - Next.js hot-reloads

### Viewing Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Rebuilding Containers
```bash
# Rebuild after dependency changes
docker-compose build

# Rebuild and start
docker-compose up --build
```

### Running Tests
```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

### Database Access
SQLite database is persisted in Docker volume. To reset:
```bash
docker-compose down -v  # Remove volumes
docker-compose up       # Recreate fresh database
```

## 🚢 Deployment

### Production Deployment

This monorepo deploys frontend and backend as separate services:
- **Backend**: Heroku (uses `backend/Dockerfile`)
  - Only the backend directory is deployed
  - Uses production Dockerfile configuration
- **Frontend**: Vercel (uses Next.js build)
  - Only the frontend directory is deployed
  - Vercel builds from source

**Note**: The regular `docker-compose.yml` is only for local development. For production, each service deploys independently to its respective platform.

See individual README files in `backend/` and `frontend/` for specific deployment instructions.

## 🔧 Manual Setup (Optional)

If you prefer not to use Docker, see:
- [Backend Manual Setup](./backend/README.md#manual-setup-without-docker)
- [Frontend Manual Setup](./frontend/README.md#manual-setup-without-docker) 
