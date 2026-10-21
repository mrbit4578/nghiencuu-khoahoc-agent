# Audit tổng thể · 21/10/2026

## Kết luận

ZIP đầu vào là **bộ hướng dẫn và công cụ cho AI agent**, chưa phải ứng dụng web độc lập. Cấu trúc có 177 kỹ năng, tài liệu tham khảo, script Python, dữ liệu mẫu, bộ test và hình minh họa. Không có sẵn frontend, backend web, cơ chế tài khoản hoặc cấu hình Vercel.

Ứng dụng Research Agent bổ sung lớp web có các chức năng tra cứu, đọc/tải nguồn, nghiên cứu tài liệu, dự án, công cụ dữ liệu và trợ lý AI có điều kiện cấu hình. **Chưa thể coi là toàn bộ 177 pipeline khoa học chạy online.** Phần executor khoa học, GPU/HPC, tích hợp robot và tất cả dịch vụ chuyên dụng chưa được xây/triển khai.

## Kiểm kê toàn bộ

| Nội dung | Số lượng |
| --- | ---: |
| File trong ZIP, không tính thư mục | 2.780 |
| Tổng byte giải nén | 290.891.864 |
| File giải mã được UTF-8 | 2.580 |
| File nhị phân | 200 |
| Markdown | 1.538 |
| Python | 771 |
| Kỹ năng | 177 |

SHA-256 ZIP: `1b1b0835a8efa5fb862be42f935bfbaf01c04bd489eb3f4960249591f8398a45`.

Commit nguồn được tìm trong ZIP comment: `593377bb048752abb0152deab9fbb1083a6087df`. Đã đối chiếu với commit public của K-Dense-AI và tải lại độc lập từ codeload; toàn bộ 2.780 hash khớp manifest gốc.

Bộ dựng khôi phục quyền thực thi cho **44 file executable** được ghi trong metadata ZIP, gồm cả ba shell script. Trên POSIX, việc chỉ ghi bytes mà không khôi phục executable bit sẽ làm bộ kiểm tra cấu trúc upstream từ chối các shell script, dù SHA-256 đúng. Danh sách executable được khóa trong `upstream.lock.json`; không sửa nội dung nguồn để xử lý vấn đề đóng gói này.

- `audit/manifest.json`: từng đường dẫn, byte, CRC32, SHA-256 và các phép kiểm đã thực hiện.
- `audit/manifest.csv`: danh mục rút gọn để đối chiếu.
- `audit/summary.json`: tổng hợp số lượng và phạm vi.
- `audit/findings.json`: ứng viên cảnh báo thô, giữ nguyên để truy vết.
- `audit/triage.json`: phân loại từng ứng viên và dữ liệu scanner upstream.
- `audit/text-index.json`: chỉ mục văn bản cục bộ; không đưa lên Git để tránh lặp dữ liệu.

## Cách đọc và giới hạn của audit

Đã mở và đọc toàn bộ byte của **mọi file**, xác minh CRC khi giải nén, tính SHA-256, giải mã toàn bộ văn bản UTF-8 và phân tích tĩnh theo loại file. Mọi Python được parse bằng AST; mọi JSON được parse; hình ảnh được kiểm tra cấu trúc bằng Pillow; gzip được giải nén để kiểm tra tính toàn vẹn. Không chạy mã upstream trong quá trình kiểm kê.

Đây là **kiểm kê và audit tĩnh có công cụ**, kèm xem xét kiến trúc, quy tắc repository, danh mục 177 kỹ năng, scanner/triage và các điểm cảnh báo. Không tuyên bố chuyên gia đã đọc hiểu thủ công từng dòng của 2.580 file văn bản hoặc xem bằng mắt từng ảnh. File khoa học nhị phân chuyên dụng như FCS/FID được đọc/hash nhưng chưa phân tích ngữ nghĩa bằng công cụ chuyên ngành. Kết quả khoa học và môi trường chạy của mỗi package vẫn cần kiểm định riêng.

## Phát hiện

### P1 — Không thể cài tất cả thư viện trong một môi trường

`AGENTS.md` nguồn gốc ghi rõ numpy, transformers, zarr, lxml và phiên bản Python có xung đột giữa các kỹ năng. Một số cần MATLAB, Java, CUDA hoặc conda-forge. Vì thế không gộp 771 file Python vào một Vercel Function rồi tuyên bố mọi pipeline chạy được.

Giải pháp hiện tại: phục vụ nguồn như tài nguyên tĩnh; AI đọc SKILL.md; hai phép phân tích CSV/DNA được triển khai thực sự trên trình duyệt. Muốn chạy khoa học chuyên sâu cần executor riêng theo kỹ năng và kiểm tra dependency/hardware/API key tương ứng.

### P1 — Scanner upstream có cảnh báo chưa thể coi là đã giải quyết

`docs/security-report.json` gốc được tạo **19/10/2026**, scanner 2.3.0, bao phủ 177 kỹ năng. Báo cáo có **466 findings: 32 CRITICAL, 21 HIGH, 255 MEDIUM, 157 LOW, 1 INFO**, và danh sách cross-skill riêng.

