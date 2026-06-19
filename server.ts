import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Import chuẩn xác theo ảnh image_9e2f08.jpg và image_9e2f25.jpg
import * as originalSdk from '@anthropic-ai/claude-agent-sdk';
import { wrapClaudeAgentSDK } from 'langsmith/experimental/anthropic';
import { z } from 'zod';
import Groq from 'groq-sdk';
import multer from 'multer';
import * as fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: 'uploads/' }); // Thư mục tạm chứa file ghi âm (.mp3/.wav từ React)

// Kết nối Supabase database của bạn
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Bọc SDK gốc bằng LangSmith wrapper để tự động ghi nhận Tracing
const sdk = wrapClaudeAgentSDK(originalSdk);

// =====================================================================
// ĐỊNH NGHĨA TOOLS ĐỂ TRUY VẤN VÀO CÁC BẢNG DATABASE CỦA BẠN
// =====================================================================

// 1. Tool tra cứu từ vựng (Tra bảng vocabularies)
const searchVocabulary = sdk.tool(
  'search_vocabulary',
  'Tìm kiếm từ vựng tiếng Nhật, cách đọc, chữ Hán hoặc nghĩa tiếng Việt trong DB.',
  {
    keyword: z.string(),
  },
  async ({ keyword }: { keyword: string }) => {
    try {
      const { data, error } = await supabase
        .from('vocabularies')
        .select('*')
        .or(`word.ilike.%${keyword}%,reading.ilike.%${keyword}%,meaning.ilike.%${keyword}%`)
        .limit(5);

      if (error) throw error;
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: 'text' as const, text: `Lỗi DB từ vựng: ${e.message}` }],
      };
    }
  }
);

// 2. Tool tra cứu ngữ pháp (Tra bảng grammar_points)
const searchGrammar = sdk.tool(
  'search_grammar',
  'Tìm kiếm cấu trúc ngữ pháp tiếng Nhật hoặc ý nghĩa giải thích trong DB.',
  {
    keyword: z.string(),
  },
  async ({ keyword }: { keyword: string }) => {
    try {
      const { data, error } = await supabase
        .from('grammar_points')
        .select('*')
        .ilike('grammar', `%${keyword}%`)
        .limit(3);

      if (error) throw error;
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: 'text' as const, text: `Lỗi DB ngữ pháp: ${e.message}` }],
      };
    }
  }
);

// Khởi tạo MCP Server chứa các tool tiếng Nhật theo cấu trúc ảnh image_9e2f25.jpg
const nihongoDbServer = sdk.createSdkMcpServer({
  name: 'nihongo_database',
  version: '1.0.0',
  tools: [searchVocabulary, searchGrammar],
});

// =====================================================================
// ĐỊNH NGHĨA CẤU TRÚC 3 AGENT MỚI (Diagnostic, Evaluation, Content)
// =====================================================================

// Cấu hình Agent 1: Diagnostic & Planner
export const diagnosticPlannerAgent = async (testResult: any) => {
  return await sdk.query({
    prompt: `Hãy phân tích bài kiểm tra đầu vào sau đây của học viên: ${JSON.stringify(testResult)}. 
    Nhiệm vụ: Chấm điểm, đánh giá điểm mạnh/yếu cụ thể và xuất ra một lộ trình học tiếng Nhật (gồm các bài học Kanji, Ngữ pháp phù hợp).`,
    options: {
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt: 'Bạn là chuyên gia khảo thí và lên lộ trình học tiếng Nhật (Diagnostic & Planner Agent).'
    }
  });
};

// Cấu hình Agent 2: Evaluation Expert (Chữa Writing & Speaking)
export const evaluationExpertAgent = async (userSubmission: { type: 'writing' | 'speaking', content: string }) => {
  const promptStyle = userSubmission.type === 'speaking' 
    ? 'Tập trung vào sửa lỗi phát âm, ngữ điệu, từ nối tự nhiên trong giao tiếp.'
    : 'Tập trung vào cấu trúc ngữ pháp, cách chia thể, hành văn trang trọng hoặc lịch sự.';

  return await sdk.query({
    prompt: `Học viên nộp bài ${userSubmission.type} như sau: "${userSubmission.content}". Hãy chấm điểm theo thang N-khung năng lực và sửa lỗi chi tiết từng câu.`,
    options: {
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt: `Bạn là Chuyên gia ngôn ngữ chữa kĩ năng chuyên sâu (Evaluation Expert). ${promptStyle}`
    }
  });
};

