import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Loader2, Bookmark, Hash, BookOpen } from 'lucide-react';

export default function TheoryViewer({ theoryCategory, setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  
  // For pagination / load more if needed
  const [limit, setLimit] = useState(50);
  
  useEffect(() => {
    // Reset state when category changes
    setSelectedLesson(null);
    setSelectedLevel('N5');
    setData([]);
    setLimit(50);
  }, [theoryCategory]);

  useEffect(() => {
    if (theoryCategory === 'counter') {
      fetchCounterData();
    } else {
      if (!selectedLesson) {
        fetchLessons();
      } else {
        fetchLessonData();
      }
    }
  }, [theoryCategory, selectedLesson, limit, selectedLevel]);

  async function fetchLessons() {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('lessons')
        .select('*')
        .eq('level', selectedLevel)
        .order('lesson_number');
      if (res) setLessons(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchCounterData() {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.from('counter_categories').select('*, counter_items(*)').limit(limit);
      if (res) setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchLessonData() {
    setLoading(true);
    try {
      if (theoryCategory === 'vocab') {
        const { data: res, error } = await supabase.from('lesson_vocabularies')
          .select('vocabularies(*)')
          .eq('lesson_id', selectedLesson.id)
          .limit(limit);
        if (res) {
          // Extract vocabularies object
          const formatted = res.map(item => item.vocabularies).filter(Boolean);
          setData(formatted);
        }
      } else if (theoryCategory === 'kanji') {
        const { data: res, error } = await supabase.from('lesson_kanjis')
          .select('kanjis(*, kanji_examples(*))')
          .eq('lesson_id', selectedLesson.id)
          .limit(limit);
        if (res) {
          const formatted = res.map(item => item.kanjis).filter(Boolean);
          setData(formatted);
        }
      } else if (theoryCategory === 'grammar') {
        const { data: res, error } = await supabase.from('lesson_grammars')
          .select('grammar_points(*, grammar_examples(*))')
          .eq('lesson_id', selectedLesson.id)
          .limit(limit);
        if (res) {
          const formatted = res.map(item => item.grammar_points).filter(Boolean);
          setData(formatted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderLessonsList = () => {
    return (
      <div className="skills-grid">
        {lessons.map(lesson => (
          <div 
            key={lesson.id} 
            className="skill-card" 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '24px', transition: 'transform 0.2s' }}
            onClick={() => setSelectedLesson(lesson)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--primary-bg)', borderRadius: '16px' }}>
                <BookOpen size={28} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>Cấp độ {lesson.level}</span>
                <h3 style={{ fontSize: '22px', color: 'var(--text-main)', margin: '4px 0 0 0' }}>{lesson.title}</h3>
              </div>
            </div>
            <button className="banner-btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
              Vào học bài này
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderVocab = () => {
    return (
      <div className="skills-grid">
        {data.map((v) => (
          <div key={v.id} className="skill-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{v.reading}</span>
              <h3 style={{ fontSize: '28px', color: 'var(--primary)', margin: 0 }}>{v.word}</h3>
              {v.hanviet && <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>【{v.hanviet}】</span>}
              <p style={{ fontSize: '16px', color: 'var(--text-main)', marginTop: '8px' }}>{v.meaning}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderKanji = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.map((k) => (
          <div key={k.id} className="quiz-question-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', backgroundColor: 'var(--primary-bg)', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)' }}>{k.character}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Nghĩa: {k.meaning}</h3>
                <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                  {k.kunyomi && <div><strong style={{ color: 'var(--text-secondary)' }}>Kunyomi:</strong> <span style={{ backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '4px' }}>{k.kunyomi}</span></div>}
                  {k.onyomi && <div><strong style={{ color: 'var(--text-secondary)' }}>Onyomi:</strong> <span style={{ backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '4px' }}>{k.onyomi}</span></div>}
                </div>
                {k.kanji_examples && k.kanji_examples.length > 0 && (
                  <div style={{ marginTop: '16px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Ví dụ:</strong>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {k.kanji_examples.map(ex => (
                        <li key={ex.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                            <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{ex.word}</strong>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>({ex.reading})</span>
                          </div>
                          <div style={{ fontSize: '15px', marginTop: '4px' }}>{ex.meaning}</div>
                          {ex.sentence && <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>{ex.sentence}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGrammar = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.map((g) => (
          <div key={g.id} className="quiz-question-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>{g.grammar}</h3>
            <div style={{ margin: '16px 0', fontSize: '16px', lineHeight: '1.6' }}>
              <strong>Ý nghĩa: </strong> {g.meaning}
            </div>
            {g.explanation && (
              <div style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>Giải thích: </strong> {g.explanation}
              </div>
            )}
            
            {(g.extra_info || g.note || g.extra_note) && (
              <div className="promo-box" style={{ marginBottom: '20px', backgroundColor: 'var(--accent-blue-bg)', borderColor: 'var(--accent-blue-border)' }}>
                {g.extra_info && <div style={{ marginBottom: '8px' }}><strong>Mở rộng: </strong>{g.extra_info}</div>}
                {g.note && <div style={{ marginBottom: '8px' }}><strong>Lưu ý: </strong>{g.note}</div>}
                {g.extra_note && <div><strong>Ghi chú thêm: </strong>{g.extra_note}</div>}
              </div>
            )}

            {g.grammar_examples && g.grammar_examples.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>Câu ví dụ:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {g.grammar_examples.map(ex => (
                    <div key={ex.id} style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px', color: 'var(--text-main)' }}>{ex.jp_sentence}</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{ex.vn_sentence}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCounter = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.map((c) => (
          <div key={c.id} className="quiz-question-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={20} color="var(--primary)" />
              {c.category_name}
            </h3>
            {c.counter_items && c.counter_items.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Sort by number to ensure correct order */}
                {c.counter_items.sort((a,b)=>a.number - b.number).map(item => (
                  <div key={item.id} style={{ backgroundColor: 'var(--bg-main)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Số đếm: {item.number}</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '4px' }}>{item.word}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>{item.reading}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.meaning}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>Chưa có dữ liệu lượng từ.</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getTitle = () => {
    let base = 'Học Lý thuyết';
    switch(theoryCategory) {
      case 'vocab': base = 'Lý thuyết Từ vựng'; break;
      case 'kanji': base = 'Lý thuyết Kanji'; break;
      case 'grammar': base = 'Lý thuyết Ngữ pháp'; break;
      case 'counter': base = 'Lý thuyết Lượng từ'; break;
    }
    if (selectedLesson) {
      return `${base} - ${selectedLesson.title}`;
    }
    return base;
  };

  const handleBack = () => {
    if (selectedLesson) {
      setSelectedLesson(null);
    } else {
      setActiveTab('ly-thuyet');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="action-btn" onClick={handleBack}>
          <ChevronLeft size={24} />
        </button>
        <h2 className="page-heading" style={{ margin: 0 }}>{getTitle()}</h2>
      </div>

      {/* Level Tabs */}
      {!selectedLesson && theoryCategory !== 'counter' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: '8px 24px',
                borderRadius: '20px',
                border: selectedLevel === lvl ? 'none' : '1px solid var(--border)',
                backgroundColor: selectedLevel === lvl ? 'var(--primary)' : 'var(--bg-main)',
                color: selectedLevel === lvl ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', color: 'var(--primary)' }}>
          <Loader2 size={32} className="spin" />
          <span style={{ marginLeft: '12px', fontSize: '16px' }}>Đang tải dữ liệu...</span>
        </div>
      ) : theoryCategory !== 'counter' && !selectedLesson ? (
        lessons.length > 0 ? renderLessonsList() : (
          <div className="quiz-container" style={{ textAlign: 'center', padding: '60px' }}>
            <Bookmark size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)' }}>Chưa có Bài học nào</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Dữ liệu Bài học (Lesson) hiện đang trống. Hãy chạy file import.py để khởi tạo các bài học nhé.</p>
          </div>
        )
      ) : data.length === 0 ? (
        <div className="quiz-container" style={{ textAlign: 'center', padding: '60px' }}>
          <Bookmark size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-main)' }}>Chưa có dữ liệu</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Chưa có bài học nào được thêm vào mục này.</p>
        </div>
      ) : (
        <div className="theory-content">
          {theoryCategory === 'vocab' && renderVocab()}
          {theoryCategory === 'kanji' && renderKanji()}
          {theoryCategory === 'grammar' && renderGrammar()}
          {theoryCategory === 'counter' && renderCounter()}
          
          {data.length >= limit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                className="banner-btn-secondary"
                onClick={() => setLimit(prev => prev + 50)}
              >
                Tải thêm dữ liệu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