`docs/security-triage.md` gốc cập nhật theo báo cáo **13/09/2026**, không đồng bộ với lần quét 19/10. Một số lớp cảnh báo trước đây được giải thích là API authentication, model.eval hoặc regex false positive; không dùng giải thích cũ làm kết luận miễn trừ cho mọi cảnh báo mới.

Giải pháp ứng dụng: không thực thi script upstream; tài liệu được đưa vào ngữ cảnh AI dưới quy tắc hệ thống giới hạn công cụ, không cho thay thế quy tắc hệ thống. Không coi kết quả `is_safe` của scanner là chứng nhận an toàn. Muốn bật executor cần rà soát các script sẽ chạy và các điểm đến/credential cụ thể.

### P2 — 84 ứng viên từ kiểm tra tĩnh cục bộ

- 28 callsite built-in `exec` đều nằm dưới `tests/`, dùng để kiểm tra snippet. Không có `eval/exec` built-in được phát hiện trong cây `skills/` bằng phép kiểm này.
- 56 ứng viên đường dẫn Markdown được tạo bởi regex ban đầu; nhiều trường hợp là SMILES, cú pháp CUDA hoặc placeholder trong đoạn mã. `audit/triage.json` phân biệt từng trường hợp. Không báo 56 ứng viên là 56 link ứng dụng bị hỏng.
- Không có lỗi cú pháp Python hoặc JSON được phát hiện trong lần audit.

### P2 — Cần cấu hình trước khi mở chức năng trả phí

AI mặc định chưa bật vì người dùng chưa có API key. Server yêu cầu cả API key và xác thực workspace. API key chỉ lưu bằng biến môi trường, không đi vào bundle trình duyệt. Có kiểm tra Origin, kích thước request, schema, cookie ký, timeout và quota.

Quota Redis là tùy chọn. Nếu thiếu Redis, bộ đếm RAM chỉ có phạm vi một process và có thể reset trên serverless. Đây không phải giới hạn chi phí toàn cục. Bổ sung Redis/WAF trước khi chia sẻ AI rộng rãi.

### P2 — Dữ liệu cá nhân và cloud

Ghi chú/dự án tự lưu local theo trình duyệt. Có xuất/nhập để sao lưu. Cloud sync chỉ bật khi cấu hình Redis và đăng nhập. Hợp nhất theo id/thời điểm và lưu compare-and-swap để tránh ghi đè đồng thời. Mô hình hiện tại là một workspace cá nhân/chung mật khẩu, chưa có đa tenant hoặc phân quyền nhiều người.

### Dependency ứng dụng

Đã loại bỏ dependency build `gray-matter` sau khi npm audit phát hiện chuỗi phụ thuộc có advisory mức moderate. Thay parser frontmatter bằng `yaml`. Lần kiểm tra sau thay đổi: `npm audit` báo **0 vulnerabilities**, gồm production và development dependency tại thời điểm kiểm tra. Kết quả này không bao phủ các package khoa học chưa cài.

## Kiểm thử

- Production Next.js build: đã chạy thành công; bản cuối được kiểm tra lại sau các thay đổi chức năng.
- TypeScript strict: đã qua.
- Bộ test ứng dụng: kiểm tra kết quả số, dữ liệu thiếu, DNA/FASTA, nhập dự án, URL không an toàn, chữ ký phiên, Origin, giới hạn body và quota.
- Integrity test: đối chiếu SHA-256 từng file tại cả vendor và public.
- Upstream `tests/_meta`: **18 passed và 4.222 subtests passed; 2 subtests lỗi do Windows thiếu executable Bash** cho `bash -n`, không phải khẳng định hai script có lỗi cú pháp. Không sửa file gốc để che lỗi môi trường. CI Ubuntu được chuẩn bị để kiểm tra với Bash có sẵn.
- Chưa chạy toàn bộ `tests/run_all.py --isolated` vì nhiều môi trường khoa học/GPU/licensed API chưa có. Không báo test skip hoặc lỗi môi trường là pass.
- AI trả lời thật và cloud Redis thật chưa kiểm thử nếu thiếu credential. Có kiểm tra đường dẫn từ chối khi chưa cấu hình.

Chi tiết kết quả thực tế và giới hạn triển khai được ghi trong `audit/VALIDATION.md` khi hoàn thành kiểm tra cuối.

## Tài liệu tham chiếu

- [Nguồn đã khóa commit](https://github.com/K-Dense-AI/scientific-agent-skills/tree/593377bb048752abb0152deab9fbb1083a6087df).
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations).
- [Europe PMC REST API](https://europepmc.org/RestfulWebService).

Skill Community Wisdom được tham khảo, nhưng session không cung cấp DevRelay gateway tools để tra cứu bài viết hoặc bình luận. Không tạo trích dẫn cộng đồng giả và không dùng tài liệu cộng đồng chưa đọc làm căn cứ kỹ thuật.
