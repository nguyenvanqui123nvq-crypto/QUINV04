// Tải kết quả từ api.383.im và ghi vào data/results.json (chạy: node scripts/update.js)
// Nguồn: https://383.im/ - điều khoản: https://383.im/terms-of-service/
const fs = require('fs'), path = require('path');

const BASE = 'https://api.383.im/lottery/region/';
const KEEP_DAYS = 120;
const OUT = path.join(__dirname, '..', 'data', 'results.json');

const MB_ORDER = ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];
const MI_ORDER = ['g8', 'g7', 'g6', 'g5', 'g4', 'g3', 'g2', 'g1', 'db'];

// Tên hiển thị của các đài (khớp với lịch trong js/app.js)
const NAMES = [
  'TP. Hồ Chí Minh', 'Đồng Tháp', 'Cà Mau', 'Bến Tre', 'Vũng Tàu', 'Bạc Liêu', 'Đồng Nai', 'Cần Thơ', 'Sóc Trăng',
  'Tây Ninh', 'An Giang', 'Bình Thuận', 'Vĩnh Long', 'Bình Dương', 'Trà Vinh', 'Long An', 'Bình Phước', 'Hậu Giang',
  'Tiền Giang', 'Kiên Giang', 'Đà Lạt', 'Phú Yên', 'Thừa Thiên Huế', 'Đắk Lắk', 'Quảng Nam', 'Đà Nẵng', 'Khánh Hòa',
  'Bình Định', 'Quảng Trị', 'Quảng Bình', 'Gia Lai', 'Ninh Thuận', 'Quảng Ngãi', 'Đắk Nông', 'Kon Tum'
];
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const BY_SLUG = {};
NAMES.forEach(n => { BY_SLUG[slug(n)] = n; });
Object.assign(BY_SLUG, { 'tp-hcm': 'TP. Hồ Chí Minh', 'hcm': 'TP. Hồ Chí Minh', 'hue': 'Thừa Thiên Huế', 'tt-hue': 'Thừa Thiên Huế', 'ba-ria-vung-tau': 'Vũng Tàu', 'vung-tau': 'Vũng Tàu', 'da-lat': 'Đà Lạt', 'lam-dong': 'Đà Lạt' });

const unknown = new Set();
const nameOf = id => BY_SLUG[id] || (unknown.add(id), id);

async function get(region) {
  const r = await fetch(BASE + region + '.json', { headers: { 'User-Agent': 'xoso-static-site/1.0' } });
  if (!r.ok) throw new Error(region + ': HTTP ' + r.status);
  return r.json();
}

(async () => {
  let old = {};
  try { old = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* chưa có file */ }
  const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
  const out = {};
  // giữ dữ liệu cũ còn trong hạn
  Object.keys(old).forEach(k => { const d = k.split('/')[1]; if (d >= cutoff) out[k] = old[k]; });

  let count = 0;
  for (const region of ['mb', 'mt', 'mn']) {
    let j;
    try { j = await get(region); } catch (e) { console.warn('Bỏ qua', e.message); continue; }
    for (const it of j.items || []) {
      if (!it.d || it.d < cutoff) continue;
      if (region === 'mb') {
        const pr = it.pr || {};
        if (!pr.db) continue;
        out['mb/' + it.d] = MB_ORDER.map(k => pr[k] || []); count++;
      } else {
        for (const p of it.ps || []) {
          const g = p.g || {};
          if (!g.db || !g.db.length) continue;
          out[region + '/' + it.d + '/' + nameOf(p.i)] = MI_ORDER.map(k => g[k] || []); count++;
        }
      }
    }
  }
  if (!count) throw new Error('Không lấy được dữ liệu nào, giữ nguyên file cũ.');
  const sorted = {}; Object.keys(out).sort().forEach(k => { sorted[k] = out[k]; });
  fs.writeFileSync(OUT, JSON.stringify(sorted));
  console.log('Đã ghi', Object.keys(sorted).length, 'mục (mới/cập nhật:', count + ')');
  if (unknown.size) console.warn('Đài chưa có trong bảng tên:', [...unknown].join(', '));
})().catch(e => { console.error(e); process.exit(1); });
