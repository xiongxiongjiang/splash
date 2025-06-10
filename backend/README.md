# Splash Backend - FastAPI Application

This is the backend service for Splash, built with FastAPI and providing both REST API and MCP (Model Context Protocol) endpoints.

## 🚀 Development

### Using Docker Compose (Recommended)
From the **root** directory:
```bash
docker-compose up
```

The backend API will be available at:
- REST API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- MCP Endpoint: http://localhost:8000/mcp

### Manual Setup (Without Docker)
<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Set Up Pre-commit Hooks
```bash
# Install pre-commit hooks for code formatting
pre-commit install

# Run formatter manually
black .
```

#### 4. Run the Application
```bash
python server.py
```

</details>

## 📝 Development Notes

### Code Formatting
- Black formatter runs automatically on git commits
- Manual formatting: `docker-compose exec backend black .`

### Running Tests
```bash
docker-compose exec backend pytest
```

### Database
- SQLite database persisted in Docker volume
- Reset database: `docker-compose down -v && docker-compose up`

## Project Structure
```
backend/
├── models/          # SQLModel/Pydantic models
├── admin.py         # Admin interface setup
├── auth.py          # Authentication logic
├── database.py      # Database configuration
├── server.py        # Main FastAPI application
├── requirements.txt # Python dependencies
└── Dockerfile       # Docker configuration
```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables
- `DATABASE_URL`: SQLite connection string (default: `sqlite:///./resume_db.sqlite`)
- `ADMIN_USERNAME`: Admin panel username (default: configured in code)
- `ADMIN_PASSWORD`: Admin panel password (default: configured in code)

## 🚢 Deployment (Heroku)

1. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Deploy using Heroku container registry:
   ```bash
   cd backend
   heroku container:push web -a your-app-name
   heroku container:release web -a your-app-name
   ```

3. Set environment variables:
   ```bash
   heroku config:set DATABASE_URL=your_postgres_url -a your-app-name
   ```

## 🐛 Troubleshooting

- **Port 8000 in use**: `docker-compose down && docker-compose up`
- **Database errors**: `docker-compose down -v && docker-compose up`
- **Import errors**: Rebuild image `docker-compose build backend`