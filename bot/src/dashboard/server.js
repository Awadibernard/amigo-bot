import http from "node:http";
import { config } from "../config.js";
import { stats, getLogs } from "./state.js";

function html() {
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><title>Ayumi Dashboard</title>
<style>
:root{color-scheme:dark}
body{font-family:ui-monospace,Menlo,monospace;background:#0b0d10;color:#d9e1e8;margin:0;padding:24px}
h1{margin:0 0 16px;font-size:18px;color:#7ee787}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px}
.k{color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
.v{color:#e6edf3;font-size:18px;margin-top:4px;word-break:break-all}
.ok{color:#7ee787}.bad{color:#ff7b72}
#logs{background:#010409;border:1px solid #30363d;border-radius:8px;padding:12px;height:60vh;overflow:auto;font-size:12px;white-space:pre-wrap}
.l-info{color:#79c0ff}.l-warn{color:#d29922}.l-error{color:#ff7b72}.l-debug{color:#8b949e}
</style></head><body>
<h1>🤖 Ayumi — Dashboard</h1>
<div class="grid" id="cards"></div>
<div id="logs"></div>
<script>
async function tick(){
  try{
    const s = await fetch('/api/stats').then(r=>r.json());
    const l = await fetch('/api/logs').then(r=>r.json());
    document.getElementById('cards').innerHTML = [
      ['Statut WhatsApp', s.whatsappConnected ? '<span class=ok>● online</span>' : '<span class=bad>● offline</span>'],
      ['Uptime', s.uptime],
      ['Bot JID', s.botJid || '—'],
      ['Modèle actif', s.lastModel || '(aucun appel encore)'],
      ['Requêtes IA', s.aiRequests + ' (✓'+s.aiSuccess+' ✗'+s.aiErrors+')'],
      ['Messages vus', s.messagesSeen],
      ['Commandes', s.commandsRun],
      ['Warns émis', s.warnsIssued],
      ['Suppressions', s.deletes],
      ['Admins', (s.admins||[]).join(', ') || '—'],
      ['Block media', String(s.blockMedia)],
      ['Delete blocked', String(s.deleteBlocked)],
    ].map(([k,v])=>'<div class=card><div class=k>'+k+'</div><div class=v>'+v+'</div></div>').join('');
    const box = document.getElementById('logs');
    box.innerHTML = l.map(x=>{
      const time = new Date(x.t).toISOString().slice(11,19);
      const extra = x.obj ? ' '+JSON.stringify(x.obj) : '';
      return '<div class=l-'+x.level+'>['+time+'] '+x.level.toUpperCase()+' '+x.msg+extra+'</div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }catch(e){}
}
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
          admins: config.adminNumbers,
          blockMedia: config.moderation.blockMedia,
          deleteBlocked: config.moderation.deleteBlocked,
        }),
      );
    }
    if (req.url === "/api/logs") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(getLogs().slice(-150)));
    }
    res.writeHead(404);
    res.end("not found");
  });
  server.listen(port, () => {
    // log direct (sans dépendance circulaire au logger)
    console.log(`📊 Dashboard: http://localhost:${port}`);
  });
}
