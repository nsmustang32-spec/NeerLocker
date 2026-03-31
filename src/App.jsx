import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VERSION   = "1.0.3";
const BUILD_TAG = "Beta";

// ─── PATCH NOTES ─────────────────────────────────────────────────────────────
const PATCH_NOTES = {
  "1.0.3": [
    "DMs: Fixed messages not sending (saveDMs naming mismatch)",
    "Tasks: Fixed description not saving to Supabase",
    "Status: Fixed users appearing online when they are not",
    "Patch notes: Removed 0.4.0–0.4.7 entries to save space",
  ],
  "1.0.2": [
    "Tasks: Description now saves correctly to Supabase and persists",
    "Tasks: Tech admin can select and bulk-delete tasks",
    "DMs: Can now message anyone regardless of online status",
    "Status: Fixed users appearing online when they are not",
    "UI: Long text no longer overflows off screen",
    "Announcements: Fixed oversized font in announcement cards",
    "Header: Sign Out button and profile shifted left to stay on screen",
  ],
  "1.0.1": [
    "Nav: Menu circle button now always appears above the header bar",
  ],
  "1.0.0": [
    "Tasks: Tap any task to expand and see full details — description, assignee, due date, creator",
    "PWA: App icon and splash screen for iPhone and Android home screen",
    "Navigation: Help banner and ? modal now include install instructions for iOS and Android",
    "Header: Fixed overlap with phone status bar and notch on mobile",
    "Version: 1.0.0 Beta — first full production release",
  ],

};
const TECH_EMAIL = "nrsmith2@mnu.edu";
const TECH_PIN   = "0000";
const MAX_TRIES  = 5;
const LOCK_MS    = 5 * 60 * 1000;
const AUTO_LOGOUT_MS = 30 * 60 * 1000;

// ─── THEMES ───────────────────────────────────────────────────────────────────
const mkTheme = (dark, compact, accent) => ({
  // accent overrides scarlet if provided
  scarlet:accent||"#C8102E", sD:accent?accent+"cc":"#9e0b23", sG:dark?(accent||"#C8102E")+"30":(accent||"#C8102E")+"20",
  blue: dark?"#5BBFDB":"#1e7fa8", bD:dark?"#3aa8c7":"#155f80", bG:dark?"#5BBFDB20":"#1e7fa818",
  bg:   dark?"#0a0608":"#f5f1f2",
  surf: dark?"#150b0e":"#ffffff",
  surfH:dark?"#1e1014":"#faf3f4",
  card: dark?"#1e1014":"#ffffff",
  bor:  dark?"#2e1820":"#e2d0d4",
  borH: dark?"#3e2428":"#c8b0b6",
  txt:  dark?"#f0e8ea":"#1a0a0d",
  sub:  dark?"#9a8085":"#6b4e54",
  faint:dark?"#3e2428":"#c0a8ae",
  mut:  dark?"#7a6068":"#8a6870",
  ok:   dark?"#22c55e":"#15803d",
  warn: dark?"#f59e0b":"#b45309",
  err:  dark?"#ef4444":"#dc2626",
  dark, compact,
  // Compact is VERY dramatic - nearly half the spacing/size
  sp: compact ? { xs:1, sm:3, md:6,  lg:10, xl:14, r:8  }
              : { xs:3, sm:8, md:14, lg:22, xl:30, r:16 },
  fs: compact ? { xs:9,  sm:10, md:11, lg:13, xl:15 }
              : { xs:11, sm:13, md:15, lg:17, xl:21 },
});
const T0 = mkTheme(false, false, "");

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────
// Shared AudioContext — reused so browsers don't block it after first interaction
let _audioCtx = null;
// Sound settings controlled by app — stored on window for easy access from playSound
window._soundOn = true;
window._soundVol = 0.22;
function getCtx() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch(e) { return null; }
}

function playSound(type="click") {
  if (!window._soundOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.value = window._soundVol ?? 0.22;

    const note = (freq, start, dur, vol=1, wave="sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = wave; o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, now + start);
      g.gain.linearRampToValueAtTime(vol, now + start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + Math.max(dur, 0.05));
      o.start(now + start);
      o.stop(now + start + dur + 0.06);
    };

    switch(type) {
      case "click":
        // Very subtle soft tick
        note(440, 0,    0.06, 0.24, "sine");
        note(550, 0.03, 0.05, 0.10, "sine");
        break;
      case "success":
        // Gentle confirmation — calm rising notes
        note(370, 0,    0.20, 0.32, "sine");
        note(440, 0.14, 0.20, 0.26, "sine");
        note(523, 0.28, 0.30, 0.22, "sine");
        break;
      case "error":
        // Buzzy descending
        note(320, 0,    0.14, 0.75, "sawtooth");
        note(240, 0.12, 0.18, 0.65, "sawtooth");
        note(190, 0.26, 0.22, 0.5,  "sawtooth");
        break;
      case "notify":
        // Double bright ping
        note(1046,0,    0.10, 0.45, "sine");
        note(1318,0.13, 0.12, 0.38, "sine");
        break;
      case "open":
        // Subtle soft open
        note(300, 0,    0.08, 0.20, "sine");
        note(370, 0.06, 0.08, 0.14, "sine");
        break;
      case "login":
        // Soft welcome — gentle rising tones
        note(330, 0,    0.22, 0.30, "sine");
        note(415, 0.15, 0.22, 0.25, "sine");
        note(494, 0.30, 0.28, 0.22, "sine");
        note(523, 0.44, 0.35, 0.20, "sine");
        break;
      case "logout":
        // Farewell descent G-E-C-Bb
        note(784, 0,    0.14, 0.48, "sine");
        note(659, 0.12, 0.14, 0.43, "sine");
        note(523, 0.24, 0.18, 0.38, "sine");
        note(440, 0.34, 0.24, 0.28, "sine");
        break;
      case "dm":
        // Bubble pop
        note(1400,0,    0.045,0.32, "sine");
        note(1000,0.05, 0.07, 0.22, "sine");
        break;
      case "warn":
        // Urgent siren
        note(480, 0,    0.11, 0.58, "square");
        note(600, 0.13, 0.11, 0.58, "square");
        note(480, 0.27, 0.11, 0.48, "square");
        break;
      case "task":
        // Rising tick-check
        note(660, 0,    0.06, 0.38, "sine");
        note(990, 0.07, 0.10, 0.48, "sine");
        note(1320,0.16, 0.16, 0.35, "sine");
        break;
      case "backup":
        // Tech beep sequence
        note(440, 0,    0.05, 0.38, "square");
        note(440, 0.09, 0.05, 0.38, "square");
        note(880, 0.18, 0.13, 0.48, "square");
        break;
      case "delete":
        // Short descending pop
        note(500, 0,    0.06, 0.42, "sine");
        note(350, 0.05, 0.10, 0.32, "sine");
        break;
      case "modal":
        // Light open swoosh
        note(600, 0,    0.08, 0.30, "sine");
        note(800, 0.06, 0.10, 0.22, "sine");
        break;
    }
  } catch(e) {}
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid     = () => Math.random().toString(36).slice(2,9);
const fmtD    = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtT    = d => new Date(d).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
const fmtDT   = d => `${fmtD(d)} ${fmtT(d)}`;
const san     = s => String(s||"").replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]));
const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||"").trim());
const initial = e => String(e||"").trim()[0]?.toUpperCase()||"?";
const daysLeft= d => { if(!d) return null; const diff=Math.ceil((new Date(d)-Date.now())/86400000); return diff; };

// ─── STORAGE ──────────────────────────────────────────────────────────────────
// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ocpzvyjbuhznnhxsxlvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_CwxgKLPpmI6M9Fa_2xFNLQ_IbYDrTpq";

// Lightweight Supabase REST helper — no SDK needed
const SB = {
  headers: {"apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation"},
  url: (table, query="") => `${SUPABASE_URL}/rest/v1/${table}${query}`,

  async select(table, query="") {
    try {
      const r = await fetch(SB.url(table, query), {headers: SB.headers});
      return r.ok ? await r.json() : [];
    } catch { return []; }
  },

  async upsert(table, data) {
    try {
      const r = await fetch(SB.url(table), {
        method: "POST",
        headers: {...SB.headers, "Prefer": "resolution=merge-duplicates,return=representation"},
        body: JSON.stringify(data)
      });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  },

  async delete(table, match) {
    try {
      const q = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
      await fetch(SB.url(table, `?${q}`), {method: "DELETE", headers: SB.headers});
    } catch {}
  },

  async setting(key) {
    try {
      const r = await SB.select("app_settings", `?key=eq.${key}`);
      return r?.[0]?.value ?? null;
    } catch { return null; }
  },

  async setSetting(key, value) {
    try {
      await SB.upsert("app_settings", {key, value});
    } catch {}
  },
};

// DB shim — keeps all existing DB.get/DB.set calls working via app_settings table
const DB = {
  get: async k => { try { return await SB.setting(k); } catch { return null; } },
  set: async (k,v) => { try { await SB.setSetting(k,v); } catch {} },
};

// LS — localStorage for per-device display preferences (never shared)
const LS = {
  get: k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = [
  {id:"e1",email:"boss@mnu.edu",      name:"Boss",          role:"boss",      pin:"",status:"online"},
  {id:"e2",email:"manager@mnu.edu",   name:"Manager",       role:"manager",   pin:"",status:"online"},
  {id:"e3",email:"assistant@mnu.edu", name:"Asst. Manager", role:"assistant", pin:"",status:"online"},
  {id:"e4",email:"employee@mnu.edu",  name:"Employee",      role:"employee",  pin:"",status:"online"},
];
const ROLES = {
  boss:      {label:"Boss",        color:"#C8102E", p:["home","tasks","inv","ann","act","emp","assign","settings","boss","dms","online"]},
  manager:   {label:"Manager",     color:"#1e7fa8", p:["home","tasks","inv","ann","act","emp","assign","settings","dms","online"]},
  assistant: {label:"Asst. Mgr",  color:"#7c3aed", p:["home","tasks","inv","ann","assign","dms"]},
  employee:  {label:"Employee",   color:"#6b7280", p:["home","tasks","ann","dms"]},
  superadmin:{label:"Technical Administrator", color:"#f59e0b", p:["*"]},
};
const can = (u,p) => { if(!u) return false; const ps=ROLES[u.role]?.p||[]; return ps.includes("*")||ps.includes(p); };

// ─── CSS ──────────────────────────────────────────────────────────────────────
const buildCSS = T => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@700,800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{min-height:100vh;font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.txt};padding-top:env(safe-area-inset-top,0px);overflow-x:hidden;}
  *{box-sizing:border-box;max-width:100%;}
  input,textarea,select{max-width:100%;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-thumb{background:${T.bor};border-radius:10px;}
  option{background:${T.surf};color:${T.txt};}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes popIn{from{transform:scale(0) rotate(-8deg);opacity:0;}to{transform:scale(1);opacity:1;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes toast{from{opacity:0;transform:translateY(8px) scale(.95);}to{opacity:1;transform:none;}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-16px);}to{opacity:1;transform:none;}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes bounceIn{0%{transform:scale(0.3);opacity:0;}50%{transform:scale(1.08);}70%{transform:scale(0.95);}100%{transform:scale(1);opacity:1;}}
  @keyframes wipeUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  @keyframes swipeFlash{0%{opacity:0;transform:translateX(-100%);}30%{opacity:0.18;transform:translateX(0);}100%{opacity:0;transform:translateX(100%);}}
  @keyframes swipeReveal{from{transform:translateX(-100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes swipeFade{from{opacity:1;}to{opacity:0;}}
  @keyframes shimmer{0%{background-position:-200px 0;}100%{background-position:calc(200px + 100%) 0;}}
  .fu{animation:fadeUp .25s ease both;}
  .fi{animation:fadeIn .2s ease both;}
  .sr{animation:slideRight .25s ease both;}
  .bi{animation:bounceIn .4s cubic-bezier(.23,1,.32,1) both;}
  .card{transition:transform .18s,box-shadow .18s,border-color .18s,background .18s;}
  .card:hover{transform:translateY(-2px);box-shadow:0 5px 18px rgba(0,0,0,.12);}
  .nav-item{transition:all .18s ease;cursor:pointer;}
  .nav-item:hover{background:${T.surfH}!important;transform:translateX(2px);}
  .nav-item.active{background:${T.scarlet}18!important;border-left:3px solid ${T.scarlet}!important;}
  .tabbar{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .tabbar::-webkit-scrollbar{display:none;}
  .btn-press:active{transform:scale(0.95)!important;}
  @media(max-width:768px){
    .two-col{grid-template-columns:1fr!important;}
    .set-grid{grid-template-columns:1fr!important;}
    .dm-grid{grid-template-columns:1fr!important;}
    .hide-mobile{display:none!important;}
    .main-pad{padding:12px 12px 80px!important;}
    /* Bigger tap targets on mobile */
    .nav-circle-btn{width:52px!important;height:52px!important;}
    .float-action-btn{width:46px!important;height:46px!important;font-size:18px!important;}
  }
  @media(max-width:480px){
    .brand-text{font-size:13px!important;}
    .header-name{display:none!important;}
  }
  @media(max-width:600px){.two-col{grid-template-columns:1fr!important;}.set-grid{grid-template-columns:1fr!important;}}
`;

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────
const Tag = ({label,color}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{label}</span>
);

const NumBadge = ({count,color}) => count>0?(
  <span style={{background:color,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:800,marginLeft:3,minWidth:18,textAlign:"center",display:"inline-block"}}>{count>99?"99+":count}</span>
):null;

const StatusDot = ({status}) => {
  const c={online:"#22c55e",busy:"#f59e0b",offline:"#6b7280"}[status]||"#6b7280";
  return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:c,flexShrink:0,animation:status==="online"?"pulse 2s infinite":"none"}}/>;
};

function Btn({children,onClick,variant,sm,xs,disabled,full,flex,T,style:sx={},sound}) {
  const [p,setP]=useState(false);
  const V={
    primary:{bg:`linear-gradient(135deg,${T.scarlet},${T.sD})`,color:"#fff",border:"none"},
    blue:   {bg:`linear-gradient(135deg,${T.blue},${T.bD})`,   color:"#fff",border:"none"},
    ghost:  {bg:T.surfH,color:T.sub,border:`1px solid ${T.bor}`},
    danger: {bg:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5"},
    success:{bg:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none"},
  };
  const v=V[variant||"primary"];
  const pad=xs?"4px 10px":sm?"6px 14px":"10px 20px";
  const fs=xs?11:sm?12:14;
  // Auto pick sound based on variant if not specified
  const snd=sound||(variant==="danger"?"delete":variant==="success"?"success":"click");
  const handleClick=e=>{
    if(!disabled){playSound(snd);}
    onClick?.(e);
  };
  return (
    <button onClick={handleClick} disabled={disabled} className="btn-press"
      onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
      style={{background:v.bg,color:v.color,border:v.border,borderRadius:T.sp.r,padding:pad,fontWeight:700,fontSize:fs,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,transform:p?"scale(0.95)":"scale(1)",transition:"filter .15s,transform .12s cubic-bezier(.23,1,.32,1)",fontFamily:"inherit",width:full?"100%":undefined,flex:flex||undefined,...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.filter="brightness(1.08)";}}
      onMouseLeave={e=>{e.currentTarget.style.filter="none";}}
    >{children}</button>
  );
}

function Inp({label,T,error,...rest}) {
  const [f,setF]=useState(false);
  return (
    <div>
      {label&&<div style={{fontSize:11,color:f?T.blue:T.sub,marginBottom:4,fontWeight:700,letterSpacing:"0.05em",transition:"color .2s"}}>{label}</div>}
      <input {...rest} style={{width:"100%",background:T.bg,border:`1px solid ${error?T.err:f?T.blue:T.bor}`,borderRadius:T.sp.r,color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none",boxShadow:f?`0 0 0 3px ${error?T.err+"20":T.bG}`:"none",transition:"border-color .2s,box-shadow .2s",...(rest.style||{})}}
        onFocus={e=>{setF(true);rest.onFocus?.(e);}} onBlur={e=>{setF(false);rest.onBlur?.(e);}}/>
      {error&&<div style={{color:T.err,fontSize:11,marginTop:3,fontWeight:600}}>{error}</div>}
    </div>
  );
}

function Sel({label,T,children,...rest}) {
  return (
    <div>
      {label&&<div style={{fontSize:11,color:T.sub,marginBottom:4,fontWeight:700,letterSpacing:"0.05em"}}>{label}</div>}
      <select {...rest} style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:T.sp.r,color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none"}}>{children}</select>
    </div>
  );
}

function Textarea({label,T,...rest}) {
  const [f,setF]=useState(false);
  return (
    <div>
      {label&&<div style={{fontSize:11,color:T.sub,marginBottom:4,fontWeight:700,letterSpacing:"0.05em"}}>{label}</div>}
      <textarea {...rest} style={{width:"100%",background:T.bg,border:`1px solid ${f?T.blue:T.bor}`,borderRadius:T.sp.r,color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none",resize:"vertical",transition:"border-color .2s",...(rest.style||{})}}
        onFocus={e=>{setF(true);rest.onFocus?.(e);}} onBlur={e=>{setF(false);rest.onBlur?.(e);}}/>
    </div>
  );
}

function Modal({title,children,onClose,wide,T}) {
  const [show,setShow]=useState(false);
  useEffect(()=>{const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setShow(true)));return()=>cancelAnimationFrame(id);},[]);
  const close=()=>{setShow(false);setTimeout(onClose,200);};
  return (
    <div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,background:show?"rgba(0,0,0,0.55)":"rgba(0,0,0,0)",backdropFilter:show?"blur(5px)":"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16,transition:"background .2s,backdrop-filter .2s"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:18,padding:T.sp.xl,width:"100%",maxWidth:wide?580:440,maxHeight:"88vh",overflowY:"auto",opacity:show?1:0,transform:show?"scale(1)":"scale(0.94) translateY(14px)",transition:"opacity .22s cubic-bezier(.23,1,.32,1),transform .22s cubic-bezier(.23,1,.32,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:T.sp.lg}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>{title}</div>
          <button onClick={()=>{playSound("click");close();}} style={{background:"none",border:"none",color:T.mut,fontSize:24,cursor:"pointer",lineHeight:1,transition:"color .15s,transform .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.txt;e.currentTarget.style.transform="rotate(90deg)";}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.mut;e.currentTarget.style.transform="rotate(0)";}}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Avatar({email,color,size=36}) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color,fontSize:size*0.42,flexShrink:0}}>{initial(email)}</div>;
}

function ToastList({items}) {
  return (
    <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {items.map(t=>(
        <div key={t.id} style={{background:t.type==="err"?"#fee2e2":t.type==="warn"?"#fef9c3":"#dcfce7",border:`1px solid ${t.type==="err"?"#fca5a5":t.type==="warn"?"#fde047":"#86efac"}`,color:t.type==="err"?"#991b1b":t.type==="warn"?"#92400e":"#15803d",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:13,whiteSpace:"nowrap",boxShadow:"0 4px 14px rgba(0,0,0,.12)",animation:"toast .22s cubic-bezier(.23,1,.32,1) both"}}>{t.msg}</div>
      ))}
    </div>
  );
}

function VersionBadge({T}) {
  return (
    <div style={{position:"fixed",bottom:12,right:14,zIndex:9999,background:T.surf,border:`1px solid ${T.bor}`,borderRadius:8,padding:"4px 12px",fontSize:10,fontWeight:700,letterSpacing:"0.03em",userSelect:"none",display:"flex",gap:5,alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
      <span style={{color:T.scarlet,fontWeight:800}}>MNU</span>
      <span style={{color:T.faint}}>·</span>
      <span style={{color:T.sub}}>Neer Locker</span>
      <span style={{color:T.faint}}>·</span>
      <span style={{color:T.scarlet}}>v{VERSION}</span>
      <span style={{color:T.mut,fontWeight:600}}>{BUILD_TAG}</span>
    </div>
  );
}

function ClaudeTag({T}) {
  return <div style={{position:"fixed",bottom:32,left:12,fontSize:11,color:T.faint,fontWeight:500,letterSpacing:"0.01em",userSelect:"none",zIndex:9997,opacity:0.75,lineHeight:1.65}}>Built using Claude<br/>Created by Nate Smith</div>;
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function LiveClock({T}) {
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(i);},[]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:T.sub,whiteSpace:"nowrap"}}>
      <span style={{fontSize:14}}>🕐</span>
      <span>{time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
    </div>
  );
}

// ─── TECH ADMIN ACCESS ANIMATION ─────────────────────────────────────────────
function TechWelcomeAnim({T}) {
  const [tick,setTick]=useState(0);
  const [lines,setLines]=useState([]);
  const CIRC=239;

  const LOG_LINES=[
    "Authenticating credentials…",
    "Verifying administrator access…",
    "Loading system configuration…",
    "Mounting secure dashboard…",
    "Establishing admin session…",
    "Access granted. Welcome.",
  ];

  useEffect(()=>{
    const ticker=setInterval(()=>setTick(t=>t+1),55);
    // Add log lines one by one
    LOG_LINES.forEach((line,i)=>{
      setTimeout(()=>setLines(l=>[...l,line]),i*380);
    });
    return()=>clearInterval(ticker);
  },[]);

  const progress=Math.min(tick/18,1);
  const offset=CIRC*(1-progress);

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:T.dark?"#04030a":"#0a0608",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,overflow:"hidden"}}>
      {/* Animated grid background */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.warn}12 1px,transparent 1px),linear-gradient(90deg,${T.warn}12 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.35,animation:"shimmer 8s ease-in-out infinite"}}/>

      {/* Amber glow orb behind ring */}
      <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${T.warn}22 0%,transparent 70%)`,filter:"blur(40px)",pointerEvents:"none"}}/>

      {/* Closing ring — amber color */}
      <div style={{position:"relative",width:100,height:100,zIndex:2}}>
        <svg width="100" height="100" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="50" cy="50" r="44" fill="none" stroke={T.warn+"33"} strokeWidth="5"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke={T.warn} strokeWidth="5"
            strokeDasharray={CIRC+51}
            strokeDashoffset={(CIRC+51)*(1-progress)}
            strokeLinecap="round"
            style={{transition:"stroke-dashoffset .05s linear",filter:`drop-shadow(0 0 6px ${T.warn})`}}/>
        </svg>
        {/* Spinning dashed inner ring */}
        <svg width="100" height="100" style={{position:"absolute",inset:0,animation:progress<1?"spin 1s linear infinite":"none",opacity:progress<1?0.6:0,transition:"opacity .4s"}}>
          <circle cx="50" cy="50" r="32" fill="none" stroke={T.scarlet} strokeWidth="2" strokeDasharray="16 16" strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34}}>🔧</div>
      </div>

      {/* Terminal-style log lines */}
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,color:T.warn,zIndex:2,width:"100%",maxWidth:340,padding:"0 20px"}}>
        {lines.map((line,i)=>(
          <div key={i} style={{opacity:0,animation:`fadeUp .25s ${i*30}ms ease both`,display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{color:i===lines.length-1&&progress>=1?"#22c55e":T.warn,fontWeight:700}}>{i===lines.length-1&&progress>=1?"✓":"›"}</span>
            <span style={{color:i===lines.length-1&&progress>=1?"#22c55e":T.warn+"cc"}}>{line}</span>
          </div>
        ))}
        {/* Blinking cursor */}
        {progress<1&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
          <span style={{color:T.warn,fontWeight:700}}>›</span>
          <span style={{display:"inline-block",width:8,height:14,background:T.warn,animation:"pulse 1s ease-in-out infinite",borderRadius:1}}/>
        </div>}
      </div>

      <div style={{zIndex:2,textAlign:"center"}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:800,color:T.warn,letterSpacing:"0.12em",textTransform:"uppercase",opacity:0.85}}>Technical Administrator</div>
        <div style={{fontSize:11,color:T.warn+"66",marginTop:3,fontFamily:"'Courier New',monospace"}}>MNU Neer Locker — Secure Access</div>
      </div>
    </div>
  );
}

