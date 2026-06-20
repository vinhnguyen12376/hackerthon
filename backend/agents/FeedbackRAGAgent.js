import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { supabase } from "../supabaseClient.js";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";

// -----------------------------------------------------------------------------
// Tool 1: Search Internal Database
// -----------------------------------------------------------------------------
const searchInternalDatabase = tool(
  async ({ query, skill }) => {
    console.log(`\n=================================================`);
    console.log(`🔍 [AGENT REASONING] Tự động tra cứu Database...`);
    console.log(`- Kỹ năng: ${skill}`);
    console.log(`- Từ khóa: "${query}"`);
    console.log(`=================================================\n`);
    try {
      if (skill === 'grammar') {
        const { data } = await supabase.from('grammar_points').select('*').ilike('grammar', `%${query}%`).limit(1);
        if (data && data.length > 0) return `Ngữ pháp: ${data[0].grammar} - Ý nghĩa: ${data[0].meaning}`;
      } else if (skill === 'kanji') {
        const { data } = await supabase.from('kanjis').select('*').eq('character', query).limit(1);
        if (data && data.length > 0) return `Kanji: ${data[0].character} - Ý nghĩa: ${data[0].meaning}`;
      } else if (skill === 'vocabulary') {
        const { data } = await supabase.from('vocabularies').select('*').or(`word.eq.${query},reading.eq.${query}`).limit(1);
        if (data && data.length > 0) return `Từ vựng: ${data[0].word} - Ý nghĩa: ${data[0].meaning}`;
      }
      return "NOT_FOUND: Không tìm thấy trong dữ liệu nội bộ.";
    } catch (err) {
      return `Lỗi tra cứu: ${err.message}`;
    }
  },
  {
    name: "search_internal_database",
    description: "Tra cứu cơ sở dữ liệu nội bộ (Supabase) để lấy lý thuyết ngữ pháp, kanji hoặc từ vựng tiếng Nhật.",
    schema: z.object({
      query: z.string().describe("Từ khóa tiếng Nhật cần tra cứu (ví dụ: 食べる, が, 漢字)"),
      skill: z.enum(["grammar", "kanji", "vocabulary"]).describe("Loại kỹ năng cần tra (chỉ được chọn 1 trong 3)")
    })
  }
);

// -----------------------------------------------------------------------------
// Tool 2: Google Translate API (Free Endpoint)
// -----------------------------------------------------------------------------
const googleTranslateAPI = tool(
  async ({ text }) => {
    console.log(`\n⚠️ [AGENT REASONING] Cảnh báo: Database thiếu dữ liệu!`);
    console.log(`🌐 [AGENT ACTION] Kích hoạt Google Translate API...`);
    console.log(`- Nội dung dịch: "${text}"\n`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      return `Dịch nghĩa từ Google: ${data[0][0][0]}`;
    } catch (err) {
      if (err.name === 'AbortError') {
        return "Lỗi: Dịch vụ Google Translate phản hồi quá lâu (Timeout). Vui lòng thử công cụ khác hoặc tự suy luận.";
      }
      return `Lỗi dịch thuật: ${err.message}`;
    }
  },
  {
    name: "google_translate_api",
    description: "Dịch một từ hoặc câu tiếng Nhật sang tiếng Việt. CHỈ DÙNG CÔNG CỤ NÀY khi search_internal_database trả về NOT_FOUND.",
    schema: z.object({
      text: z.string().describe("Đoạn văn bản hoặc từ tiếng Nhật cần dịch sang tiếng Việt")
    })
  }
);

// Danh sách Tools cấp cho Agent
const tools = [searchInternalDatabase, googleTranslateAPI];

