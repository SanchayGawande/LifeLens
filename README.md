# LifeLens - AI-Powered Daily Decision Assistant

LifeLens is an AI-powered mobile app that helps users make everyday choices like what to eat, wear, or do next. It uses GPT-based reasoning, mood detection from text, and gamified auto-decision features to reduce decision fatigue.

## 🏗️ Architecture

- **Frontend**: mobile-first interface in Vue.js (cross-platform mobile app)
- **Backend**: Node.js with Express (RESTful API)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (email/password)
- **AI Decision Making**: OpenRouter API (GPT-3.5/Claude access)
- **Sentiment Analysis**: FastAPI with Hugging Face DistilBERT
- **Deployment**: Ready for Vercel (backend) and Expo Go (mobile)

## 📁 Project Structure

```
LifeLens/
├── frontend/                 # React Native Expo app
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API clients and auth
│   │   └── utils/           # Helper utilities
│   └── package.json
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   └── services/        # Business logic
│   └── package.json
├── services/
│   └── sentiment/           # FastAPI sentiment service
│       ├── app/
│       └── Dockerfile
├── schema.sql               # Supabase database schema
├── docker-compose.yml       # Local development setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account
- OpenRouter API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd LifeLens
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL commands from `schema.sql` in your Supabase SQL editor
3. Get your project URL and service key from project settings

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase and OpenRouter credentials
npm run dev
```

### 4. Sentiment Service Setup

```bash
cd services/sentiment
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 5. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase public URL and anon key
npm start
```

### 6. Using Docker (Alternative)

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your credentials

# Start all services
docker-compose up -d
```

## 🔧 Environment Configuration

### Backend (.env)
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
AI_MODEL=openai/gpt-3.5-turbo
SENTIMENT_SERVICE_URL=http://localhost:8000
```

### Frontend (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 📱 Features

### Core Features
- **AI Decision Assistant**: Get personalized recommendations for daily choices
- **Auto-Decide Mode**: Let AI make the final choice to reduce decision fatigue
- **Mood Tracking**: Analyze sentiment from text input with visual trends
- **Decision History**: Track all decisions with categorization and search
- **Gamification**: Achievements, levels, and streaks to encourage usage

### Screens
- **DecisionSnap**: Main decision-making interface with AI integration
- **Mood Tracker**: Sentiment analysis with mood trends and recommendations
- **History**: Decision history with filtering and statistics
- **Profile**: User achievements, settings, and account management

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/refresh` - Refresh access token

#### Decisions
- `POST /api/decisions/decide` - Get AI decision recommendation
- `GET /api/decisions/history` - Get decision history with filtering
- `GET /api/decisions/stats` - Get decision statistics

#### Moods
- `POST /api/moods/analyze` - Analyze mood from text
- `GET /api/moods/history` - Get mood tracking history
- `GET /api/moods/trends` - Get mood trends and analytics

#### Users
- `GET /api/users/profile` - Get user profile and stats
- `PUT /api/users/profile` - Update user profile and preferences
- `GET /api/users/achievements` - Get gamification achievements

## 🚀 Deployment

### Backend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. In the backend directory:
```bash
vercel
# Follow the prompts
# Add environment variables in Vercel dashboard
```

### Frontend Deployment (Expo)

1. Build for production:
```bash
cd frontend
expo build:android  # or build:ios
```

2. Submit to app stores or use Expo Go for development

### Sentiment Service Deployment (Render/Railway)

1. Connect your repository to Render or Railway
2. Configure build command: `pip install -r requirements.txt`
3. Configure start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking (if using TypeScript)
npm run type-check
```

### Database Migrations

When updating the database schema:
1. Update `schema.sql`
2. Run the new SQL commands in Supabase SQL editor
3. Test with the application

## 🤖 AI Integration

### OpenRouter Configuration
The app uses OpenRouter for AI decision making. Supported models:
- `openai/gpt-3.5-turbo` (default)
- `anthropic/claude-3-haiku`
- `meta-llama/llama-2-70b-chat`

### Sentiment Analysis
Uses Hugging Face's `distilbert-base-uncased-finetuned-sst-2-english` model for mood detection:
- Processes text up to 512 characters
- Returns positive/negative/neutral classification
- Includes confidence scores for each sentiment

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- JWT token authentication with Supabase
- API rate limiting (100 requests per 15 minutes)
- Input validation with Joi schemas
- CORS protection and Helmet security headers

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@lifelens.app or create an issue in this repository.
