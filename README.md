# Piano Rose 🌹

Ứng dụng web học piano theo trình tự **Méthode Rose** – không cần cài đặt, không cần build.

## Chạy

Mở `index.html` bằng Chrome/Edge, hoặc chạy server tĩnh:

```bash
python -m http.server 5173 --directory piano-rose
```

rồi vào http://localhost:5173.

## Tính năng

- **21 bài học, 5 phần**: tay phải vị trí Đô → tay trái khóa Fa → hai tay luân phiên → hai tay cùng lúc → nhịp 3/4, chấm dôi, móc đơn, nốt La, dấu thăng.
- **3 chế độ luyện**: *Chờ nốt* (con trỏ đợi bạn chơi đúng), *Theo nhịp* (chấm điểm theo thời gian, có đếm nhịp), *Nghe mẫu*.
  Luyện từng tay – máy tự đệm tay còn lại. Chọn tốc độ, bật/tắt máy đếm nhịp. Sao & tiến độ được lưu trong trình duyệt.
- **Chơi tự do**: 37–88 phím, hiện tên nốt & nhận diện hợp âm, khuông nhạc ghi lại nốt vừa chơi, pedal, máy đếm nhịp, ghi âm / phát lại / xuất file `.mid`.
- **Luyện đọc nốt**: khóa Son / khóa Fa / cả hai, 4 mức độ.

## Nhập liệu

- **Đàn MIDI (USB)**: Web MIDI – Chrome, Edge, Opera (Firefox cần cho phép). Hỗ trợ lực nhấn và pedal sustain (CC64).
- **Bàn phím máy tính**: `Z S X D C V G B H N J M` = Đô3–Si3, `Q 2 W 3 E R 5 T 6 Y 7 U I` = Đô4–Đô5; `←/→` đổi quãng tám; `Space` = pedal.
- **Chuột / cảm ứng** trên phím đàn ảo.

Âm thanh piano thật (Salamander Grand Piano) được tải từ `tonejs.github.io`; khi offline sẽ dùng piano tổng hợp.

## Cấu trúc

| File | Vai trò |
|---|---|
| `js/core.js` | cài đặt, tiến độ, tên nốt, modal/toast |
| `js/audio.js` | sampler piano + synth dự phòng, máy đếm nhịp |
| `js/input.js` | Web MIDI, bàn phím máy tính |
| `js/piano.js` | phím đàn trên màn hình |
| `js/staff.js` | vẽ khuông nhạc SVG |
| `js/lessons.js` | dữ liệu bài học (cú pháp `C4:q:1` = nốt:trường độ:ngón) |
| `js/lesson.js`, `js/freeplay.js`, `js/drill.js` | các màn hình |
| `js/app.js` | điều hướng, trang chủ, cài đặt |
