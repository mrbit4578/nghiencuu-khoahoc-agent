# Phân nhóm thư viện kỹ năng

Toàn bộ 177 kỹ năng có đúng một nhóm chính, được rà soát theo đối tượng nghiên cứu và chức năng nêu trong SKILL.md. Nhóm liên ngành là nhãn bổ sung, không cộng thêm vào tổng 177. Đây là hệ thống điều hướng, không phải đánh giá chất lượng khoa học.

| Khối | Nhóm | Kỹ năng chính |
| --- | --- | ---: |
| Khoa học tự nhiên | Hóa học & vật liệu | 14 |
| Khoa học tự nhiên | Sinh học & công nghệ sinh học | 49 |
| Khoa học tự nhiên | Vật lý & thiên văn học | 7 |
| Khoa học tự nhiên | Trái Đất, môi trường & địa lý | 3 |
| Y dược & sức khỏe | Y học & dược học | 15 |
| Toán, tính toán & kỹ thuật | Toán học & thống kê | 10 |
| Toán, tính toán & kỹ thuật | Khoa học dữ liệu & AI | 16 |
| Toán, tính toán & kỹ thuật | Kỹ thuật & mô phỏng | 4 |
| Kinh tế & khoa học xã hội | Kinh tế & khoa học xã hội | 2 |
| Hỗ trợ nghiên cứu liên ngành | Phương pháp & đánh giá nghiên cứu | 14 |
| Hỗ trợ nghiên cứu liên ngành | Tài liệu & công bố khoa học | 21 |
| Hỗ trợ nghiên cứu liên ngành | Hạ tầng dữ liệu & phòng thí nghiệm | 22 |

Khoa học tự nhiên là khối cha của Hóa học, Sinh học, Vật lý và Trái Đất; không dùng như một nhóm ngang hàng để tránh chồng chéo. Công cụ tổng quát được phân theo chức năng chính. Ví dụ Astropy thuộc Vật lý & thiên văn học; COBRApy thuộc Sinh học hệ thống, có nhãn Hóa học và Toán; Zarr thuộc Hạ tầng dữ liệu, có nhãn Khoa học dữ liệu.

Trên giao diện, chọn khối hoặc nhóm để xem kỹ năng. Bật “Bao gồm kỹ năng liên ngành” để lấy thêm các kỹ năng có nhãn liên quan. Kết quả vẫn hiển thị theo nhóm chính, không lặp kỹ năng. Mở “Phân loại” trên thẻ để đọc giải thích và nhảy sang nhóm liên quan. Số trên các ô nhóm luôn là tổng kỹ năng chính của thư viện; số kết quả bên dưới phản ánh bộ lọc hiện tại.

## Bảo trì

Nguồn phân loại: [data/science-taxonomy.json](../data/science-taxonomy.json). Nhãn lĩnh vực gốc được giữ ở sourceCategory; tài liệu và mã upstream giữ nguyên từng byte. Khi thêm kỹ năng, phải rà soát rồi gán nhóm rõ ràng: build sẽ dừng nếu thiếu phân loại, trùng nhóm chính, có ID lạ hoặc nhãn liên ngành không hợp lệ.

Chạy npm run catalog, npm test và npm run build để kiểm tra dữ liệu và giao diện. Bộ test kiểm tra độ bao phủ, tổng số, các trường hợp dễ nhầm và tổ hợp tìm kiếm/nhóm/khối/liên ngành/yêu thích.

## Chọn hàng loạt cho trợ lý

- “Chọn toàn bộ thư viện” chọn đủ 177 kỹ năng, độc lập với bộ lọc.
- “Chọn tất cả kết quả” chỉ chọn các kỹ năng đang phù hợp bộ lọc.
- “Chọn toàn nhóm” chọn đủ kỹ năng chính của nhóm đó, kể cả khi đang tìm kiếm một phần nhóm.
- Bỏ tick một phạm vi chỉ bỏ các kỹ năng trong phạm vi đó; kỹ năng đã chọn ở nhóm khác vẫn giữ. Ô tick hiển thị trạng thái chọn một phần. “Bỏ chọn hết” xóa toàn bộ lựa chọn.

Giao diện và API không còn giới hạn 4. API kiểm tra mọi ID theo danh mục và gửi một mục ngữ cảnh cho từng kỹ năng đã chọn. Tổng SKILL.md của thư viện khoảng 2,47 triệu ký tự, nên tài liệu được chia ngân sách đều và trích gọn khi cần. Mặc định tổng ngữ cảnh kỹ năng tối đa 180.000 ký tự (không phải token), chưa gồm hội thoại và quy tắc hệ thống; có thể điều chỉnh AI_CONTEXT_MAX_CHARS trong khoảng 64.000–800.000 tùy model và chi phí. Tài liệu ngắn đủ dung lượng được giữ nguyên. Không tự loại bớt kỹ năng xuống 4, không ngầm thực thi script hoặc nạp toàn bộ file tham khảo. Giao diện báo số kỹ năng thực tế đã gửi và số SKILL.md trích gọn ở lần trả lời gần nhất.
