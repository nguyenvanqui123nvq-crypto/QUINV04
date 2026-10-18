(function () {
  'use strict';

  var DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var REGION_NAME = { mb: 'Miền Bắc', mt: 'Miền Trung', mn: 'Miền Nam' };

  // Lịch quay theo thứ (0 = Chủ nhật)
  var SCHEDULE = {
    mb: ['Thái Bình', 'Hà Nội', 'Quảng Ninh', 'Bắc Ninh', 'Hà Nội', 'Hải Phòng', 'Nam Định'],
    mt: [
      ['Khánh Hòa', 'Kon Tum', 'Thừa Thiên Huế'], ['Phú Yên', 'Thừa Thiên Huế'],
      ['Đắk Lắk', 'Quảng Nam'], ['Đà Nẵng', 'Khánh Hòa'],
      ['Bình Định', 'Quảng Trị', 'Quảng Bình'], ['Gia Lai', 'Ninh Thuận'],
      ['Đà Nẵng', 'Quảng Ngãi', 'Đắk Nông']
    ],
    mn: [
      ['Tiền Giang', 'Kiên Giang', 'Đà Lạt'], ['TP. Hồ Chí Minh', 'Đồng Tháp', 'Cà Mau'],
      ['Bến Tre', 'Vũng Tàu', 'Bạc Liêu'], ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng'],
      ['Tây Ninh', 'An Giang', 'Bình Thuận'], ['Vĩnh Long', 'Bình Dương', 'Trà Vinh'],
      ['TP. Hồ Chí Minh', 'Long An', 'Bình Phước', 'Hậu Giang']
    ]
  };

  // [tên giải, số chữ số, số lượng]
  var PRIZES_MB = [['ĐB', 5, 1], ['G.1', 5, 1], ['G.2', 5, 2], ['G.3', 5, 6], ['G.4', 4, 4], ['G.5', 4, 6], ['G.6', 3, 3], ['G.7', 2, 4]];
  var PRIZES_MI = [['G.8', 2, 1], ['G.7', 3, 1], ['G.6', 4, 3], ['G.5', 4, 1], ['G.4', 5, 7], ['G.3', 5, 2], ['G.2', 5, 1], ['G.1', 5, 1], ['ĐB', 6, 1]];

  var state = { region: 'mb', date: new Date(), data: {} };
  var $ = function (id) { return document.getElementById(id); };

  // ---------- tiện ích ----------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmt(d) { return DAYS[d.getDay()] + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function seedOf(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function digits(r, n) { var s = ''; for (var i = 0; i < n; i++) s += Math.floor(r() * 10); return s; }

  // Sinh kết quả giả lập (cố định theo ngày + đài) hoặc lấy từ data/results.json
  function gen(prizes, key) {
    var ext = state.data[key];
    if (ext) return ext;
    if (state.real) return null;
    var r = rng(seedOf(key)), out = [];
    prizes.forEach(function (p) {
      var arr = [];
      for (var i = 0; i < p[2]; i++) arr.push(digits(r, p[1]));
      out.push(arr);
    });
    return out;
  }

  function provincesFor(region, d) {
    var w = d.getDay();
    return region === 'mb' ? [SCHEDULE.mb[w]] : SCHEDULE[region][w];
  }

  function lotoOf(rows) {
    var heads = []; for (var i = 0; i < 10; i++) heads.push([]);
    rows.forEach(function (arr) { arr.forEach(function (n) { var t = n.slice(-2); heads[+t[0]].push(t[1]); }); });
    return heads;
  }
  function lotoTable(rows) {
    var h = lotoOf(rows), html = '<table class="loto"><tbody>';
    for (var i = 0; i < 10; i++) html += '<tr><th>' + i + '</th><td>' + h[i].sort().join(', ') + '</td></tr>';
    return html + '</tbody></table>';
  }

  // ---------- hiển thị ----------
  function render() {
    var d = state.date, region = state.region, box = $('results');
    $('dateInput').value = iso(d);
    document.querySelectorAll('[data-region]').forEach(function (b) { b.classList.toggle('active', b.dataset.region === region); });

    var now = new Date(); now.setHours(23, 59, 59, 999);
    if (d > now) {
      box.innerHTML = '<div class="empty">Chưa đến ngày mở thưởng (' + fmt(d) + ').</div>';
      state.current = null; renderStats(); return;
    }

    var provs = provincesFor(region, d), html = '', all = [];
    var none = '<div class="empty">Chưa có kết quả ' + REGION_NAME[region] + ' cho ' + fmt(d) + '. Dữ liệu được cập nhật tự động sau giờ quay.</div>';
    if (region !== 'mb') {
      provs = provs.filter(function (p) { return gen(PRIZES_MI, region + '/' + iso(d) + '/' + p); });
    }
    if (region === 'mb' ? !gen(PRIZES_MB, 'mb/' + iso(d)) : !provs.length) {
      box.innerHTML = none; state.current = null; renderStats(); return;
    }
    if (region === 'mb') {
      var rows = gen(PRIZES_MB, 'mb/' + iso(d));
      all = rows;
      html += '<div class="res-title">Kết quả xổ số ' + provs[0] + ' - ' + fmt(d) + '</div><div class="res-box"><table class="kq"><tbody>';
      PRIZES_MB.forEach(function (p, i) {
        html += '<tr class="' + (p[0] === 'ĐB' ? 'db' : '') + '"><th>' + p[0] + '</th><td>' +
          rows[i].map(function (n) { return '<span>' + n + '</span>'; }).join('') + '</td></tr>';
      });
      html += '</tbody></table><div class="loto-wrap"><h4>Bảng loto</h4>' + lotoTable(rows) + '</div></div>';
    } else {
      var sets = provs.map(function (p) { return gen(PRIZES_MI, region + '/' + iso(d) + '/' + p); });
      all = sets;
      html += '<div class="res-title">Kết quả xổ số ' + REGION_NAME[region] + ' - ' + fmt(d) + '</div><div class="res-box">' +
        '<table class="kq multi"><thead><tr><th></th>' + provs.map(function (p) { return '<th class="prov">' + p + '</th>'; }).join('') + '</tr></thead><tbody>';
      PRIZES_MI.forEach(function (p, i) {
        html += '<tr class="' + (p[0] === 'ĐB' ? 'db' : p[0] === 'G.8' ? 'g8' : '') + '"><th>' + p[0] + '</th>' +
          sets.map(function (s) { return '<td>' + s[i].map(function (n) { return '<span>' + n + '</span>'; }).join('') + '</td>'; }).join('') + '</tr>';
      });
      html += '</tbody></table><div class="loto-wrap"><h4>Bảng loto theo đài</h4>';
      provs.forEach(function (p, i) { html += '<b>' + p + '</b>' + lotoTable(sets[i]); });
      html += '</div></div>';
    }
    box.innerHTML = html;
    state.current = { region: region, provs: provs, all: all };
    renderStats();
  }

  function renderStats() {
    var el = $('stats');
    if (!state.current) { el.innerHTML = '<p class="muted">Không có dữ liệu.</p>'; return; }
    var c = state.current, flat = [];
    if (c.region === 'mb') c.all.forEach(function (a) { flat = flat.concat(a); });
    else c.all.forEach(function (s) { s.forEach(function (a) { flat = flat.concat(a); }); });
    var cnt = {};
    flat.forEach(function (n) { var t = n.slice(-2); cnt[t] = (cnt[t] || 0) + 1; });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || a.localeCompare(b); }).slice(0, 5);
    var db = c.region === 'mb' ? c.all[0][0] : c.all[0][c.all[0].length - 1][0];
    el.innerHTML = '<div class="stat-row"><span>Giải ĐB' + (c.region === 'mb' ? '' : ' (' + c.provs[0] + ')') + '</span><b style="color:#d50000">' + db + '</b></div>' +
      '<div class="stat-row"><span>Tổng số loto</span><b>' + flat.length + '</b></div>' +
      '<div class="stat-row"><span>Loto về nhiều nhất</span><b>' + top.map(function (t) { return t + ' (' + cnt[t] + ')'; }).join(', ') + '</b></div>';
  }

  function renderSchedule() {
    var today = new Date().getDay(), html = '<table>';
    var order = [1, 2, 3, 4, 5, 6, 0];
    order.forEach(function (w) {
      html += '<tr class="' + (w === today ? 'today' : '') + '"><td>' + DAYS[w] + '</td><td>' +
        '<b>MB:</b> ' + SCHEDULE.mb[w] + '<br><b>MT:</b> ' + SCHEDULE.mt[w].join(', ') + '<br><b>MN:</b> ' + SCHEDULE.mn[w].join(', ') + '</td></tr>';
    });
    $('schedule').innerHTML = html + '</table>';
  }

  // ---------- dò vé ----------
  function checkTicket() {
    var t = $('ticket').value.replace(/\D/g, ''), out = $('checkOut');
    if (t.length < 2) { out.innerHTML = '<span class="lose">Nhập ít nhất 2 chữ số.</span>'; return; }
    if (!state.current) { out.innerHTML = '<span class="lose">Chưa có kết quả để dò.</span>'; return; }
    var c = state.current, hits = [];
    function scan(rows, prizes, name) {
      rows.forEach(function (arr, i) {
        arr.forEach(function (n) {
          if (t.length >= n.length ? t.slice(-n.length) === n : false) hits.push((name ? name + ' - ' : '') + prizes[i][0] + ' (' + n + ')');
        });
      });
    }
    if (c.region === 'mb') scan(c.all, PRIZES_MB, '');
    else c.all.forEach(function (s, i) { scan(s, PRIZES_MI, c.provs[i]); });
    out.innerHTML = hits.length
      ? '<span class="win">🎉 Trúng: ' + hits.join('; ') + '</span>'
      : '<span class="lose">Rất tiếc, vé ' + t + ' không trúng giải nào.</span>';
  }

  // ---------- sự kiện ----------
  function shift(n) { state.date = new Date(state.date.getFullYear(), state.date.getMonth(), state.date.getDate() + n); render(); }
  function setRegion(r) { state.region = r; render(); }

  document.querySelectorAll('[data-region]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); setRegion(b.dataset.region); $('nav').classList.remove('open'); });
  });
  $('prevDay').onclick = function () { shift(-1); };
  $('nextDay').onclick = function () { shift(1); };
  $('todayBtn').onclick = function () { state.date = new Date(); render(); };
  $('dateInput').onchange = function () {
    var p = this.value.split('-'); if (p.length === 3) { state.date = new Date(+p[0], +p[1] - 1, +p[2]); render(); }
  };
  $('checkBtn').onclick = checkTicket;
  $('ticket').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkTicket(); });
  $('menuBtn').onclick = function () { $('nav').classList.toggle('open'); };
  $('yr').textContent = new Date().getFullYear();

  renderSchedule();
  // Nạp dữ liệu thật (nếu có) rồi hiển thị
  fetch('data/results.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (j) { state.data = j || {}; state.real = Object.keys(state.data).length > 0;
      var nt = document.querySelector('.notice');
      if (state.real && nt) nt.innerHTML = 'Dữ liệu tự động cập nhật từ <a href="https://383.im/" target="_blank" rel="noopener">383.im</a>. Kết quả chỉ mang tính tham khảo, vui lòng đối chiếu với kết quả chính thức của các công ty xổ số.';
      if (state.real && !state.data['mb/' + iso(state.date)]) {
        var last = Object.keys(state.data).filter(function (k) { return k.indexOf('mb/') === 0; }).sort().pop();
        if (last) { var p = last.slice(3).split('-'); state.date = new Date(+p[0], +p[1] - 1, +p[2]); }
      }
      render(); });
})();
