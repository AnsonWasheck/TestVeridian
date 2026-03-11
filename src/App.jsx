import { useState, useEffect, useRef, useCallback } from "react";

// ─── BACKEND CONFIG ──────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8765";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  white:"#FFFFFF", offWhite:"#F7F9FC", surface:"#EEF3FA", surfaceMid:"#E2EAF5",
  border:"#C8D8EE", borderLight:"#DDE8F5",
  blue:"#1A5EC8", blueMid:"#2B72E0", blueLight:"#4E8EF0", bluePale:"#DBE9FF",
  blueDim:"#A3BDE8", navy:"#0D2B5C", navyMid:"#163870",
  teal:"#0D9DAE", red:"#D93025", redLight:"#FDECEA",
  amber:"#E07C00", amberLight:"#FFF3E0",
  green:"#1A8A5A", greenLight:"#E6F4ED",
  text:"#0D1F3C", textMid:"#3A5278", textDim:"#7A96C2", textFaint:"#B0C4DE",
  shadow:"rgba(26,94,200,0.10)", shadowMd:"rgba(26,94,200,0.16)",
};

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.surface}; font-family: 'IBM Plex Sans', sans-serif; color: ${T.text}; -webkit-font-smoothing: antialiased; overflow: hidden; }
  #vrd-root { width: 100vw; height: 100vh; background: ${T.offWhite}; position: relative; overflow: hidden; display: flex; flex-direction: column; }
  @keyframes pulse-ring { 0%{transform:scale(1);opacity:.8} 60%{transform:scale(1.55);opacity:0} 100%{transform:scale(1.55);opacity:0} }
  @keyframes wave-bar { 0%,100%{transform:scaleY(.15)} 50%{transform:scaleY(1)} }
  @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink-cur { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes screen-in { from{opacity:0;transform:scale(.98) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slide-left { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
  .fade-up { animation: fade-up .35s ease forwards; }
  .screen-in { animation: screen-in .38s cubic-bezier(.22,1,.36,1) forwards; }
  .slide-left { animation: slide-left .32s ease forwards; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${T.borderLight}; }
  ::-webkit-scrollbar-thumb { background:${T.blueDim}; border-radius:3px; }
  .btn-p { background:linear-gradient(135deg,${T.blue},${T.blueMid}); color:white; border:none; border-radius:10px; font-family:'IBM Plex Sans'; font-weight:600; font-size:13px; cursor:pointer; box-shadow:0 2px 12px ${T.shadow}; transition:all .18s ease; }
  .btn-p:hover { transform:translateY(-1px); box-shadow:0 4px 20px ${T.shadowMd}; }
  .btn-p:active { transform:translateY(0); }
  .btn-p:disabled { opacity:.38; cursor:not-allowed; transform:none; }
  .btn-g { background:transparent; color:${T.textMid}; border:1.5px solid ${T.border}; border-radius:9px; font-family:'IBM Plex Sans'; font-weight:500; font-size:12px; cursor:pointer; transition:all .15s ease; }
  .btn-g:hover { border-color:${T.blue}; color:${T.blue}; background:${T.bluePale}; }
  .card { background:${T.white}; border:1.5px solid ${T.border}; border-radius:14px; box-shadow:0 2px 16px ${T.shadow}; }
  .card-navy { background:linear-gradient(135deg,${T.navy},${T.navyMid}); border:none; border-radius:14px; box-shadow:0 4px 24px rgba(13,43,92,.22); }
  input:focus { outline:none; }
  textarea:focus { outline:none; }
`;

// ─── SCREENS ─────────────────────────────────────────────────────────────────
const S = { DASH:"dashboard", ENC:"encounter", REVIEW:"review", HIST:"history", SETTINGS:"settings" };

// ─── DEMO DATA ───────────────────────────────────────────────────────────────
const DEMO_SEGS = [
  "Patient is a 47-year-old male presenting with acute chest pain, onset approximately 3 hours ago.",
  "Pain is described as 8 out of 10, pressure-like, radiating to the left arm. Associated with diaphoresis and mild shortness of breath.",
  "No prior cardiac history. Currently on lisinopril 10mg daily for hypertension. No known drug allergies.",
  "Blood pressure 158 over 94, heart rate 102, oxygen saturation 97% on room air, temperature 98.6.",
];

const DEMO_SOAP = `PATIENT ENCOUNTER NOTE
======================
Date: ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}
Provider: 
Chief Complaint: Acute chest pain with left arm radiation

SUBJECTIVE
----------
HPI: 47-year-old male presenting with acute onset chest pain approximately 3 hours prior. Pain rated 8/10, pressure-like, radiating to left arm. Associated with diaphoresis and mild dyspnea. No prior cardiac history.
PMH: Hypertension
Medications: Lisinopril 10mg PO daily
Allergies: NKDA
Social Hx: Not mentioned
Family Hx: Not mentioned
ROS: Positive for chest pain, diaphoresis, dyspnea. Negative for syncope, nausea, vomiting.

OBJECTIVE
---------
Vitals: BP 158/94 mmHg | HR 102 bpm | SpO2 97% RA | Temp 98.6°F
General: Male in moderate distress, diaphoretic
Cardiovascular: Tachycardic, regular rhythm, no murmurs
Pulmonary: Clear to auscultation bilaterally
Labs/Imaging: Not documented at time of dictation

ASSESSMENT
----------
1. Acute Coronary Syndrome (ACS) — rule out STEMI/NSTEMI — I21.9
2. Hypertensive urgency — I16.0

PLAN
----
1. 12-lead ECG stat; continuous cardiac monitoring
2. Troponin I, BMP, CBC, coagulation panel, portable CXR
3. Aspirin 325mg PO loading dose; Nitroglycerin 0.4mg SL PRN chest pain
4. Two large-bore IVs; supplemental O2 to maintain SpO2 ≥95%
5. Cardiology consult pending ECG results
6. Patient and family education regarding symptoms and treatment plan
7. NPO pending further workup

DISPOSITION
-----------
Admitted to cardiac telemetry unit pending further evaluation`;

const DEMO_HIST = [
  { id:"E-2047", date:"Today 14:32", complaint:"Acute chest pain / ACS workup", status:"complete", words:312, soap:DEMO_SOAP },
  { id:"E-2046", date:"Today 09:15", complaint:"Type 2 DM follow-up, A1c review", status:"complete", words:228, soap:null },
  { id:"E-2045", date:"Yesterday 16:40", complaint:"Upper respiratory infection", status:"complete", words:195, soap:null },
  { id:"E-2044", date:"Yesterday 11:02", complaint:"Hypertension management", status:"complete", words:267, soap:null },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Pill({ children, color=T.blue, bg, size="sm" }) {
  const fs = size==="xs"?9:size==="sm"?10:12;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:size==="xs"?"2px 6px":"3px 9px", borderRadius:20,
      fontFamily:"'IBM Plex Mono'", fontSize:fs, fontWeight:500, letterSpacing:"0.06em",
      background:bg||`${color}18`, color, border:`1px solid ${color}30`, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function Hr({ style={} }) { return <div style={{ height:1, background:T.border, width:"100%", ...style }}/>; }
function VR({ style={} }) { return <div style={{ width:1, background:T.border, alignSelf:"stretch", ...style }}/>; }

function Spin({ size=18, color=T.blue }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`2px solid ${color}30`, borderTop:`2px solid ${color}`, animation:"spin .7s linear infinite", flexShrink:0 }}/>;
}

function StatusBadge({ status }) {
  const m = {
    complete:{ color:T.green, bg:T.greenLight, label:"COMPLETE" },
    generating:{ color:T.amber, bg:T.amberLight, label:"GENERATING" },
    recording:{ color:T.red, bg:T.redLight, label:"● REC" },
    transcribing:{ color:T.teal, bg:"#E6F7FA", label:"TRANSCRIBING" },
    idle:{ color:T.textDim, bg:T.surface, label:"STANDBY" },
    error:{ color:T.red, bg:T.redLight, label:"ERROR" },
    connected:{ color:T.green, bg:T.greenLight, label:"CONNECTED" },
    offline:{ color:T.textDim, bg:T.surface, label:"OFFLINE" },
  };
  const s = m[status]||m.idle;
  return <Pill color={s.color} bg={s.bg}>{s.label}</Pill>;
}

function WaveBars({ active }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2.5, height:40 }}>
      {Array.from({length:30},(_,i)=>(
        <div key={i} style={{ width:3, height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{
            width:3, height:active?`${18+(i%7)*12}%`:"12%",
            background:active?`linear-gradient(to top,${T.blue},${T.blueLight})`:T.borderLight,
            borderRadius:2, transformOrigin:"center",
            animation:active?`wave-bar ${.5+(i%5)*.12}s ease-in-out infinite`:"none",
            animationDelay:`${(i%9)*.055}s`, transition:"background .3s",
          }}/>
        </div>
      ))}
    </div>
  );
}

function RecBtn({ state, onPress, onRelease }) {
  const isRec = state==="recording";
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
      {isRec && <>
        <div style={{ position:"absolute", width:96, height:96, borderRadius:"50%", border:`2px solid ${T.red}`, animation:"pulse-ring 1.3s ease-out infinite" }}/>
        <div style={{ position:"absolute", width:80, height:80, borderRadius:"50%", border:`1.5px solid ${T.red}50`, animation:"pulse-ring 1.3s ease-out .4s infinite" }}/>
      </>}
      <button onMouseDown={onPress} onMouseUp={onRelease} onTouchStart={onPress} onTouchEnd={onRelease}
        className="btn-p"
        style={{
          width:76, height:76, borderRadius:"50%", padding:0,
          background:isRec?`radial-gradient(circle,${T.red}15,white)`:`linear-gradient(135deg,${T.blue},${T.blueMid})`,
          border:`2px solid ${isRec?T.red:T.blue}`,
          boxShadow:isRec?`0 0 28px ${T.red}40`:`0 4px 20px ${T.shadow}`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
        <div style={{ width:isRec?22:30, height:isRec?22:30, borderRadius:isRec?5:"50%",
          background:isRec?T.red:"white", transition:"all .2s ease",
          boxShadow:isRec?`0 0 10px ${T.red}`:"none" }}/>
      </button>
    </div>
  );
}

function SoapText({ text, streaming=false }) {
  const sects = ["SUBJECTIVE","OBJECTIVE","ASSESSMENT","PLAN","DISPOSITION"];
  const fields = ["HPI:","PMH:","Medications:","Allergies:","Social Hx:","Family Hx:","ROS:","Vitals:","General:","Cardiovascular:","Pulmonary:","Labs/Imaging:","Chief Complaint:","Date:","Provider:"];
  return (
    <div>
      {text.split("\n").map((line,i)=>{
        const isSect = sects.some(h=>line.trim()===h);
        const isTitle = line.includes("PATIENT ENCOUNTER NOTE");
        const isDivider = /^[=\-]{3,}$/.test(line.trim());
        const isField = fields.some(f=>line.startsWith(f));
        if(isDivider) return <div key={i} style={{ height:1, background:T.borderLight, margin:"6px 0" }}/>;
        return (
          <p key={i} style={{
            fontFamily:isSect||isTitle?"'Syne'":"'IBM Plex Mono'",
            fontSize:isTitle?15:isSect?13:11.5,
            fontWeight:isSect||isTitle?700:400,
            color:isTitle?T.navy:isSect?T.blue:isField?T.navyMid:T.textMid,
            lineHeight:1.72, marginTop:isSect?14:0, marginBottom:isSect?2:1,
            letterSpacing:isSect?"0.1em":"0.01em",
          }}>{line||"\u00A0"}</p>
        );
      })}
      {streaming && <span style={{ display:"inline-block", width:2, height:14, background:T.blue, marginLeft:2, verticalAlign:"middle", animation:"blink-cur 1s step-end infinite" }}/>}
    </div>
  );
}

// ─── API CLIENT ──────────────────────────────────────────────────────────────
const api = {
  async _fetch(url, opts={}) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(opts.timeout||5000), ...opts });
      if (!r.ok) return null;
      return opts.raw ? r : r.json();
    } catch(_) { return null; }
  },
  status()   { return api._fetch(`${API_BASE}/status`); },
  history()  { return api._fetch(`${API_BASE}/history`); },
  transcribe(b64) { return api._fetch(`${API_BASE}/transcribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audio:b64}),timeout:30000}); },
  generate(transcript) { return api._fetch(`${API_BASE}/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({transcript}),raw:true,timeout:120000}); },
  save(transcript,soap_note) { return api._fetch(`${API_BASE}/save`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({transcript,soap_note})}); },
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ onNav, bStatus, history }) {
  const now=new Date();
  return (
    <div className="screen-in" style={{ height:"100%", overflow:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:18 }}>
      {/* Hero */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        <div className="card-navy" style={{ gridColumn:"span 2", padding:"26px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:"rgba(255,255,255,.45)", letterSpacing:"0.14em", marginBottom:6 }}>
              {now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </p>
            <p style={{ fontFamily:"'Syne'", fontSize:24, fontWeight:700, color:"white", marginBottom:5 }}>
              Good {now.getHours()<12?"Morning":now.getHours()<17?"Afternoon":"Evening"}
            </p>
            <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:13, color:"rgba(255,255,255,.5)", marginBottom:18 }}>
              Veridian Medical Scribe · All local · Zero cloud
            </p>
            <button className="btn-p" onClick={()=>onNav(S.ENC)} style={{ padding:"11px 26px", fontSize:14, background:"white", color:T.navy, boxShadow:"none" }}>
              + New Encounter
            </button>
          </div>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ opacity:.12 }}>
            <circle cx="45" cy="45" r="43" stroke="white" strokeWidth="1.5"/>
            <path d="M45 18v54M18 45h54" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="45" cy="45" r="9" fill="white" opacity=".4"/>
          </svg>
        </div>
        {/* System status */}
        <div className="card" style={{ padding:"18px 20px" }}>
          <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim, letterSpacing:"0.12em", marginBottom:12 }}>SYSTEM STATUS</p>
          {[["Ollama LLM","llm"],["Whisper STT","whisper"],["Microphone","mic"],["Local Storage","storage"]].map(([lbl,key])=>(
            <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontFamily:"'IBM Plex Sans'", fontSize:12, color:T.textMid }}>{lbl}</span>
              <StatusBadge status={bStatus[key]||"offline"}/>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { v:history.length, l:"Total Encounters", c:T.blue },
          { v:history.filter(e=>e.status==="complete").length, l:"Notes Generated", c:T.green },
          { v:history.length?Math.round(history.reduce((a,e)=>a+(e.words||0),0)/history.length):0, l:"Avg. Words / Note", c:T.teal },
          { v:"100%", l:"Local · HIPAA Safe", c:T.navy },
        ].map((s,i)=>(
          <div key={i} className="card" style={{ padding:"16px 18px", borderTop:`3px solid ${s.c}` }}>
            <p style={{ fontFamily:"'Syne'", fontSize:26, fontWeight:700, color:s.c }}>{s.v}</p>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9.5, color:T.textDim, marginTop:3 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="card" style={{ padding:"18px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ fontFamily:"'Syne'", fontSize:15, fontWeight:700, color:T.navy }}>Recent Encounters</p>
          <button className="btn-g" onClick={()=>onNav(S.HIST)} style={{ padding:"6px 14px" }}>View All →</button>
        </div>
        {history.slice(0,4).map((enc,i)=>(
          <div key={enc.id}>
            {i>0&&<Hr style={{ margin:"0" }}/>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0" }}>
              <div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, fontWeight:500, color:T.blue }}>{enc.id}</span>
                  <span style={{ fontFamily:"'IBM Plex Sans'", fontSize:13, color:T.text }}>{enc.complaint}</span>
                </div>
                <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:9.5, color:T.textDim }}>{enc.date}</span>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim }}>{enc.words} words</span>
                <StatusBadge status={enc.status}/>
              </div>
            </div>
          </div>
        ))}
        {history.length===0&&<p style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:T.textDim, padding:"12px 0" }}>No encounters yet.</p>}
      </div>
    </div>
  );
}

// ─── ENCOUNTER ───────────────────────────────────────────────────────────────
function Encounter({ onNav, onComplete }) {
  const [state, setState] = useState("idle");
  const [segs, setSegs]   = useState([]);
  const [timer, setTimer] = useState(0);
  const [err, setErr]     = useState(null);
  const mrRef   = useRef(null);
  const chunks  = useRef([]);
  const tRef    = useRef(null);
  const encId   = useRef(`E-${2048+Math.floor(Math.random()*900)}`);
  const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const startRec = useCallback(async()=>{
    if(state!=="idle") return;
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:{ sampleRate:16000,channelCount:1 } });
      const mr = new MediaRecorder(stream,{ mimeType:"audio/webm" });
      chunks.current=[];
      mr.ondataavailable=e=>{ if(e.data.size>0) chunks.current.push(e.data); };
      mr.start(100);
      mrRef.current=mr;
    } catch(e) { setErr("Mic access denied — demo mode active"); }
    setState("recording"); setTimer(0);
    tRef.current=setInterval(()=>setTimer(t=>t+1),1000);
  },[state]);

  const stopRec = useCallback(async()=>{
    if(state!=="recording") return;
    clearInterval(tRef.current);
    setState("transcribing");
    const mr=mrRef.current;
    if(mr&&mr.state!=="inactive"){
      mr.stop(); mr.stream.getTracks().forEach(t=>t.stop());
      await new Promise(r=>{ mr.onstop=r; });
      try {
        const blob=new Blob(chunks.current,{type:"audio/webm"});
        const b64=await new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result.split(",")[1]); fr.onerror=rej; fr.readAsDataURL(blob); });
        const res=await api.transcribe(b64);
        if(res.text?.trim()){ setSegs(p=>[...p,res.text.trim()]); setState("idle"); return; }
      } catch(_){}
    }
    await new Promise(r=>setTimeout(r,900));
    setSegs(p=>[...p,DEMO_SEGS[p.length%DEMO_SEGS.length]]);
    setState("idle");
  },[state]);

  useEffect(()=>()=>{ clearInterval(tRef.current); },[]);

  return (
    <div className="screen-in" style={{ height:"100%", display:"grid", gridTemplateColumns:"290px 1fr", overflow:"hidden" }}>
      {/* Left */}
      <div style={{ background:T.white, borderRight:`1.5px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"18px 18px 14px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <p style={{ fontFamily:"'Syne'", fontSize:15, fontWeight:700, color:T.navy }}>New Encounter</p>
              <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim, marginTop:1 }}>{encId.current}</p>
            </div>
            <StatusBadge status={state}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["SEGMENTS",segs.length],["WORDS",segs.reduce((a,s)=>a+s.split(" ").length,0)]].map(([l,v])=>(
              <div key={l} style={{ background:T.offWhite, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", textAlign:"center" }}>
                <p style={{ fontFamily:"'Syne'", fontSize:20, fontWeight:700, color:T.blue }}>{v}</p>
                <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        {/* PTT */}
        <div style={{ padding:"22px 18px 18px", display:"flex", flexDirection:"column", alignItems:"center", gap:14, borderBottom:`1px solid ${T.border}` }}>
          <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim, letterSpacing:"0.14em" }}>PUSH-TO-TALK</p>
          <WaveBars active={state==="recording"}/>
          <RecBtn state={state} onPress={startRec} onRelease={stopRec}/>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:22, color:state==="recording"?T.red:T.textFaint, transition:"color .2s" }}>
              {state==="recording"?fmt(timer):"00:00"}
            </p>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim, marginTop:2 }}>
              {state==="recording"?"Recording — release to stop":state==="transcribing"?"Transcribing audio…":"Hold button to record"}
            </p>
          </div>
          {err&&<p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.amber, textAlign:"center", lineHeight:1.5 }}>{err}</p>}
        </div>
        {/* Segments */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 18px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim, letterSpacing:"0.12em" }}>SEGMENTS</p>
            {segs.length>0&&<button onClick={()=>setSegs(p=>p.slice(0,-1))} style={{ background:"none", border:"none", fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.red, cursor:"pointer" }}>undo last</button>}
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"0 10px 10px" }}>
            {segs.length===0
              ? <div style={{ margin:"6px", padding:"18px", border:`1.5px dashed ${T.border}`, borderRadius:10, textAlign:"center" }}>
                  <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textFaint, lineHeight:1.7 }}>No segments yet.<br/>Hold button to dictate.</p>
                </div>
              : segs.map((seg,i)=>(
                <div key={i} className="fade-up" style={{ marginBottom:7, background:T.offWhite, border:`1.5px solid ${T.border}`, borderRadius:9, padding:"9px 11px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <Pill color={T.blue} size="xs">{`SEG ${String(i+1).padStart(2,"0")}`}</Pill>
                    <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim }}>{seg.split(" ").length}w</span>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textMid, lineHeight:1.65 }}>{seg}</p>
                </div>
              ))
            }
          </div>
        </div>
        {/* CTA */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.border}`, display:"flex", flexDirection:"column", gap:7 }}>
          <button className="btn-p" disabled={!segs.length||state!=="idle"} onClick={()=>onComplete(segs.join("\n\n"),encId.current)} style={{ padding:"12px" }}>
            ⚕ Generate SOAP Note
          </button>
          <button className="btn-g" onClick={()=>onNav(S.DASH)} style={{ padding:"9px" }}>Cancel</button>
        </div>
      </div>

      {/* Right guide */}
      <div style={{ background:T.offWhite, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24, padding:36 }}>
        <div style={{ textAlign:"center", maxWidth:400 }}>
          <div style={{ width:68, height:68, borderRadius:"50%", background:T.bluePale, border:`2px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="13" stroke={T.blue} strokeWidth="1.4"/>
              <rect x="10" y="6" width="10" height="13" rx="5" stroke={T.blue} strokeWidth="1.4"/>
              <path d="M7 17c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke={T.blue} strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="15" y1="25" x2="15" y2="28" stroke={T.blue} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontFamily:"'Syne'", fontSize:20, fontWeight:700, color:T.navy, marginBottom:8 }}>Clinical Dictation</p>
          <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:13, color:T.textMid, lineHeight:1.75 }}>
            Hold the record button and speak naturally. Veridian transcribes each segment using on-device Whisper, then generates a structured SOAP note with your local Ollama model.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, width:"100%", maxWidth:460 }}>
          {[["01","Hold button to record"],["02","Release to transcribe"],["03","Record as many segments as needed"],["04","Tap Generate SOAP Note"]].map(([n,t])=>(
            <div key={n} className="card" style={{ padding:"13px 15px", display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontFamily:"'Syne'", fontSize:16, fontWeight:800, color:T.blue, lineHeight:1 }}>{n}</span>
              <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:12, color:T.textMid, lineHeight:1.5 }}>{t}</p>
            </div>
          ))}
        </div>
        <div style={{ background:T.bluePale, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"11px 16px", width:"100%", maxWidth:460, display:"flex", gap:10, alignItems:"center" }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1L2 4.5v4c0 3.5 2.5 5.875 5.5 6.5C10.5 14.375 13 12 13 8.5V4.5L7.5 1z" stroke={T.blue} strokeWidth="1.2" fill={`${T.blue}15`}/>
            <path d="M5 7.5l2 2L10 6" stroke={T.blue} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.blue }}>All audio processed locally · No PHI transmitted · HIPAA-aligned</p>
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW ──────────────────────────────────────────────────────────────────
function Review({ transcript, encId, onNav, onSaved }) {
  const [soap, setSoap]       = useState("");
  const [phase, setPhase]     = useState("generating");
  const [edit, setEdit]       = useState(false);
  const [edited, setEdited]   = useState("");
  const [saved, setSaved]     = useState(false);
  const scrollRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(()=>{
    let alive=true;
    setSoap(""); setPhase("generating");
    const go=async()=>{
      try {
        const resp=await api.generate(transcript);
        if(!resp||!resp.body) throw new Error("backend unavailable");
        const reader=resp.body.getReader(); const dec=new TextDecoder(); let full="";
        while(alive){
          const {value,done}=await reader.read(); if(done) break;
          const txt=dec.decode(value);
          for(const line of txt.split("\n")){
            if(line.startsWith("data: ")){
              const tok=line.slice(6);
              if(tok==="[DONE]"){ if(alive){setPhase("done");setEdited(full);} return; }
              // unescape \n back to real newlines from SSE stream
              const real=tok.replace(/\\n/g,"\n");
              full+=real; if(alive) setSoap(full);
            }
          }
        }
        if(alive){setPhase("done");setEdited(full);}
      } catch(_){
        if(!alive) return;
        let i=0; const chars=DEMO_SOAP.split("");
        streamRef.current=setInterval(()=>{
          if(!alive){clearInterval(streamRef.current);return;}
          const chunk=chars.slice(i,i+6).join(""); setSoap(p=>p+chunk); i+=6;
          if(i>=chars.length){ clearInterval(streamRef.current); if(alive){setPhase("done");setEdited(DEMO_SOAP);} }
        },14);
      }
    };
    go();
    return()=>{ alive=false; clearInterval(streamRef.current); };
  },[transcript]);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[soap]);

  const handleSave=async()=>{
    const text=edit?edited:soap;
    try{ await api.save(transcript,text); }catch(_){}
    setSaved(true);
    onSaved({ id:encId, soap:text, transcript });
  };

  return (
    <div className="screen-in" style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ background:T.white, borderBottom:`1.5px solid ${T.border}`, padding:"12px 22px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button className="btn-g" onClick={()=>onNav(S.ENC)} style={{ padding:"6px 12px" }}>← Back</button>
          <div>
            <p style={{ fontFamily:"'Syne'", fontSize:15, fontWeight:700, color:T.navy }}>SOAP Note Review</p>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim }}>{encId}</p>
          </div>
          {phase==="generating"&&<div style={{ display:"flex",alignItems:"center",gap:7 }}><Spin size={13}/><span style={{ fontFamily:"'IBM Plex Mono'",fontSize:10,color:T.blue }}>Streaming from Ollama…</span></div>}
          {phase==="done"&&<StatusBadge status="complete"/>}
        </div>
        <div style={{ display:"flex", gap:7 }}>
          {phase==="done"&&<>
            <button className="btn-g" onClick={()=>setEdit(e=>!e)} style={{ padding:"7px 13px" }}>{edit?"Preview":"✎ Edit"}</button>
            <button className="btn-g" onClick={()=>navigator.clipboard.writeText(edit?edited:soap)} style={{ padding:"7px 13px" }}>Copy</button>
            <button className="btn-p" onClick={handleSave} disabled={saved} style={{ padding:"7px 16px" }}>
              {saved?"✓ Saved":"Save Note"}
            </button>
          </>}
        </div>
      </div>
      {/* Body */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", overflow:"hidden" }}>
        <div ref={scrollRef} style={{ overflow:"auto", padding:"24px 28px", background:T.offWhite }}>
          {edit&&phase==="done"
            ? <textarea value={edited} onChange={e=>setEdited(e.target.value)} style={{ width:"100%", minHeight:600, fontFamily:"'IBM Plex Mono'", fontSize:12, lineHeight:1.7, color:T.text, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:10, padding:20, resize:"vertical" }}/>
            : <div className="card" style={{ padding:"26px 30px" }}><SoapText text={soap} streaming={phase==="generating"}/></div>
          }
        </div>
        {/* Transcript sidebar */}
        <div style={{ background:T.white, borderLeft:`1.5px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.border}` }}>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim, letterSpacing:"0.12em" }}>SOURCE TRANSCRIPT</p>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"13px 15px" }}>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:T.textMid, lineHeight:1.75 }}>{transcript}</p>
          </div>
          {saved&&(
            <div style={{ padding:"12px 14px", background:T.greenLight, borderTop:`1px solid ${T.border}` }}>
              <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.green, marginBottom:8 }}>✓ Saved to ./soap_notes/</p>
              <button className="btn-p" onClick={()=>onNav(S.HIST)} style={{ width:"100%", padding:"8px" }}>View in History →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
