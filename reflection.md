# Báo cáo Reflection - Nihongo Mentor AI

## 1. Điều gì khó nhất trong quá trình xây dựng hệ thống?
Thách thức lớn nhất mà đội gặp phải là **Xử lý tính bất định của LLM (LLM Hallucinations & Output Formatting)**.
Mặc dù đã cung cấp Prompt kỹ lưỡng yêu cầu Gemini-2.5-Flash trả về định dạng mảng JSON cho các câu giải thích RAG, nhưng trong thực tế, khi đối mặt với các câu đọc hiểu quá dài hoặc khi người dùng sai quá nhiều câu:
1. **Lỗi Truncated:** LLM tự động cắt cụt chuỗi JSON do vượt giới hạn Token nội bộ, dẫn đến lỗi `SyntaxError` khi parse JSON ở phía frontend.
2. **Lỗi Đổi ngôi & Bỏ qua JSON:** Đôi khi LLM "nhập vai" giáo viên quá mức và trả về một bài văn phân tích dài thay vì dùng mảng JSON, khiến hệ thống trích xuất bị sụp đổ.

**Cách giải quyết:** Chúng tôi không thụ động chờ LLM hoàn hảo. Đội đã xây dựng một cơ chế phòng vệ 2 lớp (Two-Layer Fallback):
- **Lớp 1 (Regex Trích xuất Mù):** Dùng biểu thức chính quy (Regex) phức tạp để luồn lách vào chuỗi JSON bị đứt gãy, tự động dọn dẹp các ký tự escape (`\"`, `\`) để lấy trọn vẹn giá trị giải thích.
- **Lớp 2 (Bắt Text Thô):** Nếu Regex thất bại (tức là LLM bỏ qua định dạng JSON), hệ thống tự động nhận diện và bê nguyên vẹn văn bản thô đó gán cho tất cả các câu sai để người dùng vẫn đọc được mà không bị crash ứng dụng.

## 2. Bài học kỹ thuật cốt lõi rút ra
- **Đừng tin tưởng tuyệt đối vào đầu ra của LLM:** Mọi output từ LLM đều cần phải có Validator và Fallback. Một AI Agent thực thụ không phải là một LLM không bao giờ sai, mà là một hệ thống không bao giờ crash khi LLM làm sai.
- **Autonomy không phải là phép thuật:** Tính tự chủ (Autonomy) thực chất là nghệ thuật của việc xử lý rẽ nhánh linh hoạt (Condition branching) kết hợp với công cụ ngoài (External Tools). Việc nhận diện Local Database bị rỗng và tự động gọi Jisho API (Vòng lặp Cứu hộ Kiến thức) đã dạy chúng tôi cách xây dựng tư duy "Self-healing" cho hệ thống.

## 3. Kế hoạch phát triển tiếp theo (Nếu có thêm 1 tuần)
Nếu có thêm thời gian, nhóm sẽ tập trung vào 2 hạng mục:
1. **Long-Term Memory:** Xây dựng cơ sở dữ liệu lưu lại toàn bộ lịch sử lỗi sai của từng học viên, từ đó Agent có thể theo dõi và chỉ ra: "Em lại sai ngữ pháp V-te giống bài kiểm tra tuần trước rồi".
2. **Multi-Agent Collaboration:** Chia nhỏ hệ thống thành 2 Agents: `Analyzer Agent` (chuyên cào từ điển và tổng hợp tài liệu) và `Teacher Agent` (chuyên dùng tài liệu đó để viết giải thích dỗ dành người học). Điều này giúp giảm tải cho một LLM duy nhất và tăng độ chính xác.
