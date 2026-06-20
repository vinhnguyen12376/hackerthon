import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { generateRoadmapWithAgent } from './agents/DiagnosticAgent.js';
import { analyzeWritingWithAgent, evaluateWrongAnswersWithRAG } from './agents/FeedbackRAGAgent.js';
import { monitorPlannerApp } from './agents/MonitorPlannerAgent.js';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Diagnostic & Planner Agent
app.post('/api/agents/diagnostic', async (req, res) => {
  try {
    const { test_results } = req.body;
    if (!test_results || !Array.isArray(test_results) || test_results.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ: test_results phải là một mảng không rỗng.' });
    }
    const roadmap = await generateRoadmapWithAgent(test_results);
    res.json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình xử lý Diagnostic Agent' });
  }
});

// 2. Feedback RAG Agent (AI Sensei)
app.post('/api/agents/feedback-rag', async (req, res) => {
  try {
    const { exercise_type, text, wrongQs } = req.body;
    
    if (exercise_type === 'writing') {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: Đoạn văn bản (text) không được để trống.' });
      }
      const feedback = await analyzeWritingWithAgent(text);
      return res.json(feedback);
    } else if (exercise_type === 'quiz') {
      if (!wrongQs || !Array.isArray(wrongQs)) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: wrongQs phải là một mảng.' });
      }
      if (wrongQs.length === 0) return res.json([]); // Không có lỗi sai thì không cần RAG
      const feedback = await evaluateWrongAnswersWithRAG(wrongQs);
      return res.json(feedback);
    } else {
      return res.status(400).json({ error: 'Loại bài tập (exercise_type) không hợp lệ.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình xử lý Feedback RAG Agent' });
  }
});

// 3. Monitor & Planner Agent
app.post('/api/agents/monitor', async (req, res) => {
  try {
    const { recent_activities } = req.body;
    if (!recent_activities || typeof recent_activities !== 'object') {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ: recent_activities phải là một Object.' });
    }
    // Mảng message đầu vào phải tuân thủ dạng LangGraph State
    const initialState = {
      messages: [{ role: "user", content: JSON.stringify(recent_activities) }]
    };
    
    const result = await monitorPlannerApp.invoke(initialState);
    const lastMessage = result.messages[result.messages.length - 1];
    res.json({ message: lastMessage.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi trong quá trình xử lý Monitor Agent' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
});
