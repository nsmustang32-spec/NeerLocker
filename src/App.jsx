import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VERSION   = "1.9.1";
const FINN_VERSION = "1.4.0";
const VIGIL_VERSION = "2.1.0";
const FINN_PATCH_NOTES = {
  "1.4.0": [
    "Finn Memory: remembers facts across sessions — say remember that...",
    "Finn Memory: injected into Aether context every message",
    "Task reminders: say remind me in 2 hours about [task]",
    "Continuous voice: mic stays on until you say stop or tap again",
    "Stop phrases: say stop, done, cancel, stop listening, bye finn, etc.",
    "Time zone fix: Finn Aether now shows your correct local time",
    "Vigil HyperCore v2.1.0: login now server-verified via api/vigil.js",
    "Vigil: JWT session tokens — validated every 5 minutes",
    "Vigil: logout clears server session",
    "Morning brief now includes streak count",
  ],
  "1.3.2": [
    "Finn Memory: remembers facts across sessions — say remember that...",
    "Finn Memory: works in both Aether and Atlas",
    "Task reminders: say remind me in 2 hours about [task]",
    "Vigil HyperCore: login now server-verified via api/vigil.js",
    "Vigil: session validated every 5 minutes",
    "Vigil: logout clears server session token",
    "Morning brief now includes streak count",
  ],
  "1.3.1": [
    "Voice mode: Finn now speaks replies aloud using male voice",
    "Voice mode: Tap mic button to talk to Finn hands-free",
    "Voice mode: iOS PWA warning shown when mic unavailable",
    "Voice mode: Settings now save correctly across sessions",
    "Voice mode: Male voice prioritized (Aaron, Daniel, Alex)",
  ],
  "1.3.0": [
    "Finn Aether: Cloud-powered Finn by Llama 3.1 via Groq — understands anything naturally",
    "Action tags: Finn can complete tasks, adjust inventory, navigate, send DMs through AI",
    "Finn Atlas: On-device fallback — always works, no internet needed",
    "Full conversation context sent to AI — Finn remembers the thread",
    "Real-time data injected into every prompt — Finn always knows current state",
  ],
  "1.2.0": [
    "Edit tasks through Finn — change priority, due date, or assignment",
    "Adjust inventory counts — set, add, or subtract stock directly",
    "Dismiss announcements through Finn",
    "Bulk complete — mark all your tasks done at once",
    "Natural date parsing — say due tomorrow, Friday, next week",
    "Nickname memory — say call me [name] and Finn remembers",
    "Weekly performance review — ask how am I doing",
    "End of shift wrap-up — say wrap up for a shift summary",
    "Morning brief — automatic daily summary on first open",
    "Fun facts, icebreakers, and trivia on demand",
    "Confirmation before every action — never acts without approval",
    "Due today and due this week filters",
  ],
  "1.1.0": [
    "Shift summaries for managers and boss",
    "Assign tasks directly through Finn",
    "Complete tasks through Finn with confirmation",
    "Confirm before any action — never acts without your approval",
    "Conversation memory — Finn remembers last 8 messages",
    "Smarter notifications — level-up alerts, streak countdown",
    "Improved natural conversation for non-work topics",
    "Restock list — ask what we should order",
    "Team task view for managers",
  ],
  "1.0.0": [
    "Finn launched — Fusion Integrated Neural Navigator",
    "Local engine — zero cost, no API needed",
    "Tasks, inventory, XP, messages, navigation",
    "Multi-turn creation for tasks, inventory, announcements, DMs",
    "Settings control — dark mode, status, layout",
    "Glow effects and Processing indicator",
    "Personalized intro based on your current data",
  ],
};
const BUILD_TAG = "FR";

// ─── PATCH NOTES ─────────────────────────────────────────────────────────────
const PATCH_NOTES = {
  "1.9.1": [
    "Minimal Mode: Complete visual overhaul with Google Antigravity-inspired palette",
    "Minimal Mode: Full accent color system — all UI elements respond to chosen color",
    "Minimal Mode: Emoji toggle, minimal sounds engine, animated home banner",
    "XP Shop: 36 items across Colors, Power-ups, Badges, Profile, and Fun categories",
    "XP Shop: 13 accent colors including animated Rainbow (2500 XP)",
    "XP Shop: Streak Saver, 2x XP Boost, XP Gifts, Task Hint power-ups",
    "XP Shop: Pioneer, Legend, GOAT, MNU Pride, Grinder, Night Owl, Streak badges",
    "XP Shop: Custom Profile Picture (free), Gold/Scarlet/Blue/Rainbow avatar frames",
    "XP Shop: Task Confetti, Premium Sounds, Dark Aura, Finn Gold Skin, Fireworks",
    "XP Shop: Accessible from Leaderboard, Nav Menu, and Home XP banner",
    "Cloud Profile Pictures: Upload photo, auto-resized, saved to Supabase, team-visible",
    "Monthly Rating: 1-10 rating + ideas, once per month, Tech Admin dashboard view",
    "Tasks: Completed tasks show who finished them and when",
    "Onboarding Tour: Interactive — navigates app live, spotlights UI with SVG mask",
    "Onboarding Tour: Horizontal arrows, press-here labels, draggable minimized pill",
    "Onboarding Tour: Edge-snapping pill — horizontal top/bottom, vertical left/right",
    "Onboarding Tour: PIN, biometric, and required notifications gate steps",
    "Nav Menu: Leaderboard and XP Shop entries added",
    "Help: Updated guide with all new features documented",
    "Fix: PINs now correctly persist across updates (pin_hash loaded from Supabase)",
    "Fix: Profile pictures loaded on startup across all devices",
    "Fix: mkTheme/mkMinimalTheme const declarations fixed — resolved white screen crash",
    "Fix: Shop category tabs now fully visible — overflow clipping resolved",
    "Fix: Toggle thumb colors — no more white-on-white in minimal dark mode",
    "Fix: Claude tag no longer overlaps nav menu",
  ],
  "1.8.4": [
    "Fix: Notifications no longer fire twice",
    "Fix: Tasks now save correctly to Supabase",
    "Voice: Finn pauses mic while speaking, restarts when done",
    "Voice: Mic stops cleanly when Finn panel is closed",
  ],
  "1.8.3": [
    "DMs: Long messages scrollable within the bubble",
    "DMs: Group chat shows who sent each message",
    "Tasks: Fixed empty due date sending invalid data to Supabase",
    "Announcements: Recently dismissed section with Restore button",
    "Finn: Aether now asks for confirmation before executing actions",
  ],
  "1.8.2": [
    "Schedule tab: new page for staff to view the current schedule in-app",
    "Tech Admin: paste any schedule URL — Google Sheets, OneDrive, SharePoint",
    "Schedule: auto-saves to Supabase, all staff see it instantly",
  ],
  "1.8.1": [
    "Fix: Push notifications now fire when tasks are created",
    "Fix: grantXP stale closure fixed with progressRef",
    "Fix: Voice input no longer depends on stale input state",
  ],
  "1.8.0": [
    "Finn v1.4.0 — Memory system, task reminders, continuous voice mode",
    "Vigil HyperCore v2.1.0 — Full server-side login enforcement via JWT",
    "Vigil: Session validation every 5 minutes with auto-logout",
    "Voice: Continuous listening mode with 18 stop phrases",
    "Fix: Task creation no longer disappears — 30s polling with merge logic",
  ],
  "1.7.5": [
    "Finn Memory: remembers facts across sessions",
    "Task reminders: say remind me in 2 hours about [task]",
    "Vigil: JWT session tokens validated every 5 minutes",
  ],
  "1.7.4": [
    "Vigil HyperCore v2.0.1 — Failed email login tracked and locked",
    "Vigil: New PIN creation now hashed automatically",
  ],
  "1.7.3": [
    "Vigil HyperCore v2.0.0 — PIN hashing with SHA-256",
    "Vigil: Account lockout after 5 failed PIN attempts (15 min)",
    "Vigil: Security dashboard in Tech Admin with live event log",
  ],
  "1.7.1": [
    "Fix: Haptic feedback now works and can be toggled in Settings",
    "Fix: Sign Out button no longer overflows on mobile",
    "Fix: TaskCard swipe and long press context menu fully repaired",
  ],
  "1.7.0": [
    "UI: Pull to refresh on all pages",
    "UI: Swipe right to complete tasks, left to delete",
    "UI: Long press tasks for context menu",
    "UI: Notification bell in header with notification center",
    "Haptics: Vibration on task complete and DM send",
    "Notifications: Weekly digest every Monday morning",
  ],
  "1.6.0": [
    "Leaderboard: Full staff XP leaderboard page",
    "Group Chat: Whole-team group chat added to Messages",
    "XP: Green pop-up toast shows XP gained after each action",
    "Employee of the Month: Shown on Home page based on XP",
    "Tech Admin: Can reset all XP for the month",
  ],
  "1.5.1": [
    "Finn: Fusion Integrated Neural Navigator — v1.0.0",
    "Finn: Can create tasks, announcements, inventory, and DMs",
    "Finn: Can change your settings (status, display, PIN)",
  ],
  "1.5.0": [
    "Finn: Navigate the app by asking Finn to take you somewhere",
    "UI: First-time welcome portal animation",
  ],
  "1.4.0": [
    "Smart: Global search bar always visible in header",
    "Smart: Auto-categorizes task priority based on keywords",
    "Offline: App detects offline status and queues actions",
  ],
  "1.3.0": [
    "Finn: Now knows your XP, level, title, and streak",
    "Progression: Full system with 10 levels and daily streaks",
  ],
  "1.2.0": [
    "Finn: AI assistant built into the app",
    "Progression: Daily login streaks, XP system, and level titles",
    "Progression: 10 levels from Pioneer to Top Contributor",
  ],
  "1.1.2": [
    "Login: Staff sign in with MNU email only",
    "Profile: Nickname field only visible to the user on their device",
  ],
  "1.1.1": [
    "Profile: Name field replaced with Nickname — only visible to you",
  ],
  "1.1.0": [
    "Notifications: Push notifications for tasks, announcements, and messages",
    "Settings: Tablet UI scaling option added",
  ],
  "1.0.4": [
    "Auth: Face ID / Touch ID / fingerprint login via WebAuthn passkeys",
    "Settings: Managers and Asst. Managers can manage team in Settings",
  ],
  "1.0.3": [
    "DMs: Fixed messages not sending",
    "Tasks: Fixed description not saving to Supabase",
  ],
  "1.0.2": [
    "Tasks: Description now saves correctly and persists",
    "Tasks: Tech admin can select and bulk-delete tasks",
    "DMs: Can now message anyone regardless of online status",
  ],
  "1.0.1": [
    "Nav: Menu circle button always appears above the header bar",
  ],
  "1.0.0": [
    "Tasks: Tap any task to expand and see full details",
    "PWA: App icon and splash screen for iPhone and Android",
    "Version: 1.0.0 Beta — first full production release",
  ],
};
const TECH_EMAIL = "nrsmith2@mnu.edu";
const TECH_PIN   = "0000";
const MAX_TRIES  = 5;
const LOCK_MS    = 5 * 60 * 1000;
const AUTO_LOGOUT_MS = 30 * 60 * 1000;

// ─── THEMES ───────────────────────────────────────────────────────────────────
// ── Google Antigravity exact minimal theme ──────────────────────────────────
const mkMinimalTheme = (dark, compact, accent) => ({
  // Exact Google Antigravity palette
  scarlet: dark?"#ffffff":"#202124",  // pill color = opposite of bg
  sD:      dark?"#aecbfa":"#3c4043",
  sG:      dark?"#8ab4f820":"#20212410",
  blue:    dark?"#8ab4f8":"#1a73e8",  // link/accent blue
  bD:      dark?"#aecbfa":"#1557b0",
  bG:      dark?"#8ab4f812":"#1a73e810",
  bg:      dark?"#000000":"#ffffff",  // pure black / pure white
  surf:    dark?"#111111":"#ffffff",
  surfH:   dark?"#1a1a1a":"#f8f9fa",
  card:    dark?"#111111":"#ffffff",
  bor:     dark?"#2a2a2a":"#e0e0e0",
  borH:    dark?"#5f6368":"#bdc1c6",
  txt:     dark?"#ffffff":"#000000",
  sub:     dark?"#888888":"#666666",
  faint:   dark?"#3c4043":"#e8eaed",
  mut:     dark?"#5f6368":"#80868b",
  ok:      dark?"#81c995":"#188038",
  warn:    dark?"#fdd663":"#e37400",
  err:     dark?"#f28b82":"#c5221f",
  accent: accent || "#C8102E", // user-chosen accent color
  dark, compact, minimal:true,
  // Generous spacing — airy like Antigravity
  sp: compact ? { xs:2, sm:4, md:8,  lg:12, xl:16, r:9999, card:12 }
              : { xs:4, sm:8, md:16, lg:24, xl:32, r:9999, card:12 },
  fs: compact ? { xs:9,  sm:10, md:12, lg:14, xl:16 }
              : { xs:11, sm:13, md:15, lg:17, xl:21 },
});

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
  accent: accent||"#C8102E",
  dark, compact,
  // Compact is VERY dramatic - nearly half the spacing/size
  sp: compact ? { xs:1, sm:3, md:6,  lg:10, xl:14, r:8,  card:8  }
              : { xs:3, sm:8, md:14, lg:22, xl:30, r:16, card:16 },
  fs: compact ? { xs:9,  sm:10, md:11, lg:13, xl:15 }
              : { xs:11, sm:13, md:15, lg:17, xl:21 },
});
const T0 = (()=>{ try{ const m=JSON.parse(localStorage.getItem("nl3-minimal")); const dk=JSON.parse(localStorage.getItem("nl3-dark")); const cp=JSON.parse(localStorage.getItem("nl3-compact")); const ac=localStorage.getItem("nl3-accent")||"";
window._minimalMode=!!m; window._minimalSounds=(localStorage.getItem('nl3-minimal-sound')!==String(false)); window._showEmojis=(localStorage.getItem('nl3-emojis')!==String(false)); const se=localStorage.getItem("nl3-emojis")!==String(false); if(m) return {...mkMinimalTheme(!!dk,!!cp,ac),showEmojis:se}; return {...mkTheme(!!dk,!!cp,ac),showEmojis:se}; }catch(e){ window._minimalMode=false; window._showEmojis=true; window._minimalSounds=false; return mkTheme(false,false,""); } })();

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────
// Shared AudioContext — reused so browsers don't block it after first interaction
let _audioCtx = null;
// Sound settings controlled by app — stored on window for easy access from playSound
window._soundOn = true;
window._soundVol = 0.22;

// Haptic feedback — works on iOS and Android
function haptic(type="light") {
  try {
    if(window._hapticsOff) return;
    if(navigator.vibrate) {
      const patterns={light:10,medium:20,heavy:40,success:[10,50,10],error:[20,30,20,30,20]};
      navigator.vibrate(patterns[type]||10);
    }
  } catch(e){}
}
function getCtx() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch(e) { return null; }
}
// Resume audio on any user gesture — fixes sounds dying after backgrounding
if (typeof document !== "undefined") {
  ["touchstart","touchend","mousedown","keydown"].forEach(evt=>{
    document.addEventListener(evt, ()=>{ try{ if(_audioCtx&&_audioCtx.state==="suspended")_audioCtx.resume(); }catch(e){} }, {passive:true,once:false});
  });
}

// Original rich sound engine — used in normal (non-minimal) mode
function _playSoundRich(type="click") {
  if (!window._soundOn) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const vol = window._soundVol ?? 0.22;
    const master = ctx.createGain();
    master.gain.setValueAtTime(vol, now);
    master.connect(ctx.destination);
    const note = (freq, startT, dur, vol2=0.6, wave="sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(freq, startT);
      g.gain.setValueAtTime(0, startT);
      g.gain.linearRampToValueAtTime(vol2, startT + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
      o.connect(g); g.connect(master);
      o.start(startT); o.stop(startT + dur + 0.05);
    };
    const sounds = {
      click:   ()=>note(880,now,0.08,0.5),
      open:    ()=>{note(523,now,0.1,0.4);note(659,now+0.06,0.12,0.35);},
      close:   ()=>{note(659,now,0.08,0.35);note(523,now+0.05,0.1,0.3);},
      notify:  ()=>{note(783,now,0.1,0.4);note(987,now+0.08,0.15,0.35);},
      success: ()=>{note(523,now,0.08,0.4);note(659,now+0.06,0.08,0.35);note(783,now+0.12,0.15,0.4);},
      delete:  ()=>note(220,now,0.12,0.5,"sawtooth"),
      warn:    ()=>{note(440,now,0.1,0.4,"triangle");note(440,now+0.12,0.1,0.3,"triangle");},
      dm:      ()=>{note(659,now,0.06,0.3);note(880,now+0.05,0.1,0.3);},
      finn:    ()=>{[523,659,783,1046].forEach((f,i)=>note(f,now+i*0.06,0.1,0.3));},
      backup:  ()=>{note(523,now,0.08,0.3);note(659,now+0.1,0.12,0.3);},
      login:   ()=>{
        // Cool ascending login chord — C → E → G → C → E (major triumph)
        note(523, now,      0.12, 0.45);  // C5
        note(659, now+0.08, 0.14, 0.40);  // E5
        note(783, now+0.16, 0.16, 0.42);  // G5
        note(1046,now+0.24, 0.20, 0.48);  // C6
        note(1318,now+0.32, 0.30, 0.50);  // E6 — final shimmer
        // Subtle sparkle on top
        note(2093,now+0.40, 0.25, 0.18, "sine");
      },
      logout:  ()=>{note(659,now,0.1,0.3);note(523,now+0.08,0.12,0.25);},
    };
    (sounds[type]||sounds.click)();
  } catch(e) {}
}

function playSound(type="click") {
  if (!window._soundOn) return;
  if (!window._minimalMode || window._minimalSounds===false) { _playSoundRich(type); return; }
  // Minimal mode with minimal sounds on — clean short tones only
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const vol = window._soundVol ?? 0.22;
    const master = ctx.createGain();
    master.gain.setValueAtTime(vol * 0.7, now); // Minimal = slightly quieter
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(master);

    // Clean minimal sound map — short, soft, unobtrusive
    const sounds = {
      click:    { freq:880,  type:"sine",     dur:0.05, attack:0.003, decay:0.04  },
      open:     { freq:1046, type:"sine",     dur:0.08, attack:0.004, decay:0.07  },
      close:    { freq:784,  type:"sine",     dur:0.06, attack:0.002, decay:0.05  },
      notify:   { freq:1174, type:"sine",     dur:0.12, attack:0.005, decay:0.10  },
      success:  { freq:1318, type:"sine",     dur:0.14, attack:0.005, decay:0.12  },
      delete:   { freq:392,  type:"sine",     dur:0.08, attack:0.002, decay:0.07  },
      warn:     { freq:659,  type:"triangle", dur:0.10, attack:0.003, decay:0.09  },
      dm:       { freq:1046, type:"sine",     dur:0.09, attack:0.004, decay:0.08  },
      finn:     { freq:1318, type:"sine",     dur:0.10, attack:0.005, decay:0.09  },
      backup:   { freq:880,  type:"sine",     dur:0.10, attack:0.004, decay:0.09  },
      login:    { freq:1046, type:"sine",     dur:0.15, attack:0.005, decay:0.13  },
      logout:   { freq:659,  type:"sine",     dur:0.10, attack:0.003, decay:0.09  },
    };

    const s = sounds[type] || sounds.click;
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.9, now + s.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur);
    osc.start(now);
    osc.stop(now + s.dur + 0.01);
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
      if(!r.ok){ console.error("SB.select failed:",table,r.status); return []; }
      const data = await r.json();
      if(table==="tasks") console.log("[DB] tasks loaded:",data.length,"rows");
      return data;
    } catch(e) { console.error("SB.select error:",table,e.message); return []; }
  },

  async upsert(table, data) {
    try {
      const r = await fetch(SB.url(table), {
        method: "POST",
        headers: {...SB.headers, "Prefer": "resolution=merge-duplicates,return=representation"},
        body: JSON.stringify(data)
      });
      if(!r.ok){
        const err=await r.text().catch(()=>"unknown");
        console.error("SB.upsert failed:",table,"status:",r.status,"body:",err,"data sent:",JSON.stringify(data).slice(0,300));
        return null;
      }
      return await r.json();
    } catch { return null; }
  },

  // PATCH — partial update by id, never triggers NOT NULL constraint on other cols
  async patch(table, id, data) {
    try {
      const r = await fetch(SB.url(table, `?id=eq.${id}`), {
        method: "PATCH",
        headers: {...SB.headers, "Prefer": "return=representation"},
        body: JSON.stringify(data)
      });
      if(!r.ok){
        const err=await r.text().catch(()=>"unknown");
        console.error("SB.patch failed:",table,id,"status:",r.status,"body:",err);
        return null;
      }
      return await r.json();
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
// Emoji helper — minimal mode only. Normal mode ALWAYS shows emoji.
const E = (emoji, fallback="") => {
  // Only suppress emojis if: minimal mode is ON AND emoji toggle is OFF
  if (!window._minimalMode || window._showEmojis!==false) return emoji;
  return fallback||emoji;
};

const LS = {
  get: k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = [
  {id:"e1", email:"tlsinclair@mnu.edu",  name:"Professor Sinclair", role:"boss",      pin:"",status:"offline",createdAt:1700000000000},
  {id:"e2", email:"nrsmith2@mnu.edu",    name:"Nate Smith",         role:"manager",   pin:"",status:"offline",createdAt:1700000000001},
  {id:"e3", email:"emburnett@mnu.edu",   name:"Ella Burnett",       role:"manager",   pin:"",status:"offline",createdAt:1700000000002},
  {id:"e4", email:"afmccarthy@mnu.edu",  name:"Alexis McCarthy",    role:"assistant", pin:"",status:"offline",createdAt:1700000000003},
  {id:"e5", email:"zwerth@mnu.edu",      name:"Zaylee Werth",       role:"employee",  pin:"",status:"offline",createdAt:1700000000004},
  {id:"e6", email:"tlmiller3@mnu.edu",   name:"Trysta Miller",      role:"employee",  pin:"",status:"offline",createdAt:1700000000005},
  {id:"e7", email:"bdgould@mnu.edu",     name:"Bethany Gould",      role:"employee",  pin:"",status:"offline",createdAt:1700000000006},
  {id:"e8", email:"mrmanthe@mnu.edu",    name:"Mackenzie Manthe",   role:"employee",  pin:"",status:"offline",createdAt:1700000000007},
  {id:"e9", email:"llvarney@mnu.edu",    name:"Lauren Varney",      role:"employee",  pin:"",status:"offline",createdAt:1700000000008},
  {id:"e10",email:"bllittle@mnu.edu",     name:"Brylee Little",      role:"employee",  pin:"",status:"offline",createdAt:1700000000009},
  {id:"e11",email:"wrlaymon@mnu.edu",      name:"Werke Laymon",        role:"employee",  pin:"",status:"offline",createdAt:1700000000010},
];
const ROLES = {
  boss:      {label:"Boss",        color:"#C8102E", p:["home","tasks","inv","ann","act","emp","assign","settings","boss","dms","online","leaderboard"]},
  manager:   {label:"Manager",     color:"#1e7fa8", p:["home","tasks","inv","ann","act","emp","assign","settings","dms","online","leaderboard"]},
  assistant: {label:"Asst. Mgr",  color:"#7c3aed", p:["home","tasks","inv","ann","assign","settings","emp","dms","leaderboard"]},
  employee:  {label:"Employee",   color:"#6b7280", p:["home","tasks","inv","ann","dms","leaderboard"]},
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
  @keyframes finnSlideUp{0%{opacity:0;transform:translateY(100%) scale(0.92);}60%{transform:translateY(-8px) scale(1.01);}100%{opacity:1;transform:translateY(0) scale(1);}}
  @keyframes finnHexSpin{0%{transform:rotate(0deg) scale(0);}50%{transform:rotate(200deg) scale(1.3);}100%{transform:rotate(360deg) scale(1);}}
  @keyframes finnRipple{0%{transform:scale(0);opacity:0.6;}100%{transform:scale(4);opacity:0;}}
  @keyframes finnStagger{0%{opacity:0;transform:translateY(16px);}100%{opacity:1;transform:translateY(0);}}
  @keyframes finnGlow{0%,100%{box-shadow:0 0 20px #1e7fa844;}50%{box-shadow:0 0 40px #1e7fa888,0 0 60px #C8102E33;}}
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
    .nav-circle-btn{width:52px!important;height:52px!important;}
    .float-action-btn{width:46px!important;height:46px!important;font-size:18px!important;}
    .search-full{min-width:60px;max-width:90px;}
    .header-name{display:none!important;}
    .search-label{display:none!important;}
  }
  @media(min-width:769px) and (max-width:1024px){
    .search-full{min-width:140px;}
  }
  @media(min-width:1025px){
    .search-full{min-width:200px;}
  }
  @keyframes ptrSpin{to{transform:rotate(360deg);}}
  .ptr-spinner{animation:ptrSpin .6s linear infinite;}
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
  const mn=T.minimal;
  const V= mn ? {
    // Google Antigravity pill style — primary is ALWAYS red #C8102E (MNU brand)
    primary:{bg:T.accent,color:"#fff",border:"none"},
    blue:   {bg:"#1a73e8",color:"#fff",border:"none"},
    ghost:  {bg:"transparent",color:T.txt,border:`1.5px solid ${T.txt}`},
    danger: {bg:"transparent",color:"#c5221f",border:"1px solid #f28b8288"},
    success:{bg:"#188038",color:"#fff",border:"none"},
  } : {
    primary:{bg:`linear-gradient(135deg,${T.scarlet},${T.sD})`,color:"#fff",border:"none"},
    blue:   {bg:`linear-gradient(135deg,${T.blue},${T.bD})`,   color:"#fff",border:"none"},
    ghost:  {bg:T.surfH,color:T.sub,border:`1px solid ${T.bor}`},
    danger: {bg:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5"},
    success:{bg:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none"},
  };
  const v=V[variant||"primary"];
  const pad=xs?"4px 10px":sm?"6px 14px":"10px 20px";
  const fs=xs?11:sm?12:14;
  const radius=mn?9999:T.sp.r;
  const snd=sound||(variant==="danger"?"delete":variant==="success"?"success":"click");
  const handleClick=e=>{ if(!disabled){playSound(snd);} onClick?.(e); };
  return (
    <button onClick={handleClick} disabled={disabled} className="btn-press"
      onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
      style={{background:v.bg,color:v.color,border:v.border,borderRadius:radius,padding:pad,fontWeight:mn?500:700,fontSize:fs,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,transform:p?"scale(0.97)":"scale(1)",transition:"all .15s",letterSpacing:mn?"0.01em":undefined,fontFamily:"inherit",width:full?"100%":undefined,flex:flex||undefined,...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=mn?"0.85":"1";e.currentTarget.style.filter=mn?"none":"brightness(1.08)";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.filter="none";}}
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
      <textarea {...rest} style={{width:"100%",background:T.bg,border:`1px solid ${f?T.blue:T.bor}`,borderRadius:T.sp.card||Math.min(T.sp.r,16),color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none",resize:"vertical",transition:"border-color .2s",...(rest.style||{})}}
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

function Avatar({email,color,size=36,avatarUrl,frame}) {
  // Frame styles
  const frameMap={
    pfp_frame_gold:   {border:`3px solid #eab308`, boxShadow:`0 0 0 2px #fef3c7, 0 0 12px #eab30866`},
    pfp_frame_scarlet:{border:`3px solid #C8102E`, boxShadow:`0 0 0 2px #fee2e2, 0 0 12px #C8102E66`},
    pfp_frame_blue:   {border:`3px solid #1e7fa8`, boxShadow:`0 0 0 2px #dbeafe, 0 0 12px #1e7fa866`},
    pfp_frame_rainbow:{border:"3px solid transparent", backgroundImage:"linear-gradient(#fff,#fff),linear-gradient(90deg,#ef4444,#f59e0b,#eab308,#10b981,#3b82f6,#a855f7,#ef4444)", backgroundOrigin:"border-box", backgroundClip:"padding-box,border-box", boxShadow:"0 0 12px #a855f766", animation:"rainbowSpin 3s linear infinite"},
  };
  const frameStyle=frameMap[frame]||{border:`2px solid ${color}55`};
  if(avatarUrl){
    return <div style={{width:size,height:size,borderRadius:"50%",...frameStyle,overflow:"hidden",flexShrink:0,background:color+"22"}}>
      <img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={e=>{e.target.style.display="none";}}/>
    </div>;
  }
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",...frameStyle,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color,fontSize:size*0.42,flexShrink:0}}>{initial(email)}</div>;
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

function VersionBadge({T,hide}) {
  return (
    <div style={{position:"fixed",bottom:12,right:8,zIndex:499,background:T.surf,border:"1px solid "+T.bor,borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.03em",userSelect:"none",display:"flex",gap:5,alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,.1)",opacity:hide?0:1,transform:hide?"translateY(12px)":"translateY(0)",transition:"opacity .25s ease,transform .25s ease",pointerEvents:hide?"none":"auto"}}>
      <span style={{color:T.accent,fontWeight:800}}>MNU</span>
      <span style={{color:T.faint}}>·</span>
      <span style={{color:T.sub}}>Neer Locker</span>
      <span style={{color:T.faint}}>·</span>
      <span style={{color:T.accent}}>v{VERSION}</span>
      <span style={{color:T.mut,fontWeight:600}}>{BUILD_TAG}</span>
    </div>
  );
}

function ClaudeTag({T}) {
  return (
    <div style={{position:"fixed",bottom:8,left:8,fontSize:10,color:T.faint,fontWeight:500,letterSpacing:"0.01em",userSelect:"none",zIndex:290,opacity:0.6,lineHeight:1.75,pointerEvents:"none"}}>
      Built using Claude · Created by Nate Smith<br/>
      <span style={{color:"#1e7fa8",fontWeight:600}}>⬡ Powered by Finn v{FINN_VERSION}</span><br/>
      <span style={{color:"#16a34a",fontWeight:600}}>🛡 Secured by Vigil HyperCore v{VIGIL_VERSION}</span>
    </div>
  );
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
            <span style={{color:i===lines.length-1&&progress>=1?T.accent+"cc":T.warn+"cc"}}>{line}</span>
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
        <div style={{color:T.sub,fontSize:13,marginTop:6}}>Signing out of MNU&apos;s Neer Locker…</div>
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
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:24,fontWeight:800,color:T.txt,lineHeight:1.2}}>Welcome back, {name.split(" ")[0]}.</div>
        <div style={{color:T.accent,fontSize:13,fontWeight:600,marginTop:7,fontStyle:"italic",animation:"fadeUp .35s ease both"}}>
          {quote}
        </div>
        <div style={{color:T.sub,fontSize:12,marginTop:8}}>{rc.label} &middot; MNU&apos;s Neer Locker</div>
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
          <div style={{textAlign:"center",padding:"20px 0",color:T.sub,fontSize:14}}>🎉 You&apos;re all caught up! Nothing new.</div>
        )}

        <div style={{marginTop:16}}>
          <Btn T={T} full variant="ghost" onClick={close}>Got it, let&apos;s go →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────────────
function NavMenu({user,page,setPage,tasks,anns,dms,T,onFinn,onShop}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const myAnns=anns.filter(a=>!(a.dismissed||[]).includes(user?.id)).length;
  const myTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id)).length;
  const unreadDMs=dms.filter(d=>d.to===user?.id&&!d.read).length;
  const totalBadge=myTasks+myAnns+unreadDMs;

  const items=[
    {key:"home",        icon:E("🏠","⌂"), label:"Home"},
    {key:"tasks",       icon:E("✅","✓"), label:"Tasks",         badge:myTasks,   perm:"tasks"},
    {key:"inv",         icon:E("📦","□"), label:"Inventory",      perm:"inv"},
    {key:"anns",        icon:E("🔔","○"), label:"Announcements",  badge:myAnns,    perm:"ann"},
    {key:"dms",         icon:E("💬","≡"), label:"Messages",       badge:unreadDMs, perm:"dms"},
    {key:"leaderboard", icon:E("🏆","◆"), label:"Leaderboard",   perm:"leaderboard"},
    {key:"shop",        icon:E("🛍","◇"), label:"XP Shop",        shop:true},
    {key:"act",         icon:E("📊","▦"), label:"Activity",       perm:"act"},
    {key:"schedule",    icon:E("📅","◷"), label:"Schedule"},
    {key:"set",         icon:E("⚙️","◎"), label:"Settings"},
    {key:"finn",        icon:"finn",label:"Ask Finn",      finn:true},
  ].filter(i=>!i.perm||can(user,i.perm))
  ;

  // Close on outside click
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const go=(key,finn,shop)=>{if(finn){onFinn();setOpen(false);playSound("open");}else if(shop){onShop&&onShop();setOpen(false);playSound("open");}else{setPage(key);setOpen(false);playSound("click");}};

  return (
    <div ref={ref} style={{position:"relative"}}>
      {/* Circle nav button */}
      <button onClick={()=>{setOpen(o=>!o);playSound("open");}}
        title="Navigation Menu" data-tour="nav-button"
        className="nav-circle-btn"
        style={{width:48,height:48,borderRadius:"50%",background:open?T.scarlet:T.surf,border:`${T.minimal?"1.5px":"2px"} solid ${open?T.scarlet:T.bor}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4,padding:0,transition:"all .2s",boxShadow:open?"0 4px 20px "+T.accent+"55":"0 2px 10px rgba(0,0,0,.14)",position:"relative",flexShrink:0,touchAction:"manipulation"}}
        onMouseEnter={e=>{if(!open){e.currentTarget.style.background=T.accent+"18";e.currentTarget.style.borderColor=T.scarlet+"88";e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.18)";}}}
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
        <div style={{position:"fixed",top:116,left:10,background:T.surf,border:`1px solid ${T.bor}`,borderRadius:16,padding:"6px 6px 10px",minWidth:248,zIndex:500,boxShadow:`0 16px 48px rgba(0,0,0,.22),0 2px 0 ${T.scarlet}18`,animation:"fadeUp .18s cubic-bezier(.23,1,.32,1) both",maxHeight:"calc(100vh - 130px)",overflowY:"auto"}}>
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
              <button key={item.key} onClick={()=>go(item.key,item.finn,item.shop)}
                style={{width:"100%",background:active?T.accent+"18":"transparent",color:active?T.accent:T.sub,border:"none",borderRadius:12,padding:"13px 16px",fontWeight:700,fontSize:16,fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderLeft:active?`4px solid ${T.scarlet}`:"4px solid transparent",transition:"all .15s",animation:`slideRight .18s ${i*25}ms ease both`}}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background=T.surfH;e.currentTarget.style.color=T.txt;}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.sub;}}}
              >
                {item.finn?(
                  <svg width="22" height="22" viewBox="0 0 22 22" style={{flexShrink:0}}>
                    <rect width="22" height="22" rx="6" fill="#0f2744"/>
                    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2"/>
                    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.5"/>
                    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
                    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
                    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
                    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
                    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
                    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
                    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
                    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
                    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
                    <circle cx="11" cy="11" r="1" fill="#fff"/>
                  </svg>
                ):(
                  <span style={{fontSize:window._showEmojis===false?16:22,width:28,textAlign:"center",flexShrink:0,fontWeight:window._showEmojis===false?"700":"normal",color:active?T.accent:T.sub}}>{item.icon}</span>
                )}
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
  const [time,setTime]=useState(new Date());
  const [greet,setGreet]=useState("Hey");
  useEffect(()=>{
    const h=new Date().getHours();
    setGreet(h<12?"Good morning":h<17?"Good afternoon":"Good evening");
    const i=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(i);
  },[]);
  const rc=ROLES[user.role];
  const timeStr=time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const dateStr=time.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  if(T.minimal) {
    // Animated minimal banner — breathing underline + color sweep + scan
    const [phase,setPhase]=useState(0);
    useEffect(()=>{const i=setInterval(()=>setPhase(p=>p+0.025),50);return()=>clearInterval(i);},[]);
    const lineW=48+Math.sin(phase)*16; // breathing underline width 32–64px
    const lineOpacity=0.4+Math.sin(phase*0.7)*0.25;

    // Color animation — cycle through red, blue, cyan
    const colorPhase = (phase * 0.3) % (Math.PI * 2);
    const gradAngle = (phase * 3) % 360;
    // Compute animated gradient color stops
    const c1 = `hsla(${(phase*20)%360}, 75%, ${T.dark?60:48}%, 0.08)`;
    const c2 = `hsla(${(phase*20+120)%360}, 75%, ${T.dark?60:48}%, 0.06)`;
    const c3 = `hsla(${(phase*20+240)%360}, 75%, ${T.dark?60:48}%, 0.08)`;

    return (
      <div className="fu" style={{borderRadius:16,marginBottom:20,background:T.surf,border:`1px solid ${T.bor}`,padding:"28px 28px 24px",position:"relative",overflow:"hidden"}}>
        {/* Animated color gradient background */}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(${gradAngle}deg, ${c1}, ${c2}, ${c3})`,transition:"none",pointerEvents:"none"}}/>
        {/* Floating color orbs — very subtle */}
        <div style={{position:"absolute",top:`${20+Math.sin(phase*0.5)*15}%`,left:`${75+Math.cos(phase*0.4)*10}%`,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,hsla(${(phase*15)%360},80%,${T.dark?60:50}%,0.12) 0%,transparent 70%)`,filter:"blur(20px)",pointerEvents:"none",transition:"none"}}/>
        <div style={{position:"absolute",top:`${60+Math.sin(phase*0.6+1)*12}%`,left:`${20+Math.cos(phase*0.5+2)*10}%`,width:90,height:90,borderRadius:"50%",background:`radial-gradient(circle,hsla(${(phase*15+180)%360},80%,${T.dark?60:50}%,0.10) 0%,transparent 70%)`,filter:"blur(18px)",pointerEvents:"none",transition:"none"}}/>
        {/* Animated scan line — very subtle */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"1px",background:`linear-gradient(90deg,transparent,${T.scarlet}${T.dark?"66":"33"},transparent)`,transform:`translateX(${(Math.sin(phase*0.4)*50)+25}%)`,transition:"none",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",position:"relative",zIndex:2}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:11,fontWeight:500,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{dateStr}</div>
            <div style={{fontSize:28,fontWeight:400,color:T.txt,lineHeight:1.1,marginBottom:6,letterSpacing:"-0.5px"}}>
              {greet},
            </div>
            <div style={{fontSize:28,fontWeight:700,color:T.txt,lineHeight:1.1,marginBottom:4,letterSpacing:"-0.5px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{user.name}<UserBadges badgeIds={equippedBadges} size={20} gap={4}/></div>
            {/* Breathing animated underline */}
            <div style={{width:lineW,height:2,background:`linear-gradient(90deg, hsl(${(phase*25)%360},80%,55%), hsl(${(phase*25+120)%360},80%,55%))`,borderRadius:9999,opacity:lineOpacity,marginBottom:18,transition:"none"}}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={onProfileClick} style={{background:"none",border:`1.5px solid ${T.bor}`,borderRadius:9999,padding:"5px 16px",fontSize:12,fontWeight:500,color:T.sub,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.scarlet;e.currentTarget.style.color=T.scarlet;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}
              >{rc?.label}</button>
              <button onClick={onProfileClick} style={{background:"none",border:`1.5px solid ${T.bor}`,borderRadius:9999,padding:"5px 14px",fontSize:12,fontWeight:500,color:T.sub,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.txt;e.currentTarget.style.color=T.txt;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}
              ><StatusDot status={user.status||"online"}/><span style={{textTransform:"capitalize"}}>{user.status||"online"}</span></button>
            </div>
          </div>
          {/* Clock — large, lightweight with color sweep */}
          <div style={{textAlign:"right",flexShrink:0,paddingTop:4}}>
            <div style={{fontSize:38,fontWeight:200,color:T.txt,letterSpacing:"-1px",fontVariantNumeric:"tabular-nums",lineHeight:1}}>{timeStr}</div>
            <div style={{fontSize:10,color:T.sub,marginTop:6,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Local time</div>
            {/* Color breathing dot indicator */}
            <div style={{width:6,height:6,borderRadius:"50%",background:`hsl(${(phase*25)%360},80%,55%)`,opacity:0.5+Math.sin(phase)*0.5,margin:"10px 0 0 auto",transition:"none",boxShadow:`0 0 8px hsl(${(phase*25)%360},80%,55%)`}}/>
          </div>
        </div>
      </div>
    );
  }
  // Original hero
  const orbs=[{size:120,x:78,baseY:15,speed:0.7,color:T.scarlet,opacity:0.12},{size:80,x:88,baseY:55,speed:1.1,color:T.blue,opacity:0.10},{size:60,x:5,baseY:20,speed:0.9,color:T.blue,opacity:0.08},{size:90,x:60,baseY:70,speed:0.6,color:T.scarlet,opacity:0.07},{size:50,x:40,baseY:5,speed:1.3,color:T.scarlet,opacity:0.06}];
  const [wavePhase,setWavePhase]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setWavePhase(w=>w+0.08),100);return()=>clearInterval(i);},[]);
  const W=800,H=40;
  const pts=Array.from({length:20},(_,i)=>{const x=i*(W/19);const y=H/2+Math.sin(wavePhase+i*0.5)*10+Math.sin(wavePhase*1.3+i*0.8)*6;return `${i===0?"M":"L"}${x},${y}`;}).join(" ");
  return (
    <div className="fu" style={{position:"relative",overflow:"hidden",borderRadius:20,marginBottom:20,minHeight:160,background:T.dark?`linear-gradient(145deg,#200810 0%,#0e0508 40%,#060d1a 100%)`:`linear-gradient(145deg,#fff0f0 0%,#fff5f5 40%,#f0f4ff 100%)`,border:`1px solid ${T.bor}`,boxShadow:`0 8px 40px ${T.scarlet}20,0 2px 0 ${T.scarlet}40 inset`}}>
      {orbs.map((o,i)=>(<div key={i} style={{position:"absolute",left:`${o.x}%`,top:`${o.baseY+Math.sin(wavePhase*o.speed+i)*14}%`,width:o.size,height:o.size,borderRadius:"50%",background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`,opacity:o.opacity,transform:"translate(-50%,-50%)",pointerEvents:"none",filter:"blur(8px)"}}/>))}
      <div style={{position:"absolute",inset:0,background:`linear-gradient(110deg,transparent 20%,${T.scarlet}08 45%,${T.blue}06 55%,transparent 80%)`,animation:"shimmer 5s ease-in-out infinite",backgroundSize:"300% 100%",pointerEvents:"none"}}/>
      <svg style={{position:"absolute",bottom:0,left:0,right:0,width:"100%",height:40,pointerEvents:"none",opacity:0.18}} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><path d={pts} stroke={T.scarlet} strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
      <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${T.scarlet},${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 4s linear infinite",borderRadius:"20px 20px 0 0"}}/>
      <div style={{position:"relative",zIndex:2,padding:"26px 26px 22px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:28,fontWeight:800,color:T.txt,lineHeight:1.1,marginBottom:6,letterSpacing:"-0.5px"}}>{greet}, <span style={{color:T.scarlet,textShadow:`0 0 20px ${T.scarlet}50`}}>{user.name}!</span></div>
            <div style={{color:T.sub,fontSize:13,marginBottom:12}}>{dateStr}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <button onClick={onProfileClick} style={{background:rc?.color+"28",border:`1px solid ${rc?.color}55`,borderRadius:8,padding:"4px 14px",fontWeight:700,fontSize:12,color:rc?.color,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{rc?.label} ⚙️</button>
              <button onClick={onProfileClick} style={{display:"flex",alignItems:"center",gap:6,background:T.dark?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.65)",backdropFilter:"blur(6px)",borderRadius:8,padding:"4px 12px",border:`1px solid ${T.bor}`,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}><StatusDot status={user.status||"online"}/><span style={{fontSize:12,color:T.sub,textTransform:"capitalize",fontWeight:600}}>{user.status||"online"}</span></button>
            </div>
          </div>
          <div style={{background:T.dark?"rgba(0,0,0,0.5)":"rgba(255,255,255,0.75)",backdropFilter:"blur(12px)",border:`1px solid ${T.bor}`,borderRadius:16,padding:"14px 20px",textAlign:"center",flexShrink:0}}>
            <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:26,fontWeight:800,color:T.scarlet,letterSpacing:"0.04em",textShadow:`0 0 16px ${T.scarlet}40`}}>{timeStr}</div>
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.08em",marginTop:3}}>LIVE CLOCK</div>
          </div>
        </div>
      </div>
    </div>
  );
}


function HomePage({user,tasks,anns,emps,dms,T,setPage,toast,progress,prevPage,setPrevPage,isOffline,scheduleUrl,onShop,equippedBadges,nameColorId}) {
  const myTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user.id));
  const doneTasks=tasks.filter(t=>t.done&&t.createdBy===user.id||tasks.filter(tt=>tt.done&&(tt.assignedTo===user.id||tt.assignedTo==="all")).includes(t));
  const overdueTasks=myTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
  const myAnns=anns.filter(a=>!(a.dismissed||[]).includes(user.id));
  const onlineEmps=emps.filter(e=>e.status==="online"&&e.id!==user.id);
  const unreadDMs=dms.filter(d=>d.to===user.id&&!d.read).length;

  const quickStats=[
    {icon:E("✅","✓"),label:"Open Tasks",val:myTasks.length,color:T.blue,page:"tasks"},
    {icon:E("🔔","○"),label:"Announcements",val:myAnns.length,color:T.scarlet,page:"anns"},
    {icon:E("💬","≡"),label:"Unread DMs",val:unreadDMs,color:"#7c3aed",page:"dms"},
    {icon:E("⚠️","△"),label:"Overdue",val:overdueTasks.length,color:T.err,page:"tasks"},
    ...(scheduleUrl?[{icon:E("📅","◷"),label:"Schedule",val:"View",color:"#16a34a",page:"schedule"}]:[]),
  ];

  const myProgress=progress[user.id]||{xp:0,level:1,title:"Pioneer",streak:0};
  const lvInfo=getLevelInfo(myProgress.xp);
  const isEligible=XP_ELIGIBLE_ROLES.includes(user.role);

  return (
    <div>
      {/* Animated Hero Banner */}
      <HeroBanner user={user} T={T} onProfileClick={()=>{setPage("set");setSettingsTab("profile");playSound("click");}}/>

      {/* Progression Card — only for eligible roles */}
      {isEligible&&(
        <div className="fu" style={{background:T.card,border:`2px solid ${lvInfo.color}44`,borderRadius:16,padding:16,marginBottom:16,animation:"fadeUp .3s ease both",position:"relative",overflow:"hidden"}}>
          {/* Glow background */}
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 10% 50%,${lvInfo.color}18 0%,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            {/* Level badge with custom logo */}
            <LevelLogo level={lvInfo.level} color={lvInfo.color} size={56}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:800,color:lvInfo.color}}>{lvInfo.title}</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span>
                {myProgress.streak>0&&(
                  <div style={{display:"flex",alignItems:"center",gap:4,background:"#ff6b0022",border:"1px solid #ff6b0044",borderRadius:20,padding:"2px 8px"}}>
                    <span style={{fontSize:12}}>{E("🔥","")}</span>
                    <span style={{fontSize:11,fontWeight:800,color:"#ff6b00"}}>{myProgress.streak} day streak</span>
                  </div>
                )}
              </div>
              <div style={{fontSize:11,color:T.sub,marginTop:2}}>{myProgress.xp} XP total{lvInfo.next?` · ${lvInfo.xpToNext} XP to ${lvInfo.next.title}`:` · Max level!`}</div>
              {/* XP progress bar */}
              <div style={{marginTop:8,height:6,background:T.bor,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${lvInfo.pct}%`,background:`linear-gradient(90deg,${lvInfo.color}88,${lvInfo.color})`,borderRadius:3,transition:"width .6s cubic-bezier(.23,1,.32,1)"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:10,color:T.faint}}>
                <span>{lvInfo.pct}% to next level</span>
                {lvInfo.next&&<span>{lvInfo.next.title}</span>}
              </div>
              {/* Shop button */}
              <button onClick={()=>{playSound("open");onShop&&onShop();}}
                style={{marginTop:10,width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:T.minimal?9999:10,padding:"9px 14px",fontSize:12,fontWeight:T.minimal?500:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"opacity .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >
                <span style={{fontSize:14}}>{E("🛍","◇")}</span> Spend {myProgress.xp} XP in the Shop
              </button>
            </div>
          </div>
        </div>
      )}

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



      {/* Staff Levels — visible to boss only */}
      {can(user,"boss")&&XP_ELIGIBLE_ROLES.some(r=>emps.find(e=>e.role===r))&&(
        <div className="fu card" style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginTop:14}}>
          <div style={{fontWeight:800,fontSize:14,color:T.txt,marginBottom:12,fontFamily:"'Clash Display',sans-serif",display:"flex",alignItems:"center",gap:8}}>{E("🏆","")} Staff Progression <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span></div>
          <div style={{display:"grid",gap:8}}>
            {emps.filter(e=>XP_ELIGIBLE_ROLES.includes(e.role)).sort((a,b)=>(progress[b.id]?.xp||0)-(progress[a.id]?.xp||0)).map((e,i)=>{
              const pg=progress[e.id]||{xp:0,level:1,title:"Pioneer",streak:0};
              const lv=getLevelInfo(pg.xp);
              return (
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.bg,borderRadius:10,border:`1px solid ${lv.color}33`}}>
                  <div style={{width:24,height:24,borderRadius:6,background:`${lv.color}22`,border:`1.5px solid ${lv.color}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:800,color:lv.color}}>{lv.level}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.txt}}>{e.name}</span>
                      <span style={{fontSize:11,fontWeight:700,color:lv.color}}>{lv.title}</span>
                      {pg.streak>0&&<span style={{fontSize:11}}>🔥{pg.streak}</span>}
                    </div>
                    <div style={{height:4,background:T.bor,borderRadius:2,marginTop:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${lv.pct}%`,background:lv.color,borderRadius:2}}/>
                    </div>
                  </div>
                  <span style={{fontSize:11,color:T.sub,flexShrink:0}}>{pg.xp} XP</span>
                  <span style={{fontSize:10,color:T.faint,flexShrink:0}}>#{i+1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently viewed */}
      {prevPage&&prevPage!=="home"&&(
        <div className="fu" style={{marginTop:14,animation:"fadeUp .25s ease both"}}>
          <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>RECENTLY VIEWED <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span></div>
          <button onClick={()=>{setPrevPage(null);setPage(prevPage);playSound("click");}}
            style={{display:"flex",alignItems:"center",gap:8,background:T.card,border:`1px solid ${T.bor}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",width:"100%",textAlign:"left"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"66";e.currentTarget.style.background=T.surfH;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.background=T.card;}}
          >
            <span style={{fontSize:16}}>{({"tasks":"✅","inv":"📦","anns":"🔔","dms":"💬","act":"📊","set":"⚙️"})[prevPage]||"📄"}</span>
            <span style={{fontSize:13,fontWeight:600,color:T.txt}}>{({"tasks":"Tasks","inv":"Inventory","anns":"Announcements","dms":"Messages","act":"Activity","set":"Settings"})[prevPage]||prevPage}</span>
            <span style={{fontSize:11,color:T.sub,marginLeft:"auto"}}>← Back</span>
          </button>
        </div>
      )}

      {/* Employee of the Month */}
      {can(user,"boss")&&(()=>{
        const eligible=emps.filter(e=>XP_ELIGIBLE_ROLES.includes(e.role));
        const eotm=eligible.map(e=>({...e,xp:(progress[e.id]||{}).xp||0})).sort((a,b)=>b.xp-a.xp)[0];
        if(!eotm) return null;
        const lv=getLevelInfo(eotm.xp);
        return (
          <div className="fu" style={{background:`linear-gradient(135deg,${lv.color}18,${lv.color}08)`,border:`1px solid ${lv.color}44`,borderRadius:14,padding:14,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>⭐</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:800,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase"}}>Employee of the Month</div>
              <div style={{fontWeight:800,fontSize:15,color:T.txt,marginTop:2}}>{eotm.name} <span style={{color:lv.color,fontSize:13}}>· {lv.title}</span></div>
              <div style={{fontSize:12,color:T.sub,marginTop:1}}>{eotm.xp} XP · Level {lv.level}</div>
            </div>
            <LevelLogo level={lv.level} color={lv.color} size={44}/>
          </div>
        );
      })()}

      {/* Online team (boss/manager only) */}
      {can(user,"online")&&onlineEmps.length>0&&(
        <div className="fu card" style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginTop:14}}>
          <div style={{fontWeight:800,fontSize:14,color:T.txt,marginBottom:10,fontFamily:"'Clash Display',sans-serif"}}>🟢 Online Now ({onlineEmps.length})</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {onlineEmps.map(e=>(
              <div key={e.id} onClick={()=>{playSound("click");setViewingProfile&&setViewingProfile(e);}} style={{display:"flex",alignItems:"center",gap:5,background:T.surfH,borderRadius:20,padding:"5px 12px",cursor:"pointer",transition:"background .15s"}}
                onMouseEnter={el=>el.currentTarget.style.background=T.bor}
                onMouseLeave={el=>el.currentTarget.style.background=T.surfH}>
                <StatusDot status={e.status}/>
                {(()=>{
                  const granted=JSON.parse(e.badge_grants||"[]");
                  const equipped=JSON.parse(e.equipped_badges||"[]");
                  const grantedBadges=[...new Set([...granted,...equipped])].slice(0,3);
                  const isCreator=grantedBadges.includes("creator")||granted.includes("creator");
                  const onlinNameColor=(e.name_color||"base")==="name_color"?T.accent:T.txt;
                  return <>
                    {isCreator
                      ?<CreatorName name={e.name.split(" ")[0]} size={12}/>
                      :<span style={{fontSize:12,fontWeight:600,color:onlinNameColor}}>{e.name.split(" ")[0]}</span>}
                    {grantedBadges.length>0&&<UserBadges badgeIds={grantedBadges} size={13} gap={2}/>}
                  </>;
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart reminders */}
      {isEligible&&overdueTasks.length>0&&(
        <div className="fu" style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:14,padding:"12px 16px",marginTop:14,display:"flex",gap:10,alignItems:"center",animation:"fadeUp .3s ease both"}}>
          <span style={{fontSize:20,flexShrink:0}}>{E("⚠️","!")}</span>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:"#991b1b"}}>You have {overdueTasks.length} overdue task{overdueTasks.length>1?"s":""}{"!"}</div>
            <div style={{fontSize:12,color:"#b91c1c",marginTop:2}}>{overdueTasks.slice(0,2).map(t=>t.title).join(", ")}{overdueTasks.length>2?` +${overdueTasks.length-2} more`:""}</div>
          </div>
          <button onClick={()=>setPage("tasks")} style={{marginLeft:"auto",background:"#991b1b",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>View</button>
        </div>
      )}
      {isEligible&&myTasks.length>0&&overdueTasks.length===0&&(
        <div className="fu" style={{background:`${T.blue}10`,border:`1px solid ${T.blue}33`,borderRadius:14,padding:"12px 16px",marginTop:14,display:"flex",gap:10,alignItems:"center",animation:"fadeUp .3s .1s ease both"}}>
          <span style={{fontSize:20,flexShrink:0}}>{E("💡","i")}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:T.txt,display:"flex",alignItems:"center",gap:6}}>You have {myTasks.length} open task{myTasks.length>1?"s":""}. Keep it up{"!"} <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span></div>
            <div style={{fontSize:12,color:T.sub,marginTop:2,display:"flex",alignItems:"center",gap:6}}>Next: {myTasks[0]?.title} <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span></div>
          </div>
          <button onClick={()=>setPage("tasks")} style={{background:T.blue,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Go</button>
        </div>
      )}

      {/* Help section */}
      <div className="fu" style={{background:T.minimal?T.surf:`${T.blue}12`,border:`1px solid ${T.minimal?T.bor:T.blue+"33"}`,borderRadius:T.minimal?16:14,padding:T.minimal?20:16,marginTop:14}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
          <span style={{fontSize:T.minimal?20:24,flexShrink:0}}>{E("❓","?")}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:T.minimal?600:800,fontSize:T.minimal?15:14,color:T.txt,marginBottom:6,letterSpacing:T.minimal?"-0.2px":"normal"}}>Need help navigating?</div>
            <div style={{fontSize:13,color:T.sub,lineHeight:1.65}}>
              Tap the <strong style={{color:T.txt}}>circle button</strong> (top-left) to open the menu.<br/>
              Tap <strong style={{color:T.txt}}>MNU{"'"}s Neer Locker</strong> in the header to return home.<br/>
              Ask <strong style={{color:T.accent}}>Finn</strong> (bottom-right robot button) for help with anything.<br/>
              Tap the <strong style={{color:T.accent}}>?</strong> button for a full guide · tap <strong style={{color:"#b45309"}}>{E("💡","i")}</strong> to send feedback.
            </div>
          </div>
        </div>
        <div style={{padding:"12px 14px",background:T.minimal?T.surfH:`${T.blue}10`,border:`1px solid ${T.minimal?T.bor:T.blue+"33"}`,borderRadius:T.minimal?12:12}}>
          <div style={{fontWeight:T.minimal?600:700,fontSize:13,color:T.txt,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>{E("📲","↗")} Add to home screen</div>
          <div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>
            <strong style={{color:T.txt}}>iPhone:</strong> Open in Safari → Share → <strong>Add to Home Screen</strong><br/>
            <strong style={{color:T.txt}}>Android:</strong> Open in Chrome → ⋮ menu → <strong>Add to Home Screen</strong>
          </div>
        </div>
        <button onClick={()=>{playSound("open");window._startOnboarding&&window._startOnboarding();}}
          style={{marginTop:12,width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:T.minimal?9999:12,padding:T.minimal?"10px 20px":"12px 20px",fontWeight:T.minimal?500:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"opacity .15s",letterSpacing:T.minimal?"0.01em":"normal"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
        >{E("✨","→")} Start guided tour</button>
      </div>
    </div>
  );
}

// ─── DM SECTION ───────────────────────────────────────────────────────────────
function DMSection({user,emps,dms,setDms,T,toast,onXP}) {
  const [selected,setSelected]=useState(null);
  const [msgInput,setMsgInput]=useState("");
  const msgEndRef=useRef(null);
  const inputRef=useRef(null);
  const [isTyping,setIsTyping]=useState(false);
  const typingTimer=useRef(null);

  // saveDMs — now handled by saveDms useCallback below
  const otherEmps=emps.filter(e=>e.id!==user.id);
  const GROUP_ID="__group__";
  const GROUP_NAME="Team Chat";
  const getGroupThread=()=>dms.filter(d=>d.to===GROUP_ID||d.from===GROUP_ID||(d.group===true)).sort((a,b)=>a.at-b.at);
  const unreadGroup=dms.filter(d=>d.to===GROUP_ID&&!d.read&&d.from!==user.id).length;
  const getThread=(otherId)=>{
    if(otherId===GROUP_ID) return getGroupThread();
    return dms.filter(d=>{
      const regular=(d.from===user.id&&d.to===otherId)||(d.from===otherId&&d.to===user.id);
      const systemInThread=d.system&&d.to===user.id&&d.threadWith===otherId;
      return regular||systemInThread;
    }).sort((a,b)=>a.at-b.at);
  };
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
    const isGroup=selected.id===GROUP_ID;
    const newMsg={id:uid(),from:user.id,to:isGroup?GROUP_ID:selected.id,text:san(text),at:Date.now(),read:false,group:isGroup};
    playSound("dm"); haptic("light");
    if(onXP) onXP();
    const updated=dms.map(d=>d.from===selected.id&&d.to===user.id?{...d,read:true}:d);
    const next=[...updated,newMsg];
    setDms(next);
    await SB.upsert("direct_messages",{
      id:newMsg.id,
      from_id:newMsg.from,
      to_id:newMsg.to,
      text:newMsg.text,
      at:newMsg.at,
      read:false,
      system:false,
      thread_with:isGroup?GROUP_ID:selected.id,
      feedback:false,
      group:isGroup
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
          {/* Group Chat */}
          <div onClick={()=>{setSelected({id:GROUP_ID,name:GROUP_NAME,email:"team",role:"group"});}}
            style={{padding:"12px 14px",cursor:"pointer",background:selected?.id===GROUP_ID?T.accent+"18":"transparent",borderBottom:`1px solid ${T.bor}`,borderLeft:selected?.id===GROUP_ID?`3px solid ${T.scarlet}`:"3px solid transparent",transition:"background .18s"}}
            onMouseEnter={ev=>{if(selected?.id!==GROUP_ID)ev.currentTarget.style.background=T.surfH;}}
            onMouseLeave={ev=>{if(selected?.id!==GROUP_ID)ev.currentTarget.style.background="transparent";}}
          >
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:`${T.scarlet}22`,border:`2px solid ${T.scarlet}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💬</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:700,color:T.txt}}>{GROUP_NAME}</span>
                  {unreadGroup>0&&<span style={{background:T.scarlet,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:800}}>{unreadGroup}</span>}
                </div>
                <div style={{fontSize:12,color:T.sub,marginTop:2}}>All {emps.length} members</div>
              </div>
            </div>
          </div>
          {otherEmps.map(e=>{
            const unread=unreadFrom(e.id);
            const thread=getThread(e.id);
            const last=thread[thread.length-1];
            return (
              <div key={e.id} onClick={()=>selectConvo(e)}
                style={{padding:"12px 14px",cursor:"pointer",background:selected?.id===e.id?T.accent+"18":"transparent",borderBottom:`1px solid ${T.bor}`,transition:"background .18s",borderLeft:selected?.id===e.id?`3px solid ${T.scarlet}`:"3px solid transparent"}}
                onMouseEnter={ev=>{if(selected?.id!==e.id)ev.currentTarget.style.background=T.surfH;}}
                onMouseLeave={ev=>{if(selected?.id!==e.id)ev.currentTarget.style.background="transparent";}}
              >
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <Avatar email={e.email} color={ROLES[e.role]?.color||T.mut} size={36} frame={e.equipped_frame}/>
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
                const senderEmp=!mine?emps.find(e=>e.id===msg.from):null;
                const isGroupChat=selected?.id===GROUP_ID;
                return (
                  <div key={msg.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",animation:`fadeUp .2s ${i*15}ms ease both`}}>
                    <div style={{maxWidth:"72%"}}>
                      {isGroupChat&&!mine&&senderEmp&&(
                        <div style={{fontSize:11,fontWeight:700,color:ROLES[senderEmp.role]?.color||T.sub,marginBottom:3,paddingLeft:4}}>{senderEmp.name}</div>
                      )}
                      <div style={{background:mine?(T.minimal?T.accent:T.scarlet):T.surfH,color:mine?"#fff":T.txt,borderRadius:mine?"18px 18px 5px 18px":"18px 18px 18px 5px",padding:"11px 16px",fontSize:15,fontWeight:500,lineHeight:1.6,boxShadow:"0 2px 8px rgba(0,0,0,.08)",wordBreak:"break-word",overflowWrap:"anywhere",maxHeight:320,overflowY:"auto"}}>
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
          {/* Typing indicator */}
          {isTyping&&(
            <div style={{padding:"4px 18px",fontSize:11,color:T.sub,display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",gap:3}}>
                {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.mut,animation:`pulse 1s ${i*200}ms ease-in-out infinite`}}/>)}
              </div>
              <span>typing…</span>
            </div>
          )}
          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.bor}`,display:"flex",gap:8,flexShrink:0,background:T.surfH,alignItems:"center"}}>
            {/* Red back button — prominent, at left of send bar */}
            <button onClick={()=>setSelected(null)}
              style={{width:42,height:42,borderRadius:"50%",background:"#dc2626",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",flexShrink:0,boxShadow:"0 3px 10px rgba(220,38,38,.4)",transition:"all .15s",fontFamily:"inherit"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#b91c1c";e.currentTarget.style.transform="scale(1.08)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.transform="scale(1)";}}
              title="Back to all messages"
            >←</button>
            <input ref={inputRef} value={msgInput} onChange={e=>{setMsgInput(e.target.value);setIsTyping(true);clearTimeout(typingTimer.current);typingTimer.current=setTimeout(()=>setIsTyping(false),1500);}} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} placeholder="Type a message… (Enter to send)"
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
  const [swipeX,setSwipeX]=useState(0);
  const [swiping,setSwiping]=useState(false);
  const swipeStart=useRef(null);
  const [showCtx,setShowCtx]=useState(false);
  const longPressRef=useRef(null);
  const handleLongPress=()=>{ haptic("medium"); setShowCtx(true); };
  const startLongPress=(e)=>{ longPressRef.current=setTimeout(handleLongPress,500); };
  const cancelLongPress=()=>{ clearTimeout(longPressRef.current); };

  const handleSwipeStart=(e)=>{ swipeStart.current=e.touches[0].clientX; setSwiping(false); };
  const handleSwipeMove=(e)=>{
    if(swipeStart.current===null) return;
    const dx=e.touches[0].clientX-swipeStart.current;
    if(Math.abs(dx)>8){ setSwiping(true); setSwipeX(Math.max(-80,Math.min(80,dx))); }
  };
  const handleSwipeEnd=()=>{
    if(swipeX>50&&!isDone){ onToggle(task.id); }
    else if(swipeX<-50&&canManage){ onDelete(task.id); }
    setSwipeX(0); setSwiping(false); swipeStart.current=null;
  };
  const assignee=task.assignedTo==="all"?null:emps.find(e=>e.id===task.assignedTo);
  const creator=emps.find(e=>e.id===task.createdBy);
  const overdue=task.dueDate&&!task.done&&new Date(task.dueDate)<new Date();
  const pc={Low:T.mut,Medium:T.blue,High:T.scarlet};
  const dl=daysLeft(task.dueDate);
  const _anim="fadeUp .25s "+(delay||0)+"ms ease both";
  const _sw={transform:"translateX("+swipeX+"px)",transition:swiping?"none":"transform .25s cubic-bezier(.23,1,.32,1)"};
  return (
    <>
      {showCtx&&(
        <div onClick={()=>setShowCtx(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:T.surf,borderRadius:16,padding:8,minWidth:200,boxShadow:"0 12px 40px rgba(0,0,0,.25)"}}>
            <div style={{padding:"8px 14px",fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em"}}>{task.title.slice(0,30)}</div>
            {!isDone&&<button onClick={()=>{setShowCtx(false);onToggle(task.id);}} style={{width:"100%",padding:"12px 14px",background:"none",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,color:T.ok,textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>✅ Mark Complete</button>}
            {isDone&&<button onClick={()=>{setShowCtx(false);onToggle(task.id);}} style={{width:"100%",padding:"12px 14px",background:"none",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,color:T.sub,textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>↩ Mark Incomplete</button>}
            <button onClick={()=>{setShowCtx(false);setExpanded(e=>!e);}} style={{width:"100%",padding:"12px 14px",background:"none",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,color:T.txt,textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>📋 {expanded?"Hide":"View"} Details</button>
            {canManage&&<button onClick={()=>{setShowCtx(false);onDelete(task.id);}} style={{width:"100%",padding:"12px 14px",background:"none",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,color:T.err,textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>🗑️ Delete Task</button>}
          </div>
        </div>
      )}
      <div style={{position:"relative",overflow:"hidden",animation:_anim}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"space-between",pointerEvents:"none"}}>
          <div style={{background:"#16a34a",width:70,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",opacity:swipeX>20?Math.min((swipeX-20)/30,1):0,transition:swiping?"none":"opacity .2s",borderRadius:"16px 0 0 16px"}}>
            <span style={{fontSize:22,color:"#fff"}}>✓</span>
          </div>
          {canManage&&(
            <div style={{background:T.err,width:70,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",opacity:swipeX<-20?Math.min((-swipeX-20)/30,1):0,transition:swiping?"none":"opacity .2s",borderRadius:"0 16px 16px 0"}}>
              <span style={{fontSize:22,color:"#fff"}}>🗑</span>
            </div>
          )}
        </div>
        <div style={_sw}>
          <div className="card"
            onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
            onTouchStart={startLongPress} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress}
            onContextMenu={e=>{e.preventDefault();setShowCtx(true);}}
            style={{background:isDone?T.bg:T.card,border:"1px solid "+(expanded?T.accent+"66":overdue?T.accent+"55":hov?T.borH:T.bor),borderRadius:14,opacity:isDone?0.55:1,overflow:"hidden",transition:"border-color .2s"}}>
            <div style={{padding:T.compact?"10px 14px":"13px 16px",display:"flex",alignItems:"flex-start",gap:12}}>
              <button onClick={e=>{e.stopPropagation();onToggle(task.id);}}
                style={{width:22,height:22,borderRadius:6,border:"2px solid "+(isDone?T.blue:hov?T.blue:T.bor),background:isDone?T.blue:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:900,fontFamily:"inherit",transition:"all .18s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              >{isDone?"✓":""}</button>
              <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:T.fs.lg,textDecoration:isDone?"line-through":"none",color:isDone?T.mut:T.txt,transition:"color .18s"}}>{task.title}</span>
                  <Tag label={task.priority} color={pc[task.priority]||T.mut}/>
                  {overdue&&<Tag label="OVERDUE" color={T.accent}/>}
                  {task.repeat&&<Tag label={E("🔁","↻")} color={T.blue}/>}
                </div>
                {isDone&&task.doneByName&&(
                  <div style={{fontSize:11,color:T.sub,fontWeight:500,marginTop:4,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{color:T.ok,fontWeight:700}}>{E("✅","✓")}</span>
                    <span>Completed by <strong style={{color:T.txt,fontWeight:700}}>{task.doneByName}</strong></span>
                    {task.doneAt&&<span style={{color:T.mut,fontSize:10}}>· {new Date(task.doneAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})} at {new Date(task.doneAt).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>}
                  </div>
                )}
                <div style={{display:"flex",gap:10,marginTop:4,fontSize:11,color:T.mut,flexWrap:"wrap",alignItems:"center"}}>
                  <span>👤 {assignee?assignee.name:"Everyone"}</span>
                  {task.dueDate&&<span style={{color:overdue?T.scarlet:dl!==null&&dl<=2?T.warn:T.mut}}>📅 {fmtD(task.dueDate)}</span>}
                </div>
              </div>
              <button onClick={()=>setExpanded(e=>!e)}
                style={{background:expanded?T.accent+"18":"none",border:"1px solid "+(expanded?T.accent+"55":T.bor),borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700,color:expanded?T.scarlet:T.sub,fontFamily:"inherit",flexShrink:0,transition:"all .15s"}}
              >{expanded?"▲":"▼"}</button>
              {canManage&&<button onClick={e=>{e.stopPropagation();onDelete(task.id);}}
                style={{background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:16,padding:"2px 4px",transition:"color .15s",flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.color=T.scarlet}
                onMouseLeave={e=>e.currentTarget.style.color=T.faint}
              >✕</button>}
            </div>
            {expanded&&(
              <div style={{borderTop:"1px solid "+T.bor,padding:"12px 16px",background:T.bg,display:"grid",gap:10}}>
                {task.description&&(
                  <div style={{fontSize:13,color:T.txt,lineHeight:1.6,background:T.surf,borderRadius:10,padding:"10px 14px",border:"1px solid "+T.bor}}>{task.description}</div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:"1px solid "+T.bor}}>
                    <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>ASSIGNED TO</div>
                    <div style={{fontSize:13,fontWeight:600,color:T.txt}}>👤 {assignee?assignee.name:"Everyone"}</div>
                  </div>
                  <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:"1px solid "+T.bor}}>
                    <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>PRIORITY</div>
                    <div style={{fontSize:13,fontWeight:600,color:pc[task.priority]||T.mut}}>{task.priority||"Medium"}</div>
                  </div>
                  {task.dueDate&&(
                    <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:"1px solid "+(overdue?T.accent+"55":T.bor)}}>
                      <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>DUE DATE</div>
                      <div style={{fontSize:13,fontWeight:600,color:overdue?T.scarlet:T.txt}}>📅 {fmtD(task.dueDate)}</div>
                    </div>
                  )}
                  {creator&&(
                    <div style={{background:T.surf,borderRadius:10,padding:"10px 14px",border:"1px solid "+T.bor}}>
                      <div style={{fontSize:11,fontWeight:800,color:T.mut,letterSpacing:"0.06em",marginBottom:4}}>CREATED BY</div>
                      <div style={{fontSize:13,fontWeight:600,color:T.txt}}>{creator.name}</div>
                    </div>
                  )}
                </div>
                {task.repeat&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.blue,fontWeight:600}}>
                    🔁 Repeats automatically when completed
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({T,value,onChange,placeholder}) {
  const [f,setF]=useState(false);
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={"🔍  "+placeholder}
    style={{flex:1,minWidth:140,background:T.surf,border:"1px solid "+(f?T.blue:T.bor),borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:T.fs.md,fontFamily:"inherit",outline:"none",boxShadow:f?"0 0 0 3px "+T.bG:"none",transition:"border-color .18s,box-shadow .18s"}}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}

const SLabel=({children,dim,T})=><div style={{fontSize:10,fontWeight:800,letterSpacing:"0.07em",marginBottom:6,color:dim?T.faint:T.mut}}>{children}</div>;
const Empty=({icon,msg,T})=><div style={{textAlign:"center",padding:"44px 0",color:T.mut}}><div style={{fontSize:34}}>{icon}</div><div style={{marginTop:9,fontSize:13,fontWeight:600,color:T.sub}}>{msg}</div></div>;
const Hr=({T})=><div style={{height:1,background:T.bor,margin:T.sp.md+"px 0"}}/>;

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
              <div style={{height:"100%",width:val+"%",background:val>80?T.err:val>60?T.warn:color,borderRadius:2,transition:"width .6s"}}/>
    </div>
  );
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}} className="two-col">
      {[{label:"CPU Usage",val:cpu,color:T.blue,icon:"💻"},{label:"Memory",val:mem,color:"#7c3aed",icon:"🧠"},{label:"API Response",val:Math.round(ping/2),raw:`${ping}ms`,color:T.ok,icon:"📡"}].map(m=>(
          <div key={m.label} style={{background:T.card,border:"1px solid "+T.bor,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,color:T.sub,fontWeight:700}}>{m.icon} {m.label}</span>
              <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:800,color:m.val>80?T.err:m.val>60?T.warn:T.txt}}>{m.val}%</span>
          </div>
          {!m.raw&&<Bar val={m.val} color={m.color}/>}
        </div>
      ))}
    </div>
  );
}




// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = "BAGb6AhUiDuVvc-Gmpr5K_yDVZei06jPW3VnHf3A8C17EnN6rzzB6fvSohhT5esZBFl0dcKMpS2CxBYEJwkm18M";

const NOTIF = {
  supported: ()=>"Notification" in window && "serviceWorker" in navigator && "PushManager" in window,
  permission: ()=>Notification.permission,
  // Only allow in standalone PWA mode (installed to home screen)
  isPWA: ()=>window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true,

  b64urlToUint8(b64) {
    const pad = "=".repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from({length: raw.length}, (_, i) => raw.charCodeAt(i));
  },

  async register() {
    if(!NOTIF.supported()) return null;
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js", {scope:"/"});
      await navigator.serviceWorker.ready;
      return reg;
    } catch(e) { console.warn("SW register failed:", e); return null; }
  },

  async subscribe(userId) {
    if(!NOTIF.supported()) return null;
    try {
      const reg = await NOTIF.register();
      if(!reg) return null;
      const permission = await Notification.requestPermission();
      if(permission !== "granted") return null;
      // Always unsubscribe first to force a fresh subscription for this user
      const existing = await reg.pushManager.getSubscription();
      if(existing) await existing.unsubscribe().catch(()=>{});
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: NOTIF.b64urlToUint8(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      // Save to Supabase — use userId as the key so there's only ever ONE row per user
      // First delete any existing subscriptions for this user
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}`,{method:"DELETE",headers:SB.headers}).catch(()=>{});
      await SB.upsert("push_subscriptions", {
        id: userId, // one row per user, always
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        created_at: Date.now(),
      });
      return sub;
    } catch(e) { console.warn("Push subscribe failed:", e); return null; }
  },

  async unsubscribe(userId) {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if(!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if(sub) {
        const json = sub.toJSON();
        const id = btoa(json.endpoint).slice(0,40).replace(/[^a-zA-Z0-9]/g,"");
        await SB.delete("push_subscriptions", {id});
        await sub.unsubscribe();
      }
    } catch(e) { console.warn("Unsubscribe failed:", e); }
  },

  // Global rate limit — no notification can fire twice within 5 seconds
  _recentFired: {},
  _canFire(key) {
    const now = Date.now();
    const last = NOTIF._recentFired[key] || 0;
    if(now - last < 3000) return false; // 3s window per exact key
    NOTIF._recentFired[key] = now;
    return true;
  },

  // Trigger server-side push (calls Vercel function)
  async send(userId, title, body, tag="neer-locker") {
    if(!NOTIF._canFire(userId+"|"+tag+"|"+title)) return;
    // Only fire if notification permission is actually granted
    if(NOTIF.permission()!=="granted") return;
    try {
      const r=await fetch("https://neer-locker.vercel.app/api/send-push", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({userId, title, body, tag}),
      });
      if(!r.ok) console.warn("[NOTIF] Push API returned",r.status);
    } catch(e) { console.warn("[NOTIF] Send push failed:", e); }
  },

  // Broadcast to all users (no userId filter)
  async broadcast(title, body, tag="neer-locker") {
    if(!NOTIF._canFire("broadcast|"+tag+"|"+title)) return;
    try {
      await fetch("https://neer-locker.vercel.app/api/send-push", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({title, body, tag}),
      });
    } catch(e) { console.warn("[NOTIF] Broadcast push failed:", e); }
  },
};


// ─── WEBAUTHN / PASSKEY HELPERS ──────────────────────────────────────────────
// ─── PROGRESSION SYSTEM ───────────────────────────────────────────────────────
const LEVELS = [
  {level:1,  title:"Pioneer",         xp:0,    color:"#94a3b8", glow:"#94a3b844"},
  {level:2,  title:"Trailblazer",     xp:100,  color:"#cd7f32", glow:"#cd7f3244"},
  {level:3,  title:"Pathfinder",      xp:300,  color:"#b87333", glow:"#b8733344"},
  {level:4,  title:"Scout",           xp:600,  color:"#0f52ba", glow:"#0f52ba44"},
  {level:5,  title:"Ranger",          xp:1000, color:"#50c878", glow:"#50c87844"},
  {level:6,  title:"Vanguard",        xp:1500, color:"#9b59b6", glow:"#9b59b644"},
  {level:7,  title:"Founder",         xp:2500, color:"#e0115f", glow:"#e0115f44"},
  {level:8,  title:"Elite",           xp:4000, color:"#ffc87c", glow:"#ffc87c44"},
  {level:9,  title:"Legend",          xp:6000, color:"#b9f2ff", glow:"#b9f2ff44"},
  {level:10, title:"Top Contributor", xp:10000,color:"#ffd700", glow:"#ffd70044"},
];

const getLevelInfo=(xp=0)=>{
  let info=LEVELS[0];
  for(const l of LEVELS){ if(xp>=l.xp) info=l; }
  const next=LEVELS.find(l=>l.xp>xp);
  const pct=next?Math.round(((xp-info.xp)/(next.xp-info.xp))*100):100;
  return{...info,next,pct,xpToNext:next?next.xp-xp:0};
};

const XP_ELIGIBLE_ROLES=["boss","manager","assistant","employee"];

const WA = {
  supported: ()=>window.PublicKeyCredential!==undefined,
  b64url: (buf)=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,""),
  b64decode: (str)=>Uint8Array.from(atob(str.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0)),
  permission: ()=>Notification.permission,
  async register(userId, userName, userEmail) {
    try {
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const cred=await navigator.credentials.create({publicKey:{
        challenge,
        rp:{name:"MNU Neer Locker",id:window.location.hostname},
        user:{id:new TextEncoder().encode(userId),name:userEmail,displayName:userName},
        pubKeyCredParams:[{alg:-7,type:"public-key"},{alg:-257,type:"public-key"}],
        authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"preferred"},
        timeout:60000,
      }});
      if(!cred) return null;
      return {credentialId:WA.b64url(cred.rawId),credentialType:cred.type};
    } catch(e){console.warn("WebAuthn register failed:",e.message);return null;}
  },
  async authenticate(credentialIdB64) {
    try {
      const challenge=crypto.getRandomValues(new Uint8Array(32));
      const allowCreds=credentialIdB64?[{id:WA.b64decode(credentialIdB64),type:"public-key",transports:["internal"]}]:[];
      const assertion=await navigator.credentials.get({publicKey:{
        challenge,rpId:window.location.hostname,userVerification:"required",allowCredentials:allowCreds,timeout:60000,
      }});
      return assertion?WA.b64url(assertion.rawId):null;
    } catch(e){console.warn("WebAuthn auth failed:",e.message);return null;}
  },
};

// ─── WELCOME PORTAL (first time only) ────────────────────────────────────────
function WelcomePortal({T, onDone}) {
  const [phase, setPhase] = useState(0);
  // Pure CSS animations — no JS tick loop so no fps drop

  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1), 200);
    const t2=setTimeout(()=>setPhase(2), 1000);
    const t3=setTimeout(()=>setPhase(3), 2000);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:99999,background:"#050d1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",overflow:"hidden"}}>
      {/* CSS animated background orbs — no JS */}
      <div style={{position:"absolute",top:"10%",left:"8%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,#C8102E 0%,transparent 70%)",opacity:0.07,filter:"blur(50px)",animation:"pulse 4s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"15%",right:"10%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,#1e7fa8 0%,transparent 70%)",opacity:0.07,filter:"blur(45px)",animation:"pulse 5s ease-in-out infinite",animationDelay:"1.5s",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,#7c3aed 0%,transparent 70%)",opacity:0.05,filter:"blur(40px)",transform:"translate(-50%,-50%)",animation:"pulse 6s ease-in-out infinite",animationDelay:"3s",pointerEvents:"none"}}/>

      {/* Expanding rings — CSS transition only */}
      {[0,1,2,3].map(i=>(
        <div key={i} style={{
          position:"absolute",top:"50%",left:"50%",
          width:phase>=1?`${300+i*160}px`:"0px",
          height:phase>=1?`${300+i*160}px`:"0px",
          transform:"translate(-50%,-50%)",
          borderRadius:"50%",
          border:`${i===0?1.5:1}px solid ${i%2===0?"#C8102E":"#1e7fa8"}${["55","44","33","22"][i]}`,
          animation:phase>=1?`pulse ${3+i*0.5}s ease-in-out infinite`:"none",
          animationDelay:`${i*0.4}s`,
          transition:`width ${0.9+i*0.12}s cubic-bezier(.23,1,.32,1) ${i*0.07}s, height ${0.9+i*0.12}s cubic-bezier(.23,1,.32,1) ${i*0.07}s`,
        }}/>
      ))}

      {/* Spinning hex logo — CSS animation */}
      <div style={{
        position:"relative",zIndex:2,
        animation:phase>=1?"finnHexSpin .7s cubic-bezier(.34,1.56,.64,1) both":"none",
        filter:phase>=1?"drop-shadow(0 0 12px #1e7fa866) drop-shadow(0 0 24px #C8102E33)":"none",
      }}>
        <svg width="76" height="76" viewBox="0 0 22 22">
          <rect width="22" height="22" rx="6" fill="#0f2744"/>
          <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2"/>
          <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.5"/>
          <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
          <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
          <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
          <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
          <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
          <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
          <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
          <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
          <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
          <circle cx="11" cy="11" r="1" fill="#fff"/>
        </svg>
      </div>

      {/* Text block */}
      <div style={{position:"relative",zIndex:2,textAlign:"center",marginTop:32,opacity:phase>=2?1:0,transform:phase>=2?"translateY(0)":"translateY(20px)",transition:"opacity .6s ease, transform .6s ease"}}>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:700,color:"#ffffff44",letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:10}}>Welcome to</div>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:30,fontWeight:800,color:"#fff",letterSpacing:"-0.5px",lineHeight:1.2}}>
          {"MNU's"} <span style={{color:"#C8102E",textShadow:"0 0 20px #C8102E66"}}>Neer Locker</span>
        </div>
        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:600,color:"#ffffff55",marginTop:8,letterSpacing:"0.08em"}}>Staff Portal</div>
        <div style={{marginTop:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#1e7fa8",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>
          <div style={{width:24,height:1,background:"#1e7fa855"}}/>
          Fusion Integrated Neural Navigator
          <div style={{width:24,height:1,background:"#1e7fa855"}}/>
        </div>
      </div>

      {/* Let's Go button */}
      <div style={{position:"relative",zIndex:2,marginTop:44,opacity:phase>=3?1:0,transform:phase>=3?"translateY(0)":"translateY(16px)",transition:"opacity .5s ease .1s, transform .5s ease .1s"}}>
        <button onClick={()=>{playSound("success");onDone();}}
          style={{background:"linear-gradient(135deg,#C8102E,#9e0b23)",color:"#fff",border:"none",borderRadius:14,padding:"15px 44px",fontFamily:"'Clash Display',sans-serif",fontWeight:800,fontSize:17,cursor:"pointer",letterSpacing:"0.03em",boxShadow:"0 6px 28px #C8102E55",transition:"transform .18s,box-shadow .18s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.06)";e.currentTarget.style.boxShadow="0 8px 36px #C8102E66";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 6px 28px #C8102E55";}}
        >{"Let's Go →"}</button>
        <div style={{textAlign:"center",marginTop:10,fontSize:11,color:"#ffffff33",fontWeight:500,letterSpacing:"0.06em"}}>Tap to enter</div>
      </div>

      {/* Scan line — CSS only */}
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)",pointerEvents:"none",zIndex:1}}/>
    </div>
  );
}

// ─── FINN AI CHAT ─────────────────────────────────────────────────────────────
function FinnChat({T,user,tasks,inv,anns,dms,emps,progress,act,onClose,setPage,toast,saveTask,saveInv,saveAnns,saveDms,uid,addAct,grantXP,saveStatus,applyTheme,dark,compact,upsertTask,dismissAnn,voiceOnGlobal,setVoiceOnGlobal}) {
  const nick=typeof localStorage!=="undefined"?localStorage.getItem("nl3-nickname")||user?.name?.split(" ")[0]:user?.name?.split(" ")[0];
  const setNick=(n)=>{ try{ localStorage.setItem("nl3-nickname",n); }catch(e){} };

  // ── Finn Memory: persistent facts across sessions ──────────────────────────
  const finnMemory={
    get:()=>{ try{ return JSON.parse(localStorage.getItem("nl3-finn-memory")||"{}"); }catch(e){return {};} },
    set:(key,val)=>{ try{ const m=finnMemory.get(); m[key]=val; m._updated=Date.now(); localStorage.setItem("nl3-finn-memory",JSON.stringify(m)); }catch(e){} },
    clear:()=>localStorage.removeItem("nl3-finn-memory"),
    all:()=>{ try{ const m=finnMemory.get(); return Object.entries(m).filter(([k])=>k!=="_updated").map(([k,v])=>k+": "+v).join(", "); }catch(e){return "";} },
  };

  // Preload voices so speakReply has no delay on first call
  useEffect(()=>{
    if(window.speechSynthesis){
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices();
    }
  },[]);


  // ── Stop speech only when FinnChat unmounts (mic stays if user wants) ──────
  useEffect(()=>{
    return ()=>{
      // Stop speaking when panel closes
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      setSpeaking(false);
      // Stop mic on close
      if(recognitionRef.current){
        try{ recognitionRef.current.stop(); }catch(_){}
        recognitionRef.current=null;
      }
      setListening(false);
    };
  },[]);
  const [useGroq,setUseGroq]=useState(LS.get("nl3-finn-mode")==="atlas"?false:true);

  const callGroqFinn=async(userMsg,history)=>{
    const context={user,tasks,inv,anns,emps,progress,dms,clientTime:Date.now(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,finnMemory:finnMemory.all()};
    const messages=[...history.filter(m=>m.role!=="assistant"||history.indexOf(m)>history.length-8).map(m=>({role:m.role,content:m.content})),{role:"user",content:userMsg}];
    const r=await fetch("https://neer-locker.vercel.app/api/finn",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages,context})
    });
    if(!r.ok) throw new Error("api_error_"+r.status);
    const d=await r.json();
    if(!d.reply) throw new Error("no_response");
    return d.reply;
  };

  const parseAndExecuteActions=async(reply)=>{
    // Parse action tags from Finn Aether reply and execute them
    let clean=reply;
    const navMatch=reply.match(/\[NAV:(\w+)\]/);
    if(navMatch){
      clean=clean.replace(navMatch[0],"").trim();
      const navPage=navMatch[1];
      // Only navigate when user explicitly asks — block auto-nav to home/act
      const blockedPages=["home","act","leaderboard"];
      if(!blockedPages.includes(navPage)) setTimeout(()=>setPage&&setPage(navPage),400);
    }
    const completeMatch=reply.match(/\[COMPLETE_TASK:([^\]]+)\]/);
    if(completeMatch){
      clean=clean.replace(completeMatch[0],"").trim();
      const title=completeMatch[1].toLowerCase();
      const t=tasks.find(t=>t.title.toLowerCase().includes(title)||title.includes(t.title.toLowerCase()));
      if(t&&saveTask){ saveTask({...t,done:true}); if(grantXP) grantXP(t.priority==="High"?50:25,"task"); haptic("success"); }
    }
    const createMatch=reply.match(/\[CREATE_TASK:([^|]+)\|([^|]+)\|([^\]]+)\]/);
    if(createMatch){
      clean=clean.replace(createMatch[0],"").trim();
      const newTask={id:Math.random().toString(36).slice(2,9),title:createMatch[1],priority:createMatch[2],assignedTo:createMatch[3]==="Everyone"?"all":emps.find(e=>e.name.includes(createMatch[3]))?.id||"all",createdBy:user?.id||"",createdAt:Date.now(),done:false,dueDate:null,repeat:false,repeatDays:[]};
      // Update local state + save to Supabase
      if(saveTask) saveTask(newTask);
      if(upsertTask) upsertTask(newTask);
      if(grantXP) grantXP(25,"finn task");
      haptic("success");
    }
    const invMatch2=reply.match(/\[ADJ_INV:([^|]+)\|(\d+)\]/);
    if(invMatch2){
      clean=clean.replace(invMatch2[0],"").trim();
      const name=invMatch2[1].toLowerCase(); const stock=parseInt(invMatch2[2]);
      const item=inv.find(i=>i.name.toLowerCase().includes(name)||name.includes(i.name.toLowerCase()));
      if(item&&saveInv) saveInv(inv.map(i=>i.id===item.id?{...i,stock}:i));
    }
    const dmMatch=reply.match(/\[SEND_DM:([^|]+)\|([^\]]+)\]/);
    if(dmMatch){
      clean=clean.replace(dmMatch[0],"").trim();
      const emp=emps.find(e=>e.name.toLowerCase().includes(dmMatch[1].toLowerCase()));
      if(emp&&saveDms){ const dm={id:Math.random().toString(36).slice(2,9),from:user?.id||"",to:emp.id,text:dmMatch[2],at:Date.now(),read:false,system:false}; saveDms([...dms,dm]); if(grantXP) grantXP(5,"finn dm"); }
    }
    const statusMatch=reply.match(/\[SET_STATUS:(\w+)\]/);
    if(statusMatch){ clean=clean.replace(statusMatch[0],"").trim(); if(saveStatus) saveStatus(statusMatch[1]); }
    // Parse REMEMBER tag — store in Finn memory
    const rememberMatch=reply.match(/\[REMEMBER:([^|]+)\|([^\]]+)\]/);
    if(rememberMatch){
      clean=clean.replace(rememberMatch[0],"").trim();
      finnMemory.set(rememberMatch[1].trim(),rememberMatch[2].trim());
    }
    if(reply.includes("[DISMISS_ANN]")){
      clean=clean.replace("[DISMISS_ANN]","").trim();
      const active=anns.filter(a=>!(a.dismissed||[]).includes(user?.id));
      if(active[0]&&dismissAnn) dismissAnn(active[0].id);
    }
    return clean.trim();
  };
  const getIntro=()=>{
    const pg=progress[user?.id]||{xp:0,streak:0,title:"Pioneer"};
    const openT=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id));
    const overdue=openT.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
    if(overdue.length>0) return `${nick}, you have ${overdue.length} overdue task${overdue.length>1?"s":""}. Want me to pull them up?`;
    if(pg.streak>0&&pg.streak%7===0) return `${nick}! ${pg.streak}-day streak — impressive. What can I help with today?`;
    if(openT.length===0) return `All clear, ${nick}. No open tasks. How can I help?`;
    if(openT.length>3) return `${nick}, you've got ${openT.length} open tasks. Want me to prioritize them?`;
    return `Finn online, ${nick}. Ask about tasks, inventory, XP — or say "help".`;
  };
  const [msgs,setMsgs]=useState(()=>{
    const h=new Date().getHours();
    const isMorning=h>=5&&h<11;
    const intro=getIntro();
    return [{role:"assistant",content:intro}];
  });
  const [lastOpenDate,setLastOpenDate]=useState(()=>LS.get("nl3-finn-last-open")||"");
  // Proactive morning brief on first open of the day
  useEffect(()=>{
    const today=new Date().toDateString();
    if(lastOpenDate!==today){
      LS.set("nl3-finn-last-open",today);
      setLastOpenDate(today);
      const h=new Date().getHours();
      if(h>=5&&h<12){
        const openT=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id));
        const overdue=openT.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
        const dueToday=openT.filter(t=>{if(!t.dueDate)return false; const d=new Date(t.dueDate); const n=new Date(); return d.toDateString()===n.toDateString();});
        const pg=progress[user?.id]||{xp:0,streak:0,title:"Pioneer"};
        const parts=["Good morning, "+nick+"! ☀️ Here's your brief:"];
        if(overdue.length>0) parts.push("⚠️ "+overdue.length+" overdue task"+(overdue.length>1?"s":"")+".");
        if(dueToday.length>0) parts.push("📅 "+dueToday.length+" due today: "+dueToday.map(t=>t.title).join(", ")+".");
        if(openT.length>0&&overdue.length===0&&dueToday.length===0) parts.push("✅ "+openT.length+" open task"+(openT.length>1?"s":"")+" — no urgent deadlines.");
        if(openT.length===0) parts.push("🎉 No open tasks — all clear!");
        if(pg.streak>1) parts.push("🔥 Day "+pg.streak+" streak — keep it going!");
        if(pg.streak>0) parts.push("🔥 "+pg.streak+"-day streak going.");
        const brief=parts.join("\n");
        setTimeout(()=>setMsgs(prev=>[...prev,{role:"assistant",content:brief}]),800);
      }
    }
  },[]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [pendingAction,setPendingAction]=useState(null);
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const voiceOn=voiceOnGlobal!==undefined?voiceOnGlobal:LS.get("nl3-finn-voice")!==false;
  const setVoiceOn=(v)=>{ if(setVoiceOnGlobal) setVoiceOnGlobal(v); LS.set("nl3-finn-voice",v); };
  const recognitionRef=useRef(null);
  const endRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100);},[]);

  const now=new Date();
  const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const dateStr=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  function FinnLogo(){
    return (<svg width="28" height="28" viewBox="0 0 22 22" style={{flexShrink:0}}>
      <rect width="22" height="22" rx="6" fill="#0f2744"/>
      <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2"/>
      <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.5"/>
      <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
      <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
      <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
      <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
      <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
      <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
      <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
      <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
      <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
      <circle cx="11" cy="11" r="1" fill="#fff"/>
    </svg>);
  }

  const addMsg=(role,content)=>setMsgs(prev=>[...prev,{role,content}]);

  // ── Voice: speak Finn's reply ──────────────────────────────────────────────
  function speakReply(text){
    if(!voiceOn||!window.speechSynthesis) return;
    const clean=text.replace(/\[[A-Z_:a-z|0-9]+\]/g,"").replace(/[⚡📱☁️🛡✦◈🔴🟠🟡🟢]/g,"").trim();
    if(!clean) return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(clean);
    const pickVoice=(voices)=>voices.find(v=>v.name==="Microsoft David - English (United States)")||voices.find(v=>v.name==="Microsoft Mark - English (United States)")||voices.find(v=>v.name==="Google UK English Male")||voices.find(v=>v.name==="Aaron")||voices.find(v=>v.name==="Daniel")||voices.find(v=>v.name==="Alex")||voices.find(v=>/microsoft david/i.test(v.name))||voices.find(v=>/microsoft mark/i.test(v.name))||voices.find(v=>/google uk english male/i.test(v.name))||voices.find(v=>/male/i.test(v.name)&&v.lang.startsWith("en"))||voices.find(v=>v.lang==="en-US"&&!/zira|helena|laura|hortense|julie|samantha|karen|victoria|female/i.test(v.name))||voices.find(v=>v.lang==="en-US")||voices[0];
    const doSpeak=(voices)=>{ const v=pickVoice(voices); if(v) utt.voice=v; utt.rate=1.05; utt.pitch=0.95; utt.volume=1.0; utt.onstart=()=>{ setSpeaking(true); if(recognitionRef.current){try{recognitionRef.current.stop();}catch(_){}} }; utt.onend=()=>{
      setSpeaking(false);
      // Restart fresh recognition after Finn finishes so user can keep talking
      if(voiceOn){
        setTimeout(()=>{
          if(voiceOn) startListening();
        },350);
      }
    }; utt.onerror=()=>setSpeaking(false); window.speechSynthesis.speak(utt); };
    const v=window.speechSynthesis.getVoices();
    if(v.length){ doSpeak(v); } else { window.speechSynthesis.onvoiceschanged=()=>{ window.speechSynthesis.onvoiceschanged=null; doSpeak(window.speechSynthesis.getVoices()); }; setTimeout(()=>doSpeak(window.speechSynthesis.getVoices()),600); }
  }

  // ── Voice: start listening ──────────────────────────────────────────────────
  function startListening(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){
      const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;
      if(isIOS&&isPWA) toast("Mic isn't available in iOS home screen — open in Safari 🎤","warn");
      else toast("Voice not supported — try Chrome","warn");
      return;
    }
    // If already listening, stop first then restart fresh
    if(recognitionRef.current){
      try{ recognitionRef.current.stop(); }catch(_){}
      recognitionRef.current=null;
    }
    window.speechSynthesis.cancel();
    const rec=new SR();
    rec.lang="en-US";
    rec.continuous=true;
    rec.interimResults=true;
    rec.onstart=()=>{ setListening(true); haptic("light"); };
    const STOP_PHRASES=["stop","done","cancel","stop listening","that's it","thats it","never mind","nevermind","end","quit","stop recording","stop dictation","be quiet","enough","goodbye finn","bye finn","stop finn","ok stop","okay stop","cut it","that'll do","finish"];
    rec.onresult=(e)=>{
      let final="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal) final+=e.results[i][0].transcript;
      }
      if(!final.trim()) return;
      const q=final.trim().toLowerCase().replace(/[.,!?]/g,"");
      // Check for stop command
      if(STOP_PHRASES.includes(q)||STOP_PHRASES.some(p=>q===p||q.endsWith(" "+p)||q.startsWith(p+" "))){
        stopListening();
        toast("Stopped listening 🎤","ok");
        haptic("light");
        return;
      }
      setInput(final.trim());
      setTimeout(()=>{ if(final.trim()) sendText(final.trim()); },300);
    };
    rec.onerror=(e)=>{
      if(e.error==="not-allowed"||e.error==="permission-denied"){ setListening(false); toast("Mic denied — allow in browser settings","err"); }
      else if(e.error==="no-speech"){ /* ignore — keep listening */ }
      else if(e.error!=="aborted"){ setListening(false); toast("Voice error: "+e.error,"warn"); }
    };
    rec.onend=()=>{
      // Auto-restart if still listening (Chrome stops after silence)
      if(recognitionRef.current===rec&&listening){
        try{ rec.start(); }catch(_){}
      } else { setListening(false); }
    };
    recognitionRef.current=rec;
    rec.start();
  }
  function stopListening(){
    const r=recognitionRef.current;
    recognitionRef.current=null;
    setListening(false);
    try{ r?.stop(); }catch(_){}
  }



  const finnSpeak=(text)=>{
    if(!voiceOn) return;
    const synth=window.speechSynthesis;
    if(!synth) return;
    const clean=text.replace(/\[[A-Z_:a-z|0-9]+\]/g,"").replace(/[^ -]/g," ").trim();
    if(!clean) return;
    synth.cancel();
    const utt=new SpeechSynthesisUtterance(clean);
    utt.rate=1.05; utt.pitch=1.0; utt.volume=1.0;
    const voices=synth.getVoices();
    const preferred=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Google US English")||v.name.includes("Alex"))||voices.find(v=>v.lang==="en-US")||voices[0];
    if(preferred) utt.voice=preferred;
    utt.onstart=()=>setSpeaking(true);
    utt.onend=()=>setSpeaking(false);
    utt.onerror=()=>setSpeaking(false);
    synth.speak(utt);
  };


  const sendText=async(text)=>{
    if(!text?.trim()||loading) return;
    // Vigil checks
    if(!VIGIL.checkFinnRate()){ addMsg("assistant","Slow down a bit! 😄"); return; }
    if(VIGIL.detectInjection(text)){ VIGIL.logEvent("prompt_injection",text.slice(0,100),user?.id); addMsg("assistant","Vigil flagged that. What can I help with?"); return; }
    // Set input and trigger the full send() pipeline
    setInput(text);
    // Use a tiny delay so state updates before send() reads it
    await new Promise(r=>setTimeout(r,30));
    await sendFromText(text);
  };

  const sendFromText=async(text)=>{
    setInput("");
    addMsg("user",text);
    setLoading(true);
    haptic("light");
    // Try Aether first
    if(useGroq){
      try {
        const groqPromise=callGroqFinn(text,msgs);
        const timeoutPromise=new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000));
        const groqReply=await Promise.race([groqPromise,timeoutPromise]);
        const clean=await parseAndExecuteActions(groqReply);
        setMsgs(prev=>[...prev,{role:"assistant",content:clean}]);
        if(voiceOn) speakReply(clean);
        setLoading(false);
        return;
      } catch(e){
        const isTimeout=e.message==="timeout";
        const isOffline=e.message==="Failed to fetch"||e.name==="TypeError";
        const msg=isTimeout?"⚡ Finn Aether took too long — switching to Finn Atlas.":isOffline?"📱 No connection — switching to Finn Atlas.":"⚡ Finn Aether unavailable — switching to Finn Atlas.";
        console.warn("Aether fallback:",e.message);
        setMsgs(prev=>[...prev,{role:"assistant",content:msg+" Response coming..."}]);
        await new Promise(r=>setTimeout(r,300));
      }
    }
    // Fall through to Atlas — pass text directly, no state dependency
    sendAtlas(text);
  };

  async function send(){
    const text=input.trim();
    if(!text||loading) return;
    // Vigil: rate limit
    if(!VIGIL.checkFinnRate()){
      addMsg("assistant","Slow down a little! Give me a second. 😄");
      return;
    }
    // Vigil: injection detection
    if(VIGIL.detectInjection(text)){
      VIGIL.logEvent("prompt_injection",text.slice(0,100),user?.id);
      addMsg("assistant","🛡 Vigil flagged that message as a potential prompt injection attempt. It's been logged. What can I actually help you with?");
      return;
    }
    setInput("");
    addMsg("user",text);
    setLoading(true);
    haptic("light");

    // ── Try Finn Aether first (5s timeout), fall back to Finn Atlas ───────────
    if(useGroq){
      try {
        const groqPromise=callGroqFinn(text,msgs);
        const timeoutPromise=new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout")),5000));
        const groqReply=await Promise.race([groqPromise,timeoutPromise]);
        const clean=await parseAndExecuteActions(groqReply);
        setMsgs(prev=>[...prev,{role:"assistant",content:clean}]);
        if(voiceOn) speakReply(clean);
        setLoading(false);
        return;
      } catch(e){
        const isTimeout=e.message==="timeout";
        const isOffline=e.message==="Failed to fetch"||e.message==="NetworkError when attempting to fetch resource"||e.name==="TypeError";
        const isApiErr=e.message?.startsWith("api_error_");
        const errCode=isApiErr?e.message.replace("api_error_",""):"";
        let msg="⚡ Finn Aether unavailable — switching to Finn Atlas.";
        if(isTimeout) msg="⚡ Finn Aether took too long — switching to Finn Atlas.";
        else if(isOffline) msg="📱 No connection to Finn Aether — switching to Finn Atlas.";
        else if(errCode==="500") msg="⚡ Finn Aether server error — switching to Finn Atlas. (Check GROQ_API_KEY in Vercel)";
        else if(errCode==="401"||errCode==="403") msg="⚡ Finn Aether auth error — check GROQ_API_KEY in Vercel settings.";
        else if(errCode==="404") msg="⚡ api/finn.js not found — make sure it's deployed to GitHub.";
        else if(e.message==="no_response") msg="⚡ Finn Aether returned empty — switching to Finn Atlas.";
        console.warn("Finn Aether error:",e.message,"code:",errCode);
        setMsgs(prev=>[...prev,{role:"assistant",content:msg+" Response coming..."}]);
        await new Promise(r=>setTimeout(r,300));
      }
    }

    sendAtlas(text);
  }

  function sendAtlas(text){
    // ── Local Atlas engine ─────────────────────────────────────────────────
    let reply="";
    try {
      const q=text.toLowerCase().trim().replace(/[\u2018\u2019\u201A\u201B']/g,"'");
      const words=q.split(/\s+/);

      // ── Data snapshot ─────────────────────────────────────────────────────
      const allOpenTasks=tasks.filter(t=>!t.done);
      const openTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id));
      const overdueTasks=openTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
      const highPri=openTasks.filter(t=>t.priority==="High");
      const lowInv=inv.filter(i=>i.stock<5);
      const outInv=inv.filter(i=>i.stock===0);
      const unreadDMs=dms.filter(d=>d.to===user?.id&&!d.read).length;
      const sentDMs=dms.filter(d=>d.from===user?.id).length;
      const doneTasks=tasks.filter(t=>t.done&&(t.assignedTo===user?.id||t.assignedTo==="all"));
      const myProg=progress[user?.id]||{xp:0,level:1,title:"Pioneer",streak:0};
      const myLvInfo=getLevelInfo(myProg.xp);
      const isXP=XP_ELIGIBLE_ROLES.includes(user?.role);
      const isMgr=["boss","manager"].includes(user?.role);
      const isStaff=["boss","manager","assistant"].includes(user?.role);
      const now=new Date();
      const todayStr=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
      const timeStr2=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      const todayStart=new Date(); todayStart.setHours(0,0,0,0);
      const weekAgo=Date.now()-7*86400000;
      const thisWeek=doneTasks.filter(t=>(t.createdAt||0)>weekAgo).length;
      const lastWeek=doneTasks.filter(t=>(t.createdAt||0)>(weekAgo-7*86400000)&&(t.createdAt||0)<=weekAgo).length;

      // ── Natural date parser ────────────────────────────────────────────────
      const parseNaturalDate=(str)=>{
        const d=new Date();
        if(str.includes("today")) return d.toISOString().slice(0,10);
        if(str.includes("tomorrow")){ d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); }
        const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        const dayMatch=days.findIndex(dy=>str.includes(dy));
        if(dayMatch>-1){ const diff=(dayMatch-d.getDay()+7)%7||7; d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); }
        if(str.includes("this week")){ d.setDate(d.getDate()+(7-d.getDay())); return d.toISOString().slice(0,10); }
        if(str.includes("next week")){ d.setDate(d.getDate()+(14-d.getDay())); return d.toISOString().slice(0,10); }
        const inMatch=str.match(/in (\d+) (day|hour|week)/);
        if(inMatch){ const n=parseInt(inMatch[1]); if(inMatch[2]==="day") d.setDate(d.getDate()+n); else if(inMatch[2]==="week") d.setDate(d.getDate()+n*7); return d.toISOString().slice(0,10); }
        return null;
      };

      // ── Conversation memory ────────────────────────────────────────────────
      const history=msgs.slice(-8);
      const lastBot=(history.filter(m=>m.role==="assistant").slice(-1)[0]?.content||"").toLowerCase();
      const ctx={
        xp:      lastBot.includes("xp")||lastBot.includes("level")||lastBot.includes("streak"),
        tasks:   lastBot.includes("task")||lastBot.includes("overdue")||lastBot.includes("priority"),
        inv:     lastBot.includes("stock")||lastBot.includes("item")||lastBot.includes("inventory"),
        dms:     lastBot.includes("message")||lastBot.includes("unread"),
        asked:   lastBot.endsWith("?"),
        lastTask: (()=>{ for(let m of [...history].reverse()){ const t=tasks.find(t=>m.content.toLowerCase().includes(t.title.toLowerCase())); if(t) return t; } return null; })(),
        lastEmp:  (()=>{ const m=emps.find(e=>e.id!==user?.id&&history.map(h=>h.content.toLowerCase()).some(c=>e.name.toLowerCase().split(" ").some(n=>n.length>2&&c.includes(n)))); return m||null; })(),
      };

      // ── Helpers ────────────────────────────────────────────────────────────
      const has=(...phrases)=>phrases.some(p=>q.includes(p));
      const hasAll=(...phrases)=>phrases.every(p=>q.includes(p));
      const empMatch=(qStr)=>emps.find(e=>e.id!==user?.id&&e.name.toLowerCase().split(" ").some(n=>n.length>2&&qStr.includes(n)));
      const taskMatch=(qStr)=>tasks.find(t=>!t.done&&t.title.toLowerCase().split(" ").some(w=>w.length>3&&qStr.includes(w)))||tasks.find(t=>t.title.toLowerCase().split(" ").some(w=>w.length>3&&qStr.includes(w)));
      const invMatch=(qStr)=>inv.find(i=>i.name.toLowerCase().split(" ").some(w=>w.length>2&&qStr.includes(w)));

      // ── PENDING MULTI-TURN ─────────────────────────────────────────────────
      if(pendingAction){
        const pa=pendingAction;

        if(pa.type==="confirm"){
          if(has("yes","yeah","yep","yup","sure","do it","confirmed","go ahead","ok","okay","correct","yep","absolutely")){
            const act=pa.data;
            if(act.action==="complete_task"){
              const t=tasks.find(t=>t.id===act.taskId);
              if(t&&saveTask){ saveTask({...t,done:true}); if(grantXP) grantXP(t.priority==="High"?50:25,"task"); haptic("success"); }
              setPendingAction(null);
              reply="Done! "+act.taskTitle+" ✅"+(openTasks.length>1?" "+( openTasks.length-1)+" task"+(openTasks.length-1>1?"s":"")+" still open.":"");
            } else if(act.action==="assign_task"){
              const t=tasks.find(t=>t.id===act.taskId);
              if(t&&saveTask) saveTask({...t,assignedTo:act.empId});
              setPendingAction(null);
              reply=act.taskTitle+" assigned to "+act.empName+". ✅";
            } else if(act.action==="edit_task"){
              const t=tasks.find(t=>t.id===act.taskId);
              if(t&&saveTask) saveTask({...t,...act.changes});
              if(upsertTask) upsertTask({...t,...act.changes});
              setPendingAction(null);
              reply="Updated: "+act.taskTitle+". ✅";
            } else if(act.action==="dismiss_ann"){
              if(dismissAnn) dismissAnn(act.annId);
              setPendingAction(null);
              reply="Announcement dismissed. ✅";
            } else if(act.action==="create_task"){
              const newTask={id:Math.random().toString(36).slice(2,9),title:act.title,description:"",priority:act.priority,assignedTo:act.assignedTo,createdBy:user?.id||"",createdAt:Date.now(),done:false,dueDate:act.dueDate||null,repeat:false,repeatDays:[]};
              // Save to Supabase AND update local state so task doesn't disappear
              if(upsertTask) upsertTask(newTask);
              if(saveTask) saveTask(newTask); // also updates local tasks state
              if(addAct) addAct("task_created","Finn created: "+newTask.title,user?.id);
              if(grantXP) grantXP(25,"finn task");
              setPendingAction(null);
              haptic("success");
              reply="Task created: "+newTask.title+" ["+newTask.priority+"] → "+(act.assignedTo==="all"?"Everyone":emps.find(e=>e.id===act.assignedTo)?.name||"them")+(act.dueDate?" · due "+new Date(act.dueDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}):"")+".\nWant to create another or assign it differently?";
            } else if(act.action==="bulk_complete"){
              act.taskIds.forEach(id=>{ const t=tasks.find(t=>t.id===id); if(t&&saveTask) saveTask({...t,done:true}); });
              if(grantXP) grantXP(act.taskIds.length*25,"bulk tasks");
              haptic("success");
              setPendingAction(null);
              reply="Marked "+act.taskIds.length+" tasks complete. ✅ +"+(act.taskIds.length*25)+" XP!";
            } else if(act.action==="adj_inv"){
              const item=inv.find(i=>i.id===act.itemId);
              if(item&&saveInv) saveInv(inv.map(i=>i.id===act.itemId?{...i,stock:act.newStock}:i));
              setPendingAction(null);
              reply=act.itemName+" updated to "+act.newStock+" in stock. ✅";
            }
          } else {
            setPendingAction(null);
            reply="Cancelled. What else can I help with?";
          }

        } else if(pa.type==="create_task"){
          if(!pa.data.title){
            const nd=parseNaturalDate(q);
            if(nd){ setPendingAction({...pa,data:{...pa.data,title:text,dueDate:nd}}); reply="Got it. Priority — Low, Medium, or High?"; }
            else { setPendingAction({...pa,data:{...pa.data,title:text}}); reply="Priority — Low, Medium, or High?"; }
          } else if(!pa.data.priority){
            const pri=q.includes("high")?"High":q.includes("low")?"Low":"Medium";
            const nd=parseNaturalDate(q);
            setPendingAction({...pa,data:{...pa.data,priority:pri,dueDate:pa.data.dueDate||nd||null}});
            reply="Priority: "+pri+". Assign to everyone or someone specific?";
          } else {
            let assignTo="all";
            const em=empMatch(q);
            if(em) assignTo=em.id;
            const t=pa.data;
            setPendingAction({type:"confirm",data:{action:"create_task",title:t.title,priority:t.priority,assignedTo:assignTo,dueDate:t.dueDate||null}});
            reply="Creating: "+t.title+" ["+t.priority+"] → "+(assignTo==="all"?"Everyone":emps.find(e=>e.id===assignTo)?.name||"them")+(t.dueDate?" · due "+new Date(t.dueDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}):"")+". Confirm?";
          }

        } else if(pa.type==="create_inv"){
          if(!pa.data.name){
            setPendingAction({...pa,data:{...pa.data,name:text}});
            reply="How many in stock to start?";
          } else {
            const stock=parseInt(text)||0;
            const newItem={id:Math.random().toString(36).slice(2,9),name:pa.data.name,stock,createdAt:Date.now()};
            if(saveInv) saveInv([newItem,...inv]);
            setPendingAction(null);
            reply=newItem.name+" added — "+stock+" in stock. ✅";
          }

        } else if(pa.type==="create_ann"){
          if(!pa.data.msg){
            setPendingAction({...pa,data:{...pa.data,msg:text}});
            reply="Level — info, warning, or urgent?";
          } else {
            const lvl=q.includes("urgent")?"danger":q.includes("warn")?"warn":"info";
            const newAnn={id:Math.random().toString(36).slice(2,9),msg:pa.data.msg,level:lvl,by:user?.name||"",at:Date.now(),dismissed:[]};
            if(saveAnns) saveAnns([newAnn,...anns]);
            setPendingAction(null);
            reply="Announcement posted. ✅";
          }

        } else if(pa.type==="send_dm"){
          if(!pa.data.to){
            const em=empMatch(q);
            if(!em) reply="Could not find that person. Try their name.";
            else { setPendingAction({...pa,data:{...pa.data,to:em.id,toName:em.name}}); reply="Got it. What do you want to say to "+em.name+"?"; }
          } else {
            const newDm={id:Math.random().toString(36).slice(2,9),from:user?.id||"",to:pa.data.to,text,at:Date.now(),read:false,system:false,feedback:false};
            if(saveDms) saveDms([...dms,newDm]);
            if(grantXP) grantXP(5,"finn dm");
            setPendingAction(null);
            reply="Sent to "+pa.data.toName+". ✅";
          }

        } else if(pa.type==="assign_task"){
          if(!pa.data.taskId){
            const t=taskMatch(q);
            if(!t) reply="Could not find that task. Try the task name.";
            else { setPendingAction({...pa,data:{...pa.data,taskId:t.id,taskTitle:t.title}}); reply="Assigning: "+t.title+". Who should it go to?"; }
          } else if(!pa.data.empId){
            const em=empMatch(q)||(has("me","myself")?user:null);
            if(!em) reply="Could not find that person.";
            else {
              setPendingAction({type:"confirm",data:{action:"assign_task",taskId:pa.data.taskId,taskTitle:pa.data.taskTitle,empId:em.id,empName:em.name||user?.name}});
              reply="Assign "+pa.data.taskTitle+" to "+(em.id===user?.id?"yourself":em.name)+"? Confirm?";
            }
          }

        } else if(pa.type==="edit_task"){
          if(!pa.data.taskId){
            const t=taskMatch(q)||ctx.lastTask;
            if(!t) reply="Which task do you want to edit?";
            else { setPendingAction({...pa,data:{...pa.data,taskId:t.id,taskTitle:t.title}}); reply="Editing: "+t.title+". What do you want to change — priority, due date, or assignment?"; }
          } else if(!pa.data.field){
            const field=q.includes("priority")?"priority":q.includes("due")||q.includes("date")?"dueDate":q.includes("assign")?"assignedTo":"priority";
            setPendingAction({...pa,data:{...pa.data,field}});
            if(field==="priority") reply="What priority — Low, Medium, or High?";
            else if(field==="dueDate") reply="What date? (e.g. tomorrow, Friday, next week)";
            else reply="Who should it be assigned to?";
          } else {
            const field=pa.data.field;
            let changes={};
            if(field==="priority"){ changes.priority=q.includes("high")?"High":q.includes("low")?"Low":"Medium"; }
            else if(field==="dueDate"){ const nd=parseNaturalDate(q)||q; changes.dueDate=nd; }
            else if(field==="assignedTo"){ const em=empMatch(q); if(em) changes.assignedTo=em.id; else changes.assignedTo="all"; }
            setPendingAction({type:"confirm",data:{action:"edit_task",taskId:pa.data.taskId,taskTitle:pa.data.taskTitle,changes}});
            reply="Update "+pa.data.taskTitle+": "+Object.entries(changes).map(([k,v])=>k+"→"+v).join(", ")+". Confirm?";
          }

        } else if(pa.type==="adj_inv"){
          if(!pa.data.itemId){
            const item=invMatch(q);
            if(!item) reply="Which item? Try its name.";
            else { setPendingAction({...pa,data:{...pa.data,itemId:item.id,itemName:item.name,currentStock:item.stock}}); reply=item.name+" is at "+item.stock+". What should it be set to?"; }
          } else {
            const newStock=parseInt(text);
            if(isNaN(newStock)) reply="Just give me a number — e.g. 12";
            else {
              setPendingAction({type:"confirm",data:{action:"adj_inv",itemId:pa.data.itemId,itemName:pa.data.itemName,currentStock:pa.data.currentStock,newStock}});
              reply="Set "+pa.data.itemName+" from "+pa.data.currentStock+" → "+newStock+"? Confirm?";
            }
          }

        } else if(pa.type==="nickname"){
          const cleaned=text.trim().split(" ")[0].slice(0,20);
          setNick(cleaned);
          setPendingAction(null);
          reply="Got it — I'll call you "+cleaned+" from now on. 👋";

        } else {
          setPendingAction(null);
          reply="Got it! What else can I help with?";
        }

      // ── CANCEL ────────────────────────────────────────────────────────────
      } else if((q==="no"||q==="nope"||q==="nah"||has("cancel","never mind","nevermind","forget it","stop that","don't do it"))&&(ctx.asked||pendingAction)){
        setPendingAction(null);
        reply="No problem! Anything else?";

      // ── NICKNAME ──────────────────────────────────────────────────────────
      } else if(has("remember that","remember this","don't forget","finn remember","store this","make note","note that")){
        // Store arbitrary fact in Finn memory
        const fact=text.replace(/remember (that|this)?|don't forget|finn remember|store this|make note( that)?|note that/gi,"").trim();
        if(fact.length>2){
          const key="fact_"+Date.now();
          finnMemory.set(key,fact);
          reply="Got it — I'll remember: "+fact+" 🧠";
        } else {
          reply="What do you want me to remember?";
        }
      } else if(has("what do you remember","what do you know about me","your memory","finn memory","what have i told you")){
        const mem=finnMemory.all();
        reply=mem?"Here's what I remember: "+mem:"I don't have anything stored yet. Tell me something and I'll remember it!";
      } else if(has("forget everything","clear your memory","wipe your memory","forget what i told you")){
        finnMemory.clear();
        reply="Memory cleared — fresh start! 🧹";
      } else if(has("call me ","my name is ","go by ","i go by ","nickname")){
        const nameGuess=text.replace(/call me|my name is|go by|i go by|nickname|please|just/gi,"").trim().split(" ")[0];
        if(nameGuess.length>1){
          setNick(nameGuess);
          finnMemory.set("preferred_name",nameGuess);
          reply="Got it — "+nameGuess+" it is! 👋";
        } else {
          setPendingAction({type:"nickname",data:{}});
          reply="What should I call you?";
        }

      // ── SHIFT SUMMARY (managers/boss) ────────────────────────────────────
      } else if(isMgr&&has("shift summary","what happened today","today's summary","shift report","what did","who did what","team summary","daily summary","summarize today","summarize the shift","what got done")){
        const todayDone=tasks.filter(t=>t.done&&(t.createdAt||0)>todayStart.getTime());
        const onlineNow=emps.filter(e=>e.status==="online"&&e.id!==user?.id);
        const todayAct=act?act.filter(a=>(a.at||0)>todayStart.getTime()):[];
        const byEmp={};
        todayAct.forEach(a=>{
          if(!a.userId||a.userId===user?.id) return;
          const emp=emps.find(e=>e.id===a.userId); if(!emp) return;
          if(!byEmp[emp.name]) byEmp[emp.name]=[];
          byEmp[emp.name].push(a.type);
        });
        const ln=["Shift summary — "+todayStr+":",""];
        if(todayDone.length>0) ln.push("Completed: "+todayDone.map(t=>t.title).join(", ")+".");
        else ln.push("No tasks completed today yet.");
        if(onlineNow.length>0) ln.push("Online: "+onlineNow.map(e=>e.name).join(", ")+".");
        if(Object.keys(byEmp).length>0){
          ln.push("");
          Object.entries(byEmp).forEach(([name,types])=>{
            const done=types.filter(t=>t==="task_done").length;
            ln.push(name+": "+(done>0?done+" task"+(done>1?"s":"")+" done":"no tasks")+".");
          });
        }
        if(allOpenTasks.length>0) ln.push("\nStill open: "+allOpenTasks.length+" task"+(allOpenTasks.length>1?"s":"")+".");
        reply=ln.join("\n");

      // ── WHAT DID PERSON DO ────────────────────────────────────────────────
      } else if(isMgr&&(has("what did","what has","how did","did they","did she","did he"))){
        const em=empMatch(q)||ctx.lastEmp;
        if(em){
          const todayAct2=(act||[]).filter(a=>a.userId===em.id&&(a.at||0)>todayStart.getTime());
          const empOpen=tasks.filter(t=>!t.done&&(t.assignedTo===em.id||t.assignedTo==="all"));
          const pg=progress[em.id]||{xp:0,level:1,title:"Pioneer"};
          const lv=getLevelInfo(pg.xp);
          const todayDone2=todayAct2.filter(a=>a.type==="task_done").length;
          reply=em.name+" — "+lv.title+" ("+pg.xp+" XP).\n";
          reply+=todayDone2>0?todayDone2+" task"+(todayDone2>1?"s":"")+" done today. ":"No tasks completed today. ";
          reply+=(em.status==="online"?"Online now.":"Offline.");
          if(empOpen.length>0) reply+="\nOpen: "+empOpen.slice(0,3).map(t=>t.title).join(", ")+(empOpen.length>3?" +more":"")+"." ;
        } else {
          reply="Who do you want to know about?";
        }

      // ── EDIT TASK ─────────────────────────────────────────────────────────
      } else if(has("change","edit","update","modify","set","move")&&(has("task","priority","due date","due","assigned","assign"))){
        const t=taskMatch(q)||ctx.lastTask;
        const field=q.includes("priority")?"priority":q.includes("due")||q.includes("date")?"dueDate":q.includes("assign")?"assignedTo":null;
        if(t&&field){
          // Try to parse value inline
          let changes={};
          if(field==="priority"){ changes.priority=q.includes("high")?"High":q.includes("low")?"Low":"Medium"; }
          else if(field==="dueDate"){ const nd=parseNaturalDate(q); if(nd) changes.dueDate=nd; }
          else if(field==="assignedTo"){ const em=empMatch(q); if(em) changes.assignedTo=em.id; else if(has("everyone","all")) changes.assignedTo="all"; }
          if(Object.keys(changes).length>0){
            setPendingAction({type:"confirm",data:{action:"edit_task",taskId:t.id,taskTitle:t.title,changes}});
            reply="Update "+t.title+": "+Object.entries(changes).map(([k,v])=>k==="priority"?v+" priority":k==="dueDate"?"due "+new Date(v).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}):k+"→"+v).join(", ")+". Confirm?";
          } else {
            setPendingAction({type:"edit_task",data:{taskId:t.id,taskTitle:t.title,field:null}});
            reply="Editing: "+t.title+". What do you want to change — priority, due date, or assignment?";
          }
        } else if(t){
          setPendingAction({type:"edit_task",data:{taskId:t.id,taskTitle:t.title,field:null}});
          reply="Editing: "+t.title+". What do you want to change — priority, due date, or assignment?";
        } else {
          setPendingAction({type:"edit_task",data:{taskId:null,field:null}});
          reply="Which task do you want to edit?";
        }

      // ── ADJUST INVENTORY ──────────────────────────────────────────────────
      } else if((has("set ","update ","change ","adjust ")&&has("stock","inventory","count","amount","units","to ")&&invMatch(q))||
               (has("add","subtract","remove")&&invMatch(q))||
               (has("set ")&&invMatch(q)&&q.match(/\d+/))){
        const item=invMatch(q);
        const numMatch=q.match(/\d+/);
        if(item&&numMatch){
          const newStock=has("add","plus")?(item.stock+parseInt(numMatch[0])):has("subtract","remove","minus")?(item.stock-parseInt(numMatch[0])):parseInt(numMatch[0]);
          setPendingAction({type:"confirm",data:{action:"adj_inv",itemId:item.id,itemName:item.name,currentStock:item.stock,newStock:Math.max(0,newStock)}});
          reply="Set "+item.name+" from "+item.stock+" → "+Math.max(0,newStock)+"? Confirm?";
        } else if(item){
          setPendingAction({type:"adj_inv",data:{itemId:item.id,itemName:item.name,currentStock:item.stock}});
          reply=item.name+" is at "+item.stock+". What should it be set to?";
        } else {
          setPendingAction({type:"adj_inv",data:{itemId:null}});
          reply="Which item do you want to adjust?";
        }

      // ── DISMISS ANNOUNCEMENT ──────────────────────────────────────────────
      } else if(has("dismiss","clear","remove","hide")&&has("announcement","notice","alert","banner")){
        const active=anns.filter(a=>!(a.dismissed||[]).includes(user?.id));
        if(active.length===0) reply="No active announcements to dismiss.";
        else if(active.length===1){
          setPendingAction({type:"confirm",data:{action:"dismiss_ann",annId:active[0].id,annMsg:active[0].msg.slice(0,40)}});
          reply="Dismiss: "+active[0].msg.slice(0,50)+"? Confirm?";
        } else {
          reply=active.length+" announcements. Say which one to dismiss:\n"+active.map((a,i)=>(i+1)+". "+a.msg.slice(0,50)).join("\n");
        }

      // ── BULK COMPLETE ─────────────────────────────────────────────────────
      } else if(has("complete all","finish all","mark all","done with all","all tasks done","all done")){
        if(openTasks.length===0) reply="No open tasks to complete!";
        else {
          setPendingAction({type:"confirm",data:{action:"bulk_complete",taskIds:openTasks.map(t=>t.id)}});
          reply="Mark all "+openTasks.length+" of your tasks complete? That's +"+(openTasks.length*25)+" XP. Confirm?";
        }

      // ── COMPLETE TASK ─────────────────────────────────────────────────────
      } else if(has("mark","complete","finish","done with","finished","check off","close out")){
        const t=taskMatch(q)||
          (has("first","top","next","the first")&&openTasks[0])||
          (has("overdue","late")&&overdueTasks[0])||
          ctx.lastTask;
        if(t&&!t.done){
          setPendingAction({type:"confirm",data:{action:"complete_task",taskId:t.id,taskTitle:t.title}});
          reply="Mark \""+t.title+"\" complete? Confirm?";
        } else if(openTasks.length>0){
          reply="Which task? "+openTasks.slice(0,4).map((t,i)=>(i+1)+". "+t.title).join(", ")+".";
        } else {
          reply="No open tasks to complete.";
        }

      // ── ASSIGN TASK ───────────────────────────────────────────────────────
      } else if(isStaff&&(has("assign","reassign","give","delegate","put on"))){
        const t=taskMatch(q);
        const em=empMatch(q);
        if(t&&em){
          setPendingAction({type:"confirm",data:{action:"assign_task",taskId:t.id,taskTitle:t.title,empId:em.id,empName:em.name}});
          reply="Assign \""+t.title+"\" to "+em.name+"? Confirm?";
        } else if(t){
          setPendingAction({type:"assign_task",data:{taskId:t.id,taskTitle:t.title,empId:null}});
          reply="Assigning \""+t.title+"\". Who should it go to?";
        } else {
          setPendingAction({type:"assign_task",data:{taskId:null,taskTitle:null,empId:null}});
          reply="Which task do you want to assign?";
        }

      // ── GREETINGS ─────────────────────────────────────────────────────────
      } else if(has("good morning","good afternoon","good evening","good night","gm ","gn ")||q==="gm"||q==="gn"){
        const h=now.getHours();
        const nudge=overdueTasks.length>0?" "+overdueTasks.length+" overdue.":(openTasks.length>0?" "+openTasks.length+" tasks open.":"");
        if(has("night","gn")) reply="Night, "+nick+"! Log in tomorrow for your streak. 🔥";
        else if(h<12) reply="Morning, "+nick+"!"+nudge;
        else if(h<17) reply="Afternoon, "+nick+"!"+nudge;
        else reply="Evening, "+nick+"!"+nudge;

      } else if(has("how are you","how r u","how're you","hows it going","how's it going","how you doing","you good","you okay","what's good","what's up","whats up")){
        const r=["Doing great, ready to help!","All good! What do you need?","Running smooth. What's on your mind?","Good! What can I do for you?"];
        reply=r[Math.floor(Math.random()*r.length)];

      } else if(has("not bad","doing well","pretty good","good thanks","im good","i am good","im fine","doing fine","not too bad")){
        reply="Good to hear, "+nick+"! "+(openTasks.length>0?"You've got "+openTasks.length+" open task"+(openTasks.length>1?"s":"")+" if you need a starting point.":"No open tasks — all clear.");

      } else if(q==="hi"||q==="hey"||q==="hello"||q==="yo"||q==="sup"||q==="hiya"||has("hi ","hey ","hello ")){
        const h=now.getHours();
        const g=h<12?"Morning":h<17?"Hey":"Evening";
        const nudge=overdueTasks.length>0?" "+overdueTasks.length+" overdue.":(openTasks.length>0?" "+openTasks.length+" tasks open.":"");
        reply=g+", "+nick+"!"+nudge;

      // ── CONTEXT FOLLOW-UPS ────────────────────────────────────────────────
      } else if(has("tell me more","what else","more info","go on","and then","elaborate")&&ctx.tasks){
        reply=openTasks.length>0?"Top: "+openTasks[0].title+" ["+openTasks[0].priority+"]."+(overdueTasks.length>0?" "+overdueTasks.length+" overdue.":""):"No open tasks.";

      } else if(has("tell me more","what else","more info","go on")&&ctx.xp){
        reply=isXP?"You're "+myLvInfo.pct+"% to "+(myLvInfo.next?.title||"max")+". "+myLvInfo.xpToNext+" XP needed.":"XP not tracked for your role.";

      } else if((q==="yes"||q==="yeah"||q==="yep"||q==="sure"||q==="ok"||q==="okay")&&ctx.asked&&!pendingAction){
        if(ctx.tasks) reply=openTasks.length>0?"Open tasks:\n"+openTasks.slice(0,4).map((t,i)=>(i+1)+". "+t.title+" ["+t.priority+"]").join("\n"):"No open tasks.";
        else if(ctx.xp) reply=isXP?"XP: "+myProg.xp+" | Level "+myProg.level+" | "+myLvInfo.xpToNext+" to next.":"XP not tracked for your role.";
        else reply="Sure! What do you need?";

      // ── THANKS / REACTIONS ────────────────────────────────────────────────
      } else if(has("thanks","thank you","ty","thx","appreciate","cheers","nice one","good job","great job","well done")||q==="ty"){
        const r=["No problem, "+nick+"!","Anytime!","Happy to help!","Of course!","That's what I'm here for."];
        reply=r[Math.floor(Math.random()*r.length)]+(openTasks.length>0?" "+openTasks.length+" task"+(openTasks.length>1?"s":"")+" still open.":"");

      } else if(has("lol","lmao","haha","hehe")||q.includes("😂")||q.includes("💀")){
        reply="😄 "+["Glad I could help!","Ha, right?","Always.",][Math.floor(Math.random()*3)]+" Back to work, "+nick+"!";

      } else if(has("bored","nothing to do","slow day","quiet day","dead today")){
        reply=openTasks.length>0?"Never dull — "+openTasks.length+" task"+(openTasks.length>1?"s":"")+" waiting.":"Nothing open. Good time to message a teammate or check announcements.";

      } else if(has("tired","exhausted","sleepy","burnt out","worn out","drained")){
        const en=["Hang in there!","Almost there!","You got this!","Take a breath — you're doing great."];
        reply=en[Math.floor(Math.random()*en.length)]+" "+(openTasks.length>0?openTasks.length+" task"+(openTasks.length>1?"s":"")+" left.":"No open tasks — maybe take a quick break.");

      } else if(has("stressed","overwhelmed","too much","swamped","drowning")){
        const t=overdueTasks[0]||highPri[0]||openTasks[0];
        reply=t?"One at a time. Start with: "+t.title+".":"No open tasks. Take a breath — you're actually caught up.";

      } else if(q==="ok"||q==="okay"||q==="cool"||q==="got it"||q==="alright"||q==="noted"||q==="perfect"||has("sounds good","that works","makes sense","understood")){
        reply=openTasks.length>0?"Got it! "+openTasks.length+" task"+(openTasks.length>1?"s":"")+" open.":"Got it! Anything else?";

      } else if(has("nice","awesome","great","love it","fire","sick","goat","let's go","lets go")){
        const hype=["Let's go! 🎉","That's what I'm talking about!","Love to hear it!"];
        reply=hype[Math.floor(Math.random()*hype.length)]+(openTasks.length>0?" "+openTasks.length+" task"+(openTasks.length>1?"s":"")+" still open.":"");

      } else if(has("joke","make me laugh","tell me a joke","something funny")){
        const jokes=["Why did the inventory manager quit? He couldn't count on anyone.","What did the overdue task say? I need closure!","Why do tasks love me? I never leave them hanging.","What do you call a task with no due date? Free range."];
        reply=jokes[Math.floor(Math.random()*jokes.length)];

      } else if(has("fun fact","trivia","tell me something","random fact","did you know")){
        const facts=["The average person spends 28% of their workday on email.","Studies show completing small tasks first boosts motivation for bigger ones.","Teams that communicate daily complete projects 30% faster on average.","The first inventory management system was used in ancient Mesopotamia — clay tablets.","Short bursts of focus (25 min) are more productive than marathon sessions."];
        reply=facts[Math.floor(Math.random()*facts.length)];

      } else if(has("icebreaker","get to know","team building","something fun")){
        const ib=["Would you rather work an early shift or a late shift?","What's one thing you'd improve about the Neer Locker?","If you could swap roles for a day, whose would you pick?","What's your go-to order at the locker?"];
        reply="Icebreaker 🎉\n"+ib[Math.floor(Math.random()*ib.length)];

      } else if(has("what do you think","your opinion","do you prefer","what would you choose","hypothetically")){
        reply="Ha — I don't have opinions, just your task list and inventory data. You make the calls, "+nick+". 😄";

      } else if(has("do you sleep","do you eat","are you alive","do you have feelings","can you feel")){
        reply="I don't sleep, eat, or dream — but I do track your tasks 24/7. That counts for something, right?";

      } else if(has("what's your favorite","whats your favorite","do you like","do you love","do you hate")){
        reply="No favorites — but if I did, it'd be a completed task list. 😄 Ask me something work-related!";

      } else if(has("what are you doing","what are you up to","you busy","you free")){
        reply="Just here waiting for you, "+nick+". "+(openTasks.length>0?"You've got "+openTasks.length+" open task"+(openTasks.length>1?"s":"")+"." :"Nothing pending.");

      // ── HOW AM I DOING (weekly review) ───────────────────────────────────
      } else if(has("how am i doing","my performance","performance review","how was my week","weekly review","how have i been")){
        const grade=thisWeek>=5?"A":thisWeek>=3?"B":thisWeek>=1?"C":"D";
        const parts=["Weekly review for "+nick+":",""];
        parts.push("Tasks completed this week: "+thisWeek+(lastWeek>0?" (last week: "+lastWeek+")"+(thisWeek>lastWeek?" ↑":" ↓"):""));
        if(overdueTasks.length>0) parts.push("Overdue: "+overdueTasks.length+" — needs attention.");
        if(isXP) parts.push("XP: "+myProg.xp+" ("+myProg.title+", Level "+myProg.level+")");
        if(myProg.streak>0) parts.push("Streak: "+myProg.streak+" days 🔥");
        parts.push("");
        if(grade==="A") parts.push("Strong week! Keep it up. 💪");
        else if(grade==="B") parts.push("Solid week. Push for one more task tomorrow.");
        else if(grade==="C") parts.push("Decent start. Focus on clearing those overdue items.");
        else parts.push("Let's get some tasks done. Start small — one at a time.");
        reply=parts.join("\n");

      // ── END OF SHIFT ──────────────────────────────────────────────────────
      } else if(has("wrap up","end of shift","shift done","clock out","signing off","end shift","shift summary")){
        const todayAct2=(act||[]).filter(a=>a.userId===user?.id&&(a.at||0)>todayStart.getTime());
        const todayDone2=tasks.filter(t=>t.done&&(t.assignedTo===user?.id||t.assignedTo==="all")&&(t.createdAt||0)>todayStart.getTime());
        const parts=["End of shift — "+new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})+":",""]; 
        parts.push("Tasks completed: "+todayDone2.length);
        if(openTasks.length>0) parts.push("Still open: "+openTasks.map(t=>t.title).join(", ")+".");
        if(isXP) parts.push("XP today: "+(todayAct2.length*5)+" est.");
        if(myProg.streak>0) parts.push("Streak: "+myProg.streak+" days 🔥");
        parts.push("","Good work today, "+nick+"!");
        reply=parts.join("\n");

      // ── NAVIGATE ──────────────────────────────────────────────────────────
      } else if(hasAll("task")&&has("go to","take me","open ","show me","navigate","switch to","bring up")){
        reply="Taking you to Tasks. ↗"; setTimeout(()=>setPage&&setPage("tasks"),350);
      } else if(has("inventory","stock")&&has("go to","take me","open ","show me","navigate","switch to")){
        reply="Taking you to Inventory. ↗"; setTimeout(()=>setPage&&setPage("inv"),350);
      } else if(has("message","dms","inbox")&&has("go to","take me","open ","show me","navigate","switch to")){
        reply="Taking you to Messages. ↗"; setTimeout(()=>setPage&&setPage("dms"),350);
      } else if(has("announcement","notices")&&has("go to","take me","open ","show me","navigate","switch to")){
        reply="Taking you to Announcements. ↗"; setTimeout(()=>setPage&&setPage("anns"),350);
      } else if(has("activity","log","history")&&has("go to","take me","open ","show me","navigate","switch to")){
        reply="Taking you to Activity. ↗"; setTimeout(()=>setPage&&setPage("act"),350);
      } else if(has("settings","preferences","profile")&&has("go to","take me","open ","show me","navigate","switch to")){
        reply="Taking you to Settings. ↗"; setTimeout(()=>setPage&&setPage("set"),350);
      } else if(has("leaderboard","rankings")&&has("go to","take me","open","show","navigate")){
        reply="Taking you to the Leaderboard. ↗"; setTimeout(()=>setPage&&setPage("leaderboard"),350);
      } else if(has("go home","take me home","home page")){
        reply="Taking you home. ↗"; setTimeout(()=>setPage&&setPage("home"),350);

      // ── SETTINGS ──────────────────────────────────────────────────────────
      } else if(has("dark mode")&&has("on","enable","turn on","activate")){
        if(applyTheme) applyTheme(true,compact); reply="Dark mode on. ✅";
      } else if(has("dark mode")&&has("off","disable","turn off")||has("light mode")){
        if(applyTheme) applyTheme(false,compact); reply="Light mode on. ✅";
      } else if(has("status","set me","mark me","change my status")&&has("online","offline","busy")){
        const s=q.includes("busy")?"busy":q.includes("offline")?"offline":"online";
        if(saveStatus) saveStatus(s); reply="Status set to "+s+". ✅";

      // ── CREATE TASK ───────────────────────────────────────────────────────
      } else if(has("create task","create a task","make a task","add a task","new task","add task","make task","make me a task")||(has("create","make","add","new")&&has("task","to-do","todo","assignment"))){
        const stripped=text.replace(/create|make|add|new|a |task|to-?do|assignment|can you|please/gi,"").trim();
        const nd=parseNaturalDate(q);
        if(stripped.length>2){
          setPendingAction({type:"create_task",data:{title:stripped,priority:null,assignedTo:null,dueDate:nd}});
          reply="Creating task: "+stripped+(nd?" (due "+new Date(nd).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+")":"")+" . What priority?";
        } else {
          setPendingAction({type:"create_task",data:{title:null,priority:null,assignedTo:null,dueDate:nd}});
          reply="Sure! What should the task be called?";
        }

      // ── CREATE INVENTORY ──────────────────────────────────────────────────
      } else if(has("add item","add to inventory","new item","create item","add stock")||(has("add","create","new")&&has("item","inventory","stock","product","supply"))){
        const stripped=text.replace(/add|create|new|item|inventory|stock|product|supply|to|can you|please/gi,"").trim();
        if(stripped.length>2){
          setPendingAction({type:"create_inv",data:{name:stripped,stock:undefined}});
          reply="Adding "+stripped+" to inventory. How many in stock?";
        } else {
          setPendingAction({type:"create_inv",data:{name:null,stock:undefined}});
          reply="What item do you want to add?";
        }

      // ── CREATE ANNOUNCEMENT ───────────────────────────────────────────────
      } else if(has("announce","send announcement","post announcement","make announcement","create announcement")){
        if(!can(user,"assign")){ reply="You need Manager or above to post announcements."; }
        else {
          const stripped=text.replace(/announce|send|post|make|create|write|announcement|can you|please/gi,"").trim();
          if(stripped.length>3){
            setPendingAction({type:"create_ann",data:{msg:stripped,level:null}});
            reply="Announcement: "+stripped+". Level — info, warning, or urgent?";
          } else {
            setPendingAction({type:"create_ann",data:{msg:null,level:null}});
            reply="What do you want to announce?";
          }
        }

      // ── SEND DM ───────────────────────────────────────────────────────────
      } else if(has("send a message","send message","send dm","message to ","dm to ","text to ")){
        const em=empMatch(q);
        if(em){
          setPendingAction({type:"send_dm",data:{to:em.id,toName:em.name,msg:null}});
          reply="Messaging "+em.name+". What do you want to say?";
        } else {
          setPendingAction({type:"send_dm",data:{to:null,toName:null,msg:null}});
          reply="Who do you want to message?";
        }

      // ── FEEDBACK ──────────────────────────────────────────────────────────
      } else if(has("bug","report","broken","feature request","suggestion","feedback")){
        setPendingAction({type:"send_dm",data:{to:"TECH",toName:"Tech Admin",msg:null}});
        reply="I'll send that to the Technical Administrator. What's the issue?";

      // ── TIME / DATE ───────────────────────────────────────────────────────
      } else if(has("what time","current time","time is it","what's the time")){
        reply="It's "+timeStr2+".";
      } else if(has("what day","what date","today's date","what is today","what's today","the date")){
        reply="Today is "+todayStr+".";

      // ── DUE TODAY / THIS WEEK ─────────────────────────────────────────────
      } else if(has("remind me","snooze","remind me in","check in with me","ping me in")){
        const nm=text.match(/(\d+)\s*(hour|hr|minute|min)/i);
        const t2=taskMatch(q)||ctx.lastTask||openTasks[0];
        if(nm){
          const n=parseInt(nm[1]);
          const unit=nm[2].toLowerCase();
          const ms=unit.startsWith("h")?n*3600000:n*60000;
          const label=t2?"\""+t2.title+"\"":"check-in";
          setTimeout(()=>{ toast("⏰ Finn reminder: "+label,"ok"); haptic("medium"); playSound("notify"); },ms);
          reply="Got it — I'll remind you about "+label+" in "+n+" "+unit+(n>1?"s":"")+". ⏰";
        } else {
          reply="How long should I wait? Try: remind me in 2 hours.";
        }
      } else if(has("due today","today's tasks","what's due today")){
        const dueT=openTasks.filter(t=>{if(!t.dueDate)return false; return new Date(t.dueDate).toDateString()===now.toDateString();});
        reply=dueT.length===0?"Nothing due today.":"Due today: "+dueT.map(t=>t.title).join(", ")+".";
      } else if(has("due this week","this week's tasks","due soon","coming up")){
        const dueW=openTasks.filter(t=>{if(!t.dueDate)return false; const d=new Date(t.dueDate); return d>=now&&d<=new Date(now.getTime()+7*86400000);});
        reply=dueW.length===0?"Nothing due this week.":"Due this week: "+dueW.map(t=>t.title+" ("+new Date(t.dueDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})+")").join(", ")+".";

      // ── TASKS INFO ────────────────────────────────────────────────────────
      } else if(has("overdue","past due","late tasks","missed deadline")){
        if(overdueTasks.length===0) reply="No overdue tasks. You're ahead. ✅";
        else reply=overdueTasks.length+" overdue: "+overdueTasks.map(t=>t.title).join(", ")+".";
      } else if(has("list tasks","show tasks","show my tasks","what are my tasks","what tasks do i have")||( has("my tasks","all tasks")&&!has("complete","finish","mark","done"))){
        if(openTasks.length===0) reply="No open tasks right now.";
        else reply="Your tasks:\n"+openTasks.map((t,i)=>(i+1)+". "+t.title+" ["+t.priority+"]"+(t.dueDate?" · "+new Date(t.dueDate).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}):"")).join("\n");
      } else if(has("what should i do","next task","where do i start","what to do","suggest","recommend","what's first")){
        if(overdueTasks.length>0) reply="Start with: "+overdueTasks[0].title+" — overdue.";
        else if(highPri.length>0) reply="Next: "+highPri[0].title+" — high priority.";
        else if(openTasks.length>0) reply="Work on: "+openTasks[0].title+".";
        else reply="No open tasks. All clear! ✅";
      } else if(has("how many tasks","task count","tasks open")){
        reply=openTasks.length+" open: "+overdueTasks.length+" overdue, "+highPri.length+" high priority.";
      } else if(has("high priority","urgent tasks","important tasks")){
        if(highPri.length===0) reply="No high priority tasks right now.";
        else reply=highPri.length+" high priority: "+highPri.map(t=>t.title).join(", ")+".";
      } else if(has("completed tasks","finished tasks","done tasks","how many done")){
        reply=doneTasks.length+" completed. This week: "+thisWeek+", last week: "+lastWeek+".";

      // ── TEAM TASKS (manager) ──────────────────────────────────────────────
      } else if(isMgr&&has("all tasks","team tasks","everyone's tasks","what's open","all open")){
        if(allOpenTasks.length===0) reply="No open tasks across the team.";
        else reply="Team — "+allOpenTasks.length+" open:\n"+allOpenTasks.slice(0,6).map((t,i)=>{
          const a=t.assignedTo==="all"?"Everyone":emps.find(e=>e.id===t.assignedTo)?.name||"Unknown";
          return (i+1)+". "+t.title+" ["+t.priority+"] → "+a;
        }).join("\n")+(allOpenTasks.length>6?" +"+(allOpenTasks.length-6)+" more":"");

      // ── INVENTORY INFO ────────────────────────────────────────────────────
      } else if(has("low stock","running low","what's low","low inventory")){
        if(lowInv.length===0) reply="All items stocked. 👍";
        else reply=lowInv.length+" low: "+lowInv.map(i=>i.name+" ("+i.stock+")").join(", ")+".";
      } else if(has("out of stock","what's out","empty stock")){
        if(outInv.length===0) reply="Nothing out of stock.";
        else reply="Out of stock: "+outInv.map(i=>i.name).join(", ")+".";
      } else if(has("what should we order","restock list","order list")){
        const rs=[...outInv,...lowInv.filter(i=>!outInv.find(o=>o.id===i.id))];
        reply=rs.length===0?"Nothing needs restocking.":"Restock list:\n"+rs.map((i,idx)=>(idx+1)+". "+i.name+" — "+i.stock+" left"+(i.stock===0?" (OUT)":"")).join("\n");
      } else if(has("inventory","stock summary","items we have")){
        reply=inv.length+" items. "+outInv.length+" out, "+lowInv.length+" low.";

      // ── MESSAGES ──────────────────────────────────────────────────────────
      } else if(has("unread messages","unread dms","new messages","do i have messages")){
        reply=unreadDMs===0?"No unread messages.":unreadDMs+" unread.";
      } else if(has("messages sent","how many messages","dms sent")){
        reply="Sent "+sentDMs+" message"+(sentDMs>1?"s":"")+"."+(sentDMs===0?" Each DM earns 5 XP!":"");

      // ── XP & LEVELS ───────────────────────────────────────────────────────
      } else if(has("my xp","my level","my rank","my title","my progress","how much xp","what level","xp stats")){
        if(!isXP) reply="Your role doesn't earn XP.";
        else reply="Level "+myProg.level+" — "+myProg.title+". "+myProg.xp+" XP. "+myLvInfo.xpToNext+" to "+(myLvInfo.next?.title||"max")+".";
      } else if(has("my streak","login streak","day streak")){
        if(!isXP) reply="Streaks aren't tracked for your role.";
        else if(myProg.streak===0) reply="No streak yet. Log in daily — 10 XP/day.";
        else reply=myProg.streak+"-day streak! 🔥";
      } else if(has("earn xp","how to earn","get xp","xp tips")){
        reply="XP: Login=10, Task=25, High priority task=50, DM=5.";
      } else if(has("next level","level up","how close","xp to next")){
        if(!isXP) reply="XP isn't tracked for your role.";
        else if(!myLvInfo.next) reply="Max level — Top Contributor. 🏆";
        else reply=myLvInfo.xpToNext+" XP to "+myLvInfo.next.title+" ("+myLvInfo.pct+"% there).";
      } else if(has("leaderboard","top xp","who's winning","xp ranking")){
        const ranked=emps.filter(e=>XP_ELIGIBLE_ROLES.includes(e.role)).map(e=>({name:e.name,xp:(progress[e.id]||{}).xp||0})).sort((a,b)=>b.xp-a.xp).slice(0,5);
        reply=ranked.length===0?"No XP data yet.":ranked.map((e,i)=>(i+1)+". "+e.name+" — "+e.xp+" XP").join("\n");
      } else if(has("employee of the month","eotm","who's leading","who is leading")){
        const eligible=emps.filter(e=>XP_ELIGIBLE_ROLES.includes(e.role));
        const top=eligible.map(e=>({...e,xp:(progress[e.id]||{}).xp||0})).sort((a,b)=>b.xp-a.xp)[0];
        if(!top) reply="No XP data yet.";
        else { const lv=getLevelInfo(top.xp); reply="⭐ "+top.name+" — "+lv.title+", "+top.xp+" XP."; }

      // ── PERFORMANCE ───────────────────────────────────────────────────────
      } else if(has("my week","this week","weekly summary","recap")){
        const p=[];
        p.push(thisWeek+" task"+(thisWeek>1?"s":"")+" completed");
        if(overdueTasks.length>0) p.push(overdueTasks.length+" overdue");
        if(isXP) p.push(myProg.xp+" XP");
        if(unreadDMs>0) p.push(unreadDMs+" unread messages");
        reply="This week: "+p.join(", ")+".";
      } else if(has("improve","tips","advice","how to get better","boost")){
        const tips=[];
        if(overdueTasks.length>0) tips.push("Clear "+overdueTasks.length+" overdue task"+(overdueTasks.length>1?"s":""));
        if(highPri.length>0) tips.push("Finish "+highPri.length+" high priority task"+(highPri.length>1?"s":""));
        if(sentDMs===0) tips.push("Send a DM — earns 5 XP");
        if(isXP&&myProg.streak<3) tips.push("Log in daily to build your streak");
        if(lowInv.length>0) tips.push("Restock "+lowInv.length+" item"+(lowInv.length>1?"s":""));
        if(tips.length===0) tips.push("Looking solid — keep it up");
        reply=tips.map((t,i)=>(i+1)+". "+t).join("\n");
      } else if(has("what's left","unfinished","pending tasks","not done")){
        if(openTasks.length===0) reply="All clear! ✅";
        else reply="Open: "+openTasks.slice(0,5).map(t=>t.title).join(", ")+(openTasks.length>5?" +"+(openTasks.length-5)+" more":"")+".";

      // ── TEAM ──────────────────────────────────────────────────────────────
      } else if(has("who's online","who is online","online now","who's on","who's working")){
        const online=emps.filter(e=>e.status==="online"&&e.id!==user?.id);
        reply=online.length===0?"No one else online.":"Online: "+online.map(e=>e.name).join(", ")+".";
      } else if(has("how many people","team size","staff count","how many employees")){
        reply=emps.length+" team members.";

      // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────
      } else if(has("any announcements","what's new","any news","latest update")){
        const active=anns.filter(a=>!(a.dismissed||[]).includes(user?.id));
        if(active.length===0) reply="No active announcements.";
        else reply=active.length+" announcement"+(active.length>1?"s":"")+": "+active.slice(0,2).map(a=>a.msg.slice(0,60)).join(" | ")+".";

      // ── DIRECT NAME MENTION ───────────────────────────────────────────────
      } else if(empMatch(q)&&q.split(" ").length<=4&&!has("task","assign","dm","message","send")){
        const em=empMatch(q);
        reply=em.name+" is "+(em.status==="online"?"online right now":"currently offline")+". Want to send them a message?";

      // ── ABOUT ─────────────────────────────────────────────────────────────
      } else if(has("who are you","what are you","about finn","what is finn","introduce yourself")){
        reply="Finn Atlas — on-device, no internet needed. I run directly on your device and handle everything: tasks, inventory, XP, messages, and navigation. Switch to ☁️ Aether for full AI.";
      } else if(has("what model","which model","what ai","what engine","how do you work","what powers you","are you ai","are you gpt","are you claude","are you chatgpt","what are you running")){
        reply="Finn Atlas — built-in, always available, zero internet required. I run on-device, not in the cloud. For Llama 3.3 70B AI, tap ☁️ Aether.";
      } else if(has("who am i","my name","my role","about me","my account")){
        reply="You're "+user?.name+", "+ROLES[user?.role]?.label+" at MNU Neer Locker."+(isXP?" Level "+myProg.level+" ("+myProg.title+"), "+myProg.xp+" XP.":"");

      // ── HELP ──────────────────────────────────────────────────────────────
      } else if(has("help","what can you do","commands","capabilities")){
        reply="Here's what I can do:\n1. Tasks — view, create, complete, assign, edit, bulk complete\n2. Inventory — stock, add items, adjust counts\n3. Messages — unread, send DM\n4. Announcements — view, create, dismiss\n5. XP — stats, streak, leaderboard, weekly review\n6. Performance — how am I doing, end of shift wrap-up\n7. Settings — dark mode, status, layout\n8. Navigate — say: take me to tasks\n9. Dates — say: due Friday, due tomorrow, due next week\n\nJust talk naturally.";

      // ── AGREED / REACTIONS ────────────────────────────────────────────────
      } else {
        const hints=[];
        if(overdueTasks.length>0) hints.push(overdueTasks.length+" overdue");
        if(unreadDMs>0) hints.push(unreadDMs+" unread");
        if(lowInv.length>0) hints.push(lowInv.length+" low stock");
        const fallbacks=[
          "Not sure I caught that, "+nick+". Try: tasks, inventory, XP, or just chat!",
          "Could you rephrase? I can help with tasks, messages, XP, inventory, and more.",
          "Hmm, not quite. Say help for a full list.",
        ];
        reply=fallbacks[Math.floor(Math.random()*fallbacks.length)]+(hints.length>0?" Heads up: "+hints.join(", ")+".":"");
      }

    } catch(err){
      reply="Something went wrong on my end. Try again! ("+err.message+")";
    }

    if(!reply) reply="I'm here, "+nick+"! What do you need?";
    setTimeout(()=>{
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
      setLoading(false);
      speakReply(reply);
    },280);
  }


  return (
    <div style={{position:"fixed",bottom:0,right:0,width:"min(420px,100vw)",height:"min(600px,90vh)",zIndex:9999,display:"flex",flexDirection:"column",background:T.surf,border:`1px solid ${T.bor}`,borderRadius:"18px 18px 0 0",boxShadow:"0 -8px 40px rgba(0,0,0,.22), 0 0 60px #1e7fa808",animation:"finnSlideUp .45s cubic-bezier(.23,1,.32,1) both",animationDelay:"0.05s"}}>
      {/* Subtle glow border */}
      <div style={{position:"absolute",inset:0,borderRadius:"18px 18px 0 0",boxShadow:"inset 0 0 0 1px #1e7fa822, inset 0 1px 0 #C8102E33",pointerEvents:"none",zIndex:10}}/>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:`1px solid ${T.bor}`,background:"linear-gradient(135deg,#0a1e36 0%,#0f2744 60%,#0d1f38 100%)",borderRadius:"18px 18px 0 0",flexShrink:0,position:"relative",overflow:"hidden"}}>
        {/* Header glow */}
        <div style={{position:"absolute",top:-20,right:40,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,#C8102E22 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:-20,left:60,width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,#1e7fa822 0%,transparent 70%)",pointerEvents:"none"}}/>
        <FinnLogo/>
        <div style={{flex:1,position:"relative",zIndex:1,minWidth:0}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:"-0.3px"}}>Finn</div>
          <div style={{fontSize:10,color:"#1e7fa8",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:3}}>
              {useGroq?(<><svg width="11" height="9" viewBox="0 0 20 14" fill="#1e7fa8"><path d="M16.5 6.5a3.5 3.5 0 0 0-3.4-3.5A5 5 0 0 0 4 6a3 3 0 0 0 .5 5.9h11.5a3 3 0 0 0 .5-5.4z"/></svg><span>Finn Aether · Llama 3.3 70B</span></>):(<><svg width="11" height="11" viewBox="0 0 16 16" fill="#1e7fa8"><rect x="4" y="4" width="8" height="8" rx="1.5"/><rect x="6.5" y="1" width="1.5" height="3"/><rect x="9" y="1" width="1.5" height="3"/><rect x="6.5" y="12" width="1.5" height="3"/><rect x="9" y="12" width="1.5" height="3"/><rect x="1" y="6.5" width="3" height="1.5"/><rect x="1" y="9" width="3" height="1.5"/><rect x="12" y="6.5" width="3" height="1.5"/><rect x="12" y="9" width="3" height="1.5"/></svg><span>Finn Atlas · On-Device</span></>)}
            </div>
        </div>
        {/* Mode toggle */}
        <div style={{display:"flex",background:"rgba(0,0,0,0.3)",borderRadius:10,padding:2,border:"1px solid #1e7fa833",gap:2,flexShrink:0,position:"relative",zIndex:1}}>
          <button onClick={()=>{setUseGroq(true);LS.set("nl3-finn-mode","aether");haptic("light");toast("Switched to Finn Aether ✦");}} style={{background:useGroq?"#1e7fa8":"none",color:useGroq?"#fff":"#1e7fa888",border:"none",borderRadius:8,padding:"4px 8px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",whiteSpace:"nowrap"}}>
            <svg width="13" height="10" viewBox="0 0 20 14" fill="currentColor" style={{marginRight:3,verticalAlign:"middle",flexShrink:0}}>
                <path d="M16.5 6.5a3.5 3.5 0 0 0-3.4-3.5A5 5 0 0 0 4 6a3 3 0 0 0 .5 5.9h11.5a3 3 0 0 0 .5-5.4z"/>
              </svg>Aether
          </button>
          <button onClick={()=>{setUseGroq(false);LS.set("nl3-finn-mode","atlas");haptic("light");toast("Switched to Finn Atlas ◈");}} style={{background:!useGroq?"#C8102E":"none",color:!useGroq?"#fff":"#C8102E88",border:"none",borderRadius:8,padding:"4px 8px",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",whiteSpace:"nowrap"}}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{marginRight:3,verticalAlign:"middle",flexShrink:0}}>
                <rect x="4" y="4" width="8" height="8" rx="1.5"/>
                <rect x="6.5" y="1" width="1.5" height="3"/><rect x="9" y="1" width="1.5" height="3"/>
                <rect x="6.5" y="12" width="1.5" height="3"/><rect x="9" y="12" width="1.5" height="3"/>
                <rect x="1" y="6.5" width="3" height="1.5"/><rect x="1" y="9" width="3" height="1.5"/>
                <rect x="12" y="6.5" width="3" height="1.5"/><rect x="12" y="9" width="3" height="1.5"/>
              </svg>Atlas
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1}}>
          <div style={{background:"#1e7fa822",border:"1px solid #1e7fa844",borderRadius:6,padding:"2px 7px",fontSize:10,color:"#1e7fa8",fontWeight:700,letterSpacing:"0.04em"}}>v{FINN_VERSION}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#ffffff66",fontSize:20,cursor:"pointer",padding:"4px 8px",borderRadius:8,fontFamily:"inherit",lineHeight:1,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="#fff"}
            onMouseLeave={e=>e.currentTarget.style.color="#ffffff66"}
          >✕</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 8px",display:"flex",flexDirection:"column",gap:10,background:T.dark?"#0a0608":"#fafafa"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row",animation:"fadeUp .2s ease both"}}>
            {m.role==="assistant"&&(
              <div style={{filter:"drop-shadow(0 0 6px #1e7fa844)",flexShrink:0}}>
                <FinnLogo/>
              </div>
            )}
            {m.role==="user"&&(
              <div style={{width:28,height:28,borderRadius:"50%",background:ROLES[user?.role]?.color+"33",border:`2px solid ${ROLES[user?.role]?.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:ROLES[user?.role]?.color,flexShrink:0}}>
                {user?.name?.[0]||"?"}
              </div>
            )}
            <div style={{maxWidth:"78%",background:m.role==="user"?"#0f2744":T.surf,color:m.role==="user"?"#fff":T.txt,borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",fontSize:13,lineHeight:1.6,border:`1px solid ${m.role==="user"?"#1e7fa833":T.bor}`,boxShadow:m.role==="assistant"?"0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #1e7fa808":m.role==="user"?"0 0 12px #1e7fa822":"none",whiteSpace:"pre-wrap"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{filter:"drop-shadow(0 0 8px #1e7fa866)"}}><FinnLogo/></div>
            <div style={{background:T.surf,borderRadius:"18px 18px 18px 4px",padding:"11px 16px",border:`1px solid ${T.bor}`,display:"flex",gap:6,alignItems:"center",boxShadow:"0 0 12px #1e7fa811"}}>
              <span style={{fontSize:11,color:"#1e7fa8",fontWeight:700,letterSpacing:"0.04em",marginRight:4}}>Processing</span>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#1e7fa8",animation:`pulse 1s ${i*200}ms ease-in-out infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Pending action indicator */}
      {pendingAction&&(
        <div style={{padding:"6px 14px",background:"#1e7fa811",borderTop:`1px solid #1e7fa822`,fontSize:11,color:"#1e7fa8",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Creating {pendingAction.type==="create_task"?"task":pendingAction.type==="create_inv"?"inventory item":pendingAction.type==="create_ann"?"announcement":"DM"}…</span>
          <button onClick={()=>{setPendingAction(null);addMsg("assistant","Cancelled.");}} style={{background:"none",border:"none",color:"#1e7fa8",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>Cancel</button>
        </div>
      )}

      {/* Input */}
      <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${T.bor}`,display:"flex",gap:8,flexShrink:0,background:T.surf}}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder={pendingAction?"Type your answer…":"Ask Finn anything…"}
          style={{flex:1,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:12,padding:"10px 14px",fontSize:13,fontFamily:"inherit",color:T.txt,outline:"none",transition:"border-color .15s,box-shadow .15s"}}
          onFocus={e=>{e.target.style.borderColor="#1e7fa8";e.target.style.boxShadow="0 0 0 3px #1e7fa811";}}
          onBlur={e=>{e.target.style.borderColor=T.bor;e.target.style.boxShadow="none";}}
        />
        {/* Mic button */}
        <button onClick={()=>{
            LS.set("nl3-mic-used",true);
            startListening();
          }} title={listening?"Stop":"Talk to Finn"}
          style={{background:listening?"#ef4444":voiceOn?"#1e7fa822":"none",border:"1px solid "+(listening?"#ef4444":voiceOn?"#1e7fa844":T.bor),borderRadius:10,padding:"8px 10px",cursor:"pointer",color:listening?"#fff":voiceOn?"#1e7fa8":T.mut,fontSize:16,transition:"all .2s",flexShrink:0}}
        >{listening?"⏹":"🎤"}</button>
        {/* Voice on/off */}
        <button onClick={()=>{const next=!voiceOn;setVoiceOn(next);LS.set("nl3-finn-voice",next);if(next){const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);const isPWA=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;if(isIOS&&isPWA)toast("Voice output will work but mic may not in iOS home screen apps","warn");}if(!next){window.speechSynthesis.cancel();setSpeaking(false);}haptic("light");}}
          title={voiceOn?"Voice on":"Voice off"}
          style={{background:voiceOn?"#1e7fa822":"none",border:"1px solid "+(voiceOn?"#1e7fa844":T.bor),borderRadius:10,padding:"8px 10px",cursor:"pointer",color:voiceOn?"#1e7fa8":T.faint,fontSize:14,transition:"all .2s",flexShrink:0}}
        >{voiceOn?"🔊":"🔇"}</button>
        {speaking&&(
          <div style={{position:"absolute",bottom:70,left:"50%",transform:"translateX(-50%)",background:T.surf,border:"1px solid #1e7fa844",borderRadius:20,padding:"4px 14px",fontSize:11,color:"#1e7fa8",fontWeight:700,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,.1)",display:"flex",alignItems:"center",gap:6,zIndex:10}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#1e7fa8",animation:"pulse 1s infinite"}}/>Finn is speaking...
          </div>
        )}
        <button onClick={send} disabled={loading||!input.trim()}
          style={{background:"linear-gradient(135deg,#0f2744,#1a3a5c)",border:"1px solid #1e7fa833",borderRadius:12,padding:"10px 14px",cursor:loading||!input.trim()?"not-allowed":"pointer",opacity:loading||!input.trim()?0.5:1,color:"#fff",fontWeight:700,fontSize:13,fontFamily:"inherit",transition:"opacity .15s,box-shadow .15s",boxShadow:"0 0 0 0 #1e7fa8"}}
          onMouseEnter={e=>{if(!loading&&input.trim())e.currentTarget.style.boxShadow="0 0 12px #1e7fa844";}}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 0 0 0 #1e7fa8"}
        >Send</button>
      </div>
      {/* Groq official badge — inlined SVG */}
      {useGroq&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"6px 0 5px",borderTop:"1px solid "+T.bor+"33"}}>
          <a href="https://groq.com" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:0,opacity:0.9,transition:"opacity .15s",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=1}
            onMouseLeave={e=>e.currentTarget.style.opacity=0.9}
          >
            {/* "Powered by" text */}
            <span style={{fontSize:9,fontWeight:500,color:T.dark?"#aaa":"#666",letterSpacing:"0.04em",marginRight:5,fontFamily:"sans-serif"}}>Powered by</span>
            {/* Groq logo SVG — official wordmark */}
            <svg height="14" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* G */}
              <path d="M11.5 4C7.36 4 4 7.36 4 11.5C4 15.64 7.36 19 11.5 19C15.64 19 19 15.64 19 11.5V10H11.5V12.5H16.3C15.7 14.8 13.8 16.5 11.5 16.5C9.02 16.5 7 14.48 7 12C7 9.52 9.02 7.5 11.5 7.5C12.7 7.5 13.78 7.98 14.6 8.76L16.42 6.94C15.12 5.72 13.4 5 11.5 5V4Z" fill="#F55036"/>
              <path d="M11.5 3C6.81 3 3 6.81 3 11.5C3 16.19 6.81 20 11.5 20C16.19 20 20 16.19 20 11.5V9H11.5V12H17C16.24 14.84 13.62 17 10.5 17C6.91 17 4 14.09 4 10.5C4 6.91 6.91 4 10.5 4C12.18 4 13.7 4.64 14.85 5.68L16.97 3.56C15.28 2 12.99 1 10.5 1C5.25 1 1 5.25 1 10.5C1 15.75 5.25 20 10.5 20V20C15.75 20 20 15.75 20 10.5V8H10.5V11H17.5C17.05 14.36 14.09 17 10.5 17C6.63 17 3.5 13.87 3.5 10C3.5 6.13 6.63 3 10.5 3H11.5Z" fill="#F55036"/>
              {/* r */}
              <path d="M23 9H25.5V10.5C26 9.5 27 9 28 9V11.5C26.5 11.5 25.5 12.2 25.5 14V19H23V9Z" fill={T.dark?"#fff":"#1a1a1a"}/>
              {/* o */}
              <path d="M29 14C29 11.24 31.24 9 34 9C36.76 9 39 11.24 39 14C39 16.76 36.76 19 34 19C31.24 19 29 16.76 29 14ZM36.5 14C36.5 12.62 35.38 11.5 34 11.5C32.62 11.5 31.5 12.62 31.5 14C31.5 15.38 32.62 16.5 34 16.5C35.38 16.5 36.5 15.38 36.5 14Z" fill={T.dark?"#fff":"#1a1a1a"}/>
              {/* q */}
              <path d="M41 9H43.5V10.2C44.2 9.44 45.2 9 46.4 9C48.96 9 51 11.04 51 14C51 16.96 48.96 19 46.4 19C45.22 19 44.24 18.58 43.5 17.86V22H41V9ZM48.5 14C48.5 12.62 47.38 11.5 46 11.5C44.62 11.5 43.5 12.62 43.5 14C43.5 15.38 44.62 16.5 46 16.5C47.38 16.5 48.5 15.38 48.5 14Z" fill={T.dark?"#fff":"#1a1a1a"}/>
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}


// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
function GlobalSearch({T,tasks,inv,emps,anns,onClose,setPage,user}) {
  const [filter,setFilter]=useState("all"); // all | tasks | inv | staff | anns
  const [q,setQ]=useState("");
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);

  const results=useMemo(()=>{
    if(!q.trim()) return [];
    const lq=q.toLowerCase();
    const out=[];
    if(filter==="all"||filter==="tasks") tasks.filter(t=>t.title?.toLowerCase().includes(lq)).slice(0,3).forEach(t=>
      out.push({type:"task",icon:"✅",label:t.title,sub:t.priority+" · "+(t.done?"Done":"Open"),page:"tasks",color:"#1e7fa8"}));
    if(filter==="all"||filter==="inv") inv.filter(i=>i.name?.toLowerCase().includes(lq)).slice(0,3).forEach(i=>
      out.push({type:"inv",icon:"📦",label:i.name,sub:"Stock: "+i.stock,page:"inv",color:"#7c3aed"}));
    if(filter==="all"||filter==="staff") emps.filter(e=>e.name?.toLowerCase().includes(lq)&&can(user,"emp")).slice(0,3).forEach(e=>
      out.push({type:"emp",icon:"👤",label:e.name,sub:ROLES[e.role]?.label||"",page:"set",color:ROLES[e.role]?.color||"#6b7280"}));
    if(filter==="all"||filter==="anns") anns.filter(a=>a.msg?.toLowerCase().includes(lq)).slice(0,2).forEach(a=>
      out.push({type:"ann",icon:"🔔",label:a.msg.slice(0,50)+(a.msg.length>50?"…":""),sub:"Announcement",page:"anns",color:"#C8102E"}));
    return out;
  },[q,filter,tasks,inv,emps,anns]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:9997,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80,animation:"fadeUp .15s ease both"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"min(560px,92vw)",background:T.surf,borderRadius:18,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.35)",animation:"slideUp .2s cubic-bezier(.23,1,.32,1) both"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:`1px solid ${T.bor}`}}>
          <span style={{fontSize:18,flexShrink:0}}>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search tasks, inventory, staff, announcements…"
            style={{flex:1,background:"none",border:"none",outline:"none",fontSize:16,color:T.txt,fontFamily:"inherit"}}
            onKeyDown={e=>e.key==="Escape"&&onClose()}/>
          {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,padding:"0 4px"}}>✕</button>}
        </div>
        <div style={{display:"flex",gap:6,padding:"8px 14px",borderBottom:`1px solid ${T.bor}`,overflowX:"auto",scrollbarWidth:"none"}}>
          {[["all","All"],["tasks","✅ Tasks"],["inv","📦 Inventory"],["staff","👤 Staff"],["anns","🔔 Announcements"]].map(([key,label])=>(
            <button key={key} onClick={()=>setFilter(key)} style={{background:filter===key?T.scarlet:T.surfH,color:filter===key?"#fff":T.sub,border:`1px solid ${filter===key?T.scarlet:T.bor}`,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s"}}>{label}</button>
          ))}
        </div>
        {q&&(
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {results.length===0?(
              <div style={{padding:"28px",textAlign:"center",color:T.sub,fontSize:13}}>
                No results for &quot;{q}&quot;
              </div>
            ):results.map((r,i)=>(
              <button key={i} onClick={()=>{setPage(r.page);onClose();playSound("click");}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",borderBottom:`1px solid ${T.bor}`,transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <span style={{fontSize:20,flexShrink:0}}>{r.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:1}}>{r.sub}</div>
                </div>
                <Tag label={r.type} color={r.color}/>
              </button>
            ))}
            {results.length>0&&<div style={{padding:"8px 16px",fontSize:11,color:T.faint,textAlign:"center"}}>Press Enter to search &middot; Esc to close</div>}
          </div>
        )}
        {!q&&(
          <div style={{padding:"16px"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <svg width="14" height="14" viewBox="0 0 22 22" style={{flexShrink:0}}>
                <rect width="22" height="22" rx="6" fill="#0f2744"/>
                <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
                <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
                <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
                <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
                <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
                <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
                <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
                <circle cx="11" cy="11" r="1" fill="#fff"/>
              </svg>
              FINN &mdash; QUICK NAVIGATE
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{icon:"✅",label:"Tasks",page:"tasks"},{icon:"📦",label:"Inventory",page:"inv"},{icon:"🔔",label:"Announcements",page:"anns"},{icon:"💬",label:"Messages",page:"dms"}].map(s=>(
                <button key={s.page} onClick={()=>{setPage(s.page);onClose();playSound("click");}}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit",color:T.txt,fontSize:13,fontWeight:600,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.surfH;e.currentTarget.style.borderColor=T.accent+"66";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=T.bg;e.currentTarget.style.borderColor=T.bor;}}>
                  <span style={{fontSize:18}}>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEVEL LOGO ───────────────────────────────────────────────────────────────
function LevelLogo({level,color,size=40}) {
  const shapes=["⭐","🔰","🔷","🔵","💚","💜","❤️","🧡","💙","🏆"];
  const emoji=shapes[Math.min((level||1)-1,9)];
  return (
    <div style={{width:size,height:size,borderRadius:size*0.28,background:color+"22",border:`2px solid ${color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5,boxShadow:`0 0 ${size*0.4}px ${color}44`,flexShrink:0}}>
      {emoji}
    </div>
  );
}

// ─── XP TOAST LIST ────────────────────────────────────────────────────────────
function XPToastList({items}) {
  return (
    <div style={{position:"fixed",bottom:80,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",pointerEvents:"none"}}>
      {items.map(t=>(
        <div key={t.id} style={{background:"linear-gradient(135deg,#16a34a,#15803d)",border:"1px solid #86efac",color:"#fff",borderRadius:10,padding:"7px 14px",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(0,0,0,.2)",animation:"finnSlideUp .3s cubic-bezier(.23,1,.32,1) both"}}>
          <span style={{fontSize:16}}>⚡</span>
          <span>+{t.amount} XP</span>
          {t.label&&<span style={{fontSize:11,opacity:0.85,fontWeight:600}}>· {t.label}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────
// ─── XP SHOP MODAL — spend XP on cosmetics & power-ups ───────────────────────
function XPShopModal({T,user,progress,open,onClose,onPurchase,onSpendXP}) {
  const [category,setCategory]=useState("all");
  const [purchases,setPurchases]=useState([]);
  const [loading,setLoading]=useState(true);
  const [confirming,setConfirming]=useState(null); // item being confirmed
  const [celebrating,setCelebrating]=useState(null); // just purchased

  const userXP=progress[user?.id]?.xp||0;

  // Load purchases
  useEffect(()=>{
    if(!open||!user) return;
    (async()=>{
      setLoading(true);
      const rows=await SB.select("user_purchases",`?user_id=eq.${user.id}`);
      setPurchases(rows||[]);
      setLoading(false);
    })();
  },[open,user?.id]);

  // Shop catalog
  const items=[
    // ── ACCENT COLORS ──────────────────────────────────────────────────────────
    {id:"color_teal",     cat:"colors", name:"Teal",          desc:"Cool ocean accent",           cost:400,  icon:"●", color:"#0d9488", type:"color"},
    {id:"color_indigo",   cat:"colors", name:"Indigo",        desc:"Deep focus vibes",             cost:400,  icon:"●", color:"#4f46e5", type:"color"},
    {id:"color_rose",     cat:"colors", name:"Rose",          desc:"Soft and modern",              cost:400,  icon:"●", color:"#e11d48", type:"color"},
    {id:"color_amber",    cat:"colors", name:"Amber",         desc:"Warm energy",                  cost:400,  icon:"●", color:"#d97706", type:"color"},
    {id:"color_emerald",  cat:"colors", name:"Emerald",       desc:"Fresh and vibrant",            cost:500,  icon:"●", color:"#059669", type:"color"},
    {id:"color_violet",   cat:"colors", name:"Violet",        desc:"Creative and bold",            cost:500,  icon:"●", color:"#9333ea", type:"color"},
    {id:"color_slate",    cat:"colors", name:"Slate",         desc:"Minimalist classic",           cost:300,  icon:"●", color:"#475569", type:"color"},
    {id:"color_cyan",     cat:"colors", name:"Cyan",          desc:"Electric and crisp",           cost:400,  icon:"●", color:"#0891b2", type:"color"},
    {id:"color_lime",     cat:"colors", name:"Lime",          desc:"Bright and fresh",             cost:400,  icon:"●", color:"#65a30d", type:"color"},
    {id:"color_fuchsia",  cat:"colors", name:"Fuchsia",       desc:"Bold and electric",            cost:450,  icon:"●", color:"#c026d3", type:"color"},
    {id:"color_midnight", cat:"colors", name:"Midnight",      desc:"Dark and mysterious",          cost:450,  icon:"●", color:"#1e1b4b", type:"color"},
    {id:"color_gold",     cat:"colors", name:"Gold",          desc:"Premium and prestigious",      cost:800,  icon:"●", color:"#b45309", type:"color"},
    {id:"color_rainbow",  cat:"colors", name:"Rainbow",       desc:"Animated cycling rainbow 🌈",  cost:2500, icon:"◈", color:"linear-gradient(90deg,#ef4444,#f59e0b,#10b981,#3b82f6,#a855f7)", type:"rainbow"},

    // ── POWER-UPS ──────────────────────────────────────────────────────────────
    {id:"streak_saver",   cat:"powerups", name:"Streak Saver",      desc:"Restore your lost login streak",          cost:300,  icon:E("🔥","·"),  color:"#ea580c", type:"streak_save",  consumable:true},
    {id:"xp_boost_1h",    cat:"powerups", name:"2× XP — 1 Hour",    desc:"Double XP on all tasks for 1 hour",       cost:400,  icon:E("⚡","↯"),  color:"#eab308", type:"xp_boost",     consumable:true, duration:3600000},
    {id:"xp_boost_24h",   cat:"powerups", name:"2× XP — 24 Hours",  desc:"Double XP on tasks for a full day",       cost:1200, icon:E("⚡","↯"),  color:"#ca8a04", type:"xp_boost_long",consumable:true, duration:86400000},
    {id:"xp_gift_100",    cat:"powerups", name:"100 XP Gift",        desc:"Instantly add 100 XP to your total",      cost:50,   icon:E("🎁","★"),  color:"#16a34a", type:"xp_gift",      consumable:true, amount:100},
    {id:"xp_gift_500",    cat:"powerups", name:"500 XP Gift",        desc:"Instantly add 500 XP to your total",      cost:200,  icon:E("🎁","★"),  color:"#15803d", type:"xp_gift",      consumable:true, amount:500},
    {id:"task_hint",      cat:"powerups", name:"Task Hint",          desc:"Finn gives you a priority suggestion",     cost:150,  icon:E("💡","i"),  color:"#f59e0b", type:"task_hint",    consumable:true},
    {id:"overtime_badge", cat:"powerups", name:"Overtime Badge",     desc:"Shows you put in extra work this week",   cost:200,  icon:E("💪","◉"),  color:"#7c3aed", type:"badge",         consumable:false},

    // ── BADGES ─────────────────────────────────────────────────────────────────
    {id:"badge_pioneer",  cat:"badges", name:"Pioneer",       desc:"For the early adopters",       cost:800,  icon:E("🚀","▲"), color:"#6366f1", type:"badge"},
    {id:"badge_legend",   cat:"badges", name:"Legend",        desc:"Top performer status",         cost:2000, icon:E("👑","♛"), color:"#eab308", type:"badge"},
    {id:"badge_sparkle",  cat:"badges", name:"Sparkle Trail", desc:"Sparkles on your profile",     cost:1500, icon:E("✨","★"), color:"#a855f7", type:"badge"},
    {id:"badge_goat",     cat:"badges", name:"G.O.A.T.",      desc:"Greatest of all time",         cost:5000, icon:E("🐐","◆"), color:"#0d9488", type:"badge"},
    {id:"badge_mnu",      cat:"badges", name:"MNU Pride",     desc:"Show your school spirit",      cost:600,  icon:E("🎓","◈"), color:"#C8102E", type:"badge"},
    {id:"badge_grinder",  cat:"badges", name:"Grinder",       desc:"You never stop working",       cost:1000, icon:E("⚙️","◎"), color:"#374151", type:"badge"},
    {id:"badge_nightowl", cat:"badges", name:"Night Owl",     desc:"Working late hours",           cost:700,  icon:E("🦉","◉"), color:"#1e1b4b", type:"badge"},
    {id:"badge_streak7",  cat:"badges", name:"7-Day Streak",  desc:"Logged in 7 days straight",    cost:400,  icon:E("🔥","·"), color:"#ea580c", type:"badge"},
    {id:"badge_streak30", cat:"badges", name:"30-Day Streak", desc:"A full month of dedication",   cost:1500, icon:E("🏆","◆"), color:"#b45309", type:"badge"},

    // ── PROFILE ────────────────────────────────────────────────────────────────
    {id:"pfp_custom",      cat:"profile", name:"Custom Profile Pic",  desc:"Upload your own · saved to cloud",     cost:0,    icon:E("📸","◎"), color:T.accent,   type:"pfp",   free:true},
    {id:"pfp_frame_gold",  cat:"profile", name:"Gold Frame",          desc:"Gold border around your avatar",       cost:1000, icon:E("🖼","◎"), color:"#eab308",  type:"frame"},
    {id:"pfp_frame_scarlet",cat:"profile",name:"Scarlet Frame",       desc:"MNU scarlet border",                   cost:800,  icon:E("🖼","◎"), color:"#C8102E",  type:"frame"},
    {id:"pfp_frame_blue",  cat:"profile", name:"Blue Frame",          desc:"Cool blue border",                     cost:600,  icon:E("🖼","◎"), color:"#1e7fa8",  type:"frame"},
    {id:"pfp_frame_rainbow",cat:"profile",name:"Rainbow Frame",       desc:"Animated rainbow border",              cost:3000, icon:E("🌈","◎"), color:"#ec4899",  type:"frame"},
    {id:"name_color",      cat:"profile", name:"Custom Name Color",   desc:"Your name glows in your accent color", cost:500,  icon:E("✍","◎"),  color:T.accent,   type:"name_color"},

    // ── FUN / EFFECTS ──────────────────────────────────────────────────────────
    {id:"fun_confetti",    cat:"fun", name:"Task Confetti",      desc:"Confetti when you complete tasks",       cost:700,  icon:E("🎊","✦"), color:"#ec4899", type:"confetti"},
    {id:"fun_sound_pack",  cat:"fun", name:"Premium Sounds",     desc:"Richer sound effects throughout",        cost:900,  icon:E("🔊","♪"), color:"#0891b2", type:"sounds"},
    {id:"fun_dark_aura",   cat:"fun", name:"Dark Aura",          desc:"Subtle glow effect in dark mode",        cost:1200, icon:E("🌑","●"), color:"#1e1b4b", type:"aura"},
    {id:"fun_finn_skin",   cat:"fun", name:"Finn Gold Skin",     desc:"Finn button turns gold",                 cost:2000, icon:E("🤖","⬡"), color:"#b45309", type:"finn_skin"},
    {id:"fun_compact_xp",  cat:"fun", name:"XP Multiplier Tag",  desc:"Shows ×2 badge on your leaderboard row",cost:800,  icon:E("✖","×"),  color:"#7c3aed", type:"badge"},
    {id:"fun_title_custom",cat:"fun", name:"Custom Rank Title",  desc:"Replace your rank title with any word",  cost:2500, icon:E("🏷","≡"),  color:"#0d9488", type:"custom_title"},
    {id:"fun_fireworks",   cat:"fun", name:"Level-Up Fireworks", desc:"Fireworks animation when you level up",  cost:600,  icon:E("🎆","✦"), color:"#dc2626", type:"fireworks"},
  ];;

  const owned=id=>purchases.some(p=>p.item_id===id&&!p.consumed);
  const filtered=category==="all"?items:items.filter(i=>i.cat===category);
  const cats=[
    {key:"all",     label:"All",       icon:E("🛍","◇")},
    {key:"colors",  label:"Colors",    icon:E("🎨","●")},
    {key:"powerups",label:"Power-ups", icon:E("⚡","↯")},
    {key:"badges",  label:"Badges",    icon:E("🏅","♛")},
    {key:"profile", label:"Profile",   icon:E("👤","◎")},
    {key:"fun",     label:"Fun",       icon:E("✨","★")},
  ];

  const buy=async(item)=>{
    if(item.free){
      setConfirming(null);
      onPurchase&&onPurchase(item);
      onClose();
      return;
    }
    if(userXP<item.cost){ playSound("warn"); return; }
    // Deduct XP
    const pg=progress[user.id]||{xp:0,level:1,title:"Pioneer",streak:0};
    const newXP=pg.xp-item.cost;
    const info=getLevelInfo(newXP);
    // Keep highest title — spending XP never demotes rank
    // pg.max_xp may be undefined on first spend so fall back to the pre-purchase xp (pg.xp)
    const highestEverXP=Math.max(pg.xp||0, pg.max_xp||0); // highest XP ever earned
    const keepInfo=getLevelInfo(highestEverXP); // title/level from highest ever
    const keepLevel=keepInfo.level; const keepTitle=keepInfo.title;
    await SB.upsert("user_progress",{user_id:user.id,xp:newXP,max_xp:highestEverXP,level:keepLevel,title:keepTitle,streak:pg.streak||0,last_login:pg.last_login||""});
    // Update local progress state immediately so UI reflects new XP
    onSpendXP&&onSpendXP(user.id,{xp:newXP,max_xp:highestEverXP,level:keepLevel,title:keepTitle,streak:pg.streak||0,last_login:pg.last_login||""});
    // Record purchase
    await SB.upsert("user_purchases",{
      id:uid(),
      user_id:user.id,
      item_id:item.id,
      item_name:item.name,
      cost:item.cost,
      consumed:false,
      purchased_at:Date.now(),
    });
    setPurchases(p=>[...p,{item_id:item.id,user_id:user.id,consumed:false}]);
    playSound("success");
    haptic&&haptic("heavy");
    setCelebrating(item);
    onPurchase&&onPurchase(item);
    setTimeout(()=>setCelebrating(null),1800);
    setConfirming(null);
  };

  if(!open) return null;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:800,padding:"24px 16px",animation:"fadeUp .25s ease both"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?20:18,width:"100%",maxWidth:620,maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"tourCardIn .35s cubic-bezier(.34,1.56,.64,1) both",boxShadow:"0 20px 60px rgba(0,0,0,.5)",overflowY:"hidden",overflowX:"visible"}}>
        {/* Header */}
        <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${T.bor}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:T.minimal?19:18,fontWeight:T.minimal?600:800,color:T.txt,display:"flex",alignItems:"center",gap:8,fontFamily:T.minimal?"'Google Sans',sans-serif":"'Clash Display',sans-serif",letterSpacing:"-0.3px"}}>
              <span style={{fontSize:22}}>{E("🛍","◇")}</span> XP Shop
            </div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>Spend your XP on cosmetics and power-ups</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{background:T.accent+"18",border:`1px solid ${T.accent}44`,borderRadius:9999,padding:"6px 14px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>{E("⭐","★")}</span>
              <span style={{fontWeight:800,color:T.accent,fontSize:14}}>{userXP.toLocaleString()}</span>
              <span style={{fontSize:10,color:T.sub,fontWeight:600}}>XP</span>
            </div>
            <button onClick={onClose} style={{background:T.surfH,border:`1px solid ${T.bor}`,color:T.txt,width:32,height:32,borderRadius:"50%",fontSize:18,cursor:"pointer",fontFamily:"inherit"}}>×</button>
          </div>
        </div>
        {/* Category tabs */}
        <div style={{padding:"10px 18px 10px",borderBottom:`1px solid ${T.bor}`,display:"flex",gap:8,overflowX:"auto",overflowY:"visible",background:T.surfH,flexShrink:0,minHeight:52}}>
          {cats.map(c=>(
            <button key={c.key} onClick={()=>{setCategory(c.key);playSound("click");}}
              style={{background:category===c.key?T.accent:T.bg,color:category===c.key?"#fff":T.txt,border:`2px solid ${category===c.key?T.accent:T.bor}`,borderRadius:9999,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s",boxShadow:category===c.key?`0 2px 8px ${T.accent}44`:"none",letterSpacing:T.minimal?"-0.1px":"normal"}}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {/* Items grid */}
        <div style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:"16px 18px",minHeight:0}}>
          {loading?(
            <div style={{padding:40,textAlign:"center",color:T.sub,fontSize:13}}>Loading shop…</div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
              {filtered.map(item=>{
                const isOwned=owned(item.id);
                const canAfford=userXP>=item.cost;
                const isFree=item.free;
                return (
                  <div key={item.id} style={{background:T.surfH,border:`1px solid ${isOwned?T.ok+"66":T.bor}`,borderRadius:T.minimal?12:10,padding:12,display:"flex",flexDirection:"column",gap:8,position:"relative",overflow:"hidden"}}>
                    {isOwned&&!item.consumable&&<div style={{position:"absolute",top:6,right:6,background:T.ok,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:9999,letterSpacing:"0.04em",zIndex:1}}>OWNED</div>}
                    {item.consumable&&!isOwned&&<div style={{position:"absolute",top:6,right:6,background:T.warn+"33",color:T.warn,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:9999,zIndex:1}}>USE ONCE</div>}
                    {item.consumable&&isOwned&&<div style={{position:"absolute",top:6,right:6,background:"#ef444420",color:"#ef4444",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:9999,zIndex:1}}>USED</div>}
                    {/* Icon */}
                    <div style={{width:48,height:48,borderRadius:item.type==="color"||item.type==="rainbow"?"50%":10,background:item.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:item.type==="color"?0:22,color:"#fff",boxShadow:`0 2px 8px ${(item.color||"").startsWith("#")?item.color+"44":"rgba(0,0,0,.2)"}`,margin:"4px 0"}}>
                      {item.type!=="color"&&item.type!=="rainbow"&&item.icon}
                    </div>
                    {/* Name */}
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.txt,marginBottom:2,letterSpacing:T.minimal?"-0.15px":"normal"}}>{item.name}</div>
                      <div style={{fontSize:11,color:T.sub,lineHeight:1.4}}>{item.desc}</div>
                    </div>
                    {/* Cost + buy */}
                    <div style={{marginTop:"auto",paddingTop:6}}>
                      {isFree?(
                        <button onClick={()=>buy(item)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Upload →</button>
                      ):isOwned&&!item.consumable?(
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          <div style={{width:"100%",background:T.ok+"18",color:T.ok,border:`1.5px solid ${T.ok}55`,borderRadius:9999,padding:"6px 12px",fontSize:11,fontWeight:700,textAlign:"center"}}>✓ Owned</div>
                          {item.type==="color"&&<button onClick={()=>{playSound("click");onPurchase&&onPurchase(item);}} style={{width:"100%",background:"none",color:T.accent,border:`1px solid ${T.accent}55`,borderRadius:9999,padding:"5px 12px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Apply Color →</button>}
                        </div>
                      ):isOwned&&item.consumable?(
                        <div style={{width:"100%",background:"#ef444415",color:"#ef4444",border:"1.5px solid #ef444455",borderRadius:9999,padding:"6px 12px",fontSize:11,fontWeight:700,textAlign:"center"}}>Used</div>
                      ):(
                        <button onClick={()=>canAfford?setConfirming(item):null}
                          disabled={!canAfford}
                          style={{width:"100%",background:canAfford?T.accent:T.bor,color:canAfford?"#fff":T.sub,border:"none",borderRadius:9999,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:canAfford?"pointer":"not-allowed",fontFamily:"inherit",opacity:canAfford?1:0.6,transition:"opacity .15s"}}>
                          {item.cost} XP {canAfford?"→":"— need more XP"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Confirm purchase overlay */}
        {confirming&&(
          <div onClick={()=>setConfirming(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeUp .2s ease both"}}>
            <div onClick={e=>e.stopPropagation()} style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:16,padding:24,maxWidth:340,width:"90%",textAlign:"center",animation:"tourCardIn .3s cubic-bezier(.34,1.56,.64,1) both"}}>
              <div style={{fontSize:36,marginBottom:10}}>{confirming.icon}</div>
              <div style={{fontWeight:700,fontSize:17,color:T.txt,marginBottom:4}}>{confirming.name}</div>
              <div style={{fontSize:12,color:T.sub,marginBottom:14,lineHeight:1.5}}>{confirming.desc}</div>
              <div style={{background:T.accent+"12",border:`1px solid ${T.accent}44`,borderRadius:10,padding:"8px 14px",marginBottom:14,fontSize:12,color:T.txt}}>Spend <strong style={{color:T.accent}}>{confirming.cost} XP</strong>? You'll have <strong>{(userXP-confirming.cost).toLocaleString()}</strong> left.</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setConfirming(null)} style={{flex:1,background:"none",color:T.sub,border:`1px solid ${T.bor}`,borderRadius:9999,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={()=>buy(confirming)} style={{flex:1.4,background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirm Purchase</button>
              </div>
            </div>
          </div>
        )}
        {/* Celebration overlay */}
        {celebrating&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <div style={{background:T.surf,border:`2px solid ${T.accent}`,borderRadius:16,padding:"28px 40px",textAlign:"center",animation:"tourIconPop .45s cubic-bezier(.34,1.85,.64,1)"}}>
              <div style={{fontSize:48,marginBottom:8}}>{E("🎉","★")}</div>
              <div style={{fontWeight:800,color:T.txt,fontSize:17,marginBottom:4}}>{celebrating.name} unlocked!</div>
              <div style={{fontSize:12,color:T.sub}}>Enjoy!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage({emps,progress,user,T,onShop,onViewProfile}) {
  const eligible=emps.filter(e=>XP_ELIGIBLE_ROLES.includes(e.role));
  const ranked=eligible.map(e=>{
    const pg=progress[e.id]||{xp:0,level:1,title:"Pioneer",streak:0};
    const lv=getLevelInfo(pg.xp);
    return {...e,pg,lv};
  }).sort((a,b)=>b.pg.xp-a.pg.xp);

  // Employee of the month = highest XP
  const eotm=ranked[0];

  const medals=["🥇","🥈","🥉"];

  return (
    <div className="fu" style={{marginTop:8}}>
      {/* Top action bar — Shop + your stats */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:T.accent+"12",border:`1px solid ${T.accent}33`,borderRadius:9999,padding:"8px 14px 8px 10px"}}>
          <div style={{fontSize:18}}>{E("⭐","★")}</div>
          <div>
            <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.06em"}}>YOUR XP</div>
            <div style={{fontSize:16,fontWeight:800,color:T.accent,lineHeight:1}}>{(progress[user?.id]?.xp||0).toLocaleString()}</div>
          </div>
        </div>
        <button onClick={()=>{playSound("open");onShop&&onShop();}}
          style={{background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"10px 20px",fontWeight:T.minimal?500:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,transition:"transform .15s,opacity .15s",boxShadow:`0 4px 14px ${T.accent}55`}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.opacity="0.95";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.opacity="1";}}
        >
          <span style={{fontSize:16}}>{E("🛍","◇")}</span> Open Shop
        </button>
      </div>
      {/* Employee of the Month */}
      {eotm&&(
        <div style={{background:`linear-gradient(135deg,${eotm.lv.color}22,${eotm.lv.color}11)`,border:`2px solid ${eotm.lv.color}55`,borderRadius:18,padding:20,marginBottom:20,textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${eotm.lv.color},${T.scarlet})`}}/>
          <div style={{fontSize:28,marginBottom:6}}>⭐</div>
          <div style={{fontSize:11,fontWeight:800,color:T.sub,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Employee of the Month</div>
          <LevelLogo level={eotm.lv.level} color={eotm.lv.color} size={56}/>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt,marginTop:10}}>{eotm.name}</div>
          <div style={{fontSize:13,color:eotm.lv.color,fontWeight:700,marginTop:2}}>{eotm.lv.title}</div>
          <div style={{fontSize:13,color:T.sub,marginTop:4}}>{eotm.pg.xp} XP · Level {eotm.lv.level} · 🔥{eotm.pg.streak} day streak</div>
        </div>
      )}

      {/* Full leaderboard */}
      <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:800,color:T.txt,marginBottom:12}}>🏆 Staff Leaderboard</div>
      <div style={{display:"grid",gap:8}}>
        {ranked.map((e,i)=>{
          const isMe=e.id===user?.id;
          const isEotm=i===0;
          return (
            <div key={e.id} style={{background:isMe?`${T.scarlet}12`:T.card,border:`1px solid ${isEotm?e.lv.color+"66":isMe?T.scarlet+"44":T.bor}`,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,transition:"all .18s"}}>
              {/* Rank */}
              <div style={{width:32,textAlign:"center",flexShrink:0}}>
                {i<3?<span style={{fontSize:20}}>{medals[i]}</span>:<span style={{fontFamily:"'Clash Display',sans-serif",fontSize:16,fontWeight:800,color:T.mut}}>#{i+1}</span>}
              </div>
              {/* Level logo */}
              <LevelLogo level={e.lv.level} color={e.lv.color} size={38}/>
              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {(()=>{
                    // Combine admin-granted + equipped shop badges, deduplicated, max 5
                    const granted=JSON.parse(e.badge_grants||"[]");
                    const equipped=JSON.parse(e.equipped_badges||"[]");
                    const badges=[...new Set([...granted,...equipped])].slice(0,5);
                    const isCreator=badges.includes("creator")||granted.includes("creator");
                    // Name color: use Supabase-stored name_color field
                    const nameColor=(e.name_color||"base")==="name_color"?T.accent:T.txt;
                    return (
                      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                        <span style={{fontWeight:800,fontSize:14,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,textDecorationStyle:"dotted"}}
                          onClick={()=>{playSound("click");onViewProfile&&onViewProfile(e);}}>
                          {isCreator?<CreatorName name={e.name} size={14}/>:<span style={{color:nameColor}}>{e.name}</span>}
                        </span>
                        {badges.length>0&&<UserBadges badgeIds={badges} size={16} gap={3}/>}
                      </div>
                    );
                  })()}
                  {isEotm&&<span style={{fontSize:14}}>⭐</span>}
                  {isMe&&<span style={{background:T.scarlet,color:"#fff",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:800}}>YOU</span>}
                </div>
                <div style={{fontSize:11,color:e.lv.color,fontWeight:700,marginTop:1}}>{e.lv.title} · Level {e.lv.level}</div>
                {/* XP bar */}
                <div style={{height:4,background:T.bor,borderRadius:2,marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${e.lv.pct}%`,background:e.lv.color,borderRadius:2,transition:"width .6s"}}/>
                </div>
              </div>
              {/* Stats */}
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:18,fontWeight:800,color:e.lv.color}}>{e.pg.xp}</div>
                <div style={{fontSize:10,color:T.sub,fontWeight:600}}>XP</div>
                {e.pg.streak>0&&<div style={{fontSize:11,color:"#ff6b00",fontWeight:700,marginTop:2}}>🔥{e.pg.streak}</div>}
              </div>
            </div>
          );
        })}
        {ranked.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:T.sub,fontSize:14}}>No XP data yet. Complete tasks to earn XP!</div>}
      </div>
    </div>
  );
}

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────
function SkeletonCard({T,lines=2}) {
  return (
    <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:8,overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent 0%,${T.bor} 50%,transparent 100%)`,backgroundSize:"200% 100%",animation:"shimmer 1.4s ease infinite",opacity:0.5}}/>
      <div style={{height:14,background:T.bor,borderRadius:6,width:"60%",marginBottom:10}}/>
      {Array.from({length:lines}).map((_,i)=>(
        <div key={i} style={{height:10,background:T.bor,borderRadius:6,width:i===lines-1?"40%":"85%",marginBottom:i<lines-1?8:0}}/>
      ))}
    </div>
  );
}

// ─── NOTIFICATION BELL ────────────────────────────────────────────────────────
function NotifBell({T,anns,dms,tasks,user,onOpen}) {
  const unreadAnns=anns.filter(a=>!(a.dismissed||[]).includes(user?.id)).length;
  const unreadDms=dms.filter(d=>d.to===user?.id&&!d.read).length;
  const overdueTasks=tasks.filter(t=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date()&&(t.assignedTo==="all"||t.assignedTo===user?.id)).length;
  const count=unreadAnns+unreadDms+overdueTasks;
  return (
    <button onClick={onOpen} style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:8,display:"flex",alignItems:"center",transition:"background .15s"}}
      onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
      onMouseLeave={e=>e.currentTarget.style.background="none"}
    >
      <span style={{fontSize:18}}>🔔</span>
      {count>0&&<div style={{position:"absolute",top:0,right:0,background:T.scarlet,color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{count>9?"9+":count}</div>}
    </button>
  );
}

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
function NotifCenter({T,anns,dms,tasks,user,emps,onClose,setPage,onDismiss}) {
  const activeAnns=anns.filter(a=>!(a.dismissed||[]).includes(user?.id)).slice(0,5);
  const unreadDMs=dms.filter(d=>d.to===user?.id&&!d.read).slice(0,5);
  const overdue=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===user?.id)&&t.dueDate&&new Date(t.dueDate)<new Date()).slice(0,3);
  const items=[
    ...overdue.map(t=>({id:"t"+t.id,icon:"⚠️",title:"Overdue: "+t.title,sub:"Due "+new Date(t.dueDate).toLocaleDateString(),color:T.err,action:()=>{setPage("tasks");onClose();}})),
    ...unreadDMs.map(d=>({id:"d"+d.id,icon:"💬",title:emps.find(e=>e.id===d.from)?.name||"Message",sub:d.text.slice(0,50),color:T.blue,action:()=>{setPage("dms");onClose();}})),
    ...activeAnns.map(a=>({id:"a"+a.id,icon:({info:"ℹ️",warn:"⚠️",danger:"🚨"})[a.level]||"🔔",title:a.msg.slice(0,60),sub:"Announcement",color:T.scarlet,action:()=>{onDismiss(a.id);}})),
  ];
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.3)",backdropFilter:"blur(4px)",display:"flex",justifyContent:"flex-end",alignItems:"flex-start",paddingTop:60,animation:"fadeIn .15s ease"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:16,width:"min(360px,92vw)",maxHeight:"70vh",overflowY:"auto",margin:"0 12px",boxShadow:"0 12px 40px rgba(0,0,0,.2)",animation:"fadeUp .2s ease"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.bor}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontWeight:800,fontSize:16,color:T.txt}}>Notifications</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mut,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        {items.length===0?(
          <div style={{padding:"32px 16px",textAlign:"center",color:T.sub,fontSize:14}}>🎉 All caught up!</div>
        ):(
          <div>
            {items.map((item,i)=>(
              <div key={item.id} onClick={item.action} style={{padding:"12px 16px",borderBottom:`1px solid ${T.bor}`,cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start",transition:"background .15s",animation:`fadeUp .2s ${i*40}ms ease both`}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                onMouseLeave={e=>e.currentTarget.style.background="none"}
              >
                <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:2}}>{item.sub}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:"50%",background:item.color,flexShrink:0,marginTop:4}}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({T,emailIn,setEmailIn,emailErr,setEmailErr,showPin,setShowPin,pinIn,setPinIn,doLogin,doPin,notice,setScreen,siteOffline,passkeyAvailable,passkeyEmail,doPasskeyLogin,rememberMe,setRememberMe}) {
  const [tick,setTick]=useState(0);
  const [focused,setFocused]=useState(false);
  const [tagLine,setTagLine]=useState(0);
  const taglines=["Staff Portal for MNU's Neer Locker.","Sign in to get started.","Manage tasks, inventory, and your team.","Keep things running smoothly.","All your shift tools in one place.","Built for the Neer Locker team.","Stay connected with your crew.","Tasks. Inventory. Communication.","Your work hub, simplified.","Track everything that matters.","Quick access for every shift.","Reliable. Simple. Yours."];

  useEffect(()=>{
    const i=setInterval(()=>setTick(t=>t+1),120);
    const tl=setInterval(()=>setTagLine(l=>(l+1)%taglines.length),3500);
    return()=>{clearInterval(i);clearInterval(tl);};
  },[]);

  const SCHOOL_EMOJIS=["🎓","📚","✏️","📝","🏫","📐","🔬","📖","🎒","🏆"];
  const particles=SCHOOL_EMOJIS.map((e,i)=>({
    emoji:e, x:2+i*6.5,
    y:i%2===0?((tick*0.22+i*30)%22):(78+((tick*0.2+i*25)%22)),
    opacity:0.09+Math.abs(Math.sin(tick*0.018+i))*0.08,
    scale:0.5+Math.abs(Math.sin(tick*0.012+i))*0.5,
    rot:(tick*0.5+i*24)%360,
  }));
  const stars=Array.from({length:6},(_,i)=>({
    x:(((tick*0.8+i*60)%130))-15, y:5+i*15,
    opacity:Math.max(0,Math.sin((tick*0.05+i*1.1)))*0.6, w:40+i*12,
  }));
  const orbs=[
    {x:8,  y:12, size:360, color:"#C8102E", spd:0.4, blur:50},
    {x:85, y:75, size:300, color:"#1e7fa8", spd:0.6, blur:45},
    {x:65, y:8,  size:220, color:"#7c3aed", spd:0.8, blur:40},
    {x:3,  y:80, size:240, color:"#1e7fa8", spd:0.5, blur:40},
    {x:92, y:35, size:200, color:"#C8102E", spd:0.7, blur:35},
    {x:45, y:90, size:180, color:"#7c3aed", spd:0.9, blur:35},
  ];
  const wpts=Array.from({length:18},(_,i)=>{
    const x=i*(100/17);
    const y=50+Math.sin(tick*0.04+i*0.6)*18+Math.sin(tick*0.025+i*0.9)*10;
    return`${i===0?"M":"L"}${x},${y}`;
  }).join(" ");

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px 80px",position:"relative",overflow:"hidden",background:T.dark?"#04020a":"#f5f0f6"}}>
      {orbs.map((o,i)=>(
        <div key={i} style={{position:"fixed",left:`${o.x+Math.sin(tick*0.009*o.spd+i)*4}%`,top:`${o.y+Math.cos(tick*0.007*o.spd+i)*5}%`,width:o.size,height:o.size,borderRadius:"50%",background:`radial-gradient(circle,${o.color} 0%,transparent 68%)`,opacity:T.dark?0.16:0.09,transform:"translate(-50%,-50%)",filter:`blur(${o.blur}px)`,pointerEvents:"none"}}/>
      ))}
      {stars.map((s,i)=>(
        <div key={i} style={{position:"fixed",left:`${s.x}%`,top:`${s.y}%`,width:s.w,height:2,background:`linear-gradient(90deg,transparent,${T.scarlet},transparent)`,opacity:s.opacity,borderRadius:2,pointerEvents:"none",transform:"rotate(-15deg)"}}/>
      ))}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${T.bor} 1px,transparent 1px),linear-gradient(90deg,${T.bor} 1px,transparent 1px)`,backgroundSize:"44px 44px",opacity:T.dark?0.12:0.06,pointerEvents:"none"}}/>
      <svg style={{position:"fixed",bottom:0,left:0,width:"100%",height:80,pointerEvents:"none",opacity:0.15}} viewBox="0 0 100 80" preserveAspectRatio="none">
        <path d={wpts} stroke={T.scarlet} strokeWidth="0.8" fill="none"/>
      </svg>
      {particles.map((p,i)=>(
        <div key={i} style={{position:"fixed",left:`${p.x}%`,top:`${p.y}%`,fontSize:18,opacity:p.opacity,transform:`scale(${p.scale}) rotate(${p.rot}deg)`,pointerEvents:"none",userSelect:"none"}}>{p.emoji}</div>
      ))}
      <div style={{position:"fixed",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${T.scarlet},${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 3s linear infinite",zIndex:10}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.blue},${T.scarlet},${T.blue})`,backgroundSize:"400% 100%",animation:"shimmer 4s linear infinite reverse",zIndex:10}}/>
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
        <div className="fu" style={{marginBottom:16,textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:8}}>
            <div style={{position:"relative",flexShrink:0,width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{position:"absolute",top:"50%",left:"50%",width:64,height:64,transform:"translate(-50%,-50%)",borderRadius:19,border:`2px solid ${T.scarlet}`,opacity:0.45,animation:"pulse 2s ease-in-out infinite",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",width:76,height:76,transform:"translate(-50%,-50%)",borderRadius:23,border:`1.5px solid ${T.scarlet}`,opacity:0.18,animation:"pulse 2.4s ease-in-out infinite",animationDelay:"0.4s",pointerEvents:"none"}}/>
              <div style={{width:52,height:52,borderRadius:15,background:`linear-gradient(135deg,${T.scarlet} 0%,${T.sD} 60%,#7c0020 100%)`,boxShadow:`0 6px 20px ${T.scarlet}55,0 0 0 2px ${T.scarlet}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,animation:"popIn .6s cubic-bezier(.34,1.56,.64,1)",position:"relative",zIndex:1}}>🎓</div>
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:24,fontWeight:800,color:T.txt,letterSpacing:"-0.3px",lineHeight:1.1}}>
                {"MNU's"} <span style={{color:T.scarlet,textShadow:`0 0 18px ${T.scarlet}44`}}>Neer Locker</span>
              </div>
              <div style={{color:T.sub,fontSize:11,fontWeight:400,marginTop:2}}>Staff Portal &middot; MidAmerica Nazarene University</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <div key={tagLine} style={{animation:"fadeUp .4s ease both"}}>
              <span style={{fontSize:12,color:T.accent,fontWeight:700,fontStyle:"italic"}}>{taglines[tagLine]}</span>
            </div>
            <div style={{width:1,height:10,background:T.bor,flexShrink:0}}/>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:T.dark?"rgba(0,0,0,0.35)":"rgba(0,0,0,0.05)",border:`1px solid ${T.bor}`,borderRadius:20,padding:"3px 10px"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:T.ok,display:"inline-block",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.05em"}}>ONLINE</span>
            </div>
          </div>
        </div>
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
          {!showPin&&(
            <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>{playSound("click");setRememberMe&&setRememberMe(r=>!r);}}>
              <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${T.bor}`,background:rememberMe?(T.minimal?T.accent:T.scarlet):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                {rememberMe&&<span style={{color:"#fff",fontSize:11,fontWeight:900,lineHeight:1}}>✓</span>}
              </div>
              <span style={{fontSize:13,color:T.sub,fontWeight:600,userSelect:"none"}}>Remember me</span>
            </div>
          )}
          <Btn T={T} full onClick={()=>{playSound("click");showPin?doPin():doLogin();}} style={{padding:"14px 20px",fontSize:16,letterSpacing:"0.02em",boxShadow:`0 6px 24px ${T.scarlet}40,0 2px 0 ${T.scarlet}22 inset`}}>
            {showPin?"Confirm PIN →":"Sign In →"}
          </Btn>
          {passkeyAvailable&&!showPin&&(
            <button onClick={()=>{playSound("click");doPasskeyLogin();}}
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"13px 20px",background:T.dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",border:`1px solid ${T.bor}`,borderRadius:T.sp.r,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,color:T.sub,transition:"all .18s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.scarlet+"88";e.currentTarget.style.color=T.txt;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}
            >
              <span style={{fontSize:20}}>🔑</span>
              <span>Sign in as <strong style={{color:T.txt}}>{passkeyEmail.split("@")[0]}</strong> with biometrics</span>
            </button>
          )}
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setScreen("techLogin")} style={{background:"none",border:"none",color:T.faint,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.04em",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.sub}
              onMouseLeave={e=>e.currentTarget.style.color=T.faint}
            >Technical Administrator Access</button>
          </div>
        </div>
      </div>
      <ClaudeTag T={T}/><VersionBadge T={T}/>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
// ─── VIGIL HYPERCORE v2.0.0 ────────────────────────────────────────────
const VIGIL = {
  hashPIN: async(pin)=>{
    if(!pin) return "";
    const enc=new TextEncoder().encode(pin+"neer-locker-salt-v1");
    const buf=await crypto.subtle.digest("SHA-256",enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,16);
  },
  verifyPIN: async(input,stored)=>{
    if(!stored) return true;
    if(stored.length<=6) return input===stored; // legacy plain text
    const hashed=await VIGIL.hashPIN(input);
    return hashed===stored;
  },
  MAX_ATTEMPTS: 5,
  LOCKOUT_MS: 15*60*1000,
  recordAttempt:(email)=>{
    const key="vigil-attempts-"+email;
    const d=JSON.parse(localStorage.getItem(key)||"{}");
    d.count=(d.count||0)+1; d.last=Date.now();
    localStorage.setItem(key,JSON.stringify(d));
    return d.count;
  },
  clearAttempts:(email)=>localStorage.removeItem("vigil-attempts-"+email),
  isLockedOut:(email)=>{
    const d=JSON.parse(localStorage.getItem("vigil-attempts-"+email)||"{}");
    if(!d.count||d.count<VIGIL.MAX_ATTEMPTS) return false;
    const elapsed=Date.now()-(d.last||0);
    if(elapsed>VIGIL.LOCKOUT_MS){VIGIL.clearAttempts(email);return false;}
    return Math.ceil((VIGIL.LOCKOUT_MS-elapsed)/60000);
  },
  SESSION_MS:{boss:4*3600000,manager:2*3600000,assistant:3600000,employee:30*60000,superadmin:8*3600000},
  lastActivity: Date.now(),
  updateActivity:()=>{VIGIL.lastActivity=Date.now();},
  isSessionExpired:(role)=>Date.now()-VIGIL.lastActivity>(VIGIL.SESSION_MS[role]||VIGIL.SESSION_MS.employee),
  INJECTION_PATTERNS:[
    /ignore (previous|all|above|prior) (instructions?|prompts?|rules?)/i,
    /you are now|forget (you are|your instructions)/i,
    /jailbreak|dan mode|developer mode|unrestricted/i,
    /pretend (you are|to be)|act as (if you|a different)/i,
    /system prompt|override instructions|bypass/i,
  ],
  detectInjection:(text)=>VIGIL.INJECTION_PATTERNS.some(p=>p.test(text)),
  finnLastMsg:0,
  FINN_RATE_MS:1500,
  checkFinnRate:()=>{
    const now=Date.now();
    if(now-VIGIL.finnLastMsg<VIGIL.FINN_RATE_MS) return false;
    VIGIL.finnLastMsg=now; return true;
  },
  detectAnomaly:(user)=>{
    const hour=new Date().getHours();
    const flags=[];
    if(hour>=1&&hour<5) flags.push("unusual_hour");
    const lastDev=localStorage.getItem("vigil-device-"+user.id);
    const curDev=navigator.userAgent.slice(0,80);
    if(lastDev&&lastDev!==curDev) flags.push("new_device");
    localStorage.setItem("vigil-device-"+user.id,curDev);
    return flags;
  },
  logEvent:(type,detail,userId)=>{
    try{
      const evts=JSON.parse(localStorage.getItem("vigil-log")||"[]");
      evts.unshift({type,detail,userId,at:Date.now()});
      localStorage.setItem("vigil-log",JSON.stringify(evts.slice(0,200)));
    }catch(e){}
  },
  getLog:()=>{try{return JSON.parse(localStorage.getItem("vigil-log")||"[]");}catch(e){return [];}},
  clearLog:()=>localStorage.removeItem("vigil-log"),
};



// ─── STAFF PROFILE MODAL ─────────────────────────────────────────────────────
function StaffProfileModal({T,emp,progress,onClose}) {
  if(!emp) return null;
  const pg=progress[emp.id]||{xp:0,level:1,title:"Pioneer",streak:0};
  const lv=getLevelInfo(pg.xp);
  const granted=JSON.parse(emp.badge_grants||"[]");
  const equipped=JSON.parse(emp.equipped_badges||"[]");
  const grantedBadges=[...new Set([...granted,...equipped])];
  const isCreatorName=(emp.name_color||"base")==="name_color";
  const isCreator=grantedBadges.includes("creator");

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:800,padding:20,animation:"fadeUp .2s ease both"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?20:18,width:"100%",maxWidth:380,animation:"tourCardIn .3s cubic-bezier(.34,1.56,.64,1) both",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
        {/* Header gradient banner */}
        <div style={{background:`linear-gradient(135deg,${lv.color}33,${lv.color}11)`,padding:"24px 20px 20px",position:"relative"}}>
          {/* Close */}
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.2)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          {/* Avatar */}
          <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
            <div style={{position:"relative",flexShrink:0}}>
              <Avatar email={emp.email} color={ROLES[emp.role]?.color||"#6b7280"} size={72} avatarUrl={emp.avatar_url} frame={emp.equipped_frame}/>
              <div style={{position:"absolute",bottom:-4,right:-4,background:lv.color,borderRadius:9999,padding:"2px 7px",fontSize:9,fontWeight:800,color:"#fff",border:`2px solid ${T.surf}`,whiteSpace:"nowrap"}}>{lv.title||"Pioneer"}</div>
            </div>
            <div style={{flex:1,minWidth:0,paddingTop:4}}>
              {isCreator?(
                <div style={{marginBottom:4}}><CreatorName name={emp.name} size={22}/></div>
              ):(
                <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.4px",marginBottom:4,
                  color:isCreatorName?T.accent:T.txt}}>{emp.name}</div>
              )}
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <Tag label={ROLES[emp.role]?.label||emp.role} color={ROLES[emp.role]?.color||"#6b7280"}/>
                <StatusDot status={emp.status||"offline"}/>
                <span style={{fontSize:11,color:T.sub,textTransform:"capitalize"}}>{emp.status||"offline"}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{padding:"16px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:T.surfH,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:800,color:T.accent}}>{pg.xp||0}</div>
              <div style={{fontSize:10,color:T.sub,fontWeight:600}}>XP</div>
            </div>
            <div style={{background:T.surfH,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:800,color:lv.color}}>{lv.level||1}</div>
              <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Level</div>
            </div>
            <div style={{background:T.surfH,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:800,color:"#ea580c"}}>{pg.streak||0}</div>
              <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Streak</div>
            </div>
          </div>
          {/* XP bar */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.sub,marginBottom:4}}>
              <span>{lv.pct}% to next level</span>
              {lv.next&&<span>{lv.next.title}</span>}
            </div>
            <div style={{height:5,background:T.bor,borderRadius:9999,overflow:"hidden"}}>
              <div style={{width:`${lv.pct}%`,height:"100%",background:`linear-gradient(90deg,${lv.color}88,${lv.color})`,borderRadius:9999}}/>
            </div>
          </div>
          {/* Badges */}
          {grantedBadges.length>0&&(
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:T.sub,fontWeight:700,letterSpacing:"0.06em",marginBottom:6}}>BADGES</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {grantedBadges.map(id=>{
                  const b=getBadge(id);
                  if(!b) return null;
                  const glowFilter=id==="creator"
                      ?"drop-shadow(0 0 8px #16a34a) drop-shadow(0 0 16px #16a34acc)"
                      :`drop-shadow(0 0 6px ${b.glow||b.color+"88"}) drop-shadow(0 0 2px ${b.color})`;
                  return (
                    <div key={id} title={b.monthLabel?`${b.name} — ${b.monthLabel}: ${b.desc}`:b.name+": "+b.desc}
                      style={{display:"flex",alignItems:"center",gap:7,background:b.color+"18",border:`1px solid ${b.color}55`,borderRadius:12,padding:"8px 12px",animation:id.startsWith("eotm_")?"eotmGlow 2.5s ease-in-out infinite":id==="creator"?"creatorPulse 3s ease-in-out infinite":undefined,cursor:"default",transition:"transform .15s"}}
                      onMouseEnter={el=>el.currentTarget.style.transform="scale(1.05)"}
                      onMouseLeave={el=>el.currentTarget.style.transform="scale(1)"}>
                      <span style={{fontSize:28,filter:glowFilter,lineHeight:1}}>{b.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:b.color,letterSpacing:"-0.2px"}}>{b.name}</div>
                        {b.monthLabel&&<div style={{fontSize:10,color:T.sub,marginTop:1,fontWeight:600}}>{b.monthLabel}</div>}
                        <div style={{fontSize:10,color:T.sub,marginTop:1,maxWidth:120,lineHeight:1.3}}>{b.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Email */}
          <div style={{fontSize:11,color:T.sub,marginTop:8}}>{emp.email}</div>
        </div>
      </div>
    </div>
  );
}

// ─── USER BADGES ─────────────────────────────────────────────────────────────
function UserBadges({badgeIds,size=20,gap=6}){
  if(!badgeIds||!badgeIds.length) return null;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap}}>
      {badgeIds.map(id=>{
        const b=getBadge(id);
        if(!b) return null;
        const isEotm=id.startsWith("eotm_");
        const isCreator=id==="creator";
        const glowFilter=isCreator
          ?"drop-shadow(0 0 8px #16a34a) drop-shadow(0 0 16px #16a34acc)"
          :`drop-shadow(0 0 5px ${b.glow||b.color+"88"}) drop-shadow(0 0 2px ${b.color})`;
        return (
          <span key={id} title={b.monthLabel?`${b.name} — ${b.monthLabel}\n${b.desc}`:b.name+": "+b.desc}
            style={{cursor:"default",lineHeight:1,display:"inline-flex",alignItems:"center",flexDirection:"column",filter:glowFilter,animation:isEotm?"eotmGlow 2.5s ease-in-out infinite":isCreator?"creatorPulse 3s ease-in-out infinite":undefined}}>
            <span style={{fontSize:size,lineHeight:1}}>{b.icon}</span>
            {isEotm&&b.monthLabel&&<span style={{fontSize:Math.max(7,size*0.5),fontWeight:800,color:b.color,letterSpacing:"0.02em",lineHeight:1,marginTop:2,whiteSpace:"nowrap"}}>{b.monthLabel}</span>}
          </span>
        );
      })}
    </span>
  );
}

// ─── CREATOR NAME (animated green color shift) ───────────────────────────────
function CreatorName({name,size=13}){
  return (
    <span style={{fontWeight:700,fontSize:size,background:"linear-gradient(90deg,#16a34a,#4ade80,#86efac,#4ade80,#16a34a)",backgroundSize:"200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"creatorShimmer 3s linear infinite",display:"inline-block"}}>
      {name}
    </span>
  );
}

// ─── BADGE + NAME COLOR CATALOG ──────────────────────────────────────────────
const BADGE_CATALOG = {
  // ── XP SHOP BADGES ───────────────────────────────────────────────────────
  badge_pioneer:  {id:"badge_pioneer",  name:"Pioneer",        icon:E("🚀","▲"), color:"#6366f1", glow:"#6366f188", desc:"For the early adopters"},
  badge_legend:   {id:"badge_legend",   name:"Legend",         icon:E("👑","♛"), color:"#eab308", glow:"#eab30888", desc:"Top performer status"},
  badge_sparkle:  {id:"badge_sparkle",  name:"Sparkle",        icon:E("✨","★"), color:"#a855f7", glow:"#a855f788", desc:"Sparkle trail"},
  badge_goat:     {id:"badge_goat",     name:"G.O.A.T.",       icon:E("🐐","◆"), color:"#0d9488", glow:"#0d948888", desc:"Greatest of all time"},
  badge_mnu:      {id:"badge_mnu",      name:"MNU Pride",      icon:E("🎓","◈"), color:"#C8102E", glow:"#C8102E88", desc:"MNU school spirit"},
  badge_grinder:  {id:"badge_grinder",  name:"Grinder",        icon:E("⚙️","◎"), color:"#64748b", glow:"#64748b88", desc:"Never stops working"},
  badge_nightowl: {id:"badge_nightowl", name:"Night Owl",      icon:E("🦉","◉"), color:"#818cf8", glow:"#818cf888", desc:"Working late hours"},
  badge_streak7:  {id:"badge_streak7",  name:"7-Day",          icon:E("🔥","·"), color:"#ea580c", glow:"#ea580c88", desc:"7 days straight"},
  badge_streak30: {id:"badge_streak30", name:"30-Day",         icon:E("🏆","◆"), color:"#b45309", glow:"#b4530988", desc:"30 days of dedication"},
  overtime_badge: {id:"overtime_badge", name:"Overtime",       icon:E("💪","◉"), color:"#7c3aed", glow:"#7c3aed88", desc:"Extra work this week"},
  badge_diamond:  {id:"badge_diamond",  name:"Diamond",        icon:E("💎","◆"), color:"#22d3ee", glow:"#22d3ee88", desc:"Top 1% performer"},
  badge_phoenix:  {id:"badge_phoenix",  name:"Phoenix",        icon:E("🔥","✦"), color:"#f97316", glow:"#f9731688", desc:"Rose from the ashes"},
  badge_scholar:  {id:"badge_scholar",  name:"Scholar",        icon:E("📚","≡"), color:"#10b981", glow:"#10b98188", desc:"Knowledge seeker"},
  badge_speedrun: {id:"badge_speedrun", name:"Speedrunner",    icon:E("⚡","↯"), color:"#facc15", glow:"#facc1588", desc:"Completed 10 tasks in one day"},
  badge_silent:   {id:"badge_silent",   name:"Silent Worker",  icon:E("👻","○"), color:"#94a3b8", glow:"#94a3b888", desc:"Completes tasks without a word"},
  badge_clutch:   {id:"badge_clutch",   name:"Clutch",         icon:E("⏰","◷"), color:"#f43f5e", glow:"#f43f5e88", desc:"Completed task right before deadline"},
  badge_allstar:  {id:"badge_allstar",  name:"All-Star",       icon:E("⭐","★"), color:"#fbbf24", glow:"#fbbf2488", desc:"5-star week across all metrics"},
  badge_hustler:  {id:"badge_hustler",  name:"Hustler",        icon:E("📈","▲"), color:"#34d399", glow:"#34d39988", desc:"Most tasks completed in a week"},
  badge_ghost:    {id:"badge_ghost",    name:"Ghost",          icon:E("👤","○"), color:"#cbd5e1", glow:"#cbd5e188", desc:"Always online but silent"},
  badge_teamplyr: {id:"badge_teamplyr", name:"Team Player",    icon:E("🤝","≡"), color:"#60a5fa", glow:"#60a5fa88", desc:"Helps the whole team succeed"},
  // ── ADMIN-GRANTED ONLY ───────────────────────────────────────────────────
  creator:        {id:"creator",        name:"Creator",        icon:"◈",         color:"#16a34a", glow:"#16a34acc", desc:"Neer Locker Creator — Nate Smith", special:true, adminOnly:true},
};
// EOTM badges are dynamically keyed: eotm_YYYY_MM
// e.g. eotm_2026_04 = Employee of the Month — April 2026
const makeEotmBadge=(monthKey)=>{
  const [yr,mo]=monthKey.split("_");
  const monthName=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(mo)-1]||mo;
  return {id:`eotm_${monthKey}`,name:`EOTM`,icon:E("⭐","★"),color:"#f59e0b",glow:"#f59e0bcc",
    desc:`Employee of the Month — ${monthName} ${yr}`,special:true,adminOnly:true,monthLabel:`${monthName} ${yr}`};
};
const getEotmBadge=(id)=>{
  if(!id?.startsWith("eotm_")) return null;
  return makeEotmBadge(id.replace("eotm_",""));
};
const getBadge=(id)=>BADGE_CATALOG[id]||getEotmBadge(id)||null;
const NAME_COLORS = {
  base:        {id:"base",         label:"Default",  value:null},
  name_color:  {id:"name_color",   label:"Accent",   value:null}, // uses T.accent
};

export default function App() {
  const [T,setT]=useState(T0);
  const [dark,setDk]=useState(LS.get('nl3-dark')!==null?LS.get('nl3-dark'):window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [compact,setCompact]=useState(()=>!!LS.get('nl3-compact'));
  const [minimalMode,setMinimalMode]=useState(()=>{const v=!!LS.get('nl3-minimal');window._minimalMode=v;return v;});
  const [showEmojis,setShowEmojis]=useState(()=>LS.get('nl3-emojis')!==false);
  const [voiceOnGlobal,setVoiceOnGlobal]=useState(()=>LS.get("nl3-finn-voice")!==false);
  const [accent,setAccent]=useState("");
  const [soundOn,setSoundOn]=useState(true);
  const [soundVol,setSoundVol]=useState(0.22);
  const [deviceMode,setDeviceMode]=useState("auto"); // "auto" | "mobile" | "desktop"

  const [screen,setScreen]=useState("login");
  const [user,setUser]=useState(null);
  const userRef=useRef(null);
  const progressRef=useRef({});
  const [welData,setWelData]=useState({name:"",role:"employee"});
  const [showBriefing,setShowBriefing]=useState(false);
  const [loggingOut,setLoggingOut]=useState(false);
  const [techAction,setTechAction]=useState("");

  const [emailIn,setEmailIn]=useState(LS.get("nl3-remember-email")||"");
  const [rememberMe,setRememberMe]=useState(!!LS.get("nl3-remember-email"));
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
  const [passkeyAvailable,setPasskeyAvailable]=useState(false);
  const [notifEnabled,setNotifEnabled]=useState(false);
  const [progress,setProgress]=useState({}); // {userId: {xp,level,title,streak,last_login}}
  const notifEnabledRef=useRef(false);
  const [notifPerms,setNotifPerms]=useState(NOTIF.supported()?NOTIF.permission():"unsupported");
  // Refresh permission state on focus
  useEffect(()=>{ const h=()=>setNotifPerms(NOTIF.supported()?NOTIF.permission():"unsupported"); window.addEventListener("focus",h); return()=>window.removeEventListener("focus",h); },[]);

  useEffect(()=>{
    const saved=LS.get("nl3-notif-enabled");
    if(saved&&NOTIF.permission()==="granted"){setNotifEnabled(true);notifEnabledRef.current=true;}
    setNotifPerms(NOTIF.supported()?NOTIF.permission():"unsupported");
  },[]);

  // Keep refs in sync with state so refreshData always sees latest value
  useEffect(()=>{notifEnabledRef.current=notifEnabled;},[notifEnabled]);
  useEffect(()=>{userRef.current=user;},[user]);
  useEffect(()=>{progressRef.current=progress;},[progress]);
  const [passkeyEmail,setPasskeyEmail]=useState("");

  useEffect(()=>{
    if(WA.supported()){
      const stored=localStorage.getItem("nl3-passkey-email");
      if(stored){setPasskeyEmail(stored);setPasskeyAvailable(true);}
    }
  },[]);

  // Tech PIN gate for viewing employee PINs
  const [techPinGate,setTechPinGate]=useState(false);
  const [selectedTasks,setSelectedTasks]=useState(new Set());
  const [selPatchNotes,setSelPatchNotes]=useState(()=>new Set((PATCH_NOTES[VERSION]||[]).map((_,i)=>i)));
  const [showRating,setShowRating]=useState(false);
  // Badge + name color — stored in localStorage
  const [equippedBadges,setEquippedBadges]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("nl3-badges")||"[]");}catch{return [];}
  });
  const [nameColorId,setNameColorId]=useState(()=>localStorage.getItem("nl3-name-color")||"base");
  const [equippedFrame,setEquippedFrame]=useState(()=>localStorage.getItem("nl3-equipped-frame")||"");
  const [finnSkinGold,setFinnSkinGold]=useState(()=>{
    // Check localStorage for purchase flag (set on buy)
    return localStorage.getItem("nl3-finn-skin-gold")==="1";
  });;
  const saveEquippedBadges=(badges)=>{
    setEquippedBadges(badges);
    localStorage.setItem("nl3-badges",JSON.stringify(badges));
    if(user?.id){
      // Persist to Supabase AND update local emps so leaderboard sees it immediately
      const badgesJson=JSON.stringify(badges);
      SB.patch("employees",user.id,{equipped_badges:badgesJson});
      setEmps(prev=>prev.map(e=>e.id===user.id?{...e,equipped_badges:badgesJson}:e));
      setUser(u=>u?{...u,equipped_badges:badgesJson}:u);
    }
  };
  const saveNameColor=(id)=>{
    setNameColorId(id);
    localStorage.setItem("nl3-name-color",id);
    if(user?.id){
      SB.patch("employees",user.id,{name_color:id});
      setEmps(prev=>prev.map(e=>e.id===user.id?{...e,name_color:id}:e));
      setUser(u=>u?{...u,name_color:id}:u);
    }
  };
  const saveEquippedFrame=(id)=>{
    setEquippedFrame(id||"");
    if(id) localStorage.setItem("nl3-equipped-frame",id);
    else localStorage.removeItem("nl3-equipped-frame");
    if(user?.id){
      const val=id||"";
      SB.patch("employees",user.id,{equipped_frame:val});
      setEmps(prev=>prev.map(e=>e.id===user.id?{...e,equipped_frame:val}:e));
      setUser(u=>u?{...u,equipped_frame:val}:u);
    }
  };
  const [showShop,setShowShop]=useState(false);
  const [showPfpUpload,setShowPfpUpload]=useState(false);
  // Monthly rating check — show once per calendar month per user
  useEffect(()=>{
    if(!user) return;
    const last=LS.get("nl3-last-rating");
    const now=new Date();
    const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    if(last===monthKey) return; // already rated this month
    const t=setTimeout(()=>setShowRating(true),15000);
    return()=>clearTimeout(t);
  },[user?.id]);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [viewingProfile,setViewingProfile]=useState(null); // emp object
  useEffect(()=>{window._startOnboarding=()=>setShowOnboarding(true);return()=>{delete window._startOnboarding;};},[]);
  const [showFeedback,setShowFeedback]=useState(false);
  const [showFinn,setShowFinn]=useState(false);
  const [xpToasts,setXpToasts]=useState([]);
  const [showNotifCenter,setShowNotifCenter]=useState(false);
  const [showWelcomePortal,setShowWelcomePortal]=useState(false);
  const [finnAnim,setFinnAnim]=useState(false);
  const openFinn=()=>{setFinnAnim(true);setTimeout(()=>setShowFinn(true),420);};
  const [feedbackForm,setFeedbackForm]=useState({type:"feature",msg:""});
  const [techPinInput,setTechPinInput]=useState("");
  const [techPinErr,setTechPinErr]=useState("");
  const [pinRevealed,setPinRevealed]=useState(false);

  const [emps,setEmps]=useState(SEED);
  const [dataLoaded,setDataLoaded]=useState(false);
  const [tasks,setTasks]=useState([]);
  const [inv,setInv]=useState([]);
  const [anns,setAnns]=useState([]);
  const [act,setAct]=useState([]);
  const [errs,setErrs]=useState([]);
  const [bkps,setBkps]=useState([]);
  const [dms,setDms]=useState([]);
  const [notice,setNotice]=useState("");
  const [scheduleUrl,setScheduleUrl]=useState("");
  const [siteOffline,setSiteOffline]=useState(false);

  const [page,setPage]=useState("home");
  const [ptrActive,setPtrActive]=useState(false);
  const [ptrY,setPtrY]=useState(0);
  const ptrRef=useRef(null);
  const [swipeBacking,setSwipeBacking]=useState(false);
  const [prevPage,setPrevPage]=useState(null);
  const [modal,setModal]=useState(null);
  const [nameSaved,setNameSaved]=useState(false);
  const [pinSaved,setPinSaved]=useState(false);
  const [emailSaved,setEmailSaved]=useState(false);
  const [form,setForm]=useState({});
  const [toasts,setToasts]=useState([]);
  const [search,setSearch]=useState("");
  const [globalSearch,setGlobalSearch]=useState("");
  const [showGlobalSearch,setShowGlobalSearch]=useState(false);
  const [recentPages,setRecentPages]=useState([]);
  const [isOffline,setIsOffline]=useState(!navigator.onLine);
  const globalSearchRef=useRef(null);
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
        ?empRows.map(e=>({id:e.id,email:e.email,name:e.name,role:e.role,pin:e.pin_hash||e.pin||"",avatar_url:e.avatar_url||"",badge_grants:e.badge_grants||"[]",equipped_badges:e.equipped_badges||"[]",name_color:e.name_color||"base",equipped_frame:e.equipped_frame||"",max_xp:e.max_xp||0,status:e.status||"offline",createdAt:e.created_at}))
        :SEED;
      setEmps(mappedEmps);
      // Seed initial employees if none exist
      if(!empRows?.length){for(const s of SEED)await SB.upsert("employees",{id:s.id,email:s.email,name:s.name,role:s.role,status:"offline",created_at:s.createdAt||Date.now()});}
      // Force-upsert any SEED employees missing from Supabase (e.g. new additions)
      const existingEmails=new Set((empRows||[]).map(e=>e.email));
      for(const s of SEED){
        if(!existingEmails.has(s.email)){
          await SB.upsert("employees",{id:s.id,email:s.email,name:s.name,role:s.role,pin:s.pin||"",status:"offline",created_at:s.createdAt||Date.now()});
        }
      }

      setTasks((taskRows||[]).map(t=>({id:t.id,title:t.title,description:t.description||"",priority:t.priority,assignedTo:t.assigned_to,createdBy:t.created_by||"",dueDate:t.due_date,done:t.done,repeat:t.repeat,repeatDays:typeof t.repeat_days==="string"?JSON.parse(t.repeat_days||"[]"):t.repeat_days||[],createdAt:t.created_at})));
      setInv((invRows||[]).map(i=>({id:i.id,name:i.name,stock:i.stock,createdAt:i.created_at})));
      setAnns((annRows||[]).map(a=>({id:a.id,msg:a.msg,level:a.level,by:a.by_name,at:a.at,dismissed:a.dismissed||[],patchNotes:a.patch_notes,patchVersion:a.patch_version,patchBuild:a.patch_build})));
      setAct((actRows||[]).map(a=>({id:a.id,type:a.type,msg:a.msg,userId:a.user_id,at:a.at})));
      setErrs((errRows||[]).map(e=>({id:e.id,level:e.level,msg:e.msg,at:e.at})));
      setBkps((bkpRows||[]).map(b=>({id:b.id,at:b.at,...(b.data||{})})));
      setDms((dmRows||[]).map(d=>({id:d.id,from:d.from_id,to:d.to_id,text:d.text,at:d.at,read:d.read,system:d.system,threadWith:d.thread_with,feedback:d.feedback})));
      if(sn) setNotice(sn);
      const schedUrl=await DB.get('nl3-schedule-url');
      if(schedUrl) setScheduleUrl(schedUrl);
      const d=dk??false; const c=cp??false; const av=accentVal||"";
      setDk(d); setCompact(c); setAccent(av); setT(mkTheme(d,c,av));
      if(offlineVal) setSiteOffline(offlineVal);
      setTimeout(()=>setDataLoaded(true), 600); // min 600ms so skeleton is visible
      // Sound prefs loaded separately
      window._hapticsOff=LS.get("nl3-haptics-off")===true;
      const sOn=LS.get("nl3-sound-on"); if(sOn!==null)setSoundOn(sOn);
      const sVol=LS.get("nl3-sound-vol"); if(sVol!==null)setSoundVol(sVol);
      const dMode=LS.get("nl3-device-mode"); if(dMode)setDeviceMode(dMode);
      // Load progression data
      const pgRows=await SB.select("user_progress","");
      const pgMap={};
      for(const r of pgRows||[]) pgMap[r.user_id]={xp:r.xp||0,max_xp:r.max_xp||r.xp||0,level:r.level||1,title:r.title||"Pioneer",streak:r.streak||0,last_login:r.last_login};
      setProgress(pgMap);
    })();
    return()=>{alive=false;};
  },[]);

  // Refresh shared data from Supabase — called on interval and on key actions
  // ── Vigil: validate session on load and periodically ──────────────────────
  useEffect(()=>{
    const checkSession=async()=>{
      if(!user) return;
      try {
        const result=await VIGIL.validateSession();
        if(!result.ok){
          toast("Session expired — please sign in again","warn");
          doLogout();
        }
      } catch(e){ /* Server unavailable — client timeout handles it */ }
    };
    checkSession();
    const interval=setInterval(checkSession, 5*60*1000); // check every 5 min
    return ()=>clearInterval(interval);
  },[user]);

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
    if(empRows?.length) setEmps(empRows.map(e=>({id:e.id,email:e.email,name:e.name,role:e.role,pin:e.pin_hash||e.pin||"",avatar_url:e.avatar_url||"",badge_grants:e.badge_grants||"[]",equipped_badges:e.equipped_badges||"[]",name_color:e.name_color||"base",equipped_frame:e.equipped_frame||"",max_xp:e.max_xp||0,status:e.status||"offline",createdAt:e.created_at})));
    if(taskRows?.length>=0){
      const newMapped=taskRows.map(t=>({id:t.id,title:t.title,description:t.description||"",priority:t.priority,assignedTo:t.assigned_to,createdBy:t.created_by||"",dueDate:t.due_date,done:t.done,repeat:t.repeat,repeatDays:typeof t.repeat_days==="string"?JSON.parse(t.repeat_days||"[]"):t.repeat_days||[],createdAt:t.created_at}));
      setTasks(prev=>{
        // Detect brand new tasks assigned to me
        if(notifEnabledRef.current&&userRef.current){
          newMapped.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===userRef.current.id)).forEach(t=>{
            if(!prev.find(p=>p.id===t.id)){
              const taskNotifKey="nl3-notif-task-"+t.id;
              if(!localStorage.getItem(taskNotifKey)){
                localStorage.setItem(taskNotifKey,"1");
                setTimeout(()=>localStorage.removeItem(taskNotifKey),300000);
                NOTIF.send(userRef.current.id,"New Task 📋",`${t.title} — assigned to you`,"task");
              }
            }
          });
        }
        // Merge: keep any locally-created tasks not yet in Supabase response
        const supabaseIds=new Set(newMapped.map(t=>t.id));
        const localOnly=prev.filter(t=>!supabaseIds.has(t.id)&&(Date.now()-t.createdAt)<60000);
        return [...newMapped,...localOnly];
      });
    }
    if(invRows) setInv(invRows.map(i=>({id:i.id,name:i.name,stock:i.stock,createdAt:i.created_at})));
    if(annRows){
      const newAnns=annRows.map(a=>({id:a.id,msg:a.msg,level:a.level,by:a.by_name,at:a.at,dismissed:a.dismissed||[],patchNotes:a.patch_notes,patchVersion:a.patch_version,patchBuild:a.patch_build}));
      setAnns(prev=>{
        if(notifEnabledRef.current&&userRef.current){
          newAnns.filter(a=>!(a.dismissed||[]).includes(userRef.current.id)).forEach(a=>{
            if(!prev.find(p=>p.id===a.id)){
              const annNotifKey="nl3-notif-ann-"+a.id;
              if(!localStorage.getItem(annNotifKey)){
                localStorage.setItem(annNotifKey,"1");
                setTimeout(()=>localStorage.removeItem(annNotifKey),300000); // 5 min
                NOTIF.broadcast("New Announcement 📢",a.msg.slice(0,80),"announcement");
              }
            }
          });
        }
        return newAnns;
      });
    }
    if(actRows) setAct(actRows.map(a=>({id:a.id,type:a.type,msg:a.msg,userId:a.user_id,at:a.at})));
    if(errRows) setErrs(errRows.map(e=>({id:e.id,level:e.level,msg:e.msg,at:e.at})));
    if(dmRows){
      const newDms=dmRows.map(d=>({id:d.id,from:d.from_id,to:d.to_id,text:d.text,at:d.at,read:d.read,system:d.system,threadWith:d.thread_with,feedback:d.feedback}));
      setDms(prev=>{
        if(notifEnabledRef.current&&userRef.current){
          newDms.filter(d=>d.to===userRef.current.id&&!d.read&&!d.system).forEach(d=>{
            if(!prev.find(p=>p.id===d.id)){
              const sender=emps.find(e=>e.id===d.from);
              // Dedup: only notify once per message id
          const notifKey="nl3-notif-"+d.id;
          if(!localStorage.getItem(notifKey)){
            localStorage.setItem(notifKey,"1");
            setTimeout(()=>localStorage.removeItem(notifKey),60000);
            NOTIF.send(userRef.current.id,`Message from ${sender?.name||"Someone"} 💬`,d.text.slice(0,80),"dm");
          }
            }
          });
        }
        return newDms;
      });
    }
  },[]);

  // Poll every 8 seconds when app is open — keeps all data fresh across devices
  useEffect(()=>{
    if(screen!=="app"&&screen!=="tech") return;
    const interval=setInterval(refreshData, 30000); // 30s - was 8s which caused task flicker
    return()=>clearInterval(interval);
  },[screen, refreshData]);

  // Offline detection
  useEffect(()=>{
    const goOffline=()=>setIsOffline(true);
    const goOnline=()=>setIsOffline(false);
    window.addEventListener("offline",goOffline);
    window.addEventListener("online",goOnline);
    return()=>{window.removeEventListener("offline",goOffline);window.removeEventListener("online",goOnline);};
  },[]);

  // Shake to report bug — requests iOS permission if needed
  useEffect(()=>{
    let lastX=0,lastY=0,lastZ=0,lastT=0;
    const handleMotion=(e)=>{
      const {x,y,z}=e.acceleration||{};
      if(!x&&!y&&!z) return;
      const now=Date.now();
      if(now-lastT<100) return;
      lastT=now;
      const delta=Math.abs(x-lastX)+Math.abs(y-lastY)+Math.abs(z-lastZ);
      lastX=x;lastY=y;lastZ=z;
      if(delta>25){
        playSound("notify");
        haptic("medium");
        setShowFeedback(true);
      }
    };
    const start=async()=>{
      if(typeof DeviceMotionEvent!=="undefined"&&typeof DeviceMotionEvent.requestPermission==="function"){
        try{
          const perm=await DeviceMotionEvent.requestPermission();
          if(perm==="granted"){
            window.addEventListener("devicemotion",handleMotion);
            LS.set("nl3-motion-perm","granted");
          }
        }catch(e){}
      } else {
        // Non-iOS — no permission needed, just add listener
        window.addEventListener("devicemotion",handleMotion);
        LS.set("nl3-motion-perm","granted");
      }
    };
    // Delay to let app finish loading, then request on first user tap
    const onFirstTap=()=>{
      // Only request if not already granted
      const motionPerm=LS.get("nl3-motion-perm");
      if(motionPerm==="granted"){
        window.addEventListener("devicemotion",handleMotion);
      } else {
        start().then(()=>LS.set("nl3-motion-perm","granted")).catch(()=>{});
      }
      document.removeEventListener("touchend",onFirstTap);
    };
    document.addEventListener("touchend",onFirstTap,{once:true});
    return()=>window.removeEventListener("devicemotion",handleMotion);
  },[]);

  // Vigil: activity tracker + session timeout
  useEffect(()=>{
    const events=["mousedown","touchstart","keydown","scroll","click"];
    events.forEach(e=>window.addEventListener(e,VIGIL.updateActivity,{passive:true}));
    const sessionCheck=setInterval(()=>{
      if(user&&VIGIL.isSessionExpired(user.role)){
        VIGIL.logEvent("session_timeout","auto_logout",user.id);
        toast("Session expired — you've been signed out for security","warn");
        doLogout();
      }
    },60000); // check every minute
    return()=>{
      events.forEach(e=>window.removeEventListener(e,VIGIL.updateActivity));
      clearInterval(sessionCheck);
    };
  },[user]);

  // Keyboard shortcut — Cmd+K or Ctrl+K opens global search
  useEffect(()=>{
    const handler=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){
        e.preventDefault();
        setShowGlobalSearch(s=>!s);
        playSound("open");
      }
      if(e.key==="Escape") setShowGlobalSearch(false);
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  // Set offline when user closes tab/browser or hides app
  useEffect(()=>{
    const handleUnload=()=>{
      if(user?.id){
        navigator.sendBeacon(`${SUPABASE_URL}/rest/v1/employees?id=eq.${user.id}`,
          new Blob([JSON.stringify({status:"offline"})],{type:"application/json"})
        );
      }
    };
    const handleVisibility=()=>{
      if(document.visibilityState==="hidden"&&user?.id){
        fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${user.id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({status:"offline"})}).catch(()=>{});
        setEmps(prev=>prev.map(e=>e.id===user.id?{...e,status:"offline"}:e));
      } else if(document.visibilityState==="visible"&&user?.id){
        fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${user.id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({status:"online"})}).catch(()=>{});
        setEmps(prev=>prev.map(e=>e.id===user.id?{...e,status:"online"}:e));
      }
    };
    window.addEventListener("beforeunload",handleUnload);
    document.addEventListener("visibilitychange",handleVisibility);
    return()=>{
      window.removeEventListener("beforeunload",handleUnload);
      document.removeEventListener("visibilitychange",handleVisibility);
    };
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
      due_date:t.dueDate||null,
      done:t.done||false,
      repeat:t.repeat||false,
      created_at:t.createdAt||Date.now()
    };
    const r=await SB.upsert("tasks",row);
    if(!r){
      console.error("upsertTask FAILED:",t.title,"— Supabase may have rejected due to RLS or invalid data. Row:",JSON.stringify({id:t.id,title:t.title,due_date:t.dueDate||null}));
    }
    return r;
  },[]);

  const saveTasks=useCallback(async v=>{
    setTasks(v);
    // Only upsert — don't delete. Individual deletes handled by delTask.
    for(const t of v){
      await SB.upsert("tasks",{id:t.id,title:t.title,description:t.description||"",priority:t.priority||"Medium",assigned_to:t.assignedTo||"all",created_by:t.createdBy||"",due_date:t.dueDate||"",done:t.done||false,repeat:t.repeat||false,created_at:t.createdAt||Date.now()});
    }
  },[]);
  const saveInv  =useCallback(async(v,changedItem)=>{
    setInv(v);
    // Only upsert the changed item if provided, otherwise upsert all (for bulk ops)
    const toSave=changedItem?[changedItem]:v;
    for(const i of toSave){
      await SB.upsert("inventory",{id:i.id,name:i.name,stock:i.stock||0,created_at:i.createdAt||Date.now()});
    }
  },[]);
  const saveAnns =useCallback(async(v,changedAnn)=>{
    setAnns(v);
    const toSave=changedAnn?[changedAnn]:v;
    for(const a of toSave){
      await SB.upsert("announcements",{id:a.id,msg:a.msg,level:a.level||"info",by_name:a.by||"System",at:a.at||Date.now(),dismissed:a.dismissed||[],patch_notes:a.patchNotes||null,patch_version:a.patchVersion||null,patch_build:a.patchBuild||null});
    }
  },[]);
  const saveDms  =useCallback(async(v,changedDm)=>{
    setDms(v);
    const toSave=changedDm?[changedDm]:v;
    for(const d of toSave){
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

  // Listen for system dark mode changes
  useEffect(()=>{
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    const handler=(e)=>{
      // Only auto-switch if user hasn't manually set a preference
      if(LS.get('nl3-dark')===null) { setDk(e.matches); setT(mkTheme(e.matches,compact,accent)); }
    };
    mq.addEventListener('change',handler);
    return()=>mq.removeEventListener('change',handler);
  },[compact,accent]);

  const applyTheme=useCallback(async(d,c,a,mn)=>{const ac=a!==undefined?a:accent;setDk(d);setCompact(c);setAccent(ac);const useMn=mn!==undefined?mn:minimalMode;setMinimalMode(useMn);window._minimalMode=useMn;setT(useMn?{...mkMinimalTheme(d,c,ac),showEmojis}:{...mkTheme(d,c,ac),showEmojis});LS.set("nl3-minimal",useMn?1:null);LS.set("nl3-dark",d);LS.set("nl3-compact",c);if(a!==undefined)LS.set("nl3-accent",a);},[accent]);

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
    const isMobileScreen=window.innerWidth<=768;
    const isTabletScreen=window.innerWidth>768&&window.innerWidth<=1024;
    const useTablet=mode==="tablet"||(mode==="auto"&&isTabletScreen);
    const useMobile=mode==="mobile"||(mode==="auto"&&isMobileScreen);
    if(useMobile){
      root.style.fontSize="18px";
      root.setAttribute("data-device","mobile");
    } else if(useTablet){
      root.style.fontSize="15px";
      root.setAttribute("data-device","tablet");
    } else {
      root.style.fontSize="13px";
      root.setAttribute("data-device","desktop");
    }
    playSound("click");
  },[]);

  // Apply on mount based on saved mode
  useEffect(()=>{
    const isMobileScreen=window.innerWidth<=768;
    const isTabletScreen=window.innerWidth>768&&window.innerWidth<=1024;
    const useTablet=deviceMode==="tablet"||(deviceMode==="auto"&&isTabletScreen);
    const useMobile=deviceMode==="mobile"||(deviceMode==="auto"&&isMobileScreen);
    const fs=useMobile?"18px":useTablet?"15px":"13px";
    const dev=useMobile?"mobile":useTablet?"tablet":"desktop";
    document.documentElement.style.fontSize=fs;
    document.documentElement.setAttribute("data-device",dev);
  },[deviceMode]);

  // AUTH
  const doPasskeyLogin=async()=>{
    const email=passkeyEmail;
    if(!email){toast("No passkey found","err");return;}
    const match=emps.find(e=>e.email.toLowerCase()===email.toLowerCase());
    if(!match){toast("Account not found","err");return;}
    const credId=localStorage.getItem("nl3-passkey-cred-"+match.id);
    if(!credId){toast("No passkey registered","err");return;}
    const result=await WA.authenticate(credId);
    if(!result){setEmailErr("Biometric authentication failed. Try signing in with email.");return;}
    setTries(0);
    finishLogin(match);
  };

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
    // Vigil: check client-side lockout (server-side check happens in doPin)
    const lockMins=VIGIL.isLockedOut(email);
    if(lockMins){
      setEmailErr("Account locked — too many failed attempts. Try again in "+lockMins+" min.");
      playSound("error");
      VIGIL.logEvent("lockout_blocked",email);
      return;
    }
    if(locked>Date.now()){setEmailErr("Too many attempts. Try again in "+Math.ceil((locked-Date.now())/60000)+" min.");return;}
    const match=emps.find(e=>e.email.toLowerCase()===email);
    if(!match){
      const a=tries+1;setTries(a);
      // Vigil: log failed email attempt
      VIGIL.recordAttempt(email);
      VIGIL.logEvent("failed_email",email);
      if(a>=MAX_TRIES){
        setLocked(Date.now()+LOCK_MS);
        VIGIL.logEvent("account_locked",email);
        addErr("warn","Lockout triggered — "+a+" failed attempts for "+email);
      } else {
        addErr("warn","Failed login attempt ("+a+"/"+MAX_TRIES+") for "+email);
      }
      playSound("error");
      setEmailErr("Email not found. Check your spelling or ask your manager to add you.");
      return;
    }
    // Vigil: check if this account is locked
    const empLockMins=VIGIL.isLockedOut(match.email);
    if(empLockMins){
      setEmailErr("Account locked — try again in "+empLockMins+" min.");
      playSound("error");
      VIGIL.logEvent("lockout_blocked",match.email,match.id);
      return;
    }
    setTries(0);
    if(match.pin){setPending(match);setShowPin(true);setEmailErr("");return;}
    finishLogin(match);
  };

  const doPin=async()=>{
    if(!pending) return;
    setPinIn("");
    try {
      // ── Vigil HyperCore: server-side PIN verification ─────────────────────
      const result=await VIGIL.login(pending.email, pinIn, "");
      if(!result.ok){
        playSound("error"); haptic("error");
        if(result.lockedUntil){
          const mins=Math.ceil((new Date(result.lockedUntil)-new Date())/60000);
          setEmailErr("Account locked — try again in "+mins+" min.");
          VIGIL.logEvent("lockout_blocked",pending.email,pending.id);
        } else {
          setEmailErr(result.error||"Wrong PIN.");
          VIGIL.logEvent("failed_pin",pending.email,pending.id);
        }
        return;
      }
      // Server login success — store JWT session token
      if(result.sessionToken) sessionStorage.setItem("vigil-session",result.sessionToken);
      if(result.anomalies&&result.anomalies.length>0){
        if(result.anomalies.includes("unusual_hour")) toast("⚠️ Vigil: Login outside normal hours logged","warn");
        if(result.anomalies.includes("new_device")) toast("🛡 Vigil: New device detected — logged","warn");
      }
      VIGIL.logEvent("login_success",pending.email,pending.id);
      finishLogin(pending);setPending(null);setShowPin(false);
    } catch(e){
      // Server unavailable — fall back to client-side verification
      console.warn("Vigil server unavailable, using client fallback:",e.message);
      const pinOk=await VIGIL.verifyPIN(pinIn,pending.pin);
      if(!pinOk){
        const attempts=VIGIL.recordAttempt(pending.email);
        VIGIL.logEvent("failed_pin",pending.email,pending.id);
        const left=VIGIL.MAX_ATTEMPTS-attempts;
        if(left<=0){ toast("Account locked for 15 min","err"); VIGIL.logEvent("account_locked",pending.email,pending.id); }
        else { setEmailErr("Wrong PIN — "+left+" attempt"+(left!==1?"s":"")+" left"); }
        return;
      }
      finishLogin(pending);setPending(null);setShowPin(false);
    }
  };

  const finishLogin=(emp)=>{
    haptic("success");
    VIGIL.clearAttempts(emp.email);
    VIGIL.updateActivity();
    // Vigil anomaly detection
    const flags=VIGIL.detectAnomaly(emp);
    if(flags.length>0){
      VIGIL.logEvent("anomaly",flags.join(","),emp.id);
      if(flags.includes("unusual_hour")) toast("⚠️ Vigil: Login outside normal hours logged","warn");
      if(flags.includes("new_device")) toast("🛡 Vigil: New device detected — logged for security","warn");
    }
    VIGIL.logEvent("login_success",emp.email,emp.id);
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
    handleLoginXP(emp);
    if(rememberMe) LS.set("nl3-remember-email",emp.email); else LS.set("nl3-remember-email",null);
    setTimeout(()=>finnProactivePush(emp, progress),5000);
    // Switch to app after animation completes
    playSound("login");
    loginTimerRef.current=setTimeout(()=>{
      setUser({...emp,status:"online"});
      setPage("home");
      setScreen("app");
      setShowBriefing(true);
      // Sync equipped badges + name color from Supabase (source of truth for all-viewers)
      const savedEquipped=JSON.parse(emp.equipped_badges||"[]");
      if(savedEquipped.length>0){
        localStorage.setItem("nl3-badges",JSON.stringify(savedEquipped));
        setEquippedBadges(savedEquipped);
      }
      const savedNameColor=emp.name_color||"base";
      if(savedNameColor!=="base"){
        localStorage.setItem("nl3-name-color",savedNameColor);
        setNameColorId(savedNameColor);
      }
      const savedFrame=emp.equipped_frame||"";
      if(savedFrame){
        localStorage.setItem("nl3-equipped-frame",savedFrame);
        setEquippedFrame(savedFrame);
      }
      // Load admin-granted badges from employee record
      const grantedBadges=JSON.parse(emp.badge_grants||"[]");
      if(grantedBadges.length>0){
        const unlocked=JSON.parse(localStorage.getItem("nl3-unlocked-badges")||"[]");
        grantedBadges.forEach(id=>{if(!unlocked.includes(id))unlocked.push(id);});
        localStorage.setItem("nl3-unlocked-badges",JSON.stringify(unlocked));
        // Auto-equip granted badges not yet equipped
        const equipped=JSON.parse(localStorage.getItem("nl3-badges")||"[]");
        let updated=false;
        grantedBadges.forEach(id=>{if(!equipped.includes(id)&&equipped.length<5){equipped.push(id);updated=true;}});
        if(updated){localStorage.setItem("nl3-badges",JSON.stringify(equipped));setEquippedBadges(equipped);}
      }
      // Auto-grant Creator badge to Nate Smith (nrsmith2@mnu.edu) — exclusive, permanent
      if(emp.email==="nrsmith2@mnu.edu"){
        const unlocked=JSON.parse(localStorage.getItem("nl3-unlocked-badges")||"[]");
        if(!unlocked.includes("creator")){unlocked.push("creator");localStorage.setItem("nl3-unlocked-badges",JSON.stringify(unlocked));}
        const equipped=JSON.parse(localStorage.getItem("nl3-badges")||"[]");
        if(!equipped.includes("creator")){const next=[...equipped,"creator"];localStorage.setItem("nl3-badges",JSON.stringify(next));setEquippedBadges(next);}
      }
      if(!LS.get("nl3-portal-seen")){LS.set("nl3-portal-seen",true);setTimeout(()=>setShowWelcomePortal(true),600);}
    },2000);
  };

  const doLogout=()=>{
    // Vigil: server logout
    try{ VIGIL.logout(); }catch(e){}
    sessionStorage.removeItem("vigil-session");
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
    const due=form.tDue||null;
    const rep=form.tRepeat||false;
    // Auto-categorize priority from keywords if not manually set
    const urgentWords=["urgent","asap","immediately","emergency","critical","now"];
    const highWords=["important","priority","must","deadline","today","broken","fix"];
    const lowWords=["whenever","eventually","low","someday","optional","idea"];
    let autoPri=pri;
    if(pri==="Medium"){
      const tl=title.toLowerCase();
      if(urgentWords.some(w=>tl.includes(w))) autoPri="High";
      else if(highWords.some(w=>tl.includes(w))) autoPri="High";
      else if(lowWords.some(w=>tl.includes(w))) autoPri="Low";
    }
    const repDays=form.tRepeatDays||[];
    const task={id:uid(),title:san(title),description:desc,priority:autoPri,assignedTo:assign,createdBy:user?.id||"",createdAt:Date.now(),done:false,dueDate:due||null,repeat:rep,repeatDays:repDays};
    setModal(null);setForm({});
    toast("Task created! ✅");
    setTasks(prev=>[task,...prev]);
    await upsertTask(task);
    addAct("task_created",`Task created: "${task.title}" by ${user?.name}`,user?.id);
    // Send push notifications to assigned users
    if(task.assignedTo==="all"){
      // Notify everyone except the creator
      // Mark this task notified so refreshData won't double-fire
      localStorage.setItem("nl3-notif-task-"+task.id,"1");
      setTimeout(()=>localStorage.removeItem("nl3-notif-task-"+task.id),300000);
      // Notify each person individually
      emps.filter(e=>e.id!==user?.id).forEach(e=>{
        NOTIF.send(e.id,"New Task 📋",`${task.title} — assigned to everyone`,"task");
      });
    } else if(task.assignedTo!==user?.id){
      // Notify the specific person assigned
      localStorage.setItem("nl3-notif-task-"+task.id,"1");
      setTimeout(()=>localStorage.removeItem("nl3-notif-task-"+task.id),300000);
      NOTIF.send(task.assignedTo,"New Task 📋",`${task.title} — assigned to you`,"task");
    }
  };

  const toggleTask=async id=>{
    const task=tasks.find(t=>t.id===id);if(!task) return;
    const completing=!task.done;
    const updated={
      ...task,
      done:completing,
      doneBy: completing ? user?.id : null,
      doneByName: completing ? user?.name : null,
      doneAt: completing ? Date.now() : null,
    };
    setTasks(prev=>prev.map(t=>t.id===id?updated:t));
    await upsertTask(updated);
    if(completing){
      addAct("task_done",`"${task.title}" completed by ${user?.name}`,user?.id);
      grantXP(task.priority==="High"?50:25,"task complete");
      playSound("task"); haptic("success");
      // Confetti if user owns it
      if(localStorage.getItem("nl3-confetti")==="1"){
        const colors=["#C8102E","#eab308","#1e7fa8","#10b981","#a855f7"];
        for(let i=0;i<60;i++){
          const el=document.createElement("div");
          el.style.cssText=`position:fixed;top:${Math.random()*40}%;left:${Math.random()*100}%;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?"50%":"2px"};pointer-events:none;z-index:9999;animation:confettiFall ${1+Math.random()*1.5}s ease-out forwards`;
          document.body.appendChild(el);
          setTimeout(()=>el.remove(),2500);
        }
      }
      clearTimeout(undoRef.current);setUndoId(id);
      undoRef.current=setTimeout(()=>setUndoId(null),7000);
      // If repeat, recreate. If repeatDays, schedule for next matching day
      if(task.repeat||task.repeatDays?.length>0){
        setTimeout(async()=>{
          let nextDue="";
          if(task.repeatDays?.length>0){
            const dayNums={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
            const todayNum=new Date().getDay();
            const nums=task.repeatDays.map(d=>dayNums[d]).sort((a,b)=>a-b);
            let daysAhead=nums.find(n=>n>todayNum);
            if(daysAhead===undefined) daysAhead=nums[0]+7-todayNum;
            else daysAhead=daysAhead-todayNum;
            const next=new Date(); next.setDate(next.getDate()+daysAhead);
            nextDue=next.toISOString().slice(0,10);
          }
          const newTask={...task,id:uid(),done:false,createdAt:Date.now(),dueDate:nextDue||task.dueDate};
          setTasks(prev=>[newTask,...prev]);
          await upsertTask(newTask);
          toast(task.repeatDays?.length>0?"Task scheduled for next "+task.repeatDays.join("/")+" 🔁":"Repeating task recreated 🔁");
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
    if(!window.confirm("Remove this task? This can't be undone.")) return;
    await SB.delete("tasks",{id});
    setTasks(prev=>prev.filter(t=>t.id!==id));
    haptic("error");
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
    // Pre-set notification dedup key so refreshData won't fire a second notification
    const annNotifKey="nl3-notif-ann-"+ann.id;
    localStorage.setItem(annNotifKey,"1");
    setTimeout(()=>localStorage.removeItem(annNotifKey),300000);
    // Send the notification now directly to all staff
    NOTIF.broadcast("New Announcement 📢",ann.msg.slice(0,80),"announcement");
    saveAnns([ann,...anns]);
  };
  const dismissAnn=async(id,restore=false)=>{
    const updated=anns.map(a=>{
      if(a.id!==id) return a;
      const dismissed=restore
        ?(a.dismissed||[]).filter(uid=>uid!==user?.id)
        :[...(a.dismissed||[]),user?.id];
      return {...a,dismissed};
    });
    setAnns(updated);
    const ann=updated.find(a=>a.id===id);
    if(ann) await fetch(`${SUPABASE_URL}/rest/v1/announcements?id=eq.${id}`,{method:"PATCH",headers:SB.headers,body:JSON.stringify({dismissed:ann.dismissed})});
    if(restore) toast("Announcement restored ✅");
  };

  // EMPLOYEES
  const createEmp=async()=>{
    const name=String(form.eName||"").trim();
    const email=String(form.eEmail||"").trim().toLowerCase();
    if(!name||!email){toast("Name and email required","err");return;}
    if(!okEmail(email)){toast("Invalid email","err");return;}
    if(emps.find(e=>e.email===email)){toast("Email already exists","err");return;}
    const empId=uid();
    const emp={id:empId,name:san(name),email,role:form.eRole||"employee",pin:"",status:"offline",createdAt:Date.now()};
    // Save directly to Supabase first
    await SB.upsert("employees",{id:emp.id,email:emp.email,name:emp.name,role:emp.role,pin:"",status:"offline",created_at:emp.createdAt});
    setEmps(prev=>[...prev,emp]);
    addAct("employee added",`${user?.name} added: ${emp.name}`,user?.id);
    toast(`${emp.name} added! ✅`);setModal(null);setForm({});
  };
  const removeEmp=async id=>{
    if(id===user?.id){toast("Can't remove yourself","err");return;}
    const emp=emps.find(e=>e.id===id);
    await saveEmps(emps.filter(e=>e.id!==id));
    addAct("employee removed",`${user?.name} removed: ${emp?.name}`,user?.id);
    toast("Employee removed","warn");
  };

  // SETTINGS
  // Load progress for all users
  const loadProgress=async()=>{
    const rows=await SB.select("user_progress","");
    const map={};
    for(const r of rows||[]) map[r.user_id]={xp:r.xp||0,level:r.level||1,title:r.title||"Pioneer",streak:r.streak||0,last_login:r.last_login};
    setProgress(map);
    return map;
  };

  // Grant XP to current user
  const grantXP=async(amount,label)=>{
    if(!user||!XP_ELIGIBLE_ROLES.includes(user.role)) return;
    const cur=progressRef.current[user.id]||{xp:0,level:1,title:"Pioneer",streak:0};
    const newXP=cur.xp+amount;
    const maxXP=Math.max(newXP,cur.max_xp||newXP); // track highest XP ever for title
    const info=getLevelInfo(maxXP); // title based on highest, not spendable
    const leveledUp=info.level>(cur.level||1);
    const updated={xp:newXP,max_xp:maxXP,level:info.level,title:info.title,streak:cur.streak,last_login:cur.last_login};
    setProgress(prev=>({...prev,[user.id]:updated}));
    await SB.upsert("user_progress",{user_id:user.id,xp:newXP,max_xp:maxXP,level:info.level,title:info.title,streak:cur.streak,last_login:cur.last_login,created_at:Date.now()});
    // XP pop-up toast
    const xpId=uid();
    setXpToasts(p=>[...p,{id:xpId,amount,label}]); haptic("light");
    setTimeout(()=>setXpToasts(p=>p.filter(t=>t.id!==xpId)),2200);
    if(leveledUp){ toast("🎉 Level up! You are now a "+info.title+"!","ok"); playSound("success"); haptic("heavy"); }
  };

  // Handle login streak + XP
  const handleLoginXP=async(emp)=>{
    if(!XP_ELIGIBLE_ROLES.includes(emp.role)) return;
    const rows=await SB.select("user_progress",`?user_id=eq.${emp.id}`);
    const cur=rows?.[0]||{xp:0,level:1,title:"Pioneer",streak:0,last_login:null};
    const today=new Date().toISOString().slice(0,10);
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    let streak=cur.streak||0;
    if(cur.last_login===today){
      // Already logged in today — no streak change
    } else if(cur.last_login===yesterday){
      streak+=1;
    } else {
      streak=1;
    }
    const newXP=(cur.xp||0)+(cur.last_login===today?0:10);
    const info=getLevelInfo(newXP);
    const updated={user_id:emp.id,xp:newXP,level:info.level,title:info.title,streak,last_login:today,created_at:Date.now()};
    await SB.upsert("user_progress",updated);
    setProgress(prev=>({...prev,[emp.id]:{xp:newXP,level:info.level,title:info.title,streak,last_login:today}}));
  };

  // Finn proactive push — runs once after login, checks for smart insights
  const finnProactivePush=async(emp, progData)=>{
    // Note: push icon set in service-worker.js — use /finn-icon.png if available
    if(!XP_ELIGIBLE_ROLES.includes(emp.role)) return;
    if(!LS.get("nl3-notif-enabled")) return;
    const pg=progData[emp.id]||{xp:0,streak:0,level:1,title:"Pioneer"};
    const myOpenTasks=tasks.filter(t=>!t.done&&(t.assignedTo==="all"||t.assignedTo===emp.id));
    const overdue=myOpenTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date());
    const highPri=myOpenTasks.filter(t=>t.priority==="High");
    const lastPushKey="nl3-finn-last-push";
    const lastPush=LS.get(lastPushKey)||0;
    const now=Date.now();
    const hoursSincePush=(now-lastPush)/3600000;
    // Only push once per 4 hours max
    if(hoursSincePush<4) return;
    const hour=new Date().getHours();
    let title=null; let body=null;
    const lv=getLevelInfo(pg.xp);
    if(overdue.length>0){
      title="Finn — Action Needed";
      body=overdue.length+" task"+(overdue.length>1?"s":"")+" overdue. Start with: "+overdue[0].title;
    } else if(highPri.length>=2){
      title="Finn — Priority Queue";
      body=highPri.length+" high-priority tasks open. Next: "+highPri[0].title;
    } else if(pg.xp>0&&lv.xpToNext>0&&lv.xpToNext<=50){
      title="Finn — So close!";
      body="You're "+lv.xpToNext+" XP from "+lv.next?.title+". Complete one task to level up!";
    } else if(pg.streak>0&&pg.streak%7===0){
      title="Finn — Streak Milestone 🔥";
      body=pg.streak+"-day streak! You're a "+pg.title+". Keep it going.";
    } else if(pg.streak>0){
      const msTonight=new Date(); msTonight.setHours(23,59,59,999);
      const hoursLeft=(msTonight-Date.now())/3600000;
      if(hoursLeft<3){ title="Finn — Streak ending soon"; body="Your "+pg.streak+"-day streak ends in "+Math.round(hoursLeft)+" hour"+(Math.round(hoursLeft)!==1?"s":"")+". Log in and complete something!"; }
    }
    if(!title&&myOpenTasks.length===0){
      title="Finn — All Clear ✅";
      body="No open tasks. Nice work today.";
    }
    if(title&&body){
      LS.set(lastPushKey, now);
      await NOTIF.send(emp.id, title, body, "finn-insight");
    }

    // Weekly digest — Monday mornings only
    const isMonday=new Date().getDay()===1;
    const lastWeeklyKey="nl3-finn-last-weekly";
    const lastWeekly=LS.get(lastWeeklyKey)||0;
    const daysSinceWeekly=(now-lastWeekly)/86400000;
    if(isMonday&&daysSinceWeekly>6){
      const pg2=progData[emp.id]||{xp:0,streak:0,title:"Pioneer"};
      const weeklyTitle="Finn — Weekly Digest 📊";
      const weeklyBody="Week ahead: "+myOpenTasks.length+" open tasks"+( overdue.length>0?", "+overdue.length+" overdue":"")+". You're a "+pg2.title+" with "+pg2.xp+" XP.";
      LS.set(lastWeeklyKey, now);
      await NOTIF.send(emp.id, weeklyTitle, weeklyBody, "finn-weekly");
    }
  };

  const saveName=async()=>{
    const nick=String(form.pName||"").trim();
    // Nickname is device-only — never saved to Supabase
    LS.set("nl3-nickname",nick);
    setNameSaved(true);
    setTimeout(()=>setNameSaved(false),3000);
    playSound("success");
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
    setForm(p=>({...p,pinNew:"",pinCon:""}));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      setPinSaved(true);
      setTimeout(()=>setPinSaved(false),3500);
    }));
    // Vigil HyperCore: hash PIN with SHA-256 before saving
    const pinHash=await VIGIL.hashPIN(newPin);
    // Save hash to Supabase directly (bypasses saveEmps which saves plain pin field)
    await SB.patch("employees",user?.id,{pin_hash:pinHash,pin:""});
    // Update local state with hash so verification works
    const next=emps.map(e=>e.id===user?.id?{...e,pin:pinHash}:e);
    setEmps(next);
    setUser(u=>({...u,pin:pinHash}));
    VIGIL.logEvent("pin_set","PIN updated",user?.id);
    playSound("success");
    toast("PIN saved securely 🛡");
  };
  const removePin=async()=>{
    await SB.patch("employees",user?.id,{pin_hash:"",pin:""});
    const next=emps.map(e=>e.id===user?.id?{...e,pin:""}:e);
    await setEmps(next);setUser(u=>({...u,pin:""}));toast("PIN removed");
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
    {key:"boss_dms",label:"All Messages",perm:"boss"},
  ].filter(s=>!s.perm||can(user,s.perm));

  const selSx={width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:T.sp.r,color:T.txt,padding:`${T.sp.md-2}px 14px`,fontSize:T.fs.md,fontFamily:"inherit",outline:"none"};

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:T.minimal?"'Google Sans','Segoe UI',sans-serif":"'DM Sans',sans-serif",minHeight:"100vh",background:T.bg,color:T.txt}}>
      <style>{buildCSS(T)}</style>
      <ToastList items={toasts}/>
      <XPToastList items={xpToasts}/>

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
          doLogin={doLogin} doPin={doPin} notice={notice} setScreen={setScreen} siteOffline={siteOffline}
          passkeyAvailable={passkeyAvailable} passkeyEmail={passkeyEmail} doPasskeyLogin={doPasskeyLogin}
          rememberMe={rememberMe} setRememberMe={setRememberMe}/>
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
              <Btn T={T} full variant="ghost" onClick={()=>setScreen("login")}>Back</Btn>
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
            <header style={{background:T.surf,borderBottom:"1px solid "+T.bor,padding:"env(safe-area-inset-top, 0px) 8px 0",position:"sticky",top:0,zIndex:300,boxShadow:T.minimal?"none":"0 2px 10px rgba(0,0,0,.06)"}}>
              {!T.minimal&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.scarlet},${T.blue})`}}/>}
              <div style={{display:"flex",alignItems:"center",gap:12,minHeight:56,padding:"0 4px"}}>
                {/* Brand — tappable, goes home */}
                <button data-tour="logo" onClick={()=>{setSearch("");setPrevPage(page);setPage("home");playSound("click");}} style={{background:"none",border:"none",fontFamily:T.minimal?"'Google Sans',sans-serif":"'Clash Display',sans-serif",fontSize:15,fontWeight:T.minimal?500:800,color:T.txt,cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:0,transition:"opacity .15s",flexShrink:0,whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                >
                  <span style={{fontSize:17}}>🎓</span>
                  <span style={{display:"flex",gap:4}}>{"MNU's"} <span style={{color:T.accent}}>Neer Locker</span></span>
                </button>

                {/* Responsive right section */}
              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,marginLeft:"auto",minWidth:0}}>
                {/* Tablet/Desktop: full search bar */}
                <button onClick={()=>{setShowGlobalSearch(true);playSound("open");}}
                  title="Search (⌘K)"
                  className="search-full"
                  style={{display:"flex",alignItems:"center",gap:5,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,padding:"5px 10px",cursor:"pointer",color:T.sub,fontSize:12,fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+"66";e.currentTarget.style.color=T.txt;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bor;e.currentTarget.style.color=T.sub;}}
                >
                  <span style={{fontSize:14}}>🔍</span>
                  <span className="search-label">Search</span>
                  <span className="search-label" style={{fontSize:10,opacity:0.5}}>⌘K</span>
                </button>
                <NotifBell T={T} anns={anns} dms={dms} tasks={tasks} user={user} onOpen={()=>{playSound("open");setShowNotifCenter(true);}}/>
                {/* Profile button */}
                <button onClick={()=>{setPage("set");setSettingsTab("profile");playSound("click");}}
                  style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:10,transition:"background .15s",fontFamily:"inherit",minWidth:0}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}
                  title="Profile Settings"
                >
                  <Avatar email={user.email} color={ROLES[user.role]?.color||T.scarlet} size={30} avatarUrl={user.avatar_url} frame={equippedFrame}/>
                  <div className="header-name" style={{display:"flex",flexDirection:"column",lineHeight:1.2,minWidth:0,textAlign:"left"}}>
                    <span style={{fontSize:13,color:T.txt,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:90}}>{user.name.split(" ")[0]}</span>
                    <span style={{fontSize:10,color:T.sub,fontWeight:500}}>{ROLES[user.role]?.label||""}</span>
                  </div>
                </button>
                <button onClick={()=>{playSound("click");haptic("light");doLogout();}} title="Sign Out" style={{flexShrink:0,background:"none",border:"1px solid "+T.bor,borderRadius:8,padding:"5px 8px",cursor:"pointer",color:T.sub,fontSize:13,fontFamily:"inherit",transition:"all .15s",display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.color=T.scarlet} onMouseLeave={e=>e.currentTarget.style.color=T.sub}><span>↩</span><span className="header-name" style={{fontSize:11,fontWeight:700}}>Sign Out</span></button>
              </div>
              </div>
            </header>

            {/* Floating circle NavMenu — always visible top-left */}
            <div style={{position:"fixed",left:10,top:62,zIndex:350}}>
              <NavMenu user={user} page={page} setPage={p=>{setSearch("");setPrevPage(page);setPage(p);}} tasks={tasks} anns={anns} dms={dms} T={T} onFinn={()=>openFinn()} onShop={()=>setShowShop(true)}/>
            </div>

            {/* Page content */}
            <main
              style={{flex:1,padding:T.compact?"12px 14px 60px":"18px 20px 80px",overflowY:"auto",overflowX:"hidden",position:"relative"}}
              ref={ptrRef}
              onTouchStart={e=>{
                window._ptrStartY=e.touches[0].clientY;
                window._ptrScrollTop=ptrRef.current?.scrollTop||0;
              }}
              onTouchMove={e=>{
                if(window._ptrStartY===undefined) return;
                if(window._ptrScrollTop>0){ window._ptrStartY=undefined; return; }
                const dy=e.touches[0].clientY-window._ptrStartY;
                if(dy>8) setPtrY(Math.min(dy*0.45,70));
                else if(dy<0) { window._ptrStartY=undefined; setPtrY(0); }
              }}
              onTouchEnd={async()=>{
                if(ptrY>50){
                  setPtrActive(true);
                  haptic("medium");
                  await refreshData();
                  setTimeout(()=>{setPtrActive(false);setPtrY(0);haptic("light");},800);
                } else {
                  setPtrY(0);
                }
                window._ptrStartY=undefined;
                window._ptrScrollTop=0;
              }}
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
                  setPrevPage(page);
                  setTimeout(()=>{setSearch("");setPage("home");setSwipeBacking(false);},320);
                }
                window._swipeStartX=0;window._swipeStartY=0;window._swipePct=0;
              }}
            >
              {/* Pull to refresh indicator */}
              {(ptrY>0||ptrActive)&&(
                <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",justifyContent:"center",paddingTop:8,zIndex:200,pointerEvents:"none",transform:`translateY(${ptrActive?0:ptrY-40}px)`,transition:ptrActive?"transform .2s":"none"}}>
                  <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 12px rgba(0,0,0,.12)",fontSize:12,fontWeight:700,color:T.sub}}>
                    <span className={ptrActive?"ptr-spinner":""} style={{fontSize:14,display:"inline-block",transform:ptrActive?"none":`rotate(${ptrY*3}deg)`}}>↻</span>
                    {ptrActive?"Refreshing…":"Pull to refresh"}
                  </div>
                </div>
              )}
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
              {page==="home"&&<HomePage user={user} tasks={tasks} anns={anns} emps={emps} dms={dms} T={T} setPage={p=>{setSearch("");setPrevPage(page);setPage(p);}} toast={toast} progress={progress} prevPage={prevPage} setPrevPage={setPrevPage} isOffline={isOffline} scheduleUrl={scheduleUrl} onShop={()=>setShowShop(true)} equippedBadges={equippedBadges} nameColorId={nameColorId}/>}

              {/* TASKS */}
              {page==="tasks"&&(
                <div className="fu">
                  <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",marginTop:48}}>
                    <SearchBar T={T} value={search} onChange={setSearch} placeholder="Search tasks…"/>
                    {can(user,"assign")&&<Btn T={T} sm onClick={()=>{setForm({tPri:"Medium",tAssign:"all",tRepeat:false});setModal("task");}}>+ New Task</Btn>}
                  </div>
                  <SLabel T={T}>OPEN · {openT.length}</SLabel>
                  {openT.length===0&&dataLoaded&&<Empty icon={E("🎉","")} msg="All caught up!" T={T}/>}
                  {!dataLoaded&&[1,2,3].map(i=><SkeletonCard key={i} T={T}/>)}
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
                  {inv.length===0?<Empty icon={E("📦","")} msg="No items yet" T={T}/>:(
                    <div style={{display:"grid",gap:T.compact?6:8}}>
                      {inv.map((item,i)=>(
                        <div key={item.id} className="card" style={{background:T.card,border:`1px solid ${item.stock===0?T.accent+"55":T.bor}`,borderRadius:14,padding:T.compact?"10px 14px":"13px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",animation:`fadeUp .25s ${i*30}ms ease both`}}>
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
                  {myAnns.length===0?<Empty icon={E("🔔","")} msg="No announcements" T={T}/>:(
                    <div style={{display:"grid",gap:10}}>
                      {myAnns.map((a,i)=>{
                        const lc={info:T.blue,warn:T.warn,danger:T.scarlet}[a.level]||T.blue;
                        return (
                          <div key={a.id} style={{background:T.card,border:`1px solid ${lc}33`,borderLeft:`3px solid ${lc}`,borderRadius:14,padding:"14px 16px",animation:`fadeUp .25s ${i*35}ms ease both`}}>
                            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                              <span style={{fontSize:18}}>{({"info":"ℹ️","warn":"⚠️","danger":"🚨"})[a.level]||"ℹ️"}</span>
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
                  {/* Recently Dismissed */}
                  {(()=>{
                    const dismissed=anns.filter(a=>(a.dismissed||[]).includes(user?.id));
                    if(!dismissed.length) return null;
                    return (
                      <div style={{marginTop:24}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.faint,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>Recently Dismissed ({dismissed.length})</div>
                        <div style={{display:"grid",gap:8,opacity:0.6}}>
                          {dismissed.map((a,i)=>{
                            const lc={info:T.blue,warn:T.warn,danger:T.scarlet}[a.level]||T.blue;
                            return (
                              <div key={a.id} style={{background:T.card,border:`1px solid ${T.bor}`,borderLeft:`3px solid ${lc}44`,borderRadius:12,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
                                <span style={{fontSize:16}}>{({info:"ℹ️",warn:"⚠️",danger:"🚨"})[a.level]||"ℹ️"}</span>
                                <div style={{flex:1,fontSize:13,color:T.sub,lineHeight:1.5}}>{a.msg}</div>
                                <button onClick={()=>{playSound("click");dismissAnn(a.id,true);}} title="Restore"
                                  style={{background:T.surfH,border:"1px solid "+T.bor,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:T.sub,cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}
                                >↩ Restore</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* DMs */}
              {page==="dms"&&<DMSection user={user} emps={emps} dms={dms} setDms={saveDms} T={T} toast={toast} onXP={()=>grantXP(5,"dm sent")}/>}

              {/* LEADERBOARD */}
              {page==="leaderboard"&&<LeaderboardPage emps={emps} progress={progress} user={user} T={T} onShop={()=>setShowShop(true)} onViewProfile={e=>setViewingProfile(e)}/>}

              {/* SCHEDULE */}
              {page==="schedule"&&(
                <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",marginTop:48,padding:24}}>
                  <div style={{background:T.card,border:"1px solid "+T.bor,borderRadius:20,padding:32,maxWidth:380,width:"100%",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
                    <div style={{fontSize:52}}>📅</div>
                    <div>
                      <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt,marginBottom:8}}>Staff Schedule</div>
                      {scheduleUrl?(
                        <div style={{fontSize:14,color:T.sub,lineHeight:1.6}}>Your schedule is ready. Choose how you'd like to open it.</div>
                      ):(
                        <div style={{fontSize:14,color:T.sub,lineHeight:1.6}}>No schedule has been set yet. Ask your Technical Administrator to add the schedule link.</div>
                      )}
                    </div>
                    {scheduleUrl&&(
                      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
                        <a href={scheduleUrl} target="_blank" rel="noopener"
                          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:T.scarlet,color:"#fff",borderRadius:12,padding:"14px 20px",fontWeight:800,fontSize:15,fontFamily:"inherit",textDecoration:"none",transition:"opacity .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                          onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                        >
                          <span style={{fontSize:18}}>↗</span> Open in New Tab
                        </a>
                        <button onClick={()=>window.location.href=scheduleUrl}
                          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:T.surfH,color:T.txt,border:"1px solid "+T.bor,borderRadius:12,padding:"14px 20px",fontWeight:700,fontSize:15,fontFamily:"inherit",cursor:"pointer",transition:"all .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.surf}
                          onMouseLeave={e=>e.currentTarget.style.background=T.surfH}
                        >
                          <span style={{fontSize:18}}>🌐</span> Open in This Browser
                        </button>
                        <div style={{fontSize:11,color:T.faint,marginTop:4}}>
                          Last updated by Tech Admin
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  {filtAct.length===0?<Empty icon={E("📊","")} msg="No activity yet" T={T}/>:(
                    <div style={{display:"grid",gap:T.compact?5:8}}>
                      {filtAct.slice(0,80).map((entry,i)=>(
                        <div key={entry.id} style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:12,padding:"11px 14px",display:"flex",gap:10,alignItems:"center",animation:`fadeUp .2s ${i*12}ms ease both`}}>
                          <span style={{fontSize:15}}>{({"login":E("🟢","●"),"logout":E("🔴","●"),"task_done":E("✅","✓"),"task_created":E("📝","·"),"employee added":E("👤","·"),"employee removed":E("🗑️","·")})[entry.type]||"📋"}</span>
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
                      <button key={s.key} onClick={()=>{playSound("click");setSettingsTab(s.key);}} style={{background:setTab2===s.key?T.accent+"18":"none",color:setTab2===s.key?T.scarlet:T.sub,border:`1px solid ${setTab2===s.key?T.scarlet+"44":"transparent"}`,borderRadius:T.sp.r,padding:"9px 14px",fontWeight:700,fontSize:13,fontFamily:"inherit",cursor:"pointer",textAlign:"left",transition:"all .18s"}}>{s.label}</button>
                    ))}
                  </div>
                  <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:16,padding:T.sp.xl}}>

                    {setTab2==="profile"&&(
                      <div style={{display:"grid",gap:18}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>Profile</div>
                        <div style={{display:"flex",alignItems:"center",gap:14}}>
                          <div style={{position:"relative",cursor:"pointer"}} onClick={()=>{playSound("click");setShowPfpUpload(true);}} title="Change profile picture">
                            <Avatar email={user.email} color={ROLES[user.role]?.color||T.scarlet} size={54} avatarUrl={user.avatar_url} frame={equippedFrame}/>
                            <div style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:T.accent,border:`2px solid ${T.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:800}}>{E("📸","+")}</div>
                          </div>
                          <div>
                            <div style={{fontWeight:700,fontSize:T.fs.xl,color:nameColorId==="name_color"?T.accent:T.txt,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>{user.name}<UserBadges badgeIds={equippedBadges} size={16} gap={4}/></div>
                            <div style={{color:T.sub,fontSize:T.fs.sm}}>{user.email}</div>
                            <Tag label={ROLES[user.role]?.label} color={ROLES[user.role]?.color||T.scarlet}/>
                          </div>
                        </div>
                        <Hr T={T}/>
                        <div>
                          <Inp T={T} label="NICKNAME (only you can see this)" placeholder="Add a nickname…" value={form.pName??""} onChange={e=>{setNameSaved(false);setForm(p=>({...p,pName:e.target.value}));}}/>
                          <div style={{fontSize:11,color:T.sub,marginTop:4,lineHeight:1.5}}>
                            🔒 Your nickname is stored on this device only and is never shown to other staff members. Your display name shown to others is set by your manager.
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Btn T={T} sm onClick={saveName}>Save Nickname</Btn>
                          {nameSaved&&(
                            <div style={{display:"flex",alignItems:"center",gap:5,animation:"fadeUp .2s ease",color:T.ok,fontWeight:700,fontSize:13}}>
                              <span style={{fontSize:16}}>✅</span> Nickname saved!
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
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
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
                        {/* ── Badge & Name Color Manager ─────────────────────── */}
                        {(()=>{
                          const unlockedBadgeIds=JSON.parse(localStorage.getItem("nl3-unlocked-badges")||
                            // Fall back to checking purchases (if they have a purchase, badge is unlocked)
                            "[]");
                          // Always include all bought badge item IDs
                          const allUnlocked=Object.keys(BADGE_CATALOG).filter(id=>{
                            const ls=JSON.parse(localStorage.getItem("nl3-unlocked-badges")||"[]");
                            return ls.includes(id);
                          });
                          const hasAnyBadge=allUnlocked.length>0;
                          const hasNameColor=localStorage.getItem("nl3-unlocked-colors")?.includes("name_color")||false;
                          if(!hasAnyBadge&&!hasNameColor) return null;
                          return (
                            <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:T.minimal?16:14,padding:16}}>
                              <div style={{fontWeight:T.minimal?600:700,fontSize:T.minimal?15:14,color:T.txt,marginBottom:12,letterSpacing:T.minimal?"-0.2px":"normal"}}>
                                {E("🏅","◆")} Badges & Name Style
                              </div>
                              {/* Badge slots — up to 3 equipped */}
                              {hasAnyBadge&&(
                                <div style={{marginBottom:12}}>
                                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.04em",marginBottom:8}}>EQUIPPED BADGES (max 3)</div>
                                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
                                    {allUnlocked.map(id=>{
                                      const b=BADGE_CATALOG[id];
                                      if(!b) return null;
                                      const isEquipped=equippedBadges.includes(id);
                                      return (
                                        <button key={id} title={`${b.name}: ${b.desc}${isEquipped?" (equipped — click to remove)": equippedBadges.length>=3?" (max 5 equipped)":" (click to equip)"}`}
                                          onClick={()=>{
                                            playSound("click");
                                            if(isEquipped){
                                              saveEquippedBadges(equippedBadges.filter(x=>x!==id));
                                            } else if(equippedBadges.length<5){
                                              saveEquippedBadges([...equippedBadges,id]);
                                            } else {
                                              toast("Max 3 badges equipped — remove one first","warn");
                                            }
                                          }}
                                          style={{display:"flex",alignItems:"center",gap:6,background:isEquipped?b.color+"22":T.bg,border:`1.5px solid ${isEquipped?b.color:T.bor}`,borderRadius:9999,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",opacity:equippedBadges.length>=5&&!isEquipped?0.5:1}}>
                                          <span style={{fontSize:16}}>{b.icon}</span>
                                          <span style={{fontSize:12,fontWeight:700,color:isEquipped?b.color:T.txt}}>{b.name}</span>
                                          {isEquipped&&<span style={{fontSize:10,color:b.color,fontWeight:800}}>✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{fontSize:11,color:T.sub}}>Tap a badge to equip/unequip · max 5 show next to your name</div>
                                  {equippedBadges.length>0&&(
                                    <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,background:T.bg,borderRadius:10,padding:"8px 12px"}}>
                                      <span style={{fontSize:11,color:T.sub,fontWeight:600}}>Preview:</span>
                                      <span style={{fontSize:13,fontWeight:700,color:nameColorId==="name_color"?T.accent:T.txt}}>{user.name.split(" ")[0]}</span>
                                      <UserBadges badgeIds={equippedBadges} size={16} gap={4}/>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Name color toggle */}
                              {hasNameColor&&(
                                <div style={{marginBottom:12}}>
                                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.04em",marginBottom:8}}>NAME COLOR</div>
                                  <div style={{display:"flex",gap:8}}>
                                    {["base","name_color"].map(id=>(
                                      <button key={id} onClick={()=>{playSound("click");saveNameColor(id);}}
                                        style={{flex:1,background:nameColorId===id?T.accent+"18":T.bg,border:`1.5px solid ${nameColorId===id?T.accent:T.bor}`,borderRadius:9999,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:id==="name_color"?T.accent:T.txt,transition:"all .15s"}}>
                                        {id==="base"?"Default":E("✨","★")+" Accent Color"}
                                        {nameColorId===id&&<span style={{marginLeft:4,fontSize:10,fontWeight:800,color:T.accent}}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Avatar Frame picker */}
                              {(()=>{
                                const unlockedFrames=JSON.parse(localStorage.getItem("nl3-unlocked-frames")||"[]");
                                if(!unlockedFrames.length) return null;
                                const frameInfo={
                                  pfp_frame_gold:   {label:"Gold",   color:"#eab308"},
                                  pfp_frame_scarlet:{label:"Scarlet",color:"#C8102E"},
                                  pfp_frame_blue:   {label:"Blue",   color:"#1e7fa8"},
                                  pfp_frame_rainbow:{label:"Rainbow",color:"#a855f7"},
                                };
                                return (
                                  <div>
                                    <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.04em",marginBottom:8}}>AVATAR FRAME</div>
                                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                      <button onClick={()=>{playSound("click");saveEquippedFrame("");}}
                                        style={{background:!equippedFrame?T.accent+"18":T.bg,border:`1.5px solid ${!equippedFrame?T.accent:T.bor}`,borderRadius:9999,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:T.txt,transition:"all .15s"}}>
                                        None {!equippedFrame&&<span style={{color:T.accent,marginLeft:4}}>✓</span>}
                                      </button>
                                      {unlockedFrames.map(id=>{
                                        const fi=frameInfo[id];if(!fi) return null;
                                        const isEquipped=equippedFrame===id;
                                        return (
                                          <button key={id} onClick={()=>{playSound("click");saveEquippedFrame(id);}}
                                            style={{background:isEquipped?fi.color+"22":T.bg,border:`1.5px solid ${isEquipped?fi.color:T.bor}`,borderRadius:9999,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:isEquipped?fi.color:T.txt,transition:"all .15s",display:"flex",alignItems:"center",gap:6}}>
                                            <span style={{width:10,height:10,borderRadius:"50%",background:fi.color,boxShadow:`0 0 6px ${fi.color}`}}/>
                                            {fi.label} {isEquipped&&<span>✓</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                        {/* Guided tour button */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:T.minimal?16:14,padding:20,display:"flex",gap:14,alignItems:"center"}}>
                          <div style={{width:44,height:44,borderRadius:T.minimal?"50%":12,background:T.accent+"18",border:`1px solid ${T.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>{E("✨","★")}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:T.minimal?600:700,fontSize:T.minimal?15:14,color:T.txt,marginBottom:2,letterSpacing:T.minimal?"-0.2px":"normal"}}>New here?</div>
                            <div style={{fontSize:12,color:T.sub,lineHeight:1.5}}>Take a quick guided tour of Neer Locker — under a minute.</div>
                          </div>
                          <button onClick={()=>{playSound("open");setShowOnboarding(true);}}
                            style={{background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"10px 20px",fontWeight:T.minimal?500:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"opacity .15s",flexShrink:0,whiteSpace:"nowrap"}}
                            onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                          >Start tour</button>
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
                        {/* Biometric / Passkey registration */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:14}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>🔑 Face ID / Touch ID / Fingerprint</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:10,lineHeight:1.5}}>
                            {WA.supported()
                              ?"Register your device biometric to sign in without typing your email."
                              :"Your browser does not support biometric login."}
                          </div>
                          {/* iOS/Android instructions */}
                          {WA.supported()&&!localStorage.getItem("nl3-passkey-cred-"+user?.id)&&(
                            <div style={{background:`${T.blue}12`,border:`1px solid ${T.blue}33`,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:T.sub,lineHeight:1.7}}>
                              <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>📱 Before you set this up:</div>
                              <div><strong>iPhone:</strong> You must have the app <strong>added to your home screen from Safari</strong> and be using it from there — Face ID / Touch ID will not work in a regular browser tab. <a href="https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios" target="_blank" style={{color:T.accent}}>How to add to home screen →</a></div>
                              <div style={{marginTop:4}}><strong>Android:</strong> Works great in Chrome — no extra steps needed. ✅</div>
                            </div>
                          )}
                          {WA.supported()&&(
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              <Btn T={T} sm onClick={async()=>{
                                const result=await WA.register(user.id,user.name,user.email);
                                if(result){
                                  localStorage.setItem("nl3-passkey-cred-"+user.id,result.credentialId);
                                  localStorage.setItem("nl3-passkey-email",user.email);
                                  setPasskeyAvailable(true);
                                  setPasskeyEmail(user.email);
                                  playSound("success");
                                  toast("Biometric login enabled! ✅");
                                } else {
                                  toast("Biometric setup failed — try again","err");
                                }
                              }}>
                                {localStorage.getItem("nl3-passkey-cred-"+user?.id)?"Update Biometric":"Enable Biometric Login"}
                              </Btn>
                              {localStorage.getItem("nl3-passkey-cred-"+user?.id)&&(
                                <Btn T={T} sm variant="danger" onClick={()=>{
                                  localStorage.removeItem("nl3-passkey-cred-"+user.id);
                                  localStorage.removeItem("nl3-passkey-email");
                                  setPasskeyAvailable(false);
                                  setPasskeyEmail("");
                                  playSound("delete");
                                  toast("Biometric login removed","warn");
                                }}>Remove</Btn>
                              )}
                            </div>
                          )}
                          {localStorage.getItem("nl3-passkey-cred-"+user?.id)&&(
                            <div style={{marginTop:8,fontSize:11,color:T.ok,fontWeight:600}}>✓ Biometric login is active on this device</div>
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
                                <div style={{fontWeight:700,color:T.txt,fontSize:T.fs.md,display:"flex",alignItems:"center",gap:6}}><span style={{cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2,textDecorationStyle:"dotted"}} onClick={()=>setViewingProfile(e)}>{e.name}</span>{e.id===user.id&&<span style={{fontSize:11,color:T.mut,fontWeight:400}}>(you)</span>}</div>
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

                        {/* Dark mode — system/light/dark */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Appearance</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>Choose your theme or follow your device setting.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            {[
                              {key:"system",label:"System",icon:"🌓",desc:"Follows your device"},
                              {key:"light", label:"Light",  icon:"☀️", desc:"Always light"},
                              {key:"dark",  label:"Dark",   icon:"🌙", desc:"Always dark"},
                            ].map(opt=>{
                              const current=LS.get('nl3-dark')===null?"system":dark?"dark":"light";
                              const active=current===opt.key;
                              return (
                                <button key={opt.key} onClick={()=>{
                                  playSound("click");
                                  if(opt.key==="system"){
                                    LS.set('nl3-dark',null);
                                    const sys=window.matchMedia('(prefers-color-scheme: dark)').matches;
                                    applyTheme(sys,compact);
                                  } else {
                                    applyTheme(opt.key==="dark",compact);
                                  }
                                }} style={{background:active?T.accent+"18":"none",border:`2px solid ${active?T.accent:T.bor}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all .2s"}}>
                                  <div style={{fontSize:20,marginBottom:4}}>{opt.icon}</div>
                                  <div style={{fontWeight:700,color:active?T.accent:T.txt,fontSize:13}}>{opt.label}</div>
                                  <div style={{fontSize:10,color:T.sub,marginTop:2}}>{opt.desc}</div>
                                  {active&&<div style={{fontSize:10,color:T.accent,fontWeight:800,marginTop:4}}>✓ Active</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Layout density */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Layout Density</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>How much information is shown on screen at once.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            {[{k:false,label:"Comfortable",icon:"🛋️",desc:"More spacing, easier to read"},{k:true,label:"Compact",icon:"📊",desc:"More data, tighter layout"}].map(opt=>(
                              <button key={String(opt.k)} onClick={()=>{playSound("click");applyTheme(dark,opt.k);}} style={{background:compact===opt.k?T.accent+"18":"none",border:`2px solid ${compact===opt.k?T.scarlet:T.bor}`,borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .2s"}}>
                                <div style={{fontSize:20,marginBottom:4}}>{opt.icon}</div>
                                <div style={{fontWeight:700,color:compact===opt.k?T.scarlet:T.txt,fontSize:13}}>{opt.label}</div>
                                <div style={{fontSize:11,color:T.sub,marginTop:3}}>{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Minimal Mode */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div>
                              <div style={{fontWeight:700,color:T.txt,display:"flex",alignItems:"center",gap:8}}>
                                ✦ Minimal Mode
                                {minimalMode&&<span style={{fontSize:10,fontWeight:700,background:T.accent+"20",color:T.accent,borderRadius:100,padding:"2px 8px"}}>ACTIVE</span>}
                              </div>
                              <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2,lineHeight:1.5}}>Google Antigravity-inspired look. Clean white cards, pill buttons, sans-serif. Same features.</div>
                            </div>
                            <button onClick={()=>{
                              const next=!minimalMode;
                              applyTheme(dark,compact,undefined,next);
                              playSound("click");
                            }} style={{width:50,height:27,borderRadius:14,background:minimalMode?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                              <div style={{width:21,height:21,borderRadius:"50%",background:T.minimal?(minimalMode?"#fff":(T.dark?"#e0e0e0":"#202124")):"#fff",position:"absolute",top:3,left:minimalMode?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                            </button>
                          </div>
                          {minimalMode&&(
                            <div style={{marginTop:12,padding:"10px 12px",background:T.bg,borderRadius:8,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                              <div style={{fontSize:11,color:T.sub}}>Preview:</div>
                              <div style={{background:T.dark?"#ffffff":"#202124",color:T.dark?"#000":"#fff",borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:500,fontFamily:"'Google Sans',sans-serif"}}>Primary</div>
                              <div style={{background:"transparent",color:T.txt,border:"1.5px solid "+T.txt,borderRadius:9999,padding:"4px 12px",fontSize:11,fontWeight:500}}>Ghost</div>
                              <div style={{background:T.surf,border:"1px solid "+T.bor,borderRadius:8,padding:"4px 10px",fontSize:11,color:T.txt}}>Card</div>
                            </div>
                          )}

                        </div>

                        {/* Device / UI Scaling */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:2}}>◈ Atlas & UI Scaling</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12,lineHeight:1.5}}>Choose how the app scales to your device. This adjusts font sizes and tap target sizes across the whole app.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            {[
                              {mode:"auto",   icon:"🔄", label:"Auto",    desc:"Detects your screen size automatically"},
                              {mode:"mobile", icon:"📱", label:"Mobile",  desc:"Larger text & buttons, optimized for touch"},
                              {mode:"tablet", icon:"📟", label:"Tablet",  desc:"Medium size, great for iPad & tablet web app"},
                              {mode:"desktop",icon:"🖥️", label:"Desktop", desc:"Compact, more information visible at once"},
                            ].map(opt=>{
                              const active=deviceMode===opt.mode;
                              return (
                                <button key={opt.mode} onClick={()=>applyDeviceMode(opt.mode)}
                                  style={{background:active?T.accent+"18":"none",border:`2px solid ${active?T.accent:T.bor}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",fontFamily:"inherit",transition:"all .2s"}}>
                                  <div style={{fontSize:22,marginBottom:4}}>{opt.icon}</div>
                                  <div style={{fontWeight:700,color:active?T.accent:T.txt,fontSize:13}}>{opt.label}</div>
                                  <div style={{fontSize:10,color:T.sub,marginTop:3,lineHeight:1.4}}>{opt.desc}</div>
                                  {active&&<div style={{marginTop:6,fontSize:10,color:T.accent,fontWeight:800}}>✓ Active</div>}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{marginTop:10,fontSize:11,color:T.sub,background:T.bg,borderRadius:8,padding:"8px 12px"}}>
                            Current: <strong style={{color:T.accent}}>{deviceMode==="auto"?(window.innerWidth<=768?"Auto (Mobile)":window.innerWidth<=1024?"Auto (Tablet)":"Auto (Desktop)"):deviceMode==="mobile"?"Mobile":deviceMode==="tablet"?"Tablet":"Desktop"}</strong>
                            {" · "}Base font: <strong>{deviceMode==="mobile"?"18px":deviceMode==="tablet"?"15px":"13px"}</strong>
                          </div>
                        </div>

                        {/* Push Notifications */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>🔔 Push Notifications</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:10,lineHeight:1.5}}>
                            Get notified for new tasks, announcements, and messages — even when the app is in the background.
                          </div>
                          {notifPerms==="unsupported"?(
                            <div style={{fontSize:12,color:T.sub,fontStyle:"italic"}}>Your browser doesn&apos;t support notifications.</div>
                          ):notifPerms==="denied"?(
                            <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#991b1b",fontWeight:600}}>
                              ⚠️ Notifications are blocked. Go to your browser settings and allow notifications for this site, then come back here.
                            </div>
                          ):(
                            <div style={{display:"flex",flexDirection:"column",gap:10}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                                <div>
                                  <div style={{fontWeight:600,color:T.txt,fontSize:13}}>Enable Notifications</div>
                                  <div style={{fontSize:11,color:T.sub,marginTop:1}}>Tasks · Announcements · Messages</div>
                                </div>
                                {/* Toggle */}
                                <button onClick={async()=>{
                                  if(!notifEnabled){
                                    const sub=await NOTIF.subscribe(user.id);
                                    setNotifPerms(NOTIF.permission());
                                    if(sub){
                                      setNotifEnabled(true);
                                      notifEnabledRef.current=true;
                                      LS.set("nl3-notif-enabled",true);
                                      playSound("notify");
                                      toast("Notifications enabled! ✅");
                                    } else {
                                      toast("Notification setup failed — check permissions","err");
                                    }
                                  } else {
                                    await NOTIF.unsubscribe(user.id);
                                    setNotifEnabled(false);
                                    notifEnabledRef.current=false;
                                    LS.set("nl3-notif-enabled",false);
                                    playSound("click");
                                    toast("Notifications disabled","warn");
                                  }
                                }} style={{flexShrink:0,width:48,height:26,borderRadius:13,background:notifEnabled?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                                  <div style={{position:"absolute",top:3,left:notifEnabled?24:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
                                </button>
                              </div>
                              {notifEnabled&&(
                                <div style={{fontSize:11,color:T.ok,fontWeight:600}}>✓ Notifications enabled.</div>
                              )}
                              <div style={{fontSize:11,color:T.sub,lineHeight:1.6,background:T.bg,borderRadius:8,padding:"8px 12px"}}>
                                <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Status:</div>
                                Permission: <span style={{color:notifPerms==="granted"?T.ok:T.err,fontWeight:700}}>{notifPerms}</span>
                                {" · "}PWA mode: <span style={{color:NOTIF.isPWA()?T.ok:T.warn,fontWeight:700}}>{NOTIF.isPWA()?"Yes":"No (browser tab)"}</span>
                                <div style={{marginTop:6}}><strong>iPhone:</strong> Open from Safari → Share → Add to Home Screen, then enable here.</div>
                                <div><strong>Android/Desktop:</strong> Works in Chrome — just enable above.</div>
                              </div>
                              {notifEnabled&&(
                                <button onClick={async()=>{
                                  try{
                                    const r=await fetch("https://neer-locker.vercel.app/api/send-push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,title:"Finn — Test Notification",body:"Push notifications are working! Check this off.",tag:"test"})});
                                    const d=await r.json();
                                    if(d.sent>0) toast("Test notification sent! ✅");
                                    else toast("Sent but 0 delivered — re-enable notifications","err");
                                  }catch(e){ toast("Send failed: "+e.message,"err"); }
                                }} style={{background:T.bG,border:`1px solid ${T.blue}44`,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,color:T.blue,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
                                  🔔 Send Test Notification
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Emoji toggle — minimal mode only */}
                        {minimalMode&&(
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:16,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,color:T.txt}}>Emoji Icons</div>
                            <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2}}>Show emoji icons throughout the app</div>
                          </div>
                          <button onClick={()=>{const next=!showEmojis;setShowEmojis(next);window._showEmojis=next;LS.set("nl3-emojis",next);setT(prev=>({...prev,showEmojis:next}));playSound("click");}} style={{width:50,height:27,borderRadius:14,background:showEmojis?T.scarlet:(T.dark?"#505050":"#909090"),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{width:21,height:21,borderRadius:"50%",position:"absolute",top:3,left:showEmojis?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)",background:showEmojis?"#fff":(T.dark?"#e0e0e0":"#202124")}}/>
                          </button>
                        </div>
                        )}
                        {/* Minimal sound toggle */}
                        {minimalMode&&<div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:T.minimal?16:12,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,color:T.txt}}>Minimal Sounds</div>
                            <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2}}>Clean short tones in minimal mode</div>
                          </div>
                          <button onClick={()=>{
                            const next=!window._minimalSounds;
                            window._minimalSounds=next;
                            LS.set("nl3-minimal-sound",next);
                            setT(prev=>({...prev}));
                            playSound("click");
                          }} style={{width:50,height:27,borderRadius:14,background:(window._minimalSounds!==false)?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{width:21,height:21,borderRadius:"50%",background:T.minimal?((window._minimalSounds!==false)?"#fff":(T.dark?"#e0e0e0":"#202124")):"#fff",position:"absolute",top:3,left:(window._minimalSounds!==false)?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                          </button>
                        </div>}

                        {/* Accent color */}
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>Accent Color</div>
                          <div style={{fontSize:T.fs.sm,color:T.sub,marginBottom:12}}>Choose your preferred accent color for highlights and buttons.</div>
                          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                            {(()=>{
                              const unlockedIds=JSON.parse(localStorage.getItem("nl3-unlocked-colors")||"[]");
                              const baseColors=[
                                {id:"base",label:"Scarlet",value:"#C8102E",locked:false},
                                {id:"base",label:"Blue",value:"#1e7fa8",locked:false},
                                {id:"base",label:"Purple",value:"#7c3aed",locked:false},
                                {id:"base",label:"Green",value:"#15803d",locked:false},
                                {id:"base",label:"Orange",value:"#c2410c",locked:false},
                                {id:"base",label:"Pink",value:"#be185d",locked:false},
                              ];
                              const shopColors=[
                                {id:"color_teal",    label:"Teal",    value:"#0d9488"},
                                {id:"color_indigo",  label:"Indigo",  value:"#4f46e5"},
                                {id:"color_rose",    label:"Rose",    value:"#e11d48"},
                                {id:"color_amber",   label:"Amber",   value:"#d97706"},
                                {id:"color_emerald", label:"Emerald", value:"#059669"},
                                {id:"color_violet",  label:"Violet",  value:"#9333ea"},
                                {id:"color_slate",   label:"Slate",   value:"#475569"},
                                {id:"color_cyan",    label:"Cyan",    value:"#0891b2"},
                                {id:"color_lime",    label:"Lime",    value:"#65a30d"},
                                {id:"color_fuchsia", label:"Fuchsia", value:"#c026d3"},
                                {id:"color_midnight",label:"Midnight",value:"#1e1b4b"},
                                {id:"color_gold",    label:"Gold",    value:"#b45309"},
                              ].map(c=>({...c,locked:!unlockedIds.includes(c.id)}));
                              return [...baseColors,...shopColors].map(ac=>{
                                const isActive=T.accent===ac.value;
                                return (
                                  <div key={ac.label} style={{position:"relative"}} title={ac.locked?`${ac.label} — buy in XP Shop`:ac.label}>
                                    <button onClick={()=>{if(ac.locked){setShowShop(true);toast("Buy this color in the XP Shop! 🛍","warn");return;}playSound("click");applyTheme(dark,compact,ac.value);}}
                                      style={{width:30,height:30,borderRadius:"50%",background:ac.value,border:`3px solid ${isActive?"#000":"transparent"}`,cursor:ac.locked?"pointer":"pointer",transition:"transform .15s,border-color .15s",boxShadow:isActive?`0 0 0 2px ${ac.value}`:"none",opacity:ac.locked?0.35:1,filter:ac.locked?"grayscale(0.5)":"none"}}
                                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                                      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                                    />
                                    {ac.locked&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",fontSize:10}}>🔒</div>}
                                  </div>
                                );
                              });
                            })()}
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
                        {/* Voice toggle */}
                        <div style={{background:T.surfH,border:"1px solid "+T.bor,borderRadius:12,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,color:T.txt}}>{E("🔊","♪")} Finn Voice</div>
                            <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2}}>Finn reads replies aloud — works on all devices</div>
                          </div>
                          <button onClick={()=>{
                            const next=!voiceOnGlobal;
                            setVoiceOnGlobal(next);
                            LS.set("nl3-finn-voice",next);
                            if(!next){ window.speechSynthesis.cancel(); }
                            setForm(p=>({...p}));
                          }} style={{width:50,height:27,borderRadius:14,background:voiceOnGlobal?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                            <div style={{width:21,height:21,borderRadius:"50%",background:T.minimal?(voiceOnGlobal?"#fff":(T.dark?"#e0e0e0":"#202124")):"#fff",position:"absolute",top:3,left:voiceOnGlobal?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                          </button>
                        </div>
                        {/* Haptics toggle */}
                        <div style={{background:T.surfH,border:"1px solid "+T.bor,borderRadius:12,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,color:T.txt}}>📳 Haptic Feedback</div>
                            <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:2}}>Android only — iOS does not support web vibration</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <button onClick={()=>{
                              haptic("success");
                              toast("Haptic test! If you felt a buzz, it works. ✅");
                            }} style={{background:T.surfH,border:"1px solid "+T.bor,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:T.sub,cursor:"pointer",fontFamily:"inherit"}}>Test</button>
                            <button onClick={()=>{
                              const next=!window._hapticsOff;
                              window._hapticsOff=next;
                              LS.set("nl3-haptics-off",next);
                              if(!next) setTimeout(()=>haptic("success"),50);
                              setForm(p=>({...p,_h:Date.now()}));
                            }} style={{width:50,height:27,borderRadius:14,background:!window._hapticsOff?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                              <div style={{width:21,height:21,borderRadius:"50%",background:T.minimal?(!window._hapticsOff?"#fff":(T.dark?"#e0e0e0":"#202124")):"#fff",position:"absolute",top:3,left:!window._hapticsOff?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
                            </button>
                          </div>
                        </div>
                        <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:12,padding:16,display:"grid",gap:12}}>
                          <div style={{fontWeight:700,color:T.txt,marginBottom:2}}>🔊 Sound & Audio</div>
                          {/* On/Off */}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:T.fs.md,color:T.txt}}>Sound Effects</div>
                              <div style={{fontSize:T.fs.sm,color:T.sub,marginTop:1}}>Click sounds, notifications, and feedback tones</div>
                            </div>
                            <button onClick={()=>{const next=!soundOn;applySoundSettings(next,soundVol);if(next)setTimeout(()=>playSound("click"),50);}} style={{width:50,height:27,borderRadius:14,background:soundOn?(T.minimal?T.accent:T.scarlet):(T.minimal?(T.dark?"#505050":"#909090"):(T.dark?"#555":"#bbb")),border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                              <div style={{width:21,height:21,borderRadius:"50%",background:T.minimal?(soundOn?"#fff":(T.dark?"#e0e0e0":"#202124")):"#fff",position:"absolute",top:3,left:soundOn?26:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
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
                                  <button key={opt.label} onClick={()=>{applySoundSettings(true,opt.vol);setTimeout(()=>playSound("click"),50);}} style={{background:Math.abs(soundVol-opt.vol)<0.03?T.accent+"18":"none",border:`1px solid ${Math.abs(soundVol-opt.vol)<0.03?T.scarlet:T.bor}`,borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700,color:Math.abs(soundVol-opt.vol)<0.03?T.scarlet:T.sub,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{opt.label}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{fontSize:11,color:T.faint,textAlign:"center"}}>Some settings take effect immediately. Others apply on your next login.</div>
                      </div>
                    )}

                    {setTab2==="boss_dms"&&can(user,"boss")&&(
                      <div style={{display:"grid",gap:14}}>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:T.fs.xl,fontWeight:800,color:T.txt}}>All Messages</div>
                        <div style={{fontSize:12,color:T.warn,fontWeight:600,background:`${T.warn}12`,border:`1px solid ${T.warn}33`,borderRadius:8,padding:"8px 12px"}}>⚠️ Viewing as supervisor — staff are notified messages may be reviewed.</div>
                        <div style={{display:"grid",gap:6,maxHeight:400,overflowY:"auto"}}>
                          {[...dms].filter(d=>!d.feedback&&!d.system).sort((a,b)=>b.at-a.at).map(msg=>{
                            const sender=emps.find(e=>e.id===msg.from);
                            const recipient=emps.find(e=>e.id===msg.to);
                            return (
                              <div key={msg.id} style={{background:T.surfH,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start",border:`1px solid ${T.bor}`}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:12,fontWeight:700,color:T.txt,display:"flex",gap:6,flexWrap:"wrap"}}>
                                    <span>{sender?.name||"Unknown"}</span>
                                    <span style={{color:T.mut}}>→</span>
                                    <span>{msg.to==="__group__"?"Team Chat":recipient?.name||"Unknown"}</span>
                                  </div>
                                  <div style={{fontSize:13,color:T.sub,marginTop:3,lineHeight:1.5}}>{msg.text}</div>
                                  <div style={{fontSize:10,color:T.faint,marginTop:3}}>{fmtDT(msg.at)}</div>
                                </div>
                              </div>
                            );
                          })}
                          {dms.filter(d=>!d.feedback&&!d.system).length===0&&<div style={{color:T.sub,fontSize:13,textAlign:"center",padding:"20px 0"}}>No messages yet.</div>}
                        </div>
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
                          {notice&&<div style={{fontSize:12,color:T.warn}}>Active: &quot;{notice}&quot;</div>}
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
                <div style={{position:"relative"}}>
                  <Inp T={T} label="TASK TITLE *" placeholder="e.g. Restock drinks" value={form.tTitle||""} onChange={e=>setForm(p=>({...p,tTitle:e.target.value}))}/>
                  {/* Auto-priority hint */}
                  {(()=>{
                    const tl=(form.tTitle||"").toLowerCase();
                    const isUrgent=["urgent","asap","immediately","emergency","critical","now","important","priority","must","deadline","today","broken","fix"].some(w=>tl.includes(w));
                    const isLow=["whenever","eventually","someday","optional"].some(w=>tl.includes(w));
                    const finnBadge=<span style={{display:"inline-flex",alignItems:"center",gap:3,background:"linear-gradient(135deg,#0f274488,#1e7fa822)",border:"1px solid #1e7fa866",borderRadius:20,padding:"2px 7px 2px 3px",verticalAlign:"middle",flexShrink:0}}>
  <svg width="12" height="12" viewBox="0 0 22 22" style={{flexShrink:0}}>
    <rect width="22" height="22" rx="6" fill="#0f2744"/>
    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.2"/>
    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.7" opacity="0.6"/>
    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
    <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
    <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
    <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
    <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
    <circle cx="11" cy="11" r="1" fill="#fff"/>
  </svg>
  <span style={{fontSize:9,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",lineHeight:1}}>FINN</span>
</span>;
                    return tl&&isUrgent?<div style={{fontSize:11,color:"#C8102E",fontWeight:600,marginTop:3,display:"flex",alignItems:"center"}}>{"💡 Auto-setting to High priority"}{finnBadge}</div>
                      :tl&&isLow?<div style={{fontSize:11,color:T.sub,fontWeight:600,marginTop:3,display:"flex",alignItems:"center"}}>{"💡 Auto-setting to Low priority"}{finnBadge}</div>
                      :null;
                  })()}
                </div>
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
                <div style={{background:T.surfH,border:`1px solid ${T.bor}`,borderRadius:10,padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:form.tRepeat||form.tRepeatDays?.length>0?10:0}}>
                    <input type="checkbox" id="repeat-chk" checked={form.tRepeat||false} onChange={e=>setForm(p=>({...p,tRepeat:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
                    <label htmlFor="repeat-chk" style={{fontSize:T.fs.md,color:T.txt,fontWeight:600,cursor:"pointer"}}>🔁 Repeat after completion</label>
                  </div>
                  {/* Repeat on specific days */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>{
                      const active=(form.tRepeatDays||[]).includes(day);
                      return (
                        <button key={day} type="button" onClick={()=>{
                          const curr=form.tRepeatDays||[];
                          setForm(p=>({...p,tRepeatDays:active?curr.filter(d=>d!==day):[...curr,day],tRepeat:false}));
                        }} style={{background:active?(T.minimal?T.accent:T.scarlet):T.bg,color:active?"#fff":T.sub,border:`1px solid ${active?T.accent:T.bor}`,borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                          {day}
                        </button>
                      );
                    })}
                    {(form.tRepeatDays?.length>0)&&<span style={{fontSize:11,color:T.sub,alignSelf:"center"}}>Repeats every {form.tRepeatDays.join(", ")}</span>}
                  </div>
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

          {/* Finn button — bottom right above ideas */}
          <button onClick={()=>{playSound("finn");openFinn();}} title="Ask Finn" data-tour="finn-button"
            className="float-action-btn" style={{position:"fixed",bottom:page==="dms"?222:148,right:14,zIndex:9998,background:finnSkinGold?"linear-gradient(135deg,#b45309,#eab308,#fef3c7,#eab308,#b45309)":"#0f2744",border:finnSkinGold?"2px solid #eab308aa":"2px solid #1e7fa8aa",borderRadius:"50%",width:40,height:40,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:finnSkinGold?"0 4px 14px rgba(234,179,8,.5),0 0 20px rgba(234,179,8,.3)":"0 4px 14px rgba(0,0,0,.28)",transition:"transform .15s,box-shadow .15s,bottom .25s",touchAction:"manipulation",padding:0}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.14)";e.currentTarget.style.boxShadow="0 5px 18px rgba(0,0,0,.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.28)";}}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2"/>
              <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.5"/>
              <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
              <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
              <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
              <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
              <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
              <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
              <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
              <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.85"/>
              <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
              <circle cx="11" cy="11" r="1" fill="#fff"/>
            </svg>
          </button>

          {/* Offline banner */}
          {isOffline&&(
            <div style={{position:"fixed",bottom:44,left:"50%",transform:"translateX(-50%)",zIndex:9996,background:"#92400e",borderRadius:20,padding:"8px 20px",display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,color:"#fff",animation:"fadeUp .2s ease",boxShadow:"0 4px 16px rgba(0,0,0,.3)",whiteSpace:"nowrap"}}>
              <span>📡</span>
              <span>You&apos;re offline — syncing when reconnected</span>
            </div>
          )}

          {/* Global search modal */}
          {showGlobalSearch&&(
            <GlobalSearch T={T} tasks={tasks} inv={inv} emps={emps} anns={anns} user={user}
              setPage={p=>{setPrevPage(page);setPage(p);setSearch("");}}
              onClose={()=>setShowGlobalSearch(false)}/>
          )}

          {/* Notification center */}
          {showNotifCenter&&<NotifCenter T={T} anns={anns} dms={dms} tasks={tasks} user={user} emps={emps} onClose={()=>setShowNotifCenter(false)} setPage={p=>{setPrevPage(page);setPage(p);}} onDismiss={dismissAnn}/>}

          {/* First-time welcome portal */}
          {showWelcomePortal&&<WelcomePortal T={T} onDone={()=>setShowWelcomePortal(false)}/>}

          {/* First-time welcome portal */}
          {showWelcomePortal&&<WelcomePortal T={T} onDone={()=>setShowWelcomePortal(false)}/>}

          {/* Finn intro animation */}
          {finnAnim&&(
            <div style={{position:"fixed",inset:0,zIndex:9998,pointerEvents:"none",overflow:"hidden"}}
              onAnimationEnd={()=>setFinnAnim(false)}>
              {/* Dark overlay flash */}
              <div style={{position:"absolute",inset:0,background:"#0f2744",animation:"swipeFade .42s ease both"}}/>
              {/* Ripple rings from bottom-right */}
              {[0,1,2].map(i=>(
                <div key={i} style={{position:"absolute",bottom:148,right:34,width:40,height:40,borderRadius:"50%",border:`2px solid ${i===0?"#C8102E":"#1e7fa8"}`,animation:`finnRipple .6s ${i*120}ms ease-out both`,pointerEvents:"none"}}/>
              ))}
              {/* Big hex compass burst center screen */}
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:"finnHexSpin .42s cubic-bezier(.34,1.56,.64,1) both",pointerEvents:"none"}}>
                <svg width="90" height="90" viewBox="0 0 22 22">
                  <rect width="22" height="22" rx="6" fill="#0f2744"/>
                  <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.3"/>
                  <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.6"/>
                  <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
                  <polygon points="11,21 9.8,15 11,16.5 12.2,15" fill="#fff" opacity="0.45"/>
                  <polygon points="1,11 7,9.8 5.5,11 7,12.2" fill="#fff" opacity="0.45"/>
                  <polygon points="21,11 15,9.8 16.5,11 15,12.2" fill="#fff" opacity="0.45"/>
                  <line x1="4" y1="4" x2="6" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                  <line x1="18" y1="4" x2="16" y2="6" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                  <line x1="4" y1="18" x2="6" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                  <line x1="18" y1="18" x2="16" y2="16" stroke="#C8102E" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                  <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
                  <circle cx="11" cy="11" r="1" fill="#fff"/>
                </svg>
              </div>
              {/* "Finn" text fades in below hex */}
              <div style={{position:"absolute",top:"calc(50% + 58px)",left:"50%",transform:"translateX(-50%)",fontFamily:"'Clash Display',sans-serif",fontWeight:800,fontSize:22,color:"#fff",letterSpacing:"-0.3px",animation:"finnStagger .35s .18s ease both",pointerEvents:"none",whiteSpace:"nowrap"}}>
                Hey, I'm <span style={{color:"#1e7fa8"}}>Finn</span>
              </div>
            </div>
          )}

          {/* Finn chat panel */}
          {showFinn&&<FinnChat T={T} user={user} tasks={tasks} inv={inv} anns={anns} dms={dms} emps={emps} progress={progress} act={act} onClose={()=>setShowFinn(false)} setPage={p=>{setPrevPage(page);setPage(p);}} toast={toast} saveTask={(t)=>{setTasks(prev=>{const exists=prev.find(x=>x.id===t.id);return exists?prev.map(x=>x.id===t.id?t:x):[t,...prev];});upsertTask(t);}} saveInv={saveInv} saveAnns={saveAnns} saveDms={saveDms} addAct={addAct} grantXP={grantXP} saveStatus={saveStatus} applyTheme={applyTheme} dark={dark} compact={compact} upsertTask={upsertTask} dismissAnn={dismissAnn} voiceOnGlobal={voiceOnGlobal} setVoiceOnGlobal={setVoiceOnGlobal}/>}

          <HelpModal T={T} bottom={page==="dms"?120:52}/>
            {showRating&&<RatingModal T={T} user={user} open={showRating} onClose={()=>setShowRating(false)}/>}
            {viewingProfile&&<StaffProfileModal T={T} emp={viewingProfile} progress={progress} onClose={()=>setViewingProfile(null)}/>}
            {showPfpUpload&&<PfpUploadModal T={T} user={user} emps={emps} setEmps={setEmps} open={showPfpUpload} onClose={()=>setShowPfpUpload(false)} toast={toast}/>}
            {showShop&&<XPShopModal T={T} user={user} progress={progress} open={showShop} onClose={()=>setShowShop(false)} onSpendXP={(uid,pg)=>setProgress(prev=>({...prev,[uid]:pg}))} onPurchase={(item)=>{
              if(item.type==="color"||item.type==="rainbow"){
                // Apply the color immediately
                applyTheme(dark,compact,item.color==="linear-gradient(90deg,#ef4444,#f59e0b,#10b981,#3b82f6,#a855f7)"?"#C8102E":item.color);
                // Save unlocked colors to localStorage so settings shows them
                const saved=JSON.parse(localStorage.getItem("nl3-unlocked-colors")||"[]");
                if(!saved.includes(item.id)){saved.push(item.id);localStorage.setItem("nl3-unlocked-colors",JSON.stringify(saved));}
                toast(`${item.name} color applied! Find it in Settings → Display.`);
              }
              else if(item.type==="pfp"){setShowPfpUpload(true);}
              else if(item.type==="streak_save"){
                const pg=progress[user.id]||{};
                const restoredStreak=Math.max((pg.streak||0)+1,1);
                SB.upsert("user_progress",{user_id:user.id,xp:pg.xp||0,level:pg.level||1,title:pg.title||"Pioneer",streak:restoredStreak,last_login:new Date().toISOString().slice(0,10)}).then(()=>{
                  setProgress(prev=>({...prev,[user.id]:{...pg,streak:restoredStreak,last_login:new Date().toISOString().slice(0,10)}}));
                });
                toast("Streak restored to "+restoredStreak+"! 🔥");
              }
              else if(item.type==="xp_gift"){
                const pg=progress[user.id]||{xp:0,level:1,title:"Pioneer",streak:0};
                const newXP=(pg.xp||0)+(item.amount||100);
                const info=getLevelInfo(newXP);
                SB.upsert("user_progress",{user_id:user.id,xp:newXP,level:info.level,title:info.title,streak:pg.streak||0,last_login:pg.last_login||""});
                setProgress(prev=>({...prev,[user.id]:{...pg,xp:newXP,level:info.level,title:info.title}}));
                toast(`+${item.amount} XP added! 🎁`);
              }
              else if(item.type==="badge"){
                // Save to unlocked badges list
                const unlocked=JSON.parse(localStorage.getItem("nl3-unlocked-badges")||"[]");
                if(!unlocked.includes(item.id)){unlocked.push(item.id);localStorage.setItem("nl3-unlocked-badges",JSON.stringify(unlocked));}
                // Auto-equip if slot available (max 3)
                const current=JSON.parse(localStorage.getItem("nl3-badges")||"[]");
                if(!current.includes(item.id)&&current.length<5){
                  const next=[...current,item.id];
                  saveEquippedBadges(next);
                  toast(`${item.name} badge equipped! See it next to your name. ✅`);
                } else {
                  toast(`${item.name} badge unlocked! Equip it in Settings → Profile.`);
                }
              }
              else if(item.type==="name_color"){
                // Save to unlocked colors list too
                const uc=JSON.parse(localStorage.getItem("nl3-unlocked-colors")||"[]");
                if(!uc.includes("name_color")){uc.push("name_color");localStorage.setItem("nl3-unlocked-colors",JSON.stringify(uc));}
                saveNameColor("name_color");
                toast("Custom name color unlocked! Toggle it in Settings → Profile.");
              }
              else if(item.type==="frame"){
                // Save unlocked frame + auto-equip
                const uf=JSON.parse(localStorage.getItem("nl3-unlocked-frames")||"[]");
                if(!uf.includes(item.id)){uf.push(item.id);localStorage.setItem("nl3-unlocked-frames",JSON.stringify(uf));}
                localStorage.setItem("nl3-equipped-frame",item.id);
                setEquippedFrame(item.id);
                if(user?.id) SB.patch("employees",user.id,{equipped_frame:item.id});
                toast(`${item.name} equipped! Nice border. ✨`);
              }
              else if(item.type==="finn_skin"){
                localStorage.setItem("nl3-finn-skin-gold","1");
                setFinnSkinGold(true);
                toast("Finn Gold Skin activated! 🤖✨");
              }
              else if(item.type==="confetti"){
                localStorage.setItem("nl3-confetti","1");
                toast("Task Confetti activated! Complete a task to see it 🎊");
              }
              else if(item.type==="aura"){
                localStorage.setItem("nl3-dark-aura","1");
                toast("Dark Aura activated! Check dark mode 🌑");
              }
              else if(item.type==="sounds"){
                localStorage.setItem("nl3-premium-sounds","1");
                toast("Premium Sounds activated! 🔊");
              }
              else if(item.type==="custom_title"){
                const t=prompt("Enter your custom rank title (max 20 chars):");
                if(t){const safe=t.slice(0,20);localStorage.setItem("nl3-custom-title",safe);toast(`Rank title set to "${safe}"! Check your leaderboard row.`);}
              }
              else if(item.type==="fireworks"){
                localStorage.setItem("nl3-fireworks","1");
                toast("Level-Up Fireworks activated! 🎆");
              }
              else if(item.type==="task_hint"){
                toast("Finn will now give you a priority suggestion! Ask Finn: 'What should I work on?' 💡");
              }
              else toast(`${item.name} unlocked! Check Settings → Profile.`);
            }}/>}
            {showOnboarding&&<OnboardingTour T={T} user={user} open={showOnboarding} onClose={()=>setShowOnboarding(false)} setPage={p=>{setPrevPage(page);setPage(p);}} setShowFinn={setShowFinn} setShowFeedback={setShowFeedback}/>}

          {/* Feedback / Ideas button — higher in DMs to clear send bar */}
          <button onClick={()=>{playSound("open");setShowFeedback(true);}} title="Send an idea or report a bug" data-tour="feedback-button"
            className="float-action-btn" style={{position:"fixed",bottom:page==="dms"?170:100,right:14,zIndex:9998,background:T.dark?"#1a1020":"#fffbeb",color:"#b45309",border:`2px solid #f59e0baa`,borderRadius:"50%",width:40,height:40,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(0,0,0,.18)",transition:"transform .15s,box-shadow .15s,bottom .25s",touchAction:"manipulation"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.14)";e.currentTarget.style.boxShadow="0 5px 18px rgba(0,0,0,.2)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 3px 12px rgba(0,0,0,.15)";}}
          >💡</button>

          {/* Feedback modal */}
          {showFeedback&&(
            <Modal T={T} title={`${E("💡","i")} Send Feedback`} onClose={()=>{setShowFeedback(false);setFeedbackForm({type:"feature",msg:""});}}>
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
          <ClaudeTag T={T}/><VersionBadge T={T} hide={showFinn}/>
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
              <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:13,fontWeight:800,color:T.txt,flex:1}}>Technical Administrator Dashboard</div>
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
              <Btn T={T} variant="danger" onClick={async()=>{
                if(!window.confirm("Reset ALL staff XP to zero? This cannot be undone.")) return;
                await fetch(`${SUPABASE_URL}/rest/v1/user_progress?user_id=neq.none`,{method:"DELETE",headers:SB.headers});
                setProgress({});
                setTechAction("✅ All XP reset to zero for the month.");
                setTimeout(()=>setTechAction(""),4000);
                playSound("delete");
                toast("All XP reset","warn");
              }}>🔄 Reset All XP</Btn>
            </div>

            {/* ── XP GRANT PANEL ─────────────────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>⭐</span> Grant XP to Staff
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}} className="two-col">
                {/* Target selector */}
                <div>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>SELECT RECIPIENT</div>
                  <select value={form.xpGrantTarget||"all"} onChange={e=>setForm(p=>({...p,xpGrantTarget:e.target.value}))}
                    style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}>
                    <option value="all">Everyone (all eligible staff)</option>
                    {emps.filter(e=>["boss","manager","assistant","employee"].includes(e.role)).map(e=>(
                      <option key={e.id} value={e.id}>{e.name} — {ROLES[e.role]?.label}</option>
                    ))}
                  </select>
                </div>
                {/* Amount input */}
                <div>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>XP AMOUNT</div>
                  <input type="number" min={1} max={10000} placeholder="e.g. 100"
                    value={form.xpGrantAmount||""} onChange={e=>setForm(p=>({...p,xpGrantAmount:e.target.value}))}
                    style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}
                  />
                </div>
              </div>
              {/* Quick amount buttons */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                {[10,25,50,100,250,500,1000].map(amt=>(
                  <button key={amt} onClick={()=>setForm(p=>({...p,xpGrantAmount:String(amt)}))}
                    style={{background:form.xpGrantAmount===String(amt)?T.accent:T.surfH,color:form.xpGrantAmount===String(amt)?"#fff":T.sub,border:`1px solid ${form.xpGrantAmount===String(amt)?T.accent:T.bor}`,borderRadius:9999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                    +{amt}
                  </button>
                ))}
              </div>
              {/* Optional note */}
              <input placeholder="Reason / note (optional)" value={form.xpGrantNote||""}
                onChange={e=>setForm(p=>({...p,xpGrantNote:e.target.value}))}
                style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12}}
              />
              <Btn T={T} full onClick={async()=>{
                const amount=parseInt(form.xpGrantAmount||"0");
                if(!amount||amount<1){toast("Enter an XP amount","err");return;}
                const targets=form.xpGrantTarget==="all"
                  ? emps.filter(e=>["boss","manager","assistant","employee"].includes(e.role))
                  : emps.filter(e=>e.id===form.xpGrantTarget);
                if(!targets.length){toast("No eligible recipients","err");return;}
                let updated=0;
                for(const emp of targets){
                  const pg=progress[emp.id]||{xp:0,level:1,title:"Pioneer",streak:0};
                  const newXP=(pg.xp||0)+amount;
                  const info=getLevelInfo(newXP);
                  const newPg={...pg,xp:newXP,level:info.level,title:info.title};
                  const newMaxXP=Math.max(newXP,pg.max_xp||pg.xp||0);
                  const grantInfo=getLevelInfo(newMaxXP);
                  await SB.upsert("user_progress",{user_id:emp.id,xp:newXP,max_xp:newMaxXP,level:grantInfo.level,title:grantInfo.title,streak:pg.streak||0,last_login:pg.last_login||""});
                  setProgress(prev=>({...prev,[emp.id]:{...newPg,max_xp:newMaxXP,level:grantInfo.level,title:grantInfo.title}}));
                  updated++;
                }
                const note=form.xpGrantNote?` — "${form.xpGrantNote}"`:"";
                addAct("xp_grant",`Tech Admin granted ${amount} XP to ${form.xpGrantTarget==="all"?"all staff":targets[0]?.name}${note}`,"system");
                playSound("success");haptic&&haptic("heavy");
                const who=form.xpGrantTarget==="all"?`all ${updated} staff members`:targets[0]?.name;
                toast(`✅ Granted ${amount} XP to ${who}!`);
                setTechAction(`✅ Granted ${amount} XP to ${who}${note}`);
                setTimeout(()=>setTechAction(""),5000);
                setForm(p=>({...p,xpGrantAmount:"",xpGrantNote:"",xpGrantTarget:"all"}));
              }}>⭐ Grant XP</Btn>
            </div>

            {/* ── BADGE GRANT PANEL ─────────────────────────────────────── */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>🏅</span> Grant Special Badge
              </div>
              <div style={{fontSize:12,color:T.sub,marginBottom:10,lineHeight:1.6,background:T.bg,borderRadius:8,padding:"8px 12px"}}>
                Grant Employee of the Month or other exclusive badges. EOTM badges are permanent and show the month + year they were earned.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}} className="two-col">
                <div>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>RECIPIENT</div>
                  <select value={form.badgeGrantTarget||""} onChange={e=>setForm(p=>({...p,badgeGrantTarget:e.target.value}))}
                    style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}>
                    <option value="">Select staff member…</option>
                    {emps.filter(e=>e.role!=="superadmin").map(e=>(
                      <option key={e.id} value={e.id}>{e.name} — {ROLES[e.role]?.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>BADGE TYPE</div>
                  <select value={form.badgeGrantType||"eotm"} onChange={e=>setForm(p=>({...p,badgeGrantType:e.target.value}))}
                    style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}>
                    <option value="eotm">⭐ Employee of the Month</option>
                    <optgroup label="── Special ──">
                      {Object.values(BADGE_CATALOG).filter(b=>b.adminOnly&&b.id!=="creator").map(b=>(
                        <option key={b.id} value={b.id}>{b.icon} {b.name} (Admin Only)</option>
                      ))}
                    </optgroup>
                    <optgroup label="── All Badges ──">
                      {Object.values(BADGE_CATALOG).filter(b=>!b.adminOnly).map(b=>(
                        <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              {/* EOTM month/year picker */}
              {(form.badgeGrantType==="eotm"||!form.badgeGrantType)&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}} className="two-col">
                  <div>
                    <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>MONTH</div>
                    <select value={form.badgeGrantMonth||String(new Date().getMonth()+1).padStart(2,"0")} onChange={e=>setForm(p=>({...p,badgeGrantMonth:e.target.value}))}
                      style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}>
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m,i)=>(
                        <option key={m} value={m}>{["January","February","March","April","May","June","July","August","September","October","November","December"][i]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:T.sub,fontWeight:700,letterSpacing:"0.05em",marginBottom:6}}>YEAR</div>
                    <select value={form.badgeGrantYear||String(new Date().getFullYear())} onChange={e=>setForm(p=>({...p,badgeGrantYear:e.target.value}))}
                      style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}>
                      {[2025,2026,2027,2028].map(y=><option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <Btn T={T} full onClick={async()=>{
                if(!form.badgeGrantTarget){toast("Select a staff member","err");return;}
                const emp=emps.find(e=>e.id===form.badgeGrantTarget);
                if(!emp){toast("Staff member not found","err");return;}
                const isEotm=!form.badgeGrantType||form.badgeGrantType==="eotm";
                const mo=(form.badgeGrantMonth||String(new Date().getMonth()+1).padStart(2,"0"));
                const yr=(form.badgeGrantYear||String(new Date().getFullYear()));
                const badgeId=isEotm?`eotm_${yr}_${mo}`:(form.badgeGrantType||"eotm");
                const catalogBadge=BADGE_CATALOG[badgeId];
                const badgeName=isEotm
                  ?`Employee of the Month — ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(mo)-1]} ${yr}`
                  :(catalogBadge?.name||badgeId);
                // Save badge grant to Supabase (in employees table as a JSON array in badge_grants column)
                const existing=JSON.parse(emp.badge_grants||"[]");
                if(!existing.includes(badgeId)){
                  existing.push(badgeId);
                  await SB.patch("employees",emp.id,{badge_grants:JSON.stringify(existing)});
                  const next=emps.map(e=>e.id===emp.id?{...e,badge_grants:JSON.stringify(existing)}:e);
                  setEmps(next);
                  // Send announcement to staff
                  const ann={id:uid(),msg:`🏅 ${emp.name} has been awarded: ${badgeName}! Congratulations!`,level:"info",by:"Tech Admin",at:Date.now(),dismissed:[]};
                  await SB.upsert("announcements",{id:ann.id,msg:ann.msg,level:ann.level,by_name:ann.by,at:ann.at,dismissed:[]});
                  setAnns(prev=>[ann,...prev]);
                  addAct("badge_grant",`Tech Admin granted "${badgeName}" badge to ${emp.name}`,"system");
                  playSound("success");haptic&&haptic("heavy");
                  toast(`✅ ${badgeName} granted to ${emp.name}!`);
                  setTechAction(`✅ ${badgeName} granted to ${emp.name} — announcement sent!`);
                  setTimeout(()=>setTechAction(""),5000);
                  setForm(p=>({...p,badgeGrantTarget:"",badgeGrantType:"eotm"}));
                } else {
                  toast(`${emp.name} already has this badge!`,"warn");
                }
              }}>🏅 Grant Badge</Btn>
            </div>
            {techAction&&(
              <div style={{display:"flex",alignItems:"center",gap:8,background:"#dcfce7",border:"1px solid #86efac",borderRadius:10,padding:"9px 14px",marginBottom:14,animation:"fadeUp .2s ease",fontSize:13,fontWeight:700,color:"#15803d"}}>
                {techAction}
              </div>
            )}

            {/* Schedule URL */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:4}}>📅 Staff Schedule Link</div>
              <div style={{fontSize:12,color:T.sub,marginBottom:10,lineHeight:1.6}}>
                Paste any schedule URL here — Google Sheets, OneDrive, SharePoint, or any link. All staff will see it instantly in the Schedule tab.
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
                <input
                  placeholder="https://docs.google.com/spreadsheets/... or any schedule URL"
                  value={form.schedUrl??scheduleUrl}
                  onChange={e=>setForm(p=>({...p,schedUrl:e.target.value}))}
                  style={{flex:1,minWidth:200,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}
                />
                <Btn T={T} sm onClick={async()=>{
                  const url=String(form.schedUrl||"").trim();
                  if(!url){toast("Paste a URL first","err");return;}
                  await DB.set("nl3-schedule-url",url);
                  setScheduleUrl(url);
                  setForm(p=>({...p,schedUrl:""}));
                  toast("Schedule link saved! Staff can now see it in the Schedule tab ✅");
                  playSound("success");
                }}>Save Link</Btn>
                {scheduleUrl&&<Btn T={T} sm variant="danger" onClick={async()=>{
                  await DB.set("nl3-schedule-url","");
                  setScheduleUrl("");
                  toast("Schedule link cleared","warn");
                }}>Clear</Btn>}
              </div>
              {scheduleUrl&&(
                <div style={{fontSize:12,color:T.ok,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  <span>✓ Active:</span>
                  <a href={scheduleUrl} target="_blank" rel="noopener" style={{color:T.blue,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:300}}>{scheduleUrl}</a>
                </div>
              )}
            </div>

            {/* Site notice */}
            <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:T.txt,marginBottom:8}}>📢 Site Notice / Maintenance Alert</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <input placeholder="e.g. Site down for maintenance until 3pm…" value={form.nMsg||""} onChange={e=>setForm(p=>({...p,nMsg:e.target.value}))}
                  style={{flex:1,minWidth:200,background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,color:T.txt,padding:"9px 14px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
                <Btn T={T} sm onClick={sendNotice}>Send</Btn>
                {notice&&<Btn T={T} sm variant="ghost" onClick={clearNotice}>Clear Active</Btn>}
              </div>
              {notice&&<div style={{marginTop:8,fontSize:12,color:T.warn,fontWeight:600}}>🟡 Active: &quot;{notice}&quot;</div>}
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
                        <span style={{fontSize:12}}>{({"info":"ℹ️","warn":"⚠️","error":"🔴"})[e.level]||"📋"}</span>
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
                    <span style={{fontSize:13}}>{({"login":"🟢","logout":"🔴","task_done":"✅","task_created":"📝","employee added":"👤","employee removed":"🗑️"})[entry.type]||"📋"}</span>
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
                            <span style={{color:T.mut,fontWeight:400}}>{"→"}</span>
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
                        style={{display:"flex",alignItems:"center",gap:10,background:checked?T.accent+"18":T.bg,border:`1px solid ${checked?T.accent+"66":T.bor}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${checked?T.scarlet:T.bor}`,background:checked?(T.minimal?T.accent:T.scarlet):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
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
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div style={{fontWeight:700,color:T.txt}}>📋 App Patch Notes — v{VERSION}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button onClick={()=>setSelPatchNotes(new Set((PATCH_NOTES[VERSION]||[]).map((_,i)=>i)))} style={{background:T.surfH,color:T.sub,border:`1px solid ${T.bor}`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>All</button>
                    <button onClick={()=>setSelPatchNotes(new Set())} style={{background:T.surfH,color:T.sub,border:`1px solid ${T.bor}`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>None</button>
                    <Btn T={T} sm onClick={()=>{
                      const allNotes=PATCH_NOTES[VERSION]||[];
                      const sel=allNotes.filter((_,i)=>selPatchNotes.has(i));
                      if(!sel.length){toast("Select at least one note","warn");return;}
                      const ann={id:uid(),msg:`📋 v${VERSION} ${BUILD_TAG} — MNU Neer Locker Update`,level:"info",by:"System",at:Date.now(),dismissed:[],patchNotes:sel,patchVersion:VERSION,patchBuild:BUILD_TAG};
                      saveAnns([ann,...anns]);
                      toast(`Announced ${sel.length} note${sel.length!==1?"s":""}! ✅`);
                    }}>📢 Announce ({selPatchNotes.size})</Btn>
                  </div>
                </div>
                {/* Selectable notes list */}
                <div style={{background:T.bg,borderRadius:10,padding:"6px 4px",maxHeight:220,overflowY:"auto",marginBottom:12}}>
                  {(PATCH_NOTES[VERSION]||[]).map((note,i)=>(
                    <div key={i} onClick={()=>{setSelPatchNotes(prev=>{const n=new Set(prev);n.has(i)?n.delete(i):n.add(i);return n;});}}
                      style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 10px",cursor:"pointer",borderRadius:8,background:selPatchNotes.has(i)?T.accent+"14":"transparent",transition:"background .12s"}}>
                      <div style={{width:15,height:15,borderRadius:4,border:`2px solid ${selPatchNotes.has(i)?T.accent:T.bor}`,background:selPatchNotes.has(i)?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                        {selPatchNotes.has(i)&&<span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{fontSize:12,color:selPatchNotes.has(i)?T.txt:T.sub,lineHeight:1.5}}>{note}</span>
                    </div>
                  ))}
                </div>

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

            {/* Finn Patch Notes */}
            <div style={{background:T.card,border:`1px solid #1e7fa844`,borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <svg width="18" height="18" viewBox="0 0 22 22" style={{flexShrink:0}}>
                    <rect width="22" height="22" rx="6" fill="#0f2744"/>
                    <polygon points="11,1 19.5,6 19.5,16 11,21 2.5,16 2.5,6" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2"/>
                    <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="none" stroke="#C8102E" strokeWidth="0.6" opacity="0.5"/>
                    <polygon points="11,1 9.5,7 11,5.5 12.5,7" fill="#fff"/>
                    <circle cx="11" cy="11" r="2.5" fill="#0f2744" stroke="#fff" strokeWidth="0.8"/>
                    <circle cx="11" cy="11" r="1" fill="#fff"/>
                  </svg>
                  <div style={{fontWeight:700,color:T.txt}}>Finn Patch Notes — v{FINN_VERSION}</div>
                </div>
                <Btn T={T} sm onClick={async()=>{
                  const notes=FINN_PATCH_NOTES[FINN_VERSION]||[];
                  if(!notes.length){toast("No Finn patch notes for this version","warn");return;}
                  const ann={id:uid(),msg:`🤖 Finn v${FINN_VERSION} — AI Assistant Update`,level:"info",by:"System",at:Date.now(),dismissed:[],patchNotes:notes,patchVersion:"Finn v"+FINN_VERSION,patchBuild:"FR"};
                  await SB.upsert("announcements",{id:ann.id,msg:ann.msg,level:ann.level,by_name:ann.by,at:ann.at,dismissed:[],patch_notes:ann.patchNotes,patch_version:ann.patchVersion,patch_build:ann.patchBuild});
                  setAnns(prev=>[ann,...prev]);
                  toast("Finn update announced to all staff! ✅");
                }}>📢 Announce Finn Update</Btn>
              </div>
              {/* Compose new Finn update */}
              <div style={{background:T.bg,border:`1px solid ${T.bor}`,borderRadius:10,padding:14,marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:800,color:"#1e7fa8",letterSpacing:"0.06em",marginBottom:8}}>COMPOSE FINN UPDATE NOTE</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input
                    placeholder="New Finn update note… (e.g. Finn can now complete tasks)"
                    value={form.finnNote||""}
                    onChange={e=>setForm(p=>({...p,finnNote:e.target.value}))}
                    style={{flex:1,background:T.surf,border:`1px solid ${T.bor}`,borderRadius:8,color:T.txt,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}
                    onKeyDown={async e=>{
                      if(e.key==="Enter"&&(form.finnNote||"").trim()){
                        const note=(form.finnNote||"").trim();
                        // Add to current version's notes in local state — actual update happens in code
                        // but we announce it to staff right away
                        const ann={id:uid(),msg:`🤖 Finn Update: ${note}`,level:"info",by:"System",at:Date.now(),dismissed:[],patchNotes:[note],patchVersion:"Finn v"+FINN_VERSION,patchBuild:"FR"};
                        await SB.upsert("announcements",{id:ann.id,msg:ann.msg,level:ann.level,by_name:ann.by,at:ann.at,dismissed:[],patch_notes:ann.patchNotes,patch_version:ann.patchVersion,patch_build:ann.patchBuild});
                        setAnns(prev=>[ann,...prev]);
                        toast("Finn update note announced! ✅");
                        setForm(p=>({...p,finnNote:""}));
                      }
                    }}
                  />
                  <Btn T={T} sm onClick={async()=>{
                    const note=(form.finnNote||"").trim();
                    if(!note){toast("Enter a note first","err");return;}
                    const ann={id:uid(),msg:`🤖 Finn Update: ${note}`,level:"info",by:"System",at:Date.now(),dismissed:[],patchNotes:[note],patchVersion:"Finn v"+FINN_VERSION,patchBuild:"FR"};
                    await SB.upsert("announcements",{id:ann.id,msg:ann.msg,level:ann.level,by_name:ann.by,at:ann.at,dismissed:[],patch_notes:ann.patchNotes,patch_version:ann.patchVersion,patch_build:ann.patchBuild});
                    setAnns(prev=>[ann,...prev]);
                    toast("Finn update note announced! ✅");
                    setForm(p=>({...p,finnNote:""}));
                  }}>Send</Btn>
                </div>
                <div style={{fontSize:11,color:T.sub}}>Press Enter or Send to announce a Finn update note to all staff.</div>
              </div>
              {/* Existing Finn patch notes */}
              {Object.entries(FINN_PATCH_NOTES).map(([ver,notes])=>(
                <details key={ver} style={{background:T.bg,borderRadius:10,marginBottom:6,overflow:"hidden"}} open={ver===FINN_VERSION}>
                  <summary style={{padding:"10px 14px",cursor:"pointer",fontWeight:700,fontSize:13,color:ver===FINN_VERSION?"#1e7fa8":T.sub,display:"flex",alignItems:"center",gap:8,listStyle:"none",userSelect:"none"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.surfH}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <span style={{fontSize:16}}>{ver===FINN_VERSION?"🤖":"📦"}</span>
                    <span>Finn v{ver}</span>
                    {ver===FINN_VERSION&&<span style={{background:"#1e7fa8",color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:800}}>CURRENT</span>}
                  </summary>
                  <div style={{padding:"6px 14px 12px",borderTop:`1px solid ${T.bor}`}}>
                    {notes.map((note,i)=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<notes.length-1?`1px solid ${T.bor}33`:"none",alignItems:"flex-start"}}>
                        <span style={{color:"#1e7fa8",fontWeight:800,fontSize:12,flexShrink:0,marginTop:1}}>✓</span>
                        <span style={{fontSize:12,color:T.sub,lineHeight:1.5}}>{note}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            {/* Monthly ratings from staff */}
            <RatingsPanel T={T}/>

            {/* Feedback from staff */}
            <FeedbackPanel T={T} toast={toast}/>

            {/* Vigil Security Dashboard */}
            <div style={{background:T.card,border:"2px solid #16a34a44",borderRadius:14,padding:16,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{width:32,height:32,borderRadius:8,background:"#16a34a22",border:"1px solid #16a34a44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛡</div>
                <div>
                  <div style={{fontWeight:800,color:T.txt,fontSize:15}}>Vigil HyperCore</div>
                  <div style={{fontSize:10,color:"#16a34a",fontWeight:700,letterSpacing:"0.06em"}}>v{VIGIL_VERSION} · HYPERCORE · ACTIVE</div>
                </div>
                <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                  <Btn T={T} sm onClick={()=>{VIGIL.clearLog();toast("Vigil log cleared ✅");setForm(p=>({...p,_v:Date.now()}));}}>🗑 Clear Log</Btn>
                </div>
              </div>
              {/* Security stats */}
              {(()=>{
                // Try server dashboard data, fall back to local log
                const log=VIGIL.getLog();
                const failed=log.filter(e=>e.type==="failed_pin").length;
                const locked=log.filter(e=>e.type==="account_locked").length;
                const anomalies=log.filter(e=>e.type.includes("anomaly")).length;
                const injections=log.filter(e=>e.type==="prompt_injection"||e.type==="injection").length;
                const logins=log.filter(e=>e.type==="login_success").length;
                return (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                    {[
                      {label:"Logins",val:logins,icon:"✅",color:"#16a34a"},
                      {label:"Failed PINs",val:failed,icon:"🔐",color:failed>0?T.warn:"#16a34a"},
                      {label:"Lockouts",val:locked,icon:"🔒",color:locked>0?T.err:"#16a34a"},
                      {label:"Anomalies",val:anomalies,icon:"⚠️",color:anomalies>0?T.warn:"#16a34a"},
                      {label:"Injections",val:injections,icon:"🚨",color:injections>0?T.err:"#16a34a"},
                      {label:"Log entries",val:log.length,icon:"📋",color:T.sub},
                    ].map(s=>(
                      <div key={s.label} style={{background:T.bg,borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1px solid "+T.bor}}>
                        <div style={{fontSize:18}}>{s.icon}</div>
                        <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                        <div style={{fontSize:10,color:T.sub,fontWeight:600}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {/* Recent events */}
              <div style={{fontSize:11,fontWeight:800,color:T.sub,letterSpacing:"0.06em",marginBottom:8}}>RECENT EVENTS</div>
              <div style={{maxHeight:200,overflowY:"auto",display:"grid",gap:4}}>
                {VIGIL.getLog().slice(0,20).map((e,i)=>{
                  const colors={login_success:"#16a34a",failed_pin:T.warn,account_locked:T.err,anomaly:T.warn,prompt_injection:T.err,session_timeout:T.sub,lockout_blocked:T.err};
                  const icons={login_success:"✅",failed_pin:"🔐",account_locked:"🔒",anomaly:"⚠️",prompt_injection:"🚨",session_timeout:"⏱",lockout_blocked:"🚫"};
                  return (
                    <div key={i} style={{background:T.surfH,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8,border:"1px solid "+T.bor}}>
                      <span style={{fontSize:14,flexShrink:0}}>{icons[e.type]||"📋"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:colors[e.type]||T.txt}}>{e.type.replace(/_/g," ").toUpperCase()}</div>
                        <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.detail}</div>
                      </div>
                      <div style={{fontSize:10,color:T.faint,flexShrink:0}}>{fmtDT(e.at)}</div>
                    </div>
                  );
                })}
                {VIGIL.getLog().length===0&&<div style={{textAlign:"center",padding:"20px 0",color:T.sub,fontSize:12}}>No events logged yet.</div>}
              </div>
            </div>

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

// ─── DRAGGABLE MINIMIZED TOUR PILL ──────────────────────────────────────────
function DraggableMinimizedPill({T,s,step,total,onExpand,onClose}) {
  // Edge snap zones — pill can only rest on top/bottom (horizontal) or left/right (vertical)
  const [edge,setEdge]=useState("bottom");
  const [offset,setOffset]=useState(0.5); // 0..1 along the edge
  const [dragging,setDragging]=useState(false);
  const [dragPos,setDragPos]=useState({x:0,y:0});
  const [entering,setEntering]=useState(true);
  const dragOrigin=useRef({dx:0,dy:0});

  // Entry animation flag
  useEffect(()=>{
    const t=setTimeout(()=>setEntering(false),350);
    return()=>clearTimeout(t);
  },[]);

  const startDrag=(clientX,clientY)=>{
    const vw=window.innerWidth, vh=window.innerHeight;
    // Compute current pill position for accurate drag offset
    let cx, cy;
    if(edge==="top"){cx=vw*offset;cy=10+22;}
    else if(edge==="bottom"){cx=vw*offset;cy=vh-10-22;}
    else if(edge==="left"){cx=10+22;cy=vh*offset;}
    else {cx=vw-10-22;cy=vh*offset;}
    dragOrigin.current={dx:clientX-cx, dy:clientY-cy};
    setDragPos({x:cx,y:cy});
    setDragging(true);
  };
  const moveDrag=(clientX,clientY)=>{
    if(!dragging) return;
    // Free follow cursor — no snapping while dragging
    setDragPos({x:clientX-dragOrigin.current.dx, y:clientY-dragOrigin.current.dy});
  };
  const endDrag=(clientX,clientY)=>{
    if(!dragging) return;
    const vw=window.innerWidth, vh=window.innerHeight;
    const x=clientX-dragOrigin.current.dx;
    const y=clientY-dragOrigin.current.dy;
    const distTop=y;
    const distBottom=vh-y;
    const distLeft=x;
    const distRight=vw-x;
    const m=Math.min(distTop,distBottom,distLeft,distRight);
    let ne,no;
    if(m===distTop){ne="top";no=Math.max(0.08,Math.min(0.92,x/vw));}
    else if(m===distBottom){ne="bottom";no=Math.max(0.08,Math.min(0.92,x/vw));}
    else if(m===distLeft){ne="left";no=Math.max(0.1,Math.min(0.9,y/vh));}
    else {ne="right";no=Math.max(0.1,Math.min(0.9,y/vh));}
    setEdge(ne);
    setOffset(no);
    setDragging(false);
    playSound("click");
    haptic&&haptic("light");
  };

  // Mouse
  useEffect(()=>{
    if(!dragging) return;
    const onMove=e=>moveDrag(e.clientX,e.clientY);
    const onUp=e=>endDrag(e.clientX,e.clientY);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[dragging]);

  // Touch
  useEffect(()=>{
    if(!dragging) return;
    const onMove=e=>{if(e.touches[0])moveDrag(e.touches[0].clientX,e.touches[0].clientY);};
    const onEnd=e=>{const t=e.changedTouches[0];if(t)endDrag(t.clientX,t.clientY);};
    window.addEventListener("touchmove",onMove,{passive:false});
    window.addEventListener("touchend",onEnd);
    return()=>{window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onEnd);};
  },[dragging]);

  const horizontal = edge==="top"||edge==="bottom";

  // Compute layout based on state
  let style;
  if(dragging){
    style={position:"fixed",left:dragPos.x-60,top:dragPos.y-22,zIndex:9999,transform:"scale(1.05)",opacity:0.9};
  } else if(edge==="top"){
    style={position:"fixed",top:10,left:`${offset*100}%`,transform:"translateX(-50%)",zIndex:9999};
  } else if(edge==="bottom"){
    style={position:"fixed",bottom:10,left:`${offset*100}%`,transform:"translateX(-50%)",zIndex:9999};
  } else if(edge==="left"){
    style={position:"fixed",left:10,top:`${offset*100}%`,transform:"translateY(-50%)",zIndex:9999};
  } else {
    style={position:"fixed",right:10,top:`${offset*100}%`,transform:"translateY(-50%)",zIndex:9999};
  }

  // Title text — truncate for vertical mode
  const shortTitle = (s.title||"").length>14?(s.title.slice(0,13)+"…"):s.title;

  const pillStyle={
    ...style,
    background:T.surf,
    border:`1.5px solid ${T.accent}`,
    borderRadius:9999,
    padding:horizontal?"8px 14px 8px 10px":"10px 8px",
    display:"flex",
    flexDirection:horizontal?"row":"column",
    alignItems:"center",
    gap:horizontal?8:8,
    boxShadow:dragging?"0 20px 50px rgba(0,0,0,.45)":"0 6px 24px rgba(0,0,0,.22)",
    cursor:dragging?"grabbing":"grab",
    transition:dragging?"none":"top .4s cubic-bezier(.34,1.56,.64,1),bottom .4s cubic-bezier(.34,1.56,.64,1),left .4s cubic-bezier(.34,1.56,.64,1),right .4s cubic-bezier(.34,1.56,.64,1),padding .3s,flex-direction .3s,transform .25s,opacity .25s,box-shadow .25s",
    userSelect:"none",
    touchAction:"none",
    minWidth:horizontal?undefined:48,
    animation:entering?"tourPillIn .35s cubic-bezier(.34,1.56,.64,1)":undefined,
  };

  return (
    <>
      {/* Drop-zone indicators visible during drag */}
      {dragging&&<DropZoneHints T={T} dragPos={dragPos}/>}
      <div style={pillStyle}
        onMouseDown={e=>{if(e.target.tagName==="BUTTON")return;startDrag(e.clientX,e.clientY);e.preventDefault();}}
        onTouchStart={e=>{if(e.target.tagName==="BUTTON")return;if(e.touches[0])startDrag(e.touches[0].clientX,e.touches[0].clientY);}}
      >
        {/* Grip handle — orients with axis */}
        <div style={{display:"flex",flexDirection:horizontal?"column":"row",gap:2,padding:"0 1px",color:T.mut,flexShrink:0}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{display:"flex",flexDirection:horizontal?"row":"column",gap:2}}>
              <div style={{width:2,height:2,borderRadius:"50%",background:"currentColor"}}/>
              <div style={{width:2,height:2,borderRadius:"50%",background:"currentColor"}}/>
            </div>
          ))}
        </div>
        {/* Pulsing accent dot */}
        <div style={{width:horizontal?8:10,height:horizontal?8:10,borderRadius:"50%",background:T.accent,flexShrink:0,animation:"pulse 2s infinite",boxShadow:`0 0 0 0 ${T.accent}`}}/>
        {/* Content — horizontal shows title+counter, vertical shows just counter stacked */}
        {horizontal?(
          <div style={{fontSize:12,color:T.txt,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:160}}>{shortTitle} · {step+1}/{total}</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{fontSize:13,fontWeight:800,color:T.txt,letterSpacing:"-0.02em",lineHeight:1}}>{step+1}</div>
            <div style={{fontSize:8,color:T.sub,fontWeight:600,letterSpacing:"0.04em"}}>of {total}</div>
          </div>
        )}
        {/* Expand button — label when horizontal, icon when vertical */}
        <button onClick={onExpand} title="Expand tour"
          style={{background:T.accent,border:"none",color:"#fff",borderRadius:9999,padding:horizontal?"4px 10px":"5px 6px",fontSize:horizontal?11:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap",lineHeight:1,minWidth:horizontal?undefined:26,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {horizontal?"Expand":"⤢"}
        </button>
        {/* Close */}
        <button onClick={onClose} title="Close tour"
          style={{background:"none",border:"none",color:T.mut,fontSize:16,cursor:"pointer",fontFamily:"inherit",padding:"0 4px",flexShrink:0,lineHeight:1}}>×</button>
      </div>
    </>
  );
}

// Drop zone hints — shown while dragging to indicate snap areas
function DropZoneHints({T,dragPos}){
  const vw=window.innerWidth, vh=window.innerHeight;
  const distTop=dragPos.y;
  const distBottom=vh-dragPos.y;
  const distLeft=dragPos.x;
  const distRight=vw-dragPos.x;
  const m=Math.min(distTop,distBottom,distLeft,distRight);
  const activeEdge = m===distTop?"top":m===distBottom?"bottom":m===distLeft?"left":"right";
  const zones=[
    {key:"top",    s:{position:"fixed",top:0,   left:0,    width:"100%", height:40}},
    {key:"bottom", s:{position:"fixed",bottom:0,left:0,    width:"100%", height:40}},
    {key:"left",   s:{position:"fixed",left:0,  top:0,     width:40,     height:"100%"}},
    {key:"right",  s:{position:"fixed",right:0, top:0,     width:40,     height:"100%"}},
  ];
  return <>{zones.map(z=>(
    <div key={z.key} style={{...z.s,zIndex:9998,pointerEvents:"none",background:activeEdge===z.key?T.accent+"33":T.accent+"0c",border:`2px dashed ${activeEdge===z.key?T.accent:T.accent+"55"}`,transition:"background .15s,border-color .15s"}}/>
  ))}</>;
}




// ─── ONBOARDING TOUR — interactive spotlight walkthrough ────────────────────
function OnboardingTour({T,user,open,onClose,setPage,setShowFinn,setShowFeedback}) {
  const [step,setStep]=useState(0);
  const [minimized,setMinimized]=useState(false);
  const [exiting,setExiting]=useState(false);
  const [anchor,setAnchor]=useState(null); // {x,y,w,h} of highlighted element
  const [cardPos,setCardPos]=useState({left:null,top:null,bottom:20,center:true});

  // Each step tells the tour: where to navigate, what to highlight, what to say
  const steps=[
    {
      navigate: ()=>setPage("home"),
      target: null,
      icon: E("👋","●"),
      title: `Welcome, ${user?.name||"there"}`,
      subtitle: "I'll take you on a quick tour",
      body: "I'll highlight each part of the app with a red outline and an arrow. Tap Next when ready, or Skip anytime. You can also minimize me (−) to explore freely.",
      action: null,
    },
    {
      navigate: ()=>setPage("home"),
      target: '[data-tour="logo"]',
      icon: E("🎓","◈"),
      title: "The brand — your home button",
      subtitle: "Tap to go home from anywhere",
      body: "This is your logo. Tap it anytime to return to the Home dashboard — works from every page.",
      action: null,
    },
    {
      navigate: ()=>setPage("home"),
      target: '[data-tour="nav-button"]',
      icon: E("⊙","○"),
      title: "Navigation menu",
      subtitle: "Your gateway to every page",
      body: "This circle button is always fixed in the top-left. Tap it anytime to jump between Home, Tasks, Inventory, Messages, and everything else.",
      action: null,
    },
    {
      navigate: ()=>setPage("tasks"),
      target: '[data-tour="nav-button"]',
      icon: E("✅","✓"),
      title: "Tasks page",
      subtitle: "I took you here",
      body: "Here are all your assigned tasks. Tap a task to expand details, then check the box to complete it. You'll earn XP — high priority = 50, normal = 25. Completed tasks show who finished them.",
      action: null,
    },
    {
      navigate: ()=>setPage("inv"),
      target: '[data-tour="nav-button"]',
      icon: E("📦","□"),
      title: "Inventory",
      subtitle: "Real-time stock tracking",
      body: "Tap + or − to adjust stock instantly. Everyone on staff sees the change within seconds. No refresh needed.",
      action: null,
    },
    {
      navigate: ()=>setPage("anns"),
      target: '[data-tour="nav-button"]',
      icon: E("🔔","○"),
      title: "Announcements",
      subtitle: "Messages from management",
      body: "Important updates land here. Tap × to dismiss — dismissed ones go to a 'recently dismissed' list at the bottom so you can restore them.",
      action: null,
    },
    {
      navigate: ()=>setPage("dms"),
      target: '[data-tour="nav-button"]',
      icon: E("💬","≡"),
      title: "Messages",
      subtitle: "1-on-1 and team chat",
      body: "Pick a teammate to DM them, or use Team Chat for the whole group. Group messages show who sent each one with their role color.",
      action: null,
    },
    {
      navigate: ()=>setPage("leaderboard"),
      target: '[data-tour="nav-button"]',
      icon: E("🏆","◆"),
      title: "Leaderboard",
      subtitle: "Climb the ranks",
      body: "Every task earns XP. Top performers sit at the top. Keep completing tasks to unlock ranks and move up the board.",
      action: null,
    },
    {
      navigate: ()=>setPage("set"),
      target: '[data-tour="nav-button"]',
      icon: E("⚙️","◎"),
      title: "Settings",
      subtitle: "Make it yours",
      body: "Edit profile, change display mode (try Minimal Mode ✦), pick an accent color, adjust sounds, enable notifications. Everything lives here.",
      action: null,
    },
    {
      navigate: ()=>{setPage("home");setShowFinn&&setShowFinn(false);},
      target: '[data-tour="finn-button"]',
      icon: E("🤖","⬡"),
      title: "Ask Finn",
      subtitle: "Your AI assistant",
      body: "Tap Finn anytime to chat. Ask questions, create tasks by typing, or say 'take me to tasks' and Finn will navigate for you.",
      action: {label:"Open Finn", fn:()=>setShowFinn&&setShowFinn(true)},
    },
    {
      navigate: ()=>{setPage("home");setShowFinn&&setShowFinn(false);},
      target: '[data-tour="help-button"]',
      icon: E("❓","?"),
      title: "The help button",
      subtitle: "Always available",
      body: "Need a refresher? The ? button (bottom-right) opens the full help guide with every feature explained.",
      action: null,
    },
    {
      navigate: ()=>{setPage("home");setShowFinn&&setShowFinn(false);},
      target: '[data-tour="feedback-button"]',
      icon: E("💡","i"),
      title: "Send feedback",
      subtitle: "Shape the app",
      body: "Have an idea or found a bug? Tap the lightbulb to send feedback directly to the Tech Admin.",
      action: null,
    },
    {
      navigate: ()=>setPage("set"),
      target: null,
      icon: E("🔒","⊡"),
      title: "Set up your PIN",
      subtitle: "Secure your account",
      body: "You can set a 4-digit PIN in Settings → Profile → Change PIN. Your PIN lets you sign in quickly and protects your account. We took you to Settings — scroll to Profile to set one up.",
      action: null,
    },
    {
      navigate: ()=>setPage("set"),
      target: null,
      icon: E("👆","◉"),
      title: "Enable Biometric ID",
      subtitle: "Face ID or Touch ID",
      body: "On supported devices, enable Biometric ID in Settings → Security to sign in with just your face or fingerprint. Much faster than typing a PIN every time.",
      action: null,
    },
    {
      navigate: ()=>setPage("set"),
      target: null,
      icon: E("🔔","○"),
      title: "Enable notifications",
      subtitle: "Required to continue",
      body: "Before we finish, please enable notifications so you don't miss tasks, messages, or announcements. Tap the button below to turn them on.",
      action: {label:"Enable notifications now", fn:()=>{
        if("Notification" in window){
          Notification.requestPermission().then(p=>{
            if(p==="granted"){
              try{window._notifGranted=true;}catch(e){}
              playSound("success");
            }
          });
        }
      }},
      requireNotif: true,
    },
    {
      navigate: ()=>setPage("home"),
      target: null,
      icon: E("🎉","★"),
      title: "You're all set",
      subtitle: "Welcome to the team",
      body: "That's the full tour. Revisit anytime from Settings → Profile → Start tour. Now let's get to work.",
      action: null,
    },
  ];

  // Find target element and compute anchor position
  useEffect(()=>{
    if(!open||minimized) return;
    const s=steps[step];
    if(s?.navigate) s.navigate();
    if(!s?.target) { setAnchor(null); return; }
    // Wait a tick for navigation/render to settle
    const timer=setTimeout(()=>{
      const el=document.querySelector(s.target);
      if(el){
        const r=el.getBoundingClientRect();
        setAnchor({x:r.left,y:r.top,w:r.width,h:r.height});
        // Scroll element into view if off-screen
        if(r.top<0||r.bottom>window.innerHeight){
          el.scrollIntoView({behavior:"smooth",block:"center"});
        }
      } else setAnchor(null);
    },350);
    return()=>clearTimeout(timer);
  },[step,open,minimized]);

  // Recompute on resize/scroll
  useEffect(()=>{
    if(!open||!anchor||!steps[step]?.target) return;
    const recompute=()=>{
      const el=document.querySelector(steps[step].target);
      if(el){
        const r=el.getBoundingClientRect();
        setAnchor({x:r.left,y:r.top,w:r.width,h:r.height});
      }
    };
    window.addEventListener("scroll",recompute,{passive:true});
    window.addEventListener("resize",recompute);
    return()=>{window.removeEventListener("scroll",recompute);window.removeEventListener("resize",recompute);};
  },[open,anchor,step]);

  // Position tour card to not overlap anchor
  useEffect(()=>{
    if(!anchor){setCardPos({center:true});return;}
    const vh=window.innerHeight, vw=window.innerWidth;
    const cardH=280, cardW=Math.min(420,vw-32);
    // Put card opposite anchor — if anchor in top half, card goes bottom
    const anchorMidY=anchor.y+anchor.h/2;
    if(anchorMidY<vh/2){
      // Card goes to bottom
      setCardPos({top:null,bottom:20,left:(vw-cardW)/2,center:false});
    } else {
      // Card goes to top
      setCardPos({top:20,bottom:null,left:(vw-cardW)/2,center:false});
    }
  },[anchor]);

  if(!open) return null;
  const s=steps[step];
  const last=step===steps.length-1;
  const progress=((step+1)/steps.length)*100;

    // Horizontal arrow — always points LEFT or RIGHT toward anchor
  let arrowInfo=null;
  if(anchor){
    const anchorMidX=anchor.x+anchor.w/2;
    const anchorMidY=anchor.y+anchor.h/2;
    const vw=window.innerWidth;
    // If anchor is in left half → arrow on right side of anchor pointing LEFT (←)
    // If anchor is in right half → arrow on left side of anchor pointing RIGHT (→)
    const pointsLeft = anchorMidX < vw/2;
    const startX = pointsLeft ? anchor.x + anchor.w + 12 : anchor.x - 60;
    const startY = anchorMidY - 24; // vertically centered on anchor
    arrowInfo = {startX, startY, pointsLeft};
  }

  if(minimized) {
    return <DraggableMinimizedPill T={T} s={s} step={step} total={steps.length} onExpand={()=>{setMinimized(false);playSound("click");}} onClose={()=>{playSound("click");onClose();}}/>;
  }

  return (
    <>
      {/* SPOTLIGHT OVERLAY — dimmed everything except the anchor */}
      {anchor?(
        <svg style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:999,pointerEvents:"none"}}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="#fff"/>
              <rect x={anchor.x-8} y={anchor.y-8} width={anchor.w+16} height={anchor.h+16} rx={Math.max(anchor.w,anchor.h)/2+8} fill="#000"/>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-spotlight-mask)"/>
          {/* Red pulsing outline around anchor */}
          <rect x={anchor.x-6} y={anchor.y-6} width={anchor.w+12} height={anchor.h+12} rx={Math.max(anchor.w,anchor.h)/2+6} fill="none" stroke={T.accent} strokeWidth="3" style={{filter:`drop-shadow(0 0 8px ${T.accent})`,animation:"spotlightPulse 1.5s ease-in-out infinite"}}/>
        </svg>
      ):(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",zIndex:999,pointerEvents:"none"}}/>
      )}

      {/* BOUNCING ARROW pointing at anchor */}
      {arrowInfo&&(
        <svg width="56" height="48" viewBox="0 0 56 48" style={{position:"fixed",left:arrowInfo.startX,top:arrowInfo.startY,zIndex:1002,pointerEvents:"none",animation:arrowInfo.pointsLeft?"tourArrowLeft 1s ease-in-out infinite":"tourArrowRight 1s ease-in-out infinite",filter:`drop-shadow(0 3px 10px ${T.accent}bb)`}}>
          {arrowInfo.pointsLeft?(
            <path d="M 48 24 L 10 24 M 22 12 L 10 24 L 22 36" stroke={T.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ):(
            <path d="M 8 24 L 46 24 M 34 12 L 46 24 L 34 36" stroke={T.accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      )}

      {/* "PRESS HERE" label next to anchor */}
      {anchor&&(
        <div style={{position:"fixed",left:anchor.x+anchor.w+10,top:anchor.y+anchor.h/2-14,background:T.accent,color:"#fff",padding:"4px 12px",borderRadius:9999,fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",zIndex:1002,pointerEvents:"none",boxShadow:`0 2px 10px ${T.accent}88`,whiteSpace:"nowrap",animation:"fadeUp .25s ease both"}}>{s.action?"Try it":(s.title.includes("page")||s.title.includes("Settings")||s.title.includes("Messages")||s.title.includes("Inventory")||s.title.includes("Announcements")||s.title.includes("Leaderboard")||s.title.includes("Tasks"))?"Opened via":"Look here"} →</div>
      )}

      {/* TOUR CARD — floats off to one side so anchor stays visible */}
      <div style={{
        position:"fixed",
        ...(cardPos.center?{inset:0,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}:{left:cardPos.left,top:cardPos.top,bottom:cardPos.bottom}),
        zIndex:1000,
        pointerEvents:"none"
      }}>
        <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?20:18,width:"100%",maxWidth:420,padding:0,animation:exiting?"tourCardOut .24s ease both":"tourCardIn .35s cubic-bezier(.34,1.56,.64,1) both",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.4)",pointerEvents:"auto"}}>
          {/* Progress bar */}
          <div style={{height:3,background:T.bor,position:"relative"}}>
            <div style={{position:"absolute",inset:0,right:"auto",width:`${progress}%`,background:T.accent,transition:"width .35s cubic-bezier(.23,1,.32,1)"}}/>
          </div>
          {/* Top bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 0"}}>
            <div style={{fontSize:10,fontWeight:600,color:T.sub,letterSpacing:"0.1em",textTransform:"uppercase"}}>Tour · {step+1} of {steps.length}</div>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>{playSound("click");setExiting(true);setTimeout(()=>{setMinimized(true);setExiting(false);},240);}} title="Minimize" style={{background:"none",border:"none",color:T.sub,fontSize:20,cursor:"pointer",fontFamily:"inherit",padding:"0 8px",lineHeight:1}}>−</button>
              <button onClick={()=>{if(s.requireNotif&&Notification.permission!=="granted")return;playSound("click");onClose();}} title="Close" style={{background:"none",border:"none",color:(s.requireNotif&&Notification.permission!=="granted")?T.mut:T.sub,fontSize:20,cursor:(s.requireNotif&&Notification.permission!=="granted")?"not-allowed":"pointer",fontFamily:"inherit",padding:"0 8px",lineHeight:1,opacity:(s.requireNotif&&Notification.permission!=="granted")?0.4:1}}>×</button>
            </div>
          </div>
          {/* Content */}
          <div style={{padding:"4px 22px 18px",textAlign:"center"}}>
            <div key={step} style={{width:52,height:52,borderRadius:T.minimal?"50%":14,background:T.minimal?T.surfH:T.accent+"18",border:T.minimal?`1px solid ${T.bor}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"6px auto 12px",animation:"tourIconPop .45s cubic-bezier(.34,1.85,.64,1)"}}>{s.icon}</div>
            <div key={`t-${step}`} style={{fontSize:T.minimal?21:19,fontWeight:T.minimal?600:700,color:T.txt,letterSpacing:"-0.4px",marginBottom:3,fontFamily:T.minimal?"'Google Sans',sans-serif":"inherit",animation:"tourFadeSlide .4s ease both"}}>{s.title}</div>
            <div key={`s-${step}`} style={{fontSize:12,color:T.accent,fontWeight:500,letterSpacing:"0.02em",marginBottom:10,animation:"tourFadeSlide .4s ease both .05s",animationFillMode:"both"}}>{s.subtitle}</div>
            <div key={`b-${step}`} style={{fontSize:13,color:T.sub,lineHeight:1.6,maxWidth:340,margin:"0 auto",animation:"tourFadeSlide .4s ease both .1s",animationFillMode:"both"}}>{s.body}</div>
            {s.action&&(
              <button onClick={()=>{playSound("click");s.action.fn();}}
                style={{marginTop:14,background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"8px 18px",fontWeight:T.minimal?500:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"opacity .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >{E("✨","→")} {s.action.label}</button>
            )}
          </div>
          {/* Footer buttons */}
          <div style={{display:"flex",gap:8,padding:"0 14px 14px"}}>
            <button onClick={()=>{if(s.requireNotif&&Notification.permission!=="granted")return;playSound("click");onClose();}} style={{flex:1,background:"none",color:T.sub,border:`1px solid ${T.bor}`,borderRadius:9999,padding:"10px 14px",fontWeight:500,fontSize:12,cursor:(s.requireNotif&&Notification.permission!=="granted")?"not-allowed":"pointer",fontFamily:"inherit",opacity:(s.requireNotif&&Notification.permission!=="granted")?0.4:1}}>{last?"Close":(s.requireNotif&&Notification.permission!=="granted"?"Required":"Skip")}</button>
            {step>0&&<button onClick={()=>{playSound("click");setStep(st=>st-1);}} style={{background:"none",color:T.txt,border:`1px solid ${T.bor}`,borderRadius:9999,padding:"10px 14px",fontWeight:500,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>}
            <button disabled={s.requireNotif&&(typeof Notification!=="undefined"&&Notification.permission!=="granted")} onClick={()=>{
              if(s.requireNotif&&typeof Notification!=="undefined"&&Notification.permission!=="granted") return;
              playSound(last?"success":"click");
              if(last){onClose();LS.set("nl3-onboarded",1);}
              else setStep(st=>st+1);
            }} style={{flex:1.5,background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"10px 14px",fontWeight:T.minimal?500:700,fontSize:12,cursor:(s.requireNotif&&typeof Notification!=="undefined"&&Notification.permission!=="granted")?"not-allowed":"pointer",fontFamily:"inherit",transition:"opacity .15s",opacity:(s.requireNotif&&typeof Notification!=="undefined"&&Notification.permission!=="granted")?0.4:1}}
              onMouseEnter={e=>{if(!(s.requireNotif&&Notification.permission!=="granted"))e.currentTarget.style.opacity="0.88";}}
              onMouseLeave={e=>{if(!(s.requireNotif&&Notification.permission!=="granted"))e.currentTarget.style.opacity="1";}}
            >{last?(E("✓","")+" Finish"):(s.requireNotif&&typeof Notification!=="undefined"&&Notification.permission!=="granted"?"Enable first":"Next →")}</button>
          </div>
        </div>
      </div>

      {/* Embedded keyframes */}
      <style>{`
        @keyframes spotlightPulse { 0%,100% { stroke-opacity:1; } 50% { stroke-opacity:0.5; } }
        @keyframes tourArrowLeft { 0%,100% { transform:translateX(0); } 50% { transform:translateX(-8px); } }
        @keyframes tourArrowRight { 0%,100% { transform:translateX(0); } 50% { transform:translateX(8px); } }
        @keyframes tourCardIn { 0% { opacity:0; transform:translateY(20px) scale(0.95); } 100% { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes tourIconPop { 0% { transform:scale(0.3) rotate(-20deg); opacity:0; } 60% { transform:scale(1.15) rotate(5deg); opacity:1; } 100% { transform:scale(1) rotate(0); opacity:1; } }
        @keyframes tourFadeSlide { 0% { opacity:0; transform:translateY(10px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes tourPillIn { 0% { opacity:0; transform:scale(0.3) translateX(-50%); } 70% { opacity:1; transform:scale(1.1) translateX(-50%); } 100% { opacity:1; transform:scale(1) translateX(-50%); } }
        @keyframes tourCardOut { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(30px) scale(0.85); } }
      `}</style>
    </>
  );
}

function HelpModal({T,bottom}) {
  const [open,setOpen]=useState(false);
  const items=[
    {icon:E("⊙","○"),title:"Circle Menu Button (top-left)",desc:"The floating circle button fixed below the logo — always visible as you scroll. Tap it to open navigation from any page."},
    {icon:E("🤖","⬡"),title:"Ask Finn — Your AI Assistant",desc:"Tap the Finn button (bottom-right hex icon) to chat with Finn, your Fusion Integrated Neural Navigator. Ask about tasks, inventory, XP, or say 'take me to tasks' to navigate. Finn can also create tasks and announcements for you!"},
    {icon:E("🏠","⌂"),title:"Home",desc:"Your personal dashboard — quick stats, online team, and announcements."},
    {icon:E("✅","✓"),title:"Tasks",desc:"View and complete tasks assigned to you. Managers can create, assign, and delete tasks. Completed tasks show who finished them."},
    {icon:E("📦","□"),title:"Inventory",desc:"Track stock levels in real time. Tap + or − to adjust quantities."},
    {icon:E("🔔","○"),title:"Announcements",desc:"Messages from management. Tap ✕ to dismiss once you've read them — they stay in the recently dismissed list for quick restore."},
    {icon:E("💬","≡"),title:"Messages",desc:"One-on-one DMs or group chat with the whole team. Messages may be reviewed by management."},
    {icon:E("🏆","◆"),title:"Leaderboard & XP",desc:"Earn XP by completing tasks. High priority = 50 XP, Medium/Low = 25. Climb the leaderboard and unlock ranks."},
    {icon:E("📊","▦"),title:"Activity",desc:"Full log of logins, task completions, and team changes. Visible to managers and above."},
    {icon:E("📅","◷"),title:"Schedule",desc:"Tech Admin can paste a OneDrive/SharePoint schedule URL to show the team's shift schedule."},
    {icon:E("⚙️","◎"),title:"Settings",desc:"Profile, display mode (including Minimal Mode), sound preferences, device scaling, PIN, and notifications."},
    {icon:E("✦","✦"),title:"Minimal Mode",desc:"Settings → Display & Sound → Minimal Mode. Clean Google-inspired look with pill buttons, flat cards, and optional emoji hiding. Accent color fully customizable."},
    {icon:E("📲","↗"),title:"Add to Home Screen",desc:"iPhone (Safari): Share → Add to Home Screen. Android (Chrome): ⋮ menu → Add to Home Screen. Works like a real app."},
    {icon:E("💡","i"),title:"Feedback Button",desc:"Use the lightbulb button (bottom-right, above the ?) to send feature requests or report bugs directly to the Tech Admin."},
  ];
  return (
    <>
      <button onClick={()=>{playSound("open");setOpen(true);}} className="float-action-btn" style={{position:"fixed",bottom:bottom??52,right:14,zIndex:9998,background:T.minimal?(T.dark?"#ffffff":"#202124"):T.scarlet,color:T.minimal?(T.dark?"#000000":"#ffffff"):"#fff",border:T.minimal?`1.5px solid ${T.bor}`:"none",borderRadius:"50%",width:40,height:40,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:T.minimal?"none":"0 4px 14px rgba(0,0,0,.22)",transition:"transform .15s,filter .15s,bottom .25s",touchAction:"manipulation"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.filter="brightness(1.1)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.filter="none";}}
        title="Help" data-tour="help-button"
      >?</button>
      {open&&(
        <div onClick={e=>e.target===e.currentTarget&&setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:20}}>
          <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?16:18,width:"100%",maxWidth:480,maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"fadeUp .22s ease both",overflow:"hidden"}}>
            {/* Sticky header with always-visible × */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px 14px",borderBottom:`1px solid ${T.bor}`,flexShrink:0,background:T.surf,borderRadius:"18px 18px 0 0",position:"sticky",top:0,zIndex:10}}>
              <div style={{fontFamily:T.minimal?"'Google Sans',sans-serif":"'Clash Display',sans-serif",fontSize:T.minimal?17:19,fontWeight:T.minimal?600:800,color:T.txt,letterSpacing:T.minimal?"-0.3px":"normal"}}>{E("❓","?")} Help & Navigation</div>
              <button onClick={()=>{playSound("click");setOpen(false);}}
                style={{width:34,height:34,borderRadius:"50%",background:T.surfH,border:`1px solid ${T.bor}`,color:T.txt,fontSize:18,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.scarlet;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=T.scarlet;}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.surfH;e.currentTarget.style.color=T.txt;e.currentTarget.style.borderColor=T.bor;}}
              >×</button>
            </div>
            {/* Scrollable content */}
            <div style={{overflowY:"auto",padding:"16px 22px 22px"}}>
              <div style={{fontSize:13,color:T.sub,marginBottom:14,lineHeight:1.6}}>
                Welcome to <strong style={{color:T.accent}}>MNU&apos;s Neer Locker</strong> — your staff portal. Here&apos;s where to find everything:
              </div>
              <button onClick={()=>{setOpen(false);window._startOnboarding&&window._startOnboarding();playSound("open");}}
                style={{width:"100%",marginBottom:14,background:T.accent,color:"#fff",border:"none",borderRadius:T.minimal?9999:12,padding:"11px 18px",fontWeight:T.minimal?500:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity .15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >{E("✨","→")} Start guided walkthrough</button>
              <div style={{display:"grid",gap:10}}>
                {items.map((item,i)=>(
                  <div key={item.title} style={{display:"flex",gap:12,alignItems:"flex-start",background:T.surfH,borderRadius:T.minimal?12:12,border:T.minimal?`1px solid ${T.bor}`:"none",padding:"12px 14px",animation:`fadeUp .2s ${i*30}ms ease both`}}>
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


// ─── RATINGS PANEL (tech dashboard) ──────────────────────────────────────────
function RatingsPanel({T}){
  const [items,setItems]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [filter,setFilter]=useState("all"); // all, this_month, last_30
  useEffect(()=>{
    SB.select("app_ratings","?order=submitted_at.desc").then(d=>{setItems(d||[]);setLoaded(true);});
  },[]);
  const filtered=(()=>{
    if(filter==="all") return items;
    const now=Date.now();
    if(filter==="this_month"){
      const mk=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
      return items.filter(r=>r.month_key===mk);
    }
    if(filter==="last_30") return items.filter(r=>now-r.submitted_at<30*86400000);
    return items;
  })();
  const avg=filtered.length>0?(filtered.reduce((a,r)=>a+(r.rating||0),0)/filtered.length).toFixed(1):"—";
  const withFeedback=filtered.filter(r=>r.feedback&&r.feedback.length>0);
  const clear=async()=>{
    if(!window.confirm("Delete ALL ratings? Cannot be undone.")) return;
    await fetch(`${SUPABASE_URL}/rest/v1/app_ratings?id=neq.none`,{method:"DELETE",headers:SB.headers});
    setItems([]);
  };

  return (
    <div style={{background:T.card,border:`1px solid ${T.bor}`,borderRadius:14,padding:16,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div style={{fontWeight:700,color:T.txt,display:"flex",alignItems:"center",gap:8}}>⭐ Staff Ratings ({items.length})</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{k:"all",l:"All"},{k:"this_month",l:"This Month"},{k:"last_30",l:"Last 30d"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{background:filter===f.k?T.accent:T.surfH,color:filter===f.k?"#fff":T.sub,border:`1px solid ${filter===f.k?T.accent:T.bor}`,borderRadius:5,padding:"3px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{f.l}</button>
          ))}
          {items.length>0&&<button onClick={clear} style={{background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5",borderRadius:5,padding:"3px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>}
        </div>
      </div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        <div style={{background:T.bg,borderRadius:10,padding:"10px 12px",textAlign:"center",border:`1px solid ${T.bor}`}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.accent}}>{avg}</div>
          <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Avg Rating /10</div>
        </div>
        <div style={{background:T.bg,borderRadius:10,padding:"10px 12px",textAlign:"center",border:`1px solid ${T.bor}`}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.txt}}>{filtered.length}</div>
          <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Responses</div>
        </div>
        <div style={{background:T.bg,borderRadius:10,padding:"10px 12px",textAlign:"center",border:`1px solid ${T.bor}`}}>
          <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:22,fontWeight:800,color:T.blue}}>{withFeedback.length}</div>
          <div style={{fontSize:10,color:T.sub,fontWeight:600}}>With Ideas</div>
        </div>
      </div>
      {/* Rating distribution */}
      {filtered.length>0&&(
        <div style={{background:T.bg,borderRadius:10,padding:"10px 14px",marginBottom:12,border:`1px solid ${T.bor}`}}>
          <div style={{fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.04em",marginBottom:8}}>DISTRIBUTION</div>
          {[10,9,8,7,6,5,4,3,2,1].map(n=>{
            const count=filtered.filter(r=>r.rating===n).length;
            const pct=filtered.length>0?(count/filtered.length)*100:0;
            return (
              <div key={n} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <div style={{width:22,fontSize:11,fontWeight:700,color:T.sub,textAlign:"right"}}>{n}</div>
                <div style={{flex:1,height:8,background:T.surfH,borderRadius:9999,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:n>=8?"#16a34a":n>=5?"#eab308":"#dc2626",borderRadius:9999,transition:"width .4s"}}/>
                </div>
                <div style={{width:30,fontSize:10,color:T.sub,fontWeight:600}}>{count}</div>
              </div>
            );
          })}
        </div>
      )}
      {/* Responses */}
      {!loaded?<div style={{color:T.sub,fontSize:12}}>Loading ratings…</div>
        :filtered.length===0?<div style={{color:T.sub,fontSize:12,padding:"10px 0"}}>No ratings yet.</div>
        :(
          <div style={{maxHeight:400,overflowY:"auto",display:"grid",gap:6}}>
            {filtered.map(r=>(
              <div key={r.id} style={{background:T.bg,borderRadius:10,padding:"10px 14px",border:`1px solid ${T.bor}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:r.feedback?8:0}}>
                  <div style={{width:32,height:32,borderRadius:8,background:(r.rating>=8?"#16a34a":r.rating>=5?"#eab308":"#dc2626")+"22",border:`1px solid ${r.rating>=8?"#16a34a":r.rating>=5?"#eab308":"#dc2626"}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:r.rating>=8?"#16a34a":r.rating>=5?"#eab308":"#dc2626",flexShrink:0}}>{r.rating}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.txt}}>{r.user_name||"Anonymous"} <span style={{color:T.mut,fontWeight:500}}>· {r.user_role||""}</span></div>
                    <div style={{fontSize:10,color:T.faint,marginTop:1}}>{fmtDT(r.submitted_at)} · {r.month_key}</div>
                  </div>
                </div>
                {r.feedback&&(
                  <div style={{background:T.surfH,borderRadius:8,padding:"8px 10px",fontSize:12,color:T.txt,lineHeight:1.5,borderLeft:`3px solid ${T.accent}`}}>{r.feedback}</div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
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

// ─── MONTHLY RATING MODAL ──────────────────────────────────────────────────
function RatingModal({T,user,open,onClose}) {
  const [rating,setRating]=useState(0);
  const [hover,setHover]=useState(0);
  const [feedback,setFeedback]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);

  if(!open) return null;

  const submit=async()=>{
    if(rating===0){return;}
    setSubmitting(true);
    const now=new Date();
    const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    try{
      await SB.upsert("app_ratings",{
        id:uid(),
        user_id:user?.id||"",
        user_name:user?.name||"Anonymous",
        user_role:user?.role||"employee",
        rating,
        feedback:feedback.trim(),
        month_key:monthKey,
        submitted_at:Date.now(),
      });
      LS.set("nl3-last-rating",monthKey);
      playSound("success");
      setSubmitted(true);
      setTimeout(()=>{onClose();setSubmitted(false);setRating(0);setFeedback("");},1800);
    }catch(e){
      console.error("Rating save failed",e);
      setSubmitting(false);
    }
  };

  const later=()=>{playSound("click");onClose();};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:700,padding:16,animation:"fadeUp .25s ease both"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?20:18,width:"100%",maxWidth:440,overflow:"hidden",animation:"tourCardIn .35s cubic-bezier(.34,1.56,.64,1) both",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        {submitted?(
          <div style={{padding:"48px 28px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:14,animation:"tourIconPop .5s cubic-bezier(.34,1.85,.64,1)"}}>{E("🎉","★")}</div>
            <div style={{fontSize:T.minimal?22:20,fontWeight:T.minimal?600:800,color:T.txt,marginBottom:6,letterSpacing:"-0.3px"}}>Thank you!</div>
            <div style={{fontSize:13,color:T.sub,lineHeight:1.6}}>Your feedback helps make Neer Locker better for everyone.</div>
          </div>
        ):(
          <>
            <div style={{padding:"22px 24px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:T.minimal?"50%":12,background:T.accent+"18",border:T.minimal?`1px solid ${T.accent}33`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{E("⭐","★")}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:T.minimal?19:18,fontWeight:T.minimal?600:800,color:T.txt,letterSpacing:"-0.3px",fontFamily:T.minimal?"'Google Sans',sans-serif":"inherit"}}>How's Neer Locker?</div>
                  <div style={{fontSize:12,color:T.sub,marginTop:2}}>Rate your experience this month</div>
                </div>
              </div>
              <div style={{background:T.surfH,borderRadius:T.minimal?14:12,padding:"14px 12px",marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:4}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                    const active=n<=(hover||rating);
                    return (
                      <button key={n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
                        onClick={()=>{setRating(n);playSound("click");haptic&&haptic("light");}}
                        style={{background:active?T.accent:T.bg,color:active?"#fff":T.sub,border:`1.5px solid ${active?T.accent:T.bor}`,borderRadius:T.minimal?9999:8,padding:"10px 0",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"all .12s",transform:active?"scale(1.05)":"scale(1)"}}
                      >{n}</button>
                    );
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.sub,fontWeight:600,marginTop:8,letterSpacing:"0.04em"}}>
                  <span>POOR</span><span>AMAZING</span>
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.05em",marginBottom:6}}>ANY IMPROVEMENT IDEAS? (OPTIONAL)</div>
                <textarea value={feedback} onChange={e=>setFeedback(e.target.value)}
                  placeholder="What could we add or fix? What do you love?"
                  rows={3} maxLength={500}
                  style={{width:"100%",background:T.bg,border:`1px solid ${T.bor}`,borderRadius:T.minimal?12:10,color:T.txt,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",minHeight:72}}
                />
                <div style={{fontSize:10,color:T.mut,textAlign:"right",marginTop:3}}>{feedback.length}/500</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,padding:"0 20px 20px"}}>
              <button onClick={later} disabled={submitting} style={{flex:1,background:"none",color:T.sub,border:`1px solid ${T.bor}`,borderRadius:9999,padding:"11px 18px",fontWeight:500,fontSize:13,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.5:1}}>Maybe later</button>
              <button onClick={submit} disabled={rating===0||submitting} style={{flex:1.5,background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"11px 18px",fontWeight:T.minimal?500:700,fontSize:13,cursor:(rating===0||submitting)?"not-allowed":"pointer",fontFamily:"inherit",opacity:(rating===0||submitting)?0.4:1,transition:"opacity .15s"}}>{submitting?"Sending…":"Submit rating"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE PICTURE UPLOAD MODAL (saves to Supabase Storage) ──────────────
function PfpUploadModal({T,user,emps,setEmps,open,onClose,toast}) {
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [uploading,setUploading]=useState(false);
  const fileInput=useRef(null);

  if(!open) return null;

  const pickFile=()=>fileInput.current?.click();
  const onFile=(f)=>{
    if(!f) return;
    if(!f.type.startsWith("image/")){toast("Please select an image","err");return;}
    if(f.size>5_000_000){toast("Image must be under 5MB","err");return;}
    setFile(f);
    const reader=new FileReader();
    reader.onload=e=>setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const upload=async()=>{
    if(!file||!user) return;
    setUploading(true);
    try{
      // Read as base64 and save to employees table as data URL
      // (Supabase Storage would be cleaner, but this keeps things simple & works)
      const reader=new FileReader();
      reader.onload=async(e)=>{
        const dataUrl=e.target.result;
        // Resize to max 256x256 and compress for storage
        const img=new Image();
        img.onload=async()=>{
          const max=256;
          let w=img.width, h=img.height;
          if(w>h&&w>max){h=(h/w)*max;w=max;}
          else if(h>max){w=(w/h)*max;h=max;}
          const canvas=document.createElement("canvas");
          canvas.width=w; canvas.height=h;
          const ctx=canvas.getContext("2d");
          ctx.drawImage(img,0,0,w,h);
          const resized=canvas.toDataURL("image/jpeg",0.85);
          // Save to employees
          await SB.patch("employees",user.id,{avatar_url:resized});
          const next=emps.map(e=>e.id===user.id?{...e,avatar_url:resized}:e);
          setEmps(next);
          playSound("success");
          toast("Profile picture updated! ✅");
          setUploading(false);
          onClose();
        };
        img.src=dataUrl;
      };
      reader.readAsDataURL(file);
    }catch(err){
      console.error("PFP upload failed",err);
      toast("Upload failed — try again","err");
      setUploading(false);
    }
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:16,animation:"fadeUp .25s ease both"}}>
      <div style={{background:T.surf,border:`1px solid ${T.bor}`,borderRadius:T.minimal?20:16,width:"100%",maxWidth:380,padding:22,animation:"tourCardIn .3s cubic-bezier(.34,1.56,.64,1) both",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontWeight:T.minimal?600:800,fontSize:17,color:T.txt,letterSpacing:"-0.3px"}}>Profile Picture</div>
            <div style={{fontSize:12,color:T.sub,marginTop:2}}>Saves to cloud · visible to your team</div>
          </div>
          <button onClick={onClose} style={{background:T.surfH,border:`1px solid ${T.bor}`,color:T.txt,width:30,height:30,borderRadius:"50%",fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>×</button>
        </div>
        {/* Preview */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
          <div onClick={pickFile} style={{width:140,height:140,borderRadius:"50%",background:T.surfH,border:`2px dashed ${T.bor}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.bor}
          >
            {preview?(
              <img src={preview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            ):(
              <div style={{textAlign:"center",color:T.sub,fontSize:11,fontWeight:600}}>
                <div style={{fontSize:36,marginBottom:4}}>{E("📸","◎")}</div>
                <div>Click to upload</div>
              </div>
            )}
          </div>
        </div>
        <input ref={fileInput} type="file" accept="image/*" style={{display:"none"}} onChange={e=>onFile(e.target.files?.[0])}/>
        <div style={{fontSize:11,color:T.sub,textAlign:"center",marginBottom:14,lineHeight:1.5}}>
          JPG, PNG, GIF · max 5MB · auto-resized to 256×256
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} disabled={uploading} style={{flex:1,background:"none",color:T.sub,border:`1px solid ${T.bor}`,borderRadius:9999,padding:"10px 16px",fontWeight:500,fontSize:12,cursor:uploading?"not-allowed":"pointer",fontFamily:"inherit",opacity:uploading?0.5:1}}>Cancel</button>
          <button onClick={upload} disabled={!file||uploading} style={{flex:1.5,background:T.accent,color:"#fff",border:"none",borderRadius:9999,padding:"10px 16px",fontWeight:T.minimal?500:700,fontSize:12,cursor:(!file||uploading)?"not-allowed":"pointer",fontFamily:"inherit",opacity:(!file||uploading)?0.4:1}}>{uploading?"Uploading…":"Save to Cloud"}</button>
        </div>
      </div>
    </div>
  );
}


