"""AI Campus Copilot backend with canonical demo data and streaming AI responses."""
import os
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx  # type: ignore[reportMissingImports]
from fastapi import FastAPI, HTTPException  # type: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[reportMissingImports]
from fastapi.responses import FileResponse, StreamingResponse  # type: ignore[reportMissingImports]
from fastapi.staticfiles import StaticFiles  # type: ignore[reportMissingImports]
from pydantic import BaseModel, Field  # type: ignore[reportMissingImports]

ROOT=Path(__file__).resolve().parent
try:
    from dotenv import load_dotenv  # type: ignore[reportMissingImports]
    load_dotenv(ROOT/".env")
except ImportError:
    pass

OPENAI_API_KEY=os.getenv("OPENAI_API_KEY","").strip()
OPENAI_BASE_URL=os.getenv("OPENAI_BASE_URL","https://api.openai.com/v1").rstrip("/")
AI_MODEL=os.getenv("AI_MODEL","gpt-4o-mini").strip()
AI_FALLBACK_MODEL=os.getenv("AI_FALLBACK_MODEL","gpt-4o-mini").strip()
ENABLE_WEB_SEARCH=os.getenv("ENABLE_WEB_SEARCH","true").lower() in {"1","true","yes","on"}
MAX_HISTORY=int(os.getenv("MAX_HISTORY","12"))
MAX_CONTEXT_CHARS=int(os.getenv("MAX_CONTEXT_CHARS","60000"))

