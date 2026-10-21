# Ma trận chức năng

| Chức năng | Đã có mã hoạt động | Điều kiện |
| --- | --- | --- |
| Thư viện 177 kỹ năng | Có | Build tải nguồn đã khóa commit |
| Xem/tải 2.780 file gốc | Có | Tài nguyên tĩnh; không thực thi script |
| Tìm kiếm/lọc/yêu thích | Có | Trình duyệt; yêu thích lưu local |
| Markdown, links nội bộ, source preview | Có | File lớn tải riêng |
| Tìm bài báo và DOI | Có | API Europe PMC truy cập được |
| Dự án, ghi chú, bài báo đã lưu | Có | LocalStorage; không phải tài khoản cloud mặc định |
| Nhập/xuất dự án JSON | Có | File nhập tối đa 5 MB, kiểm tra schema |
| Xuất Markdown/BibTeX | Có | Dữ liệu người dùng đã lưu |
| Đồng bộ cloud nhiều thiết bị | Có | Redis REST + mật khẩu workspace |
| CSV descriptive statistics | Có | ≤10 MB và ≤100.000 dòng |
| DNA FASTA, GC%, reverse complement | Có | Một trình tự A/C/G/T/N |
| AI có ngữ cảnh kỹ năng | Có | API key + model + APP_PASSWORD + AUTH_SECRET |
| Hạn mức dùng chung giữa instance | Có | Redis REST; fallback RAM có giới hạn |
| AI chạy Python hoặc tự tìm web | Chưa có | AI hiện chỉ đối thoại, không có tool execution |
| Chạy toàn bộ 177 pipeline khoa học | Chưa có | Cần executor/môi trường riêng + credential chuyên dụng |
| PDF upload/RAG tự động | Chưa có | Không có chức năng giả lập |
| Nhiều tài khoản phân quyền riêng | Chưa có | Hiện là một workspace chung mật khẩu |

Danh mục kỹ năng không phải danh sách các dịch vụ đã kết nối. Các API như Benchling, DNAnexus, Zotero, OpenRouter và những công cụ thí nghiệm được mô tả trong nguồn gốc cần cấu hình riêng; ứng dụng không tuyên bố đã tích hợp các dịch vụ đó.
