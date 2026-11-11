# PayPilot AI Voice Agent

**An AI-powered voice assistant with PayPal Sandbox payment integration.**

PayPilot AI is a web-based AI voice assistant designed to help users interact with an AI assistant through text and voice. It combines a React frontend, FastAPI backend, SQLite database, and PayPal Orders API Sandbox integration.

## Features

- AI-powered assistant chat
- Voice input using browser speech recognition
- Female voice output using browser text-to-speech
- English AI responses
- PayPal Sandbox order creation
- Payment capture with user confirmation
- Transaction history
- SQLite database integration
- React + Vite frontend
- FastAPI backend

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Vite | Frontend development |
| Python | Backend development |
| FastAPI | REST API |
| SQLite | Transaction storage |
| PayPal Orders v2 API | Sandbox payment integration |
| Browser Speech Recognition | Voice input |
| Browser Speech Synthesis | Voice output |

## Project Structure

```text
PayPilot_AI_VoiceAgent/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Ravi-patidar-2006/PayPilot-AI-VoiceAgent.git
cd PayPilot-AI-VoiceAgent
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Environment variables

Create a `backend/.env` file and configure the required credentials:

```env
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
```

Add any other API keys required by your configured AI provider.

**Important:** Never upload `.env` files, API keys, or PayPal secrets to GitHub.

### 4. Start the backend

From the backend directory:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Backend health check |
| `POST /api/orders` | Create a PayPal order |
| `POST /api/orders/{order_id}/capture` | Capture an order |
| `GET /api/transactions` | Retrieve transactions |
| `POST /api/assistant/query` | Assistant query |
| `POST /api/assistant/chat` | AI assistant chat |

## PayPal Sandbox Integration

PayPilot AI integrates with the PayPal Orders v2 API in Sandbox mode.

The payment workflow includes:

1. Create a Sandbox order.
2. Obtain the order details.
3. Ask the user for payment confirmation.
4. Capture the order after confirmation.
5. Store transaction information.

**Note:** This project uses PayPal Sandbox for development and testing. It is not intended to process real payments in its current configuration.

## Security

- Keep API credentials in environment variables.
- Never commit `.env` files.
- Do not upload private credentials to GitHub.
- Use PayPal Sandbox credentials for testing.
- Require explicit user confirmation before payment capture.

## Future Improvements

- Improved multilingual voice interaction
- Hands-free voice conversation
- Better error handling
- Enhanced transaction dashboard
- Deployment and production configuration

## Author

**Ravi Nandan Kulmi**

B.Tech Student | AI & ML

## Repository

[PayPilot AI Voice Agent on GitHub](https://github.com/Ravi-patidar-2006/PayPilot-AI-VoiceAgent)

---

*Built as an AI voice assistant project with PayPal Sandbox integration.*
