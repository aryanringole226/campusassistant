const timetable = {
  "SEC-A": {Monday:["OOPS","AI","BREAK","CCS","SFCS","LUNCH","OSF LAB"],Tuesday:["AI","CCS",null,"SFCS","OSF",null,"OOPS LAB"],Wednesday:["CCS","OOPS",null,"AI","ES",null,"SFCS"],Thursday:["OOPS","SFCS",null,"CCS","OSF",null,"AI"],Friday:["ES","CCS",null,"AI","SFCS",null,"OOPS"],Saturday:["AI","OSF",null,"OOPS","ES",null,"CCS"]},
  "SEC-B": {Monday:["CCS","OSF","BREAK","SFCS","AI","LUNCH","OOPS LAB"],Tuesday:["SFCS","OOPS",null,"AI","CCS",null,"OSF LAB"],Wednesday:["OSF","AI",null,"OOPS","SFCS",null,"CCS"],Thursday:["OSF","CCS",null,"ES","AI",null,"SFCS"],Friday:["SFCS","OSF",null,"OOPS","ES",null,"AI"],Saturday:["OOPS","SFCS",null,"OSF","CCS",null,"AI"]},
  "SEC-C": {Monday:["SFCS","OSF","BREAK","CCS","AI","LUNCH","OOPS"],Tuesday:["OOPS","CCS",null,"AI","ES",null,"SFCS"],Wednesday:["AI","ES",null,"OSF","CCS",null,"SFCS"],Thursday:["CCS","SFCS",null,"OSF","AI",null,"OOPS"],Friday:["AI","OOPS",null,"OSF","SFCS",null,"OSF LAB"],Saturday:["ES","CCS",null,"AI","SFCS",null,"OOPS LAB"]},
  "SEC-D": {Monday:["AI","ES","BREAK","OSF","OOPS","LUNCH","SFCS"],Tuesday:["ES","OSF",null,"SFCS","CCS",null,"OOPS"],Wednesday:["OOPS","CCS",null,"AI","ES",null,"OSF"],Thursday:["AI","CCS",null,"OSF","SFCS",null,"OOPS LAB"],Friday:["CCS","SFCS",null,"OOPS","OSF",null,"OSF LAB"],Saturday:["SFCS","AI",null,"OOPS","CCS",null,"ES"]},
  "SEC-E": {Monday:["OOPS","AI","BREAK","CCS","OSF","LUNCH","SFCS"],Tuesday:["CCS","SFCS",null,"AI","OOPS",null,"ES"],Wednesday:["AI","ES",null,"SFCS","CCS",null,"OOPS LAB"],Thursday:["OSF","SFCS",null,"OOPS","AI",null,"OSF LAB"],Friday:["OOPS","OSF",null,"CCS","SFCS",null,"AI"],Saturday:["CCS","OOPS",null,"AI","ES",null,"OSF"]},
  "SEC-F": {Monday:["CCS","OOPS","BREAK","AI","SFCS","LUNCH","OSF LAB"],Tuesday:["AI","SFCS",null,"ES","OSF",null,"OOPS"],Wednesday:["OSF","OOPS",null,"CCS","AI",null,"SFCS"],Thursday:["ES","CCS",null,"SFCS","OSF",null,"OOPS"],Friday:["OSF","CCS",null,"AI","SFCS",null,"OOPS LAB"],Saturday:["ES","OSF",null,"OOPS","SFCS",null,"AI"]},
  "SEC-G": {Monday:["SFCS","AI","BREAK","CCS","OSF","LUNCH","OOPS LAB"],Tuesday:["AI","CCS",null,"OOPS","SFCS",null,"OSF LAB"],Wednesday:["OOPS","OSF",null,"SFCS","AI",null,"ES"],Thursday:["OSF","OOPS",null,"AI","CCS",null,"SFCS"],Friday:["ES","CCS",null,"OSF","OOPS",null,"SFCS"],Saturday:["OOPS","AI",null,"OSF","CCS",null,"SFCS"]},
  "SEC-H": {Monday:["CCS","SFCS","BREAK","OOPS","AI","LUNCH","OSF LAB"],Tuesday:["OSF","OOPS",null,"CCS","ES",null,"AI"],Wednesday:["SFCS","AI",null,"OOPS","CCS",null,"OOPS LAB"],Thursday:["AI","CCS",null,"SFCS","ES",null,"OSF"],Friday:["OOPS","OSF",null,"CCS","ES",null,"AI"],Saturday:["OSF","ES",null,"AI","SFCS",null,"OSF"]}
};
const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
// The source demo has seven slots: two classes, break, two classes, lunch, final class.
const slots=[
  {label:"9:15–10:10", start:555, end:610, index:0},
  {label:"10:10–11:05", start:610, end:665, index:1},
  {label:"11:15–12:10", start:675, end:730, index:3},
  {label:"12:10–1:00", start:730, end:780, index:4},
  {label:"2:50–3:45", start:870, end:925, index:6}
];
const DEMO_ASSIGNMENTS=[
  {title:"OSF Unit-1 Assignment",subject:"OSF",due:"Tomorrow",priority:"High",status:"Pending"},
  {title:"AI Search Algorithms",subject:"AI",due:"In 3 days",priority:"Medium",status:"Pending"},
  {title:"CCS Cybersecurity Worksheet",subject:"CCS",due:"In 5 days",priority:"Medium",status:"Pending"},
  {title:"OOPS Java Lab Record",subject:"OOPS",due:"Next week",priority:"Low",status:"Pending"}
];
const state={
  section:localStorage.getItem("mrduSection")||"SEC-A",
  timetable:readStoredObject("mrduTimetable",timetable),
  assignments:readStored("mrduAssignments",DEMO_ASSIGNMENTS),
  history:[],
  busy:false,
  lastSync:localStorage.getItem("mrduDemoSyncedAt")||""
};
const $=id=>document.getElementById(id);
function readStored(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(v)?v:structuredClone(fallback)}catch{return structuredClone(fallback)}}
function readStoredObject(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||"null");return v&&typeof v==="object"&&!Array.isArray(v)?v:structuredClone(fallback)}catch{return structuredClone(fallback)}}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function now(){return new Date()}
function currentDay(){return now().toLocaleDateString("en-US",{weekday:"long"})}
function closeMenu(){const app=$("app"),toggle=$("menuToggle");app.classList.remove("menu-open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open navigation");toggle.textContent="☰"}
function init(){
  $("section").innerHTML=Object.keys(state.timetable).map(s=>`<option value="${s}">${s}</option>`).join("");
  $("section").value=state.section;
  $("section").addEventListener("change",e=>{state.section=e.target.value;localStorage.setItem("mrduSection",state.section);renderAll()});
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
  $("menuToggle").addEventListener("click",()=>{const open=$("app").classList.toggle("menu-open");$("menuToggle").setAttribute("aria-expanded",String(open));$("menuToggle").setAttribute("aria-label",open?"Close navigation":"Open navigation");$("menuToggle").textContent=open?"✕":"☰"});
  $("scrim").addEventListener("click",closeMenu);
  $("planBtn").addEventListener("click",makePlan);
  $("syncDemoBtn").addEventListener("click",syncDemo);
  $("clearChat").addEventListener("click",clearChat);$("stopBtn").addEventListener("click",()=>state.controller?.abort());
  $("composer").addEventListener("submit",e=>{e.preventDefault();ask()});
  $("q").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask()}});
  $("q").addEventListener("input",()=>{const el=$("q");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,180)+"px"});
  window.addEventListener("resize",()=>{if(window.innerWidth>640)closeMenu()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});
  renderAll(); checkAI();
  if(state.lastSync) $("syncStatus").textContent=`Demo data synced • ${formatDateTime(state.lastSync)}`;
  setInterval(()=>{renderHeader();renderToday();},30000);
}
function showPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const target=$(page);if(target)target.classList.add("active");
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("title").textContent=page==="dashboard"?greeting():page==="assistant"?"AI Campus Assistant":page[0].toUpperCase()+page.slice(1);
  closeMenu();
  window.scrollTo({top:0,behavior:"smooth"});
}
function greeting(){const h=now().getHours();return `${h<12?"Good morning":h<18?"Good afternoon":"Good evening"} 👋`}
function renderAll(){renderHeader();renderTimetable();renderToday();renderAssignments();}
function renderHeader(){ $("title").textContent=$("dashboard").classList.contains("active")?greeting():$("title").textContent; $("date").textContent=now().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric"}); $("secCard").textContent=state.section }
function renderTimetable(){
  const rows=days.map(day=>{
    const a=state.timetable[state.section][day]||[];
    const cells=slots.map(s=>`<div class="tt-cell"><span class="tt-time">${s.label}</span><span class="cell">${escapeHTML(a[s.index]||"Free")}</span></div>`).join("");
    return `<div class="tt-row"><strong>${day}</strong>${cells}</div>`;
  }).join("");
  $("tt").innerHTML=`<div class="tt-head"><strong>Day</strong>${slots.map(s=>`<strong>${s.label}</strong>`).join("")}</div>${rows}`;
}
function renderToday(){
  const day=currentDay(), a=state.timetable[state.section][day]||state.timetable[state.section].Monday||[];
  const entries=slots.map(s=>({subject:a[s.index],time:s.label,...s})).filter(x=>x.subject);
  $("today").innerHTML=entries.map((x,i)=>`<div class="item"><div><b>${escapeHTML(x.subject)}</b><div class="muted">${x.time}</div></div><span class="badge ${i===0?"next-badge":""}">${i===0?"NEXT":"CLASS"}</span></div>`).join("")||"<p>No classes scheduled.</p>";
  const mins=now().getHours()*60+now().getMinutes();
  const next=entries.find(x=>x.start>mins);
  const current=entries.find(x=>mins>=x.start&&mins<x.end);
  const chosen=current||next;
  $("next").textContent=chosen?chosen.subject:"No more classes";
  $("nextTime").textContent=chosen?(current?`In progress • ${chosen.time}`:chosen.time):"Enjoy the rest of your day";
}
function renderAssignments(){
  const pending=state.assignments.filter(x=>x.status!=="Completed");
  $("count").textContent=pending.length;
  $("priority").innerHTML=pending.slice(0,3).map(x=>`<div class="item"><div><b>${escapeHTML(x.title)}</b><div class="muted">${escapeHTML(x.subject)} • ${escapeHTML(x.due)}</div></div><span class="badge ${x.priority==="High"?"high":""}">${escapeHTML(x.priority)}</span></div>`).join("")||"<p>All caught up 🎉</p>";
  $("alist").innerHTML=state.assignments.map((x,i)=>`<div class="assignment"><div><b>${escapeHTML(x.title)}</b><div class="muted">${escapeHTML(x.subject)} • Due ${escapeHTML(x.due)}</div></div><div class="assignment-actions"><span class="badge ${x.status==="Completed"?"done":x.priority==="High"?"high":""}">${x.status==="Completed"?"Completed":escapeHTML(x.priority)}</span><button class="small-btn" type="button" data-toggle="${i}">${x.status==="Completed"?"Undo":"Complete"}</button></div></div>`).join("");
  $("alist").querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",()=>toggle(Number(b.dataset.toggle))));
}
function toggle(i){if(!state.assignments[i])return;state.assignments[i].status=state.assignments[i].status==="Completed"?"Pending":"Completed";persistAssignments();renderAssignments()}
function persistAssignments(){localStorage.setItem("mrduAssignments",JSON.stringify(state.assignments))}
function makePlan(){
  const pending=state.assignments.filter(x=>x.status!=="Completed").slice(0,3),day=currentDay(),a=state.timetable[state.section][day]||[];
  const next=slots.map(s=>({subject:a[s.index],...s})).find(x=>x.subject);
  $("plan").innerHTML=`<ul>${next?`<li>Focus on <b>${escapeHTML(next.subject)}</b> next (${next.label}).</li>`:"<li>No class is scheduled for the current day.</li>"}${pending.map(x=>`<li><b>${escapeHTML(x.priority)}</b>: finish ${escapeHTML(x.title)} — ${escapeHTML(x.due)}.</li>`).join("")}<li>Keep a 45–60 minute focused study block for your highest-priority task.</li></ul>`;
}
async function syncDemo(){
  const btn=$("syncDemoBtn"),status=$("syncStatus");btn.disabled=true;btn.textContent="↻ Syncing…";status.textContent="Syncing the canonical demo dataset…";
  try{const data=await apiJSON("/api/demo-data");if(Array.isArray(data.assignments)){state.assignments=data.assignments.map(x=>({...x}));persistAssignments()}if(data.timetable&&typeof data.timetable==="object"){state.timetable=data.timetable;localStorage.setItem("mrduTimetable",JSON.stringify(data.timetable))}state.lastSync=data.synced_at||new Date().toISOString();localStorage.setItem("mrduDemoSyncedAt",state.lastSync);status.textContent=`Demo data synced • ${formatDateTime(state.lastSync)}`;renderAll()}
  catch(e){status.textContent=`Sync failed: ${e.message}`}
  finally{btn.disabled=false;btn.textContent="↻ Sync demo data"}
}
function formatDateTime(v){return new Date(v).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}
function campusContext(){const day=currentDay(),a=state.timetable[state.section][day]||[];return{section:state.section,day,now:now().toISOString(),timetable:state.timetable,today_schedule:slots.map(s=>a[s.index]?{subject:a[s.index],time:s.label}:null).filter(Boolean),assignments:state.assignments.map(x=>({title:x.title,subject:x.subject,due:x.due,priority:x.priority,status:x.status}))}}
const API_BASE=(()=>{const explicit=new URLSearchParams(location.search).get("api");if(explicit)return explicit.replace(/\/$/,"");if(location.port==="8000"||location.protocol==="file:")return "";return "http://127.0.0.1:8000"})();
async function apiJSON(path,options={}){let r;try{r=await fetch(`${API_BASE}${path}`,{...options,headers:{Accept:"application/json",...(options.headers||{})}})}catch(e){throw new Error("Cannot reach the AI server. Run python server.py on port 8000.")}const type=r.headers.get("content-type")||"";if(!type.includes("application/json")){await r.text();throw new Error(`Server returned ${r.status} instead of JSON.`)}let d;try{d=await r.json()}catch{throw new Error("Server returned invalid JSON.")}if(!r.ok)throw new Error(d.detail||`Request failed (${r.status})`);return d}
async function checkAI(){const s=$("aiStatus");try{const d=await apiJSON("/api/health");s.textContent=d.ai_configured?`AI ready • ${d.model}${d.web_search?" • web available":""}`:"API online • add OPENAI_API_KEY";s.className=`ai-status ${d.ai_configured?"ready":"warn"}`}catch{s.textContent="AI server offline • port 8000";s.className="ai-status warn"}}
function renderMarkdown(text){const root=document.createElement("div");root.className="rich-text";const lines=String(text).split(/\r?\n/);let list=null,code=null;const flush=()=>{if(list){root.appendChild(list);list=null}};for(const line of lines){if(line.startsWith("```")){if(code){const pre=document.createElement("pre"),block=document.createElement("code");block.textContent=code.join("\n");const copy=document.createElement("button");copy.type="button";copy.className="copy-code";copy.textContent="Copy code";copy.addEventListener("click",()=>navigator.clipboard?.writeText(block.textContent));pre.append(block,copy);root.appendChild(pre);code=null}else{flush();code=[]}continue}if(code){code.push(line);continue}if(/^\s*[-*] /.test(line)){if(!list){list=document.createElement("ul");}const item=document.createElement("li");item.textContent=line.replace(/^\s*[-*] /,"");list.appendChild(item);continue}flush();if(!line.trim())continue;const p=document.createElement("p");p.textContent=line;root.appendChild(p)}flush();if(code){const pre=document.createElement("pre"),block=document.createElement("code");block.textContent=code.join("\n");pre.appendChild(block);root.appendChild(pre)}return root}
function addMessage(text,who="assistant"){const div=document.createElement("div");div.className=`msg ${who==="user"?"user":""}`;if(who==="assistant")div.appendChild(renderMarkdown(text));else div.textContent=text;$("chat").appendChild(div);$("chat").scrollTop=$("chat").scrollHeight;return div}
async function ask(){if(state.busy)return;const input=$("q"),button=$("sendBtn"),stop=$("stopBtn"),q=input.value.trim();if(!q)return;state.busy=true;state.controller=new AbortController();addMessage(q,"user");input.value="";input.style.height="auto";input.disabled=true;button.disabled=true;stop.hidden=false;const thinking=addMessage("Generating…");let answer="";try{const response=await fetch(`${API_BASE}/api/chat/stream`,{method:"POST",headers:{Accept:"text/event-stream","Content-Type":"application/json"},body:JSON.stringify({message:q,history:state.history.slice(-12),campus:campusContext()}),signal:state.controller.signal});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).detail||`Request failed (${response.status})`);thinking.remove();const live=addMessage(""),reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});const events=buffer.split("\n\n");buffer=events.pop()||"";for(const event of events){if(!event.startsWith("data:"))continue;const data=JSON.parse(event.slice(5).trim());if(data.error)throw new Error(data.error);answer+=data.delta||"";live.replaceChildren(renderMarkdown(answer));$("chat").scrollTop=$("chat").scrollHeight}if(done)break}if(answer)state.history.push({role:"user",content:q},{role:"assistant",content:answer});state.history=state.history.slice(-24)}catch(e){thinking.remove();if(e.name!=="AbortError")addMessage(`I couldn't get an AI response.\n\n${e.message}`);else if(answer)addMessage(answer)}finally{state.busy=false;state.controller=null;input.disabled=false;button.disabled=false;stop.hidden=true;input.focus()}}
function clearChat(){state.history=[];$("chat").innerHTML='<div class="msg">Chat cleared. Ask me anything.</div>';$("q").focus()}
init();
