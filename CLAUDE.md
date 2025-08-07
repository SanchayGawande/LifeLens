# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full Stack Development
```bash
# Install all dependencies
npm run install:all

# Start all services concurrently (backend, frontend, sentiment service)
npm run dev

# Individual service development
npm run dev:backend      # Node.js API on port 3000
npm run dev:frontend     # Expo dev server on port 8081
npm run dev:sentiment    # FastAPI service on port 8000
```

### Testing and Quality
```bash
# Run all tests
npm test

# Individual service testing
npm run test:backend
npm run test:frontend

# Linting
npm run lint
npm run lint:backend
npm run lint:frontend
```

### Build Commands
```bash
# Backend build
npm run build:backend

# Frontend web build
npm run build:frontend

# Mobile builds (requires Expo CLI)
cd frontend && expo build:android
cd frontend && expo build:ios
```

### Environment Setup
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Docker development
docker-compose up -d
```

## Architecture Overview

### Multi-Service Architecture
LifeLens follows a microservices pattern with three main components:

1. **Backend API** (`/backend`): Node.js Express server handling authentication, business logic, and data persistence
2. **Mobile Frontend** (`/frontend`): React Native Expo app for cross-platform mobile experience  
3. **Sentiment Service** (`/services/sentiment`): FastAPI service with Hugging Face ML model for mood analysis

### Data Flow
```
Mobile App → Backend API → Supabase Database
           ↓
           → Sentiment Service (FastAPI) → DistilBERT Model
           ↓
           → OpenRouter API → GPT/Claude Models
