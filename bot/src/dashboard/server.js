import http from "node:http";
import { config } from "../config.js";
import { runtime } from "../runtime.js";
import { stats, getLogs } from "./state.js";

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
.v{color:#e6edf3;font-size:16px;margin-top:4px;word-break:break-all}
.ok{color:#7ee787}.bad{color:#ff7b72}.warn{color:#d29922}
button{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:12px}
button:hover{background:#30363d}
#logs{background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;height:50vh;overflow:auto;font-size:12px;white-space:pre-wrap}
.l-info{color:#79c0ff}.l-warn{color:#d29922}.l-error{color:#ff7b72}.l-debug{color:#8b949e}
.toggle{display:flex;align-items:center;gap:10px;margin:8px 0}
</style></head><body>
<h1>🤖 Ayumi — Dashboard</h1>

<h2>WhatsApp</h2>
<div class="grid" id="wa"></div>

<h2>IA (Gemini)</h2>
<div class="grid" id="ai"></div>

<h2>Activité</h2>
<div class="grid" id="act"></div>

<h2>Modération &amp; admin</h2>
<div class="grid" id="mod"></div>
<div class="toggle">
  <button id="btnAdmin">Toggle admin enforcement</button>
  <span id="adminState"></span>
</div>

<h2>Logs live</h2>
<div id="logs"></div>

<script>
function card(k,v){return '<div class=card><div class=k>'+k+'</div><div class=v>'+v+'</div></div>'}
async function tick(){
  try{
    const s = await fetch('/api/stats').then(r=>r.json());
    const l = await fetch('/api/logs').then(r=>r.json());
    document.getElementById('wa').innerHTML = [
      card('Statut', s.whatsappConnected ? '<span class=ok>● online</span>' : '<span class=bad>● offline</span>'),
      card('Uptime', s.uptime),
      card('Numéro connecté', s.botJid || '—'),
    ].join('');
    document.getElementById('ai').innerHTML = [
      card('Modèle', s.lastModel || s.model),
      card('Requêtes', s.aiRequests + ' (✓'+s.aiSuccess+' ✗'+s.aiErrors+')'),
      card('Dernier statut', s.lastAiStatus || '—'),
      card('Dernière latence', (s.lastAiLatencyMs||0)+' ms'),
      card('Dernière erreur', s.lastAiError ? '<span class=bad>'+s.lastAiError+'</span>' : '<span class=ok>aucune</span>'),
    ].join('');
    document.getElementById('act').innerHTML = [
      card('Messages vus', s.messagesSeen),
      card('Commandes', s.commandsRun),
      card('Warns émis', s.warnsIssued),
      card('Suppressions', s.deletes),
    ].join('');
    document.getElementById('mod').innerHTML = [
      card('TEST_MODE', s.testMode ? '<span class=warn>ON (tous admins)</span>' : 'OFF'),
      card('Admin enforce', s.adminEnforce ? '<span class=ok>ON</span>' : '<span class=warn>OFF (tous admins)</span>'),
      card('Admins détectés', (s.admins||[]).join(', ') || '—'),
      card('Block links', String(s.blockLinks)),
      card('Block media', String(s.blockMedia)),
      card('Delete blocked', String(s.deleteBlocked)),
    ].join('');
    document.getElementById('adminState').textContent =
      'État: ' + (s.adminEnforce ? 'ON' : 'OFF');
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
  await fetch('/api/toggle-admin',{method:'POST'});
  tick();
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
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          ...stats,
          uptime: fmtUptime(Date.now() - stats.startedAt),
          model: config.gemini.model,
          admins: config.adminNumbers,
          testMode: config.testMode,
          adminEnforce: runtime.adminEnforce,
          blockLinks: config.moderation.blockLinks,
          blockMedia: config.moderation.blockMedia,
          deleteBlocked: config.moderation.deleteBlocked,
        }),
      );
    }
    if (req.url === "/api/logs") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(getLogs().slice(-200)));
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
