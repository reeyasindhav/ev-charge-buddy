import { useState } from "react";
import { 
  Zap, 
  Clock, 
  Brain, 
  MessageSquare, 
  Server,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Battery
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/CodeBlock";
import { FeatureCard } from "@/components/FeatureCard";
import { FlowDiagram } from "@/components/FlowDiagram";

// Main Python code
const mainPyCode = `"""
EV Charging Reminder Agent - WhatsApp Bot
==========================================
A production-ready FastAPI backend that sends daily EV charging reminders
via WhatsApp using Twilio, with LLM-powered message generation via Google Gemini.
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
import pytz

# =============================================================================
# CONFIGURATION
# =============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")
USER_WHATSAPP_NUMBER = os.getenv("USER_WHATSAPP_NUMBER")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")

# ... Full code available in src/backend-code/main.py
`;

const requirementsTxt = `# EV Charging Reminder Agent - Dependencies
fastapi==0.109.2
uvicorn[standard]==0.27.1
twilio==8.13.0
apscheduler==3.10.4
httpx==0.26.0
pytz==2024.1
python-multipart==0.0.9`;

const envExample = `# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
USER_WHATSAPP_NUMBER=whatsapp:+919876543210

# Google Gemini API (Optional)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
TIMEZONE=Asia/Kolkata
PORT=8000`;

const deployCommands = `# Clone your repo, then:
cd backend-code
pip install -r requirements.txt

# Set environment variables
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
# ... set all env vars

# Run locally
python main.py

# Or with uvicorn
uvicorn main:app --reload --port 8000`;

const Index = () => {
  const [showFullCode, setShowFullCode] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Production-Ready Python Backend</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-gradient">EV Charging</span>
              <br />
              <span className="text-foreground">Reminder Agent</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A friendly WhatsApp bot that reminds you to charge your electric vehicle every night at 9 PM. 
              Powered by Google Gemini for natural, varied messages.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="gap-2 shadow-glow"
                onClick={() => document.getElementById('code')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <FileCode className="w-5 h-5" />
                View Code
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="gap-2"
                onClick={() => window.open('https://render.com', '_blank')}
              >
                <ExternalLink className="w-5 h-5" />
                Deploy on Render
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Clock}
            title="Daily 9 PM Reminders"
            description="Timezone-aware scheduling using APScheduler. Triggers at exactly 21:00 in your local timezone."
          />
          <FeatureCard 
            icon={Brain}
            title="LLM-Powered Messages"
            description="Uses Google Gemini to generate friendly, varied reminders. Falls back to defaults if unavailable."
          />
          <FeatureCard 
            icon={MessageSquare}
            title="Smart Reply Detection"
            description="Classifies natural responses like 'done', 'plugged in', or 👍 as confirmations using AI."
          />
          <FeatureCard 
            icon={Sparkles}
            title="Follow-up System"
            description="Sends a gentle nudge if no confirmation received within 1 hour of the initial reminder."
          />
          <FeatureCard 
            icon={Server}
            title="Free Cloud Deployment"
            description="Designed for free tiers on Render, Railway, or Fly.io. No credit card required."
          />
          <FeatureCard 
            icon={Battery}
            title="WhatsApp Integration"
            description="Uses Twilio's WhatsApp Business API with webhook support for real-time reply handling."
          />
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="p-6 rounded-2xl border border-border bg-card/50">
            <FlowDiagram />
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section id="code" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Complete Backend Code</h2>
          <p className="text-muted-foreground mb-8">
            Copy these files to your project. The full <code className="text-primary">main.py</code> is available in{" "}
            <code className="text-primary">src/backend-code/</code>
          </p>
          
          <div className="space-y-6">
            {/* Main.py Preview */}
            <div>
              <CodeBlock 
                code={showFullCode ? mainPyCode : mainPyCode.slice(0, 800) + '\n\n# ... (click "Show full code" below)'}
                language="python"
                filename="main.py"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-muted-foreground"
                onClick={() => setShowFullCode(!showFullCode)}
              >
                {showFullCode ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show full code (open src/backend-code/main.py for complete file)
                  </>
                )}
              </Button>
            </div>

            {/* Requirements */}
            <CodeBlock 
              code={requirementsTxt}
              language="text"
              filename="requirements.txt"
            />

            {/* Env Example */}
            <CodeBlock 
              code={envExample}
              language="bash"
              filename=".env.example"
            />
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Quick Start</h2>
          <p className="text-muted-foreground mb-8">
            Get your reminder agent running in minutes
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
                Set up Twilio
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 ml-8">
                <li>• Create account at <a href="https://twilio.com" className="text-primary hover:underline">twilio.com</a></li>
                <li>• Go to Messaging → WhatsApp Sandbox</li>
                <li>• Follow sandbox setup instructions</li>
                <li>• Note your sandbox number</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
                Get Gemini API Key (Optional)
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 ml-8">
                <li>• Go to <a href="https://makersuite.google.com/app/apikey" className="text-primary hover:underline">Google AI Studio</a></li>
                <li>• Create an API key</li>
                <li>• Add as GEMINI_API_KEY env var</li>
                <li>• Skip this for default messages</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
                Deploy
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 ml-8">
                <li>• Push code to GitHub</li>
                <li>• Connect to Render/Railway/Fly.io</li>
                <li>• Add environment variables</li>
                <li>• Deploy!</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">4</span>
                Configure Webhook
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2 ml-8">
                <li>• Get your deployed URL</li>
                <li>• In Twilio, set webhook to:</li>
                <li className="font-mono text-xs bg-muted px-2 py-1 rounded">https://your-url/webhook/whatsapp</li>
                <li>• Test with /test/reminder endpoint</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <CodeBlock 
              code={deployCommands}
              language="bash"
              filename="Local Development"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">EV Charging Reminder Agent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              MIT License • Built with FastAPI, Twilio & Gemini
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