// ─── TECH ADMIN EXIT ANIMATION ───────────────────────────────────────────────
function TechExitAnim({T}) {
  const [tick,setTick]=useState(0);
  const [lines,setLines]=useState([]);
  const CIRC=290;

  const EXIT_LINES=[
    "Saving session state…",
    "Closing admin connections…",
    "Clearing secure cache…",
    "Logging out administrator…",
    "Session terminated. Goodbye.",
  ];

  useEffect(()=>{
    const ticker=setInterval(()=>setTick(t=>t+1),55);
    EXIT_LINES.forEach((line,i)=>{
      setTimeout(()=>setLines(l=>[...l,line]),i*380);
    });
    return()=>clearInterval(ticker);
  },[]);

  const progress=Math.min(tick/18,1);
  // Exit ring DRAINS instead of fills — starts full, empties out
  const offset=CIRC*progress;

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:T.dark?"#04030a":"#0a0608",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,overflow:"hidden"}}>
      {/* Grid background */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.warn}12 1px,transparent 1px),linear-gradient(90deg,${T.warn}12 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.35}}/>
      <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${T.scarlet}22 0%,transparent 70%)`,filter:"blur(40px)",pointerEvents:"none"}}/>

      {/* Draining ring — fills was login, drains is exit */}
      <div style={{position:"relative",width:100,height:100,zIndex:2}}>
        <svg width="100" height="100" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="50" cy="50" r="46" fill="none" stroke={T.warn+"33"} strokeWidth="5"/>
          <circle cx="50" cy="50" r="46" fill="none" stroke={T.warn} strokeWidth="5"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{transition:"stroke-dashoffset .05s linear",filter:`drop-shadow(0 0 6px ${T.warn})`}}/>
        </svg>
        {/* Counter-spinning inner ring */}
        <svg width="100" height="100" style={{position:"absolute",inset:0,animation:progress<1?"spin 1s linear infinite reverse":"none",opacity:progress<1?0.5:0,transition:"opacity .4s"}}>
          <circle cx="50" cy="50" r="32" fill="none" stroke={T.scarlet} strokeWidth="2" strokeDasharray="16 16" strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,
          transform:progress>=1?"scale(0.8)":"scale(1)",opacity:progress>=1?0.4:1,transition:"transform .4s ease,opacity .4s ease"}}>🔧</div>
      </div>

      {/* Terminal exit log */}
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,color:T.warn,zIndex:2,width:"100%",maxWidth:340,padding:"0 20px"}}>
        {lines.map((line,i)=>(
          <div key={i} style={{opacity:0,animation:`fadeUp .25s ${i*30}ms ease both`,display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <span style={{color:i===lines.length-1&&progress>=1?T.scarlet:T.warn,fontWeight:700}}>{i===lines.length-1&&progress>=1?"✕":"‹"}</span>
            <span style={{color:i===lines.length-1&&progress>=1?T.scarlet+"cc":T.warn+"cc"}}>{line}</span>
          </div>
        ))}
        {progress<1&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
          <span style={{color:T.warn,fontWeight:700}}>‹</span>
          <span style={{display:"inline-block",width:8,height:14,background:T.warn,animation:"pulse 1s ease-in-out infinite",borderRadius:1}}/>
        </div>}
      </div>

      <div style={{zIndex:2,textAlign:"center"}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:800,color:T.warn,letterSpacing:"0.12em",textTransform:"uppercase",opacity:0.85}}>Session Ended</div>
        <div style={{fontSize:11,color:T.warn+"55",marginTop:3,fontFamily:"'Courier New',monospace"}}>MNU Neer Locker — Secure Logout</div>
      </div>
    </div>
  );
}

// ─── LOGOUT ANIMATION ─────────────────────────────────────────────────────────
function LogoutAnim({T}) {
  const [tick,setTick]=useState(0);
  const CIRC=239;
  useEffect(()=>{
    const i=setInterval(()=>setTick(t=>t+1),55);
    return()=>clearInterval(i);
  },[]);
  const progress=Math.min(tick/18,1);
  const offset=CIRC*(1-progress);
  return (
    <div style={{position:"fixed",inset:0,background:T.bg,zIndex:850,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:22,animation:"fadeIn .18s ease both"}}>
      <div style={{position:"relative",width:84,height:84}}>
        <svg width="84" height="84" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="42" cy="42" r="38" fill="none" stroke={T.bor} strokeWidth="5"/>
          <circle cx="42" cy="42" r="38" fill="none" stroke={T.scarlet} strokeWidth="5"
            strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
            style={{transition:"stroke-dashoffset .05s linear",filter:`drop-shadow(0 0 4px ${T.scarlet}88)`}}/>
        </svg>
        <svg width="84" height="84" style={{position:"absolute",inset:0,animation:progress<1?"spin 1.2s linear infinite":"none",opacity:progress<1?0.5:0,transition:"opacity .4s"}}>
          <circle cx="42" cy="42" r="26" fill="none" stroke={T.blue} strokeWidth="2" strokeDasharray="20 20" strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>👋</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt,letterSpacing:"-0.3px"}}>See you later!</div>
        <div style={{color:T.sub,fontSize:13,marginTop:6}}>Signing out of MNU's Neer Locker…</div>
      </div>
    </div>
  );
}

// ─── WELCOME ANIMATION ────────────────────────────────────────────────────────
function WelcomeAnim({name,role,T,onDone}) {
  const [step,setStep]=useState(0);
  const [tick,setTick]=useState(0);
  const rc=ROLES[role]||ROLES.employee;
  const CIRC=239;

  // Same taglines as the login page — pick ONE randomly on mount, never changes
  const taglines=["Staff Portal for MNU's Neer Locker.","Sign in to get started.","Manage tasks, inventory, and your team.","Keep things running smoothly.","All your shift tools in one place.","Built for the Neer Locker team.","Stay connected with your crew.","Tasks. Inventory. Communication.","Your work hub, simplified.","Track everything that matters.","Quick access for every shift.","Reliable. Simple. Yours."];
  const quote=useMemo(()=>taglines[Math.floor(Math.random()*taglines.length)],[]);

  useEffect(()=>{
    const t1=setTimeout(()=>setStep(1),260);
    const t2=setTimeout(()=>onDone(),2600);
    const ticker=setInterval(()=>setTick(t=>t+1),55);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearInterval(ticker);};
  },[]);

  const progress=Math.min(tick/18,1);
  const offset=CIRC*(1-progress);

  return (
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:900,gap:22}}>
      {/* Closing progress ring */}
      <div style={{position:"relative",width:84,height:84}}>
        <svg width="84" height="84" style={{position:"absolute",inset:0,transform:"rotate(-90deg)"}}>
          <circle cx="42" cy="42" r="38" fill="none" stroke={T.bor} strokeWidth="5"/>
          <circle cx="42" cy="42" r="38" fill="none" stroke={T.scarlet} strokeWidth="5"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{transition:"stroke-dashoffset .05s linear",filter:`drop-shadow(0 0 4px ${T.scarlet}88)`}}/>
        </svg>
        <svg width="84" height="84" style={{position:"absolute",inset:0,animation:progress<1?"spin 1.2s linear infinite":"none",opacity:progress<1?0.5:0,transition:"opacity .4s"}}>
          <circle cx="42" cy="42" r="26" fill="none" stroke={T.blue} strokeWidth="2" strokeDasharray="20 20" strokeLinecap="round"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🎓</div>
      </div>

      {/* Name + rotating tagline */}
      <div style={{textAlign:"center",opacity:step>=1?1:0,transform:step>=1?"translateY(0)":"translateY(14px)",transition:"opacity .4s ease,transform .4s ease",maxWidth:300}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:24,fontWeight:800,color:T.txt,lineHeight:1.2}}>Welcome back, {name}.</div>
        <div style={{color:T.scarlet,fontSize:13,fontWeight:600,marginTop:7,fontStyle:"italic",animation:"fadeUp .35s ease both"}}>
          {quote}
        </div>
        <div style={{color:T.sub,fontSize:12,marginTop:8}}>{rc.label} · MNU's Neer Locker</div>
      </div>

      <ClaudeTag T={T}/>
    </div>
  );
}

// ─── LOGIN POP-UP (tasks, announcements, DMs after login) ─────────────────────
function LoginBriefing({user,tasks,anns,dms,emps,T,onClose}) {
  const [show,setShow]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(true),100);return()=>clearTimeout(t);},[]);
  const close=()=>{setShow(false);setTimeout(onClose,220);};
  const myTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user.id)).slice(0,5);
  const myAnns=anns.filter(a=>!(a.dismissed||[]).includes(user.id)).slice(0,3);
  const myDMs=dms.filter(d=>d.to===user.id||d.from===user.id);
  const unreadDMs=myDMs.filter(d=>d.to===user.id&&!d.read).length;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:"20px 20px 140px",transition:"background .2s"}} onClick={e=>e.target===e.currentTarget&&close()}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:18,padding:T.sp.xl,width:"100%",maxWidth:480,maxHeight:"68vh",overflowY:"auto",opacity:show?1:0,transform:show?"translateY(0)":"translateY(-16px)",transition:"opacity .25s,transform .3s cubic-bezier(.23,1,.32,1)",boxShadow:"0 12px 48px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:17,fontWeight:800,color:T.txt}}>👋 Hey {user.name}!</div>
          <button onClick={close} style={{background:"none",border:"none",color:T.mut,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        {myTasks.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:8}}>YOUR OPEN TASKS</div>
            <div style={{display:"grid",gap:6}}>
              {myTasks.map(t=>{
                const dl=daysLeft(t.dueDate);
                return (
                  <div key={t.id} style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:10,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:T.txt}}>{t.title}</div>
                      {t.dueDate&&<div style={{fontSize:11,color:dl!==null&&dl<=1?T.err:T.sub,marginTop:2}}>Due {fmtD(t.dueDate)}{dl!==null&&dl<=0?" — OVERDUE":dl===1?" — Tomorrow":""}</div>}
                    </div>
                    <Tag label={t.priority} color={{Low:T.mut,Medium:T.blue,High:T.scarlet}[t.priority]||T.mut}/>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {myAnns.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:8}}>ANNOUNCEMENTS</div>
            <div style={{display:"grid",gap:6}}>
              {myAnns.map(a=>{
                const lc={info:T.blue,warn:T.warn,danger:T.scarlet}[a.level]||T.blue;
                return <div key={a.id} style={{background:T.surfH,border:`1px solid ${lc}33`,borderLeft:`3px solid ${lc}`,borderRadius:10,padding:"9px 12px",fontSize:13,color:T.txt,fontWeight:600}}>{a.msg}</div>;
              })}
            </div>
          </div>
        )}

        {unreadDMs>0&&(
          <div style={{background:`${T.blue}18`,border:`1px solid ${T.blue}44`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>💬</span>
            <div style={{fontSize:13,color:T.txt,fontWeight:700}}>You have <span style={{color:T.blue}}>{unreadDMs} unread message{unreadDMs!==1?"s":""}</span></div>
          </div>
        )}

        {myTasks.length===0&&myAnns.length===0&&unreadDMs===0&&(
          <div style={{textAlign:"center",padding:"20px 0",color:T.sub,fontSize:14}}>🎉 You're all caught up! Nothing new.</div>
        )}

        <div style={{marginTop:16}}>
          <Btn T={T} full variant="ghost" onClick={close}>Got it, let's go →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────────────
function NavMenu({user,page,setPage,tasks,anns,dms,T}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const myAnns=anns.filter(a=>!(a.dismissed||[]).includes(user?.id)).length;
  const myTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id)).length;
  const unreadDMs=dms.filter(d=>d.to===user?.id&&!d.read).length;
  const totalBadge=myTasks+myAnns+unreadDMs;

  const items=[
    {key:"home",   icon:"🏠", label:"Home"},
    {key:"tasks",  icon:"✅", label:"Tasks",         badge:myTasks,   perm:"tasks"},
    {key:"inv",    icon:"📦", label:"Inventory",      perm:"inv"},
    {key:"anns",   icon:"🔔", label:"Announcements",  badge:myAnns,    perm:"ann"},
    {key:"dms",    icon:"💬", label:"Messages",       badge:unreadDMs, perm:"dms"},
    {key:"act",    icon:"📊", label:"Activity",       perm:"act"},
    {key:"set",    icon:"⚙️", label:"Settings"},
  ].filter(i=>!i.perm||can(user,i.perm));

  // Close on outside click
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const go=key=>{setPage(key);setOpen(false);playSound("click");};

  return (
    <div ref={ref} style={{position:"relative"}}>
      {/* Circle nav button */}
      <button onClick={()=>{setOpen(o=>!o);playSound("open");}}
        title="Navigation Menu"
        className="nav-circle-btn"
        style={{width:48,height:48,borderRadius:"50%",background:open?T.scarlet:T.surf,border:`2px solid ${open?T.scarlet:T.bor}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4,padding:0,transition:"all .2s",boxShadow:open?"0 4px 20px "+T.scarlet+"55":"0 2px 10px rgba(0,0,0,.14)",position:"relative",flexShrink:0,touchAction:"manipulation"}}
        onMouseEnter={e=>{if(!open){e.currentTarget.style.background=T.scarlet+"18";e.currentTarget.style.borderColor=T.scarlet+"88";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.18)";}}}
        onMouseLeave={e=>{if(!open){e.currentTarget.style.background=T.surf;e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.14)";}}}
      >
        {/* Animated 3-line → X icon */}
        <div style={{display:"flex",flexDirection:"column",gap:4,width:18}}>
          <div style={{height:2,borderRadius:1,background:open?"#fff":T.sub,width:"100%",transform:open?"rotate(45deg) translate(4px,4px)":"none",transition:"all .22s cubic-bezier(.23,1,.32,1)",transformOrigin:"left"}}/>
          <div style={{height:2,borderRadius:1,background:open?"#fff":T.sub,width:"100%",opacity:open?0:1,transition:"all .22s"}}/>
          <div style={{height:2,borderRadius:1,background:open?"#fff":T.sub,width:"100%",transform:open?"rotate(-45deg) translate(4px,-4px)":"none",transition:"all .22s cubic-bezier(.23,1,.32,1)",transformOrigin:"left"}}/>
        </div>
        {totalBadge>0&&!open&&(
          <div style={{position:"absolute",top:-3,right:-3,background:T.scarlet,color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.surf}`}}>
            {totalBadge>9?"9+":totalBadge}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open&&(
        <div style={{position:"fixed",top:116,left:10,background:T.surf,border:`1px solid ${T.bor}`,borderRadius:16,padding:"6px 6px 10px",minWidth:248,zIndex:500,boxShadow:`0 16px 48px rgba(0,0,0,.22),0 2px 0 ${T.scarlet}18`,animation:"fadeUp .18s cubic-bezier(.23,1,.32,1) both"}}>
          {/* User chip at top of dropdown */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px 10px",borderBottom:`1px solid ${T.bor}`,marginBottom:6}}>
            <div style={{position:"relative",flexShrink:0}}>
              <Avatar email={user?.email} color={ROLES[user?.role]?.color||T.scarlet} size={28}/>
              <div style={{position:"absolute",bottom:-1,right:-1}}><StatusDot status={user?.status||"online"}/></div>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:800,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
              <div style={{fontSize:10,color:T.sub}}>{ROLES[user?.role]?.label}</div>
            </div>
          </div>
          {/* Nav items */}
          {items.map((item,i)=>{
            const active=page===item.key;
            return (
              <button key={item.key} onClick={()=>go(item.key)}
                style={{width:"100%",background:active?T.scarlet+"18":"transparent",color:active?T.scarlet:T.sub,border:"none",borderRadius:12,padding:"13px 16px",fontWeight:700,fontSize:16,fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderLeft:active?`4px solid ${T.scarlet}`:"4px solid transparent",transition:"all .15s",animation:`slideRight .18s ${i*25}ms ease both`}}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background=T.surfH;e.currentTarget.style.color=T.txt;}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.sub;}}}
              >
                <span style={{fontSize:22,width:28,textAlign:"center",flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {(item.badge||0)>0&&<NumBadge count={item.badge} color={T.scarlet}/>}
                {active&&<span style={{width:8,height:8,borderRadius:"50%",background:T.scarlet,flexShrink:0,display:"inline-block"}}/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

// ─── ANIMATED HERO BANNER ─────────────────────────────────────────────────────
function HeroBanner({user,T,onProfileClick}) {
  const [tick,setTick]=useState(0);
  const [time,setTime]=useState(new Date());
  const [greet,setGreet]=useState("Hey");
  const [wavePhase,setWavePhase]=useState(0);

  useEffect(()=>{
    const h=new Date().getHours();
    setGreet(h<12?"Good morning":h<17?"Good afternoon":"Good evening");
    const i=setInterval(()=>{
      setTick(t=>t+1);
      setTime(new Date());
      setWavePhase(w=>w+0.08);
    },100);
    return()=>clearInterval(i);
  },[]);

  const rc=ROLES[user.role];
  const timeStr=time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dateStr=time.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  // Richer floating orbs — larger, more varied, slower drift
  const orbs=[
    {size:120,x:78,baseY:15,speed:0.7,color:T.scarlet,opacity:0.12},
    {size:80, x:88,baseY:55,speed:1.1,color:T.blue,   opacity:0.10},
    {size:60, x:5, baseY:20,speed:0.9,color:T.blue,   opacity:0.08},
    {size:90, x:60,baseY:70,speed:0.6,color:T.scarlet,opacity:0.07},
    {size:50, x:40,baseY:5, speed:1.3,color:T.scarlet,opacity:0.06},
  ];

  // Floating emoji particles with more variety
  const particles=["🎓","⭐","📚","🏫","✨","🎯","🏆","💡"].map((e,i)=>({
    emoji:e, x:5+i*12,
    y:10+Math.sin(wavePhase*speed(i)+i)*18,
    opacity:0.05+Math.abs(Math.sin(wavePhase*0.7+i))*0.07,
    scale:0.7+Math.abs(Math.sin(wavePhase*0.5+i))*0.5,
    rot:(wavePhase*20+i*45)%360,
  }));
  function speed(i){return [0.6,0.9,0.7,1.1,0.8,0.65,1.0,0.75][i]||0.8;}

  // Wave SVG path
  const W=800,H=40;
  const pts=Array.from({length:20},(_,i)=>{
    const x=i*(W/19);
    const y=H/2+Math.sin(wavePhase+i*0.5)*10+Math.sin(wavePhase*1.3+i*0.8)*6;
    return `${i===0?"M":"L"}${x},${y}`;
  }).join(" ");

  return (
    <div className="fu" style={{position:"relative",overflow:"hidden",borderRadius:20,marginBottom:20,minHeight:160,background:T.dark?`linear-gradient(145deg,#200810 0%,#0e0508 40%,#060d1a 100%)`:`linear-gradient(145deg,#fff0f0 0%,#fff5f5 40%,#f0f4ff 100%)`,border:`1px solid ${T.bor}`,boxShadow:`0 8px 40px ${T.scarlet}20,0 2px 0 ${T.scarlet}40 inset`}}>

      {/* Animated color orbs */}
      {orbs.map((o,i)=>(
        <div key={i} style={{position:"absolute",left:`${o.x}%`,top:`${o.baseY+Math.sin(wavePhase*o.speed+i)*14}%`,width:o.size,height:o.size,borderRadius:"50%",background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`,opacity:o.opacity,transform:"translate(-50%,-50%)",transition:"top .05s ease",pointerEvents:"none",filter:"blur(8px)"}}/>
      ))}

      {/* Shimmer sweep overlay */}
      <div style={{position:"absolute",inset:0,background:`linear-gradient(110deg,transparent 20%,${T.scarlet}08 45%,${T.blue}06 55%,transparent 80%)`,animation:"shimmer 5s ease-in-out infinite",backgroundSize:"300% 100%",pointerEvents:"none"}}/>

      {/* Animated wave at bottom */}
      <svg style={{position:"absolute",bottom:0,left:0,right:0,width:"100%",height:40,pointerEvents:"none",opacity:0.18}} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={pts} stroke={T.scarlet} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Floating emoji particles */}
      {particles.map((p,i)=>(
        <div key={i} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,fontSize:22,opacity:p.opacity,transform:`scale(${p.scale}) rotate(${p.rot}deg)`,transition:"all .05s linear",pointerEvents:"none",userSelect:"none"}}>{p.emoji}</div>
      ))}

      {/* Top gradient bar — animated */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${T.scarlet},${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 4s linear infinite",borderRadius:"20px 20px 0 0"}}/>

      {/* Content */}
      <div style={{position:"relative",zIndex:2,padding:"26px 26px 22px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:28,fontWeight:800,color:T.txt,lineHeight:1.1,marginBottom:6,letterSpacing:"-0.5px"}}>
              {greet}, <span style={{color:T.scarlet,textShadow:`0 0 20px ${T.scarlet}50`}}>{user.name}</span>! 👋
            </div>
            <div style={{color:T.sub,fontSize:13,marginBottom:12}}>{dateStr}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <button onClick={onProfileClick} style={{background:rc?.color+"28",border:`1px solid ${rc?.color}55`,borderRadius:8,padding:"4px 14px",fontWeight:700,fontSize:12,color:rc?.color,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                title="Go to Profile Settings"
              >
                {rc?.label} ⚙️
              </button>
              <button onClick={onProfileClick} style={{display:"flex",alignItems:"center",gap:6,background:T.dark?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.65)",backdropFilter:"blur(6px)",borderRadius:8,padding:"4px 12px",border:`1px solid ${T.bor}`,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                title="Go to Settings"
              >
                <StatusDot status={user.status||"online"}/>
                <span style={{fontSize:12,color:T.sub,textTransform:"capitalize",fontWeight:600}}>{user.status||"online"}</span>
              </button>
            </div>
          </div>

          {/* Live clock card */}
          <div style={{background:T.dark?"rgba(0,0,0,0.5)":"rgba(255,255,255,0.75)",backdropFilter:"blur(12px)",border:`1px solid ${T.bor}`,borderRadius:16,padding:"14px 20px",textAlign:"center",flexShrink:0,boxShadow:`0 4px 20px rgba(0,0,0,0.12)`}}>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:T.scarlet,letterSpacing:"0.04em",textShadow:`0 0 16px ${T.scarlet}40`}}>{timeStr}</div>
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.08em",marginTop:3}}>LIVE CLOCK</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({user,tasks,anns,emps,dms,T,setPage,toast}) {
  const myTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user.id));
  const doneTasks=tasks.filter(t=>t.done&&t.createdBy===user.id||tasks.filter(tt=>tt.done&&(tt.assignedTo===user.id||tt.assignedTo==="all")).includes(t));
  const overdueTasks=myTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const myAnns=anns.filter(a=>!(a.dismissed||[]).includes(user.id));
  const onlineEmps=emps.filter(e=>e.status==="online"&&e.id!==user.id);
  const unreadDMs=dms.filter(d=>d.to===user.id&&!d.read).length;

  const quickStats=[
    {icon:"✅",label:"Open Tasks",val:myTasks.length,color:T.blue,page:"tasks"},
    {icon:"🔔",label:"Announcements",val:myAnns.length,color:T.scarlet,page:"anns"},
    {icon:"💬",label:"Unread DMs",val:unreadDMs,color:"#7c3aed",page:"dms"},
    {icon:"⚠️",label:"Overdue",val:overdueTasks.length,color:T.err,page:"tasks"},
  ];

  return (
    <div>
      {/* Animated Hero Banner */}
      <HeroBanner user={user} T={T} onProfileClick={()=>{setPage("set");setSettingsTab("profile");playSound("click");}}/>

      {/* Quick stats */}
      <div className="fu" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}} >
        {quickStats.map((s,i)=>(
          <button key={s.label} onClick={()=>{playSound("click");setPage(s.page);}} style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .18s",animation:`fadeUp .25s ${i*60}ms ease both`}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 5px 18px rgba(0,0,0,.1)";e.currentTarget.style.borderColor=s.color;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=T.bor;}}
          >
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:24,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
            <div style={{fontSize:11,color:T.sub,fontWeight:600,marginTop:2}}>{s.label}</div>
          </button>
        ))}
      </div>



      {/* Online team (boss/manager only) */}
      {can(user,"online")&&onlineEmps.length>0&&(
        <div className="fu card" style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginTop:14}}>
          <div style={{fontWeight:800,fontSize:14,color:T.txt,marginBottom:10,fontFamily:"'Clash Display',sans-serif"}}>🟢 Online Now ({onlineEmps.length})</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {onlineEmps.map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:6,background:T.surfH,borderRadius:20,padding:"5px 12px"}}>
                <StatusDot status={e.status}/>
                <span style={{fontSize:12,fontWeight:600,color:T.txt}}>{e.name}</span>
                <Tag label={ROLES[e.role]?.label} color={ROLES[e.role]?.color||T.mut}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="fu" style={{background:`${T.blue}12`,border:`1px solid ${T.blue}33`,borderRadius:14,padding:16,marginTop:14,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:24,flexShrink:0}}>❓</span>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:T.txt,marginBottom:4}}>Need help navigating?</div>
          <div style={{fontSize:13,color:T.sub,lineHeight:1.6}}>
            Tap the <strong>circle button</strong> (top-left) to open the menu — it stays visible while you scroll.<br/>
            Tap <strong>🎓 MNU's Neer Locker</strong> in the header to return home anytime.<br/>
            Use the <strong style={{color:T.scarlet}}>?</strong> button (bottom-right) for a full guide and the <strong style={{color:"#b45309"}}>💡</strong> button to send ideas to Tech Admin.
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:`${T.blue}10`,border:`1px solid ${T.blue}33`,borderRadius:12}}>
            <div style={{fontWeight:700,fontSize:13,color:T.txt,marginBottom:6}}>📲 Add to your home screen</div>
            <div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>
              <strong>iPhone:</strong> Open in <strong>Safari</strong> → tap the Share button → <strong>"Add to Home Screen"</strong><br/>
              <strong>Android:</strong> Open in <strong>Chrome</strong> → tap ⋮ menu → <strong>"Add to Home Screen"</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DM SECTION ───────────────────────────────────────────────────────────────
function DMSection({user,emps,dms,setDms,T,toast}) {
  const [selected,setSelected]=useState(null);
  const [msgInput,setMsgInput]=useState("");
  const msgEndRef=useRef(null);
  const inputRef=useRef(null);

  // saveDMs — now handled by saveDms useCallback below
  const otherEmps=emps.filter(e=>e.id!==user.id);
  const getThread=(otherId)=>dms.filter(d=>{
    // Regular messages between the two users
    const regular=(d.from===user.id&&d.to===otherId)||(d.from===otherId&&d.to===user.id);
    // System/warning messages targeted at this specific thread
    const systemInThread=d.system&&d.to===user.id&&d.threadWith===otherId;
    return regular||systemInThread;
  }).sort((a,b)=>a.at-b.at);
  const markRead=async(otherId)=>{
    const next=dms.map(d=>{
      if(d.to===user.id&&d.from===otherId) return{...d,read:true};
      if(d.system&&d.to===user.id&&d.threadWith===otherId) return{...d,read:true};
      if(d.from===user.id&&d.to===otherId) return{...d,read:true};
      return d;
    });
    setDms(next);
    // Patch read status in Supabase for messages from otherId to me
    await fetch(`${SUPABASE_URL}/rest/v1/direct_messages?from_id=eq.${otherId}&to_id=eq.${user.id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({read:true})}).catch(()=>{});
  };
  const selectConvo=async(emp)=>{setSelected(emp);await markRead(emp.id);setTimeout(()=>inputRef.current?.focus(),100);};

  const sendMsg=async()=>{
    const text=msgInput.trim();
    if(!text||!selected) return;
    setMsgInput("");
    const newMsg={id:uid(),from:user.id,to:selected.id,text:san(text),at:Date.now(),read:false};
    playSound("dm");
    // Update local state immediately
    const updated=dms.map(d=>d.from===selected.id&&d.to===user.id?{...d,read:true}:d);
    const next=[...updated,newMsg];
    setDms(next);
    // Save new message to Supabase directly
    await SB.upsert("direct_messages",{
      id:newMsg.id,
      from_id:newMsg.from,
      to_id:newMsg.to,
      text:newMsg.text,
      at:newMsg.at,
      read:false,
      system:false,
      thread_with:selected.id,
      feedback:false
    });
    setTimeout(()=>msgEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
    inputRef.current?.focus();
  };

  const unreadFrom=(empId)=>dms.filter(d=>d.from===empId&&d.to===user.id&&!d.read).length;
  useEffect(()=>{msgEndRef.current?.scrollIntoView({behavior:"smooth"});},[selected,dms]);

  return (
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:0,height:"calc(100vh - 140px)",border:`1px solid ${T.bor}`,borderRadius:14,overflow:"hidden",background:T.card}}>
      {/* Contacts */}
      <div style={{borderRight:`1px solid ${T.bor}`,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.bor}`,fontWeight:800,fontSize:14,color:T.txt,flexShrink:0}}>💬 Messages</div>
        <div style={{background:`${T.warn}18`,borderBottom:`1px solid ${T.warn}44`,padding:"9px 14px",display:"flex",gap:7,alignItems:"flex-start",flexShrink:0}}>
          <span style={{fontSize:14,flexShrink:0}}>⚠️</span>
          <span style={{fontSize:12,color:T.warn,fontWeight:700,lineHeight:1.5}}>Messages may be reviewed by management &amp; technical administrators.</span>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {otherEmps.map(e=>{
            const unread=unreadFrom(e.id);
            const thread=getThread(e.id);
            const last=thread[thread.length-1];
            return (
              <div key={e.id} onClick={()=>selectConvo(e)}
                style={{padding:"12px 14px",cursor:"pointer",background:selected?.id===e.id?T.scarlet+"18":"transparent",borderBottom:`1px solid ${T.bor}`,transition:"background .18s",borderLeft:selected?.id===e.id?`3px solid ${T.scarlet}`:"3px solid transparent"}}
                onMouseEnter={ev=>{if(selected?.id!==e.id)ev.currentTarget.style.background=T.surfH;}}
                onMouseLeave={ev=>{if(selected?.id!==e.id)ev.currentTarget.style.background="transparent";}}
              >
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <Avatar email={e.email} color={ROLES[e.role]?.color||T.mut} size={36}/>
                    <div style={{position:"absolute",bottom:0,right:0}}><StatusDot status={e.status||"offline"}/></div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:14,fontWeight:700,color:T.txt}}>{e.name}</span>
                      {unread>0&&<NumBadge count={unread} color={T.scarlet}/>}
                    </div>
                    <div style={{fontSize:12,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{last?`${last.from===user.id?"You: ":""}${last.text}`:"Start a conversation"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      {selected?(
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.bor}`,display:"flex",alignItems:"center",gap:10,background:T.surfH,flexShrink:0}}>
            <Avatar email={selected.email} color={ROLES[selected.role]?.color||T.mut} size={34}/>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:T.txt}}>{selected.name}</div>
              <div style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:5,marginTop:2}}><StatusDot status={selected.status||"offline"}/><span style={{textTransform:"capitalize"}}>{selected.status||"offline"}</span></div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
            {getThread(selected.id).length===0
              ?<div style={{textAlign:"center",color:T.mut,fontSize:15,marginTop:60,animation:"fadeUp .3s ease"}}>No messages yet. Say hi! 👋</div>
              :getThread(selected.id).map((msg,i)=>{
                const mine=msg.from===user.id;
                const isSystem=msg.system===true;
                if(isSystem) return (
                  <div key={msg.id} style={{display:"flex",justifyContent:"center",animation:`fadeUp .2s ${i*15}ms ease both`}}>
                    <div style={{background:`${T.warn}22`,border:`1px solid ${T.warn}55`,borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,color:T.warn,textAlign:"center",maxWidth:"80%"}}>
                      ⚠️ {msg.text}
                      <div style={{fontSize:11,opacity:0.7,marginTop:3,fontWeight:400}}>{fmtT(msg.at)}</div>
                    </div>
                  </div>
                );
                // A sent message is "read" if the other person has sent ANY message after it
                // This mirrors how iMessage works — if they replied, they read it
                const thread=getThread(selected.id);
                const theirMsgsAfter=thread.filter(d=>d.from===selected.id&&!d.system&&d.at>msg.at).length>0;
                // Also check the msg.read flag (set when they open convo via markRead)
                const msgRead=mine&&(theirMsgsAfter||msg.read);
                // Only show "Read" on the LAST sent message to avoid clutter
                const isLastMine=mine&&thread.filter(d=>d.from===user.id&&!d.system).slice(-1)[0]?.id===msg.id;
                return (
                  <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",animation:`fadeUp .2s ${i*15}ms ease both`}}>
                    <div style={{maxWidth:"72%"}}>
                      <div style={{background:mine?T.scarlet:T.surfH,color:mine?"#fff":T.txt,borderRadius:mine?"18px 18px 5px 18px":"18px 18px 18px 5px",padding:"11px 16px",fontSize:15,fontWeight:500,lineHeight:1.6,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
                        <div>{msg.text}</div>
                        <div style={{fontSize:11,opacity:0.65,marginTop:4,textAlign:mine?"right":"left",fontWeight:400,display:"flex",alignItems:"center",justifyContent:mine?"flex-end":"flex-start",gap:4}}>
                          <span>{fmtT(msg.at)}</span>
                          {mine&&(
                            <span style={{color:"rgba(255,255,255,0.75)",fontSize:13,fontWeight:600}}>
                              {msgRead?"✓✓":"✓"}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Read label only on last sent message */}
                      {mine&&isLastMine&&msgRead&&(
                        <div style={{fontSize:10,color:T.blue,fontWeight:800,textAlign:"right",marginTop:3,paddingRight:6,letterSpacing:"0.02em"}}>✓✓ Read</div>
                      )}
                    </div>
                  </div>
                );
              })
            }
            <div ref={msgEndRef}/>
          </div>
          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.bor}`,display:"flex",gap:8,flexShrink:0,background:T.surfH,alignItems:"center"}}>
            {/* Red back button — prominent, at left of send bar */}
            <button onClick={()=>setSelected(null)}
              style={{width:42,height:42,borderRadius:"50%",background:"#dc2626",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",flexShrink:0,boxShadow:"0 3px 10px rgba(220,38,38,.4)",transition:"all .15s",fontFamily:"inherit"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c";e.currentTarget.style.transform="scale(1.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.transform="scale(1)";}}
              title="Back to all messages"
            >←</button>
            <input ref={inputRef} value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} placeholder="Type a message… (Enter to send)"
              style={{flex:1,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:12,color:T.txt,padding:"11px 16px",fontSize:14,fontFamily:"inherit",outline:"none",transition:"border-color .18s"}}
              onFocus={e=>e.target.style.borderColor=T.scarlet}
              onBlur={e=>e.target.style.borderColor=T.bor}
            />
            <Btn T={T} sm onClick={sendMsg} style={{flexShrink:0}}>Send</Btn>
          </div>
        </div>
      ):(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",color:T.mut,flexDirection:"column",gap:10}}>
          <span style={{fontSize:36}}>💬</span>
          <span style={{fontSize:14,fontWeight:600}}>Select a conversation</span>
        </div>
      )}
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({task,emps,canManage,onToggle,onDelete,T,isDone,delay}) {
  const [hov,setHov]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const assignee=task.assignedTo==="all"?null:emps.find(e=>e.id===task.assignedTo);
  const creator=emps.find(e=>e.id===task.createdBy);
  const overdue=task.dueDate&&!task.done&&new Date(task.dueDate)<new Date();
  const pc={Low:T.mut,Medium:T.blue,High:T.scarlet};
  const dl=daysLeft(task.dueDate);
  return (
    <div className="card" onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:isDone?T.bg:T.card,border:`1px solid ${expanded?T.scarlet+"66":overdue?T.scarlet+"55":hov?T.borH:T.bor}`,borderRadius:T.sp.r+4,opacity:isDone?0.55:1,animation:`fadeUp .25s ${delay||0}ms ease both`,overflow:"hidden",transition:"border-color .2s"}}>
      {/* Main row */}
      <div style={{padding:T.compact?"10px 14px":"13px 16px",display:"flex",alignItems:"flex-start",gap:12}}>
        <button onClick={e=>{e.stopPropagation();onToggle(task.id);}} style={{width:22,height:22,borderRadius:6,border:`2px solid ${isDone?T.blue:hov?T.blue:T.bor}`,background:isDone?T.blue:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:900,fontFamily:"inherit",transition:"all .18s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >{isDone?"✓":""}</button>
        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:T.fs.lg,textDecoration:isDone?"line-through":"none",color:isDone?T.mut:T.txt,transition:"color .18s"}}>{task.title}</span>
            <Tag label={task.priority} color={pc[task.priority]||T.mut}/>
            {overdue&&<Tag label="OVERDUE" color={T.scarlet}/>}
            {task.repeat&&<Tag label="🔁" color={T.blue}/>}
          </div>
          <div style={{display:"flex",gap:10,marginTop:4,fontSize:T.fs.xs+1,color:T.mut,flexWrap:"wrap",alignItems:"center"}}>
            <span>👤 {assignee?assignee.name:"Everyone"}</span>
            {task.dueDate&&<span style={{color:overdue?T.scarlet:dl!==null&&dl<=2?T.warn:T.mut}}>📅 {fmtD(task.dueDate)}</span>}
          </div>
        </div>
        {/* Expand toggle */}
        <button onClick={()=>setExpanded(e=>!e)} title="View details"
          style={{background:expanded?T.scarlet+"18":"none",border:`1px solid ${expanded?T.scarlet+"55":T.bor}`,borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:expanded?T.scarlet:T.sub,fontWeight:700,flexShrink:0,transition:"all .18s",fontFamily:"inherit"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.scarlet+"88";e.currentTarget.style.color=T.scarlet;}}
          onMouseLeave={e=>{if(!expanded){e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}}
        >{expanded?"▲":"▼ Details"}</button>
        {canManage&&<button onClick={e=>{e.stopPropagation();onDelete(task.id);}} style={{background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:16,padding:"2px 4px",transition:"color .15s,transform .15s",flexShrink:0}}
          onMouseEnter={e=>{e.currentTarget.style.color=T.scarlet;e.currentTarget.style.transform="scale(1.3) rotate(8deg)";}}
          onMouseLeave={e=>{e.currentTarget.style.color=T.faint;e.currentTarget.style.transform="scale(1)";}}
        >✕</button>}
      </div>
      {/* Expanded detail panel */}
      {expanded&&(
        <div style={{borderTop:`1px solid ${T.bor}`,padding:"12px 16px",background:T.bg,display:"grid",gap:10,animation:"fadeUp .2s ease both"}}>
          {task.description?(
            <div>
              <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>DESCRIPTION</div>
              <div style={{fontSize:T.fs.md,color:T.txt,lineHeight:1.6,background:T.surf,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.bor}`}}>{task.description}</div>
            </div>
          ):(
            <div style={{fontSize:13,color:T.sub,fontStyle:"italic"}}>No description added.</div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.bor}`}}>
              <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>ASSIGNED TO</div>
              <div style={{fontSize:13,fontWeight:600,color:T.txt}}>👤 {assignee?assignee.name:"Everyone"}</div>
            </div>
            <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.bor}`}}>
              <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>PRIORITY</div>
              <div style={{fontSize:13,fontWeight:600,color:pc[task.priority]||T.mut}}>{task.priority||"Medium"}</div>
            </div>
            {task.dueDate&&(
              <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:`1px solid ${overdue?T.scarlet+"55":T.bor}`}}>
                <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>DUE DATE</div>
                <div style={{fontSize:13,fontWeight:600,color:overdue?T.scarlet:T.txt}}>📅 {fmtD(task.dueDate)} {overdue?"(Overdue)":dl===0?"(Today)":dl===1?"(Tomorrow)":""}</div>
              </div>
            )}
            {creator&&(
              <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.bor}`}}>
                <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>CREATED BY</div>
                <div style={{fontSize:13,fontWeight:600,color:T.txt}}>{creator.name}</div>
              </div>
            )}
          </div>
          {task.repeat&&(
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.blue,fontWeight:600}}>
              🔁 This task repeats automatically when completed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({T,value,onChange,placeholder}) {
  const [f,setF]=useState(false);
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={`🔍  ${placeholder}`}
    style={{flex:1,minWidth:140,background:T.surf,border:`1px solid ${f?T.blue:T.bor}`,borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:T.fs.md,fontFamily:"inherit",outline:"none",boxShadow:f?`0 0 0 3px ${T.bG}`:"none",transition:"border-color .18s,box-shadow .18s"}}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}

const SLabel=({children,dim,T})=><div style={{fontSize:10,fontWeight:800,letterSpacing:"0.07em",marginBottom:6,color:dim?T.faint:T.mut}}>{children}</div>;
const Empty=({icon,msg,T})=><div style={{textAlign:"center",padding:"44px 0",color:T.mut}}><div style={{fontSize:34}}>{icon}</div><div style={{marginTop:9,fontSize:13,fontWeight:600,color:T.sub}}>{msg}</div></div>;
const Hr=({T})=><div style={{height:1,background:T.bor,margin:`${T.sp.md}px 0`}}/>;

// ─── TECH METRICS (simulated) ─────────────────────────────────────────────────
function TechMetrics({T}) {
  const [cpu,setCpu]=useState(Math.floor(Math.random()*40+10));
  const [mem,setMem]=useState(Math.floor(Math.random()*30+40));
  const [ping,setPing]=useState(Math.floor(Math.random()*40+8));
  useEffect(()=>{
    const i=setInterval(()=>{
      setCpu(p=>Math.min(95,Math.max(5,p+Math.floor(Math.random()*10-4))));
      setMem(p=>Math.min(90,Math.max(30,p+Math.floor(Math.random()*6-2))));
      setPing(p=>Math.min(200,Math.max(5,p+Math.floor(Math.random()*20-8))));
    },2000);
    return()=>clearInterval(i);
  },[]);
  const Bar=({val,color})=>(
    <div style={{height:8,background:T.bor,borderRadius:4,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:`${val}%`,background:val>80?T.err:val>60?T.warn:color,borderRadius:4,transition:"width .8s ease"}}/>
    </div>
  );
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}} className="two-col">
      {[{label:"CPU Usage",val:cpu,color:T.blue,icon:"💻"},{label:"Memory",val:mem,color:"#7c3aed",icon:"🧠"},{label:"API Response",val:Math.round(ping/2),raw:`${ping}ms`,color:T.ok,icon:"📡"}].map(m=>(
        <div key={m.label} style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:12,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:T.sub,fontWeight:700}}>{m.icon} {m.label}</span>
            <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:800,color:m.val>80?T.err:m.raw?T.ok:m.color}}>{m.raw||`${m.val}%`}</span>
          </div>
          {!m.raw&&<Bar val={m.val} color={m.color}/>}
        </div>
      ))}
    </div>
  );
}


// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({T,emailIn,setEmailIn,emailErr,setEmailErr,showPin,setShowPin,pinIn,setPinIn,doLogin,doPin,notice,setScreen,siteOffline}) {
  const [tick,setTick]=useState(0);
  const [focused,setFocused]=useState(false);
  const [typeIdx,setTypeIdx]=useState(0);
  const taglines=["Staff Portal for MNU's Neer Locker.","Sign in to get started.","Manage tasks, inventory, and your team.","Keep things running smoothly.","All your shift tools in one place.","Built for the Neer Locker team.","Stay connected with your crew.","Tasks. Inventory. Communication.","Your work hub, simplified.","Track everything that matters.","Quick access for every shift.","Reliable. Simple. Yours."];
  const [tagLine,setTagLine]=useState(0);

  useEffect(()=>{
    const i=setInterval(()=>{
      setTick(t=>t+1);
      setTypeIdx(t=>t+1);
    },120);
    const tl=setInterval(()=>setTagLine(l=>(l+1)%taglines.length),3500);
    return()=>{clearInterval(i);clearInterval(tl);};
  },[]);

  // School emoji particles — only school related
  const SCHOOL_EMOJIS=["🎓","📚","✏️","📝","🏫","📐","🔬","📖","🎒","🏆"];
  // Keep particles in top 0-25% and bottom 75-100% only — never over the form
  const particles=SCHOOL_EMOJIS.map((e,i)=>({
    emoji:e,
    x:2+i*6.5,
    y:i%2===0
      // Even index: top strip 0-22%
      ? (((tick*0.22+i*30)%22))
      // Odd index: bottom strip 78-100%
      : 78+(((tick*0.2+i*25)%22)),
    opacity:0.09+Math.abs(Math.sin(tick*0.018+i))*0.08,
    scale:0.5+Math.abs(Math.sin(tick*0.012+i))*0.5,
    rot:(tick*0.5+i*24)%360,
  }));

  // Shooting stars
  const stars=Array.from({length:6},(_,i)=>({
    x:(((tick*0.8+i*60)%130))-15,
    y:5+i*15,
    opacity:Math.max(0,Math.sin((tick*0.05+i*1.1)))*0.6,
    w:40+i*12,
  }));

  // Color orbs — richer, more varied
  const orbs=[
    {x:8,  y:12, size:360, color:"#C8102E", spd:0.4, blur:50},
    {x:85, y:75, size:300, color:"#1e7fa8", spd:0.6, blur:45},
    {x:65, y:8,  size:220, color:"#7c3aed", spd:0.8, blur:40},
    {x:3,  y:80, size:240, color:"#1e7fa8", spd:0.5, blur:40},
    {x:92, y:35, size:200, color:"#C8102E", spd:0.7, blur:35},
    {x:45, y:90, size:180, color:"#7c3aed", spd:0.9, blur:35},
  ];

  // Animated wave points for bottom SVG
  const wpts=Array.from({length:18},(_,i)=>{
    const x=i*(100/17);
    const y=50+Math.sin(tick*0.04+i*0.6)*18+Math.sin(tick*0.025+i*0.9)*10;
    return`${i===0?"M":"L"}${x},${y}`;
  }).join(" ");

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px 80px",position:"relative",overflow:"hidden",background:T.dark?"#04020a":"#f5f0f6"}}>

      {/* Rich animated orbs */}
      {orbs.map((o,i)=>(
        <div key={i} style={{position:"fixed",left:`${o.x+Math.sin(tick*0.009*o.spd+i)*4}%`,top:`${o.y+Math.cos(tick*0.007*o.spd+i)*5}%`,width:o.size,height:o.size,borderRadius:"50%",background:`radial-gradient(circle,${o.color} 0%,transparent 68%)`,opacity:T.dark?0.16:0.09,transform:"translate(-50%,-50%)",filter:`blur(${o.blur}px)`,pointerEvents:"none"}}/>
      ))}

      {/* Shooting stars */}
      {stars.map((s,i)=>(
        <div key={i} style={{position:"fixed",left:`${s.x}%`,top:`${s.y}%`,width:s.w,height:2,background:`linear-gradient(90deg,transparent,${T.scarlet},transparent)`,opacity:s.opacity,borderRadius:2,pointerEvents:"none",transform:"rotate(-15deg)"}}/>
      ))}

      {/* Grid pattern */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${T.bor} 1px,transparent 1px),linear-gradient(90deg,${T.bor} 1px,transparent 1px)`,backgroundSize:"44px 44px",opacity:T.dark?0.12:0.06,pointerEvents:"none"}}/>

      {/* Bottom wave SVG */}
      <svg style={{position:"fixed",bottom:0,left:0,width:"100%",height:80,pointerEvents:"none",opacity:0.15}} viewBox="0 0 100 80" preserveAspectRatio="none">
        <path d={wpts} stroke={T.scarlet} strokeWidth="0.8" fill="none"/>
      </svg>

      {/* School emoji particles */}
      {particles.map((p,i)=>(
        <div key={i} style={{position:"fixed",left:`${p.x}%`,top:`${p.y}%`,fontSize:18,opacity:p.opacity,transform:`scale(${p.scale}) rotate(${p.rot}deg)`,pointerEvents:"none",userSelect:"none"}}>{p.emoji}</div>
      ))}

      {/* Animated accent bar */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${T.scarlet},${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 3s linear infinite",zIndex:10}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 4s linear infinite reverse",zIndex:10}}/>

      {/* Offline banner */}
      {siteOffline&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"#991b1b",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 2px 12px rgba(0,0,0,.3)"}}>
          <span style={{fontSize:18}}>🔴</span>
          <span style={{color:"#fff",fontWeight:800,fontSize:14,letterSpacing:"0.02em"}}>System Offline — Maintenance in Progress</span>
          <span style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>Only authorized administrators may sign in.</span>
        </div>
      )}
      {notice&&(
        <div style={{position:"fixed",top:siteOffline?50:16,left:"50%",transform:"translateX(-50%)",zIndex:100,background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 18px",display:"flex",gap:10,alignItems:"center",whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>
          <span>🚨</span><span style={{color:"#991b1b",fontWeight:700,fontSize:13}}>{notice}</span>
        </div>
      )}

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:5}}>

        {/* Logo — centered title, icon to the left with rings fully visible */}
        <div className="fu" style={{marginBottom:14,textAlign:"center"}}>
          {/* Row: icon + title side by side, centered */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,marginBottom:8}}>
            {/* Icon with pulse rings — padding gives rings room to breathe */}
            {/* Icon container — oversized to give outer ring room on all sides */}
            <div style={{position:"relative",flexShrink:0,width:90,height:90,display:"flex",alignItems:"center",justifyContent:"center",overflow:"visible"}}>
              {/* Inner ring — tight around the 58px icon, centered in 90px box = 16px margin each side */}
              <div style={{position:"absolute",width:70,height:70,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:22,border:`2px solid ${T.scarlet}`,opacity:0.3,animation:"pulse 2s ease-in-out infinite"}}/>
              {/* Outer ring — 86px, still centered */}
              <div style={{position:"absolute",width:86,height:86,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:26,border:`1px solid ${T.scarlet}`,opacity:0.15,animation:"pulse 2.2s ease-in-out infinite",animationDelay:"0.5s"}}/>
              {/* Icon square */}
              <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:58,height:58,borderRadius:18,background:`linear-gradient(135deg,${T.scarlet} 0%,${T.sD} 60%,#7c0020 100%)`,boxShadow:`0 8px 28px ${T.scarlet}50,0 0 0 2px ${T.scarlet}44`,fontSize:28,animation:"popIn .6s cubic-bezier(.34,1.56,.64,1)",position:"relative",zIndex:1}}>🎓</div>
            </div>
            {/* Title */}
            <div style={{textAlign:"left"}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:T.txt,letterSpacing:"-0.5px",lineHeight:1.05}}>
                MNU's <span style={{color:T.scarlet,textShadow:`0 0 24px ${T.scarlet}45`}}>Neer Locker</span>
              </div>
              <div style={{color:T.sub,fontSize:11,fontWeight:500,marginTop:2}}>Staff Portal · MidAmerica Nazarene University</div>
            </div>
          </div>
          {/* Tagline + status pill row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <div key={tagLine} style={{animation:"fadeUp .4s ease both"}}>
              <span style={{fontSize:11,color:T.scarlet,fontWeight:700,fontStyle:"italic",opacity:0.75}}>{taglines[tagLine]}</span>
            </div>
            <div style={{width:1,height:10,background:T.bor}}/>
            <div style={{display:"inline-flex",alignItems:"center",gap:4,background:T.dark?"rgba(200,16,46,0.12)":"rgba(200,16,46,0.06)",border:`1px solid ${T.scarlet}28`,borderRadius:20,padding:"2px 8px"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:T.ok,display:"inline-block",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.04em"}}>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="fu" style={{animationDelay:".08s",background:T.dark?"rgba(18,8,12,0.88)":T.surf,backdropFilter:"blur(24px)",border:`1px solid ${focused?T.scarlet+"88":T.bor}`,borderRadius:20,padding:26,display:"grid",gap:16,boxShadow:T.dark?`0 12px 48px rgba(0,0,0,.6),0 0 0 1px ${T.scarlet}11 inset`:`0 12px 40px rgba(0,0,0,.1),0 1px 0 rgba(255,255,255,0.8) inset`,transition:"border-color .25s,box-shadow .25s"}}>
          <Inp T={T} label="MNU EMAIL" type="email" placeholder="you@mnu.edu" value={emailIn} error={emailErr}
            onChange={e=>{setEmailIn(e.target.value);setEmailErr("");}}
            onKeyDown={e=>e.key==="Enter"&&(showPin?doPin():doLogin())}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          />
          {showPin&&(
            <div style={{animation:"fadeUp .22s ease"}}>
              <Inp T={T} label="PIN" type="password" placeholder="Enter your PIN" value={pinIn} maxLength={8}
                onChange={e=>setPinIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doPin()}/>
            </div>
          )}
          <Btn T={T} full onClick={()=>{playSound("click");showPin?doPin():doLogin();}} style={{padding:"14px 20px",fontSize:16,letterSpacing:"0.02em",boxShadow:`0 6px 24px ${T.scarlet}40,0 2px 0 ${T.scarlet}22 inset`}}>
            {showPin?"Confirm PIN →":"Sign In →"}
          </Btn>
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setScreen("techLogin")} style={{background:"none",border:"none",color:T.faint,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.04em",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.sub}
              onMouseLeave={e=>e.currentTarget.style.color=T.faint}
            >Technical Administrator Access</button>
          </div>
        </div>

        {/* Demo logins */}
        <div className="fu" style={{animationDelay:".16s",marginTop:14,background:T.dark?"rgba(18,8,12,0.75)":T.surf,backdropFilter:"blur(20px)",border:`1px solid ${T.bor}`,borderRadius:16,padding:16,boxShadow:"0 4px 20px rgba(0,0,0,.08)"}}>
          <div style={{fontSize:11,color:T.mut,fontWeight:700,marginBottom:10,letterSpacing:"0.06em"}}>DEMO LOGINS — click to autofill</div>
          {SEED.map((e,i)=>(
            <div key={e.id} onClick={()=>{setEmailIn(e.email);setEmailErr("");setShowPin(false);}}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 8px",cursor:"pointer",borderRadius:10,transition:"all .15s",animation:`fadeUp .3s ${0.18+i*0.06}s ease both`}}
              onMouseEnter={ev=>{ev.currentTarget.style.background=T.surfH;ev.currentTarget.style.transform="translateX(4px)";ev.currentTarget.style.boxShadow=`2px 0 0 ${T.scarlet} inset`;}}
              onMouseLeave={ev=>{ev.currentTarget.style.background="transparent";ev.currentTarget.style.transform="translateX(0)";ev.currentTarget.style.boxShadow="none";}}
            >
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:ROLES[e.role].color+"28",border:`2px solid ${ROLES[e.role].color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:ROLES[e.role].color,fontSize:13,boxShadow:`0 0 8px ${ROLES[e.role].color}22`}}>{e.email[0].toUpperCase()}</div>
                <span style={{fontSize:13,color:T.sub}}>{e.email}</span>
              </div>
              <Tag label={ROLES[e.role].label} color={ROLES[e.role].color}/>
            </div>
          ))}
        </div>
      </div>

      <ClaudeTag T={T}/><VersionBadge T={T}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [T,setT]=useState(T0);
  const [dark,setDk]=useState(false);
  const [compact,setCompact]=useState(false);
  const [accent,setAccent]=useState("");
  const [soundOn,setSoundOn]=useState(true);
  const [soundVol,setSoundVol]=useState(0.22);
  const [deviceMode,setDeviceMode]=useState("auto"); // "auto" | "mobile" | "desktop"

  const [screen,setScreen]=useState("login");
  const [user,setUser]=useState(null);
  const [welData,setWelData]=useState({name:"",role:"employee"});
  const [showBriefing,setShowBriefing]=useState(false);
  const [loggingOut,setLoggingOut]=useState(false);
  const [techAction,setTechAction]=useState("");

  const [emailIn,setEmailIn]=useState("");
  const [emailErr,setEmailErr]=useState("");
  const [pinIn,setPinIn]=useState("");
  const [showPin,setShowPin]=useState(false);
  const [pending,setPending]=useState(null);
  const [tries,setTries]=useState(0);
  const [locked,setLocked]=useState(0);
  const [tEmail,setTEmail]=useState("");
  const [tPin,setTPin]=useState("");
  const [tErr,setTErr]=useState("");
  const [techLoading,setTechLoading]=useState(false);
  const [techExiting,setTechExiting]=useState(false);

  // Tech PIN gate for viewing employee PINs
  const [techPinGate,setTechPinGate]=useState(false);
  const [selectedTasks,setSelectedTasks]=useState(new Set());
  const [showFeedback,setShowFeedback]=useState(false);
  const [feedbackForm,setFeedbackForm]=useState({type:"feature",msg:""});
  const [techPinInput,setTechPinInput]=useState("");
  const [techPinErr,setTechPinErr]=useState("");
  const [pinRevealed,setPinRevealed]=useState(false);

  const [emps,setEmps]=useState(SEED);
  const [tasks,setTasks]=useState([]);
  const [inv,setInv]=useState([]);
  const [anns,setAnns]=useState([]);
  const [act,setAct]=useState([]);
  const [errs,setErrs]=useState([]);
  const [bkps,setBkps]=useState([]);
  const [dms,setDms]=useState([]);
  const [notice,setNotice]=useState("");
  const [siteOffline,setSiteOffline]=useState(false);

  const [page,setPage]=useState("home");
  const [swipeBacking,setSwipeBacking]=useState(false);
  const [modal,setModal]=useState(null);
  const [nameSaved,setNameSaved]=useState(false);
  const [pinSaved,setPinSaved]=useState(false);
  const [emailSaved,setEmailSaved]=useState(false);
  const [form,setForm]=useState({});
  const [toasts,setToasts]=useState([]);
  const [search,setSearch]=useState("");
  const [undoId,setUndoId]=useState(null);
  const [setTab2,setSettingsTab]=useState("profile");
  const [logF,setLogF]=useState("all");
  const undoRef=useRef(null);
  const inactiveRef=useRef(null);
  const loginTimerRef=useRef(null);

  // Load data
  useEffect(()=>{
    let alive=true;
    (async()=>{
      const [empRows,taskRows,invRows,annRows,actRows,errRows,bkpRows,dmRows,sn,dk,cp,accentVal,offlineVal]=await Promise.all([
        SB.select("employees","?order=created_at.asc"),
        SB.select("tasks","?order=created_at.desc"),
        SB.select("inventory","?order=created_at.asc"),
        SB.select("announcements","?order=at.desc"),
        SB.select("activity","?order=at.desc&limit=300"),
        SB.select("system_logs","?order=at.desc&limit=200"),
        SB.select("backups","?order=at.desc&limit=10"),
        SB.select("direct_messages","?order=at.asc"),
        DB.get("nl3-notice"),Promise.resolve(LS.get("nl3-dark")),Promise.resolve(LS.get("nl3-compact")),Promise.resolve(LS.get("nl3-accent")),DB.get("nl3-offline"),
      ]);
      if(!alive) return;
      // Map Supabase rows back to app format
      const mappedEmps=empRows?.length>0
        ?empRows.map(e=>({id:e.id,email:e.email,name:e.name,role:e.role,pin:e.pin||"",status:e.status||"offline",createdAt:e.created_at}))
        :SEED;
      setEmps(mappedEmps);
      // Seed initial employees if none exist
      if(!empRows?.length){for(const s of SEED)await SB.upsert("employees",{id:s.id,email:s.email,name:s.name,role:s.role,pin:s.pin||"",status:"offline",created_at:s.createdAt||Date.now()});}

      setTasks((taskRows||[]).map(t=>({id:t.id,title:t.title,description:t.description||"",priority:t.priority,assignedTo:t.assigned_to,createdBy:t.created_by||"",dueDate:t.due_date,done:t.done,repeat:t.repeat,createdAt:t.created_at})));
      setInv((invRows||[]).map(i=>({id:i.id,name:i.name,stock:i.stock,createdAt:i.created_at})));
      setAnns((annRows||[]).map(a=>({id:a.id,msg:a.msg,level:a.level,by:a.by_name,at:a.at,dismissed:a.dismissed||[],patchNotes:a.patch_notes,patchVersion:a.patch_version,patchBuild:a.patch_build})));
      setAct((actRows||[]).map(a=>({id:a.id,type:a.type,msg:a.msg,userId:a.user_id,at:a.at})));
      setErrs((errRows||[]).map(e=>({id:e.id,level:e.level,msg:e.msg,at:e.at})));
      setBkps((bkpRows||[]).map(b=>({id:b.id,at:b.at,...(b.data||{})})));
      setDms((dmRows||[]).map(d=>({id:d.id,from:d.from_id,to:d.to_id,text:d.text,at:d.at,read:d.read,system:d.system,threadWith:d.thread_with,feedback:d.feedback})));
      if(sn) setNotice(sn);
      const d=dk??false; const c=cp??false; const av=accentVal||"";
      setDk(d); setCompact(c); setAccent(av); setT(mkTheme(d,c,av));
      if(offlineVal) setSiteOffline(offlineVal);
      // Sound prefs loaded separately
      const sOn=LS.get("nl3-sound-on"); if(sOn!==null)setSoundOn(sOn);
      const sVol=LS.get("nl3-sound-vol"); if(sVol!==null)setSoundVol(sVol);
      const dMode=LS.get("nl3-device-mode"); if(dMode)setDeviceMode(dMode);
    })();
    return()=>{alive=false;};
  },[]);

  // Refresh shared data from Supabase — called on interval and on key actions
  const refreshData=useCallback(async()=>{
    const [empRows,taskRows,invRows,annRows,actRows,errRows,dmRows]=await Promise.all([
      SB.select("employees","?order=created_at.asc"),
      SB.select("tasks","?order=created_at.desc"),
      SB.select("inventory","?order=created_at.asc"),
      SB.select("announcements","?order=at.desc"),
      SB.select("activity","?order=at.desc&limit=300"),
      SB.select("system_logs","?order=at.desc&limit=200"),
      SB.select("direct_messages","?order=at.asc"),
    ]);
    if(empRows?.length) setEmps(empRows.map(e=>({id:e.id,email:e.email,name:e.name,role:e.role,pin:e.pin||"",status:e.status||"offline",createdAt:e.created_at})));
    if(taskRows?.length>=0) setTasks(taskRows.map(t=>({id:t.id,title:t.title,priority:t.priority,assignedTo:t.assigned_to,dueDate:t.due_date,done:t.done,repeat:t.repeat,createdAt:t.created_at})));
    if(invRows) setInv(invRows.map(i=>({id:i.id,name:i.name,stock:i.stock,createdAt:i.created_at})));
    if(annRows) setAnns(annRows.map(a=>({id:a.id,msg:a.msg,level:a.level,by:a.by_name,at:a.at,dismissed:a.dismissed||[],patchNotes:a.patch_notes,patchVersion:a.patch_version,patchBuild:a.patch_build})));
    if(actRows) setAct(actRows.map(a=>({id:a.id,type:a.type,msg:a.msg,userId:a.user_id,at:a.at})));
    if(errRows) setErrs(errRows.map(e=>({id:e.id,level:e.level,msg:e.msg,at:e.at})));
    if(dmRows) setDms(dmRows.map(d=>({id:d.id,from:d.from_id,to:d.to_id,text:d.text,at:d.at,read:d.read,system:d.system,threadWith:d.thread_with,feedback:d.feedback})));
  },[]);

  // Poll every 8 seconds when app is open — keeps all data fresh across devices
  useEffect(()=>{
    if(screen!=="app"&&screen!=="tech") return;
    const interval=setInterval(refreshData, 8000);
    return()=>clearInterval(interval);
  },[screen, refreshData]);

  // Set offline when user closes tab/browser
  useEffect(()=>{
    const handleUnload=()=>{
      if(user?.id){
        navigator.sendBeacon(`${SUPABASE_URL}/rest/v1/employees?id=eq.${user.id}`,
          new Blob([JSON.stringify({status:"offline"})],{type:"application/json"})
        );
      }
    };
    window.addEventListener("beforeunload",handleUnload);
    return()=>window.removeEventListener("beforeunload",handleUnload);
  },[user?.id]);

  // Auto logout on inactivity
  const resetInactive=useCallback(()=>{
    clearTimeout(inactiveRef.current);
    if(screen==="app") inactiveRef.current=setTimeout(()=>{
      doLogout(); toast("Auto logged out due to inactivity","warn");
    },AUTO_LOGOUT_MS);
  },[screen]);

  useEffect(()=>{
    const events=["mousemove","keydown","click","touchstart"];
    events.forEach(e=>window.addEventListener(e,resetInactive,{passive:true}));
    resetInactive();
    return()=>{events.forEach(e=>window.removeEventListener(e,resetInactive));clearTimeout(inactiveRef.current);};
  },[resetInactive]);

  // Persist helpers
  const saveEmps =useCallback(async v=>{
    setEmps(v);
    // Upsert each employee to Supabase
    for(const e of v){
      await SB.upsert("employees",{id:e.id,email:e.email,name:e.name,role:e.role,pin:e.pin||"",status:e.status||"offline",created_at:e.createdAt||Date.now()});
    }
  },[]);
  // upsertTask — save a single task to Supabase
  const upsertTask=useCallback(async t=>{
    const row={
      id:t.id,
      title:t.title||"",
      description:t.description||"",
      priority:t.priority||"Medium",
      assigned_to:t.assignedTo||"all",
      created_by:t.createdBy||"",
      due_date:t.dueDate||"",
      done:t.done||false,
      repeat:t.repeat||false,
      created_at:t.createdAt||Date.now()
    };
    const r=await SB.upsert("tasks",row);
    if(!r) console.warn("upsertTask failed for:",t.title);
    return r;
  },[]);

  const saveTasks=useCallback(async v=>{
    setTasks(v);
    // Only upsert — don't delete. Individual deletes handled by delTask.
    for(const t of v){
      await SB.upsert("tasks",{id:t.id,title:t.title,description:t.description||"",priority:t.priority||"Medium",assigned_to:t.assignedTo||"all",created_by:t.createdBy||"",due_date:t.dueDate||"",done:t.done||false,repeat:t.repeat||false,created_at:t.createdAt||Date.now()});
    }
  },[]);
  const saveInv  =useCallback(async v=>{
    setInv(v);
    for(const i of v){
      await SB.upsert("inventory",{id:i.id,name:i.name,stock:i.stock||0,created_at:i.createdAt||Date.now()});
    }
  },[]);
  const saveAnns =useCallback(async v=>{
    setAnns(v);
    for(const a of v){
      await SB.upsert("announcements",{id:a.id,msg:a.msg,level:a.level||"info",by_name:a.by||"System",at:a.at||Date.now(),dismissed:a.dismissed||[],patch_notes:a.patchNotes||null,patch_version:a.patchVersion||null,patch_build:a.patchBuild||null});
    }
  },[]);
  const saveDms  =useCallback(async v=>{
    setDms(v);
    for(const d of v){
      await SB.upsert("direct_messages",{id:d.id,from_id:d.from||"",to_id:d.to||"",text:d.text||"",at:d.at||Date.now(),read:d.read||false,system:d.system||false,thread_with:d.threadWith||"",feedback:d.feedback||false});
    }
  },[]);

  const addAct=useCallback(async(type,msg,uid_)=>{
    const newAct={id:uid(),type,msg,userId:uid_,at:Date.now()};
    SB.upsert("activity",{id:newAct.id,type:newAct.type,msg:newAct.msg,user_id:newAct.userId,at:newAct.at});
    setAct(prev=>[newAct,...prev].slice(0,300));
  },[]);
  const addErr=useCallback(async(level,msg)=>{
    const newErr={id:uid(),level,msg,at:Date.now()};
    SB.upsert("system_logs",{id:newErr.id,level:newErr.level,msg:newErr.msg,at:newErr.at});
    setErrs(prev=>[newErr,...prev].slice(0,200));
  },[]);

  const toast=useCallback((msg,type="ok")=>{
    const id=uid();
    setToasts(p=>[...p.slice(-4),{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3200);
  },[]);

  const applyTheme=useCallback(async(d,c,a)=>{const ac=a!==undefined?a:accent;setDk(d);setCompact(c);setAccent(ac);setT(mkTheme(d,c,ac));LS.set("nl3-dark",d);LS.set("nl3-compact",c);if(a!==undefined)LS.set("nl3-accent",a);},[accent]);

  const applySoundSettings=useCallback(async(on,vol)=>{
    setSoundOn(on);setSoundVol(vol);
    window._soundOn=on;window._soundVol=vol;
    LS.set("nl3-sound-on",on);LS.set("nl3-sound-vol",vol);
  },[]);

  // Keep window globals in sync
  useEffect(()=>{window._soundOn=soundOn;window._soundVol=soundVol;},[soundOn,soundVol]);

  // Apply device mode scaling to root element
  const applyDeviceMode=useCallback(async(mode)=>{
    setDeviceMode(mode);
    LS.set("nl3-device-mode",mode);
    const root=document.documentElement;
    // Detect actual screen size for "auto"
    const isMobileScreen=window.innerWidth<=768;
    const useMobile=mode==="mobile"||(mode==="auto"&&isMobileScreen);
    if(useMobile){
      root.style.setProperty("--app-scale","1");
      root.style.fontSize="18px";
      root.setAttribute("data-device","mobile");
    } else {
      root.style.setProperty("--app-scale","1");
      root.style.fontSize="13px";
      root.setAttribute("data-device","desktop");
    }
    playSound("click");
  },[]);

  // Apply on mount based on saved mode
  useEffect(()=>{
    const isMobileScreen=window.innerWidth<=768;
    const useMobile=deviceMode==="mobile"||(deviceMode==="auto"&&isMobileScreen);
    document.documentElement.style.fontSize=useMobile?"18px":"13px";
    document.documentElement.setAttribute("data-device",useMobile?"mobile":"desktop");
  },[deviceMode]);

  // AUTH
  const doLogin=()=>{
    const email=String(emailIn||"").trim().toLowerCase();
    if(!email){setEmailErr("Please enter your MNU email.");return;}
    if(!okEmail(email)){setEmailErr("Invalid email. Check your spelling or ask Professor Sinclair to add you.");return;}
    // Block login when site is offline — only tech admin email can still log in
    if(siteOffline && email!==TECH_EMAIL){
      setEmailErr("The system is currently offline for maintenance. Please check back later.");
      playSound("error");
      return;
    }
    if(locked>Date.now()){setEmailErr(`Too many attempts. Try again in ${Math.ceil((locked-Date.now())/60000)} min.`);return;}
    const match=emps.find(e=>e.email.toLowerCase()===email);
    if(!match){
      const a=tries+1;setTries(a);
      if(a>=MAX_TRIES){setLocked(Date.now()+LOCK_MS);addErr("warn",`Lockout triggered — ${a} failed attempts for ${email}`);}
      else addErr("warn",`Failed login attempt (${a}/${MAX_TRIES}) for ${email}`);
      setEmailErr("Invalid email. Check your spelling or ask Professor Sinclair to add you.");return;
    }
    setTries(0);
    if(match.pin){setPending(match);setShowPin(true);setEmailErr("");return;}
    finishLogin(match);
  };

  const doPin=()=>{
    if(!pending) return;
    if(pinIn!==pending.pin){toast("Incorrect PIN","err");addErr("warn",`Wrong PIN attempt for ${pending.email}`);return;}
    finishLogin(pending);setPinIn("");setPending(null);setShowPin(false);
  };

  const finishLogin=(emp)=>{
    // Cancel any previous pending login transition
    clearTimeout(loginTimerRef.current);
    setWelData({name:emp.name,role:emp.role});
    setScreen("welcome");
    setTries(0);
    // Non-blocking: mark online + log, don't await so timer starts immediately
    // Patch just this employee's status to online — don't upsert all employees
    setEmps(prev=>prev.map(e=>e.id===emp.id?{...e,status:"online"}:e));
    fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${emp.id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({status:"online"})}).catch(()=>{});
    addAct("login",`${emp.name} signed in`,emp.id);
    // Switch to app after animation completes
    playSound("login");
    loginTimerRef.current=setTimeout(()=>{
      setUser({...emp,status:"online"});
      setPage("home");
      setScreen("app");
      setShowBriefing(true);
    },2000);
  };

  const doLogout=()=>{
    clearTimeout(loginTimerRef.current);
    const lu=user;
    // Fade out first, then switch
    playSound("logout");
    setLoggingOut(true);
    setTimeout(()=>{
      setLoggingOut(false);
      setUser(null);setScreen("login");
      setEmailIn("");setEmailErr("");setPinIn("");setShowPin(false);setPending(null);
      setPage("home");setForm({});setShowBriefing(false);
    },1600);
    if(lu){
      // Patch just this employee's status to offline
      setEmps(prev=>prev.map(e=>e.id===lu.id?{...e,status:"offline"}:e));
      fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${lu.id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({status:"offline"})}).catch(()=>{});
      addAct("logout",`${lu.name} signed out`,lu.id);
    }
  };

  const doTechLogin=()=>{
    if(String(tEmail||"").trim().toLowerCase()!==TECH_EMAIL||tPin!==TECH_PIN){
      setTErr("Invalid credentials.");addErr("warn","Failed technical-administrator login attempt");playSound("error");return;
    }
    setTErr("");setTechLoading(true);playSound("login");
    setTimeout(()=>{setTechLoading(false);setScreen("tech");},2800);
  };

  // TASKS
  const createTask=async()=>{
    const title=String(form.tTitle||"").trim();
    if(!title){toast("Task title required","err");return;}
    // Capture all form values BEFORE clearing form
    const desc=san(String(form.tDesc||"").trim());
    const pri=form.tPri||"Medium";
    const assign=form.tAssign||"all";
    const due=form.tDue||"";
    const rep=form.tRepeat||false;
    const task={id:uid(),title:san(title),description:desc,priority:pri,assignedTo:assign,createdBy:user?.id||"",createdAt:Date.now(),done:false,dueDate:due,repeat:rep};
    setModal(null);setForm({});
    toast("Task created! ✅");
    setTasks(prev=>[task,...prev]);
    await upsertTask(task);
    addAct("task_created",`Task created: "${task.title}" by ${user?.name}`,user?.id);
  };

  const toggleTask=async id=>{
    const task=tasks.find(t=>t.id===id);if(!task) return;
    const completing=!task.done;
    const updated={...tasks.find(t=>t.id===id),done:completing};
    setTasks(prev=>prev.map(t=>t.id===id?{...t,done:completing}:t));
    await upsertTask(updated);
    if(completing){
      addAct("task_done",`"${task.title}" completed by ${user?.name}`,user?.id);
      playSound("task");
      clearTimeout(undoRef.current);setUndoId(id);
      undoRef.current=setTimeout(()=>setUndoId(null),7000);
      // If repeat, create new instance
      if(task.repeat){
        setTimeout(async()=>{
          const newTask={...task,id:uid(),done:false,createdAt:Date.now()};
          setTasks(prev=>[newTask,...prev]);
          await upsertTask(newTask);
          toast("Repeating task recreated 🔁");
        },500);
      }
    } else setUndoId(null);
  };

  const doUndo=async()=>{
    if(!undoId) return;
    clearTimeout(undoRef.current);setUndoId(null);
    const undoneTask={...tasks.find(t=>t.id===undoId),done:false};
    setTasks(prev=>prev.map(t=>t.id===undoId?{...t,done:false}:t));
    await upsertTask(undoneTask);
    toast("Undone!");
  };

  const deleteTask=async id=>{
    await SB.delete("tasks",{id});
    setTasks(prev=>prev.filter(t=>t.id!==id));
    toast("Task removed","warn");
  };

  // INVENTORY
  const createItem=()=>{
    const name=String(form.iName||"").trim();
    if(!name){toast("Item name required","err");return;}
    const item={id:uid(),name:san(name),category:san(String(form.iCat||"General").trim()),stock:Math.max(0,parseInt(String(form.iStock||"0"))||0),note:san(String(form.iNote||"").trim()),createdAt:Date.now()};
    setModal(null);setForm({});
    toast(`"${item.name}" added ✅`);
    saveInv([item,...inv]);
  };
  const adjStock=async(id,d)=>await saveInv(inv.map(i=>i.id===id?{...i,stock:Math.max(0,i.stock+d)}:i));
  const delItem=async id=>{await saveInv(inv.filter(i=>i.id!==id));toast("Removed","warn");};

  // ANNOUNCEMENTS
  const createAnn=()=>{
    const msg=String(form.aMsg||"").trim();
    if(!msg){toast("Message required","err");return;}
    const ann={id:uid(),msg:san(msg),level:form.aLvl||"info",by:user?.name||"",at:Date.now(),dismissed:[]};
    setModal(null);setForm({});
    playSound("notify");
    toast("Announcement sent! ✅");
    saveAnns([ann,...anns]);
  };
  const dismissAnn=async id=>{
    const updated=anns.map(a=>a.id===id?{...a,dismissed:[...(a.dismissed||[]),user?.id]}:a);
    setAnns(updated);
    const ann=updated.find(a=>a.id===id);
    if(ann) await fetch(`${SUPABASE_URL}/rest/v1/announcements?id=eq.${id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({dismissed:ann.dismissed})});
  };

  // EMPLOYEES
  const createEmp=async()=>{
    const name=String(form.eName||"").trim();
    const email=String(form.eEmail||"").trim().toLowerCase();
    if(!name||!email){toast("Name and email required","err");return;}
    if(!okEmail(email)){toast("Invalid email","err");return;}
    if(emps.find(e=>e.email===email)){toast("Email already exists","err");return;}
    const emp={id:uid(),name:san(name),email,role:form.eRole||"employee",pin:"",status:"offline",createdAt:Date.now()};
    await saveEmps([...emps,emp]);
    addAct("employee added",`${user?.name} added: ${emp.name}`,user?.id);
    toast(`${emp.name} added!`);setModal(null);setForm({});
  };
  const removeEmp=async id=>{
    if(id===user?.id){toast("Can't remove yourself","err");return;}
    const emp=emps.find(e=>e.id===id);
    await saveEmps(emps.filter(e=>e.id!==id));
    addAct("employee removed",`${user?.name} removed: ${emp?.name}`,user?.id);
    toast("Employee removed","warn");
  };

  // SETTINGS
  const saveName=async()=>{
    const name=String(form.pName||"").trim();
    if(!name){toast("Name required","err");return;}
    const saved=san(name);
    const next=emps.map(e=>e.id===user?.id?{...e,name:saved}:e);
    // Update UI instantly
    setUser(u=>({...u,name:saved}));
    setForm(p=>({...p,pName:saved}));
    setNameSaved(true);
    setTimeout(()=>setNameSaved(false),3000);
    // Save in background
    saveEmps(next);
    DB.set("nl3-emps",next);
  };

  const saveEmail=async()=>{
    const email=String(form.pEmail||"").trim().toLowerCase();
    if(!email){toast("Email required","err");return;}
    if(!okEmail(email)){toast("Invalid email format","err");return;}
    if(emps.find(e=>e.email===email&&e.id!==user?.id)){toast("Email already in use","err");return;}
    const next=emps.map(e=>e.id===user?.id?{...e,email}:e);
    setUser(u=>({...u,email}));setEmps(next);
    DB.set("nl3-emps",next);
    setEmailSaved(true);
    setTimeout(()=>setEmailSaved(false),3500);
    setForm(p=>({...p,pEmail:email}));
    playSound("success");
  };

  const saveStatus=async status=>{
    // Update user state immediately for real-time feel
    setUser(u=>({...u,status}));
    // Update emps list so sidebar StatusDot updates too
    const next=emps.map(e=>e.id===user?.id?{...e,status}:e);
    setEmps(next);
    // Persist in background
    DB.set("nl3-emps",next);
    toast(`Status set to ${status}!`);
  };

  const savePin=async()=>{
    if(!form.pinNew||form.pinNew.length<4){toast("PIN must be 4+ chars","err");return;}
    if(form.pinNew!==form.pinCon){toast("PINs don't match","err");return;}
    const newPin=form.pinNew;
    // Clear form immediately so inputs reset
    setForm(p=>({...p,pinNew:"",pinCon:""}));
    // Show checkmark in next frame to avoid batching with form clear
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      setPinSaved(true);
      setTimeout(()=>setPinSaved(false),3500);
    }));
    // Save in background
    const next=emps.map(e=>e.id===user?.id?{...e,pin:newPin}:e);
    saveEmps(next);
    setUser(u=>({...u,pin:newPin}));
    playSound("success");
  };
  const removePin=async()=>{
    const next=emps.map(e=>e.id===user?.id?{...e,pin:""}:e);
    await saveEmps(next);setUser(u=>({...u,pin:""}));toast("PIN removed");
  };

  // TECH
  const createBackup=async()=>{
    const bk={id:uid(),at:Date.now()};
    await SB.upsert("backups",{id:bk.id,at:bk.at,data:{emps,tasks,inv,anns,act}});
    const next=[{...bk,emps,tasks,inv,anns,act},...bkps].slice(0,10);
    setBkps(next);
    setTechAction("✅ Backup created! Data saved.");
    setTimeout(()=>setTechAction(""),3000);
    addErr("info","Manual backup created");
    playSound("backup");
  };
  const restoreBkp=async bk=>{
    if(bk.emps) await saveEmps(bk.emps);
    if(bk.tasks) await saveTasks(bk.tasks);
    if(bk.inv) await saveInv(bk.inv);
    if(bk.anns) await saveAnns(bk.anns);
    toast("Restored! Reloading…","warn");
    setTimeout(()=>window.location.reload(),1400);
  };
  const clearDemo=async()=>{
    // Delete all rows from each table
    await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/announcements?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/activity?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/system_logs?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/direct_messages?id=neq.none`,{method:"DELETE",headers:SB.headers});
    await fetch(`${SUPABASE_URL}/rest/v1/backups?id=neq.none`,{method:"DELETE",headers:SB.headers});
    setTasks([]);setInv([]);setAnns([]);setAct([]);setErrs([]);setDms([]);setBkps([]);
    await saveEmps(SEED);
    setTechAction("✅ Demo cleared: employees, tasks, inventory, announcements, DMs, activity logs, and backups all reset.");
    setTimeout(()=>setTechAction(""),4000);
    playSound("notify");
  };
  const toggleOffline=async()=>{
    const next=!siteOffline;
    setSiteOffline(next);
    await DB.set("nl3-offline",next); // stored in app_settings
    if(next){
      addErr("warn","Site set OFFLINE by Technical Administrator");
      setTechAction("🔴 Site is now OFFLINE — only Tech Admin can log in.");
    } else {
      addErr("info","Site set ONLINE by Technical Administrator");
      setTechAction("🟢 Site is back ONLINE — all staff can log in.");
    }
    setTimeout(()=>setTechAction(""),4000);
    playSound(next?"warn":"success");
  };

  const sendNotice=async()=>{
    const msg=String(form.nMsg||"").trim();
    if(!msg){toast("Enter a message","err");return;}
    setNotice(msg);await DB.set("nl3-notice",msg);
    const ann={id:uid(),msg:`🚨 NOTICE: ${msg}`,level:"danger",by:"System",at:Date.now(),dismissed:[]};
    await saveAnns([ann,...anns]);toast("Notice sent!","warn");setForm({});
  };
  const clearNotice=async()=>{setNotice("");await DB.set("nl3-notice","");};

  // Computed — memoized to avoid recalculation on every render
  const myAnns=useMemo(()=>anns.filter(a=>!(a.dismissed||[]).includes(user?.id)),[anns,user?.id]);
  const myTasks=useMemo(()=>tasks.filter(t=>t.assignedTo==="all"||t.assignedTo===user?.id||can(user,"assign")),[tasks,user?.id,user?.role]);
  const filtered=useMemo(()=>myTasks.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())),[myTasks,search]);
  const openT=useMemo(()=>filtered.filter(t=>!t.done),[filtered]);
  const doneT=useMemo(()=>filtered.filter(t=>t.done),[filtered]);
  const filtAct=useMemo(()=>logF==="all"?act:act.filter(a=>a.type===logF),[act,logF]);
  const myCompletedCount=useMemo(()=>tasks.filter(t=>t.done&&(t.assignedTo===user?.id||t.assignedTo==="all")).length,[tasks,user?.id]);

  // Most active users for tech dashboard
  const userActivity=useMemo(()=>emps.map(e=>({...e,count:act.filter(a=>a.userId===e.id).length})).sort((a,b)=>b.count-a.count).slice(0,5),[emps,act]);

  const SET_TABS=[
    {key:"profile",label:"Profile"},
    {key:"security",label:"Security"},
    {key:"team",label:"Team",perm:"emp"},
    {key:"display",label:"Display & Sound"},
  ].filter(s=>!s.perm||can(user,s.perm));

  const selSx={width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:T.sp.r,color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none"};

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",minHeight:"100vh",background:T.bg,color:T.txt}}>
      <style>{buildCSS(T)}</style>
      <ToastList items={toasts}/>

      {/* Undo banner */}
      {undoId&&(
        <div style={{position:"fixed",top:16,left:"50%",zIndex:800,background:T.surf,border:`1px solid ${T.warn}88`,borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 5px 20px rgba(0,0,0,.12)",transform:"translateX(-50%)",whiteSpace:"nowrap",animation:"slideUp .3s cubic-bezier(.23,1,.32,1)"}}>
          <span style={{fontSize:14,color:T.txt,fontWeight:600}}>Task marked complete</span>
          <button onClick={()=>{playSound("notify");doUndo();}} style={{background:T.warn,color:"#fff",border:"none",borderRadius:8,padding:"5px 14px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Undo</button>
          <button onClick={()=>setUndoId(null)} style={{background:"none",border:"none",color:T.mut,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      )}

      {/* ═══ LOGIN ══════════════════════════════════════════════════════════════ */}
      {screen==="login"&&(
        <LoginScreen T={T} emailIn={emailIn} setEmailIn={setEmailIn} emailErr={emailErr} setEmailErr={setEmailErr}
          showPin={showPin} setShowPin={setShowPin} pinIn={pinIn} setPinIn={setPinIn}
          doLogin={doLogin} doPin={doPin} notice={notice} setScreen={setScreen} siteOffline={siteOffline}/>
      )}

      {/* ═══ TECH LOGIN ════════════════════════════════════════════════════════ */}
      {techLoading&&<TechWelcomeAnim T={T}/>
      }
      {techExiting&&<TechExitAnim T={T}/>}

      {!techLoading&&screen==="techLogin"&&(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{width:"100%",maxWidth:360}}>
            <div className="fu" style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:40,marginBottom:10}}>🔧</div>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt}}>Technical Administrator Access</div>
              <div style={{color:T.sub,fontSize:13,marginTop:4}}>Restricted — Authorized Personnel Only</div>
            </div>
            <div className="fu" style={{animationDelay:".07s",background:T.surf,border:`1px solid ${T.bor}`,borderRadius:16,padding:22,display:"grid",gap:14}}>
              <Inp T={T} label="ADMIN EMAIL" type="email" placeholder="admin@mnu.edu" value={tEmail} onChange={e=>{setTEmail(e.target.value);setTErr("");}}/>
              <Inp T={T} label="PIN" type="password" placeholder="••••" value={tPin} maxLength={8} onChange={e=>{setTPin(e.target.value);setTErr("");}} onKeyDown={e=>e.key==="Enter"&&doTechLogin()}/>
              {tErr&&<div style={{color:T.err,fontSize:13,fontWeight:700}}>{tErr}</div>}
              <Btn T={T} full onClick={()=>{playSound("click");doTechLogin();}} sound="open">Access Dashboard →</Btn>
              <Btn T={T} full variant="ghost" onClick={()=>setScreen("login")}>← Back</Btn>
            </div>
          </div>
          <VersionBadge T={T}/>
        </div>
      )}

      {/* ═══ WELCOME ANIMATION ════════════════════════════════════════════════ */}
      {screen==="welcome"&&<WelcomeAnim name={welData.name} role={welData.role} T={T} onDone={()=>{}}/>}

      {/* ═══ MAIN APP ══════════════════════════════════════════════════════════ */}
      {screen==="app"&&user&&(
        <div style={{display:"flex",minHeight:"100vh"}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowX:"hidden"}}>
            {/* Top bar */}
            <header style={{background:T.surf,borderBottom:`1px solid ${T.bor}`,padding:"env(safe-area-inset-top, 0px) 16px 0",position:"sticky",top:0,zIndex:300,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.scarlet},${T.blue})`}}/>
              <div style={{display:"flex",alignItems:"center",gap:12,minHeight:56,padding:"0 4px"}}>
                {/* Brand — tappable, goes home */}
                <button onClick={()=>{setSearch("");setPage("home");playSound("click");}} style={{background:"none",border:"none",fontFamily:"'Clash Display',sans-serif",fontSize:15,fontWeight:800,color:T.txt,cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,transition:"opacity .15s",flexShrink:0,whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                >
                  <span style={{fontSize:17}}>🎓</span>
                  <span style={{display:"flex",gap:4}}>MNU's <span style={{color:T.scarlet}}>Neer Locker</span></span>
                </button>
                <div style={{flex:1,minWidth:0}}/>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,paddingRight:8,overflow:"hidden",maxWidth:"calc(100vw - 160px)"}}>
                  {/* Clickable profile area → Settings/Profile */}
                  <button onClick={()=>{setPage("set");setSettingsTab("profile");playSound("click");}}
                    style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:10,transition:"background .15s",fontFamily:"inherit",minWidth:0,overflow:"hidden"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}
                    title="Go to Profile Settings"
                  >
                    <Avatar email={user.email} color={ROLES[user.role]?.color||T.scarlet} size={30}/>
                    <div style={{display:"flex",flexDirection:"column",lineHeight:1.2,minWidth:0,textAlign:"left"}}>
                      <span style={{fontSize:13,color:T.txt,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:90}}>{user.name.split(" ")[0]}</span>
                      <span style={{fontSize:10,color:T.sub,fontWeight:500}}>{ROLES[user.role]?.label||""}</span>
                    </div>
                  </button>
                  <Btn T={T} xs variant="ghost" onClick={doLogout} style={{flexShrink:0,whiteSpace:"nowrap",padding:"5px 8px",fontSize:11}}>Sign Out</Btn>
                </div>
              </div>
            </header>

            {/* Floating circle NavMenu — always visible top-left */}
            <div style={{position:"fixed",left:10,top:62,zIndex:350}}>
              <NavMenu user={user} page={page} setPage={p=>{setSearch("");setPage(p);}} tasks={tasks} anns={anns} dms={dms} T={T}/>
            </div>

            {/* Page content */}
            <main
              style={{flex:1,padding:T.compact?"12px 14px 60px":"18px 20px 80px",overflowY:"auto",overflowX:"hidden"}}
              onTouchStart={e=>{
                if(document.documentElement.getAttribute("data-device")==="mobile"){
                  window._swipeStartX=e.touches[0].clientX;
                  window._swipeStartY=e.touches[0].clientY;
                }
              }}
              onTouchMove={e=>{
                if(document.documentElement.getAttribute("data-device")!=="mobile"||!window._swipeStartX)return;
                const dx=e.touches[0].clientX-window._swipeStartX;
                const dy=Math.abs(e.touches[0].clientY-window._swipeStartY);
                // If mostly horizontal swipe from left edge, show live drag overlay
                if(window._swipeStartX<40&&dx>0&&dx>dy*1.5&&page!=="home"){
                  const pct=Math.min(dx/200,1);
                  window._swipePct=pct;
                  const el=document.getElementById("swipe-overlay");
                  if(el)el.style.opacity=String(pct*0.35);
                }
              }}
              onTouchEnd={e=>{
                if(document.documentElement.getAttribute("data-device")!=="mobile")return;
                const dx=e.changedTouches[0].clientX-(window._swipeStartX||0);
                const dy=Math.abs(e.changedTouches[0].clientY-(window._swipeStartY||0));
                const el=document.getElementById("swipe-overlay");
                if(el)el.style.opacity="0";
                // Only trigger if started within 40px of left edge, horizontal, swiped 80+px right
                if(window._swipeStartX<40&&dx>80&&dy<120&&page!=="home"){
                  setSwipeBacking(true);
                  playSound("click");
                  setTimeout(()=>{setSearch("");setPage("home");setSwipeBacking(false);},320);
                }
                window._swipeStartX=0;window._swipeStartY=0;window._swipePct=0;
              }}
            >
              {/* Drag-tracking swipe overlay (fades with finger) */}
              <div id="swipe-overlay" style={{position:"fixed",inset:0,background:`linear-gradient(90deg,${T.scarlet}88,transparent)`,opacity:0,pointerEvents:"none",zIndex:800,transition:"opacity .06s ease"}}/>
              {/* Swipe-back commit animation */}
              {swipeBacking&&(
                <div style={{position:"fixed",inset:0,zIndex:801,pointerEvents:"none",overflow:"hidden"}}>
                  {/* Left panel slides in */}
                  <div style={{position:"absolute",inset:0,width:"40%",background:`linear-gradient(90deg,${T.scarlet},${T.scarlet}88)`,animation:"swipeReveal .28s cubic-bezier(.23,1,.32,1) both",boxShadow:`8px 0 32px ${T.scarlet}55`}}/>
                  {/* Full screen tint fades */}
                  <div style={{position:"absolute",inset:0,background:`${T.scarlet}22`,animation:"swipeFade .32s ease both"}}/>
                  {/* Home icon bounces in from left */}
                  <div style={{position:"absolute",top:"50%",left:"18%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:8,animation:"fadeUp .22s .05s ease both"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,0.92)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 4px 20px rgba(0,0,0,.18)",animation:"bounceIn .3s .06s cubic-bezier(.34,1.56,.64,1) both"}}>🏠</div>
                    <div style={{fontSize:12,color:"#fff",fontWeight:800,letterSpacing:"0.04em",textShadow:"0 1px 4px rgba(0,0,0,.4)"}}>HOME</div>
                  </div>
                </div>
              )}

              {/* HOME */}
              {page==="home"&&<HomePage user={user} tasks={tasks} anns={anns} emps={emps} dms={dms} T={T} setPage={p=>{setSearch("");setPage(p);}} toast={toast}/>}

              {/* TASKS */}
              {page==="tasks"&&(
                <div className="fu">
                  <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",marginTop:48}}>
                    <SearchBar T={T} value={search} onChange={setSearch} placeholder="Search tasks…"/>
                    {can(user,"assign")&&<Btn T={T} sm onClick={()=>{setForm({tPri:"Medium",tAssign:"all",tRepeat:false});setModal("task");}}>+ New Task</Btn>}
                  </div>
                  <SLabel T={T}>OPEN · {openT.length}</SLabel>
                  {openT.length===0&&<Empty icon="🎉" msg="All caught up!" T={T}/>}
                  <div style={{display:"grid",gap:T.compact?6:8,marginBottom:20}}>
                    {openT.map((t,i)=><TaskCard key={t.id} task={t} emps={emps} canManage={can(user,"assign")} onToggle={toggleTask} onDelete={deleteTask} T={T} delay={i*35}/>)}
                  </div>
                  {doneT.length>0&&<>
                    <SLabel T={T} dim>COMPLETED · {doneT.length}</SLabel>
                    <div style={{display:"grid",gap:T.compact?6:8}}>
                      {doneT.map((t,i)=><TaskCard key={t.id} task={t} emps={emps} canManage={can(user,"assign")} onToggle={toggleTask} onDelete={deleteTask} T={T} isDone delay={i*25}/>)}
                    </div>
                  </>}
                </div>
              )}

              {/* INVENTORY */}
              {page==="inv"&&can(user,"inv")&&(
                <div className="fu">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10,marginTop:48}}>
                    <div style={{fontSize:T.fs.md,color:T.sub}}>{inv.length} items · {inv.reduce((a,i)=>a+i.stock,0)} in stock</div>
                    <Btn T={T} sm onClick={()=>{setForm({});setModal("item");}}>+ Add Item</Btn>
                  </div>
                  {inv.length===0?<Empty icon="📦" msg="No items yet" T={T}/>:(
                    <div style={{display:"grid",gap:T.compact?6:8}}>
                      {inv.map((item,i)=>(
                        <div key={item.id} className="card" style={{background:T.card,border:`1px solid ${item.stock===0?T.scarlet+"55":T.bor}`,borderRadius:14,padding:T.compact?"10px 14px":"13px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",animation:`fadeUp .25s ${i*30}ms ease both`}}>
                          <div style={{flex:1,minWidth:110}}>
                            <div style={{fontWeight:700,fontSize:T.fs.lg,color:T.txt}}>{item.name}</div>
                            <div style={{fontSize:T.fs.xs+1,color:T.sub,marginTop:2}}>{item.category}{item.note&&` · ${item.note}`} · {fmtD(item.createdAt)}</div>
                          </div>
                          {item.stock===0&&<Tag label="OUT" color={T.scarlet}/>}
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <QBtn onClick={()=>adjStock(item.id,-1)} T={T}>−</QBtn>
                            <div style={{textAlign:"center",minWidth:44}}>
                              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:item.stock===0?T.scarlet:T.txt,transition:"color .2s"}}>{item.stock}</div>
                              <div style={{fontSize:9,color:T.mut,fontWeight:700}}>STOCK</div>
                            </div>
                            <QBtn onClick={()=>adjStock(item.id,1)} T={T}>+</QBtn>
                          </div>
                          <Btn T={T} sm variant="danger" onClick={()=>delItem(item.id)}>Remove</Btn>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ANNOUNCEMENTS */}
              {page==="anns"&&(
                <div className="fu">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,marginTop:48}}>
                    <div style={{fontSize:T.fs.md,color:T.sub}}>{myAnns.length} active</div>
                    {can(user,"assign")&&<Btn T={T} sm onClick={()=>{setForm({aLvl:"info"});setModal("ann");}}>+ Send Announcement</Btn>}
                  </div>
                  {myAnns.length===0?<Empty icon="🔔" msg="No announcements" T={T}/>:(
                    <div style={{display:"grid",gap:10}}>
                      {myAnns.map((a,i)=>{
                        const lc={info:T.blue,warn:T.warn,danger:T.scarlet}[a.level]||T.blue;
                        return (
                          <div key={a.id} style={{background:T.card,border:`1px solid ${lc}33`,borderLeft:`3px solid ${lc}`,borderRadius:14,padding:"14px 16px",animation:`fadeUp .25s ${i*35}ms ease both`}}>
                            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                              <span style={{fontSize:18}}>{{info:"ℹ️",warn:"⚠️",danger:"🚨"}[a.level]||"ℹ️"}</span>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:700,fontSize:13,color:T.txt,lineHeight:1.5,wordBreak:"break-word",overflowWrap:"anywhere"}}>{a.msg}</div>
                                <div style={{fontSize:T.fs.xs+1,color:T.sub,marginTop:4}}>By {a.by} · {fmtDT(a.at)}</div>
                              </div>
                              <button onClick={()=>{playSound("delete");dismissAnn(a.id);}} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:18,lineHeight:1,transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=T.scarlet} onMouseLeave={e=>e.currentTarget.style.color=T.mut}>✕</button>
                            </div>
                            {a.patchNotes&&(
                              <details style={{marginTop:10}} open>
                                <summary style={{cursor:"pointer",fontSize:12,color:lc,fontWeight:700,letterSpacing:"0.03em",userSelect:"none",listStyle:"none",display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}
                                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
                                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                                >
                                  <span>📋</span> v{a.patchVersion} {a.patchBuild} Release Notes
                                </summary>
                                <div style={{marginTop:8,background:T.bg,borderRadius:10,padding:"10px 14px",display:"grid",gap:5}}>
                                  {a.patchNotes.map((note,ni)=>(
                                    <div key={ni} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"3px 0",borderBottom:ni<a.patchNotes.length-1?`1px solid ${T.bor}33`:"none"}}>
                                      <span style={{color:lc,fontWeight:800,fontSize:12,flexShrink:0,marginTop:2}}>{ni+1}.</span>
                                      <span style={{fontSize:13,color:T.sub,lineHeight:1.5}}>{note}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* DMs */}
              {page==="dms"&&<DMSection user={user} emps={emps} dms={dms} setDms={saveDms} T={T} toast={toast}/>}

              {/* ACTIVITY */}
              {page==="act"&&can(user,"act")&&(
                <div className="fu">
                  <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",paddingLeft:60,marginTop:8}}>
                    {["all","login","logout","task_done","task_created","employee added","employee removed"].map(f=>(
                      <button key={f} onClick={()=>{playSound("click");setLogF(f);}} style={{background:logF===f?T.scarlet:T.surfH,color:logF===f?"#fff":T.sub,border:`1px solid ${logF===f?T.scarlet:T.bor}`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",textTransform:"capitalize"}}>
                        {f==="all"?"All":f.replace(/_/g," ")}
                      </button>
                    ))}
                  </div>
                  {filtAct.length===0?<Empty icon="📊" msg="No activity yet" T={T}/>:(
                    <div style={{display:"grid",gap:T.compact?5:8}}>
                      {filtAct.slice(0,80).map((entry,i)=>(
                        <div key={entry.id} style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:12,padding:"11px 14px",display:"flex",gap:10,alignItems:"center",animation:`fadeUp .2s ${i*12}ms ease both`}}>
                          <span style={{fontSize:15}}>{{login:"🟢",logout:"🔴",task_done:"✅",task_created:"📝","employee added":"👤","employee removed":"🗑️"}[entry.type]||"📋"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:T.fs.md,color:T.txt,fontWeight:600}}>{entry.msg}</div>
                            <div style={{fontSize:T.fs.xs+1,color:T.sub,marginTop:2}}>{fmtDT(entry.at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS */}
              {page==="set"&&(
                <div className="fu set-grid" style={{display:"grid",gridTemplateColumns:"155px 1fr",gap:16,marginTop:54}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {SET_TABS.map(s=>(
                      <button key={s.key} onClick={()=>{playSound("click");setSettingsTab(s.key);}} style={{background:setTab2===s.key?T.scarlet+"18":"none",color:setTab2===s.key?T.scarlet:T.sub,border:`1px solid ${setTab2===s.key?T.scarlet+"44":"transparent"}`,borderRadius:T.sp.r,padding:"9px 14px",fontWeight:700,fontSize:13,fontFamily:"inherit",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>{s.label}</button>
                    ))}
                  </div>
                  <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:16,padding:T.sp.xl}}>

                    {setTab2==="profile"&&(
                      <div style={{display:"grid",gap:18}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Profile</div>
                        <div style={{display:"flex",alignItems:"center",gap:14}}>
                          <Avatar email={user.email} color={ROLES[user.role]?.color||T.scarlet} size={54}/>
                          <div>
                            <div style={{fontWeight:700,fontSize:T.fs.xl,color:T.txt}}>{user.name}</div>
                            <div style={{color:T.sub,fontSize:T.fs.sm}}>{user.email}</div>
                            <Tag label={ROLES[user.role]?.label} color={ROLES[user.role]?.color||T.scarlet}/>
                          </div>
                        </div>
                        <Hr T={T}/>
                        <Inp T={T} label="DISPLAY NAME" placeholder="Your name" value={form.pName??user.name} onChange={e=>{setNameSaved(false);setForm(p=>({...p,pName:e.target.value}));}}/>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Btn T={T} sm onClick={saveName}>Save Name</Btn>
                          {nameSaved&&(
                            <div style={{display:"flex",alignItems:"center",gap:5,animation:"fadeUp .2s ease",color:T.ok,fontWeight:700,fontSize:13}}>
                              <span style={{fontSize:16}}>✅</span> Name saved!
                            </div>
                          )}
                        </div>
                        <Hr T={T}/>
                        <Inp T={T} label="EMAIL ADDRESS" type="email" placeholder="your@mnu.edu" value={form.pEmail??user.email} onChange={e=>{setEmailSaved(false);setForm(p=>({...p,pEmail:e.target.value}));}}/>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Btn T={T} sm onClick={saveEmail}>Save Email</Btn>
                          {emailSaved&&(
                            <div style={{display:"flex",alignItems:"center",gap:5,animation:"fadeUp .2s ease",color:T.ok,fontWeight:700,fontSize:13}}>
                              <span style={{fontSize:16}}>✅</span> Email updated!
                            </div>
                          )}
                        </div>
                        <Hr T={T}/>
                        <div>
                          <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:8}}>STATUS</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {["online","busy","offline"].map(s=>(
                              <button key={s} onClick={()=>{playSound("click");saveStatus(s);}} style={{background:(user.status||"online")===s?T.scarlet:"none",color:(user.status||"online")===s?"#fff":T.sub,border:`1px solid ${(user.status||"online")===s?T.scarlet:T.bor}`,borderRadius:8,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                                <StatusDot status={s}/>{s.charAt(0).toUpperCase()+s.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Hr T={T}/>
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:14}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:10}}>Your Stats</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            <div style={{background:T.bg,borderRadius:10,padding:12,textAlign:"center"}}>
                              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:T.ok}}>{myCompletedCount}</div>
                              <div style={{fontSize:11,color:T.sub,fontWeight:600}}>Completed</div>
                            </div>
                            <div style={{background:T.bg,borderRadius:10,padding:12,textAlign:"center"}}>
                              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:T.blue}}>{openT.length}</div>
                              <div style={{fontSize:11,color:T.sub,fontWeight:600}}>Open Tasks</div>
                            </div>
                            <div style={{background:T.bg,borderRadius:10,padding:12,textAlign:"center"}}>
                              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:"#7c3aed"}}>{dms.filter(d=>d.from===user?.id).length}</div>
                              <div style={{fontSize:11,color:T.sub,fontWeight:600}}>Msgs Sent</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {setTab2==="security"&&(
                      <div style={{display:"grid",gap:18}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Security</div>
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16,display:"grid",gap:12}}>
                          <div style={{fontWeight:700,color:T.txt}}>Login PIN</div>
                          <Inp T={T} label="NEW PIN" type="password" placeholder="Min 4 characters" value={form.pinNew||""} maxLength={8} onChange={e=>setForm(p=>({...p,pinNew:e.target.value}))}/>
                          <Inp T={T} label="CONFIRM PIN" type="password" placeholder="Repeat PIN" value={form.pinCon||""} maxLength={8} onChange={e=>setForm(p=>({...p,pinCon:e.target.value}))}/>
                          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                            <Btn T={T} sm onClick={savePin}>Save PIN</Btn>
                            {user.pin&&<Btn T={T} sm variant="danger" onClick={removePin}>Remove PIN</Btn>}
                          </div>
                          {pinSaved&&(
                            <div style={{display:"flex",alignItems:"center",gap:10,background:`${T.ok}15`,border:`1px solid ${T.ok}55`,borderRadius:10,padding:"10px 14px",animation:"fadeUp .25s cubic-bezier(.23,1,.32,1)"}}>
                              <div style={{width:32,height:32,borderRadius:"50%",background:T.ok,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:"bounceIn .4s cubic-bezier(.34,1.56,.64,1)"}}>
                                <span style={{fontSize:16,color:"#fff"}}>✓</span>
                              </div>
                              <div>
                                <div style={{fontWeight:800,fontSize:14,color:T.ok}}>PIN saved successfully!</div>
                                <div style={{fontSize:12,color:T.sub,marginTop:1}}>Your PIN is now required at login.</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:14}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:8}}>Security Info</div>
                          {["Rate limiting — 5 attempts → 5 min lockout","Input sanitization on all fields","Session cleared on sign-out","Auto-save on logout","Auto logout after 30 min inactivity"].map(f=>(
                            <div key={f} style={{fontSize:T.fs.sm,color:T.sub,padding:"3px 0",display:"flex",gap:8}}><span style={{color:T.ok}}>✓</span>{f}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {setTab2==="team"&&can(user,"emp")&&(
                      <div style={{display:"grid",gap:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Team Members</div>
                          <Btn T={T} sm onClick={()=>{setForm({eRole:"employee"});setModal("emp");}}>+ Add Employee</Btn>
                        </div>
                        <div style={{display:"grid",gap:8}}>
                          {emps.map(e=>(
                            <div key={e.id} style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
                              <div style={{position:"relative"}}><Avatar email={e.email} color={ROLES[e.role]?.color||T.mut} size={36}/><div style={{position:"absolute",bottom:0,right:0}}><StatusDot status={e.status||"offline"}/></div></div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:700,color:T.txt,fontSize:T.fs.md,display:"flex",alignItems:"center",gap:6}}>{e.name}{e.id===user.id&&<span style={{fontSize:11,color:T.mut,fontWeight:400}}>(you)</span>}</div>
                                <div style={{color:T.sub,fontSize:T.fs.xs+1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.email}</div>
                              </div>
                              <Tag label={ROLES[e.role]?.label} color={ROLES[e.role]?.color||T.mut}/>
                              {e.id!==user.id&&<Btn T={T} sm variant="danger" onClick={()=>removeEmp(e.id)}>Remove</Btn>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {setTab2==="display"&&(
                      <div style={{display:"grid",gap:16}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Display & Sound</div>

                        {/* Dark mode toggle */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,color:T.txt}}>Dark Mode</div>
                            <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2}}>Switch between light and dark theme</div>
                          </div>
                          <button onClick={()=>{playSound("click");applyTheme(!dark,compact);}} style={{width:50,height:27,borderRadius:14,background:dark?T.scarlet:T.bor,border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{width:21,height:21,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:dark?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                          </button>
                        </div>

                        {/* Layout density */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Layout Density</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>How much information is shown on screen at once.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            {[{k:false,label:"Comfortable",icon:"🛋️",desc:"More spacing, easier to read"},{k:true,label:"Compact",icon:"📊",desc:"More data, tighter layout"}].map(opt=>(
                              <button key={String(opt.k)} onClick={()=>{playSound("click");applyTheme(dark,opt.k);}} style={{background:compact===opt.k?T.scarlet+"18":"none",border:`2px solid ${compact===opt.k?T.scarlet:T.bor}`,borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s"}}>
                                <div style={{fontSize:20,marginBottom:4}}>{opt.icon}</div>
                                <div style={{fontWeight:700,color:compact===opt.k?T.scarlet:T.txt,fontSize:13}}>{opt.label}</div>
                                <div style={{fontSize:11,color:T.sub,marginTop:3}}>{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Device / UI Scaling */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:2}}>📱 Device & UI Scaling</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12,lineHeight:1.5}}>Choose how the app scales to your device. This adjusts font sizes and tap target sizes across the whole app.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            {[
                              {mode:"auto",  icon:"🔄", label:"Auto",    desc:"Detects your screen size automatically"},
                              {mode:"mobile",icon:"📱", label:"Mobile",  desc:"Larger text & buttons, optimized for touch"},
                              {mode:"desktop",icon:"🖥️",label:"Desktop", desc:"Compact, more information visible at once"},
                            ].map(opt=>{
                              const active=deviceMode===opt.mode;
                              return (
                                <button key={opt.mode} onClick={()=>applyDeviceMode(opt.mode)}
                                  style={{background:active?T.scarlet+"18":"none",border:`2px solid ${active?T.scarlet:T.bor}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all .2s"}}>
                                  <div style={{fontSize:22,marginBottom:4}}>{opt.icon}</div>
                                  <div style={{fontWeight:700,color:active?T.scarlet:T.txt,fontSize:13}}>{opt.label}</div>
                                  <div style={{fontSize:10,color:T.sub,marginTop:3,lineHeight:1.4}}>{opt.desc}</div>
                                  {active&&<div style={{marginTop:6,fontSize:10,color:T.scarlet,fontWeight:800}}>✓ Active</div>}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{marginTop:10,fontSize:11,color:T.sub,background:T.bg,borderRadius:8,padding:"8px 12px"}}>
                            Current: <strong style={{color:T.scarlet}}>{deviceMode==="auto"?(window.innerWidth<=768?"Auto (Mobile)":"Auto (Desktop)"):deviceMode==="mobile"?"Mobile":"Desktop"}</strong>
                            {" · "}Base font: <strong>{deviceMode==="mobile"?"18px":"13px"}</strong>
                          </div>
                        </div>

                        {/* Accent color */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Accent Color</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>Choose your preferred accent color for highlights and buttons.</div>
                          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                            {[{label:"Scarlet",value:"#C8102E"},{label:"Blue",value:"#1e7fa8"},{label:"Purple",value:"#7c3aed"},{label:"Green",value:"#15803d"},{label:"Orange",value:"#c2410c"},{label:"Pink",value:"#be185d"}].map(ac=>(
                              <button key={ac.value} onClick={()=>{playSound("click");applyTheme(dark,compact,ac.value);}} title={ac.label}
                                style={{width:30,height:30,borderRadius:"50%",background:ac.value,border:`3px solid ${T.scarlet===ac.value?"#000":"transparent"}`,cursor:"pointer",transition:"transform .15s,border-color .15s",boxShadow:T.scarlet===ac.value?`0 0 0 2px ${ac.value}`:"none"}}
                                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Font size */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Text Size</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>Adjust the base font size across the app.</div>
                          <div style={{display:"flex",gap:8}}>
                            {[{label:"Small",val:"13px"},{label:"Default",val:"15px"},{label:"Large",val:"17px"}].map(sz=>(
                              <button key={sz.val} onClick={async()=>{playSound("click");document.documentElement.style.fontSize=sz.val;LS.set("nl3-fontsize",sz.val);toast(`Text size: ${sz.label}`);}}
                                style={{flex:1,background:T.bg,border:`2px solid ${T.bor}`,borderRadius:10,padding:"10px 6px",cursor:"pointer",fontFamily:"inherit",fontSize:sz.val,fontWeight:700,color:T.sub,transition:"all .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.scarlet;e.currentTarget.style.color=T.scarlet;}}
                                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}
                              >{sz.label}</button>
                            ))}
                          </div>
                        </div>


                        {/* Sound controls */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16,display:"grid",gap:12}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:2}}>🔊 Sound & Audio</div>
                          {/* On/Off */}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:T.fs.md,color:T.txt}}>Sound Effects</div>
                              <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:1}}>Click sounds, notifications, and feedback tones</div>
                            </div>
                            <button onClick={()=>{const next=!soundOn;applySoundSettings(next,soundVol);if(next)setTimeout(()=>playSound("click"),50);}} style={{width:50,height:27,borderRadius:14,background:soundOn?T.scarlet:T.bor,border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                              <div style={{width:21,height:21,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:soundOn?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                            </button>
                          </div>
                          {/* Volume */}
                          {soundOn&&(
                            <div>
                              <div style={{fontWeight:600,fontSize:T.fs.md,color:T.txt,marginBottom:6}}>Volume</div>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <span style={{fontSize:16}}>🔈</span>
                                <input type="range" min="0.04" max="0.5" step="0.02" value={soundVol}
                                  onChange={e=>{const v=parseFloat(e.target.value);applySoundSettings(true,v);}}
                                  onMouseUp={()=>playSound("click")}
                                  style={{flex:1,accentColor:T.scarlet,cursor:"pointer"}}
                                />
                                <span style={{fontSize:16}}>🔊</span>
                                <span style={{fontSize:12,color:T.sub,fontWeight:700,minWidth:36}}>{Math.round(soundVol*200)}%</span>
                              </div>
                              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                                {[{label:"Quiet",vol:0.08},{label:"Normal",vol:0.22},{label:"Loud",vol:0.44}].map(opt=>(
                                  <button key={opt.label} onClick={()=>{applySoundSettings(true,opt.vol);setTimeout(()=>playSound("click"),50);}} style={{background:Math.abs(soundVol-opt.vol)<0.03?T.scarlet+"18":"none",border:`1px solid ${Math.abs(soundVol-opt.vol)<0.03?T.scarlet:T.bor}`,borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700,color:Math.abs(soundVol-opt.vol)<0.03?T.scarlet:T.sub,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{opt.label}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{fontSize:11,color:T.faint,textAlign:"center"}}>Some settings take effect immediately. Others apply on your next login.</div>
                      </div>
                    )}

                    {setTab2==="tech"&&can(user,"boss")&&(
                      <div style={{display:"grid",gap:16}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Technical Testing & Management</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}} className="two-col">
                          <Btn T={T} variant="ghost" onClick={createBackup}>💾 Manual Backup</Btn>
                          <Btn T={T} variant="danger" onClick={clearDemo}>🗑️ Clear Demo Data</Btn>
                        </div>
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16,display:"grid",gap:10}}>
                          <div style={{fontWeight:700,color:T.txt}}>Site Notice</div>
                          <Inp T={T} placeholder="e.g. Down for maintenance…" value={form.nMsg||""} onChange={e=>setForm(p=>({...p,nMsg:e.target.value}))}/>
                          <div style={{display:"flex",gap:8}}>
                            <Btn T={T} sm onClick={sendNotice}>Send Notice</Btn>
                            {notice&&<Btn T={T} sm variant="ghost" onClick={clearNotice}>Clear</Btn>}
                          </div>
                          {notice&&<div style={{fontSize:12,color:T.warn}}>Active: "{notice}"</div>}
                        </div>
                        {bkps.length>0&&(
                          <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:14}}>
                            <div style={{fontWeight:700,color:T.txt,marginBottom:10}}>Restore Backup</div>
                            <div style={{display:"grid",gap:8}}>
                              {bkps.slice(0,5).map(bk=>(
                                <div key={bk.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg,borderRadius:10,padding:"9px 12px"}}>
                                  <div style={{fontSize:13,color:T.sub}}>{fmtDT(bk.at)}</div>
                                  <Btn T={T} sm onClick={()=>restoreBkp(bk)}>↩ Restore</Btn>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* MODALS */}
          {modal==="task"&&(
            <Modal T={T} title="Create Task" onClose={()=>{setModal(null);setForm({});}} wide>
              <div style={{display:"grid",gap:14}}>
                <Inp T={T} label="TASK TITLE *" placeholder="e.g. Restock drinks" value={form.tTitle||""} onChange={e=>setForm(p=>({...p,tTitle:e.target.value}))}/>
                <Textarea T={T} label="DESCRIPTION (optional)" placeholder="More details…" rows={3} value={form.tDesc||""} onChange={e=>setForm(p=>({...p,tDesc:e.target.value}))}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="two-col">
                  <Sel T={T} label="PRIORITY" value={form.tPri||"Medium"} onChange={e=>setForm(p=>({...p,tPri:e.target.value}))}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </Sel>
                  <Sel T={T} label="ASSIGN TO" value={form.tAssign||"all"} onChange={e=>setForm(p=>({...p,tAssign:e.target.value}))}>
                    <option value="all">Everyone</option>
                    {emps.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </Sel>
                </div>
                <Inp T={T} label="DUE DATE (optional)" type="date" value={form.tDue||""} onChange={e=>setForm(p=>({...p,tDue:e.target.value}))}/>
                <div style={{display:"flex",alignItems:"center",gap:10,background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:10,padding:"10px 14px"}}>
                  <input type="checkbox" id="repeat-chk" checked={form.tRepeat||false} onChange={e=>setForm(p=>({...p,tRepeat:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
                  <label htmlFor="repeat-chk" style={{fontSize:T.fs.md,color:T.txt,fontWeight:600,cursor:"pointer"}}>🔁 Repeat this task after completion</label>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <Btn T={T} variant="ghost" flex={1} onClick={()=>{setModal(null);setForm({});}}>Cancel</Btn>
                <Btn T={T} flex={2} onClick={createTask}>Create Task</Btn>
              </div>
            </Modal>
          )}

          {modal==="item"&&(
            <Modal T={T} title="Add Inventory Item" onClose={()=>{setModal(null);setForm({});}}>
              <div style={{display:"grid",gap:14}}>
                <Inp T={T} label="ITEM NAME *" placeholder="e.g. Bottled Water" value={form.iName||""} onChange={e=>setForm(p=>({...p,iName:e.target.value}))}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="two-col">
                  <Inp T={T} label="CATEGORY" placeholder="e.g. Drinks" value={form.iCat||""} onChange={e=>setForm(p=>({...p,iCat:e.target.value}))}/>
                  <Inp T={T} label="STARTING STOCK" type="number" min="0" value={form.iStock||""} onChange={e=>setForm(p=>({...p,iStock:e.target.value}))}/>
                </div>
                <Inp T={T} label="NOTE (optional)" placeholder="e.g. Keep refrigerated" value={form.iNote||""} onChange={e=>setForm(p=>({...p,iNote:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <Btn T={T} variant="ghost" flex={1} onClick={()=>{setModal(null);setForm({});}}>Cancel</Btn>
                <Btn T={T} flex={2} onClick={createItem}>Add Item</Btn>
              </div>
            </Modal>
          )}

          {modal==="ann"&&(
            <Modal T={T} title="Send Announcement" onClose={()=>{setModal(null);setForm({});}}>
              <div style={{display:"grid",gap:14}}>
                <Inp T={T} label="MESSAGE *" placeholder="What do you want to announce?" value={form.aMsg||""} onChange={e=>setForm(p=>({...p,aMsg:e.target.value}))}/>
                <Sel T={T} label="LEVEL" value={form.aLvl||"info"} onChange={e=>setForm(p=>({...p,aLvl:e.target.value}))}>
                  <option value="info">Info</option><option value="warn">Warning</option><option value="danger">Urgent</option>
                </Sel>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <Btn T={T} variant="ghost" flex={1} onClick={()=>{setModal(null);setForm({});}}>Cancel</Btn>
                <Btn T={T} flex={2} onClick={createAnn}>Send</Btn>
              </div>
            </Modal>
          )}

          {modal==="emp"&&(
            <Modal T={T} title="Add Employee" onClose={()=>{setModal(null);setForm({});}}>
              <div style={{display:"grid",gap:14}}>
                <Inp T={T} label="FULL NAME *" placeholder="e.g. Alex Johnson" value={form.eName||""} onChange={e=>setForm(p=>({...p,eName:e.target.value}))}/>
                <Inp T={T} label="MNU EMAIL *" type="email" placeholder="alex@mnu.edu" value={form.eEmail||""} onChange={e=>setForm(p=>({...p,eEmail:e.target.value}))}/>
                <Sel T={T} label="ROLE" value={form.eRole||"employee"} onChange={e=>setForm(p=>({...p,eRole:e.target.value}))}>
                  {Object.entries(ROLES).filter(([k])=>k!=="superadmin").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </Sel>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <Btn T={T} variant="ghost" flex={1} onClick={()=>{setModal(null);setForm({});}}>Cancel</Btn>
                <Btn T={T} flex={2} onClick={createEmp}>Add Employee</Btn>
              </div>
            </Modal>
          )}

          {/* Login briefing popup */}
          {showBriefing&&<LoginBriefing user={user} tasks={tasks} anns={anns} dms={dms} emps={emps} T={T} onClose={()=>setShowBriefing(false)}/>}

          <HelpModal T={T} bottom={page==="dms"?120:52}/>

          {/* Feedback / Ideas button — higher in DMs to clear send bar */}
          <button onClick={()=>{playSound("open");setShowFeedback(true);}} title="Send an idea or report a bug"
            className="float-action-btn" style={{position:"fixed",bottom:page==="dms"?170:100,right:14,zIndex:9998,background:T.dark?"#1a1020":"#fffbeb",color:"#b45309",border:`2px solid #f59e0baa`,borderRadius:"50%",width:40,height:40,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(0,0,0,.18)",transition:"transform .15s,box-shadow .15s,bottom .25s",touchAction:"manipulation"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.14)";e.currentTarget.style.boxShadow="0 5px 18px rgba(0,0,0,.2)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 3px 12px rgba(0,0,0,.15)";}}
          >💡</button>

          {/* Feedback modal */}
          {showFeedback&&(
            <Modal T={T} title="💡 Send Feedback" onClose={()=>{setShowFeedback(false);setFeedbackForm({type:"feature",msg:""});}}>
              <div style={{display:"grid",gap:14}}>
                <div style={{fontSize:13,color:T.sub,lineHeight:1.6}}>Have a feature idea or found a bug? Your message goes directly to the Technical Administrator.</div>
                <Sel T={T} label="TYPE" value={feedbackForm.type} onChange={e=>setFeedbackForm(p=>({...p,type:e.target.value}))}>
                  <option value="feature">💡 Feature Request</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="improvement">✨ Improvement Idea</option>
                  <option value="other">📝 Other</option>
                </Sel>
                <Textarea T={T} label="YOUR MESSAGE *" placeholder="Describe your idea or the issue you found…" rows={4} value={feedbackForm.msg} onChange={e=>setFeedbackForm(p=>({...p,msg:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <Btn T={T} variant="ghost" flex={1} onClick={()=>{setShowFeedback(false);setFeedbackForm({type:"feature",msg:""});}}>Cancel</Btn>
                <Btn T={T} flex={2} sound="success" onClick={()=>{
                  const msg=String(feedbackForm.msg||"").trim();
                  if(!msg){toast("Please describe your feedback","err");return;}
                  const icons={feature:"💡",bug:"🐛",improvement:"✨",other:"📝"};
                  const labels={feature:"Feature Request",bug:"Bug Report",improvement:"Improvement",other:"Other"};
                  const dmText=`${icons[feedbackForm.type]} [${labels[feedbackForm.type]}] from ${user?.name} (${user?.role}): ${msg}`;
                  const newDm={id:uid(),from:user?.id||"",to:"TECH",text:san(dmText),at:Date.now(),read:false,system:false,feedback:true};
                  // Store in a feedback key instead of DMs (tech admin reads from nl3-feedback)
                  SB.upsert("direct_messages",{id:newDm.id,from_id:newDm.from||"",to_id:"TECH",text:newDm.text,at:newDm.at,read:false,system:false,thread_with:"",feedback:true});
                  playSound("success");
                  toast("Feedback sent to Tech Admin! Thank you 🙏");
                  setShowFeedback(false);setFeedbackForm({type:"feature",msg:""});
                }}>Send Feedback →</Btn>
              </div>
            </Modal>
          )}

          {loggingOut&&<LogoutAnim T={T}/>}
          <ClaudeTag T={T}/><VersionBadge T={T}/>
        </div>
      )}

      {/* ═══ TECH DASHBOARD ════════════════════════════════════════════════════ */}
      {screen==="tech"&&(
        <div style={{minHeight:"100vh",background:T.bg}}>
          <header style={{background:T.surf,borderBottom:`1px solid ${T.bor}`,padding:"10px 16px",position:"sticky",top:0,zIndex:100}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.warn},${T.scarlet})`}}/>
            {/* Top row: icon + compact title + exit */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>🔧</span>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:800,color:T.txt,flex:1}}>Tech Admin Dashboard</div>
              <button onClick={()=>{if(techExiting)return;setTechExiting(true);playSound("logout");setTimeout(()=>{setTechExiting(false);setTEmail("");setTPin("");setTErr("");setScreen("login");},2500);}}
                style={{background:"#fee2e2",border:"1px solid #fca5a5",color:"#991b1b",borderRadius:10,padding:"7px 18px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#fca5a5";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#fee2e2";}}
              >← Exit</button>
            </div>
            {/* Second row: badge + clock */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6}}>
              <Tag label="TECHNICAL ADMINISTRATOR" color={T.warn}/>
              <LiveClock T={T}/>
            </div>
          </header>

          <div style={{maxWidth:1000,margin:"0 auto",padding:"22px 20px 80px"}}>
            {/* Metrics */}
            <TechMetrics T={T}/>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:18}}>
              {[["👥","Employees",emps.length],["📦","Items",inv.length],["✅","Tasks",tasks.length],["🔔","Announcements",anns.length],["📋","Activity",act.length],["💬","Messages",dms.length]].map(([icon,label,val])=>(
                <div key={label} style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:18}}>{icon}</div>
                  <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt,marginTop:3}}>{val}</div>
                  <div style={{fontSize:11,color:T.sub,fontWeight:600}}>{label}</div>
                </div>
              ))}
            </div>

            {/* Site Offline Toggle — prominent at top */}
            <div style={{background:siteOffline?"#fee2e2":"#dcfce7",border:`2px solid ${siteOffline?"#fca5a5":"#86efac"}`,borderRadius:14,padding:"14px 18px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:siteOffline?"#991b1b":"#15803d"}}>
                  {siteOffline?"🔴 Site is OFFLINE":"🟢 Site is ONLINE"}
                </div>
                <div style={{fontSize:12,color:siteOffline?"#b91c1c":"#166534",marginTop:3}}>
                  {siteOffline?"Only you (Tech Admin) can log in right now.":"All staff can log in normally."}
                </div>
              </div>
              <button onClick={toggleOffline}
                style={{background:siteOffline?"#15803d":"#dc2626",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all .2s",boxShadow:"0 2px 8px rgba(0,0,0,.15)"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >
                {siteOffline?"Bring Back Online":"Take Offline"}
              </button>
            </div>

            {/* Actions */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:8}} className="two-col">
              <Btn T={T} onClick={()=>{playSound("click");createBackup();}}>💾 Backup</Btn>
              <Btn T={T} variant="ghost" onClick={()=>{playSound("click");if(bkps.length>0)restoreBkp(bkps[0]);else toast("No backups yet","warn");}}>↩ Restore Latest</Btn>
              <Btn T={T} variant="danger" onClick={()=>{playSound("click");clearDemo();}}>🗑️ Clear Demo</Btn>
              <Btn T={T} variant="ghost" onClick={async()=>{await fetch(`${SUPABASE_URL}/rest/v1/activity?id=neq.none`,{method:"DELETE",headers:SB.headers});setAct([]);setTechAction("✅ Activity log cleared.");setTimeout(()=>setTechAction(""),2500);playSound("notify");}}>🧹 Clear Activity</Btn>
            </div>
            {techAction&&(
              <div style={{display:"flex",alignItems:"center",gap:8,background:"#dcfce7",border:"1px solid #86efac",borderRadius:10,padding:"9px 14px",marginBottom:14,animation:"fadeUp .2s ease",fontSize:13,fontWeight:700,color:"#15803d"}}>
                {techAction}
              </div>
            )}

            {/* Site notice */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:8}}>📢 Site Notice / Maintenance Alert</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <input placeholder="e.g. Site down for maintenance until 3pm…" value={form.nMsg||""} onChange={e=>setForm(p=>({...p,nMsg:e.target.value}))}
                  style={{flex:1,minWidth:200,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                <Btn T={T} sm onClick={sendNotice}>Send</Btn>
                {notice&&<Btn T={T} sm variant="ghost" onClick={clearNotice}>Clear Active</Btn>}
              </div>
              {notice&&<div style={{marginTop:8,fontSize:12,color:T.warn,fontWeight:600}}>🟡 Active: "{notice}"</div>}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="two-col">
              {/* System Logs */}
              <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                  <div style={{fontWeight:700,color:T.txt}}>🛡️ System Logs ({errs.length})</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {["all","info","warn","error"].map(f=>(
                      <button key={f} onClick={()=>setLogF(f)} style={{background:logF===f?T.scarlet:T.surfH,color:logF===f?"#fff":T.sub,border:`1px solid ${T.bor}`,borderRadius:5,padding:"2px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{f}</button>
                    ))}
                    <button onClick={async()=>{await fetch(`${SUPABASE_URL}/rest/v1/system_logs?id=neq.none`,{method:"DELETE",headers:SB.headers});setErrs([]);toast("Cleared","warn");}} style={{background:T.surfH,color:T.sub,border:`1px solid ${T.bor}`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
                  </div>
                </div>
                <div style={{maxHeight:220,overflowY:"auto",display:"grid",gap:4}}>
                  {errs.filter(e=>logF==="all"||e.level===logF).length===0
                    ?<div style={{color:T.sub,fontSize:12}}>No entries</div>
                    :errs.filter(e=>logF==="all"||e.level===logF).map(e=>(
                      <div key={e.id} style={{background:T.bg,borderRadius:8,padding:"7px 10px",display:"flex",gap:7,alignItems:"flex-start"}}>
                        <span style={{fontSize:12}}>{{info:"ℹ️",warn:"⚠️",error:"🔴"}[e.level]||"📋"}</span>
                        <div>
                          <div style={{fontSize:12,color:T.txt}}>{e.msg}</div>
                          <div style={{fontSize:10,color:T.sub}}>{fmtDT(e.at)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Most active users */}
              <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16}}>
                <div style={{fontWeight:700,color:T.txt,marginBottom:10}}>🏆 Most Active Users</div>
                <div style={{display:"grid",gap:8}}>
                  {userActivity.map((e,i)=>(
                    <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:10,padding:"8px 12px"}}>
                      <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:800,color:[T.warn,"#c0c0c0","#cd7f32",T.sub,T.sub][i]||T.sub}}>{i+1}</span>
                      <Avatar email={e.email} color={ROLES[e.role]?.color||T.mut} size={28}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:T.txt}}>{e.name}</div>
                        <div style={{fontSize:11,color:T.sub}}>{e.count} actions</div>
                      </div>
                      <Tag label={ROLES[e.role]?.label||e.role} color={ROLES[e.role]?.color||T.mut}/>
                    </div>
                  ))}
                  {userActivity.length===0&&<div style={{color:T.sub,fontSize:12}}>No activity yet</div>}
                </div>
              </div>
            </div>

            {/* Activity log */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:10}}>📊 Activity Log ({act.length})</div>
              <div style={{maxHeight:220,overflowY:"auto",display:"grid",gap:5}}>
                {act.length===0?<div style={{color:T.sub,fontSize:12}}>No activity</div>:act.slice(0,80).map(entry=>(
                  <div key={entry.id} style={{background:T.bg,borderRadius:8,padding:"7px 10px",display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:13}}>{{login:"🟢",logout:"🔴",task_done:"✅",task_created:"📝","employee added":"👤","employee removed":"🗑️"}[entry.type]||"📋"}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,color:T.txt}}>{entry.msg}</div><div style={{fontSize:10,color:T.sub}}>{fmtDT(entry.at)}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee PIN viewer (gated) */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:8}}>🔐 Employee Emails & PINs</div>
              {!pinRevealed?(
                <div style={{display:"grid",gap:10}}>
                  <div style={{fontSize:13,color:T.sub}}>Enter the infrastructure PIN to view sensitive employee data.</div>
                  <div style={{display:"flex",gap:10}}>
                    <input type="password" placeholder="Technical Administrator PIN" value={techPinInput} maxLength={8} onChange={e=>{setTechPinInput(e.target.value);setTechPinErr("");}}
                      style={{flex:1,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}
                      onKeyDown={e=>{if(e.key==="Enter"){if(techPinInput===TECH_PIN){setPinRevealed(true);setTechPinErr("");}else setTechPinErr("Wrong PIN");}}}
                    />
                    <Btn T={T} sm onClick={()=>{if(techPinInput===TECH_PIN){setPinRevealed(true);setTechPinErr("");}else setTechPinErr("Wrong PIN");}}>Reveal</Btn>
                  </div>
                  {techPinErr&&<div style={{color:T.err,fontSize:12,fontWeight:700}}>{techPinErr}</div>}
                </div>
              ):(
                <div>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                    <Btn T={T} xs variant="danger" onClick={()=>{setPinRevealed(false);setTechPinInput("");}}>🔒 Lock</Btn>
                  </div>
                  <div style={{display:"grid",gap:6}}>
                    {emps.map(e=>(
                      <div key={e.id} style={{background:T.bg,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <Avatar email={e.email} color={ROLES[e.role]?.color||T.mut} size={28}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,color:T.txt,fontSize:13}}>{e.name}</div>
                          <div style={{fontSize:11,color:T.sub}}>{e.email}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:11,color:T.sub,fontWeight:600}}>PIN</div>
                          <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:e.pin?T.ok:T.mut}}>{e.pin||"—not set—"}</div>
                        </div>
                        <Tag label={ROLES[e.role]?.label||e.role} color={ROLES[e.role]?.color||T.mut}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All DMs viewer */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>💬 All Direct Messages ({dms.length})</div>
              <div style={{fontSize:12,color:T.warn,fontWeight:600,marginBottom:10}}>⚠️ Viewing as Technical Administrator — staff are notified messages may be reviewed.</div>
              {/* Warning sender */}
              <div style={{background:`${T.warn}12`,border:`1px solid ${T.warn}44`,borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontWeight:700,color:T.txt,fontSize:12,marginBottom:8}}>⚠️ Send Warning to Conversation</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:11,color:T.sub,marginBottom:4,fontWeight:700}}>SELECT RECIPIENT</div>
                    <select value={form.warnTo||""} onChange={e=>setForm(p=>({...p,warnTo:e.target.value}))} style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:8,color:T.txt,padding:"7px 10px",fontSize:12,fontFamily:"inherit",outline:"none"}}>
                      <option value="">Choose employee…</option>
                      {emps.map(e=><option key={e.id} value={e.id}>{e.name} ({ROLES[e.role]?.label})</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:T.sub,marginBottom:4,fontWeight:700}}>PRE-MADE WARNINGS</div>
                    <select onChange={e=>{if(e.target.value)setForm(p=>({...p,warnMsg:e.target.value}));e.target.value="";}} style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:8,color:T.txt,padding:"7px 10px",fontSize:12,fontFamily:"inherit",outline:"none"}}>
                      <option value="">Select a warning…</option>
                      <option value="Please be mindful of what you say in these messages.">Be mindful of messages</option>
                      <option value="This conversation is being monitored by administration.">Conversation being monitored</option>
                      <option value="Watch what you say — messages are subject to review.">Watch what you say</option>
                      <option value="Keep all communications professional and respectful.">Keep it professional</option>
                      <option value="Your recent messages have been flagged for review.">Messages flagged for review</option>
                      <option value="This is a formal warning regarding your use of this messaging system.">Formal warning issued</option>
                      <option value="Inappropriate language or behavior will not be tolerated.">No inappropriate behavior</option>
                      <option value="A complaint has been filed regarding this conversation. Please conduct yourself accordingly.">Complaint filed</option>
                      <option value="Future violations in this chat may result in disciplinary action.">Disciplinary action warning</option>
                      <option value="Administration has reviewed this conversation. Please review MNU communication policy.">Review communication policy</option>
                      <option value="You are required to maintain respectful and appropriate communication at all times.">Respectful communication required</option>
                      <option value="This conversation has been escalated to department leadership for review.">Escalated to leadership</option>
                      <option value="Any further violations in this channel will be logged and reported.">Further violations will be logged</option>
                      <option value="Your account activity is under review. Ensure all messages comply with policy.">Account under review</option>
                      <option value="This is your final warning before formal disciplinary procedures are initiated.">Final warning</option>
                    </select>
                  </div>
                </div>
                <textarea value={form.warnMsg||""} onChange={e=>setForm(p=>({...p,warnMsg:e.target.value}))} placeholder="Or type a custom warning message…" rows={2}
                  style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:8,color:T.txt,padding:"8px 10px",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",marginBottom:8}}
                />
                <Btn T={T} sm variant="danger" onClick={async()=>{
                  const msg=String(form.warnMsg||"").trim();
                  const to=form.warnTo;
                  if(!msg){toast("Enter or select a warning message","err");return;}
                  if(!to){toast("Select a recipient","err");return;}
                  const target=emps.find(e=>e.id===to);
                  const warnText=`${msg}`;
                  const warnId=uid();
                  // Find all unique chat partners of this employee
                  const chatPartners=[...new Set(dms.filter(d=>(d.from===to||d.to===to)&&d.from!=="system"&&d.to!=="system").map(d=>d.from===to?d.to:d.from))].filter(id=>id!==to);
                  const newMsgs=[];
                  if(chatPartners.length===0){
                    // No existing chats - send just to employee with no thread
                    const threadId=[to,"system"].sort().join("-");
                    newMsgs.push({id:warnId,from:"system",to,text:warnText,at:Date.now(),read:false,system:true,threadWith:"system"});
                  } else {
                    // Send into each existing thread so BOTH people in that chat see it
                    chatPartners.forEach(partnerId=>{
                      const threadId=[to,partnerId].sort().join("-");
                      // Message appears in employee's view of this thread
                      newMsgs.push({id:uid(),from:"system",to,text:warnText,at:Date.now(),read:false,system:true,threadWith:partnerId});
                      // Message also appears in partner's view of this thread
                      newMsgs.push({id:uid(),from:"system",to:partnerId,text:warnText,at:Date.now(),read:false,system:true,threadWith:to});
                    });
                  }
                  const next=[...dms,...newMsgs];
                  setDms(next);await DB.set("nl3-dms",next);
                  addErr("warn",`Tech admin sent warning to ${target?.name} (${chatPartners.length} thread(s)): "${msg}"`);
                  playSound("warn");
                  toast(`Warning sent into ${chatPartners.length||1} conversation(s)!`,"warn");
                  setForm(p=>({...p,warnMsg:"",warnTo:""}));
                }}>⚠️ Send Warning to All Involved</Btn>
              </div>
              {dms.length===0?<div style={{color:T.sub,fontSize:12}}>No messages yet.</div>:(
                <div style={{maxHeight:320,overflowY:"auto",display:"grid",gap:5}}>
                  {[...dms].sort((a,b)=>b.at-a.at).map(msg=>{
                    const sender=emps.find(e=>e.id===msg.from);
                    const recipient=emps.find(e=>e.id===msg.to);
                    const deleteMsg=(notify)=>{
                      // Remove message from dms array
                      const next=dms.filter(d=>d.id!==msg.id);
                      saveDms(next);
                      playSound("delete");
                      if(notify){
                        // Send system notification to both sender and recipient
                        const note=`A message you sent to ${recipient?.name||"someone"} was removed by the Technical Administrator.`;
                        const notifyMsgs=[];
                        if(sender?.id){
                          notifyMsgs.push({id:uid(),from:"system",to:sender.id,text:note,at:Date.now(),read:false,system:true,threadWith:recipient?.id||""});
                        }
                        if(recipient?.id&&recipient.id!==sender?.id){
                          const noteR=`A message from ${sender?.name||"someone"} in your conversation was removed by the Technical Administrator.`;
                          notifyMsgs.push({id:uid(),from:"system",to:recipient.id,text:noteR,at:Date.now(),read:false,system:true,threadWith:sender?.id||""});
                        }
                        if(notifyMsgs.length>0) saveDms([...next,...notifyMsgs]);
                        toast("Message deleted and users notified","warn");
                      } else {
                        toast("Message deleted silently");
                      }
                      addErr("warn",`Tech admin deleted message from ${sender?.name||"unknown"} to ${recipient?.name||"unknown"}`);
                    };
                    return (
                      <div key={msg.id} style={{background:T.bg,borderRadius:10,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start",border:`1px solid ${T.bor}`}}>
                        <div style={{flexShrink:0,width:28,height:28,borderRadius:"50%",background:ROLES[sender?.role]?.color+"22"||T.surfH,border:`2px solid ${ROLES[sender?.role]?.color||T.bor}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:ROLES[sender?.role]?.color||T.mut}}>{initial(sender?.email||"")}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:T.txt,fontWeight:700,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                            <span>{sender?.name||"Unknown"}</span>
                            <span style={{color:T.mut,fontWeight:400}}>→</span>
                            <span>{recipient?.name||"Unknown"}</span>
                            {!msg.read&&<span style={{background:T.scarlet,color:"#fff",borderRadius:4,padding:"0 5px",fontSize:10}}>unread</span>}
                            {msg.system&&<span style={{background:T.warn+"33",color:T.warn,borderRadius:4,padding:"0 5px",fontSize:10}}>system</span>}
                          </div>
                          <div style={{fontSize:12,color:T.sub,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:260}}>{msg.text}</div>
                          <div style={{fontSize:10,color:T.faint,marginTop:2}}>{fmtDT(msg.at)}</div>
                        </div>
                        {/* Delete buttons */}
                        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                          <button onClick={()=>deleteMsg(false)}
                            style={{background:"#fee2e2",border:"1px solid #fca5a5",color:"#991b1b",borderRadius:7,padding:"4px 8px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#fca5a5"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fee2e2"}
                            title="Delete silently — user not notified"
                          >🗑️ Silent</button>
                          <button onClick={()=>deleteMsg(true)}
                            style={{background:"#fef3c7",border:"1px solid #fcd34d",color:"#92400e",borderRadius:7,padding:"4px 8px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#fcd34d"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fef3c7"}
                            title="Delete and notify both users"
                          >📢 Notify</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Manager */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:700,color:T.txt}}>✅ Task Manager ({tasks.length} tasks)</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {selectedTasks.size>0&&(
                    <Btn T={T} sm variant="danger" onClick={async()=>{
                      if(!window.confirm(`Delete ${selectedTasks.size} selected task(s)?`))return;
                      for(const id of selectedTasks){
                        await SB.delete("tasks",{id});
                      }
                      setTasks(prev=>prev.filter(t=>!selectedTasks.has(t.id)));
                      setSelectedTasks(new Set());
                      playSound("delete");
                      toast(`${selectedTasks.size} task(s) deleted`,"warn");
                    }}>🗑️ Delete Selected ({selectedTasks.size})</Btn>
                  )}
                  <Btn T={T} sm variant="ghost" onClick={()=>setSelectedTasks(new Set())}>Clear</Btn>
                </div>
              </div>
              {tasks.length===0?<div style={{color:T.sub,fontSize:12}}>No tasks.</div>:(
                <div style={{maxHeight:260,overflowY:"auto",display:"grid",gap:5}}>
                  {tasks.map(t=>{
                    const checked=selectedTasks.has(t.id);
                    const assignee=t.assignedTo==="all"?"Everyone":emps.find(e=>e.id===t.assignedTo)?.name||"Unknown";
                    return (
                      <div key={t.id} onClick={()=>{setSelectedTasks(prev=>{const n=new Set(prev);checked?n.delete(t.id):n.add(t.id);return n;});}}
                        style={{display:"flex",alignItems:"center",gap:10,background:checked?T.scarlet+"18":T.bg,border:`1px solid ${checked?T.scarlet+"66":T.bor}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${checked?T.scarlet:T.bor}`,background:checked?T.scarlet:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {checked&&<span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:t.done?T.mut:T.txt,textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                          <div style={{fontSize:11,color:T.sub,marginTop:1}}>👤 {assignee} · {t.priority} · {t.done?"Done":"Open"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Patch Notes */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,color:T.txt}}>📋 Patch Notes — v{VERSION}</div>
                <Btn T={T} sm onClick={()=>{
                  const notes=PATCH_NOTES[VERSION]||[];
                  if(!notes.length){toast("No patch notes for this version","warn");return;}
                  const ann={id:uid(),msg:`📋 v${VERSION} ${BUILD_TAG} — MNU Neer Locker Update`,level:"info",by:"System",at:Date.now(),dismissed:[],patchNotes:notes,patchVersion:VERSION,patchBuild:BUILD_TAG};
                  saveAnns([ann,...anns]);
                  toast("Patch notes announced to all staff! ✅");
                }}>📢 Announce to Staff</Btn>
              </div>
              {Object.entries(PATCH_NOTES).map(([ver,notes])=>(
                <details key={ver} style={{background:T.bg,borderRadius:10,marginBottom:6,overflow:"hidden"}} open={ver===VERSION}>
                  <summary style={{padding:"10px 14px",cursor:"pointer",fontWeight:700,fontSize:13,color:ver===VERSION?T.scarlet:T.sub,display:"flex",alignItems:"center",gap:8,listStyle:"none",userSelect:"none"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <span style={{fontSize:16}}>{ver===VERSION?"🆕":"📦"}</span>
                    <span>v{ver} {ver===VERSION?BUILD_TAG:""}</span>
                    {ver===VERSION&&<span style={{background:T.scarlet,color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:800}}>CURRENT</span>}
                  </summary>
                  <div style={{padding:"6px 14px 12px",borderTop:`1px solid ${T.bor}`}}>
                    {notes.map((note,i)=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<notes.length-1?`1px solid ${T.bor}33`:"none",alignItems:"flex-start"}}>
                        <span style={{color:T.ok,fontWeight:800,fontSize:12,flexShrink:0,marginTop:1}}>✓</span>
                        <span style={{fontSize:12,color:T.sub,lineHeight:1.5}}>{note}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            {/* Feedback from staff */}
            <FeedbackPanel T={T} toast={toast}/>

            {/* Backups */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:700,color:T.txt}}>💾 Backups ({bkps.length}/10)</div>
                <Btn T={T} sm onClick={createBackup}>+ New</Btn>
              </div>
              {bkps.length===0?<div style={{color:T.sub,fontSize:12}}>No backups yet.</div>:(
                <div style={{display:"grid",gap:7}}>
                  {bkps.map((bk,i)=>(
                    <div key={bk.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.bg,borderRadius:10,padding:"9px 12px"}}>
                      <div>
                        <div style={{fontSize:13,color:T.txt,fontWeight:600}}>{i===0&&<span style={{color:T.ok,marginRight:5}}>● Latest</span>}{fmtDT(bk.at)}</div>
                        <div style={{fontSize:11,color:T.sub}}>{bk.emps?.length||0} emps · {bk.tasks?.length||0} tasks · {bk.inv?.length||0} items</div>
                      </div>
                      <Btn T={T} sm onClick={()=>restoreBkp(bk)}>↩ Restore</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ClaudeTag T={T}/><VersionBadge T={T}/>
        </div>
      )}
    </div>
  );
}

// ─── QTY BUTTON ───────────────────────────────────────────────────────────────

// ─── HELP MODAL ───────────────────────────────────────────────────────────────
function HelpModal({T,bottom}) {
  const [open,setOpen]=useState(false);
  const items=[
    {icon:"⊙",title:"Circle Menu Button (top-left)",desc:"The floating circle button fixed below the logo — always visible as you scroll. Tap it to open navigation from any page."},
    {icon:"🏠",title:"Home",desc:"Your personal dashboard — quick stats, online team, and announcements."},
    {icon:"✅",title:"Tasks",desc:"View and complete tasks assigned to you. Managers can create, assign, and delete tasks."},
    {icon:"📦",title:"Inventory",desc:"Track stock levels in real time. Tap + or − to adjust quantities."},
    {icon:"🔔",title:"Announcements",desc:"Messages from management. Tap ✕ to dismiss once you've read them."},
    {icon:"💬",title:"Messages",desc:"One-on-one direct messages with any team member. Messages may be reviewed by management."},
    {icon:"📊",title:"Activity",desc:"Full log of logins, task completions, and team changes. Visible to managers and above."},
    {icon:"⚙️",title:"Settings",desc:"Update your name, email, PIN, status, display preferences, and sound settings."},
    {icon:"📱",title:"Device & UI Scaling",desc:"Go to Settings → Display & Sound → Device & UI Scaling to switch between Mobile, Desktop, or Auto mode. This resizes the whole app for your screen."},
    {icon:"🎓",title:"Logo — Go Home",desc:"Click 'MNU\'s Neer Locker' in the header anytime to return to the Home page."},
    {icon:"📲",title:"Add to Home Screen (iPhone)",desc:"Open neer-locker.vercel.app in Safari → tap the Share button (box with arrow) → tap 'Add to Home Screen' → tap Add. Opens like a real app with no browser bar."},
    {icon:"📲",title:"Add to Home Screen (Android)",desc:"Open in Chrome → tap the three-dot menu (⋮) → tap 'Add to Home Screen' → tap Add. Works like a native app icon on your home screen."},
    {icon:"💡",title:"Feedback Button",desc:"Use the 💡 button (bottom-right area) to send feature requests or report bugs to the Tech Admin."},
  ];
  return (
    <>
      <button onClick={()=>{playSound("open");setOpen(true);}} className="float-action-btn" style={{position:"fixed",bottom:bottom??52,right:14,zIndex:9998,background:T.scarlet,color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(0,0,0,.22)",transition:"transform .15s,filter .15s,bottom .25s",touchAction:"manipulation"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.filter="brightness(1.1)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.filter="none";}}
        title="Help"
      >?</button>
      {open&&(
        <div onClick={e=>e.target===e.currentTarget&&setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:20}}>
          <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:18,width:"100%",maxWidth:480,maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"fadeUp .22s ease both",overflow:"hidden"}}>
            {/* Sticky header with always-visible × */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px 14px",borderBottom:`1px solid ${T.bor}`,flexShrink:0,background:T.surf,borderRadius:"18px 18px 0 0",position:"sticky",top:0,zIndex:10}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:19,fontWeight:800,color:T.txt}}>❓ Help & Navigation</div>
              <button onClick={()=>{playSound("click");setOpen(false);}}
                style={{width:34,height:34,borderRadius:"50%",background:T.surfH,border:`1px solid ${T.bor}`,color:T.txt,fontSize:18,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.scarlet;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.scarlet;}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.surfH;e.currentTarget.style.color=T.txt;e.currentTarget.style.borderColor=T.bor;}}
              >×</button>
            </div>
            {/* Scrollable content */}
            <div style={{overflowY:"auto",padding:"16px 22px 22px"}}>
              <div style={{fontSize:13,color:T.sub,marginBottom:16,lineHeight:1.6}}>
                Welcome to <strong style={{color:T.scarlet}}>MNU's Neer Locker</strong> — your campus business staff portal. Here's where to find everything:
              </div>
              <div style={{display:"grid",gap:10}}>
                {items.map((item,i)=>(
                  <div key={item.title} style={{display:"flex",gap:12,alignItems:"flex-start",background:T.surfH,borderRadius:12,padding:"11px 14px",animation:`fadeUp .2s ${i*30}ms ease both`}}>
                    <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:T.txt}}>{item.title}</div>
                      <div style={{fontSize:12,color:T.sub,marginTop:2,lineHeight:1.5}}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,background:`${T.blue}12`,border:`1px solid ${T.blue}33`,borderRadius:10,padding:"10px 14px",fontSize:12,color:T.sub,lineHeight:1.6}}>
                Have an idea or found a bug? Tap the <strong style={{color:"#b45309"}}>💡 Ideas button</strong> (bottom-right, above the ?) to send feedback to the Tech Admin.<br/>
                Your name, email, and status can be changed in <strong>Settings → Profile</strong>.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ─── FEEDBACK PANEL (tech dashboard) ─────────────────────────────────────────
function FeedbackPanel({T,toast}) {
  const [items,setItems]=useState([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    SB.select("direct_messages","?feedback=eq.true&order=at.desc").then(d=>{setItems(d||[]);setLoaded(true);});
  },[]);
  const clear=async()=>{
    await fetch(`${SUPABASE_URL}/rest/v1/direct_messages?feedback=eq.true`,{method:"DELETE",headers:SB.headers});
    setItems([]);toast("Feedback cleared","warn");
  };
  const icons={feature:"💡",bug:"🐛",improvement:"✨",other:"📝"};
  return (
    <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontWeight:700,color:T.txt}}>💡 Staff Feedback ({items.length})</div>
        {items.length>0&&<button onClick={clear} style={{background:"none",border:"none",color:T.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Clear All</button>}
      </div>
      {!loaded?<div style={{color:T.sub,fontSize:12}}>Loading…</div>
        :items.length===0?<div style={{color:T.sub,fontSize:12}}>No feedback yet. Staff can submit using the 💡 button.</div>
        :(
          <div style={{display:"grid",gap:8,maxHeight:300,overflowY:"auto"}}>
            {items.map(f=>(
              <div key={f.id} style={{background:T.bg,borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:13,color:T.txt,lineHeight:1.5}}>{f.text}</div>
                <div style={{fontSize:11,color:T.sub,marginTop:4}}>{fmtDT(f.at||f.created_at)}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function QBtn({onClick,children,T}) {
  const [p,setP]=useState(false);
  return (
    <button onClick={e=>{playSound("click");onClick(e);}} onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
      style={{background:T.surfH,border:`1px solid ${T.bor}`,color:T.sub,width:30,height:30,borderRadius:8,cursor:"pointer",fontSize:18,fontFamily:"inherit",transform:p?"scale(0.85)":"scale(1)",transition:"background .12s,transform .1s,color .12s"}}
      onMouseEnter={e=>{e.currentTarget.style.background=T.bor;e.currentTarget.style.color=T.txt;}}
      onMouseLeave={e=>{e.currentTarget.style.background=T.surfH;e.currentTarget.style.color=T.sub;}}
    >{children}</button>
  );
}


