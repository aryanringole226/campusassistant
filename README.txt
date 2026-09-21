AI CAMPUS COPILOT — MRDU BETTER EDITION v6

This version consolidates the previous upgrades and fixes several correctness and UX problems.

IMPROVEMENTS / FIXES
- General-purpose AI chat through a secure Python backend.
- Streaming responses with stop-generation support and bounded recent history.
- Safe rich response rendering with Markdown-like paragraphs, lists, and copyable code blocks.
- Live Server (127.0.0.1:5500 etc.) automatically talks to backend port 8000.
- Safer API parsing: HTML/non-JSON errors no longer produce “Unexpected end of JSON input”.
- AI health/status indicator and clear backend/API-key messages.
- Configurable primary + fallback model.
- Optional web-search tool variants with graceful fallback.
- Canonical demo-data sync for assignments.
- Local persistence of selected section, assignments and last sync time.
- Assignment completion state is reflected immediately in dashboard counts.
- Responsive mobile/tablet/desktop navigation.
- Mobile drawer with scrim, Escape handling and accessible labels.
- Responsive timetable without the old invalid slot index: the demo timetable has 5 actual class periods plus break/lunch separators.
- “Next class” now considers the current time instead of always showing the first period.
- Accessible form controls, focus states and reduced-motion support.
- Chat input uses a textarea so longer questions are comfortable; Enter sends, Shift+Enter creates a new line.
- Frontend output uses textContent for chat messages to avoid HTML injection.
- External MRDU portal links use noopener/noreferrer.

SETUP
1. Install Python 3.10+.
2. In this folder run:
   python -m pip install -r requirements.txt
3. Create .env:
   OPENAI_API_KEY=your_key_here
   AI_MODEL=gpt-4o-mini
   AI_FALLBACK_MODEL=gpt-4o-mini
   ENABLE_WEB_SEARCH=true
   MAX_HISTORY=12
   MAX_CONTEXT_CHARS=60000
4. Start:
   python server.py
5. Open http://127.0.0.1:8000

You may also open index.html through VS Code Live Server on port 5500; the frontend detects it and uses the backend on port 8000.

IMPORTANT
- Never put OPENAI_API_KEY in index.html or script.js.
- Demo timetable/assignments are not verified live MRDU records.
- The browser uses `/api/chat/stream`; `/api/chat` remains available for non-streaming clients.
- No AI can answer literally every possible question; model capability, tools, safety and unavailable/private data still limit answers.
