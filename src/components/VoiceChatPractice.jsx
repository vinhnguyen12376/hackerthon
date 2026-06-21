import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, MessageSquare, Sparkles, PhoneOff } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const VoiceChatPractice = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, listening, processing, speaking, error
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const genAIRef = useRef(null);
  const chatSessionRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      handleDisconnect();
    };
  }, []);

  const handleConnect = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Thiếu GEMINI_API_KEY trong file .env!");
      return;
    }

    // Khởi tạo Gemini 2.5 Flash Text Model thay vì WebSocket
    if (!genAIRef.current) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: "Bạn là Sakura, cô gái Nhật Bản 22 tuổi thân thiện. Hãy nói chuyện ngắn gọn, thân thiện bằng tiếng Nhật ở mức độ N5, thi thoảng chèn thêm 1-2 từ tiếng Việt hoặc tiếng Anh nhẹ nhàng. Phản hồi của bạn sẽ được đọc qua máy tính, nên hãy giữ câu văn thật ngắn (dưới 2 câu) và dễ nghe."
        });
        chatSessionRef.current = model.startChat({
          history: [],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
        });
        genAIRef.current = genAI;
      } catch (e) {
        console.error("Lỗi khởi tạo Gemini:", e);
        alert("Lỗi khởi tạo Gemini API: " + e.message);
        return;
      }
    }

    // Khởi tạo Speech Recognition (Nhận diện giọng nói)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome hoặc Edge.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ja-JP'; // Ưu tiên nghe tiếng Nhật (có thể đổi sang 'vi-VN' nếu muốn nghe tiếng Việt)
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      if (!isComponentMounted.current) return;
      setConnectionStatus('listening');
    };

    recognitionRef.current.onspeechend = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Mic error:", event.error);
      if (event.error !== 'no-speech') {
        setConnectionStatus('error');
      } else {
        // Nếu không nghe thấy gì thì thử nghe lại
        if (connectionStatus === 'listening') {
          setTimeout(() => {
            if (connectionStatus === 'listening' && recognitionRef.current) {
               try { recognitionRef.current.start(); } catch(e){}
            }
          }, 500);
        }
      }
    };

    recognitionRef.current.onresult = async (event) => {
      if (!isComponentMounted.current) return;
      const transcript = event.results[0][0].transcript;
      
      // Thêm tin nhắn của user
      setMessages(prev => [...prev, { id: Date.now(), text: transcript, sender: 'user' }]);
      setConnectionStatus('processing');

      try {
        // Gửi lên Gemini Text Model
        const result = await chatSessionRef.current.sendMessage(transcript);
        const aiText = result.response.text();
        
        if (!isComponentMounted.current) return;
        setMessages(prev => [...prev, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);
        
        // Đọc câu trả lời bằng Text-to-Speech
        speakText(aiText);

      } catch (e) {
        console.error("Lỗi gọi Gemini:", e);
        setConnectionStatus('error');
      }
    };

    // Bắt đầu nghe
    try {
      recognitionRef.current.start();
    } catch(e) {
      console.error("Lỗi bật Mic", e);
    }
  };

  const speakText = (text) => {
    setConnectionStatus('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; // Đọc tiếng Nhật
    utterance.rate = 0.9;     // Đọc hơi chậm 1 chút cho dễ nghe
    utterance.pitch = 1.1;    // Giọng nữ cao

    utterance.onend = () => {
      if (!isComponentMounted.current) return;
      // Đọc xong thì tự động bật Mic nghe tiếp
      if (connectionStatus !== 'disconnected') {
        setTimeout(() => {
          if (recognitionRef.current && isComponentMounted.current && connectionStatus !== 'disconnected') {
            try { 
              recognitionRef.current.start(); 
            } catch(e){
              setConnectionStatus('error');
            }
          }
        }, 300);
      }
    };

    utterance.onerror = (e) => {
      console.error("Lỗi phát âm thanh:", e);
      setConnectionStatus('error');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel(); // Dừng đọc
  };

  return (
    <div className="split-layout">
      {/* Cột trái: Trạng thái & Micro */}
      <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-intro">
          <h2 className="page-heading">Đàm thoại 2 chiều (Voice Chatbot)</h2>
          <p className="page-subheading">Trò chuyện tiếng Nhật với AI Mentor Sakura thông qua công nghệ Nhận diện giọng nói siêu tiết kiệm, không bao giờ lo bị chặn API Key!</p>
        </div>

        <div className="focus-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '32px' }}>
          
          <div style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {connectionStatus !== 'disconnected' ? (
              <button 
                onClick={handleDisconnect}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 0 16px rgba(239, 68, 68, 0.2)',
                  animation: connectionStatus === 'listening' ? 'pulse 2s infinite' : 'none',
                  zIndex: 10
                }}
                title="Bấm để ngắt kết nối"
              >
                {connectionStatus === 'processing' ? <Loader2 size={48} className="spin" /> : <PhoneOff size={48} />}
              </button>
            ) : (
              <button 
                onClick={handleConnect}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(60, 48, 211, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  zIndex: 10
                }}
                title="Bấm để kết nối"
              >
                <Mic size={48} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              color: connectionStatus === 'listening' ? '#10b981' : 
                     connectionStatus === 'processing' ? '#f59e0b' : 
                     connectionStatus === 'speaking' ? '#3b82f6' :
                     connectionStatus === 'error' ? '#ef4444' : 'var(--text-secondary)'
            }}>
              {connectionStatus === 'disconnected' ? 'Đã ngắt kết nối' :
               connectionStatus === 'listening' ? 'Đang nghe (Hãy nói tiếng Nhật)...' :
               connectionStatus === 'processing' ? 'Sakura đang suy nghĩ...' :
               connectionStatus === 'speaking' ? 'Sakura đang trả lời...' :
               'Lỗi Micro / Lỗi API'}
            </span>
            <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>
              {connectionStatus === 'listening' ? 'Hãy nói "Konnichiwa" (こんにちは)' : 
               connectionStatus !== 'disconnected' ? 'Vui lòng đợi một chút...' : 
               'Bấm vào biểu tượng Micro để gọi cho Sakura.'}
            </p>
          </div>

        </div>
      </div>

      {/* Cột phải: Khung tin nhắn */}
      <div className="sidebar-column" style={{ padding: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageSquare size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Nội dung cuộc trò chuyện</h3>
        </div>

        <div style={{
          flexGrow: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--bg-main)'
        }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', gap: '12px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: '50%' }}>
                <Sparkles size={24} color="var(--primary)" />
              </div>
              <p>Chưa có đoạn hội thoại nào.<br/>Nhấn kết nối và bắt đầu nói chuyện với AI Sensei!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                  maxWidth: '85%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: msg.sender === 'ai' ? '1px solid var(--border)' : 'none',
                  position: 'relative'
                }}
              >
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>{msg.text}</p>
                {msg.sender === 'ai' && (
                  <span style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '20px' }}>🌸</span>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default VoiceChatPractice;
