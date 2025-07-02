# Splash - Resume Management Platform

## Project Overview
Splash is a full-stack application designed to streamline the job application process by managing resumes, analyzing job descriptions, and automating personalized outreach.

## Architecture
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, and Supabase authentication
- **Backend**: FastAPI with SQLite database, providing REST API and MCP (Model Context Protocol) endpoints
- **Infrastructure**: Docker Compose for local development, deploys to Heroku (backend) and Vercel (frontend)

## Key Features
1. **Resume Management**: Upload and manage multiple resume versions
2. **LinkedIn Integration**: Save and analyze LinkedIn profiles
3. **Job Description Analysis**: AI-powered JD analysis with personalized recommendations
4. **Content Generation**: Automated generation of cover letters and application materials
5. **Outreach Automation**: Personalized message generation and email sending
6. **Dashboard Analytics**: Track application progress and success metrics

## Development Setup
```bash
# 1. Clone and navigate to project
cd splash

# 2. Set up frontend environment
cd frontend
cp .env.template .env.local
# Edit .env.local with Supabase credentials
cd ..

# 3. Start all services with Docker
docker-compose up
```

Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Design Status
The API design in `/docs/api.md` outlines the complete workflow but is marked as WIP. Current implementation status:
- ✅ Basic FastAPI server setup
- ✅ SQLite database with SQLModel
- ✅ Admin interface with authentication
- ✅ Docker configuration
- ⏳ API endpoints need implementation
- ⏳ Frontend pages need to be built

## Database Models
Located in `/backend/models/`:
- `user.py`: User authentication and profile
- `resume.py`: Resume storage and metadata

## Frontend Structure
- `/src/app/`: Next.js app router pages
  - `login/`: Authentication page
  - `dashboard/`: Main application dashboard
  - `auth/callback/`: Supabase auth callback
- `/src/lib/`: Utilities
  - `supabase.ts`: Supabase client configuration
  - `api.ts`: Backend API client

## Testing Commands
```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests (when implemented)
docker-compose exec frontend npm test

# Linting
docker-compose exec frontend npm run lint
docker-compose exec backend black .
```

## Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### Backend
- `DATABASE_URL`: SQLite connection string
- `ADMIN_USERNAME`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password

## Current State
The project has the infrastructure set up but needs the core functionality implemented:
1. Backend API endpoints from the design doc
2. Frontend UI components and pages
3. Integration between frontend and backend
4. AI/LLM integration for content analysis and generation

## Next Steps
1. Implement core API endpoints starting with file upload and resume management
2. Build frontend components for the main workflow
3. Add AI integration for JD analysis and content generation
4. Implement the decision-making and outreach features
5. Create comprehensive dashboard analytics

## Important Notes
- The MCP integration uses `fastapi_mcp` to auto-convert REST endpoints to MCP tools
- Authentication is handled by Supabase on the frontend
- The backend has a separate admin interface for data management
- when you make a commit, do not mention it's coauthored by you