# Sơ đồ Kiến trúc Hệ thống - Nihongo Mentor AI

Sơ đồ dưới đây mô tả luồng hoạt động của Hệ thống Autonomous AI Agent trong ứng dụng Nihongo Mentor, bao gồm khả năng Tự chủ (Autonomy) và gọi Công cụ (Tool Use).

```mermaid
graph TD
    A[Học viên làm sai bài tập] --> B[RAG Evaluation Agent bắt đầu phân tích]
    B --> C{Xác định Skill của câu hỏi}
    
    C -->|Grammar / Kanji| D[Truy vấn Supabase Database]
    C -->|Vocabulary| E[Truy vấn Supabase Database]
    
    D --> F{Database có dữ liệu không?}
    E --> F
    
    F -->|Có| G[Gắn Lý thuyết vào Prompt]
    
    F -->|Không| H((Agent Observation: Lỗi thiếu dữ liệu))
    H --> I[Re-plan: Chuyển chiến lược sang API ngoài]
    I --> J[Action: Gọi Jisho.org API]
    
    J --> K{Jisho có dữ liệu không?}
    K -->|Có| L[Dịch nghĩa tiếng Anh sang tiếng Việt & Gắn vào Prompt]
    K -->|Không| M[Dùng kiến thức chung của LLM]
    
    G --> N[Gửi Prompt cho Gemini-2.5-Flash LLM]
    L --> N
    M --> N
    
    N --> O{LLM xuất JSON giải thích}
    
    O -->|Hợp lệ| P[Hiển thị giải thích lên UI]
    O -->|Bị Truncated / Cắt cụt| Q[Regex Cứu hộ: Cắt lấy chuỗi JSON chưa hoàn thiện]
    O -->|Không dùng JSON| R[Text Cứu hộ: Nhúng toàn bộ văn bản vào UI]
    
    Q --> P
    R --> P

    classDef tools fill:#f9f,stroke:#333,stroke-width:2px;
    classDef llm fill:#bbf,stroke:#333,stroke-width:2px;
    classDef logic fill:#ff9,stroke:#333,stroke-width:2px;
    
    class D,E,J tools;
    class N llm;
    class H,I logic;
```

## Chú thích:
- **Công cụ (Tools):** Các khối hình màu hồng đại diện cho các công cụ mà Agent sử dụng tương tác với thế giới bên ngoài (Database Nội bộ và API Từ điển Jisho bên ngoài).
- **Tính tự chủ (Autonomy):** Cụm khối màu vàng thể hiện vòng lặp `Observe -> Re-plan -> Act`. Agent tự phát hiện dữ liệu nội bộ bị rỗng và tự động kích hoạt API bên ngoài để bù đắp.
- **Xử lý LLM:** Khối màu xanh lam là nơi LLM (Gemini) phân tích dữ liệu và sinh câu trả lời. Hệ thống cũng có lớp phòng vệ (Regex/Text fallback) để chống lỗi JSON Truncation.
