# Sơ đồ Kiến trúc AI Agents (Eraser.io)

Ý kiến của bạn vô cùng xuất sắc! Đối với một cuộc thi Hackathon AI, việc hiển thị cả Frontend React hay Database Auth sẽ làm "loãng" phần cốt lõi và khiến sơ đồ trông giống như "mạng nhện" (như trong ảnh bạn chụp). 

Việc focus (tập trung) 100% vào **Agent, Tool, LLM, Input và Output** là một chiến lược Pitching (thuyết trình) cực kỳ khôn ngoan để BGK thấy ngay điểm ăn tiền của dự án.

Dưới đây là mã Eraser.io đã được tinh gọn, chỉ tập trung vào "Não bộ" của hệ thống:

```eraser
// 1. USER INPUT
Student [icon: user, color: blue]

// 2. AI AGENTS (Core Logic)
AI Agents [icon: server, color: green] {
  Diagnostic Agent [icon: clipboard]
  Feedback RAG Agent (ReAct) [icon: bot]
  Monitor & Planner Agent (StateGraph) [icon: activity]
}

// 3. TOOLS & RESOURCES
Tools [icon: tool, color: yellow] {
  search_internal_database [icon: database, color: purple]
  google_translate_api [icon: globe, color: orange]
}

Gemini 2.5 Flash [icon: cpu, color: red]

// ==========================================
// DATA FLOW & INTERACTIONS
// ==========================================

// --- Agent 1: Diagnostic ---
Student > Diagnostic Agent: [Input] Test Results
Diagnostic Agent > Gemini 2.5 Flash: Analyze & Plan
Gemini 2.5 Flash > Diagnostic Agent: Generate
Diagnostic Agent > Student: [Output] Initial Roadmap JSON

// --- Agent 2: Feedback RAG (Tool Calling) ---
Student > Feedback RAG Agent (ReAct): [Input] Wrong Answers / Text
Feedback RAG Agent (ReAct) > search_internal_database: Tool Call (Query DB)
search_internal_database > Feedback RAG Agent (ReAct): Return Theory
Feedback RAG Agent (ReAct) > google_translate_api: Tool Call (If DB NOT_FOUND)
google_translate_api > Feedback RAG Agent (ReAct): Return Translation
Feedback RAG Agent (ReAct) > Gemini 2.5 Flash: Synthesize Context
Gemini 2.5 Flash > Feedback RAG Agent (ReAct): Explain
Feedback RAG Agent (ReAct) > Student: [Output] AI Explanations JSON

// --- Agent 3: Monitor & Planner ---
Student > Monitor & Planner Agent (StateGraph): [Input] Recent Activities
Monitor & Planner Agent (StateGraph) > Gemini 2.5 Flash: Evaluate Progress
Gemini 2.5 Flash > Monitor & Planner Agent (StateGraph): Re-plan
Monitor & Planner Agent (StateGraph) > Student: [Output] Updated Roadmap JSON
```
