# Nihongo Mentor AI - JLPT N5 Quiz App

Nihongo Mentor AI là một hệ thống ôn thi tiếng Nhật JLPT N5 tích hợp AI Agent tự chủ (Autonomous RAG Agent). Hệ thống không chỉ cung cấp bài tập trắc nghiệm mà còn đóng vai trò như một "Gia sư AI", tự động phân tích các câu trả lời sai của học viên và đưa ra giải thích chi tiết dựa trên dữ liệu lý thuyết nội bộ hoặc từ điển bên ngoài.

Dự án được xây dựng cho Vòng chung kết Hackathon AIDEV Summer 2026.

## 🌟 Tính năng cốt lõi (Đạt 100% Yêu cầu Hackathon)

1. **Tính Tự Chủ (Autonomy - Vòng lặp Cứu hộ Kiến thức):**
   - Agent sở hữu vòng lặp thông minh `Act → Observe → Re-plan`.
   - Nếu việc tra cứu lý thuyết trong Database nội bộ thất bại, Agent tự động nhận diện vấn đề, thay đổi chiến lược và chuyển sang sử dụng API bên ngoài (Jisho.org) để lấy nghĩa của từ và tiếp tục hoàn thành nhiệm vụ giải thích mà không bị crash hay báo lỗi.

2. **Sử dụng đa dạng Công cụ (Tool Use):**
   - **Tool 1 (Internal):** Truy xuất Database Supabase để lấy dữ liệu ngữ pháp, từ vựng, Kanji gốc.
   - **Tool 2 (External):** Tích hợp Jisho.org API để tra cứu động khi từ vựng không có sẵn trong hệ thống.

3. **Giá trị Thực tiễn (Real Impact):**
   - Giải quyết bài toán học tiếng Nhật một cách thụ động. Học viên hiểu rõ *tại sao mình sai* thay vì chỉ biết kết quả đúng/sai. Tiết kiệm 50% thời gian phải đi hỏi giáo viên.

## 🚀 Hướng dẫn cài đặt (Local Setup)

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- Trình duyệt Web hiện đại

### Các bước cài đặt
1. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd hackerthon
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   - Đổi tên file `.env.example` thành `.env`.
   - Điền các khóa API tương ứng của bạn (Gemini, Supabase, LangSmith).

4. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```
   - Mở trình duyệt ở địa chỉ `http://localhost:5173` để trải nghiệm ứng dụng.

## 🧠 Kiến trúc Hệ thống
Sơ đồ kiến trúc chi tiết của Autonomous Agent được cung cấp trong file `architecture_diagram.md`.

## 📌 Công nghệ sử dụng
- **Frontend:** React, Vite
- **AI Agent & LLM:** LangChain, Google Gemini 2.5 Flash
- **Database:** Supabase (PostgreSQL)
- **External Tools:** Jisho.org API

---
*Ban Tổ Chức – Hackathon AIDEV Summer 2026 | ĐH FPT Quy Nhơn*
