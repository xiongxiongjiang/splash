# Splash - Resume Management Platform

A full-stack application designed to streamline the job application process by managing resumes, analyzing job descriptions, and automating personalized outreach.

## 🏗️ Architecture

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, and Supabase authentication
- **Backend**: FastAPI with Supabase database, providing REST API and MCP (Model Context Protocol) endpoints
- **Infrastructure**: Docker Compose for local development, deploys to AWS App Runner (backend) and Vercel (frontend)

## ✨ Key Features

1. **Resume Management**: Upload and manage multiple resume versions
2. **LinkedIn Integration**: Save and analyze LinkedIn profiles
3. **Job Description Analysis**: AI-powered JD analysis with personalized recommendations
4. **Content Generation**: Automated generation of cover letters and application materials
5. **Outreach Automation**: Personalized message generation and email sending
6. **Dashboard Analytics**: Track application progress and success metrics

## 🚀 Quick Start

For detailed local development instructions, see [Local Development Guide](./local_dev_guide.md).

```bash
# Start all services
docker-compose up

# Access points:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Documentation: http://localhost:8000/docs
```

## 📁 Project Structure
```
splash/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
├── docs/            # API design and documentation
└── docker-compose.yml
```

## 🚢 Deployment

This monorepo deploys frontend and backend as separate services:

- **Backend**: AWS App Runner with automated deployment
  - See [Backend Deployment Guide](./backend/deployment_guide.md)
  - Uses `./backend/deploy.sh` script for streamlined deployment
- **Frontend**: Vercel (Next.js)
  - Run `vercel` in the frontend directory

## 🔧 Manual Setup (Optional)

For development without Docker, see [Local Development Guide](./local_dev_guide.md). 

