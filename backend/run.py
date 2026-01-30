"""
Run the FastAPI server. Use this so the app package is found from any cwd.

From backend:  python run.py
From root:     python backend/run.py
"""
import sys
import os

# Ensure backend directory is on path so "app" resolves when run from project root
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
