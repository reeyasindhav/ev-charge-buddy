"""
EV Charging Reminder Agent - WhatsApp Bot
==========================================
A production-ready FastAPI backend that sends daily EV charging reminders
via WhatsApp using Twilio, with LLM-powered message generation via Google Gemini.

Deploy on: Render, Railway, Fly.io, or any platform supporting Python

Environment Variables Required:
- TWILIO_ACCOUNT_SID: Your Twilio Account SID
- TWILIO_AUTH_TOKEN: Your Twilio Auth Token
- TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp number (format: whatsapp:+14155238886)
- USER_WHATSAPP_NUMBER: Your personal WhatsApp number (format: whatsapp:+919876543210)
- GEMINI_API_KEY: Google Gemini API key (optional - falls back to default messages)
- TIMEZONE: Timezone for scheduling (default: Asia/Kolkata)
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Form, BackgroundTasks, Request
from fastapi.responses import PlainTextResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from twilio.rest import Client
from twilio.request_validator import RequestValidator
import pytz

# =============================================================================
# CONFIGURATION
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")  # whatsapp:+14155238886
USER_WHATSAPP_NUMBER = os.getenv("USER_WHATSAPP_NUMBER")       # whatsapp:+919876543210
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")

# Validate required environment variables
def validate_env_vars():
    required = [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN", 
        "TWILIO_WHATSAPP_NUMBER",
        "USER_WHATSAPP_NUMBER"
    ]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {missing}")
        raise ValueError(f"Missing required environment variables: {missing}")

# =============================================================================
# STATE MANAGEMENT
# =============================================================================

class ReminderState:
    """
    In-memory state tracker for daily reminders.
    For production with multiple workers, use Redis or SQLite instead.
    """
    def __init__(self):
        self.today_confirmed: bool = False
        self.reminder_sent_at: Optional[datetime] = None
        self.followup_sent: bool = False
        self.last_reset_date: Optional[str] = None
    
    def reset_for_new_day(self, date_str: str):
        """Reset state for a new day"""
        if self.last_reset_date != date_str:
            self.today_confirmed = False
            self.reminder_sent_at = None
            self.followup_sent = False
            self.last_reset_date = date_str
            logger.info(f"State reset for new day: {date_str}")
    
    def mark_reminder_sent(self):
        """Mark that the initial reminder was sent"""
        tz = pytz.timezone(TIMEZONE)
        self.reminder_sent_at = datetime.now(tz)
        logger.info(f"Reminder sent at {self.reminder_sent_at}")
    
    def mark_confirmed(self):
        """Mark that user confirmed EV is charging"""
        self.today_confirmed = True
        logger.info("EV charging confirmed by user")
    
    def mark_followup_sent(self):
        """Mark that followup was sent"""
        self.followup_sent = True
        logger.info("Followup reminder sent")
    
    def should_send_followup(self) -> bool:
        """Check if followup should be sent (1 hour after reminder, not confirmed)"""
        if self.today_confirmed or self.followup_sent:
            return False
        if self.reminder_sent_at is None:
            return False
        
        tz = pytz.timezone(TIMEZONE)
        now = datetime.now(tz)
        elapsed = now - self.reminder_sent_at
        return elapsed >= timedelta(hours=1)

# Global state instance
state = ReminderState()

# =============================================================================
# GEMINI LLM INTEGRATION
# =============================================================================

async def generate_reminder_message(is_followup: bool = False) -> str:
    """
    Generate a friendly reminder message using Google Gemini.
    Falls back to default message if Gemini is unavailable.
    """
    default_messages = {
        False: "Hey! 🔌 Just a friendly reminder to plug in your EV tonight. Sweet dreams to you and your car! 🚗⚡",
        True: "Hey there! 👋 Just checking in - did you manage to plug in your EV? Don't want you waking up to a sad, empty battery! 🔋"
    }
    
    if not GEMINI_API_KEY:
        logger.info("Gemini API key not set, using default message")
        return default_messages[is_followup]
    
    try:
        prompt = (
            "Generate a short, friendly WhatsApp message reminding someone to charge their electric vehicle. "
            "Keep it casual, warm, and under 150 characters. Use 1-2 relevant emojis. "
            "Don't be annoying or preachy."
        )
        if is_followup:
            prompt = (
                "Generate a gentle follow-up WhatsApp message checking if someone plugged in their EV. "
                "Be friendly but not pushy. Keep it under 150 characters. Use 1-2 emojis."
            )
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.8,
                        "maxOutputTokens": 100
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                # Clean up the response
                text = text.strip().strip('"').strip("'")
                logger.info(f"Generated message via Gemini: {text}")
                return text
            else:
                logger.warning(f"Gemini API error: {response.status_code}")
                return default_messages[is_followup]
                
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        return default_messages[is_followup]


async def classify_user_reply(message: str) -> bool:
    """
    Use Gemini to classify if the user's reply confirms the EV is charging.
    Returns True if confirmed, False otherwise.
    Falls back to keyword matching if Gemini is unavailable.
    """
    # Keyword-based fallback
    confirm_keywords = [
        "done", "yes", "yep", "yeah", "plugged", "charging", "on charge",
        "connected", "okay", "ok", "👍", "✅", "⚡", "🔌", "charged"
    ]
    message_lower = message.lower()
    
    if not GEMINI_API_KEY:
        logger.info("Using keyword-based classification (no Gemini key)")
        return any(keyword in message_lower for keyword in confirm_keywords)
    
    try:
        prompt = f"""Classify this WhatsApp reply to an EV charging reminder.
