import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { generateRoadmapWithAgent } from '../agents/DiagnosticAgent';

export default function DiagnosticTest({ setActiveTab, setRoadmap, currentUser }) {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiagnosticQuestions();
  }, []);

  const fetchDiagnosticQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('exam_questions').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Lấy 6 câu Kanji, 6 câu Từ vựng, 6 câu Ngữ pháp, 6 câu Đọc hiểu, 6 câu Nghe hiểu
        const skills = ['kanji', 'vocabulary', 'grammar', 'reading', 'listening'];
        let selectedQuestions = [];
        
        for (const skill of skills) {
          const skillQuestions = data.filter(q => q.skill === skill);
          const shuffled = [...skillQuestions].sort(() => 0.5 - Math.random());
          selectedQuestions = [...selectedQuestions, ...shuffled.slice(0, 6)];
        }
        
        // Trộn tổng thể lại 1 lần nữa
        selectedQuestions.sort(() => 0.5 - Math.random());
        setQuestions(selectedQuestions);
      } else {
        setError('Không có dữ liệu câu hỏi trong ngân hàng đề.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi tải câu hỏi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionKey) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    const detailedResults = questions.map(q => {
      const isCorrect = userAnswers[q.id] === q.correct_option;
      if (isCorrect) correctCount++;
      return {
        skill: q.skill,
        level: q.level,
        isCorrect: isCorrect
      };
    });

    setSubmitting(true);
    try {
      const realRoadmap = await generateRoadmapWithAgent(detailedResults);
      
      // Calculate individual scores
      const getSkillScore = (skill) => {
        // Find questions that might match the skill loosely
        const skillQuestions = detailedResults.filter(r => r.skill && r.skill.toLowerCase().includes(skill.toLowerCase()));
        if (skillQuestions.length === 0) return 0;
        const correct = skillQuestions.filter(r => r.isCorrect).length;
        return Math.round((correct / skillQuestions.length) * 100);
      };

      // Save to database
      try {
        const userId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
        await supabase.from('user_exam_attempts').insert({
          user_id: userId,
          total_score: realRoadmap.score,
          passed: realRoadmap.score >= 50,
          ai_feedback: realRoadmap.overall_assessment,
          kanji_score: getSkillScore('kanji'),
          vocab_score: getSkillScore('vocab'),
          grammar_score: getSkillScore('grammar'),
          reading_score: getSkillScore('reading'),
          listening_score: getSkillScore('listening'),
          roadmap_json: realRoadmap,
          completed_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error("Failed to save exam attempt", dbErr);
      }

      setRoadmap(realRoadmap);
      setSubmitting(false);
      setActiveTab('lo-trinh');
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Có lỗi xảy ra khi AI đang phân tích lộ trình: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
          <Loader2 size={48} className="spin" style={{ margin: '0 auto 16px' }} />
          <h3>Đang khởi tạo bài Test đầu vào...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>AI đang bốc ngẫu nhiên 30 câu hỏi từ ngân hàng đề.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h3>{error}</h3>
        <button className="banner-btn-secondary" onClick={() => setActiveTab('trang-chu')} style={{ marginTop: '24px' }}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="action-btn" onClick={() => setActiveTab('trang-chu')} disabled={submitting}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="page-heading" style={{ margin: 0 }}>Đánh giá năng lực đầu vào</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Bài test 30 câu giúp AI xây dựng lộ trình cá nhân hóa</p>
          </div>
        </div>
        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
          Đã chọn: {Object.keys(userAnswers).length}/{questions.length}
        </div>
      </div>

      <div className="quiz-container">
        {submitting ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Sparkles size={64} color="var(--primary)" className="pulse" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ color: 'var(--text-main)', marginBottom: '16px' }}>Diagnostic & Planner Agent đang phân tích...</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
              Hệ thống đang chấm điểm và sử dụng AI để đánh giá điểm mạnh, điểm yếu của bạn. 
              Xin vui lòng chờ trong giây lát để nhận Lộ trình học cá nhân hóa.
            </p>
            <Loader2 size={32} className="spin" color="var(--primary)" style={{ margin: '32px auto 0' }} />
          </div>
        ) : (
          <>
            <div className="quiz-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {questions.map((q, index) => (
                <div key={q.id} className="quiz-question-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px', margin: 0 }}>
                      <span style={{ backgroundColor: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{index + 1}</span>
                      <span style={{ lineHeight: '1.4' }}>{q.question_text}</span>
                    </h3>
                    <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      Kỹ năng: {q.skill}
                    </span>
                  </div>
                  
                  {q.context_text && (
                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '15px', lineHeight: '1.6', border: '1px solid var(--border)' }}>
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
                      return (
                        <button 
                          key={opt}
                          className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleAnswerSelect(q.id, opt)}
                        >
                          <strong>{opt}</strong> 
                          <span>{q[`option_${opt.toLowerCase()}`] || ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="banner-btn-primary"
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length === 0}
                style={{ padding: '16px 48px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <Sparkles size={20} />
                Nộp bài & Phân tích lộ trình
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
