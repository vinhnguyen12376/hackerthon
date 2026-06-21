require('dotenv').config();
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('No API Key');
  process.exit(1);
}

const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
const ws = new WebSocket(url);

ws.onopen = () => {
  console.log('✅ Connected!');
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.5-flash',
      systemInstruction: { parts: [{ text: 'Sakura' }] }
    }
  }));
};

ws.onmessage = async (e) => {
  let d = e.data;
  if (d instanceof Blob) d = await d.text();
  console.log('✅ Response received from Live API!');
  ws.close();
};

ws.onerror = (err) => console.log('❌ Error:', err.message);
ws.onclose = (e) => console.log('🔴 Closed:', e.code);
