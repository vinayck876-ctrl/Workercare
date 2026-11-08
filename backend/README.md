# WorkerCare backend (Stage 1)

This folder contains the first Flask + MySQL backend foundation. It is intentionally separate from the React/Vite frontend.

## Requirements

- Python 3.10+
- MySQL 8+
- Node.js 18+ for the existing frontend

## 1. Create the database

Open MySQL Workbench or the MySQL command line and run the contents of schema.sql. This creates the database and tables for users, sites, workers, assignments, devices, sensor readings, alerts, break schedules and worker history.

## 2. Configure Python

From the repository root:

    cd backend
    python -m venv .venv

Windows PowerShell:

    .venv\Scripts\Activate.ps1

Install dependencies:

    pip install -r requirements.txt

Copy .env.example to .env and update DATABASE_URL with your MySQL username and password. Change SECRET_KEY to a long random value. Never commit .env.

## 3. Start the API

    python run.py

The API starts at http://127.0.0.1:5000.

Check:

    http://127.0.0.1:5000/api/health

A healthy response reports status=ok and database=connected. If MySQL has not been configured yet, database=not_configured is expected.

## Current scope

Stage 1 provides the Flask application, CORS configuration, SQLAlchemy connection and health endpoint, plus the initial database schema.

Authentication, role-protected API routes, ESP32 ingestion, real-time alerts, geolocation, worker history views and break-schedule APIs are not implemented yet. The frontend still uses demo data until those features are connected in later stages.

## Security

Do not use the public demo passwords for real accounts. The next stage must implement server-side password hashing, authentication, and authorization checks before any real worker or family information is stored. Keep .env and database credentials private.
