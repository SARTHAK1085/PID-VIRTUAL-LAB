/* simulation.js - fixed-step engine, recording, metrics, main loop. Physics step is independent of frame rate. */
var Lab = window.Lab = window.Lab || {};
Lab.DT = 0.001;
Lab.KEYS = ['t','xs','xu','r','vs','vu','as','au','Fk','Fc','Ftk','Ftc','Fpid','P','I','D','e','Fs','Fu','Fn'];
Lab.makeSim = function (p, keep) {
  var sim = {t:0, s:[p.xs0/1000, 0, p.xu0/1000, 0], pid:Lab.makePID(), n:0, keep:keep !== false, h:{}, cur:null};
  Lab.KEYS.forEach(function (k) { sim.h[k] = []; }); return sim;
};
Lab.record = function (sim, p, u) {
  var s = sim.s, rs = Lab.roadState(sim.t, p), q = Lab.forces(s, rs[0], rs[1], u.total, p);
  var c = {t:sim.t, xs:s[0], xu:s[2], r:rs[0], vs:s[1], vu:s[3], as:q.Fs / p.ms, au:q.Fu / p.mu, Fk:q.Fk, Fc:q.Fc, Ftk:q.Ftk, Ftc:q.Ftc,
    Fpid:u.total, P:u.P, I:u.I, D:u.D, e:u.e, Fs:q.Fs, Fu:q.Fu, Fn:Math.max(0, q.Ftk + q.Ftc)};
  sim.cur = c; Lab.KEYS.forEach(function (k) { sim.h[k].push(c[k]); });
  if (sim.h.t.length > 30000) Lab.KEYS.forEach(function (k) { sim.h[k].shift(); });
};
Lab.advance = function (sim, p, dt) {
  var u = Lab.control(sim, p, dt); Lab.rk4(sim, p, u.total, dt); sim.t += dt; sim.n++;
  if (!sim.s.every(isFinite)) { sim.bad = true; return; }
  if (sim.keep && sim.n % 10 === 0) Lab.record(sim, p, u);
};
Lab.metrics = function (h, p) {
  var n = h.t.length, m = {maxXs:0, maxA:0, rms:0, peakFk:0, peakFc:0, peakFt:0, peakF:0, travel:0, settle:0, overshoot:0};
  if (!n) return m;
  var sp = p.setpoint / 1000, dev = 0, i, a;
  for (i = 0; i < n; i++) { a = Math.abs(h.as[i]); m.maxXs = Math.max(m.maxXs, Math.abs(h.xs[i]));
    m.maxA = Math.max(m.maxA, a); m.rms += a * a; dev = Math.max(dev, Math.abs(h.xs[i] - sp));
    m.peakFk = Math.max(m.peakFk, Math.abs(h.Fk[i])); m.peakFc = Math.max(m.peakFc, Math.abs(h.Fc[i]));
    m.peakFt = Math.max(m.peakFt, Math.abs(h.Ftk[i] + h.Ftc[i])); m.peakF = Math.max(m.peakF, Math.abs(h.Fpid[i]));
    m.travel = Math.max(m.travel, Math.abs(h.xs[i] - h.xu[i])); }
  m.rms = Math.sqrt(m.rms / n); m.overshoot = dev;
  var tol = Math.max(0.05 * dev, 0.0005); for (i = n - 1; i >= 0; i--) if (Math.abs(h.xs[i] - sp) > tol) { m.settle = h.t[i]; break; }
  return m;
};
Lab.runBatch = function (p, T, dt) { var sim = Lab.makeSim(p, true); dt = dt || Lab.DT; if (dt > Lab.DT) sim.n = 0;
  var rec = Math.round(0.01 / dt); // keep 100 Hz records whatever dt is
  for (var i = 0, N = Math.round(T / dt); i < N; i++) { var u = Lab.control(sim, p, dt); Lab.rk4(sim, p, u.total, dt); sim.t += dt;
    if (!sim.s.every(isFinite)) break; if ((i + 1) % rec === 0) Lab.record(sim, p, u); }
  return Lab.metrics(sim.h, p); };
Lab.state = {running:true, scale:1, acc:0, last:null, step:false};
Lab.frame = function (now) {
  var S = Lab.state, dtf = S.last == null ? 0 : Math.min((now - S.last) / 1000, 0.05); S.last = now;
  if (S.running) S.acc += dtf * S.scale;
  if (S.step) { S.acc += 0.01; S.step = false; }
  var n = 0; while (S.acc >= Lab.DT && n < 400) { Lab.advance(Lab.sim, Lab.p, Lab.DT); S.acc -= Lab.DT; n++; if (Lab.sim.bad) break; }
  if (n >= 400) S.acc = 0;
  if (Lab.sim.bad) { S.running = false; Lab.sim = Lab.makeSim(Lab.p); Lab.onError && Lab.onError('Numerical instability detected - simulation reset. Reduce gains or stiffness.'); }
  Lab.onFrame && Lab.onFrame(now);
  requestAnimationFrame(Lab.frame);
};
