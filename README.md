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

### 1. Database

**Default: SQLite** — No setup. The app uses `event_planner.db` in the backend directory (or current working directory).

**Optional: PostgreSQL** — Set in `backend/.env`:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/event_planner
```

Then have PostgreSQL running and create the DB: `createdb event_planner`

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python run.py
```

Or from the project root: `python backend/run.py` (so the `app` module is found).  
If you prefer uvicorn directly, run it from inside `backend`: `uvicorn app.main:app --reload`.

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Usage

1. Create a plan (name + start/end date).
2. Open the plan to see the interactive grid (dates as columns, participants as rows).
3. Add participants by entering their names and clicking "+ Add person".
4. Edit participant names by clicking the pencil icon on hover.
5. Delete participants by clicking the X button on hover.
6. Click and drag cells to select multiple dates for a participant, then click to toggle availability (green = free, gray = busy).
7. Drag participant rows to reorder them in the grid.
8. Edit the plan name by clicking the pencil icon next to the title.
9. Copy the share link to send to others.
10. The "Total Free" row shows how many people are available per date with a color gradient (red = few, green = many).
