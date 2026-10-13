# Phân công frontend và backend

Hai người cùng phụ trách frontend và backend. Phân công được cân lại theo phần mã và trách nhiệm chức năng; tài nguyên audio và dữ liệu tĩnh không được tính thành số file code tự viết.

| Người | Frontend | Backend/API và dữ liệu/hạ tầng |
| --- | --- | --- |
| `nhung220` | Từ vựng, Ngữ pháp, Đọc hiểu, Hội thoại, Chủ đề, Sổ tay, Tìm kiếm; component vocabulary/grammar/ui, trừ các ngoại lệ Viết và Kiểm tra từ vựng bên dưới | API search, notebook, user/notebook, progress/grammar, progress/lesson, progress/modules; thư viện dữ liệu, làm sạch dữ liệu HSK, script dữ liệu và seed |
| `buiquanghuy2005` | Đăng nhập/Đăng ký, Ôn tập, Thi, Tiến độ/Thống kê, AI Tutor, Viết, Pinyin; component auth/review/learning/stats/ai/pronunciation; thêm component và route Viết/Kiểm tra từ vựng bên dưới | API auth, user (trừ user/notebook), review, progress/flashcard, progress/gate, ai; auth middleware, Prisma schema/migration/client, Neon, audio, env example, deploy và kiểm thử |

Đường dẫn thực tế đều có tiền tố `hsk-app/`, trừ dữ liệu nguồn `data/` ở gốc repo.

## Các phần chuyển sang Huy phụ trách

- `hsk-app/frontend/app/vocabulary/test/[setId]/page.tsx`
- `hsk-app/frontend/app/vocabulary/writing/[lessonId]/page.tsx`
- `hsk-app/frontend/components/vocabulary/TestClient.tsx`
- `hsk-app/frontend/components/vocabulary/WritingClient.tsx`
- `hsk-app/frontend/components/vocabulary/WritingListClient.tsx`

Toàn bộ route trong `app/vocabulary/writing/` và `app/vocabulary/test/` do Huy phụ trách. Các file giữ nguyên đường dẫn và nội dung; thay đổi này phân chia trách nhiệm bảo trì, không viết lại tác giả các commit trước đó.

## Đối chiếu lượng mã tại thời điểm phân chia

| Người | File mã nguồn | Dòng mã | Tỷ lệ dòng mã |
| --- | ---: | ---: | ---: |
| `nhung220` | 51 | 6,773 | 48.9% |
| `buiquanghuy2005` | 50 | 7,079 | 51.1% |

Chỉ tính `.ts`, `.tsx`, `.js`, `.mjs`, `.prisma` từ bản nguồn đã phân chia. Đây là số liệu tham khảo; công sức thực tế còn phụ thuộc độ khó. Nhung phụ trách nội dung và xử lý dữ liệu, Huy phụ trách xác thực, AI, database, deploy và kiểm thử.

## File dùng chung

Layout, trang chủ/navigation, CSS, cấu hình package/build, types và tiện ích tiến độ dùng chung thuộc cả hai. Người cần sửa tạo branch riêng, người còn lại review trước khi merge. `.github/CODEOWNERS` ghi các thư mục phụ trách và ngoại lệ để GitHub xác định người review; nó không tự bật branch protection.

23 file dùng chung trong gói `shared` chưa được đưa vào commit phần riêng của hai người. Sau khi merge nhánh Huy, cần import các file dùng chung qua branch riêng và review trước khi merge để hoàn thiện cấu trúc chạy/build của ứng dụng.
