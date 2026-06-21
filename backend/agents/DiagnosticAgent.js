import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const generateRoadmapWithAgent = async (detailedResults) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }

  // Khởi tạo model Gemini qua LangChain
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Sử dụng gemini-2.5-flash theo danh sách hỗ trợ của API key
    apiKey: apiKey,
    maxOutputTokens: 2048,
    temperature: 0.2,
  });

  // Tính điểm thô
  const correctCount = detailedResults.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / detailedResults.length) * 100);

  // Thống kê theo kỹ năng
  const skillStats = detailedResults.reduce((acc, curr) => {
    if (!acc[curr.skill]) acc[curr.skill] = { total: 0, correct: 0 };
    acc[curr.skill].total += 1;
    if (curr.isCorrect) acc[curr.skill].correct += 1;
    return acc;
  }, {});

  console.log(`\n=================================================`);
  console.log(`🧠 [DIAGNOSTIC AGENT] Đang phân tích năng lực...`);
  console.log(`- Điểm số: ${score}/100`);
  console.log(`- Dữ liệu gửi cho Gemini: Đánh giá ${detailedResults.length} câu hỏi`);
  console.log(`=================================================\n`);

  const prompt = `
Bạn là Diagnostic & Planner Agent, một chuyên gia phân tích năng lực tiếng Nhật (JLPT N5-N2).
Dưới đây là thống kê kết quả bài kiểm tra 30 câu ngẫu nhiên của học viên:

Tổng điểm thô: ${score}/100 (${correctCount}/${detailedResults.length} câu đúng)
Chi tiết từng kỹ năng:
${JSON.stringify(skillStats, null, 2)}

Nhiệm vụ của bạn:
Phân tích dữ liệu trên và thiết kế lộ trình học tập tối ưu. Hãy TRẢ VỀ DUY NHẤT một chuỗi JSON hợp lệ (không kèm theo bất kỳ văn bản giải thích hay markdown \`\`\` nào khác), với cấu trúc chính xác như sau:
{
  "score": ${score},
  "overall_assessment": "<Đánh giá tổng quan năng lực hiện tại một cách chuyên nghiệp, khoảng 2-3 câu>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "weaknesses": ["<điểm yếu 1>", "<điểm yếu 2>"],
  "plan": [
    { "week": 1, "focus": "<Nội dung trọng tâm tuần 1>" },
    { "week": 2, "focus": "<Nội dung trọng tâm tuần 2>" },
    { "week": 3, "focus": "<Nội dung trọng tâm tuần 3>" },
    { "week": 4, "focus": "<Nội dung trọng tâm tuần 4>" }
  ]
}
`;

  try {
    const res = await model.invoke(prompt);
    // Xử lý dọn dẹp chuỗi trả về phòng trường hợp LLM vẫn bọc markdown
    let jsonStr = res.content.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/g, '').replace(/\`\`\`$/g, '').trim();
    }
    
    const resultJSON = JSON.parse(jsonStr);

    console.log(`✅ [DIAGNOSTIC AGENT] Gemini đã trả về kết quả!`);
    console.log(`- Đánh giá tổng quan: "${resultJSON.overall_assessment.substring(0, 80)}..."\n`);

    return resultJSON;
  } catch (error) {
    console.error("Diagnostic Agent Error:", error.message);
    // Graceful Fallback
    return {
      score: score || 0,
      overall_assessment: "Hệ thống AI hiện đang bận hoặc quá tải. Đây là lộ trình mặc định tạm thời.",
      strengths: ["Cần kiểm tra thêm"],
      weaknesses: ["Cần ôn tập toàn diện"],
      plan: [
        { week: 1, focus: "Ôn tập Từ vựng cơ bản" },
        { week: 2, focus: "Ôn tập Ngữ pháp cơ bản" },
        { week: 3, focus: "Luyện đọc hiểu" },
        { week: 4, focus: "Luyện nghe hiểu" }
      ]
    };
  }
};
