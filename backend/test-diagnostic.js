import { generateRoadmapWithAgent } from './agents/DiagnosticAgent.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function test() {
  console.log("Testing DiagnosticAgent...");
  try {
    const res = await generateRoadmapWithAgent([{ skill: "vocabulary", isCorrect: true }]);
    console.log("Result:", res);
  } catch (err) {
    console.error("Caught Error:", err);
  }
}

test();
