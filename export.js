/* export.js - CSV, summary and parameter export. */
var Lab = window.Lab = window.Lab || {};
Lab.save = function (name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:type || 'text/plain'})); a.download = name; a.click(); };
Lab.exportCSV = function () { var h = Lab.sim.h, rows = [Lab.KEYS.join(',')]; for (var i = 0; i < h.t.length; i++) rows.push(Lab.KEYS.map(function (k) { return h[k][i]; }).join(',')); Lab.save('suspension_data_SI.csv', rows.join('\n'), 'text/csv'); };
Lab.exportParams = function () { Lab.save('experiment_parameters.json', JSON.stringify(Lab.p, null, 2), 'application/json'); };
Lab.summaryText = function () { var m = Lab.metrics(Lab.sim.h, Lab.p), p = Lab.p;
  return 'SIMULATED RESULTS (not real sensor data)\nTime: ' + Lab.sim.t.toFixed(2) + ' s\nMode: ' + p.mode + '  Road: ' + p.road + '  Suspension model: ' + p.susp + ' (motion ratio ' + p.mr + ')\n' +
   'ms=' + p.ms + ' mu=' + p.mu + ' ks=' + p.ks + ' cs=' + p.cs + ' kt=' + p.kt + ' ct=' + p.ct + ' speed=' + p.speed + ' km/h\nKp=' + p.Kp + ' Ki=' + p.Ki + ' Kd=' + p.Kd + ' Fmax=' + p.Fmax + ' Fmin=' + p.Fmin + '\n' +
   'Max body displacement: ' + (m.maxXs * 1000).toFixed(1) + ' mm\nMax body accel: ' + m.maxA.toFixed(2) + ' m/s2\nRMS accel: ' + m.rms.toFixed(2) + ' m/s2\nPeak spring force: ' + m.peakFk.toFixed(0) + ' N\nPeak damper force: ' + m.peakFc.toFixed(0) +
   ' N\nPeak tyre force: ' + m.peakFt.toFixed(0) + ' N\nPeak actuator force: ' + m.peakF.toFixed(0) + ' N\nSuspension travel (max): ' + (m.travel * 1000).toFixed(1) + ' mm\nSettling time: ' + m.settle.toFixed(2) + ' s\n'; };
Lab.exportSummary = function () { Lab.save('simulation_summary.txt', Lab.summaryText()); };