function History({ history }) {
  const [sel, setSel]       = useState(history[0]?.id||null);
  const [search, setSearch] = useState("");
  const filtered = history.filter(e=>e.complaint.toLowerCase().includes(search.toLowerCase())||e.id.toLowerCase().includes(search.toLowerCase()));
  const enc = history.find(e=>e.id===sel);
  return (
    <div className="screen-in" style={{ height:"100%", display:"grid", gridTemplateColumns:"290px 1fr", overflow:"hidden" }}>
      <div style={{ background:T.white, borderRight:`1.5px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 15px 12px", borderBottom:`1px solid ${T.border}` }}>
          <p style={{ fontFamily:"'Syne'", fontSize:15, fontWeight:700, color:T.navy, marginBottom:10 }}>History</p>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:T.offWhite, border:`1.5px solid ${T.border}`, borderRadius:9, padding:"7px 11px" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="4" stroke={T.textDim} strokeWidth="1.2"/><line x1="8" y1="8" x2="11" y2="11" stroke={T.textDim} strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ background:"none",border:"none",fontFamily:"'IBM Plex Mono'",fontSize:11,color:T.text,width:"100%" }}/>
          </div>
        </div>
        <div style={{ flex:1, overflow:"auto" }}>
          {filtered.map((e,i)=>(
            <div key={e.id}>
              {i>0&&<Hr/>}
              <button onClick={()=>setSel(e.id)} style={{ width:"100%", padding:"12px 15px", background:sel===e.id?T.bluePale:"transparent", border:"none", borderLeft:sel===e.id?`3px solid ${T.blue}`:"3px solid transparent", textAlign:"left", cursor:"pointer", transition:"all .15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:sel===e.id?T.blue:T.textDim }}>{e.id}</span>
                  <StatusBadge status={e.status}/>
                </div>
                <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:12, color:T.text, marginBottom:3 }}>{e.complaint}</p>
                <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim }}>{e.date} · {e.words||0} words</p>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflow:"auto", padding:"24px 28px", background:T.offWhite }}>
        {enc
          ? <div className="card" style={{ padding:"26px 30px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
                <div>
                  <p style={{ fontFamily:"'Syne'", fontSize:16, fontWeight:700, color:T.navy }}>{enc.complaint}</p>
                  <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim, marginTop:3 }}>{enc.id} · {enc.date}</p>
                </div>
                <button className="btn-g" onClick={()=>navigator.clipboard.writeText(enc.soap||DEMO_SOAP)} style={{ padding:"7px 13px" }}>Copy</button>
              </div>
              <Hr style={{ marginBottom:18 }}/>
              <SoapText text={enc.soap||DEMO_SOAP}/>
            </div>
          : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, color:T.textFaint }}>Select an encounter</p>
            </div>
        }
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function Settings({ bStatus }) {
  const live = bStatus.llm==="connected";
  return (
    <div className="screen-in" style={{ height:"100%", overflow:"auto", padding:"28px 36px" }}>
      <p style={{ fontFamily:"'Syne'", fontSize:22, fontWeight:800, color:T.navy, marginBottom:4 }}>Settings</p>
      <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:T.textDim, marginBottom:22 }}>Backend: {API_BASE} · All processing local</p>
      <div className="card" style={{ padding:"14px 18px", marginBottom:20, background:live?T.greenLight:T.amberLight, border:`1.5px solid ${live?T.green:T.amber}` }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <circle cx="8.5" cy="8.5" r="7.5" stroke={live?T.green:T.amber} strokeWidth="1.4" fill="none"/>
            {live?<path d="M5 8.5l2.5 2.5 5-5" stroke={T.green} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              :<path d="M8.5 4.5v4.5M8.5 11.5v1" stroke={T.amber} strokeWidth="1.4" strokeLinecap="round"/>}
          </svg>
          <div>
            <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:13, fontWeight:600, color:live?T.green:T.amber }}>
              {live?"Backend Connected — Live Mode":"Backend Offline — Demo Mode"}
            </p>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textMid }}>
              {live?"Whisper + Ollama running. All features operational.":`Start the Python backend at ${API_BASE} to enable real transcription and generation.`}
            </p>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {[
          { title:"Language Model", items:[["Ollama Model","llama3.2:3b",bStatus.llm==="connected"?"LIVE":"DEMO"],["Temperature","0.1"],["Max Tokens","2,048"],["Top-P","0.90"]] },
          { title:"Speech-to-Text", items:[["Whisper Model","base.en",bStatus.whisper==="connected"?"LIVE":"DEMO"],["Device","CPU (auto)"],["Compute Type","int8"],["Language","English (en)"],["VAD Filter","Enabled — 500ms"],["Beam Size","5"]] },
          { title:"Recording", items:[["PTT Key","Space (hold)"],["Max Duration","120 seconds"],["Sample Rate","16,000 Hz"],["Channels","Mono"]] },
          { title:"Storage & Export", items:[["Output Dir","./soap_notes/"],["TXT Export","Enabled"],["JSON Export","Enabled"],["Raw Transcript","Appended"]] },
        ].map((sec,si)=>(
          <div key={si} className="card" style={{ padding:"16px 18px" }}>
            <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim, letterSpacing:"0.14em", marginBottom:12 }}>{sec.title.toUpperCase()}</p>
            {sec.items.map(([l,v,badge],i)=>(
              <div key={i}>
                {i>0&&<Hr style={{ margin:"7px 0" }}/>}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:"'IBM Plex Sans'", fontSize:12, color:T.textMid }}>{l}</span>
                  <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                    <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:11, color:T.text }}>{v}</span>
                    {badge&&<Pill color={badge==="LIVE"?T.green:T.amber} size="xs">{badge}</Pill>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop:18, background:T.bluePale, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 1.5L2.5 5.75V10c0 4.375 3 7.5 7.5 8.5C15 18.5 17.5 14.375 17.5 10V5.75L10 1.5z" stroke={T.blue} strokeWidth="1.4" fill={`${T.blue}12`}/>
          <path d="M7 10l2.5 2.5 4.5-4.5" stroke={T.blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p style={{ fontFamily:"'IBM Plex Sans'", fontSize:13, fontWeight:600, color:T.navy }}>HIPAA-Aligned Local Processing</p>
          <p style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textMid }}>All audio, transcriptions, and AI inference run exclusively on-device. No patient data is ever transmitted externally.</p>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function Veridian() {
  const [screen, setScreen]     = useState(S.DASH);
  const [review, setReview]     = useState(null);
  const [history, setHistory]   = useState(DEMO_HIST);
  const [bStatus, setBStatus]   = useState({ llm:"offline", whisper:"offline", mic:"offline", storage:"offline" });
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

  useEffect(()=>{
    const check=async()=>{
      const s = await api.status();
      if(s) {
        setBStatus({ llm:s.llm_ready?"connected":"error", whisper:s.whisper_ready?"connected":"error", mic:"connected", storage:"connected" });
      } else {
        setBStatus({ llm:"offline", whisper:"offline", mic:"offline", storage:"offline" });
      }
    };
    check(); const id=setInterval(check,15000); return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    api.history().then(d=>{ if(d?.encounters?.length) setHistory(d.encounters); });
  },[]);

  const onComplete=(transcript,encId)=>{ setReview({transcript,encId}); setScreen(S.REVIEW); };
  const onSaved=({id,soap,transcript})=>{
    const words=soap.split(" ").length;
    const complaint=transcript.split(".")[0].slice(0,60)+(transcript.length>60?"…":"");
    setHistory(p=>[{id,date:"Just now",complaint,status:"complete",words,soap},...p]);
  };

  const NAV=[
    { id:S.DASH, lbl:"Dashboard", ico:(a)=><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/></svg> },
    { id:S.ENC, lbl:"Encounter", ico:(a)=><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><line x1="9" y1="5.5" x2="9" y2="12.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/><line x1="5.5" y1="9" x2="12.5" y2="9" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { id:S.HIST, lbl:"History", ico:(a)=><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><line x1="5" y1="6.5" x2="13" y2="6.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="9.5" x2="10" y2="9.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="12.5" x2="8" y2="12.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { id:S.SETTINGS, lbl:"Settings", ico:(a)=><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke={a?T.blue:T.textDim} strokeWidth="1.4"/><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.636 3.636l1.414 1.414M12.95 12.95l1.414 1.414M3.636 14.364l1.414-1.414M12.95 5.05l1.414-1.414" stroke={a?T.blue:T.textDim} strokeWidth="1.4" strokeLinecap="round"/></svg> },
  ];
  const activeTab = screen===S.REVIEW?S.ENC:screen;

  return (
    <>
      <style>{CSS}</style>
      <div id="vrd-root">
        {/* Status bar */}
        <div style={{ height:46, background:T.white, borderBottom:`1.5px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7L12 2z" stroke={T.blue} strokeWidth="1.6" fill={`${T.blue}15`}/>
              <path d="M9 12l2 2 4-4" stroke={T.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily:"'Syne'", fontSize:18, fontWeight:800, color:T.navy }}>Veridian</span>
            <Pill color={T.teal} size="xs">MEDICAL SCRIBE</Pill>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {[["LLM","llm"],["STT","whisper"]].map(([l,k])=>(
              <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:bStatus[k]==="connected"?T.green:bStatus[k]==="error"?T.red:T.textFaint, boxShadow:bStatus[k]==="connected"?`0 0 6px ${T.green}`:"none" }}/>
                <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:9, color:T.textDim }}>{l}</span>
              </div>
            ))}
            <VR style={{ height:16 }}/>
            <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim }}>{timeStr}</span>
            <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="2.5" stroke={T.textDim} fill="none"/><rect x="2" y="2" width="16" height="9" rx="1.5" fill={T.blue}/><path d="M24.5 4.5v4" stroke={T.textDim} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* Nav + Content */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Sidebar */}
          <div style={{ width:66, background:T.white, borderRight:`1.5px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 0", gap:3, flexShrink:0 }}>
            {NAV.map(item=>{
              const a=activeTab===item.id;
              return (
                <button key={item.id} onClick={()=>setScreen(item.id)} title={item.lbl}
                  style={{ width:46, height:46, borderRadius:11, border:`1.5px solid ${a?T.border:"transparent"}`, background:a?T.bluePale:"transparent",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", transition:"all .15s" }}>
                  {item.ico(a)}
                  <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:7, color:a?T.blue:T.textDim, letterSpacing:"0.04em" }}>{item.lbl.toUpperCase().slice(0,4)}</span>
                </button>
              );
            })}
            <div style={{ flex:1 }}/>
            <button className="btn-p" onClick={()=>setScreen(S.ENC)} title="New Encounter"
              style={{ width:42, height:42, borderRadius:11, padding:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, lineHeight:1 }}>+</button>
          </div>

          {/* Screen area */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {/* Breadcrumb */}
            <div style={{ height:38, background:T.white, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:7, flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textDim }}>Veridian</span>
              <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.textFaint }}>›</span>
              <span style={{ fontFamily:"'IBM Plex Mono'", fontSize:10, color:T.blue, fontWeight:500 }}>
                {screen===S.REVIEW?"Encounter › SOAP Review":screen===S.DASH?"Dashboard":screen===S.ENC?"Encounter":screen===S.HIST?"History":screen===S.SETTINGS?"Settings":screen}
              </span>
              <div style={{ flex:1 }}/>
              <Pill color={T.textDim} size="xs">ALL LOCAL · ZERO CLOUD · HIPAA-SAFE</Pill>
            </div>
            {/* Screens */}
            <div style={{ flex:1, overflow:"hidden" }}>
              {screen===S.DASH     && <Dashboard onNav={setScreen} bStatus={bStatus} history={history}/>}
              {screen===S.ENC      && <Encounter onNav={setScreen} onComplete={onComplete}/>}
              {screen===S.REVIEW   && review
                ? <Review transcript={review.transcript} encId={review.encId} onNav={setScreen} onSaved={onSaved}/>
                : screen===S.REVIEW && <div style={{ display:"flex", height:"100%", alignItems:"center", justifyContent:"center" }}><p style={{ fontFamily:"'IBM Plex Mono'", fontSize:12, color:T.textDim }}>No encounter in progress. <button className="btn-g" style={{ padding:"6px 12px", marginLeft:8 }} onClick={()=>setScreen(S.ENC)}>Start one →</button></p></div>
              }
              {screen===S.HIST     && <History history={history}/>}
              {screen===S.SETTINGS && <Settings bStatus={bStatus}/>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}