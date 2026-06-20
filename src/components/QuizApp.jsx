import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Book, BookOpen, Headphones, Edit3, ChevronLeft, AlertCircle, Lock, Clock, Sparkles, Loader2 } from 'lucide-react';

export default function QuizApp({ activeTab, setActiveTab }) {
  const [quizCounts, setQuizCounts] = useState({ kanji: 0, vocabulary: 0, grammar: 0, reading: 0, listening: 0 });
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [ragExplanations, setRagExplanations] = useState({});
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [ragErrorMsg, setRagErrorMsg] = useState(null);
  
  // Mock Exam States
  const [isMockExamLocked, setIsMockExamLocked] = useState(false); // Default to false for testing as requested
  const [examStage, setExamStage] = useState(null); // 'vocab', 'grammar_reading', 'listening', 'result'
  const [timeLeft, setTimeLeft] = useState(0);
  const [mockExamData, setMockExamData] = useState({ vocab: [], grammar_reading: [], listening: [] });
  const [mockExamScore, setMockExamScore] = useState({ vocab: 0, grammar_reading: 0, listening: 0, total: 0 });
  const [allMockWrongAnswers, setAllMockWrongAnswers] = useState([]);
  const [allMockTestResults, setAllMockTestResults] = useState([]);

  // Fetch quiz counts
  useEffect(() => {
    if (activeTab === 'bai-tap') {
      const fetchCounts = async () => {
        try {
          const { data, error } = await supabase.from('exam_questions').select('skill');
          if (data) {
            const counts = data.reduce((acc, curr) => {
              acc[curr.skill] = (acc[curr.skill] || 0) + 1;
              return acc;
            }, { kanji: 0, vocabulary: 0, grammar: 0, reading: 0, listening: 0 });
            setQuizCounts(counts);
          }
        } catch (e) { console.error(e); }
      };
      fetchCounts();
    }
  }, [activeTab]);

  // Mock Exam Timer
  useEffect(() => {
    let timer;
    if (activeTab === 'mock_exam' && examStage !== 'result' && examStage !== null && timeLeft > 0 && !quizLoading) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (activeTab === 'mock_exam' && examStage !== 'result' && examStage !== null && timeLeft === 0 && !quizLoading) {
      handleNextMockStage();
    }
    return () => clearInterval(timer);
  }, [timeLeft, activeTab, examStage, quizLoading]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startQuiz = async (skill) => {
    setQuizLoading(true);
    setCurrentSkill(skill === 'random' ? 'Kiểm tra tổng hợp' : skill);
    setActiveTab('quiz');
    setQuizScore(null);
    setIsQuizSubmitted(false);
    setUserAnswers({});
    setRagExplanations({});
    
    try {
      let queryData = [];
      if (skill === 'random') {
        const { data, error } = await supabase.from('exam_questions').select('*');
        if (data) queryData = data;
      } else {
        const { data, error } = await supabase.from('exam_questions').select('*').eq('skill', skill);
        if (data) queryData = data;
      }

      if (queryData && queryData.length > 0) {
        const limit = skill === 'random' ? 50 : 20;
        setActiveQuizQuestions(queryData.sort(() => 0.5 - Math.random()).slice(0, limit));
      } else {
        setActiveQuizQuestions([]);
      }
    } catch (e) { console.error(e); }
    setQuizLoading(false);
  };

  const startMockExam = async () => {
    if (isMockExamLocked) return;
    setQuizLoading(true);
    setCurrentSkill('Đề thi thử JLPT N5');
    setActiveTab('mock_exam');
    setExamStage('vocab');
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setMockExamScore({ vocab: 0, grammar_reading: 0, listening: 0, total: 0 });
    setAllMockWrongAnswers([]);
    setAllMockTestResults([]);
    setRagExplanations({});

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let vocabLimit = 35, grammarLimit = 26, readingLimit = 6, listeningLimit = 24;

      if (session?.user?.id) {
        const { data: configData } = await supabase.from('user_exam_configs').select('*').eq('user_id', session.user.id).single();
        if (configData) {
          vocabLimit = (configData.v_m1||12) + (configData.v_m2||8) + (configData.v_m3||10) + (configData.v_m4||5);
          grammarLimit = (configData.g_m1||16) + (configData.g_m2||5) + (configData.g_m3||5);
          readingLimit = (configData.r_m1||3) + (configData.r_m2||2) + (configData.r_m3||1);
          listeningLimit = (configData.l_m1||7) + (configData.l_m2||6) + (configData.l_m3||5) + (configData.l_m4||6);
        }
      }

      const { data: vocabData } = await supabase.from('exam_questions').select('*').eq('skill', 'vocabulary');
      const { data: grammarData } = await supabase.from('exam_questions').select('*').eq('skill', 'grammar');
      const { data: readingData } = await supabase.from('exam_questions').select('*').eq('skill', 'reading');
      const { data: listeningData } = await supabase.from('exam_questions').select('*').eq('skill', 'listening');

      // Fetch limits based on config
      const shuffledVocab = (vocabData || []).sort(() => 0.5 - Math.random()).slice(0, vocabLimit);
      const shuffledGrammar = (grammarData || []).sort(() => 0.5 - Math.random()).slice(0, grammarLimit);
      const shuffledReading = (readingData || []).sort(() => 0.5 - Math.random()).slice(0, readingLimit);
      const shuffledListening = (listeningData || []).sort(() => 0.5 - Math.random()).slice(0, listeningLimit);

      const grammarReadingCombined = [...shuffledGrammar, ...shuffledReading];

      setMockExamData({
        vocab: shuffledVocab,
        grammar_reading: grammarReadingCombined,
        listening: shuffledListening
      });
      
      setActiveQuizQuestions(shuffledVocab);
      setTimeLeft(20 * 60); // 20 minutes for vocab
    } catch (e) { console.error(e); }
    setQuizLoading(false);
  };

  const handleNextMockStage = async () => {
    // Tích lũy kết quả của stage hiện tại
    let correctCount = 0;
    const currentWrongQs = [];
    const currentTestResultsRaw = [];

    activeQuizQuestions.forEach(q => { 
      const isCorrect = userAnswers[q.id] === q.correct_option;
      currentTestResultsRaw.push({ skill: q.skill, isCorrect: isCorrect });

      if (isCorrect) {
        correctCount++; 
      } else {
        currentWrongQs.push({ ...q, user_answer: userAnswers[q.id] || "Không chọn đáp án" });
      }
    });
    
    setAllMockWrongAnswers(prev => [...prev, ...currentWrongQs]);
    setAllMockTestResults(prev => [...prev, ...currentTestResultsRaw]);

    // Simplistic scoring (1 point per question) for display purposes
    const currentStageScore = correctCount; 
    const newScore = { ...mockExamScore, [examStage]: currentStageScore };
    setMockExamScore(newScore);

    if (examStage === 'vocab') {
      setExamStage('grammar_reading');
      setActiveQuizQuestions(mockExamData.grammar_reading);
      setTimeLeft(40 * 60); // 40 mins
      setUserAnswers({}); // Clear cho section sau
    } else if (examStage === 'grammar_reading') {
      setExamStage('listening');
      setActiveQuizQuestions(mockExamData.listening);
      setTimeLeft(30 * 60); // 30 mins
      setUserAnswers({}); // Clear cho section sau
    } else if (examStage === 'listening') {
      setExamStage('result');
      setIsQuizSubmitted(true);
      
      const finalTotal = newScore.vocab + newScore.grammar_reading + newScore.listening;
      newScore.total = finalTotal;
      setMockExamScore(newScore);
      
      const finalWrongQs = [...allMockWrongAnswers, ...currentWrongQs];
      const finalTestResultsRaw = [...allMockTestResults, ...currentTestResultsRaw];

      // Gộp lại toàn bộ câu hỏi để hiển thị ở Result
      const allQuestions = [...mockExamData.vocab, ...mockExamData.grammar_reading, ...mockExamData.listening];
      setActiveQuizQuestions(allQuestions);

      // Chạy RAG chấm câu sai
      if (finalWrongQs.length > 0) {
        setIsRagLoading(true);
        try {
          const response = await fetch('http://localhost:3000/api/agents/feedback-rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercise_type: 'quiz', wrongQs: finalWrongQs })
          });
          const explanations = await response.json();
          const explanationsMap = {};
          explanations.forEach(ex => {
            explanationsMap[ex.question_id] = ex.ai_explanation;
          });
          setRagExplanations(explanationsMap);
          setRagErrorMsg(null);
        } catch (err) {
          console.error("Mock RAG Error:", err);
          setRagErrorMsg(err.message || String(err));
        } finally {
          setIsRagLoading(false);
        }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          let finalRoadmap = null;
          
          // Chạy LangGraph điều chỉnh lộ trình giống Kiểm tra tổng quát
          setIsRagLoading(true);
          try {
            const { data: oldAttempts } = await supabase.from('user_exam_attempts')
              .select('roadmap_json').eq('user_id', session.user.id).not('roadmap_json', 'is', null)
              .order('created_at', { ascending: false }).limit(1);
            
            const currentRoadmap = oldAttempts?.[0]?.roadmap_json || { weaknesses: [], strengths: [] };
            
            const response = await fetch('http://localhost:3000/api/agents/monitor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recent_activities: { currentRoadmap, testResults: finalTestResultsRaw } })
            });
            const result = await response.json();
            // result.message contains JSON string of roadmap because we adjusted monitor API to just return text or we need to parse it
            finalRoadmap = JSON.parse(result.message);

            // Ghi đè next_day_recommendation vào config
            if (finalRoadmap && finalRoadmap.next_quiz_config && finalRoadmap.next_quiz_config.reason) {
               await supabase.from('user_exam_configs').upsert({
                 user_id: session.user.id,
                 next_day_recommendation: finalRoadmap.next_quiz_config.reason
               });
            }
          } catch (graphErr) {
            console.error("Mock LangGraph Error:", graphErr);
          } finally {
            setIsRagLoading(false);
          }

          const insertPayload = { 
            user_id: session.user.id, 
            total_score: finalTotal, 
            passed: finalTotal >= 45, 
            ai_feedback: 'Đã hoàn thành đề thi thử N5.' 
          };
          
          if (finalRoadmap) {
            insertPayload.roadmap_json = finalRoadmap;
            insertPayload.ai_feedback = "Mock N5 LangGraph: " + (finalRoadmap.overall_assessment || 'Đã điều chỉnh lộ trình');
          }

          await supabase.from('user_exam_attempts').insert([insertPayload]);
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleAnswerSelect = (questionId, optionKey) => setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    const wrongQs = [];
    const testResultsRaw = [];
    
    activeQuizQuestions.forEach(q => { 
      const isCorrect = userAnswers[q.id] === q.correct_option;
      testResultsRaw.push({ skill: q.skill, isCorrect: isCorrect });

      if (isCorrect) {
        correctCount++; 
      } else {
        wrongQs.push({ ...q, user_answer: userAnswers[q.id] || "Không chọn đáp án" });
      }
    });
    
    const score = correctCount * 5;
    setQuizScore(score);
    setIsQuizSubmitted(true);
    
    // RAG Evaluation for wrong answers
    if (wrongQs.length > 0) {
      setIsRagLoading(true);
        try {
          const response = await fetch('http://localhost:3000/api/agents/feedback-rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercise_type: 'quiz', wrongQs: wrongQs })
          });
          const explanations = await response.json();
          const explanationsMap = {};
          explanations.forEach(ex => {
            explanationsMap[ex.question_id] = ex.ai_explanation;
          });
          setRagExplanations(explanationsMap);
          setRagErrorMsg(null);
        } catch (err) {
          console.error("RAG Error:", err);
          setRagErrorMsg(err.message || String(err));
        } finally {
          setIsRagLoading(false);
        }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        let finalRoadmap = null;

        // Vòng lặp LangGraph: Chỉ kích hoạt khi làm bài Kiểm tra tổng hợp
        if (currentSkill === 'Kiểm tra tổng hợp') {
          setIsRagLoading(true); // mượn UI loading
          try {
            // Lấy lộ trình cũ nhất
            const { data: oldAttempts } = await supabase.from('user_exam_attempts')
              .select('roadmap_json').eq('user_id', session.user.id).not('roadmap_json', 'is', null)
              .order('created_at', { ascending: false }).limit(1);
            
            const currentRoadmap = oldAttempts?.[0]?.roadmap_json || { weaknesses: [], strengths: [] };
            
            const response = await fetch('http://localhost:3000/api/agents/monitor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recent_activities: { currentRoadmap, testResults: testResultsRaw } })
            });
            const result = await response.json();
            
            finalRoadmap = JSON.parse(result.message);
          } catch (graphErr) {
            console.error("LangGraph Evolution Error:", graphErr);
          } finally {
            setIsRagLoading(false);
          }
        }

        const insertPayload = { 
          user_id: session.user.id, 
          total_score: score, 
          passed: score >= 60, 
          ai_feedback: 'Đã hoàn thành bài tập trắc nghiệm.' 
        };
        if (finalRoadmap) {
          insertPayload.roadmap_json = finalRoadmap;
          insertPayload.ai_feedback = "LangGraph: " + (finalRoadmap.overall_assessment || 'Đã điều chỉnh lộ trình');
        }

        await supabase.from('user_exam_attempts').insert([insertPayload]);
      }
    } catch (err) { console.error(err); }
  };

  const getStageTitle = (stage) => {
    if (stage === 'vocab') return 'Phần 1: Từ vựng (20 phút)';
    if (stage === 'grammar_reading') return 'Phần 2: Ngữ pháp & Đọc hiểu (40 phút)';
    if (stage === 'listening') return 'Phần 3: Nghe hiểu (30 phút)';
    return '';
  };

  const renderQuestions = () => {
    return (
      <div className="quiz-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {activeQuizQuestions.map((q, index) => (
          <div key={q.id} className="quiz-question-card">
            <h3 style={{ marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{index + 1}</span>
              <span style={{ lineHeight: '1.4' }}>{q.question_text}</span>
            </h3>
            
            {q.context_text && (
              <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '15px', lineHeight: '1.6', border: '1px solid var(--border)' }}>
                {q.context_text}
              </div>
            )}
            
            {q.image_url && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img src={q.image_url} alt="Question Context" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
              </div>
            )}
            
            {q.audio_url && (
              <div style={{ marginBottom: '20px' }}>
                <audio controls src={q.audio_url} style={{ width: '100%', outline: 'none' }}></audio>
              </div>
            )}

            <div className="quiz-options">
              {['A', 'B', 'C', 'D'].map(opt => {
                const isSelected = userAnswers[q.id] === opt;
                const isCorrect = q.correct_option === opt;
                let btnClass = "quiz-option-btn";
                
                if (isSelected) btnClass += " selected";
                if (isQuizSubmitted && activeTab !== 'mock_exam') {
                  if (isCorrect) btnClass += " correct";
                  else if (isSelected && !isCorrect) btnClass += " wrong";
                }

                return (
                  <button 
                    key={opt}
                    className={btnClass}
                    disabled={isQuizSubmitted || (activeTab === 'mock_exam' && examStage === 'result')}
                    onClick={() => handleAnswerSelect(q.id, opt)}
                  >
                    <strong>{opt}</strong> 
                    <span>{q[`option_${opt.toLowerCase()}`] || ''}</span>
                  </button>
                );
              })}
            </div>
            
            {isQuizSubmitted && activeTab !== 'mock_exam' && q.explanation && !ragExplanations[q.id] && (
              <div className="promo-box" style={{ marginTop: '24px', backgroundColor: 'var(--accent-blue-bg)', borderColor: 'var(--accent-blue-border)' }}>
                <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '8px' }}>💡 Giải thích gốc:</strong> 
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{q.explanation}</p>
              </div>
            )}
            
            {/* RAG AI Explanation */}
            {isQuizSubmitted && activeTab !== 'mock_exam' && userAnswers[q.id] !== q.correct_option && (
              <div className="promo-box" style={{ marginTop: '24px', backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}>
                <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} /> Giải thích từ AI Mentor (RAG Database)
                </strong> 
                {isRagLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <Loader2 size={16} className="spin" /> AI đang lục tìm Database và nhận xét...
                  </div>
                ) : ragExplanations[q.id] ? (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ragExplanations[q.id]}</p>
                ) : (
                  <p style={{ color: 'var(--error)', lineHeight: '1.6', fontSize: '14px' }}>
                    ⚠️ AI Mentor gặp lỗi: {ragErrorMsg || "Không thể trích xuất giải thích. (Có thể do lỗi mạng hoặc LLM JSON Error)."}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (activeTab === 'bai-tap') {
    return (
      <div className="page-wrapper">
        <div className="page-intro">
          <h2 className="page-heading">Thư viện bài tập tương tác</h2>
          <p className="page-subheading">Lựa chọn một kỹ năng bên dưới để bắt đầu luyện tập với dữ liệu từ Supabase.</p>
        </div>
        <div className="skills-grid">
          {/* Mock Exam Card */}
          <div className="skill-card" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary-bg)' }}>
            <div className="skill-header">
              <div className="skill-icon" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                {isMockExamLocked ? <Lock size={18}/> : <Clock size={18}/>}
              </div>
              <span className="skill-progress-text" style={{ color: 'var(--primary)', fontWeight: '600' }}>90 Phút</span>
            </div>
            <div className="skill-info">
              <span className="skill-name" style={{ color: 'var(--primary)' }}>Đề thi JLPT N5</span>
              <p className="skill-desc">Đề thi thử mô phỏng kỳ thi JLPT thực tế. Gồm 3 phần thi liên tục.</p>
            </div>
            <button 
              className="skill-btn" 
              style={isMockExamLocked ? { backgroundColor: 'var(--border)', color: 'var(--text-secondary)' } : { backgroundColor: 'var(--primary)', color: 'white' }}
              onClick={startMockExam} 
              disabled={isMockExamLocked}
            >
              {isMockExamLocked ? 'Khóa (Còn 6 ngày)' : 'Bắt đầu thi'}
            </button>
          </div>

          <div className="skill-card">
            <div className="skill-header">
              <div className="skill-icon"><Book size={18}/></div>
              <span className="skill-progress-text">{Object.values(quizCounts).reduce((a, b) => a + b, 0)} câu</span>
            </div>
            <div className="skill-info">
              <span className="skill-name">Kiểm tra tổng hợp</span>
              <p className="skill-desc">Làm bài test 50 câu xen kẽ ngẫu nhiên từ tất cả các kỹ năng.</p>
            </div>
            <button className="skill-btn" onClick={() => startQuiz('random')} disabled={Object.values(quizCounts).reduce((a, b) => a + b, 0) === 0}>
              {Object.values(quizCounts).reduce((a, b) => a + b, 0) === 0 ? 'Chưa có câu hỏi' : 'Bắt đầu'}
            </button>
          </div>
          {['grammar', 'vocabulary', 'reading', 'listening', 'kanji'].map((skill, idx) => {
            const icons = [<Book size={18}/>, <BookOpen size={18}/>, <BookOpen size={18}/>, <Headphones size={18}/>, <Edit3 size={18}/>];
            const names = ['Ngữ pháp', 'Từ vựng', 'Đọc hiểu', 'Nghe hiểu', 'Kanji'];
            return (
              <div className="skill-card" key={skill}>
                <div className="skill-header">
                  <div className="skill-icon">{icons[idx]}</div>
                  <span className="skill-progress-text">{quizCounts[skill] || 0} câu</span>
                </div>
                <div className="skill-info">
                  <span className="skill-name">Luyện tập {names[idx]}</span>
                  <p className="skill-desc">Bộ câu hỏi trắc nghiệm khách quan để ôn luyện kỹ năng.</p>
                </div>
                <button className="skill-btn" onClick={() => startQuiz(skill)} disabled={!quizCounts[skill] || quizCounts[skill] === 0}>
                  {(!quizCounts[skill] || quizCounts[skill] === 0) ? 'Chưa có câu hỏi' : 'Bắt đầu'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'quiz') {
    return (
      <div className="page-wrapper">
        <div className="page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="action-btn" onClick={() => setActiveTab('bai-tap')}>
            <ChevronLeft size={24} />
          </button>
          <h2 className="page-heading" style={{ margin: 0 }}>Luyện tập: {currentSkill}</h2>
        </div>
        {quizLoading ? (
          <div className="quiz-container" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Đang tải câu hỏi...</h3>
          </div>
        ) : activeQuizQuestions.length === 0 ? (
          <div className="quiz-container" style={{ textAlign: 'center', padding: '40px' }}>
            <AlertCircle size={48} color="var(--text-light)" style={{ marginBottom: '16px' }} />
            <h3>Không có câu hỏi</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Chưa có câu hỏi nào trong ngân hàng dữ liệu cho mục này.</p>
          </div>
        ) : (
          <div className="quiz-container">
            {isQuizSubmitted && (
              <div className="promo-box" style={{ marginBottom: '24px', backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>🎉 Chúc mừng! Đã hoàn thành</h3>
                <p>Bạn đã hoàn thành bài tập với số điểm: <strong>{quizScore}/100</strong></p>
              </div>
            )}
            
            {renderQuestions()}
            
            {!isQuizSubmitted && activeQuizQuestions.length > 0 && (
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  className="banner-btn-primary"
                  onClick={handleSubmitQuiz}
                  style={{ padding: '16px 48px', fontSize: '16px' }}
                >
                  Nộp bài & Xem kết quả
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'mock_exam') {
    return (
      <div className="page-wrapper">
        <div className="page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="page-heading" style={{ margin: 0 }}>Đề thi thử JLPT N5</h2>
          {examStage !== 'result' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
              <Clock size={20} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {quizLoading ? (
          <div className="quiz-container" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Đang tải đề thi...</h3>
          </div>
        ) : examStage === 'result' ? (
          <div className="quiz-container">
             <div className="promo-box" style={{ marginBottom: '24px', backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--success)', marginBottom: '16px' }}>🎉 Hoàn thành kỳ thi thử!</h2>
                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '24px 0' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Từ vựng</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{mockExamScore.vocab}/35</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ngữ pháp & Đọc</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{mockExamScore.grammar_reading}/32</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nghe hiểu</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{mockExamScore.listening}/24</div>
                  </div>
                </div>
                <h3 style={{ fontSize: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--success-border)' }}>
                  Tổng điểm: {mockExamScore.total} / 91
                </h3>
                <button 
                  className="banner-btn-primary"
                  onClick={() => setActiveTab('bai-tap')}
                  style={{ padding: '12px 32px', fontSize: '16px', marginTop: '24px' }}
                >
                  Trở về Danh mục Bài tập
                </button>
              </div>
          </div>
        ) : (
          <div className="quiz-container">
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '18px' }}>{getStageTitle(examStage)}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Lưu ý: Hệ thống sẽ tự động nộp bài phần này và chuyển sang phần tiếp theo khi hết thời gian.</p>
            </div>
            
            {renderQuestions()}
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="banner-btn-primary"
                onClick={handleNextMockStage}
                style={{ padding: '16px 48px', fontSize: '16px' }}
              >
                {examStage === 'listening' ? 'Nộp bài thi' : 'Hoàn thành phần thi & Chuyển tiếp'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
