# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ONTHEGO is an AI-powered educational platform with a Django REST backend and Next.js 14 frontend. The platform features real-time WebSocket updates, gamification (XP, levels, streaks, achievements), course management, and interactive learning with quizzes.

## Tech Stack

**Backend:**
- Django 5.2.8 with Django REST Framework
- PostgreSQL database
- Redis for caching and WebSocket channel layers
- Channels + Daphne for WebSocket/ASGI support
- JWT authentication (djangorestframework-simplejwt)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS with custom neon theme
- Zustand for state management
- WebSocket client for real-time updates

## Critical: WebSocket Server Setup

**IMPORTANT:** The backend MUST be run with Daphne (ASGI server), NOT Django's `runserver`.

### Starting the Backend

1. **Start Redis first** (required for WebSocket):
   ```bash
   cd Redis
   redis-server.exe
   ```

2. **Start backend with Daphne**:
   ```bash
   cd backend
   start_server.bat
   ```

   Or manually:
   ```bash
   cd backend
   venv\Scripts\activate
   daphne -b 127.0.0.1 -p 8000 onthego.asgi:application
   ```

### Why Daphne is Required

- Standard `python manage.py runserver` does NOT support WebSocket connections
- The app uses Django Channels with Redis backend for real-time features
- WebSocket endpoints are defined in `backend/onthego/routing.py`
- ASGI application is configured in `backend/onthego/asgi.py`

## Common Development Commands

### Backend

```bash
# Navigate to backend
cd backend

# Activate virtual environment
venv\Scripts\activate

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Run development server with WebSocket support (USE THIS)
daphne -b 127.0.0.1 -p 8000 onthego.asgi:application

# Don't use this (no WebSocket support):
# python manage.py runserver

# Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test
```

### Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

## Architecture

### Backend App Structure

The Django backend is organized into modular apps in `backend/apps/`:

- **users** - Custom user model, authentication, JWT endpoints
- **courses** - Course, Module, Lesson, Quiz, Question models
- **learning** - Enrollments, LessonProgress, QuizAttempt, Flashcards
- **gamification** - UserProfile (XP/levels), Achievement, DailyTask, FocusSession
- **analytics** - DailyActivity, UserActivity tracking
- **notifications** - Real-time notifications system
- **messaging** - Chat system with WebSocket support

### WebSocket Architecture

**Routing (`backend/onthego/routing.py`):**
- Defines all WebSocket URL patterns
- Connects URLs to Consumer classes

**Consumers (`backend/apps/*/consumers.py`):**
- Handle WebSocket connections and messages
- Organized by app (gamification, learning, messaging, notifications)

**Key WebSocket endpoints:**
- `ws://localhost:8000/ws/dashboard/` - Dashboard updates
- `ws://localhost:8000/ws/progress/` - Learning progress updates
- `ws://localhost:8000/ws/leaderboard/` - Leaderboard updates
- `ws://localhost:8000/ws/achievements/` - Achievement unlocks
- `ws://localhost:8000/ws/streak/` - Streak notifications
- `ws://localhost:8000/ws/notifications/` - Real-time notifications
- `ws://localhost:8000/ws/chat/<room_name>/` - Chat rooms

**Signal-Based Updates:**
- Django signals in `apps/gamification/signals.py` trigger WebSocket broadcasts
- When lessons complete, XP is awarded and sent via WebSocket to connected clients
- Signals are registered in `apps/gamification/apps.py` ready() method

### Frontend Architecture

**App Router Structure (`frontend/app/`):**
- `page.tsx` - Landing page
- `login/`, `register/` - Authentication pages
- `courses/` - Course catalog and course detail pages
- `courses/[slug]/[lessonId]/` - Individual lesson pages
- `dashboard/` - User dashboard with gamification
- `profile/` - User profile page

**State Management:**
- `frontend/lib/store/authStore.ts` - Zustand store for authentication
- JWT tokens stored in localStorage
- API client in `frontend/lib/api/client.ts` handles token refresh

**WebSocket Client (`frontend/lib/websocket.ts`):**
- Singleton WebSocketService class
- Auto-reconnection with exponential backoff
- Token-based authentication via query params
- Helper functions: `connectDashboard()`, `connectProgress()`, etc.

### API Structure

**URL Configuration:**
- Main URLs: `backend/onthego/urls.py`
- App-specific URLs: `backend/apps/*/urls.py`
- All API endpoints prefixed with `/api/`

**Key Endpoints:**
- `/api/users/` - Auth, registration, profile
- `/api/courses/` - Course catalog, details
- `/api/learning/` - Enrollments, progress
- `/api/gamification/` - XP, achievements, leaderboard
- `/api/analytics/` - Activity tracking
- `/api/notifications/` - Notifications

**API Documentation:**
- Swagger UI: http://localhost:8000/api/docs/
- Schema: http://localhost:8000/api/schema/

## Database Models

### Gamification System

**UserProfile** (`apps.gamification.models.UserProfile`):
- Extends User with `xp`, `level`, `streak`, `longest_streak`
- `add_xp(amount)` - Adds XP and handles level-ups (2000 XP per level)
- `update_streak()` - Updates daily streak based on activity

