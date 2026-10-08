# EduCrop Chatbot Backend Service

FastAPI backend service for the EduCrop landing page visitor chatbot. Answers visitor queries using Gemini LLM strictly based on content in `knowledge/knowledge.md`.

## Setup & Running

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Variables
Ensure `.env` exists in the repository root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
All other configuration options (model, origins, rate limits) have sensible defaults in `app/config.py`.

### 3. Run the Server
From `chatbot-service/`:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

---

## API Contract

### Health Check
`GET /api/health`
**Response (200 OK)**:
```json
{ "status": "ok" }
```

### Chat Endpoint
`POST /api/chat`

**Request Body**:
```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What modules does EduCrop provide?"
}
```

**Normal Answer Response (200 OK)**:
```json
{
  "answer": "EduCrop features four core modules: Academic Management System (AMS), Receipt Management System (RMS), Visitor Management System (VMS), and Transport Management System (TMS).",
  "page": {
    "key": "product",
    "label": "Product & Features",
    "url": "/product"
  }
}
```

**Unanswerable / Off-Topic Response (200 OK)**:
```json
{
  "answer": "I can only help with questions about EduCrop. For detailed fee structures or specific inquiries, please contact our team.",
  "page": {
    "key": "contact",
    "label": "Contact Us",
    "url": "/contact"
  }
}
```

**Error Response Contract (400 / 429 / 503)**:
```json
{
  "error": {
    "code": "too_long",
    "message": "Message exceeds the maximum length of 500 characters."
  }
}
```

---

## Updating Knowledge Base

When landing page site content changes:
1. Update `knowledge/knowledge.md` with plain text content for each page section (`# Home (/)`, `# Product (/product)`, etc.).
2. If new pages are added or URLs change, update `knowledge/pages.json` mapping each page key to its label and relative URL path.
3. Restart the FastAPI application (knowledge base is loaded into memory at startup).
