# Xổ số 3 miền (website tĩnh)

Trang kết quả xổ số kiểu minhngoc.net.vn: Miền Bắc / Trung / Nam, chọn ngày, bảng loto, dò vé, lịch mở thưởng.
Chỉ gồm HTML + CSS + JS thuần, không cần build hay máy chủ PHP.

> Dữ liệu mặc định là **giả lập** (sinh ngẫu nhiên cố định theo ngày). Không phải kết quả thật.

## Chạy thử trên máy
Mở thư mục này bằng VS Code + Live Server, hoặc:
```
python -m http.server 8080
```
rồi vào http://localhost:8080 (cần chạy qua http để nạp `data/results.json`).

## Dùng dữ liệu thật
Điền `data/results.json`. Khóa và thứ tự giải (mảng các mảng):

- Miền Bắc: `"mb/2026-10-18"` → `[ĐB, G1, G2, G3, G4, G5, G6, G7]`
  ```json
  { "mb/2026-10-18": [["12345"],["11111"],["22222","33333"],["...6 số"],["...4 số"],["...6 số"],["...3 số"],["...4 số"]] }
  ```
- Miền Trung/Nam: `"mn/2026-10-18/TP. Hồ Chí Minh"` (hoặc `mt/...`) → `[G8, G7, G6, G5, G4, G3, G2, G1, ĐB]`

Ngày/đài không có trong file sẽ dùng dữ liệu giả lập.

## Đưa lên GitHub
```
git init
git add .
git commit -m "Website xo so 3 mien"
git branch -M main
git remote add origin https://github.com/<ten-ban>/<ten-repo>.git
git push -u origin main
```
Bật hosting miễn phí: repo → Settings → Pages → Branch `main` / `(root)`.

## Đưa lên Hostinger
Cách 1 (nhanh): hPanel → Websites → File Manager → vào `public_html` → upload toàn bộ nội dung thư mục này (kể cả `.htaccess`).
Cách 2: hPanel → Advanced → Git → nối repo GitHub, đặt thư mục đích `public_html`, bấm Deploy; bật Auto-deployment để mỗi lần push tự cập nhật.

Sau khi cài SSL, bỏ dấu `#` ở đoạn ép HTTPS trong `.htaccess`.
