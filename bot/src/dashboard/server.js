import http from "node:http";
import { config } from "../config.js";
import { runtime } from "../runtime.js";
import { stats, getLogs, getDebug } from "./state.js";
import { memoryStats, topPlayers } from "../memory/index.js";
import { activeGame, activeGamesCount } from "../games/engine.js";
import { activeSessions } from "../sessions/index.js";
import { summariesCount } from "../memory/summarizer.js";
import { listCustomGames } from "../games/registry.js";

function html() {
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><title>Ayumi Dashboard</title>
<style>
:root{color-scheme:dark}
body{font-family:ui-monospace,Menlo,monospace;background:#0b0d10;color:#d9e1e8;margin:0;padding:24px}
h1{margin:0 0 16px;font-size:18px;color:#7ee787}
h2{margin:20px 0 8px;font-size:13px;color:#8b949e;text-transform:uppercase;letter-spacing:1px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px}
.k{color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.v{color:#e6edf3;font-size:15px;margin-top:4px;word-break:break-word}
.ok{color:#7ee787}.bad{color:#ff7b72}.warn{color:#d29922}
button{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:12px}
button:hover{background:#30363d}
#logs{background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;height:36vh;overflow:auto;font-size:12px;white-space:pre-wrap}
.l-info{color:#79c0ff}.l-warn{color:#d29922}.l-error{color:#ff7b72}.l-debug{color:#8b949e}
ul{margin:4px 0;padding-left:18px}li{margin:2px 0;font-size:12px;color:#c9d1d9}
</style></head><body>
<h1>🤖 Ayumi — Dashboard</h1>

<h2>WhatsApp</h2><div class="grid" id="wa"></div>
<h2>IA (Gemini)</h2><div class="grid" id="ai"></div>
<h2>Activité</h2><div class="grid" id="act"></div>
<h2>Mémoire 🧠</h2><div class="grid" id="mem"></div>
<h2>Sessions 💬</h2><div class="grid" id="sess"></div>
<h2>Jeux 🎮</h2><div class="grid" id="games"></div>
<h2>Scheduler 🗓</h2><div class="grid" id="sched"></div>
<h2>Modération &amp; admin</h2><div class="grid" id="mod"></div>
<div><button id="btnAdmin">Toggle admin enforcement</button> <span id="adminState"></span></div>
<h2>Erreurs IA récentes</h2><div id="errs"></div>
<h2>Debug conversation 🐞</h2>
<div class="grid" id="dbg"></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
  <input id="dbgSearch" placeholder="Rechercher (décision, raison, texte, nom)" style="flex:1;min-width:220px;background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-family:inherit;font-size:12px"/>
  <input id="dbgLimit" type="number" min="10" max="500" value="50" style="width:80px;background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 10px;font-family:inherit;font-size:12px"/>
  <button id="btnCtx">Dernier prompt</button>
  <button id="btnExport">Export JSON</button>
</div>
<pre id="ctxBox" style="display:none;background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;max-height:40vh;overflow:auto;font-size:11px;white-space:pre-wrap;margin-top:8px"></pre>
<div id="dbgList" style="margin-top:8px"></div>
<h2>Logs live</h2><div id="logs"></div>

<script>
function card(k,v){return '<div class=card><div class=k>'+k+'</div><div class=v>'+v+'</div></div>'}
async function tick(){
  try{
    const s = await fetch('/api/stats').then(r=>r.json());
    const l = await fetch('/api/logs').then(r=>r.json());
    document.getElementById('wa').innerHTML = [
      card('Statut', s.whatsappConnected ? '<span class=ok>● online</span>' : '<span class=bad>● offline</span>'),
      card('Uptime', s.uptime),
      card('Bot JID', s.botJid || '—'),
    ].join('');
    document.getElementById('ai').innerHTML = [
      card('Modèle', s.lastModel || s.model),
      card('Requêtes', s.aiRequests + ' (✓'+s.aiSuccess+' ✗'+s.aiErrors+')'),
      card('Dernier statut', s.lastAiStatus || '—'),
      card('Latence (dern./moy.)', (s.lastAiLatencyMs||0)+' / '+s.avgLatencyMs+' ms'),
      card('Contexte (msgs)', s.lastContextSize),
      card('Prompt (chars)', s.lastPromptChars),
      card('Réponse (chars)', s.lastResponseChars),
      card('Réponses tronquées', s.truncatedResponses ? '<span class=warn>'+s.truncatedResponses+'</span>' : '0'),
      card('Dernière erreur', s.lastAiError ? '<span class=bad>'+s.lastAiError+'</span>' : '<span class=ok>aucune</span>'),
    ].join('');
    document.getElementById('act').innerHTML = [
      card('Messages vus', s.messagesSeen),
      card('Commandes', s.commandsRun),
      card('Warns émis', s.warnsIssued),
      card('Suppressions', s.deletes),
      card('Faits auto-extraits', s.autoFactsExtracted),
    ].join('');
    document.getElementById('mem').innerHTML = [
      card('Souvenirs', s.memory.total),
      card('Résumés stockés', s.summariesStored),
      card('Derniers souvenirs',
        s.memory.last.length
          ? '<ul>'+s.memory.last.map(m=>'<li>'+m.key+' → '+m.value+'</li>').join('')+'</ul>'
          : '—'),
    ].join('');
    document.getElementById('sess').innerHTML = [
      card('Sessions actives', s.sessions.length),
      card('Mode conversationnel', s.conversationalMode ? '<span class=ok>ON</span>' : 'OFF'),
      card('Détails', s.sessions.length
        ? '<ul>'+s.sessions.map(x=>'<li>'+x.userJid.split('@')[0]+(x.ayumiAsked?' (Ayumi a posé une question)':'')+'</li>').join('')+'</ul>'
        : '—'),
    ].join('');
    document.getElementById('games').innerHTML = [
      card('Parties actives', s.games.active),
      card('Partie en cours',
        s.games.current ? s.games.current.name+' — manche '+s.games.current.round+'/'+s.games.current.totalRounds : '—'),
      card('Jeux custom', s.games.custom.length
        ? '<ul>'+s.games.custom.map(g=>'<li>'+g.id+' — '+g.name+'</li>').join('')+'</ul>'
        : '—'),
      card('Top 3',
        s.games.top.length
          ? '<ul>'+s.games.top.map((p,i)=>'<li>'+(i+1)+'. '+(p.display_name||p.user_jid.split('@')[0])+' — '+p.points+' pts</li>').join('')+'</ul>'
          : 'aucun joueur'),
    ].join('');
    document.getElementById('sched').innerHTML = [
      card('Proactif aujourd\\'hui', s.proactiveSentToday + ' / ' + s.proactiveMax),
      card('Quiz auto (semaine)', s.quizAutoSentToday + ' / ' + s.scheduler.maxQuiz),
      card('Débat auto (semaine)', s.debateAutoSentToday + ' / ' + s.scheduler.maxDebate),
      card('Anniversaires', s.scheduler.birthdays ? 'ON' : 'OFF'),
      card('Runs total', s.scheduledRunCount),
    ].join('');
    document.getElementById('mod').innerHTML = [
      card('TEST_MODE', s.testMode ? '<span class=warn>ON</span>' : 'OFF'),
      card('Admin enforce', s.adminEnforce ? '<span class=ok>ON</span>' : '<span class=warn>OFF</span>'),
      card('Admins', (s.admins||[]).join(', ') || '—'),
      card('Block links', String(s.blockLinks)),
      card('Block media', String(s.blockMedia)),
      card('Delete blocked', String(s.deleteBlocked)),
    ].join('');
    document.getElementById('adminState').textContent = ' État: ' + (s.adminEnforce ? 'ON' : 'OFF');
    document.getElementById('errs').innerHTML = (s.recentAiErrors||[]).length
      ? '<ul>'+(s.recentAiErrors).slice().reverse().map(e=>'<li>['+new Date(e.ts).toISOString().slice(11,19)+'] '+e.status+' — '+(e.body||'').slice(0,200)+'</li>').join('')+'</ul>'
      : '<div style="color:#7ee787">aucune erreur récente</div>';
    const lastD = s.lastDecision;
    const lastC = s.lastContext;
    document.getElementById('dbg').innerHTML = [
      card('DEBUG_CONVERSATION', s.debugConversation ? '<span class=ok>ON</span>' : '<span class=warn>OFF</span>'),
      card('Dernière décision', lastD ? lastD.decision+' — '+lastD.reason : '—'),
      card('Dern. contexte (mem/facts/sum/hist/prompt)', lastC ? (lastC.sizes.userMemChars+'/'+lastC.sizes.factsChars+'/'+lastC.sizes.summaryChars+'/'+lastC.sizes.historyMsgs+'/'+lastC.sizes.promptChars) : '—'),
      card('Doublons ignorés', s.duplicatesSkipped||0),
    ].join('');
    try {
      const d = await fetch('/api/debug/conversation').then(r=>r.json());
      document.getElementById('dbgList').innerHTML = d.length
        ? '<ul>'+d.slice().reverse().slice(0,20).map(x=>'<li>['+new Date(x.ts).toISOString().slice(11,19)+'] '+(x.pushName||x.userJid?.split('@')[0]||'?')+' → <b>'+x.decision+'</b> ('+x.reason+')'+(x.text?' — '+x.text.slice(0,80):'')+'</li>').join('')+'</ul>'
        : '<div style="color:#8b949e">aucune décision capturée (active DEBUG_CONVERSATION=true)</div>';
    } catch(e){}
    const box = document.getElementById('logs');
    box.innerHTML = l.map(x=>{
      const time = new Date(x.t).toISOString().slice(11,19);
      const extra = x.obj ? ' '+JSON.stringify(x.obj) : '';
      return '<div class=l-'+x.level+'>['+time+'] '+x.level.toUpperCase()+' '+x.msg+extra+'</div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }catch(e){}
}
document.getElementById('btnAdmin').onclick = async ()=>{
  await fetch('/api/toggle-admin',{method:'POST'}); tick();
};
document.getElementById('btnCtx').onclick = async ()=>{
  const box = document.getElementById('ctxBox');
  if (box.style.display === 'block') { box.style.display='none'; return; }
  const c = await fetch('/api/debug/last-context').then(r=>r.json());
  box.style.display='block';
  if (!c || !c.systemExtras && !c.history) { box.textContent = 'Aucun contexte capturé.'; return; }
  box.textContent = '=== SYSTEM EXTRAS ===\\n'+(c.systemExtras||'(vide)')+'\\n\\n=== HISTORY ('+(c.history?.length||0)+') ===\\n'+(c.history||[]).map(h=>'['+h.role+'] '+h.content).join('\\n')+'\\n\\n=== USER MESSAGE ===\\n'+(c.userMessage||'');
};
tick();setInterval(tick,2000);
</script></body></html>`;
}

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m ${s % 60}s`;
}

export function startDashboard() {
  const port = config.dashboardPort;
  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html());
    }
    if (req.url === "/api/stats") {
      const mem = memoryStats();
      const top = topPlayers(5);
      const current = (() => {
        for (const jid of [config.groupJid].filter(Boolean)) {
          const g = activeGame(jid);
          if (g) return { name: g.name, round: g.round, totalRounds: g.totalRounds };
        }
        return null;
      })();
      const avg =
        stats.aiSuccess > 0
          ? Math.round((stats.totalAiLatencyMs || 0) / stats.aiSuccess)
          : 0;
      stats.summariesStored = summariesCount();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          ...stats,
          uptime: fmtUptime(Date.now() - stats.startedAt),
          model: config.gemini.model,
          admins: config.adminNumbers,
          testMode: config.testMode,
          adminEnforce: runtime.adminEnforce,
          conversationalMode: config.conversationalMode,
          debugConversation: config.debugConversation,
          blockLinks: config.moderation.blockLinks,
          blockMedia: config.moderation.blockMedia,
          deleteBlocked: config.moderation.deleteBlocked,
          proactiveMax: config.proactive.maxPerDay,
          avgLatencyMs: avg,
          memory: mem,
          sessions: activeSessions().map((s) => ({
            userJid: s.userJid,
            ayumiAsked: s.ayumiAsked,
            expiresInMs: s.expiresInMs,
          })),
          games: {
            active: activeGamesCount(),
            current,
            top,
            custom: listCustomGames(),
          },
          scheduler: {
            maxQuiz: config.scheduler.maxQuizAutoPerWeek,
            maxDebate: config.scheduler.maxDebateAutoPerWeek,
            birthdays: config.scheduler.birthdaysAuto,
          },
        }),
      );
    }
    if (req.url === "/api/logs") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(getLogs().slice(-200)));
    }
    if (req.url.startsWith("/api/debug/conversation")) {
      const u = new URL(req.url, "http://x");
      const q = (u.searchParams.get("q") || "").toLowerCase();
      const limit = Math.min(parseInt(u.searchParams.get("limit") || "50", 10), 500);
      const offset = parseInt(u.searchParams.get("offset") || "0", 10);
      let buf = getDebug().slice().reverse();
      if (q) {
        buf = buf.filter(
          (x) =>
            (x.decision || "").toLowerCase().includes(q) ||
            (x.reason || "").toLowerCase().includes(q) ||
            (x.text || "").toLowerCase().includes(q) ||
            (x.pushName || "").toLowerCase().includes(q),
        );
      }
      const page = buf.slice(offset, offset + limit);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ total: buf.length, items: page }));
    }
    if (req.url === "/api/debug/export") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=ayumi-debug-${Date.now()}.json`,
      });
      return res.end(
        JSON.stringify(
          { exportedAt: Date.now(), conversation: getDebug(), lastContext: stats.lastContext },
          null,
          2,
        ),
      );
    }
    if (req.url === "/api/debug/last-context") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(stats.lastContext || {}));
    }
    if (req.url === "/api/debug/sessions") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(activeSessions()));
    }
    if (req.url === "/api/toggle-admin" && req.method === "POST") {
      runtime.adminEnforce = !runtime.adminEnforce;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ adminEnforce: runtime.adminEnforce }));
    }
    res.writeHead(404);
    res.end("not found");
  });
  server.listen(port, () => {
    console.log(`📊 Dashboard: http://localhost:${port}`);
  });
}
