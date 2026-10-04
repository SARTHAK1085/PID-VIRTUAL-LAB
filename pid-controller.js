/* pid-controller.js - PID with filtered derivative, output saturation and conditional-integration anti-windup. */
var Lab = window.Lab = window.Lab || {};
Lab.makePID = function () { return {I:0, ePrev:null, dF:0}; };
Lab.pidCompute = function (pid, xs, p, dt) {
  var e = p.setpoint / 1000 - xs, P = p.Kp * e;
  if (pid.ePrev === null) pid.ePrev = e;
  pid.dF += dt / (p.tau + dt) * ((e - pid.ePrev) / dt - pid.dF); pid.ePrev = e;
  var D = p.Kd * pid.dF, oldI = pid.I; pid.I += e * dt;
  var u = P + p.Ki * pid.I + D, sat = Math.min(p.Fmax, Math.max(p.Fmin, u));
  if (sat !== u && (u - sat) * e > 0) { pid.I = oldI; u = P + p.Ki * pid.I + D; sat = Math.min(p.Fmax, Math.max(p.Fmin, u)); } // anti-windup
  return {P:P, I:p.Ki * pid.I, D:D, e:e, total:sat};
};
// Actuator force only exists when mode is 'on' or 'manual'.
Lab.control = function (sim, p, dt) {
  var xs = sim.s[0], e = p.setpoint / 1000 - xs;
  if (p.mode === 'on') return Lab.pidCompute(sim.pid, xs, p, dt);
  sim.pid = Lab.makePID();
  if (p.mode === 'manual') return {P:0, I:0, D:0, e:e, total:Math.min(p.Fmax, Math.max(p.Fmin, p.manual))};
  return {P:0, I:0, D:0, e:e, total:0};
};
// Automatic tuning: coordinate search on a cost built from real batch simulations (comfort + travel + effort).
Lab.autoTune = function (p) {
  var q = Object.assign({}, p, {mode:'on'}), off = Lab.runBatch(Object.assign({}, p, {mode:'off'}), 6, 0.002);
  function cost(m) { return m.rms / off.rms + 0.5 * m.maxXs / off.maxXs + 0.1 * m.peakF / (p.Fmax || 1); }
  var best = cost(Lab.runBatch(q, 6, 0.002));
  for (var pass = 0; pass < 2; pass++) ['Kp','Kd','Ki'].forEach(function (k) {
    [0.5, 2].forEach(function (f) { var t = Object.assign({}, q); t[k] = Math.max(0, Math.min(k === 'Kd' ? 20000 : k === 'Ki' ? 200000 : 100000, q[k] * f));
      var c = cost(Lab.runBatch(t, 6, 0.002)); if (c < best) { best = c; q[k] = t[k]; } }); });
  return {Kp:Math.round(q.Kp), Ki:Math.round(q.Ki), Kd:Math.round(q.Kd), cost:best};
};