**Achievement** - Awarded for milestones (learning, streaks, quiz completion)
**DailyTask** - Daily challenges with XP rewards
**FocusSession** - Pomodoro-style focus tracking

### Course System

**Course** → **Module** → **Lesson** → **Quiz** → **Question**

- Courses have difficulty levels (beginner/intermediate/advanced)
- Lessons support multiple content types (video, text, audio, quiz, practice)
- Quiz questions support single/multiple choice, true/false, text answers

### Learning System

**Enrollment** - Links users to courses they're enrolled in
**LessonProgress** - Tracks completion, time spent per lesson
**QuizAttempt** - Records quiz submissions and scores

## Configuration

### Environment Variables

**Backend** (`.env` in `backend/`):
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/onthego_db
REDIS_URL=redis://localhost:6379/2
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Frontend** (`.env.local` in `frontend/`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
```

### Settings Files

- Main settings: `backend/onthego/settings.py`
- `ASGI_APPLICATION = 'onthego.asgi.application'` - Required for WebSocket
- `CHANNEL_LAYERS` - Redis configuration for Channels (DB 2)
- `INSTALLED_APPS` - **daphne MUST be first** for ASGI support
- Custom user model: `AUTH_USER_MODEL = 'users.User'`

## Design System

The frontend uses a **neon cyberpunk theme** with custom Tailwind configuration:

**Colors:**
- Neon pink: `#FF4DFF`
- Neon purple: `#B13CFF`
- Neon blue: `#4DBDFF`
- Dark background: `#0A071B`

**Key Components:**
- `components/ui/` - Reusable UI components with neon styling
- `components/ui/effects/ParticlesBackground.tsx` - Animated background
- Glassmorphism effects via `backdrop-blur`
- Custom animations: `float`, `glow-pulse`, `slide-up`

## Important Patterns

### Signal-Driven WebSocket Updates

When implementing features that need real-time updates:

1. Define signal handler in `apps/*/signals.py`
2. Register signals in `apps.py` ready() method
3. In signal handler, use `channel_layer.group_send()` to broadcast
4. Consumer receives message and sends to WebSocket clients
5. Frontend WebSocket client receives and updates UI

Example flow:
```
User completes lesson → signal fired → XP awarded →
channel_layer.group_send('progress_<user_id>', {...}) →
ProgressConsumer.send_progress_update() →
WebSocket client updates UI
```

### JWT Authentication Flow

1. User logs in via `/api/users/login/`
2. Receive `access` and `refresh` tokens
3. Store in authStore (Zustand)
4. API client adds `Authorization: Bearer <token>` header
5. Auto-refresh on 401 using refresh token
6. WebSocket connections pass token via query param: `?token=<access>`

### Course Enrollment Flow

1. User enrolls: `POST /api/learning/enrollments/` with `course_id`
2. Enrollment created with `status='enrolled'`, `progress_percentage=0`
3. As lessons complete, LessonProgress records created
4. Signals award XP and send WebSocket updates
5. Progress percentage auto-calculated from completed lessons

## Common Pitfalls

1. **Running backend without Daphne** - WebSocket connections will fail
2. **Redis not running** - Channel layer errors, WebSocket won't work
3. **CORS issues** - Ensure frontend URL in `CORS_ALLOWED_ORIGINS`
4. **Signal registration** - Must import signals in `apps.py` ready() method
5. **WebSocket token** - Frontend must have valid JWT token for WS connections
6. **Database encoding** - Ensure PostgreSQL uses UTF-8 for Cyrillic text

## Debugging

### WebSocket Issues

Check console logs:
- Backend: Look for "WebSocket connected", "Sending WebSocket to group" messages
- Frontend: Browser console shows WebSocket connection status

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

Check WebSocket connection in browser DevTools:
- Network tab → WS filter
- Should see ws://127.0.0.1:8000/ws/* connections

### API Issues

- Use `/api/docs/` Swagger UI for testing endpoints
- Check backend console for request logs
- Verify JWT token is valid and not expired
- Ensure user has permissions for protected endpoints

## Development Workflow

1. Start Redis server
2. Start backend with Daphne (not runserver)
3. Start frontend dev server
4. Access at http://localhost:3000
5. API at http://localhost:8000
6. Admin panel at http://localhost:8000/admin

## Database Schema

**Key relationships:**
- User → UserProfile (gamification) - OneToOne
- User → Enrollment → Course - ManyToMany through Enrollment
- Course → Module → Lesson - One-to-many cascade
- Lesson → Quiz → Question - One-to-many cascade
- User → LessonProgress - Tracks lesson completion
- User → QuizAttempt - Tracks quiz submissions
- User → Achievement - Earned achievements

**Important indexes:**
- Course: `[status, -created_at]`, `[category, status]`
- Achievement: `[user, category]`
- DailyTask: `[user, date, completed]`
- FocusSession: `[user, created_at]`

## Migration Notes

When making model changes:
1. Run `python manage.py makemigrations`
2. Review generated migration file
3. Run `python manage.py migrate`
4. If adding signals, ensure they're imported in `apps.py`

When adding WebSocket consumers:
1. Create consumer class in `apps/*/consumers.py`
2. Add URL pattern to `backend/onthego/routing.py`
3. Update frontend WebSocket helpers in `frontend/lib/websocket.ts`
