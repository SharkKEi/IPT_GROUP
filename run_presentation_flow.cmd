@echo off
setlocal enabledelayedexpansion

cd /d "c:/Users/admin/Desktop/Jeff Marquez/3rd Year/2nd Semester/IPT/Django/IPT_GROUP"

REM ====== 1) Create/activate venv ======
if not exist venv (
  echo [1/5] Creating virtual environment...
  python -m venv venv
)

echo [2/5] Activating venv + installing requirements...
call venv\Scripts\activate
pip install -r requirements.txt

REM ====== 2) Migrate + collect static (optional) ======
echo [3/5] Applying migrations...
python manage.py migrate

REM ====== 3) Start Django server ======
echo [4/5] Starting Django dev server on http://127.0.0.1:8000 ...
start "django-dev-server" python manage.py runserver 127.0.0.1:8000

REM ====== 4) Start Frontend dev server ======
if exist frontend\package.json (
  echo [5/5] Starting React dev server...
  cd /d "c:/Users/admin/Desktop/Jeff Marquez/3rd Year/2nd Semester/IPT/Django/IPT_GROUP/frontend"
  start "react-dev-server" npm run dev
) else (
  echo Frontend package.json not found; skipping frontend start.
)

echo.
echo DONE.
echo Django:   http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause

