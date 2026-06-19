import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, MessageSquare, Sparkles, PhoneOff } from 'lucide-react';
import { GeminiLiveClient } from '../utils/geminiLiveApi';

const VoiceChatPractice = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const messagesEndRef = useRef(null);
  const clientRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  const handleConnect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setConnectionStatus('connecting');
    
    clientRef.current = new GeminiLiveClient(
      (text, sender) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
      },
      (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          // Bật mic ngay khi connected
          clientRef.current.startMicrophone();
        }
      }
    );
    
    try {
      await clientRef.current.connect();
    } catch (err) {
      console.error(err);
      setConnectionStatus('error');
    }
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setConnectionStatus('disconnected');
  };

  return (
    <div className="split-layout">
      {/* Cột trái: Trạng thái & Micro */}
      <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-intro">
          <h2 className="page-heading">Đàm thoại 2 chiều (Voice Chatbot)</h2>
          <p className="page-subheading">Hãy trò chuyện tiếng Nhật với AI Mentor Sakura! Kết nối qua Gemini Live API cho trải nghiệm đàm thoại liên tục theo thời gian thực (Realtime).</p>
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
            {connectionStatus === 'connected' ? (
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
                  animation: 'pulse 2s infinite',
                  zIndex: 10
                }}
                title="Bấm để ngắt kết nối"
              >
                <PhoneOff size={48} />
              </button>
            ) : (
              <button 
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting'}
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
                  cursor: connectionStatus === 'connecting' ? 'wait' : 'pointer',
                  boxShadow: '0 10px 25px rgba(60, 48, 211, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  zIndex: 10
                }}
                title="Bấm để kết nối"
              >
                {connectionStatus === 'connecting' ? <Loader2 size={48} className="spin" /> : <Mic size={48} />}
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              color: connectionStatus === 'connected' ? '#10b981' : 
                     connectionStatus === 'connecting' ? '#f59e0b' : 
                     connectionStatus === 'error' ? '#ef4444' : 'var(--text-secondary)'
            }}>
              {connectionStatus === 'disconnected' ? 'Đang ngắt kết nối' :
               connectionStatus === 'connecting' ? 'Đang kết nối WebSockets...' :
               connectionStatus === 'error' ? 'Lỗi kết nối API' :
               'Đã kết nối! Bạn có thể nói ngay.'}
            </span>
            <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>
              {connectionStatus === 'connected' ? 'Microphone của bạn đang mở liên tục. Hãy nói "Konnichiwa" và đợi phản hồi nhé!' : 'Bấm vào biểu tượng Micro để gọi cho Sakura.'}
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
