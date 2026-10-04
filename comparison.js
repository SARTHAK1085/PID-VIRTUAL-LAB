/* comparison.js - runs the SAME road/vehicle under several configurations and tabulates metrics (no single "winner"). */
var Lab = window.Lab = window.Lab || {};
Lab.compareRun = function () {
  var p = Lab.p, cfg = [['PID OFF (passive)', {mode:'off'}], ['PID ON', {mode:'on'}], ['Spring -30%, PID OFF', {mode:'off', ks:p.ks * 0.7}], ['Spring +50%, PID OFF', {mode:'off', ks:p.ks * 1.5}],
    ['Damping -50%, PID OFF', {mode:'off', cs:p.cs * 0.5}], ['Damping +100%, PID OFF', {mode:'off', cs:p.cs * 2}], ['Mass +40%, PID OFF', {mode:'off', ms:p.ms * 1.4}]];
  var rows = cfg.map(function (c) { var m = Lab.runBatch(Object.assign({}, p, c[1]), 8); return {name:c[0], m:m}; });
  var cols = [['maxXs','Max |body disp| (mm)',1000],['maxA','Max |accel| (m/s²)',1],['rms','RMS accel (m/s²)',1],['settle','Settling time (s)',1],['peakF','Peak actuator (N)',1]];
  var best = cols.map(function (c) { return Math.min.apply(null, rows.map(function (r) { return r.m[c[0]]; })); });
  var html = '<table><tr><th>Configuration</th>' + cols.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '</tr>' +
    rows.map(function (r) { return '<tr><td>' + r.name + '</td>' + cols.map(function (c, i) { var v = r.m[c[0]]; return '<td class="' + (v === best[i] ? 'best' : '') + '">' + (v * c[2]).toFixed(2) + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</table><p>Green = lowest in that column. Different metrics favour different configurations: e.g. a stiffer spring may cut body travel but raises acceleration; PID lowers body motion but needs actuator force.</p>';
  document.getElementById('cmpOut').innerHTML = html;
};
