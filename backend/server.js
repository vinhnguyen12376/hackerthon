import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Load env variables from root .env

import { generateRoadmapWithAgent } from './agents/DiagnosticAgent.js';
import { analyzeWritingWithAgent, evaluateWrongAnswersWithRAG } from './agents/FeedbackRAGAgent.js';
import { monitorPlannerApp } from './agents/MonitorPlannerGraph.js';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Diagnostic & Planner Agent
app.post('/api/agents/diagnostic', async (req, res) => {
  try {
    const { test_results } = req.body;
    if (!test_results) {
      return res.status(400).json({ error: 'Missing test_results' });
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
      const feedback = await analyzeWritingWithAgent(text);
      return res.json(feedback);
    } else if (exercise_type === 'quiz') {
      const feedback = await evaluateWrongAnswersWithRAG(wrongQs);
      return res.json(feedback);
    } else {
      return res.status(400).json({ error: 'Invalid exercise_type' });
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
    // Assuming monitorPlannerApp expects a state with messages
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
