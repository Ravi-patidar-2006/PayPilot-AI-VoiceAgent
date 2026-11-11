# PayPilot AI — PayPal Sandbox MVP

A beginner-friendly starter project using React + Vite, FastAPI, SQLite, and the PayPal Orders v2 API.

## Features
- Create a PayPal Sandbox order from the dashboard.
- Redirect to PayPal Sandbox Checkout for buyer approval.
- Capture the order on the backend after returning from PayPal.
- Store order records in SQLite and show recent payments.
- Simple command parser for payment requests (starter intent parser, not an LLM yet).
- Backend health/configuration endpoint.

> Sandbox only. Do not use production credentials or real customer data. This MVP is not production-ready.

## Requirements
- Python 3.10+
- Node.js 20+ recommended
- VS Code
- A PayPal Developer account with a Sandbox REST app and Sandbox personal/buyer account

## 1. Configure PayPal
1. Sign in at https://developer.paypal.com/
2. Open Apps & Credentials.
3. Select Sandbox.
4. Create or open a REST API app.
5. Copy the Sandbox Client ID and Secret.
6. In `backend/.env`, set them. Never put the Secret in the frontend.

## 2. Start the backend
Open a terminal in the project folder:

### Windows PowerShell
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `backend/.env` and add your Sandbox credentials, then:
```powershell
uvicorn app.main:app --reload --port 8000
```

### macOS / Linux
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```
Edit `backend/.env` and add your Sandbox credentials, then:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend docs: http://127.0.0.1:8000/docs

## 3. Start the frontend
Open a second terminal at the project root:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints, usually http://127.0.0.1:5173.

## 4. Test the payment flow
1. In the app, enter a product description and amount in USD.
2. Click **Create Sandbox payment**.
3. The app opens the PayPal Sandbox approval page.
4. Sign in using a Sandbox Personal/Buyer account from the Developer Dashboard (not your real PayPal account).
5. Approve the test payment.
6. PayPal returns to the app; the backend captures the order and updates the transaction list.

The app creates orders using `CAPTURE` intent and captures only after the buyer returns from PayPal approval. Backend API responses are the source of truth for status.

## 5. Try the assistant command
Enter something like:
`Create a test payment for $25 for website design`

This starter parser extracts the amount and description and prepares the payment form. It is deterministic demo logic, not a connected LLM. Add an LLM provider later behind a server-side tool-calling layer; never let an LLM directly invent amounts or call capture without validation and user confirmation.

## Troubleshooting
- `PayPal credentials are not configured`: fill in `backend/.env`, restart FastAPI.
- `401` from PayPal: confirm you copied Sandbox credentials, not Live credentials.
- Checkout fails: use a Sandbox buyer account and ensure the Sandbox app is selected.
- CORS error: keep Vite at port 5173 or update `allow_origins` in `backend/app/main.py`.
- If the return flow doesn't capture: check the browser URL and backend terminal logs.

## Important security notes
- Keep `.env` private and never commit it.
- The frontend never receives the PayPal Secret.
- This MVP does not include authentication, webhook signature verification, refund handling, tax calculation, or production-grade idempotency.
- Before production: add authentication/authorization, verified webhooks, rate limiting, audit logs, idempotency, robust error handling, privacy/legal review, and PayPal account/currency eligibility checks.


## Added demo capabilities
- Browser speech-to-text input where supported (Chrome recommended; microphone permission required).
- Read-only summaries of the latest 50 transaction records stored by this PayPilot instance.
- Explicit response that live PayPal account balance is not currently supported.

Important: this remains a Sandbox demo. The transaction summary is not a complete PayPal account ledger, and the balance query does not fetch live account balance. Never use production credentials or real customer data. Test payment actions in Sandbox only.