// Cấu hình Agent 3: Content & Monitor (Quiz Generator & Progress Tracker)
export const contentMonitorAgent = async (userId: string, action: 'generate_quiz' | 'track_progress', scoreData?: any) => {
  if (action === 'generate_quiz') {
    // 1. Lấy lịch sử làm bài của User từ Supabase (Ví dụ giả lập độ khó hiện tại)
    // 2. Claude tự động sinh JSON Quiz dựa trên độ khó đó
    return await sdk.query({
      prompt: "Dựa trên tiến độ hiện tại của học viên, hãy sinh ra một bài trắc nghiệm gồm 5 câu (Kanji, từ vựng) phù hợp.",
      options: {
        model: 'claude-sonnet-4-5-20250929',
        // Inject thêm tool search_vocabulary đã viết ở bước trước vào đây để Agent tự bốc từ vựng trong DB ra làm quiz!
        mcpServers: { nihongo_db: nihongoDbServer }, 
        allowedTools: ['mcp__nihongo_db__search_vocabulary']
      }
    });
  }
};

// =====================================================================
// ĐỊNH NGHĨA ROUTE API KẾT NỐI VỚI CHAT INTERFACE TRÊN REACT
// =====================================================================

app.get('/', (req: Request, res: Response) => {
  res.send('AI Backend Server đang hoạt động tốt! Vui lòng gọi POST /api/chat để trò chuyện với Agent.');
});

app.post('/api/chat', async (req: Request, res: Response): Promise<any> => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message là bắt buộc' });
  }

  try {
    // Thiết lập Header để hỗ trợ Server-Sent Events (SSE) giúp stream chữ chạy mượt mà trên React UI
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Khởi tạo truy vấn Agent bọc bởi LangSmith (theo cấu trúc ảnh image_9e2f25.jpg và image_9e2f08.jpg)
    const query = sdk.query({
      prompt: message,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt: 
          'Bạn là một NihongoMentorAI thông minh, hỗ trợ học tiếng Nhật nhiệt tình. ' +
          'Khi người dùng hỏi về từ vựng hoặc ngữ pháp, bạn phải gọi các tool truy vấn dữ liệu từ database Supabase lên trước. ' +
          'Hãy dựa vào dữ liệu chính xác trong database thu được để ưu tiên giải thích cho người học bằng tiếng Việt thật dễ hiểu, rõ ràng tên kiến thức và công thức.',
        mcpServers: { nihongo_db: nihongoDbServer },
        allowedTools: ['mcp__nihongo_db__search_vocabulary', 'mcp__nihongo_db__search_grammar'],
      },
    });

    // Thực hiện vòng lặp để stream kết quả trả về liên tục (giống ảnh image_9e2f08.jpg)
    for await (const chunk of query) {
      // Gửi từng phần dữ liệu chữ (chunk) về cho giao diện Frontend React của bạn
      if (chunk && typeof chunk === 'object' && 'text' in chunk) {
         res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      } else if (typeof chunk === 'string') {
         res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    return res.end();

  } catch (error: any) {
    console.error('Lỗi hệ thống Agent:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
    res.end();
  }
});

app.post('/api/assessment/speaking', upload.single('audio'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Không tìm thấy file âm thanh' });

    // 1. Gửi file audio lên Groq Whisper để chuyển thành Text tiếng Nhật siêu tốc
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3',
      language: 'ja', // Ép khuôn nhận diện tiếng Nhật
      response_format: 'text',
    });

    const recognizedText = transcription.text; // Text tiếng Nhật hoàn chỉnh từ giọng nói user

    // 2. Chuyển tiếp chuỗi Text này sang cho Evaluation Expert xử lý chấm điểm
    let evaluationResult = "";
    const agentQuery = await evaluationExpertAgent({ type: 'speaking', content: recognizedText });
    
    for await (const chunk of agentQuery) {
      if (chunk && typeof chunk === 'object' && 'text' in chunk) evaluationResult += chunk.text;
    }

    // Xóa file tạm sau khi xử lý xong
    fs.unlinkSync(req.file.path);

    // 3. Trả về cho Frontend cả chuỗi chữ nhận diện được + kết quả chấm điểm
    return res.json({
      userSpeechText: recognizedText,
      evaluation: evaluationResult
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 AI Backend Server đang khởi chạy mượt mà tại http://localhost:${PORT}`);
});
