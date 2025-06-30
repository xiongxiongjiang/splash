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
- Using Supabase for data storage and authentication
- Configure Supabase credentials in environment variables

## Project Structure
```
backend/
├── clients/         # External API clients
│   ├── __init__.py
│   ├── dify_client.py   # Dify API client class
│   └── s3_client.py     # AWS S3 client class
├── services/        # Business logic services
│   ├── __init__.py
│   ├── exceptions.py        # Service layer exceptions
│   └── resume_parse_service.py  # Resume parsing service
├── models/          # SQLModel/Pydantic models
├── admin.py         # Admin interface setup
├── auth.py          # Authentication logic
├── chat.py          # LiteLLM chat completion
├── config.py        # Application configuration
├── database.py      # Database configuration
├── server.py        # Main FastAPI application
├── requirements.txt # Python dependencies
└── Dockerfile       # Docker configuration
```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `DIFY_RESUME_PARSE_API_KEY`: Dify API key for chat completion (optional)
- `AWS_ACCESS_KEY_ID`: AWS Access Key ID for S3 uploads (optional)
- `AWS_SECRET_ACCESS_KEY`: AWS Secret Access Key for S3 uploads (optional)
- `AWS_REGION`: AWS region for S3 bucket (default: us-east-1)
- `S3_BUCKET_NAME`: S3 bucket name for file uploads (optional)

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
   heroku config:set SUPABASE_URL=your_supabase_url -a your-app-name
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key -a your-app-name
   ```

## 🐛 Troubleshooting

- **Port 8000 in use**: `docker-compose down && docker-compose up`
- **Database errors**: `docker-compose down -v && docker-compose up`
- **Import errors**: Rebuild image `docker-compose build backend`