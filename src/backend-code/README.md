# EV Charging Reminder Agent 🔌🚗

A friendly WhatsApp bot that reminds you to charge your electric vehicle every night at 9 PM.

## Features

- ⏰ **Daily 9 PM reminders** - Timezone-aware scheduling (default: Asia/Kolkata)
- 🤖 **LLM-powered messages** - Uses Google Gemini for friendly, varied reminders
- 💬 **Smart reply detection** - Understands natural confirmations like "done", "plugged in", "👍"
- 🔄 **Follow-up system** - Sends a gentle nudge if no confirmation after 1 hour
- 📱 **WhatsApp integration** - Uses Twilio's WhatsApp API

## Quick Deploy

### Option 1: Render (Recommended - Free Tier)

1. Fork this repo or push to your GitHub
2. Connect to [render.com](https://render.com)
3. Create a new **Web Service**
4. Set environment variables (see below)
5. Deploy!

**render.yaml** (optional - add to repo root):
```yaml
services:
  - type: web
    name: ev-reminder
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: TWILIO_ACCOUNT_SID
        sync: false
      - key: TWILIO_AUTH_TOKEN
        sync: false
      - key: TWILIO_WHATSAPP_NUMBER
        sync: false
      - key: USER_WHATSAPP_NUMBER
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

### Option 2: Railway

1. Push to GitHub
2. Connect to [railway.app](https://railway.app)
3. Deploy from repo
4. Add environment variables
5. Done!

### Option 3: Fly.io

```bash
# Install flyctl, then:
fly launch
fly secrets set TWILIO_ACCOUNT_SID=xxx TWILIO_AUTH_TOKEN=xxx ...
fly deploy
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | ✅ | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Your Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | Twilio WhatsApp number (format: `whatsapp:+14155238886`) |
| `USER_WHATSAPP_NUMBER` | ✅ | Your WhatsApp number (format: `whatsapp:+919876543210`) |
| `GEMINI_API_KEY` | ❌ | Google Gemini API key (optional - falls back to default messages) |
| `TIMEZONE` | ❌ | Timezone for scheduling (default: `Asia/Kolkata`) |
| `PORT` | ❌ | Server port (default: `8000`) |

## Twilio Setup

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Follow the sandbox setup instructions
4. Note your sandbox number (format: `whatsapp:+14155238886`)
5. **Configure webhook**: Set your incoming message webhook URL to:
   ```
   https://your-deployed-url.com/webhook/whatsapp
   ```

## Google Gemini Setup (Optional)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it as `GEMINI_API_KEY` environment variable

If not configured, the bot uses friendly default messages.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Status dashboard with current state |
| `/health` | GET | Simple health check |
| `/webhook/whatsapp` | POST | Twilio webhook for incoming messages |
| `/test/reminder` | POST | Manually trigger reminder (testing) |
| `/test/followup` | POST | Manually trigger followup (testing) |
| `/reset` | POST | Reset daily state (testing) |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      9:00 PM Daily                          │
│                           │                                 │
│                           ▼                                 │
│               ┌───────────────────────┐                     │
│               │  Generate LLM Message │                     │
│               │  (Gemini or fallback) │                     │
│               └───────────┬───────────┘                     │
│                           │                                 │
│                           ▼                                 │
│               ┌───────────────────────┐                     │
│               │ Send WhatsApp Reminder│                     │
│               └───────────┬───────────┘                     │
│                           │                                 │
│              ┌────────────┴────────────┐                    │
│              │                         │                    │
│              ▼                         ▼                    │
│     ┌─────────────────┐       ┌─────────────────┐          │
│     │ User Replies    │       │ No Reply        │          │
│     │ (within 1 hour) │       │ (after 1 hour)  │          │
│     └────────┬────────┘       └────────┬────────┘          │
│              │                         │                    │
│              ▼                         ▼                    │
│     ┌─────────────────┐       ┌─────────────────┐          │
│     │ LLM Classifies  │       │ Send Follow-up  │          │
│     │ Confirmation    │       │ Reminder        │          │
│     └────────┬────────┘       └─────────────────┘          │
│              │                                              │
│     ┌────────┴────────┐                                    │
│     ▼                 ▼                                    │
│ CONFIRMED         NOT_CONFIRMED                            │
│ (Stop for day)    (Wait for followup)                      │
└─────────────────────────────────────────────────────────────┘
```

## Local Development

```bash
# Clone and setup
cd backend-code
pip install -r requirements.txt

# Set environment variables
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
export USER_WHATSAPP_NUMBER=whatsapp:+919876543210
export GEMINI_API_KEY=your_gemini_key  # optional

# Run
python main.py
# or
uvicorn main:app --reload

# Test with ngrok for webhook
ngrok http 8000
# Update Twilio webhook to ngrok URL
```

## Production Notes

- **State persistence**: Current implementation uses in-memory state. For multi-worker deployments, switch to Redis or SQLite.
- **Test endpoints**: Remove or protect `/test/*` and `/reset` endpoints in production.
- **Webhook validation**: Consider adding Twilio request signature validation for security.

## License

MIT - Do whatever you want with it! 🎉