// -----------------------------------------------------------------------------
// Hàm 1: Đánh giá bài viết (Writing Lab)
// -----------------------------------------------------------------------------
export const analyzeWritingWithAgent = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: apiKey,
    temperature: 0.1,
  });

  const agent = createReactAgent({ llm: model, tools });

  const prompt = `
Bạn là AI Sensei (Evaluation Expert Agent).
Học viên viết đoạn văn:
"""
${text}
"""
Hãy kiểm tra lỗi từ vựng, ngữ pháp, kanji. 
Nếu bạn cần tra cứu từ vựng/ngữ pháp để kiểm chứng chắc chắn, hãy gọi các công cụ (Tools) được cấp.
KẾT QUẢ CUỐI CÙNG TRẢ VỀ DUY NHẤT một mảng JSON các lỗi theo cấu trúc:
[ { "wrong_text": "...", "suggestion": "...", "explanation": "...", "theory_category": "vocab|grammar|kanji" } ]
Nếu không có lỗi, trả về mảng rỗng []. KHÔNG kèm theo lời giải thích bên ngoài JSON.
  `;

  try {
    const res = await agent.invoke({ messages: [new HumanMessage(prompt)] });
    const finalMsg = res.messages[res.messages.length - 1].content;
    let jsonStr = finalMsg.trim().replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch (error) {
    console.error("Writing Agent Error:", error.message);
    // Graceful Fallback: Return a valid JSON error so UI doesn't crash
    return [{
      wrong_text: "Lỗi kết nối AI Sensei",
      suggestion: "Vui lòng thử lại sau",
      explanation: "AI Sensei đang gặp sự cố hoặc quá tải. Mong bạn thông cảm!",
      theory_category: "vocab"
    }];
  }
};

// -----------------------------------------------------------------------------
// Hàm 2: Giải thích lỗi sai trắc nghiệm (RAG Evaluation)
// -----------------------------------------------------------------------------
export const evaluateWrongAnswersWithRAG = async (wrongQuestions) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", 
    apiKey: apiKey,
    temperature: 0.1, 
  });

  const agent = createReactAgent({ llm: model, tools });

  const questionsData = wrongQuestions.map(q => ({
    id: q.id,
    skill: q.skill,
    question: q.question_text,
    user_answer: q.user_answer === "Không chọn đáp án" ? "Không chọn đáp án" : q[`option_${(q.user_answer || '').toLowerCase()}`],
    correct_answer: q[`option_${(q.correct_option || '').toLowerCase()}`]
  }));

  const prompt = `
Bạn là giáo viên tiếng Nhật. Dưới đây là danh sách các câu trắc nghiệm học viên làm sai:
${JSON.stringify(questionsData, null, 2)}

NHIỆM VỤ QUAN TRỌNG:
1. Đối với MỖI câu, HÃY TRA CỨU lý thuyết của "correct_answer" bằng công cụ 'search_internal_database'.
2. NẾU công cụ đó trả về NOT_FOUND, BẠN PHẢI DÙNG công cụ 'google_translate_api' để dịch đáp án đúng hoặc câu hỏi đó để hiểu nghĩa.
3. Sau khi đã dùng công cụ tìm hiểu xong, hãy giải thích ngắn gọn vì sao đáp án đúng lại đúng dựa trên dữ liệu công cụ trả về.

TRẢ VỀ DUY NHẤT một mảng JSON:
[
  { "question_id": "<id>", "ai_explanation": "<Đoạn giải thích chi tiết, thân thiện, trích dẫn lý thuyết gốc>" }
]
KHÔNG kèm theo text markdown nào khác.
  `;

  try {
    const res = await agent.invoke({ messages: [new HumanMessage(prompt)] });
    const finalMsg = res.messages[res.messages.length - 1].content;
    let jsonStr = finalMsg.trim().replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch (error) {
    console.error("RAG Agent Error:", error.message);
    // Graceful Fallback for Quiz Evaluation
    return questionsData.map(q => ({
      question_id: q.id,
      ai_explanation: "Lỗi kết nối: Không thể tải giải thích từ AI Sensei lúc này. Vui lòng thử lại sau."
    }));
  }
};