Does this message confirm that the user has plugged in their EV to charge?

User's message: "{message}"

Reply with ONLY one word: CONFIRMED or NOT_CONFIRMED"""

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 10
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data["candidates"][0]["content"]["parts"][0]["text"].strip().upper()
                is_confirmed = "CONFIRMED" in result and "NOT" not in result
                logger.info(f"Gemini classification: {result} -> {is_confirmed}")
                return is_confirmed
            else:
                logger.warning(f"Gemini API error, using fallback: {response.status_code}")
                return any(keyword in message_lower for keyword in confirm_keywords)
                
    except Exception as e:
        logger.error(f"Error in classification: {e}, using fallback")
        return any(keyword in message_lower for keyword in confirm_keywords)


# =============================================================================
# TWILIO WHATSAPP MESSAGING
# =============================================================================

def get_twilio_client() -> Client:
    """Get configured Twilio client"""
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


async def send_whatsapp_message(message: str) -> bool:
    """Send a WhatsApp message via Twilio"""
    try:
        client = get_twilio_client()
        msg = client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=USER_WHATSAPP_NUMBER
        )
        logger.info(f"WhatsApp message sent: SID={msg.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return False


# =============================================================================
# SCHEDULED TASKS
# =============================================================================

async def send_daily_reminder():
    """
    Send the daily 9 PM reminder.
    Called by APScheduler at 21:00 local time.
    """
    tz = pytz.timezone(TIMEZONE)
    today = datetime.now(tz).strftime("%Y-%m-%d")
    
    # Reset state for new day if needed
    state.reset_for_new_day(today)
    
    if state.today_confirmed:
        logger.info("EV already confirmed as charging, skipping reminder")
        return
    
    # Generate and send the reminder
    message = await generate_reminder_message(is_followup=False)
    success = await send_whatsapp_message(message)
    
    if success:
        state.mark_reminder_sent()


async def check_and_send_followup():
    """
    Check if followup should be sent (1 hour after initial reminder).
    Called by APScheduler at 22:00 local time.
    """
    if not state.should_send_followup():
        logger.info("Followup not needed (already confirmed or already sent)")
        return
    
    # Generate and send followup
    message = await generate_reminder_message(is_followup=True)
    success = await send_whatsapp_message(message)
    
    if success:
        state.mark_followup_sent()


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

scheduler = AsyncIOScheduler(timezone=TIMEZONE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - start scheduler on startup"""
    validate_env_vars()
    
    # Schedule daily reminder at 9:00 PM
    scheduler.add_job(
        send_daily_reminder,
        CronTrigger(hour=21, minute=0, timezone=TIMEZONE),
        id="daily_reminder",
        replace_existing=True
    )
    
    # Schedule followup check at 10:00 PM (1 hour after reminder)
    scheduler.add_job(
        check_and_send_followup,
        CronTrigger(hour=22, minute=0, timezone=TIMEZONE),
        id="followup_check",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info(f"Scheduler started with timezone: {TIMEZONE}")
    logger.info("Daily reminder scheduled for 21:00, followup check at 22:00")
    
    yield
    
    scheduler.shutdown()
    logger.info("Scheduler shut down")


app = FastAPI(
    title="EV Charging Reminder Agent",
    description="WhatsApp bot that reminds you to charge your EV",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Health check endpoint"""
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)
    return {
        "status": "running",
        "service": "EV Charging Reminder Agent",
        "current_time": now.isoformat(),
        "timezone": TIMEZONE,
        "state": {
            "today_confirmed": state.today_confirmed,
            "reminder_sent": state.reminder_sent_at.isoformat() if state.reminder_sent_at else None,
            "followup_sent": state.followup_sent
        }
    }


@app.get("/health")
async def health():
    """Simple health check for deployment platforms"""
    return {"status": "ok"}


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(default=""),
    NumMedia: str = Form(default="0"),
    background_tasks: BackgroundTasks = None
):
    """
    Webhook endpoint to receive WhatsApp messages from Twilio.
    
    Configure this URL in your Twilio WhatsApp Sandbox:
    https://your-domain.com/webhook/whatsapp
    """
    logger.info(f"Received WhatsApp message from {From}: {Body}")
    
    # Validate this is from our user
    if From != USER_WHATSAPP_NUMBER:
        logger.warning(f"Message from unknown number: {From}")
        return PlainTextResponse("OK")
    
    # Skip if already confirmed today
    if state.today_confirmed:
        logger.info("Already confirmed today, ignoring message")
        return PlainTextResponse("OK")
    
    # Skip if no reminder was sent today
    if state.reminder_sent_at is None:
        logger.info("No reminder sent today, ignoring message")
        return PlainTextResponse("OK")
    
    # Check if message is a reaction (empty body with media) or regular message
    message_text = Body.strip()
    if not message_text and int(NumMedia) == 0:
        # Could be a reaction - treat as potential confirmation
        message_text = "👍"  # Treat empty/reaction as thumbs up
    
    # Classify the reply
    is_confirmed = await classify_user_reply(message_text)
    
    if is_confirmed:
        state.mark_confirmed()
        # Optionally send acknowledgment
        await send_whatsapp_message("Awesome! 🎉 Your EV will be all charged up by morning. Sleep well! 🌙")
    
    return PlainTextResponse("OK")


@app.post("/test/reminder")
async def test_reminder():
    """
    Test endpoint to manually trigger a reminder.
    Remove or protect this in production!
    """
    await send_daily_reminder()
    return {"status": "reminder sent", "state": {
        "confirmed": state.today_confirmed,
        "reminder_sent": state.reminder_sent_at.isoformat() if state.reminder_sent_at else None
    }}


@app.post("/test/followup")
async def test_followup():
    """
    Test endpoint to manually trigger followup check.
    Remove or protect this in production!
    """
    await check_and_send_followup()
    return {"status": "followup checked", "followup_sent": state.followup_sent}


@app.post("/reset")
async def reset_state():
    """
    Reset the daily state (for testing).
    Remove or protect this in production!
    """
    tz = pytz.timezone(TIMEZONE)
    today = datetime.now(tz).strftime("%Y-%m-%d")
    state.reset_for_new_day(today + "-reset")  # Force reset
    return {"status": "state reset"}


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