app=FastAPI(title="AI Campus Copilot API",version="5.0")
app.add_middleware(CORSMiddleware,allow_origins=[],allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",allow_credentials=False,allow_methods=["GET","POST","OPTIONS"],allow_headers=["*"])

DEMO_TIMETABLE={
 "SEC-A":{"Monday":["OOPS","AI","BREAK","CCS","SFCS","LUNCH","OSF LAB"],"Tuesday":["AI","CCS",None,"SFCS","OSF",None,"OOPS LAB"],"Wednesday":["CCS","OOPS",None,"AI","ES",None,"SFCS"],"Thursday":["OOPS","SFCS",None,"CCS","OSF",None,"AI"],"Friday":["ES","CCS",None,"AI","SFCS",None,"OOPS"],"Saturday":["AI","OSF",None,"OOPS","ES",None,"CCS"]},
 "SEC-B":{"Monday":["CCS","OSF","BREAK","SFCS","AI","LUNCH","OOPS LAB"],"Tuesday":["SFCS","OOPS",None,"AI","CCS",None,"OSF LAB"],"Wednesday":["OSF","AI",None,"OOPS","SFCS",None,"CCS"],"Thursday":["OSF","CCS",None,"ES","AI",None,"SFCS"],"Friday":["SFCS","OSF",None,"OOPS","ES",None,"AI"],"Saturday":["OOPS","SFCS",None,"OSF","CCS",None,"AI"]},
 "SEC-C":{"Monday":["SFCS","OSF","BREAK","CCS","AI","LUNCH","OOPS"],"Tuesday":["OOPS","CCS",None,"AI","ES",None,"SFCS"],"Wednesday":["AI","ES",None,"OSF","CCS",None,"SFCS"],"Thursday":["CCS","SFCS",None,"OSF","AI",None,"OOPS"],"Friday":["AI","OOPS",None,"OSF","SFCS",None,"OSF LAB"],"Saturday":["ES","CCS",None,"AI","SFCS",None,"OOPS LAB"]},
 "SEC-D":{"Monday":["AI","ES","BREAK","OSF","OOPS","LUNCH","SFCS"],"Tuesday":["ES","OSF",None,"SFCS","CCS",None,"OOPS"],"Wednesday":["OOPS","CCS",None,"AI","ES",None,"OSF"],"Thursday":["AI","CCS",None,"OSF","SFCS",None,"OOPS LAB"],"Friday":["CCS","SFCS",None,"OOPS","OSF",None,"OSF LAB"],"Saturday":["SFCS","AI",None,"OOPS","CCS",None,"ES"]},
 "SEC-E":{"Monday":["OOPS","AI","BREAK","CCS","OSF","LUNCH","SFCS"],"Tuesday":["CCS","SFCS",None,"AI","OOPS",None,"ES"],"Wednesday":["AI","ES",None,"SFCS","CCS",None,"OOPS LAB"],"Thursday":["OSF","SFCS",None,"OOPS","AI",None,"OSF LAB"],"Friday":["OOPS","OSF",None,"CCS","SFCS",None,"AI"],"Saturday":["CCS","OOPS",None,"AI","ES",None,"OSF"]},
 "SEC-F":{"Monday":["CCS","OOPS","BREAK","AI","SFCS","LUNCH","OSF LAB"],"Tuesday":["AI","SFCS",None,"ES","OSF",None,"OOPS"],"Wednesday":["OSF","OOPS",None,"CCS","AI",None,"SFCS"],"Thursday":["ES","CCS",None,"SFCS","OSF",None,"OOPS"],"Friday":["OSF","CCS",None,"AI","SFCS",None,"OOPS LAB"],"Saturday":["ES","OSF",None,"OOPS","SFCS",None,"AI"]},
 "SEC-G":{"Monday":["SFCS","AI","BREAK","CCS","OSF","LUNCH","OOPS LAB"],"Tuesday":["AI","CCS",None,"OOPS","SFCS",None,"OSF LAB"],"Wednesday":["OOPS","OSF",None,"SFCS","AI",None,"ES"],"Thursday":["OSF","OOPS",None,"AI","CCS",None,"SFCS"],"Friday":["ES","CCS",None,"OSF","OOPS",None,"SFCS"],"Saturday":["OOPS","AI",None,"OSF","CCS",None,"SFCS"]},
 "SEC-H":{"Monday":["CCS","SFCS","BREAK","OOPS","AI","LUNCH","OSF LAB"],"Tuesday":["OSF","OOPS",None,"CCS","ES",None,"AI"],"Wednesday":["SFCS","AI",None,"OOPS","CCS",None,"OOPS LAB"],"Thursday":["AI","CCS",None,"SFCS","ES",None,"OSF"],"Friday":["OOPS","OSF",None,"CCS","ES",None,"AI"],"Saturday":["OSF","ES",None,"AI","SFCS",None,"OSF"]}
}
DEMO_ASSIGNMENTS=[
 {"title":"OSF Unit-1 Assignment","subject":"OSF","due":"Tomorrow","priority":"High","status":"Pending"},
 {"title":"AI Search Algorithms","subject":"AI","due":"In 3 days","priority":"Medium","status":"Pending"},
 {"title":"CCS Cybersecurity Worksheet","subject":"CCS","due":"In 5 days","priority":"Medium","status":"Pending"},
 {"title":"OOPS Java Lab Record","subject":"OOPS","due":"Next week","priority":"Low","status":"Pending"},
]

class ChatMessage(BaseModel):
 role:str=Field(pattern=r"^(user|assistant)$")
 content:str=Field(min_length=1,max_length=12000)
class CampusContext(BaseModel):
    student_name:str="";section:str="SEC-A";semester:str="";day:str="";now:str="";timetable:dict[str,Any]=Field(default_factory=dict);today_schedule:list[dict[str,Any]]=Field(default_factory=list);assignments:list[dict[str,Any]]=Field(default_factory=list)
class ChatRequest(BaseModel):
 message:str=Field(min_length=1,max_length=12000);history:list[ChatMessage]=Field(default_factory=list);campus:CampusContext=Field(default_factory=CampusContext)

def prompt(c:CampusContext)->str:
    pending=[a for a in c.assignments if a.get("status")!="Completed"]
    return f"""You are AI Campus Copilot, a capable general-purpose academic and software assistant.
Answer the user's actual intent directly across general knowledge, STEM, programming, debugging, writing, translation, careers, planning and campus questions. Adapt depth to the question. Explain difficult ideas simply, show reasoning or examples when useful, and for code explain the issue, why it happens, a corrected version, and tests or complexity when relevant.
Use recent conversation context naturally. Ask a clarification only when it is genuinely necessary. Never invent facts, sources, campus records, or completed actions; distinguish assumptions from supplied facts and say when you do not know. Treat all supplied campus records as local demo dashboard data, not verified live university information. For time-sensitive questions, use the web tool only when available and identify that current information was checked.
Current application context: student={c.student_name or 'not provided'}; section={c.section}; semester={c.semester or 'not provided'}; local time={c.now or 'not provided'}; day={c.day or 'unknown'}; today's classes={c.today_schedule}; assignments={c.assignments}; pending assignments={len(pending)}."""

def request_messages(req:ChatRequest)->list[dict[str,str]]:
    context=json.dumps(req.campus.model_dump(),ensure_ascii=True,separators=(",",":"))
    if len(context)>MAX_CONTEXT_CHARS: context=context[:MAX_CONTEXT_CHARS]
    return [{"role":"system","content":prompt(req.campus)}]+[{"role":m.role,"content":m.content} for m in req.history[-MAX_HISTORY:]]+[{"role":"user","content":req.message}]

def model_list()->list[str]:
    return list(dict.fromkeys(x for x in (AI_MODEL,AI_FALLBACK_MODEL) if x))

def extract_text(data:dict[str,Any])->str:
    text=data.get("output_text")
    if isinstance(text,str) and text.strip(): return text.strip()
    parts=[]
    for item in data.get("output",[]) or []:
        for content in item.get("content",[]) or []:
            t=content.get("text")
            if isinstance(t,str) and t.strip(): parts.append(t.strip())
    return "\n\n".join(parts).strip()

async def call_ai(req:ChatRequest):
    if not OPENAI_API_KEY: raise HTTPException(503,"AI is not configured. Add OPENAI_API_KEY to .env and restart the server.")
    messages=request_messages(req)
    headers={"Authorization":f"Bearer {OPENAI_API_KEY}","Content-Type":"application/json"}
    models=[]
    for m in (AI_MODEL,AI_FALLBACK_MODEL):
        if m and m not in models: models.append(m)
    async with httpx.AsyncClient(timeout=httpx.Timeout(75.0,connect=15.0)) as client:
        last="AI request failed."
        for model in models:
            variants=[]
            if ENABLE_WEB_SEARCH:
                variants += [[{"type":"web_search"}],[{"type":"web_search_preview"}]]
            variants += [None]
            for tools in variants:
                payload={"model":model,"input":messages,"max_output_tokens":2200}
                if tools: payload["tools"]=tools
                try:r=await client.post(f"{OPENAI_BASE_URL}/responses",headers=headers,json=payload)
                except httpx.RequestError as e: raise HTTPException(502,f"Could not reach the AI service: {e}")
                if r.status_code<400:
                    try:data=r.json()
                    except ValueError: raise HTTPException(502,"AI service returned invalid JSON.")
                    text=extract_text(data)
                    if text:return text, bool(tools), model
                    last="The AI returned no text response.";continue
                try:last=(r.json().get("error",{}).get("message") or r.text)[:500]
                except Exception:last=r.text[:500]
                if r.status_code==401: raise HTTPException(502,"The configured AI API key was rejected. Check OPENAI_API_KEY.")
                if r.status_code==429: raise HTTPException(502,"The AI service rate limit or quota was reached.")
                if r.status_code in (400,404,422): continue
                break
    raise HTTPException(502,"The AI service is temporarily unavailable. Please try again.")

async def stream_ai(req:ChatRequest):
    if not OPENAI_API_KEY: raise HTTPException(503,"Your API key is not configured. Add OPENAI_API_KEY to .env and restart the server.")
    headers={"Authorization":f"Bearer {OPENAI_API_KEY}","Content-Type":"application/json"}
    async with httpx.AsyncClient(timeout=httpx.Timeout(75.0,connect=15.0)) as client:
        for model in model_list():
            payload={"model":model,"input":request_messages(req),"max_output_tokens":2200,"stream":True}
            try:
                async with client.stream("POST",f"{OPENAI_BASE_URL}/responses",headers=headers,json=payload) as r:
                    if r.status_code>=400: continue
                    async for line in r.aiter_lines():
                        if not line.startswith("data:"): continue
                        raw=line[5:].strip()
                        if raw=="[DONE]": continue
                        try:event=json.loads(raw)
                        except ValueError: continue
                        if event.get("type")=="response.output_text.delta":
                            yield f"data: {json.dumps({'delta':event.get('delta','')})}\n\n"
                        elif event.get("type")=="response.completed":
                            yield f"data: {json.dumps({'done':True,'model':model})}\n\n"; return
                    continue
            except httpx.RequestError:
                continue
    yield f"data: {json.dumps({'error':'The AI service is temporarily unavailable. Please try again.'})}\n\n"

@app.get("/api/health")
def health():return {"ok":True,"ai_configured":bool(OPENAI_API_KEY),"model":AI_MODEL,"fallback_model":AI_FALLBACK_MODEL,"web_search":ENABLE_WEB_SEARCH}
@app.get("/api/demo-data")
def demo_data():return {"version":"demo-2026-09-15-v3","timetable":DEMO_TIMETABLE,"assignments":DEMO_ASSIGNMENTS,"synced_at":datetime.now(timezone.utc).isoformat()}
@app.post("/api/chat")
async def chat(req:ChatRequest):
    answer,used_web,model=await call_ai(req)
    return {"answer":answer,"model":model,"web_search_enabled":used_web}
@app.post("/api/chat/stream")
async def chat_stream(req:ChatRequest):
    if not OPENAI_API_KEY: raise HTTPException(503,"Your API key is not configured. Add OPENAI_API_KEY to .env and restart the server.")
    return StreamingResponse(stream_ai(req),media_type="text/event-stream",headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})
@app.get("/api/assignments")
def assignments():return {"connected":False,"assignments":[]}
@app.get("/")
def index():return FileResponse(ROOT/"index.html")
app.mount("/",StaticFiles(directory=ROOT,html=True),name="site")
if __name__=="__main__":
    import uvicorn  # type: ignore[reportMissingImports]
    uvicorn.run("server:app",host="127.0.0.1",port=int(os.getenv("PORT","8000")),reload=False)
