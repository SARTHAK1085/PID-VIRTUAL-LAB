/* vehicle-animation.js - canvas side view of one quarter-car corner, driven only by simulation state. */
var Lab = window.Lab = window.Lab || {};
Lab.view = {zoom:1, pan:0};
Lab.draw = function (ctx, W, H, sim, p) {
  var V = Lab.view, S = 500 * V.zoom, ppm = 120 * V.zoom, y0 = H - 60, R = 38, wx = W / 2 + V.pan, v = p.speed / 3.6;
  var xs = sim.s[0], xu = sim.s[2], c = sim.cur, F = c ? c.Fpid : 0;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b1830'; ctx.fillRect(0, 0, W, H);
  // road (scrolls with distance travelled, sampled from the same road function used by physics)
  ctx.beginPath(); ctx.moveTo(0, H);
  for (var px = 0; px <= W; px += 3) ctx.lineTo(px, y0 - Lab.roadAt(v * sim.t + (px - wx) / ppm, p) * S);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = '#26324a'; ctx.fill(); ctx.strokeStyle = '#6b7a99'; ctx.stroke();
  var wy = y0 - R - xu * S, by = y0 - R - 150 - xs * S;
  // car body
  ctx.fillStyle = '#1d6fb8'; ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(wx - 170, by - 52, 300, 52, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(wx - 100, by - 92, 160, 42, 12); ctx.fill(); ctx.stroke();
  // wheel + tyre
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(wx, wy, R, 0, 7); ctx.fill(); ctx.strokeStyle = '#8aa'; ctx.stroke();
  ctx.fillStyle = '#9ab'; ctx.beginPath(); ctx.arc(wx, wy, 14, 0, 7); ctx.fill();
  var top = wy - 20;
  // spring (zig-zag, length follows body-wheel gap)
  var sx = wx - 22; ctx.strokeStyle = '#ffa63d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, top);
  for (var i = 1; i <= 12; i++) ctx.lineTo(sx + (i % 2 ? 10 : -10), top + (by - top) * i / 12); ctx.lineTo(sx, by); ctx.stroke();
  // damper: cylinder on wheel, rod on body
  var dx = wx + 2; ctx.fillStyle = '#556'; ctx.fillRect(dx - 7, top - 46, 14, 46); ctx.fillStyle = '#ccd'; ctx.fillRect(dx - 2, by, 4, top - 46 - by);
  // actuator
  var ax = wx + 30, col = F > 0 ? '#2ecc71' : F < 0 ? '#ff4d4d' : '#889'; ctx.fillStyle = '#445'; ctx.fillRect(ax - 6, top - 40, 12, 40);
  ctx.fillStyle = col; ctx.fillRect(ax - 3, by, 6, top - 40 - by);
  var L = Math.max(-60, Math.min(60, F / 3000 * 60)); if (Math.abs(L) > 2) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax + 20, by + 30); ctx.lineTo(ax + 20, by + 30 - L); ctx.stroke();
    ctx.beginPath(); var d = L > 0 ? 1 : -1; ctx.moveTo(ax + 20, by + 30 - L); ctx.lineTo(ax + 14, by + 30 - L + 8 * d); ctx.lineTo(ax + 26, by + 30 - L + 8 * d); ctx.fillStyle = col; ctx.fill(); }
  ctx.fillStyle = '#cfe'; ctx.font = '12px sans-serif'; ctx.fillText('Spring', sx - 55, (top + by) / 2); ctx.fillText('Damper', dx - 4, by + 18 > top ? top : by + 70);
  ctx.fillText('PID actuator ' + F.toFixed(0) + ' N', ax + 30, by + 14); ctx.fillText('Sprung mass (body)', wx - 160, by - 58); ctx.fillText('Unsprung mass (wheel)', wx - 150, wy + R + 14);
  ctx.fillText('Quarter-car corner shown; rear wheel is not simulated', 10, 18);
};
