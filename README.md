# Event planner

Web app to find dates that work for everyone. Replaces the usual Excel sheet: columns = dates, rows = people, cell = free (1) or not (0), last row = sum per date.

## Stack

- **Backend:** FastAPI, PostgreSQL, SQLAlchemy (async)
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite

## Data model

- **Plan:** id, name, start_date, end_date, created_by, created_at; has many Participants.
- **Participant:** id, name, email (optional); belongs to a Plan.
- **Availability:** sparse — only stored when someone is free on a date (plan_id, participant_id, date, is_available). No row = not available.

## Run locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (running locally or via Docker)

### 1. Database setup

Start PostgreSQL (via Docker):

```bash
docker run --name event-planner-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=event_planner \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

Or use an existing PostgreSQL instance and create the database:

```bash
createdb -U postgres event_planner
```

### 2. Backend setup

Navigate to the backend folder and create a Python virtual environment:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux
```

Install dependencies and run:

```bash
pip install -r requirements.txt
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload
```

Backend API: http://localhost:8000  
API docs (Swagger): http://localhost:8000/docs

### 3. Frontend setup

In a new terminal, navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

Frontend app: http://localhost:5173

### Environment variables

The backend reads `DATABASE_URL` from `backend/.env.production`.

Default (local PostgreSQL):
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/event_planner
```

