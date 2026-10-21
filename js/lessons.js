// Lessons following the progression of the Méthode Rose:
// right hand in C position → left hand & bass clef → alternating hands → hands together
// → 3/4, dotted notes, eighth notes, extending the hand, first sharp.
// Note syntax: PITCH:DURATION:FINGER  (e.g. C4:q:1, F#4:h, C3+G3:w, r:q for a rest)
// Durations: w=whole, h=half, q=quarter, e=eighth, add "." for dotted. Omitted duration = previous one.
(function (PR) {
  'use strict';

  const DUR = { w: 4, h: 2, q: 1, e: 0.5 };

  const PARTS = [
    { id: 1, title: 'Tay phải – vị trí Đô', desc: 'Khóa Son, năm ngón tay phải đặt trên Đô–Rê–Mi–Fa–Son.' },
    { id: 2, title: 'Tay trái – khóa Fa', desc: 'Đọc nốt trên khóa Fa, ngón 5 tay trái đặt trên Đô3.' },
    { id: 3, title: 'Hai tay luân phiên', desc: 'Khuông đôi: hai tay thay phiên nhau, như câu hỏi – câu đáp.' },
    { id: 4, title: 'Hai tay cùng lúc', desc: 'Tay trái giữ nốt dài, tay phải chơi giai điệu.' },
    { id: 5, title: 'Nhịp & mở rộng', desc: 'Nhịp 3/4, nốt chấm dôi, móc đơn, mở rộng tay và dấu thăng.' },
  ];

  const L = (o) => o;

  const LESSONS = [
    // ---------------- Part 1 ----------------
    L({
      id: 'p1-1', part: 1, title: 'Nốt Đô – ngón 1', tempo: 72, time: [4, 4],
      theory: `<p><b>Đô giữa</b> (C4) là nốt nằm ở giữa bàn phím, ngay bên trái nhóm <b>2 phím đen</b>. Trên khuông <b>khóa Son</b>, nó nằm trên một <b>dòng kẻ phụ</b> bên dưới.</p>
        <p>Đặt <b>ngón cái (ngón 1)</b> tay phải lên Đô giữa. Các ngón được đánh số: 1 = cái, 2 = trỏ, 3 = giữa, 4 = áp út, 5 = út.</p>
        <p><b>Nốt tròn</b> (rỗng, không đuôi) = 4 phách. <b>Nốt trắng</b> (rỗng, có đuôi) = 2 phách. Hãy đếm to "1 – 2 – 3 – 4".</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:w:1 | C4:w | C4:h C4:h | C4:h C4:h | C4:w' }],
    }),
    L({
      id: 'p1-2', part: 1, title: 'Đô – Rê', tempo: 72, time: [4, 4],
      theory: `<p><b>Rê</b> (D4) nằm ngay dưới dòng kẻ thứ nhất – ở <b>khe</b> dưới khuông. Chơi bằng <b>ngón 2</b>.</p>
        <p>Nốt đi lên trên khuông thì âm thanh đi lên, phím đàn đi sang <b>phải</b>.</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:w:1 | D4:w:2 | C4:h:1 D4:h:2 | C4:h D4:h | D4:h C4:h | D4:h C4:h | C4:w:1' }],
    }),
    L({
      id: 'p1-3', part: 1, title: 'Đô – Rê – Mi & nốt đen', tempo: 80, time: [4, 4],
      theory: `<p><b>Mi</b> (E4) nằm trên <b>dòng kẻ thứ nhất</b> (dòng dưới cùng) – <b>ngón 3</b>.</p>
        <p><b>Nốt đen</b> (đầu đặc, có đuôi) = <b>1 phách</b>. Trong nhịp 4/4, mỗi ô nhịp có 4 phách.</p>
        <p>Cuối bài là giai điệu dân gian "Hot Cross Buns".</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:q:1 D4:q:2 E4:h:3 | E4:q D4:q C4:h | E4:h:3 D4:h:2 | C4:w:1 | C4:q C4 C4 C4 | D4:q:2 D4 D4 D4 | E4:h:3 D4:h | C4:w:1' }],
    }),
    L({
      id: 'p1-4', part: 1, title: 'Fa, Son – đủ năm ngón', tempo: 84, time: [4, 4],
      theory: `<p><b>Fa</b> (F4) ở khe thứ nhất – <b>ngón 4</b>. <b>Son</b> (G4) ở dòng kẻ thứ hai – <b>ngón 5</b>. Khóa Son cuộn quanh chính dòng kẻ này.</p>
        <p>Đây là <b>vị trí Đô</b>: mỗi ngón một phím, không cần nhìn tay. Giữ cổ tay thả lỏng, ngón tay cong tròn như ôm quả bóng.</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1 | C4:q:1 E4:q:3 G4:h:5 | G4:q:5 E4:q:3 C4:h:1 | C4:q:1 D4 E4 F4 | G4:q:5 F4 E4 D4 | C4:w:1' }],
    }),
    L({
      id: 'p1-5', part: 1, title: 'Dấu lặng', tempo: 80, time: [4, 4],
      theory: `<p><b>Dấu lặng</b> là khoảng im lặng – vẫn đếm phách nhưng không chơi.</p>
        <p>Lặng đen = 1 phách (hình chữ chi), lặng trắng = 2 phách (khối nằm trên dòng giữa), lặng tròn = 4 phách (khối treo dưới dòng thứ 4).</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:q:1 r:q E4:q:3 r:q | G4:q:5 r:q E4:q:3 r:q | C4:h:1 r:h | D4:q:2 r:q F4:q:4 r:q | E4:q:3 r:q D4:q:2 r:q | C4:w:1' }],
    }),
    L({
      id: 'p1-6', part: 1, title: 'Au clair de la lune', tempo: 84, time: [4, 4],
      theory: `<p>Bài hát dân ca Pháp nổi tiếng – một trong những bài đầu tiên của Méthode Rose. Chỉ dùng 3 nốt <b>Đô – Rê – Mi</b>.</p>
        <p>Hãy hát theo tên nốt khi chơi: "Đô Đô Đô Rê | Mi – Rê –".</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:q:1 C4 C4 D4:q:2 | E4:h:3 D4:h:2 | C4:q:1 E4:q:3 D4:q:2 D4:q | C4:w:1 | C4:q:1 C4 C4 D4:q:2 | E4:h:3 D4:h:2 | C4:q:1 E4:q:3 D4:q:2 D4:q | C4:w:1' }],
    }),
    L({
      id: 'p1-7', part: 1, title: 'Mary có chú cừu non', tempo: 92, time: [4, 4],
      theory: `<p>Giai điệu bắt đầu từ <b>Mi (ngón 3)</b>. Chú ý ô nhịp 4 nhảy lên <b>Son (ngón 5)</b>.</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'E4:q:3 D4:q:2 C4:q:1 D4:q:2 | E4:q E4 E4:h | D4:q:2 D4 D4:h | E4:q:3 G4:q:5 G4:h | E4:q:3 D4:q:2 C4:q:1 D4:q:2 | E4:q E4 E4 E4 | D4:q:2 D4 E4:q:3 D4:q:2 | C4:w:1' }],
    }),
    L({
      id: 'p1-8', part: 1, title: 'Khúc hoan ca (giản lược)', tempo: 92, time: [4, 4],
      theory: `<p>Giai điệu <b>"Ode to Joy"</b> của Beethoven, dùng đủ 5 ngón. Đi từng bậc liền nhau – rất tốt để luyện ngón tay đều.</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | E4:h:3 D4:h:2 | E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | D4:h:2 C4:h:1' }],
    }),

    // ---------------- Part 2 ----------------
    L({
      id: 'p2-1', part: 2, title: 'Khóa Fa – Đô tay trái', tempo: 72, time: [4, 4],
      theory: `<p><b>Khóa Fa</b> dùng cho tay trái. Hai chấm của khóa kẹp <b>dòng kẻ thứ 4</b> – đó là nốt <b>Fa</b> (F3).</p>
        <p><b>Đô</b> (C3) nằm ở <b>khe thứ hai</b> – thấp hơn Đô giữa một quãng tám. Đặt <b>ngón 5 (ngón út)</b> tay trái lên Đô3.</p>
        <p>Ở tay trái, số ngón ngược lại: ngón 5 ở bên trái, ngón 1 (cái) ở bên phải.</p>`,
      voices: [{ hand: 'L', clef: 'bass', notes: 'C3:w:5 | D3:w:4 | E3:w:3 | D3:w:4 | C3:h:5 D3:h:4 | E3:h:3 D3:h:4 | C3:w:5' }],
    }),
    L({
      id: 'p2-2', part: 2, title: 'Năm nốt tay trái', tempo: 80, time: [4, 4],
      theory: `<p>Tay trái ở <b>vị trí Đô</b>: Đô (5) – Rê (4) – Mi (3) – Fa (2) – Son (1).</p>
        <p>Son3 nằm ở khe trên cùng của khóa Fa – ngón cái.</p>`,
      voices: [{ hand: 'L', clef: 'bass', notes: 'C3:q:5 D3:q:4 E3:q:3 F3:q:2 | G3:w:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:w:5 | G3:q:1 E3:q:3 C3:h:5 | C3:q:5 E3:q:3 G3:h:1 | G3:q:1 F3 E3 D3 | C3:w:5' }],
    }),
    L({
      id: 'p2-3', part: 2, title: 'Kìa con bướm vàng', tempo: 96, time: [4, 4],
      theory: `<p>Giai điệu quen thuộc (Frère Jacques) bằng <b>tay trái</b>. Chú ý ngón 3 và ngón 1 khi chơi "Mi – Fa – Son".</p>`,
      voices: [{ hand: 'L', clef: 'bass', notes: 'C3:q:5 D3:q:4 E3:q:3 C3:q:5 | C3:q:5 D3:q:4 E3:q:3 C3:q:5 | E3:q:3 F3:q:2 G3:h:1 | E3:q:3 F3:q:2 G3:h:1 | E3:q:3 D3:q:4 C3:h:5 | C3:w:5' }],
    }),

    // ---------------- Part 3 ----------------
    L({
      id: 'p3-1', part: 3, title: 'Hỏi – Đáp', tempo: 84, time: [4, 4],
      theory: `<p><b>Khuông đôi</b>: khóa Son ở trên cho tay phải, khóa Fa ở dưới cho tay trái, nối bằng dấu ngoặc.</p>
        <p>Tay phải "hỏi", tay trái "đáp". Khi một tay chơi, tay kia nghỉ (dấu lặng tròn) nhưng vẫn để sẵn trên phím.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | r:w | r:w | E4:q:3 F4:q:4 G4:h:5 | C4:w:1 | r:w | r:w' },
        { hand: 'L', clef: 'bass', notes: 'r:w | r:w | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:w:5 | r:w | r:w | G3:q:1 E3:q:3 D3:q:4 G3:q:1 | C3:w:5' },
      ],
    }),
    L({
      id: 'p3-2', part: 3, title: 'Au clair de la lune – hai tay', tempo: 84, time: [4, 4],
      theory: `<p>Câu đầu chơi bằng tay phải, câu sau lặp lại thấp hơn một quãng tám bằng tay trái. Hai tay dùng cùng tên nốt nhưng <b>khác ngón</b>.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'C4:q:1 C4 C4 D4:q:2 | E4:h:3 D4:h:2 | C4:q:1 E4:q:3 D4:q:2 D4:q | C4:w:1 | r:w | r:w | r:w | r:w' },
        { hand: 'L', clef: 'bass', notes: 'r:w | r:w | r:w | r:w | C3:q:5 C3 C3 D3:q:4 | E3:h:3 D3:h:4 | C3:q:5 E3:q:3 D3:q:4 D3:q | C3:w:5' },
      ],
    }),

    // ---------------- Part 4 ----------------
    L({
      id: 'p4-1', part: 4, title: 'Tay trái giữ nốt tròn', tempo: 76, time: [4, 4],
      theory: `<p>Lần đầu <b>hai tay cùng lúc</b>! Tay trái nhấn nốt tròn cùng lúc với nốt đầu tiên của tay phải, rồi <b>giữ</b> suốt 4 phách.</p>
        <p>Mẹo: luyện từng tay trước (chọn "Tay phải" hoặc "Tay trái"), máy sẽ chơi tay còn lại.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1' },
        { hand: 'L', clef: 'bass', notes: 'C3:w:5 | E3:w:3 | G3:w:1 | C3:w:5' },
      ],
    }),
    L({
      id: 'p4-2', part: 4, title: 'Mary – hai tay', tempo: 84, time: [4, 4],
      theory: `<p>Giai điệu tay phải như bài trước, tay trái đệm bằng <b>Đô</b> (ngón 5) và <b>Son</b> (ngón 1).</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'E4:q:3 D4:q:2 C4:q:1 D4:q:2 | E4:q E4 E4:h | D4:q:2 D4 D4:h | E4:q:3 G4:q:5 G4:h | E4:q:3 D4:q:2 C4:q:1 D4:q:2 | E4:q E4 E4 E4 | D4:q:2 D4 E4:q:3 D4:q:2 | C4:w:1' },
        { hand: 'L', clef: 'bass', notes: 'C3:w:5 | C3:w | G3:w:1 | C3:w:5 | C3:w | C3:w | G3:w:1 | C3:w:5' },
      ],
    }),
    L({
      id: 'p4-3', part: 4, title: 'Khúc hoan ca – hai tay', tempo: 84, time: [4, 4],
      theory: `<p>Tay trái luân phiên <b>Đô</b> và <b>Son</b> – hai nốt nền của giọng Đô trưởng (chủ âm và át âm).</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | E4:h:3 D4:h:2 | E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | D4:h:2 C4:h:1' },
        { hand: 'L', clef: 'bass', notes: 'C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:h:1 C3:h:5' },
      ],
    }),

    // ---------------- Part 5 ----------------
    L({
      id: 'p5-1', part: 5, title: 'Nhịp 3/4 & nốt trắng chấm dôi', tempo: 96, time: [3, 4],
      theory: `<p><b>Nhịp 3/4</b>: mỗi ô nhịp có 3 phách – nhịp của điệu valse "MẠNH – nhẹ – nhẹ".</p>
        <p><b>Dấu chấm dôi</b> làm nốt dài thêm một nửa: nốt trắng chấm dôi = 2 + 1 = <b>3 phách</b>.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'C4:q:1 D4:q:2 E4:q:3 | F4:q:4 E4:q:3 D4:q:2 | C4:h.:1 | E4:q:3 F4:q:4 G4:q:5 | G4:h.:5 | G4:q:5 F4:q:4 E4:q:3 | D4:q:2 E4:q:3 D4:q:2 | C4:h.:1' },
        { hand: 'L', clef: 'bass', notes: 'C3:h.:5 | G3:h.:1 | C3:h.:5 | C3:h.:5 | E3:h.:3 | C3:h.:5 | G3:h.:1 | C3:h.:5' },
      ],
    }),
    L({
      id: 'p5-2', part: 5, title: 'Móc đơn (nốt 1/8)', tempo: 72, time: [4, 4],
      theory: `<p><b>Móc đơn</b> (nốt đen có cờ) = <b>nửa phách</b>. Hai móc đơn = một nốt đen. Đếm "1 và 2 và…".</p>
        <p>Hãy chơi đều, nhẹ, nhanh gấp đôi nốt đen.</p>`,
      voices: [{ hand: 'R', clef: 'treble', notes: 'C4:e:1 D4:e:2 E4:e:3 F4:e:4 G4:h:5 | G4:e:5 F4:e:4 E4:e:3 D4:e:2 C4:h:1 | C4:e:1 E4:e:3 G4:e:5 E4:e:3 C4:h:1 | E4:q:3 D4:e:2 D4:e C4:h:1 | C4:e:1 D4 E4 F4 G4 F4 E4 D4 | C4:w:1' }],
    }),
    L({
      id: 'p5-3', part: 5, title: 'Nốt đen chấm dôi – Khúc hoan ca', tempo: 88, time: [4, 4],
      theory: `<p><b>Nốt đen chấm dôi</b> = 1½ phách, thường đi kèm một móc đơn (½ phách) để đủ 2 phách.</p>
        <p>Đây là nhịp điệu nguyên bản của "Ode to Joy" ở cuối mỗi câu.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | E4:q.:3 D4:e:2 D4:h | E4:q:3 E4 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4 D4:q:2 E4:q:3 | D4:q.:2 C4:e:1 C4:h' },
        { hand: 'L', clef: 'bass', notes: 'C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:h:1 C3:h:5' },
      ],
    }),
    L({
      id: 'p5-4', part: 5, title: 'Nốt La – Ngôi sao lấp lánh', tempo: 92, time: [4, 4],
      theory: `<p><b>La</b> (A4) nằm ở khe thứ hai khóa Son. Để với tới La, ngón 5 duỗi ra; ở câu giữa tay dịch lên một phím (ngón 1 trên Rê).</p>
        <p>Theo dõi số ngón tay ghi trên nốt nhạc!</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'C4:q:1 C4 G4:q:4 G4 | A4:q:5 A4 G4:h:4 | F4:q:4 F4 E4:q:3 E4 | D4:q:2 D4 C4:h:1 | G4:q:4 G4 F4:q:3 F4 | E4:q:2 E4 D4:h:1 | G4:q:4 G4 F4:q:3 F4 | E4:q:2 E4 D4:h:1 | C4:q:1 C4 G4:q:4 G4 | A4:q:5 A4 G4:h:4 | F4:q:4 F4 E4:q:3 E4 | D4:q:2 D4 C4:h:1' },
        { hand: 'L', clef: 'bass', notes: 'C3:w:5 | F3:h:2 C3:h:5 | F3:h:2 C3:h:5 | G3:h:1 C3:h:5 | C3:h:5 F3:h:2 | C3:h:5 G3:h:1 | C3:h:5 F3:h:2 | C3:h:5 G3:h:1 | C3:w:5 | F3:h:2 C3:h:5 | F3:h:2 C3:h:5 | G3:h:1 C3:h:5' },
      ],
    }),
    L({
      id: 'p5-5', part: 5, title: 'Dấu thăng – Fa♯', tempo: 84, time: [4, 4],
      theory: `<p><b>Dấu thăng (♯)</b> nâng nốt lên nửa cung – chơi phím <b>ngay bên phải</b>, thường là phím đen.</p>
        <p>Vị trí <b>Rê</b>: ngón 1 tay phải trên Rê4, ngón 3 trên <b>Fa♯</b> (phím đen). Tay trái: ngón 5 trên Rê3, ngón 1 trên La3.</p>`,
      voices: [
        { hand: 'R', clef: 'treble', notes: 'D4:q:1 E4:q:2 F#4:q:3 G4:q:4 | A4:w:5 | A4:q:5 G4:q:4 F#4:q:3 E4:q:2 | D4:w:1 | F#4:q:3 E4:q:2 F#4:q:3 G4:q:4 | A4:h:5 F#4:h:3 | E4:q:2 G4:q:4 F#4:q:3 E4:q:2 | D4:w:1' },
        { hand: 'L', clef: 'bass', notes: 'D3:w:5 | A3:w:1 | A3:w:1 | D3:w:5 | D3:w:5 | D3:w:5 | A3:w:1 | D3:w:5' },
      ],
    }),
  ];

  function buildScore(lesson) {
    const notes = [];
    const staves = [];
    let total = 0;
    lesson.voices.forEach((v, vi) => {
      if (!staves.includes(v.clef)) staves.push(v.clef);
      let t = 0, last = 'q', idx = 0;
      v.notes.trim().split(/\s+/).forEach((tok) => {
        if (tok === '|') return;
        const [p, d, f] = tok.split(':');
        const code = d || last;
        last = code;
        const dotted = code.endsWith('.');
        const base = code.replace('.', '');
        const beats = DUR[base] * (dotted ? 1.5 : 1);
        const rest = p === 'r';
        notes.push({
          id: `v${vi}_${idx++}`, voice: vi, hand: v.hand, staff: v.clef, rest,
          keys: rest ? [] : p.split('+').map(PR.Notes.parsePitch),
          base, dotted, beats, start: t, finger: f || '',
        });
        t += beats;
      });
      total = Math.max(total, t);
    });
    staves.sort((a, b) => (a === 'treble' ? 0 : 1) - (b === 'treble' ? 0 : 1));
    return { notes, staves, total, timeSig: lesson.time || [4, 4] };
  }

  PR.PARTS = PARTS;
  PR.LESSONS = LESSONS;
  PR.buildScore = buildScore;
})(window.PR);
