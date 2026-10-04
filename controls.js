/* controls.js - builds the UI, keeps sliders/number fields synced, wires buttons. */
var Lab = window.Lab = window.Lab || {};
Lab.p = Object.assign({}, Lab.DEFAULTS);
Lab.inputs = {};
Lab.setParam = function (k, v, fromUI) {
  var d = Lab.PARAM_DEFS.filter(function (x) { return x[0] === k; })[0]; v = parseFloat(v); if (!isFinite(v)) v = Lab.DEFAULTS[k];
  if (d) v = Math.min(d[3], Math.max(d[2], v)); Lab.p[k] = v;
  if (Lab.inputs[k]) { Lab.inputs[k][0].value = v; Lab.inputs[k][1].value = v; }
  if (k === 'xs0' || k === 'xu0') Lab.reset(); if (k === 'Fmin' && Lab.p.Fmax < v) Lab.setParam('Fmax', 0);
};
Lab.reset = function () { Lab.sim = Lab.makeSim(Lab.p); Lab.state.acc = 0; if (Lab.charts.g1) Lab.clearCharts(); };
Lab.initUI = function () {
  var side = document.getElementById('left'), secs = {};
  Lab.PARAM_DEFS.forEach(function (d) {
    if (!secs[d[5]]) { var det = document.createElement('details'); det.open = d[5] !== 'Tyre'; det.innerHTML = '<summary>' + d[5] + '</summary>'; side.appendChild(det); secs[d[5]] = det; }
    var row = document.createElement('div'); row.className = 'row'; row.innerHTML = '<label>' + d[1] + '</label>';
    var r = document.createElement('input'); r.type = 'range'; r.min = d[2]; r.max = d[3]; r.step = d[4];
    var n = document.createElement('input'); n.type = 'number'; n.min = d[2]; n.max = d[3]; n.step = d[4];
    r.value = n.value = Lab.p[d[0]]; r.oninput = function () { Lab.setParam(d[0], r.value); }; n.onchange = function () { Lab.setParam(d[0], n.value); };
    row.appendChild(r); row.appendChild(n); secs[d[5]].appendChild(row); Lab.inputs[d[0]] = [r, n];
  });
  function sel(id, fn) { var e = document.getElementById(id); e.onchange = function () { fn(e.value); }; }
  sel('mode', function (v) { Lab.p.mode = v; }); sel('road', function (v) { Lab.p.road = v; Lab.reset(); });
  sel('susp', function (v) { Lab.p.susp = v; Lab.p.mr = Lab.SUSP[v]; });
  sel('preset', function (v) { if (Lab.PRESETS[v]) Object.keys(Lab.PRESETS[v]).forEach(function (k) { Lab.setParam(k, Lab.PRESETS[v][k]); }); Lab.reset(); });
  document.getElementById('custom').onchange = function () { var pts = this.value.split('\n').map(function (l) { return l.split(',').map(parseFloat); }).filter(function (a) { return a.length === 2 && isFinite(a[0]) && isFinite(a[1]); }).sort(function (a, b) { return a[0] - b[0]; }); if (pts.length) Lab.customRoad = pts; };
  var on = function (id, fn) { document.getElementById(id).onclick = fn; };
  on('play', function () { Lab.state.running = true; }); on('pause', function () { Lab.state.running = false; });
  on('step', function () { Lab.state.running = false; Lab.state.step = true; }); on('reset', function () { Lab.reset(); });
  on('zin', function () { Lab.view.zoom = Math.min(3, Lab.view.zoom * 1.2); }); on('zout', function () { Lab.view.zoom = Math.max(0.4, Lab.view.zoom / 1.2); });
  on('left_', function () { Lab.view.pan += 40; }); on('right_', function () { Lab.view.pan -= 40; });
  document.querySelectorAll('[data-speed]').forEach(function (b) { b.onclick = function () { Lab.state.scale = parseFloat(b.dataset.speed); }; });
  on('tune', function () { var t = Lab.autoTune(Lab.p); ['Kp','Ki','Kd'].forEach(function (k) { Lab.setParam(k, t[k]); }); Lab.p.mode = 'on'; document.getElementById('mode').value = 'on'; Lab.reset(); });
  on('cmp', Lab.compareRun); on('csv', Lab.exportCSV); on('png', Lab.downloadCharts); on('sum', Lab.exportSummary); on('par', Lab.exportParams); on('clr', Lab.clearCharts);
  on('rst', function () { Lab.p = Object.assign({}, Lab.DEFAULTS); Object.keys(Lab.p).forEach(function (k) { if (Lab.inputs[k]) Lab.setParam(k, Lab.p[k]); }); ['mode','road','susp'].forEach(function (id) { document.getElementById(id).value = Lab.p[id]; }); Lab.reset(); });
};
Lab.dash = function () {
  var c = Lab.sim.cur || {}, m = Lab.metrics(Lab.sim.h, Lab.p), f = function (v, k, d) { return v === undefined ? '-' : (v * k).toFixed(d); };
  var rows = [['Time (s)', Lab.sim.t.toFixed(2)], ['Body disp (mm)', f(c.xs, 1000, 1)], ['Wheel disp (mm)', f(c.xu, 1000, 1)], ['Road (mm)', f(c.r, 1000, 1)], ['Body vel (m/s)', f(c.vs, 1, 3)], ['Wheel vel (m/s)', f(c.vu, 1, 3)],
    ['Body accel (m/s²)', f(c.as, 1, 2)], ['Body accel (g)', f(c.as, 1 / 9.81, 3)], ['Spring force (N)', f(c.Fk, 1, 0)], ['Damper force (N)', f(c.Fc, 1, 0)], ['Tyre force (N)', f(c.Ftk, 1, 0)], ['Actuator (N)', f(c.Fpid, 1, 0)],
    ['  P term (N)', f(c.P, 1, 0)], ['  I term (N)', f(c.I, 1, 0)], ['  D term (N)', f(c.D, 1, 0)], ['Travel (mm)', c.xs === undefined ? '-' : ((c.xs - c.xu) * 1000).toFixed(1)],
    ['Max body disp (mm)', (m.maxXs * 1000).toFixed(1)], ['RMS accel (m/s²)', m.rms.toFixed(2)], ['Settling (s)', m.settle.toFixed(2)], ['Peak actuator (N)', m.peakF.toFixed(0)]];
  document.getElementById('dash').innerHTML = rows.map(function (r) { return '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
};
window.addEventListener('DOMContentLoaded', function () {
  Lab.initUI(); Lab.initCharts(); Lab.reset();
  var cv = document.getElementById('cv'), ctx = cv.getContext('2d'), tick = 0, st = document.getElementById('status');
  Lab.onError = function (m) { st.textContent = m; };
  Lab.onFrame = function () { Lab.draw(ctx, cv.width, cv.height, Lab.sim, Lab.p); if (++tick % 6 === 0) { Lab.dash(); if (Lab.state.running) Lab.updateCharts(Lab.sim); st.textContent = (Lab.state.running ? 'Running' : 'Paused') + ' - ' + Lab.state.scale + 'x - simulated data'; } };
  requestAnimationFrame(Lab.frame);
});
