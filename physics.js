/* physics.js - quarter-car model (2-DOF), SI units internally. Up is positive; displacements measured from static equilibrium (gravity cancels). */
var Lab = window.Lab = window.Lab || {};
// [key,label,min,max,step,section]
Lab.PARAM_DEFS = [
 ['ms','Sprung mass ms (kg, per corner)',50,2000,1,'Vehicle'],['mu','Unsprung mass mu (kg)',10,300,1,'Vehicle'],
 ['speed','Speed (km/h)',1,120,1,'Vehicle'],['xs0','Initial body displacement (mm)',-100,100,1,'Vehicle'],['xu0','Initial wheel displacement (mm)',-50,50,1,'Vehicle'],
 ['ks','Spring ks (N/m)',5000,150000,500,'Suspension'],['cs','Damper cs (Ns/m)',200,10000,50,'Suspension'],['reb','Rebound / compression damping ratio',0.5,2.5,0.05,'Suspension'],
 ['kt','Tyre stiffness kt (N/m)',50000,500000,1000,'Tyre'],['ct','Tyre damping ct (Ns/m)',0,2000,10,'Tyre'],
 ['bumpH','Bump height / pothole depth (mm)',10,200,1,'Road'],['bumpL','Bump length (m)',0.2,5,0.1,'Road'],['spacing','Bump spacing (m)',2,30,0.5,'Road'],
 ['wavelen','Sine wavelength (m)',1,30,0.5,'Road'],['rough','Random roughness (mm)',0,50,1,'Road'],
 ['Kp','Kp (N/m)',0,100000,100,'PID'],['Ki','Ki (N/(m s))',0,200000,100,'PID'],['Kd','Kd (N s/m)',0,20000,50,'PID'],
 ['Fmax','Max actuator force (N)',0,10000,50,'PID'],['Fmin','Min actuator force (N)',-10000,0,50,'PID'],
 ['setpoint','Desired body position (mm)',-100,100,1,'PID'],['tau','Derivative filter tau (s)',0.001,0.2,0.001,'PID'],['manual','Manual actuator force (N)',-5000,5000,10,'PID']];
Lab.DEFAULTS = {ms:300,mu:40,speed:30,xs0:0,xu0:0,ks:20000,cs:1500,reb:1,kt:200000,ct:100,bumpH:80,bumpL:1.5,spacing:8,wavelen:6,rough:10,
 Kp:8000,Ki:2000,Kd:1500,Fmax:3000,Fmin:-3000,setpoint:0,tau:0.01,manual:0,mode:'on',road:'bump',susp:'basic',mr:1};
// Equivalent motion ratio per suspension type: illustrative lumped-model values; geometry is NOT simulated.
Lab.SUSP = {basic:1, macpherson:0.9, wishbone:0.85, multilink:0.8, trailing:0.75};
// Illustrative example presets - NOT manufacturer-verified data.
Lab.PRESETS = {small:{ms:250,mu:35,ks:18000,cs:1300,kt:190000}, sedan:{ms:350,mu:40,ks:22000,cs:1600,kt:200000}, suv:{ms:450,mu:55,ks:30000,cs:2400,kt:250000},
 heavy:{ms:1500,mu:150,ks:90000,cs:8000,kt:450000}, sports:{ms:280,mu:35,ks:35000,cs:2600,kt:230000}};
Lab.customRoad = [[0,0],[3,0],[3.5,50],[4.5,50],[5,0]]; // [x metres, height mm]
Lab.PH = [0.3,1.1,2.0,3.7,4.9]; Lab.RL = [7,3.1,1.7,0.9,0.5];
Lab.roadAt = function (x, p) {
  var h = p.bumpH / 1000, L = p.bumpL, x0 = 3, t = p.road, u;
  if (t === 'bump' || t === 'pothole') { u = (x - x0) / L; return (u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0) * h * (t === 'bump' ? 1 : -1); }
  if (t === 'multi') { if (x < x0) return 0; u = ((x - x0) % p.spacing) / L; return u < 1 ? h * Math.sin(Math.PI * u) : 0; }
  if (t === 'sine') return h / 2 * Math.sin(2 * Math.PI * x / p.wavelen);
  if (t === 'random') { var s = 0; for (var k = 0; k < 5; k++) s += (p.rough / 1000) / (k + 1) * Math.sin(2 * Math.PI * x / Lab.RL[k] + Lab.PH[k]); return s; }
  if (t === 'custom') { var c = Lab.customRoad; if (!c.length || x <= c[0][0]) return c.length ? c[0][1] / 1000 : 0;
    for (var i = 1; i < c.length; i++) if (x <= c[i][0]) return (c[i-1][1] + (c[i][1] - c[i-1][1]) * (x - c[i-1][0]) / ((c[i][0] - c[i-1][0]) || 1)) / 1000;
    return c[c.length-1][1] / 1000; }
  return 0;
};
Lab.roadState = function (t, p) { var v = p.speed / 3.6, h = 1e-4; return [Lab.roadAt(v * t, p), (Lab.roadAt(v * (t + h), p) - Lab.roadAt(v * (t - h), p)) / (2 * h)]; };
// Independent force terms. s=[xs,vs,xu,vu]; F=actuator force (+ on sprung, - on unsprung)
Lab.forces = function (s, r, rd, F, p) {
  var m2 = p.mr * p.mr, d = s[0] - s[2], dv = s[1] - s[3];
  var Fk = p.ks * m2 * d, Fc = p.cs * m2 * (dv > 0 ? p.reb : 1) * dv, Ftk = p.kt * (s[2] - r), Ftc = p.ct * (s[3] - rd);
  return {Fk:Fk, Fc:Fc, Ftk:Ftk, Ftc:Ftc, Fpid:F, Fs:-Fk - Fc + F, Fu:Fk + Fc - Ftk - Ftc - F};
};
Lab.rk4 = function (sim, p, F, dt) {
  function f(y, t) { var rs = Lab.roadState(t, p), q = Lab.forces(y, rs[0], rs[1], F, p); return [y[1], q.Fs / p.ms, y[3], q.Fu / p.mu]; }
  function add(a, b, k) { return a.map(function (v, i) { return v + k * b[i]; }); }
  var s = sim.s, t = sim.t, k1 = f(s, t), k2 = f(add(s, k1, dt/2), t + dt/2), k3 = f(add(s, k2, dt/2), t + dt/2), k4 = f(add(s, k3, dt), t + dt);
  sim.s = s.map(function (v, i) { return v + dt / 6 * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]); });
};