```

### Authentication Flow
- Supabase handles user authentication with JWT tokens
- Backend middleware validates tokens on protected routes
- Frontend automatically includes auth headers and handles token refresh
- Database uses Row Level Security (RLS) to enforce user data isolation

### AI Integration
- **Decision Making**: OpenRouter API proxies requests to various AI models (GPT-3.5, Claude, Llama)
- **Mood Analysis**: Local FastAPI service with Hugging Face DistilBERT for sentiment classification
- **Contextual Nudges**: Smart suggestion engine using mood, weather, time, and decision patterns
- **Caching**: Backend implements response caching for AI decisions to reduce API costs

## Database Schema

The Supabase PostgreSQL database consists of:

- **user_profiles**: Extended user data beyond Supabase auth
- **decisions**: AI decision history with context (category, mood, auto-decide flag)
- **moods**: Sentiment analysis results with confidence scores
- **user_stats**: Materialized view for dashboard statistics

All tables implement Row Level Security policies ensuring users can only access their own data.

## Key Configuration Files

### Backend Configuration
- `backend/src/config/supabase.js`: Database client with service role key
- `backend/src/config/openrouter.js`: AI API client singleton with retry logic
- `backend/src/middleware/auth.js`: JWT validation middleware

### Frontend Configuration  
- `frontend/src/services/supabase.js`: Client-side auth with AsyncStorage persistence
- `frontend/src/services/api.js`: Axios client with automatic token injection and refresh
- `frontend/src/services/authStore.js`: Zustand state management for authentication

### Sentiment Service
- `services/sentiment/app/main.py`: FastAPI app with DistilBERT pipeline
- Model loads on startup with CPU inference (configurable for GPU)
- Implements batch processing and confidence thresholding for neutral classification

### Vision Services
- `backend/src/services/googleVisionService.js`: Google Cloud Vision API integration (primary)
- `backend/src/services/openRouterVisionService.js`: Premium vision models (GPT-4V, Claude Vision)
- `backend/src/services/enhancedImageService.js`: Tiered vision analysis with fallbacks
- Provides real image analysis for clothing, food, and electronics categories
- Automatic fallback chain: Google Vision → OpenRouter → Replicate → Basic service

### Nudge Engine
- `frontend/src/components/NudgeEngine.js`: Contextual suggestion system
- `frontend/src/services/weather.js`: OpenWeatherMap API integration with caching
- `frontend/src/config/nudgeRules.json`: Configurable nudge rules and conditions
- Uses mood patterns, weather conditions, time context, and decision history for smart suggestions

## Development Patterns

### API Route Structure
Backend routes follow RESTful conventions:
- `/api/auth/*`: Authentication endpoints
- `/api/decisions/*`: AI decision management
- `/api/moods/*`: Sentiment analysis and trends
- `/api/users/*`: Profile and achievement management

### State Management
- Frontend uses Zustand for lightweight state management
- Authentication state persisted via Supabase client
- API responses cached in React Native components with refresh controls

### Error Handling
- Backend uses centralized error middleware with Winston logging
- Frontend implements axios interceptors for token refresh and error handling
- Sentiment service includes health checks and graceful model loading failures

### Security Implementation
- Rate limiting: 100 requests per 15 minutes per IP
- Input validation using Joi schemas on all endpoints
- CORS and Helmet security headers
- Environment variables for all sensitive configuration

## Deployment Architecture

### Production Services
- **Backend**: Vercel serverless functions with `vercel.json` configuration
- **Frontend**: Expo managed workflow for app store deployment
- **Sentiment Service**: Docker container suitable for Render/Railway/Cloud Run
- **Database**: Supabase managed PostgreSQL with automated backups

### Environment Requirements
- Node.js 18+ for backend
- Python 3.11+ for sentiment service
- Expo CLI for mobile development
- Supabase project with configured RLS policies
- OpenRouter API key for AI model access
- Google Cloud project with Vision API enabled (recommended for best image analysis)
- Google Cloud service account credentials or API key

## Working with AI Features

### Vision API Setup (Google Cloud Vision)
1. **Create Google Cloud Project**:
   ```bash
   # Visit https://console.cloud.google.com/
   # Create new project or select existing one
   ```

2. **Enable Vision API**:
   ```bash
   # In Google Cloud Console:
   # APIs & Services → Library → Vision API → Enable
   ```

3. **Create Service Account**:
   ```bash
   # IAM & Admin → Service Accounts → Create Service Account
   # Grant "Cloud Vision API User" role
   # Create and download JSON key file
   ```

4. **Configure Environment**:
   ```bash
   # Place service account key in backend/google-vision-key.json
   # Update backend/.env:
   GOOGLE_APPLICATION_CREDENTIALS=./google-vision-key.json
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   ```

5. **Test Integration**:
   ```bash
   cd backend && node test-google-vision.js
   ```

### Adding New AI Models
Modify `backend/src/config/openrouter.js` to change the default model or add model selection logic. OpenRouter supports multiple providers through a unified API.

### Sentiment Analysis Customization
The DistilBERT model in `services/sentiment/app/main.py` can be replaced with other Hugging Face models. Update the pipeline initialization and adjust confidence thresholds as needed.

### Image Analysis Workflow
The system uses a tiered approach for image analysis:
1. **Google Vision API** (primary) - Best accuracy for object detection
2. **OpenRouter Vision** (premium users) - GPT-4V, Claude Vision
3. **Replicate API** (fallback) - Low-cost alternative
4. **Basic service** (final fallback) - Simple label-based analysis

### Caching Strategy
AI responses are cached using node-cache with 5-minute TTL. Adjust cache settings in `backend/src/routes/decisions.js` based on cost/freshness requirements.

## Testing Strategy

### Backend Testing
- Jest for unit tests with supertest for API integration tests
- Mock Supabase client for database operations
- Test authentication middleware with sample JWT tokens

### Frontend Testing
- React Native Testing Library for component tests
- Mock API responses for screen integration tests
- Expo testing tools for end-to-end mobile testing

### Sentiment Service Testing
- FastAPI includes automatic OpenAPI documentation at `/docs`
- Use `/health` endpoint to verify model loading
- Test batch processing with various text inputs