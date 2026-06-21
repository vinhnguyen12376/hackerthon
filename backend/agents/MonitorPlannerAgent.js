import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// 1. Định nghĩa State của Graph
const GraphState = Annotation.Root({
  currentRoadmap: Annotation(),
  testResults: Annotation(),
  evaluation: Annotation(),
  newRoadmap: Annotation()
});

// 2. Node: Đánh giá sự tiến bộ
async function evaluateProgress(state) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  console.log(`\n=================================================`);
  console.log(`📈 [MONITOR AGENT] Kích hoạt tiến trình đánh giá (evaluateProgress)...`);
  console.log(`- Nhận dữ liệu: Lộ trình hiện tại & Kết quả bài test vừa xong.`);
  console.log(`=================================================\n`);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", 
    apiKey: apiKey,
    temperature: 0.1
  });

  const prompt = `
Bạn là Monitor & Planner Agent. Nhiệm vụ của bạn là giám sát tiến độ của học viên.
Đây là lộ trình (điểm mạnh, điểm yếu) HIỆN TẠI của học viên:
${JSON.stringify(state.currentRoadmap, null, 2)}

Đây là kết quả bài "Kiểm tra tổng quát" học viên vừa làm:
${JSON.stringify(state.testResults, null, 2)}

Hãy so sánh kết quả bài làm với "weaknesses" trong lộ trình hiện tại. 
Họ đã cải thiện điểm yếu nào? Kỹ năng nào vẫn còn yếu hoặc mới phát sinh lỗi?
Hãy trả về một đoạn text phân tích thật ngắn gọn và súc tích.
  `;
  const res = await model.invoke(prompt);
  console.log(`✅ [MONITOR AGENT] Phân tích xong: "${res.content.substring(0, 80)}..."\n`);
  return { evaluation: res.content };
}

// 3. Node: Cập nhật Lộ trình và Config bốc câu hỏi
async function updateRoadmap(state) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", 
    apiKey: apiKey,
    temperature: 0.1
  });

  console.log(`\n=================================================`);
  console.log(`🗺️ [PLANNER AGENT] Bắt đầu thiết kế lại Lộ trình (updateRoadmap)...`);
  console.log(`- Đang biên soạn lại JSON Lộ trình 4 tuần và Config bài test tiếp theo.`);
  console.log(`=================================================\n`);

  const prompt = `
Bạn là Monitor & Planner Agent. Dựa trên phân tích sau đây của bạn về học viên:
"${state.evaluation}"

Lộ trình CŨ của học viên:
${JSON.stringify(state.currentRoadmap, null, 2)}

Nhiệm vụ: Cập nhật lại đối tượng JSON lộ trình học.
1. Cập nhật mảng "weaknesses" (loại bỏ kỹ năng đã tiến bộ, thêm kỹ năng yếu mới).
2. Cập nhật mảng "strengths".
3. Cập nhật "overall_assessment" bằng nhận xét mới nhất của bạn.
5. BẮT BUỘC giữ lại và cập nhật mảng "plan" (Kế hoạch học tập 4 tuần). Sửa đổi nội dung các tuần cho phù hợp với nhận xét mới của bạn.
6. THÊM một object "next_quiz_config" vào JSON. Object này quyết định cấu trúc bốc đề cho bài Kiểm tra tổng quát lần sau. Ví dụ:
"next_quiz_config": {
  "focus_skills": ["grammar", "kanji"],
  "difficulty_adjustment": "Tăng độ khó ngữ pháp",
  "reason": "Học viên đã làm tốt từ vựng nhưng sai ngữ pháp nhiều"
}

TRẢ VỀ DUY NHẤT một object JSON hợp lệ có ĐẦY ĐỦ các key sau:
{
  "overall_assessment": "...",
  "strengths": [...],
  "weaknesses": [...],
  "plan": [
    { "week": 1, "focus": "..." },
    { "week": 2, "focus": "..." },
    { "week": 3, "focus": "..." },
    { "week": 4, "focus": "..." }
  ],
  "next_quiz_config": { ... }
}
  `;
  const res = await model.invoke(prompt);
  let jsonStr = res.content.trim();
  if (jsonStr.startsWith('\`\`\`json')) {
    jsonStr = jsonStr.replace(/^\`\`\`json/g, '').replace(/\`\`\`$/g, '').trim();
  }
  
  const newRoadmap = JSON.parse(jsonStr);
  console.log(`✅ [PLANNER AGENT] Lộ trình mới đã được tạo thành công!\n`);
  return { newRoadmap };
}

// 4. Định nghĩa và Compile Graph
const workflow = new StateGraph(GraphState)
  .addNode("evaluate_progress", evaluateProgress)
  .addNode("update_roadmap", updateRoadmap)
  .addEdge(START, "evaluate_progress")
  .addEdge("evaluate_progress", "update_roadmap")
  .addEdge("update_roadmap", END);

export const monitorPlannerApp = workflow.compile();
