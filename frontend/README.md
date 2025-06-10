# Splash Frontend - Next.js Application

This is the frontend service for Splash, built with Next.js 14+ and TypeScript.

## 🚀 Development

### Using Docker Compose (Recommended)
From the **root** directory:
```bash
docker-compose up
```

The frontend will be available at: http://localhost:3000

### Manual Setup (Without Docker)
<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Environment Variables
Copy `.env.template` to `.env.local` and fill in your values:
```bash
cp .env.template .env.local
```

Then edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

</details>

## 📝 Development Notes

### Available Scripts
```bash
# With Docker
docker-compose exec frontend npm run dev    # Development server
docker-compose exec frontend npm run build  # Production build
docker-compose exec frontend npm run lint   # Run linter

# Testing (when tests are added)
docker-compose exec frontend npm test
```

### Key Features
- **Authentication**: Supabase integration
- **API Integration**: Connects to FastAPI backend
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling

## 🌐 Environment Variables

| Variable | Description | Default (Docker) |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://backend:8000 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Required |

## 🚢 Deployment (Vercel)

1. Push code to GitHub

2. Import project in Vercel:
   - Connect GitHub repository
   - Set root directory to `frontend`
   - Configure environment variables

3. Environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.herokuapp.com
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🐛 Troubleshooting

- **Port 3000 in use**: `docker-compose down && docker-compose up`
- **API connection failed**: Check if backend is running
- **Build errors**: `docker-compose exec frontend rm -rf .next && npm run build`
- **Module not found**: Rebuild image `docker-compose build frontend`