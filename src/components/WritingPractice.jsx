import React, { useState, useEffect } from 'react';
import { analyzeWritingWithAgent } from '../agents/FeedbackRAGAgent';
import { Loader2, CheckCircle, AlertCircle, Sparkles, BookOpen, ChevronRight, X, PenTool, Search } from 'lucide-react';

export default function WritingPractice({ setActiveTab }) {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errors, setErrors] = useState([]);
  const [activeError, setActiveError] = useState(null);
  
  const checkErrors = async () => {
    if (text.trim().length < 10) {
      setErrors([]);
      setActiveError(null);
      return;
    }
    
    setIsChecking(true);
    try {
      const foundErrors = await analyzeWritingWithAgent(text);
      setErrors(foundErrors);
      if (activeError && !foundErrors.find(e => e.wrong_text === activeError.wrong_text)) {
        setActiveError(null);
      }
    } catch (err) {
      console.error("Lỗi từ WritingAgent:", err);
      setErrors([{
        wrong_text: text,
        suggestion: "Lỗi hệ thống",
        explanation: "Có lỗi khi gọi AI: " + err.message,
        theory_category: "vocab"
      }]);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      checkErrors();
    }
  };

  const handleTextareaClick = (e) => {
    const cursorPos = e.target.selectionStart;
    const fullText = e.target.value;
    
    let clickedError = null;
    for (let err of errors) {
      let startIndex = 0;
      let index;
      while ((index = fullText.indexOf(err.wrong_text, startIndex)) > -1) {
        const endIndex = index + err.wrong_text.length;
        if (cursorPos >= index && cursorPos <= endIndex) {
          clickedError = err;
          break;
        }
        startIndex = endIndex;
      }
      if (clickedError) break;
    }

    if (clickedError) {
      setActiveError(clickedError);
    } else {
      setActiveError(null);
    }
  };

  const renderHighlightedText = () => {
    if (!text) return null;
    let htmlText = text;
    
    htmlText = htmlText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    errors.forEach(err => {
      const safeWrongText = err.wrong_text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const regex = new RegExp(safeWrongText, 'g');
      htmlText = htmlText.replace(regex, `<span class="writing-error-highlight">$&</span>`);
    });

    return htmlText;
  };

  return (
    <div className="split-layout">
      {/* Left Area: Editor */}
      <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="page-intro">
          <h2 className="page-heading">Luyện Viết Tiếng Nhật (Writing Lab)</h2>
          <p className="page-subheading">Hãy viết đoạn văn tiếng Nhật của bạn vào đây. AI Sensei sẽ theo dõi và chỉ ra các lỗi sai ngữ pháp, từ vựng theo thời gian thực.</p>
        </div>

        {/* Editor Container */}
        <div className="focus-card" style={{ flexGrow: 1, padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '14px' }}>
              <PenTool size={18} /> Soạn thảo văn bản
            </div>
            
            <div>
              {isChecking ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-light)', fontWeight: 700 }}>
                  <Loader2 size={16} className="spin" /> AI đang phân tích...
                </span>
              ) : errors.length > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--error)', fontWeight: 700 }}>
                  <AlertCircle size={16} /> Phát hiện {errors.length} lỗi
                </span>
              ) : text.length > 10 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--success)', fontWeight: 700 }}>
                  <CheckCircle size={16} /> Không có lỗi nào
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ position: 'relative', flexGrow: 1 }}>
            {/* Underlay for Highlights */}
            <div 
              className="writing-underlay"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                padding: '24px',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                color: 'transparent',
                pointerEvents: 'none', 
                overflowY: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
            />

            {/* Actual Textarea */}
            <textarea
              className="writing-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaClick}
              onKeyDown={handleKeyDown}
              placeholder="Bắt đầu viết tiếng Nhật vào đây... (Ví dụ: 私を学生です)"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                width: '100%', height: '100%',
                padding: '24px',
                border: 'none',
                background: 'transparent', 
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.8',
                resize: 'none',
                outline: 'none',
                zIndex: 5
              }}
            />
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 600 }}>{text.length} ký tự</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>Bấm Enter để kiểm tra</span>
              <button 
                onClick={checkErrors} 
                disabled={isChecking || text.length < 10}
                className="banner-btn-primary" 
                style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isChecking ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                Kiểm tra lỗi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Theory Panel */}
      <div className="sidebar-column">
        {activeError ? (
          <div className="focus-card" style={{ padding: '24px', gap: '16px', border: '2px solid var(--error)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontWeight: 800 }}>
                <AlertCircle size={20} /> 
                Phát hiện lỗi sai
              </h3>
              <button className="action-btn" onClick={() => setActiveError(null)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>Bạn đã viết:</span>
               <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', color: 'var(--error)', textDecoration: 'line-through', fontSize: '15px', fontWeight: 600 }}>
                 {activeError.wrong_text}
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>AI Sensei đề xuất:</span>
               <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '15px', fontWeight: 800 }}>
                 {activeError.suggestion}
               </div>
               <button 
                className="action-filled-btn" 
                style={{ marginTop: '8px', width: '100%', padding: '10px', fontSize: '14px' }}
                onClick={() => {
                  setText(text.replace(activeError.wrong_text, activeError.suggestion));
                  setActiveError(null);
                }}
              >
                Sửa lỗi tự động
              </button>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Giải thích chi tiết:</span>
              <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, color: 'var(--text-primary)' }}>
                {activeError.explanation}
              </p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="banner-btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BookOpen size={16} /> Xem Lý thuyết ({activeError.theory_category})
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '24px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', border: '1px solid rgba(60, 48, 211, 0.1)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(60, 48, 211, 0.1)' }}>
                <Sparkles size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>AI Sensei đang túc trực</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Hãy cứ tự do viết tiếng Nhật! Các lỗi sai ngữ pháp, cách dùng từ sẽ được gạch chân đỏ. Bấm vào chữ đỏ để xem giải thích chi tiết.
                </p>
              </div>
            </div>

            <div className="focus-card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.5px', marginBottom: '16px' }}>
                Mẹo luyện viết hiệu quả
              </h4>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                <li>Luôn chú ý đến trợ từ (を, に, が, で) vì đây là lỗi phổ biến nhất.</li>
                <li>Hạn chế dùng Google Translate quá nhiều, hãy tự cấu trúc câu.</li>
                <li>Dùng thể lịch sự (です/ます) khi chưa quen với thể thông thường.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
