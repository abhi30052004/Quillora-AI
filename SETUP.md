# Quillora AI — Setup & Installation Guide

This guide walks you through setting up and running Quillora AI locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14.
- **Node.js**: Version 18.x or newer (recommended: Node 20+).
- **npm**: Version 9.x or newer.
- *(Optional)* **Groq API Key**: Obtain from [https://console.groq.com/keys](https://console.groq.com/keys). If omitted, Quillora runs automatically in mock mode for testing.
- *(Optional)* **MongoDB**: Running locally or on MongoDB Atlas if you wish to record usage metadata.

---

## 2. Backend Setup

### Windows (PowerShell)
```powershell
# Navigate to workspace
cd "c:\Users\abhijitbhunia\OneDrive - virtualemployee P Ltd\Desktop\Quillora AI"

# Create a virtual environment in backend/venv
python -m venv backend\venv

# Activate virtual environment
.\backend\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r backend\requirements.txt

# Configure environment variables
Copy-Item backend\.env.example backend\.env
```

### macOS / Linux (Bash)
```bash
cd "Quillora AI"
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

### Configuring `.env`
Edit `backend/.env`:
```ini
# Add your Groq API key here (leave empty for automatic mock mode)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE=0.1

# Text Processing Limits
CHUNK_SIZE=1800
CHUNK_CONCURRENCY=4
MAX_TEXT_LENGTH=50000

# Optional MongoDB URI
MONGODB_URI=
MONGODB_DB_NAME=quillora
```

### Running the Backend Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The API is available at `http://127.0.0.1:8000`. You can inspect interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

---

## 3. Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install
```

### Start Vite Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### Building for Production
```bash
npm run build
```
The compiled static assets will be generated in `frontend/dist/`.

---

## 4. Verifying the Installation

1. Verify backend health endpoint:
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```
2. Run automated backend test suite:
   ```bash
   pytest
   ```
   All 22 unit and integration tests should pass.
