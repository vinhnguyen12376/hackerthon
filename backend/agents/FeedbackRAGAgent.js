import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { supabase } from "../supabaseClient.js";

// -----------------------------------------------------------------------------
// Hàm 1: Đánh giá bài viết (Writing Lab) có sử dụng RAG
// -----------------------------------------------------------------------------
export const analyzeWritingWithAgent = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env file");
  }

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", 
    apiKey: apiKey,
    maxOutputTokens: 2048,
    temperature: 0.1, 
  });

  const prompt = `
Bạn là AI Sensei (Evaluation Expert Agent), một chuyên gia ngôn ngữ tiếng Nhật.
Học viên vừa viết một đoạn văn bản sau:
"""
${text}
"""

Nhiệm vụ của bạn là kiểm tra LỖI TỪ VỰNG, LỖI NGỮ PHÁP, và LỖI BẢNG CHỮ CÁI (ví dụ: dùng Romaji thay vì Hiragana/Kanji) trong đoạn văn trên.
Hãy TRẢ VỀ DUY NHẤT một mảng JSON (không kèm markdown \`\`\`), mỗi phần tử là một object chứa thông tin về lỗi.
Nếu không có lỗi nào, trả về mảng rỗng [].

Cấu trúc mỗi object lỗi:
{
  "wrong_text": "<Từ/Cụm từ bị sai chính xác như trong văn bản>",
  "suggestion": "<Từ/Cụm từ đúng đề xuất thay thế (bằng tiếng Nhật chuẩn)>",
  "explanation": "<Giải thích ngắn gọn bằng tiếng Việt vì sao sai và cách dùng đúng>",
  "theory_category": "<Chỉ định 1 trong 3 loại: 'vocab', 'grammar', hoặc 'kanji' để hệ thống tra cứu lý thuyết>"
}
Ví dụ 1:
[
  {
    "wrong_text": "私を学生です",
    "suggestion": "私は学生です",
    "explanation": "Trợ từ 'を' dùng cho tân ngữ. Ở đây phải dùng trợ từ 'は' để chỉ chủ đề của câu.",
    "theory_category": "grammar"
  }
]
`;

  try {
    const res = await model.invoke(prompt);
    let jsonStr = res.content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    }
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) {
      jsonStr = match[0];
      return JSON.parse(jsonStr);
    } else {
      if (jsonStr.toLowerCase().includes("không có lỗi") || jsonStr === "") {
        return [];
      }
      throw new Error("AI trả về định dạng không hợp lệ: " + jsonStr.substring(0, 50));
    }
  } catch (error) {
    console.error("Writing Agent Error:", error);
    throw error;
  }
};


// -----------------------------------------------------------------------------
// Hàm 2: Giải thích lỗi sai trắc nghiệm (RAG Evaluation)
// -----------------------------------------------------------------------------
export const evaluateWrongAnswersWithRAG = async (wrongQuestions) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env file");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", 
    apiKey: apiKey,
    maxOutputTokens: 8192,
    temperature: 0.1, 
  });

  const theories = await Promise.all(wrongQuestions.map(async (q) => {
    let theoryText = "Không tìm thấy lý thuyết cụ thể trong Database.";
    const correctAnswerText = q[`option_${(q.correct_option || '').toLowerCase()}`] || "";
    
    try {
      if (q.skill === 'grammar') {
        const { data } = await supabase.from('grammar_points').select('*').ilike('grammar', `%${correctAnswerText}%`).limit(1);
        if (data && data.length > 0) {
          theoryText = `Ngữ pháp: ${data[0].grammar} - Ý nghĩa: ${data[0].meaning} - Giải thích: ${data[0].explanation || ''} - Chú ý: ${data[0].note || ''}`;
        }
      } else if (q.skill === 'kanji') {
        const { data } = await supabase.from('kanjis').select('*').eq('character', correctAnswerText).limit(1);
        if (data && data.length > 0) {
          theoryText = `Kanji: ${data[0].character} - Âm Kun: ${data[0].kunyomi} - Âm On: ${data[0].onyomi} - Ý nghĩa: ${data[0].meaning}`;
        }
      } else if (q.skill === 'vocabulary') {
        const { data } = await supabase.from('vocabularies').select('*').or(`word.eq.${correctAnswerText},reading.eq.${correctAnswerText}`).limit(1);
        if (data && data.length > 0) {
          theoryText = `Từ vựng: ${data[0].word} - Cách đọc: ${data[0].reading} - Hán Việt: ${data[0].hanviet || ''} - Ý nghĩa: ${data[0].meaning}`;
        }
      }
    } catch (err) {
      console.error("Error fetching RAG theory:", err);
    }

    return {
      question_id: q.id,
      question: q.question_text,
      user_answer: q.user_answer === "Không chọn đáp án" ? "Không chọn đáp án" : q[`option_${(q.user_answer || '').toLowerCase()}`],
      correct_answer: correctAnswerText,
      theory_context: theoryText
    };
  }));

  const prompt = `
Bạn là một giáo viên tiếng Nhật (Evaluation Expert Agent) cực kỳ nghiêm khắc và chính xác.
Học viên vừa làm sai một số câu trắc nghiệm. Dưới đây là danh sách các câu sai, kèm theo LÝ THUYẾT GỐC được trích xuất từ Database hệ thống của trường.

NHIỆM VỤ CỦA BẠN:
1. Giải thích cho học viên vì sao đáp án họ chọn là SAI.
2. Giải thích vì sao đáp án đúng là ĐÚNG.
3. BẠN PHẢI TUYỆT ĐỐI DỰA VÀO phần "LÝ THUYẾT GỐC" được cung cấp để giải thích. KHÔNG được tự bịa ra lý thuyết ngoài. Nếu Lý thuyết gốc nói "Không tìm thấy", bạn hãy giải thích bằng kiến thức chuẩn của JLPT N5.
4. TUYỆT ĐỐI KHÔNG DÙNG LỜI CHÀO. KHÔNG NÓI THÊM BẤT CỨ ĐIỀU GÌ NGOÀI MẢNG JSON.
5. YÊU CẦU QUAN TRỌNG: Hãy giải thích cực kỳ ngắn gọn, súc tích (Tối đa 2-3 câu).

DỮ LIỆU CÂU SAI VÀ LÝ THUYẾT GỐC:
${JSON.stringify(theories, null, 2)}

Hãy trả về kết quả dưới dạng JSON Array (Mảng JSON), không kèm markdown \`\`\`. 
Cấu trúc mỗi object trong mảng:
{
  "question_id": "<id của câu hỏi>",
  "ai_explanation": "<Đoạn giải thích chi tiết, thân thiện, trích dẫn lý thuyết gốc>"
}
  `;

  try {
    const res = await model.invoke(prompt);
    let jsonStr = res.content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    }
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) jsonStr = match[0];
    
    let parsed = [];
    try {
      parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) parsed = parsed[arrayKey];
        else parsed = [parsed];
      }
    } catch (parseErr) {
      console.warn("JSON Parse Error, ignoring...");
    }

    return parsed.map((item, index) => ({
      question_id: theories[index]?.question_id || item.question_id,
      ai_explanation: item.ai_explanation || item.explanation || item.feedback || "Không thể tải giải thích."
    }));
  } catch (error) {
    console.error("RAG Agent Error:", error);
    throw error;
  }
};
