// utils/geminiLiveApi.js
// Đây là tiện ích gọi trực tiếp Gemini Multimodal Live API qua WebSocket

export class GeminiLiveClient {
  constructor(onMessageCallback, onStatusChange) {
    this.ws = null;
    this.onMessageCallback = onMessageCallback;
    this.onStatusChange = onStatusChange;
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  async connect() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.onStatusChange("connected");
      // Setup session
      const setupMsg = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          systemInstruction: {
            parts: [{ text: "Bạn là Sakura, cô gái Nhật Bản 22 tuổi thân thiện. Hãy nói chuyện ngắn gọn bằng tiếng Nhật ở mức độ N5." }]
          }
        }
      };
      this.ws.send(JSON.stringify(setupMsg));
    };

    this.ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        this.handleMessage(JSON.parse(text));
      } else {
        this.handleMessage(JSON.parse(event.data));
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      this.onStatusChange("error");
    };

    this.ws.onclose = () => {
      this.onStatusChange("disconnected");
    };

    // Chuẩn bị AudioContext để phát giọng nói trả về
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }

  handleMessage(data) {
    if (data.serverContent && data.serverContent.modelTurn) {
      const parts = data.serverContent.modelTurn.parts;
      for (const part of parts) {
        if (part.text) {
          this.onMessageCallback(part.text, 'ai');
        }
        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
          this.playAudioChunk(part.inlineData.data);
        }
      }
    }
  }

  sendTextMessage(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = {
      clientContent: {
        turns: [
          { role: "user", parts: [{ text }] }
        ],
        turnComplete: true
      }
    };
    this.ws.send(JSON.stringify(msg));
  }

  // --- Chức năng Ghi âm và Gửi âm thanh PCM (16000Hz) qua WebSocket ---
  async startMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Bắt buộc sample rate 16kHz cho Gemini API
      this.micAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = this.micAudioContext.createMediaStreamSource(stream);
      
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input.length > 0) {
              const channel = input[0];
              const pcm16 = new Int16Array(channel.length);
              for (let i = 0; i < channel.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, channel[i] * 32768));
              }
              this.port.postMessage(pcm16.buffer);
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.micAudioContext.audioWorklet.addModule(url);
      
      this.processor = new AudioWorkletNode(this.micAudioContext, 'pcm-processor');
      this.processor.port.onmessage = (e) => {
        const arrayBuffer = e.data;
        const base64 = this.arrayBufferToBase64(arrayBuffer);
        this.sendAudioChunk(base64);
      };
      source.connect(this.processor);
      // processor.connect(this.micAudioContext.destination); // Bật dòng này nếu muốn nghe lại tiếng mình
      this.micStream = stream;
    } catch (err) {
      console.error("Mic error:", err);
      this.onStatusChange("error");
    }
  }

  sendAudioChunk(base64Audio) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: "audio/pcm;rate=16000",
          data: base64Audio
        }]
      }
    };
    this.ws.send(JSON.stringify(msg));
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // --- Chức năng phát âm thanh PCM (Gemini trả về chuẩn PCM 24000Hz) ---
  async playAudioChunk(base64Audio) {
    if (!this.audioContext) return;
    try {
      const binaryStr = window.atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      // Chuyển đổi PCM 16-bit sang Float32Array
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Audio decoding error:", e);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
