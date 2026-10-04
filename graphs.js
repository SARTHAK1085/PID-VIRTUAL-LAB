/* graphs.js - Chart.js plots fed directly from recorded simulation history. */
var Lab = window.Lab = window.Lab || {};
Lab.CHARTS = [
 {id:'g1', title:'Displacement', y:'mm', c:[['xs','Body xs',1000,'#4fd8ff'],['xu','Wheel xu',1000,'#ffa63d'],['r','Road r',1000,'#9aa']]},
 {id:'g2', title:'Acceleration', y:'g', c:[['as','Body',1/9.81,'#4fd8ff'],['au','Wheel',1/9.81,'#ffa63d']]},
 {id:'g3', title:'Forces', y:'N', c:[['Fk','Spring',1,'#4fd8ff'],['Fc','Damper',1,'#ffa63d'],['Ftk','Tyre spring',1,'#2ecc71'],['Ftc','Tyre damping',1,'#ff4d4d'],['Fpid','Actuator',1,'#d0f'],['Fn','Normal tyre',1,'#fff']]},
 {id:'g4', title:'Net force', y:'N', c:[['Fs','Sprung mass',1,'#4fd8ff'],['Fu','Unsprung mass',1,'#ffa63d']]},
 {id:'g5', title:'PID terms', y:'N', c:[['P','P',1,'#2ecc71'],['I','I',1,'#ffa63d'],['D','D',1,'#ff4d4d'],['Fpid','Total',1,'#4fd8ff']]},
 {id:'g6', title:'Control error / velocity', y:'mm  |  mm/s', c:[['e','Error (mm)',1000,'#ffa63d'],['vs','Body vel (mm/s)',1000,'#4fd8ff'],['vu','Wheel vel (mm/s)',1000,'#9aa']]}];
Lab.charts = {};
Lab.initCharts = function () {
  Lab.CHARTS.forEach(function (d) {
    var cv = document.getElementById(d.id), grid = {color:'#2a3a5a'}, tc = '#9fb4d8';
    Lab.charts[d.id] = new Chart(cv, {type:'line', data:{labels:[], datasets:d.c.map(function (c) { return {label:c[1], borderColor:c[3], borderWidth:1.5, pointRadius:0, data:[]}; })},
      options:{animation:false, maintainAspectRatio:false, plugins:{title:{display:true, text:d.title, color:'#e6f0ff'}, legend:{labels:{color:tc}}},
        scales:{x:{title:{display:true, text:'Time (s)', color:tc}, ticks:{color:tc, maxTicksLimit:8}, grid:grid}, y:{title:{display:true, text:d.y, color:tc}, ticks:{color:tc}, grid:grid}}}});
  });
};
Lab.updateCharts = function (sim) {
  var h = sim.h, n = h.t.length, a = Math.max(0, n - 1000); // last 10 s
  Lab.CHARTS.forEach(function (d) { var ch = Lab.charts[d.id]; ch.data.labels = h.t.slice(a).map(function (t) { return t.toFixed(2); });
    d.c.forEach(function (c, i) { ch.data.datasets[i].data = h[c[0]].slice(a).map(function (v) { return v * c[2]; }); }); ch.update('none'); });
};
Lab.clearCharts = function () { Lab.CHARTS.forEach(function (d) { var ch = Lab.charts[d.id]; ch.data.labels = []; ch.data.datasets.forEach(function (s) { s.data = []; }); ch.update('none'); }); };
Lab.downloadCharts = function () { Lab.CHARTS.forEach(function (d) { var a = document.createElement('a'); a.href = Lab.charts[d.id].toBase64Image(); a.download = d.title + '.png'; a.click(); }); };
