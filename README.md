# HSK 3.0 — Nền tảng học tiếng Trung

Ứng dụng web học tiếng Trung dành cho người Việt, xây dựng theo định hướng HSK 3.0. Hệ thống kết hợp học từ vựng, luyện viết chữ Hán, ngữ pháp, ôn tập ngắt quãng, đọc hiểu, hội thoại, luyện thi và gia sư AI trong một sản phẩm duy nhất.

Ứng dụng: [hsk-app-sage.vercel.app](https://daln-hsk-app.vercel.app/)

## Tính năng chính

### Học từ vựng

- Từ vựng được chia theo cấp độ HSK và bài học.
- Flashcard tự động phát âm tiếng Trung.
- Đánh dấu `Thuộc` / `Chưa thuộc` và ưu tiên ôn lại từ chưa nhớ.
- Game chọn đáp án và điền chữ Hán theo nghĩa.
- Bài kiểm tra mở khóa nhóm bài tiếp theo.
- Lưu từ yêu thích và ghi chú trong Sổ tay.

### Ôn tập và tiến độ

- Lập lịch ôn theo thuật toán SM-2.
- Hiển thị từ đến hạn ôn và lịch sử phiên ôn.
- Thống kê số thẻ, điểm, chuỗi ngày học và tiến độ bài học.
- Tiến độ được lưu theo tài khoản trên PostgreSQL.
- Dữ liệu khi chưa đăng nhập được giữ trong `localStorage` và đồng bộ sau khi đăng nhập.

### Luyện viết chữ Hán

- Hiển thị thứ tự nét bằng Hanzi Writer.
- Chế độ tập viết tự động phát hoạt ảnh thứ tự nét.
- Chế độ kiểm tra chuyển thẳng sang tự viết và kiểm tra nét.

### Nội dung luyện tập mở rộng

- Từ vựng theo chủ đề với flashcard và câu hỏi kiểm tra.
- Bài đọc hiểu có pinyin, bản dịch, từ khóa và câu hỏi.
- Hội thoại theo tình huống, nghe từng câu và luyện phản xạ.
- Luyện phát âm Pinyin theo thanh điệu với âm thanh WAV chuẩn hóa.
- Đề luyện thi có đồng hồ, phiếu trả lời, chấm điểm và giải thích.
- Tiến độ của bốn module trên được đồng bộ theo tài khoản.

### Tra từ và Gia sư AI

- Tra cứu hơn 10.000 mục từ theo chữ Hán, pinyin, nghĩa tiếng Anh hoặc tiếng Việt.
- Lọc theo cấp HSK, xem từ loại, bộ thủ và nghe phát âm.
- Gia sư AI hỗ trợ dịch, giải thích, tạo ví dụ và phân tích ngữ pháp.
- Tự động thử model Gemini dự phòng khi model chính không khả dụng.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện và API | Next.js 14, React 18, TypeScript |
| CSS | Tailwind CSS |
| Cơ sở dữ liệu | PostgreSQL trên Neon |
| ORM | Prisma 5 |
| Xác thực | JWT trong cookie HttpOnly, bcryptjs |
| AI | Google Gemini API |
| Viết chữ Hán | Hanzi Writer |
| Icon | Lucide React |
| Triển khai | Vercel |

## Kiến trúc tổng thể

```text
Trình duyệt
├── Next.js pages và React components
├── localStorage (chế độ khách và bộ nhớ đệm)
└── Next.js API Routes
    ├── JWT authentication
    ├── Prisma ORM ──> Neon PostgreSQL
    └── Gemini API
```

```text
hsk-app/
├── frontend/
│   ├── app/                 # Trang và API Routes
│   ├── components/          # Component giao diện
│   ├── lib/                 # Auth, Prisma, dữ liệu và thuật toán
│   ├── public/data/         # Dữ liệu HSK và chỉ mục tra cứu
│   └── scripts/             # Xử lý, sinh và kiểm tra dữ liệu
├── backend/
│   └── prisma/
│       └── schema.prisma    # Schema PostgreSQL dùng chung
└── tests/                   # Kiểm thử cấp repository
```

`frontend` là ứng dụng chạy thực tế, đảm nhiệm cả giao diện lẫn backend qua Next.js Route Handlers. Thư mục `backend` hiện chứa schema Prisma và tiện ích cơ sở dữ liệu, không phải server cần chạy riêng.

## Các trang chính

| Đường dẫn | Chức năng |
| --- | --- |
| `/vocabulary` | Giáo trình và bài học từ vựng |
| `/review` | Ôn tập từ theo lịch SM-2 |
| `/writing` | Luyện viết chữ Hán |
| `/grammar` | Học và luyện ngữ pháp |
| `/search` | Tra từ điển |
| `/notebook` | Sổ tay cá nhân |
| `/topics` | Từ vựng theo chủ đề |
| `/reading` | Đọc hiểu |
| `/dialogues` | Hội thoại tình huống |
| `/pronunciation` | Luyện phát âm Pinyin và thanh điệu |
| `/exams` | Đề luyện thi |
| `/ai-tutor` | Gia sư AI |
| `/progress` | Tiến độ bài học |
| `/stats` | Thống kê ôn tập |

## Cài đặt local

Yêu cầu Node.js 18 trở lên, npm và một PostgreSQL database.

```bash
git clone https://github.com/HongNhung22905/hsk_app.git
cd hsk_app/hsk-app
npm install
cd frontend && npm install
cd ../backend && npm install
```

Tạo `hsk-app/frontend/.env.local` dựa trên `.env.local.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
NEXTAUTH_SECRET="mot-chuoi-bi-mat-dai-va-ngau-nhien"
GEMINI_API_KEY="google-gemini-api-key"
AI_DAILY_LIMIT="20"
```

- `DATABASE_URL`: chuỗi kết nối PostgreSQL, bắt buộc cho đăng nhập và lưu tiến độ.
- `NEXTAUTH_SECRET`: khóa ký JWT, bắt buộc trong production.
- `GEMINI_API_KEY`: bắt buộc nếu sử dụng Gia sư AI.
- `AI_DAILY_LIMIT`: giới hạn lượt gọi AI theo ngày, mặc định là `20`.
- `GEMINI_MODELS`: tùy chọn, danh sách model dự phòng phân cách bằng dấu phẩy.

Khởi tạo schema database:

```bash
cd hsk-app/backend
npx prisma db push
```

Chạy ứng dụng:

```bash
cd ../frontend
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Lệnh phát triển

Chạy trong `hsk-app/frontend`:

```bash
npm run dev             # Development server
npm run build           # Prisma generate và production build
npm run start           # Chạy production server đã build
npm run data:validate   # Kiểm tra dữ liệu học tập HSK 1 và HSK 2
npm run prisma:generate # Sinh và đồng bộ Prisma Client
npx tsc --noEmit        # Kiểm tra TypeScript
```

Chạy kiểm thử toàn repository trong `hsk-app`:

```bash
npm test
```

## API chính

| Nhóm | Endpoint |
| --- | --- |
| Xác thực | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Bài học | `GET/POST /api/progress/lesson`, `GET/POST /api/progress/gate` |
| Flashcard | `GET/POST /api/progress/flashcard`, `POST /api/progress/flashcard/bulk` |
| Module mới | `GET/POST /api/progress/modules` |
| Ngữ pháp | `GET/POST /api/progress/grammar` |
| Ôn tập | `GET /api/review`, `GET /api/review/history` |
| Sổ tay | `GET/POST /api/user/notebook` |
| Tra từ | `GET /api/search` |
| Gia sư AI | `POST /api/ai/translate`, `/explain`, `/examples`, `/grammar` |

Các endpoint dữ liệu cá nhân yêu cầu JWT hợp lệ trong cookie HttpOnly.

## Mô hình dữ liệu

- `User`: tài khoản người dùng.
- `LessonProgress`: bài từ vựng đã hoàn thành và điểm cao nhất.
- `FlashcardCard`: trạng thái SM-2 của từng từ.
- `GateResult`, `TestResult`, `GameResult`: kết quả kiểm tra và game.
- `NotebookEntry`: từ đã lưu và ghi chú cá nhân.
- `GrammarProgress`: điểm luyện ngữ pháp.
- `ReviewSession`: lịch sử phiên ôn tập.
- `WrongWord`: các từ người học thường trả lời sai.
- `ModuleProgress`: tiến độ chủ đề, đọc hiểu, hội thoại và luyện thi.
- `AiSession`: lịch sử yêu cầu AI khi được ghi nhận.

## Triển khai Vercel

1. Import repository `HongNhung22905/hsk_app`.
2. Đặt **Root Directory** là `hsk-app/frontend`.
3. Framework Preset chọn **Next.js**.
4. Build Command giữ mặc định `npm run build`.
5. Khai báo `DATABASE_URL`, `NEXTAUTH_SECRET`, `GEMINI_API_KEY` và tùy chọn `AI_DAILY_LIMIT`.
6. Trước khi deploy thay đổi schema, chạy `npx prisma db push` trong `hsk-app/backend` với đúng database production.

Không đặt Root Directory thành `frontend`, vì thư mục này nằm bên trong `hsk-app`.

## Nguồn dữ liệu và giấy phép

Dự án sử dụng dữ liệu từ [CC-CEDICT](https://www.mdbg.net/chinese/dictionary) và [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary). Hãy kiểm tra giấy phép của từng nguồn trước khi phân phối lại dữ liệu.

Mã nguồn dự án được phát hành theo giấy phép MIT.
