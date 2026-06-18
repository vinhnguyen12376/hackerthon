import React, { useState, useEffect, useRef } from 'react';
import { 
  Home as HomeIcon, 
  BookOpen, 
  Book, 
  User, 
  Search, 
  Bell, 
  Settings, 
  Mic, 
  Volume2, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  ChevronRight, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Sparkles, 
  FileText, 
  Plus, 
  X, 
  ArrowLeft,
  ChevronLeft,
  Flame,
  Award,
  MessageSquare,
  Send,
  Play,
  Pause,
  Compass,
  UploadCloud,
  Layers,
  BarChart2,
  Sliders,
  LogOut,
  Edit2,
  Calendar,
  Lock,
  Globe,
  Moon,
  ToggleLeft,
  ToggleRight,
  Sun,
  Eye,
  EyeOff
} from 'lucide-react';
import './App.css';
import { supabase } from './supabaseClient';

// Import JSON mock databases
import kanjiQuizData from './data/kanjiData.json';
import vocabQuizData from './data/vocabData.json';
import readingQuizData from './data/readingData.json';
import listeningQuizData from './data/listeningData.json';
import adminQuestionsData from './data/adminQuestions.json';
import theoryData from './data/theoryData.json';
import writingData from './data/writingData.json';
import speakingData from './data/speakingData.json';
import grammarQuizData from './data/grammarData.json';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('trang-chu'); // 'trang-chu', 'lo-trinh', 'ly-thuyet', 'speaking', 'writing', 'kanji', 'vocab', 'reading', 'listening', 'profile'
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('quan-ly-noi-dung'); 
  const [adminSubSkill, setAdminSubSkill] = useState('Ngữ pháp'); 

  // Auth & Form State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  // Login Inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Forgot Password Input
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Active User Profile State
  const [currentUser, setCurrentUser] = useState({
    name: 'Akira Sato',
    role: 'Học viên',
    email: 'akira.sato@learning.jp',
    cert: 'JLPT N2 (Đang ôn thi)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
    streak: 14,
    xp: 12450,
    hours: 82,
    goal: '60 phút / ngày',
    memberSince: 'Tháng 2, 2024',
    dob: 'Chưa cập nhật',
    phone: 'Chưa cập nhật',
    address: 'Chưa cập nhật'
  });

  // Check Supabase session on mount and subscribe to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        const metadata = session.user.user_metadata || {};
        setCurrentUser(prev => ({
          ...prev,
          name: metadata.full_name || session.user.email.split('@')[0],
          email: session.user.email,
          role: session.user.email.endsWith('@komorebi.ai') ? 'Quản trị viên' : 'Học viên',
          dob: metadata.dob || 'Chưa cập nhật',
          phone: metadata.phone || 'Chưa cập nhật',
          address: metadata.address || 'Chưa cập nhật'
        }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        const metadata = session.user.user_metadata || {};
        setCurrentUser(prev => ({
          ...prev,
          name: metadata.full_name || session.user.email.split('@')[0],
          email: session.user.email,
          role: session.user.email.endsWith('@komorebi.ai') ? 'Quản trị viên' : 'Học viên',
          dob: metadata.dob || 'Chưa cập nhật',
          phone: metadata.phone || 'Chưa cập nhật',
          address: metadata.address || 'Chưa cập nhật'
        }));
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsAuthLoading(true);
    setLoginError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) {
        setLoginError(error.message || 'Đăng nhập thất bại.');
      } else {
        setIsAuthenticated(true);
        setActiveTab('trang-chu');
      }
    } catch (err) {
      setLoginError('Lỗi kết nối đến máy chủ.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regDob || !regPhone || !regAddress || !regPassword || !regConfirmPassword) {
      setRegError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Xác nhận mật khẩu không trùng khớp.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsAuthLoading(true);
    setRegError('');
    setRegSuccess(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regName,
            dob: regDob,
            phone: regPhone,
            address: regAddress
          }
        }
      });

      if (error) {
        setRegError(error.message || 'Đăng ký thất bại.');
      } else {
        setRegSuccess(true);
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
        setTimeout(() => {
          setRegSuccess(false);
          setAuthView('login');
        }, 3000);
      }
    } catch (err) {
      setRegError('Lỗi kết nối đến máy chủ.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Vui lòng điền địa chỉ email.');
      return;
    }

    setIsAuthLoading(true);
    setForgotSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        alert(error.message || 'Gửi yêu cầu khôi phục thất bại.');
      } else {
        setForgotSuccess(true);
      }
    } catch (err) {
      alert('Lỗi kết nối đến máy chủ.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    } finally {
      setIsAuthenticated(false);
      setAuthView('login');
      setLoginEmail('');
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegDob('');
      setRegPhone('');
      setRegAddress('');
      setRegPassword('');
      setRegConfirmPassword('');
      setForgotEmail('');
      setForgotSuccess(false);
      setIsAuthLoading(false);
    }
  };

  // Dark/Light Mode state
  const [darkMode, setDarkMode] = useState(false);

  // Home Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Luyện đọc văn bản thông tin kinh tế (30 phút)', checked: true },
    { id: 2, text: 'Phân tích cấu trúc câu phức ngữ', checked: false },
    { id: 3, text: 'Bài tập trắc nghiệm nội dung văn bản', checked: false }
  ]);

  // Float chatbot state
  const [showHelperChat, setShowHelperChat] = useState(false);
  const [helperMessages, setHelperMessages] = useState([
    { sender: 'ai', text: 'Chào Akira! Tôi là AI Sensei trợ giúp trực tuyến. Bạn có câu hỏi nào cần giải thích hay thảo luận về ngữ pháp JLPT N2 không?' }
  ]);
  const [helperInput, setHelperInput] = useState('');

  // Furigana toggle state
  const [showFurigana, setShowFurigana] = useState(true);

  // Active definition tooltip in reading
  const [definitionTooltip, setDefinitionTooltip] = useState(null);

  // Audio simulation timeline
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(42); 
  const [audioRate, setAudioRate] = useState(1.0);
  const [showAllSubtitles, setShowAllSubtitles] = useState(false);

  // Mock Test Generator State
  const [testSkills, setTestSkills] = useState(['Kanji', 'Grammar']);
  const [testSource, setTestSource] = useState('AI-Generated Mix');
  const [testDuration, setTestDuration] = useState('30 Minutes');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const [testTimer, setTestTimer] = useState(1800); 
  const [testAnswers, setTestAnswers] = useState({});

  // Speaking Studio State (Loaded from JSON)
  const [chatHistory, setChatHistory] = useState(speakingData.initialChat);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [speakingProgress, setSpeakingProgress] = useState(0); 
  const [pronunciationScore, setPronunciationScore] = useState('92% Khớp • Gần bản xứ');
  const [grammarTip, setGrammarTip] = useState('Thử dùng "~ております" để thể hiện kính ngữ (Keigo)');

  // Writing Lab State (Loaded from JSON)
  const [writingText, setWritingText] = useState(writingData.initialText);
  const [writingIssues, setWritingIssues] = useState(writingData.issues);
  const [showWritingToast, setShowWritingToast] = useState(true);
  const [writingScore, setWritingScore] = useState('B+');

  // Quizzes indices
  const [kanjiIndex, setKanjiIndex] = useState(0);
  const [selectedKanjiOption, setSelectedKanjiOption] = useState(null);
  const [isKanjiAnswerChecked, setIsKanjiAnswerChecked] = useState(false);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [selectedVocabOption, setSelectedVocabOption] = useState(null);
  const [isVocabAnswerChecked, setIsVocabAnswerChecked] = useState(false);

  const [readingIndex, setReadingIndex] = useState(0);
  const [selectedReadingOption, setSelectedReadingOption] = useState(null);
  const [isReadingAnswerChecked, setIsReadingAnswerChecked] = useState(false);

  const [listeningIndex, setListeningIndex] = useState(0);
  const [selectedListeningOption, setSelectedListeningOption] = useState(null);
  const [isListeningAnswerChecked, setIsListeningAnswerChecked] = useState(false);

  // Grammar practice states
  const [grammarSelected, setGrammarSelected] = useState([]);
  const [grammarRemaining, setGrammarRemaining] = useState(grammarQuizData.sentenceOrder.words);
  const [isGrammarChecked, setIsGrammarChecked] = useState(false);
  const [isGrammarCorrect, setIsGrammarCorrect] = useState(null);

  // System Administrator Questions Database State (Loaded from JSON)
  const [adminQuestions, setAdminQuestions] = useState(adminQuestionsData);

  // Upload/Extract questions states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showExtractedQuestions, setShowExtractedQuestions] = useState(false);
  const [extractedQuestionsCount, setExtractedQuestionsCount] = useState(12);
  const [isApprovedIndex, setIsApprovedIndex] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Audio player simulation timer
  useEffect(() => {
    let interval = null;
    if (audioPlaying) {
      interval = setInterval(() => {
        setAudioTime(prev => {
          if (prev >= listeningQuizData[listeningIndex].fullDuration) {
            setAudioPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / audioRate);
    }
    return () => clearInterval(interval);
  }, [audioPlaying, audioRate, listeningIndex]);

  // Speaking Studio Speech Simulation
  const handleMicrophoneClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsAiSpeaking(true);
      
      setTimeout(() => {
        const newUserMessage = speakingData.simulatedUserResponse;
        setChatHistory(prev => [...prev, newUserMessage]);
        setSpeakingProgress(2);
        setPronunciationScore('95% Khớp • Rất trôi chảy');
        setGrammarTip('Sử dụng tốt mẫu trợ từ "を中心に" để chỉ tiêu điểm học tập.');
        
        setTimeout(() => {
          const newAiMessage = speakingData.simulatedTeacherResponse;
          setChatHistory(prev => [...prev, newAiMessage]);
          setIsAiSpeaking(false);
          setCurrentUser(prev => ({ ...prev, xp: prev.xp + 50 }));
        }, 2000);

      }, 1500);

    } else {
      setIsRecording(true);
      setSpeakingProgress(1);
    }
  };

  // Chat helper message submission
  const handleSendHelperMessage = () => {
    if (!helperInput.trim()) return;
    const userMsg = { sender: 'user', text: helperInput };
    setHelperMessages(prev => [...prev, userMsg]);
    setHelperInput('');

    setTimeout(() => {
      let replyText = 'Tôi ghi nhận thắc mắc của bạn. Bạn muốn tìm hiểu thêm về bài đọc hiểu hay cấu trúc ngữ pháp nào?';
      if (helperInput.toLowerCase().includes('đọc hiểu') || helperInput.toLowerCase().includes('reading')) {
        replyText = 'Bài đọc hiểu "日本の文化と技術" nói về sự giao thoa văn hóa Kyoto cổ kính và cảm biến hiện đại để tiết kiệm năng lượng. Bạn cần giải nghĩa câu văn nào trong đó không?';
      } else if (helperInput.toLowerCase().includes('nghe hiểu') || helperInput.toLowerCase().includes('listening')) {
        replyText = 'Ở bài nghe "Cuộc hẹn ở quán cà phê", Tanaka-san gặp vấn đề về họng từ hôm qua (昨日から少し喉の調子が悪くて) nên được phục vụ gợi ý dùng trà bưởi nóng (温かいゆず茶).';
      }
      setHelperMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    }, 1000);
  };

  // Writing Lab correction apply
  const applyCorrection = (issue) => {
    const regex = new RegExp(issue.original, 'g');
    const newText = writingText.replace(regex, issue.corrected);
    setWritingText(newText);
    
    setWritingIssues(prev => prev.map(item => {
      if (item.id === issue.id) return { ...item, solved: true };
      return item;
    }));

    setCurrentUser(prev => ({ ...prev, xp: prev.xp + 15 }));
  };

  const handleAddToastSuggestion = () => {
    const suggestionText = writingData.appendedText;
    setWritingText(prev => prev + suggestionText);
    setShowWritingToast(false);
    setCurrentUser(prev => ({ ...prev, xp: prev.xp + 25 }));
  };

  useEffect(() => {
    const unsolvedCount = writingIssues.filter(i => !i.solved).length;
    if (unsolvedCount === 4) setWritingScore('B+');
    else if (unsolvedCount === 3) setWritingScore('A-');
    else if (unsolvedCount === 2) setWritingScore('A');
    else if (unsolvedCount === 1) setWritingScore('A+');
    else if (unsolvedCount === 0) setWritingScore('S (Hoàn hảo)');
  }, [writingIssues]);

  // Mock Test timer effect
  useEffect(() => {
    let interval = null;
    if (testActive && testTimer > 0) {
      interval = setInterval(() => {
        setTestTimer(prev => prev - 1);
      }, 1000);
    } else if (testTimer === 0) {
      setTestActive(false);
      alert('Hết giờ làm bài thi thử!');
      setCurrentUser(prev => ({ ...prev, xp: prev.xp + 150 }));
    }
    return () => clearInterval(interval);
  }, [testActive, testTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartMockTest = () => {
    setShowTestModal(false);
    setTestActive(true);
    setTestTimer(1800);
  };

  const renderHighlightedText = () => {
    let text = writingText;
    const targets = [
      { word: '大坂', color: 'highlight-err-red', id: 'issue-1' },
      { word: '味', color: 'highlight-err-yellow', id: 'issue-2' },
      { word: '熱い', color: 'highlight-err-red', id: 'issue-3' },
      { word: '大切', color: 'highlight-err-yellow', id: 'issue-4' },
    ];

    let parts = [text];
    
    targets.forEach(t => {
      const issue = writingIssues.find(i => i.id === t.id);
      if (issue && !issue.solved) {
        let newParts = [];
        parts.forEach(part => {
          if (typeof part === 'string') {
            const splitParts = part.split(t.word);
            for (let i = 0; i < splitParts.length; i++) {
              newParts.push(splitParts[i]);
              if (i < splitParts.length - 1) {
                newParts.push(<span key={`${t.word}-${i}`} className={t.color}>{t.word}</span>);
              }
            }
          } else {
            newParts.push(part);
          }
        });
        parts = newParts;
      }
    });

    return parts;
  };

  // Simulating the document upload & extraction in admin mode
  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setShowExtractedQuestions(true);
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const handleSelectQuestion = (id) => {
    setAdminQuestions(prev => prev.map(q => {
      if (q.id === id) return { ...q, checked: !q.checked };
      return q;
    }));
  };

  const handleMassDelete = () => {
    const checkedCount = adminQuestions.filter(q => q.checked).length;
    if (checkedCount === 0) {
      alert('Vui lòng tích chọn câu hỏi cần xóa!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${checkedCount} câu hỏi đã chọn?`)) {
      setAdminQuestions(prev => prev.filter(q => !q.checked));
      alert(`Đã xóa thành công ${checkedCount} câu hỏi khỏi ngân hàng.`);
    }
  };

  const handleApproveQuestion = () => {
    setIsApprovedIndex(true);
    const newQ = {
      id: `Q-GRA-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Hãy chọn cấu trúc đúng: "雨が降っている____、傘を持っていきませんでした。"',
      subtext: 'Ngữ pháp N3 bổ sung',
      skill: 'Ngữ pháp',
      ans: 'B',
      level: 'N3',
      status: 'Công khai',
      creator: 'Tanaka Y.',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      checked: false
    };
    setAdminQuestions(prev => [newQ, ...prev]);
    setExtractedQuestionsCount(prev => prev - 1);
    alert('Đã phê duyệt câu hỏi và thêm vào Ngân hàng câu hỏi thành công!');
  };

  // Toggle user account and statistics dashboard values
  const handleToggleUserAccount = () => {
    if (currentUser.name === 'Akira Sato') {
      setCurrentUser({
        name: 'Yuki Tanaka',
        role: 'Quản trị viên',
        email: 'yuki.tanaka@komorebi.ai',
        cert: 'JLPT N1 (Chính quy)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        streak: 12,
        xp: 2450,
        hours: 140,
        goal: 'Không giới hạn',
        memberSince: 'Tháng 12, 2023'
      });
    } else {
      setCurrentUser({
        name: 'Akira Sato',
        role: 'Học viên',
        email: 'akira.sato@learning.jp',
        cert: 'JLPT N2 (Đang ôn thi)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
        streak: 14,
        xp: 12450,
        hours: 82,
        goal: '60 phút / ngày',
        memberSince: 'Tháng 2, 2024'
      });
      setIsAdminMode(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`auth-root-container ${darkMode ? 'dark-theme-active' : ''}`} style={{ backgroundColor: darkMode ? '#0f172a' : '#eeedfc' }}>
        {/* Render snow falling */}
        <div className="snow-container">
          {Array.from({ length: 45 }).map((_, idx) => {
            const left = `${Math.random() * 100}%`;
            const delay = `${Math.random() * 8}s`;
            const duration = `${Math.random() * 12 + 6}s`;
            const opacity = Math.random() * 0.7 + 0.3;
            const scale = Math.random() * 0.8 + 0.2;
            const filter = `blur(${Math.random() * 1.5}px)`;
            
            return (
              <div 
                key={idx} 
                className="snowflake" 
                style={{ 
                  left, 
                  animationDelay: delay, 
                  animationDuration: duration, 
                  opacity, 
                  transform: `scale(${scale})`, 
                  filter 
                }}
              />
            );
          })}
        </div>
        
        {/* Dark Mode toggle in top right */}
        <button 
          className="auth-dark-mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Giao diện sáng" : "Giao diện tối"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {authView === 'login' && (
          <div className="auth-card-wrapper fade-in-up">
            <div className="auth-login-card">
              <div className="auth-logo-header">
                <span className="auth-logo-text">Komorebi AI</span>
                <span className="auth-logo-badge">TRÌNH ĐỘ N3</span>
              </div>
              <h2 className="auth-heading">Chào mừng trở lại!</h2>
              <p className="auth-subheading">Chinh phục tiếng Nhật JLPT cùng Komorebi AI</p>

              {loginError && <div className="auth-error-msg"><AlertCircle size={16} /> {loginError}</div>}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-input-group">
                  <label>Địa chỉ Email</label>
                  <input 
                    type="email" 
                    placeholder="ten@viethan.edu.vn" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isAuthLoading}
                  />
                </div>
                
                <div className="auth-input-group password-group">
                  <div className="auth-label-row">
                    <label>Mật khẩu</label>
                    <button 
                      type="button" 
                      className="auth-forgot-link-btn"
                      disabled={isAuthLoading}
                      onClick={() => { setAuthView('forgot-password'); setLoginError(''); }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      disabled={isAuthLoading}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-primary-btn" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="auth-divider">
                <span>hoặc đăng nhập bằng</span>
              </div>

              <button 
                type="button" 
                className="auth-google-btn"
                disabled={isAuthLoading}
                onClick={() => {
                  setLoginEmail('akira.sato@learning.jp');
                  setLoginPassword('123456');
                  setIsAuthenticated(true);
                  setActiveTab('trang-chu');
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>

              <p className="auth-footer-text">
                Bạn chưa có tài khoản? <button onClick={() => { setAuthView('register'); setLoginError(''); }} disabled={isAuthLoading} className="auth-link-btn">Đăng ký ngay</button>
              </p>
            </div>
          </div>
        )}

        {authView === 'register' && (
          <div className="auth-card-wrapper wide fade-in-up">
            <div className="auth-register-two-col">
              {/* Left Column: Form */}
              <div className="register-form-col">
                <div className="auth-logo-header">
                  <span className="auth-logo-text">Komorebi AI</span>
                  <span className="auth-logo-badge">ĐĂNG KÝ HỌC VIÊN</span>
                </div>
                <h2 className="auth-heading">Tạo tài khoản mới</h2>
                <p className="auth-subheading" style={{ marginBottom: '16px' }}>Bắt đầu hành trình học tập thông minh cùng Komorebi AI</p>

                {regError && <div className="auth-error-msg" style={{ marginBottom: '16px' }}><AlertCircle size={16} /> {regError}</div>}
                {regSuccess && (
                  <div className="auth-success-msg" style={{ marginBottom: '16px' }}>
                    <CheckCircle size={16} /> Đăng ký thành công! Đang chuyển hướng sang trang Đăng nhập...
                  </div>
                )}

                <form onSubmit={handleRegister} className="auth-form register-grid-form">
                  <div className="auth-input-group col-span-2">
                    <label>Họ và tên</label>
                    <input 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div className="auth-input-group col-span-2">
                    <label>Địa chỉ Email</label>
                    <input 
                      type="email" 
                      placeholder="nva@viethan.edu.vn" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div className="auth-input-group">
                    <label>Ngày tháng năm sinh</label>
                    <input 
                      type="date" 
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div className="auth-input-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="0987654321" 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div className="auth-input-group col-span-2">
                    <label>Địa chỉ nhà</label>
                    <input 
                      type="text" 
                      placeholder="470 Trần Đại Nghĩa, Đà Nẵng" 
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div className="auth-input-group password-group">
                    <label>Mật khẩu</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        disabled={isAuthLoading}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        disabled={isAuthLoading}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group password-group">
                    <label>Xác nhận mật khẩu</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                        disabled={isAuthLoading}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        disabled={isAuthLoading}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-primary-btn col-span-2" disabled={isAuthLoading}>
                    {isAuthLoading ? 'Đang xử lý...' : 'Đăng ký học'}
                  </button>
                </form>

                <div className="auth-divider">
                  <span>hoặc đăng ký bằng</span>
                </div>

                <button 
                  type="button" 
                  className="auth-google-btn"
                  disabled={isAuthLoading}
                  onClick={() => {
                    setRegName('Akira Sato');
                    setRegEmail('akira.sato@learning.jp');
                    setRegDob('2000-01-01');
                    setRegPhone('0987654321');
                    setRegAddress('Tokyo, Nhật Bản');
                    setRegPassword('123456');
                    setRegConfirmPassword('123456');
                    setRegSuccess(true);
                    setTimeout(() => {
                      setRegSuccess(false);
                      setIsAuthenticated(true);
                      setActiveTab('trang-chu');
                    }, 1500);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                <p className="auth-footer-text">
                  Đã có tài khoản? <button onClick={() => { setAuthView('login'); setRegError(''); }} disabled={isAuthLoading} className="auth-link-btn">Đăng nhập</button>
                </p>
              </div>

              {/* Right Column: Info Panel */}
              <div className="register-info-col">
                <h3 className="info-title">Phương pháp học tập thông minh đột phá</h3>
                <div className="info-bullets">
                  <div className="info-bullet-item">
                    <div className="info-bullet-icon">🤖</div>
                    <div>
                      <span className="bullet-bold">Trợ lý AI Sensei cá nhân hóa</span>
                      <p>Giải đáp thắc mắc ngữ pháp, phân tích bài đọc hiểu thời gian thực, hỗ trợ 24/7.</p>
                    </div>
                  </div>
                  <div className="info-bullet-item">
                    <div className="info-bullet-icon">📊</div>
                    <div>
                      <span className="bullet-bold">Ôn tập ngắt quãng (SRS)</span>
                      <p>Hệ thống tự động nhắc nhở ôn luyện từ vựng và chữ Hán đúng thời điểm vàng để nhớ lâu nhất.</p>
                    </div>
                  </div>
                  <div className="info-bullet-item">
                    <div className="info-bullet-icon">💬</div>
                    <div>
                      <span className="bullet-bold">Phòng luyện Nói & Viết AI</span>
                      <p>Nhận điểm số phát âm chuẩn xác và đề xuất cải thiện bài viết học thuật chi tiết tức thì.</p>
                    </div>
                  </div>
                </div>
                <div className="register-info-preview">
                  <div className="preview-label">KOMOREBI AI DASHBOARD</div>
                  <div className="preview-bar-row">
                    <div className="preview-bar" style={{ width: '80%' }}></div>
                    <span className="preview-val">80%</span>
                  </div>
                  <div className="preview-bar-row">
                    <div className="preview-bar" style={{ width: '64%', backgroundColor: '#10b981' }}></div>
                    <span className="preview-val">64%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {authView === 'forgot-password' && (
          <div className="auth-card-wrapper fade-in-up">
            <div className="auth-login-card">
              <div className="auth-logo-header">
                <span className="auth-logo-text">Komorebi AI</span>
                <span className="auth-logo-badge">KHÔI PHỤC MẬT KHẨU</span>
              </div>
              <h2 className="auth-heading">Quên mật khẩu?</h2>
              <p className="auth-subheading">Nhập email của bạn để nhận liên kết khôi phục tài khoản.</p>

              {forgotSuccess ? (
                <div className="auth-success-flow">
                  <div className="success-icon-wrapper">
                    <CheckCircle size={40} className="success-check-icon" />
                  </div>
                  <p className="success-message-text">
                    Đã gửi email khôi phục! Vui lòng kiểm tra hộp thư của bạn.
                  </p>
                  <button 
                    type="button" 
                    className="auth-primary-btn"
                    disabled={isAuthLoading}
                    onClick={() => setForgotSuccess(false)}
                  >
                    Gửi lại email
                  </button>
                  <button 
                    type="button" 
                    className="auth-secondary-btn"
                    disabled={isAuthLoading}
                    onClick={() => { setAuthView('login'); setForgotSuccess(false); setForgotEmail(''); }}
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="auth-input-group">
                    <label>Địa chỉ Email</label>
                    <input 
                      type="email" 
                      placeholder="ten@viethan.edu.vn" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      disabled={isAuthLoading}
                    />
                  </div>

                  <button type="submit" className="auth-primary-btn" disabled={isAuthLoading}>
                    {isAuthLoading ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
                  </button>
                  <button 
                    type="button" 
                    className="auth-secondary-btn"
                    disabled={isAuthLoading}
                    onClick={() => { setAuthView('login'); setForgotEmail(''); }}
                  >
                    Quay lại Đăng nhập
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-theme-active' : ''}`} style={{ backgroundColor: darkMode ? '#0f172a' : '' }}>
      
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ backgroundColor: darkMode ? '#1e293b' : '', borderColor: darkMode ? '#334155' : '' }}>
        
        <div className="logo-container">
          <h1 className="logo-text" style={{ color: darkMode ? '#a5b4fc' : '' }}>Komorebi AI</h1>
          <p className="logo-sub">{isAdminMode ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'TRỢ LÝ AI CỦA BẠN'}</p>
        </div>

        {/* Dynamic Sidebar Links: Home -> Roadmap -> Theory -> Exercises -> Profile */}
        {!isAdminMode ? (
          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'trang-chu' ? 'active' : ''}`}
              onClick={() => { setActiveTab('trang-chu'); setTestActive(false); }}
              style={{ color: darkMode ? '#cbd5e1' : '' }}
            >
              <HomeIcon size={18} />
              <span>Trang chủ</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'lo-trinh' ? 'active' : ''}`}
              onClick={() => setActiveTab('lo-trinh')}
              style={{ color: darkMode ? '#cbd5e1' : '' }}
            >
              <Compass size={18} />
              <span>Lộ trình</span>
            </button>

            <button 
              className={`nav-item ${activeTab === 'ly-thuyet' ? 'active' : ''}`}
              onClick={() => setActiveTab('ly-thuyet')}
              style={{ color: darkMode ? '#cbd5e1' : '' }}
            >
              <Book size={18} />
              <span>Lý thuyết</span>
            </button>

            <button 
              className={`nav-item ${['bai-tap', 'speaking', 'writing', 'kanji', 'vocab', 'reading', 'listening', 'grammar'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => { setActiveTab('bai-tap'); setTestActive(false); }}
              style={{ color: darkMode ? '#cbd5e1' : '' }}
            >
              <BookOpen size={18} />
              <span>Bài tập</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              style={{ color: darkMode ? '#cbd5e1' : '' }}
            >
              <User size={18} />
              <span>Hồ sơ</span>
            </button>
          </nav>
        ) : (
          <nav className="nav-links">
            <button 
              className={`nav-item ${adminTab === 'tong-quan' ? 'active' : ''}`}
              onClick={() => setAdminTab('tong-quan')}
            >
              <HomeIcon size={18} />
              <span>Tổng quan</span>
            </button>

            <button 
              className={`nav-item ${['quan-ly-noi-dung', 'upload-trich-xuat'].includes(adminTab) ? 'active' : ''}`}
              onClick={() => setAdminTab('quan-ly-noi-dung')}
            >
              <Layers size={18} />
              <span>Quản lý nội dung</span>
            </button>

            <button 
              className={`nav-item ${adminTab === 'user-analytics' ? 'active' : ''}`}
              onClick={() => alert('Thống kê Người dùng hệ thống đang cập nhật.')}
            >
              <BarChart2 size={18} />
              <span>Phân tích người dùng</span>
            </button>

            <button 
              className={`nav-item ${adminTab === 'system-settings' ? 'active' : ''}`}
              onClick={() => alert('Hệ thống cài đặt phân quyền đang cập nhật.')}
            >
              <Sliders size={18} />
              <span>Cài đặt hệ thống</span>
            </button>

            <div style={{ margin: '20px 0 10px', fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Thư viện học tập
            </div>

            <button className="nav-item" onClick={() => { setIsAdminMode(false); setActiveTab('reading'); }}>
              <BookOpen size={16} />
              <span>Đọc hiểu</span>
            </button>

            <button className="nav-item" onClick={() => { setIsAdminMode(false); setActiveTab('listening'); }}>
              <Volume2 size={16} />
              <span>Nghe hiểu</span>
            </button>

            <button className="nav-item" onClick={() => { setIsAdminMode(false); setActiveTab('writing'); }}>
              <FileText size={16} />
              <span>Viết</span>
            </button>
          </nav>
        )}

        <div className="sidebar-footer">
          {isAdminMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="promo-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setAdminTab('upload-trich-xuat')}>
                <Plus size={16} />
                <span>Tạo bài tập mới</span>
              </button>
              
              <button 
                className="promo-btn" 
                style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setIsAdminMode(false)}
              >
                <LogOut size={16} />
                <span>Thoát Admin</span>
              </button>
            </div>
          ) : (
            <div className="promo-box" style={{ backgroundColor: darkMode ? '#334155' : '', borderColor: darkMode ? '#475569' : '' }}>
              <h4 className="promo-title">Học cùng Trợ lý AI</h4>
              <p className="promo-desc" style={{ color: darkMode ? '#94a3b8' : '' }}>Phân tích và sửa chữa mọi lỗi sai ngữ pháp, chữ Hán tức thì.</p>
              <button className="promo-btn" onClick={() => alert('Cổng nâng cấp Pro đang bảo trì.')}>
                Nâng cấp Pro
              </button>
            </div>
          )}

          <div className="user-profile" style={{ borderColor: darkMode ? '#334155' : '', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={currentUser.avatar} 
                alt="Avatar" 
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name" style={{ color: darkMode ? '#f8fafc' : '' }}>{currentUser.name}</span>
                <span className="user-plan">{currentUser.role === 'Quản trị viên' ? 'QUẢN TRỊ VIÊN' : 'THÀNH VIÊN PRO'}</span>
              </div>
            </div>
            <button 
              className="action-btn" 
              onClick={handleLogout}
              title="Đăng xuất"
              style={{ color: 'var(--text-light)', padding: '6px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content" style={{ color: darkMode ? '#cbd5e1' : '' }}>
        
        {/* Top Header Navigation */}
        <header className="topbar" style={{ backgroundColor: darkMode ? '#1e293b' : '', borderColor: darkMode ? '#334155' : '' }}>
          {!isAdminMode && ['speaking', 'writing', 'kanji', 'vocab', 'reading', 'listening', 'grammar'].includes(activeTab) ? (
            <div className="topbar-quiz-header" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="action-btn" 
                  onClick={() => { setActiveTab('bai-tap'); setAudioPlaying(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }}
                >
                  <ArrowLeft size={20} />
                  <span>
                    {activeTab === 'vocab' && 'Luyện tập Từ vựng'}
                    {activeTab === 'grammar' && 'Luyện tập Ngữ pháp'}
                    {activeTab === 'reading' && 'Luyện tập Đọc hiểu'}
                    {activeTab === 'listening' && 'Luyện tập Nghe hiểu'}
                    {activeTab === 'writing' && 'Luyện tập Viết'}
                    {activeTab === 'speaking' && 'Luyện tập Nói'}
                    {activeTab === 'kanji' && 'Luyện tập Chữ Hán'}
                  </span>
                </button>
                {activeTab === 'reading' && (
                  <span className="level-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>N3 LEVEL</span>
                )}
              </div>

              {/* Progress bar in center */}
              <div className="progress-bar-center" style={{ flexGrow: 1, maxWidth: '400px', margin: '0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>TIẾN ĐỘ BÀI HỌC</span>
                <div className="skill-progress-bar" style={{ height: '6px', flexGrow: 1, backgroundColor: 'var(--border)' }}>
                  <div 
                    className="skill-progress-fill" 
                    style={{ 
                      width: activeTab === 'vocab' ? '60%' : activeTab === 'grammar' ? '65%' : activeTab === 'reading' ? '25%' : activeTab === 'listening' ? '25%' : '30%' 
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                  {activeTab === 'vocab' && '12/20'}
                  {activeTab === 'grammar' && '65%'}
                  {activeTab === 'reading' && '1 / 4'}
                  {activeTab === 'listening' && '02:45'}
                  {activeTab === 'writing' && '142 từ'}
                  {activeTab === 'speaking' && '30%'}
                  {activeTab === 'kanji' && `${kanjiIndex + 1}/${kanjiQuizData.length}`}
                </span>
              </div>

              <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="streak-badge" style={{ padding: '4px 12px' }}>
                  <Flame size={16} fill="#ef4444" stroke="#ef4444" />
                  <span>{currentUser.streak}</span>
                </div>
                <div className="xp-badge">
                  <Award size={16} className="text-primary" />
                  <span>{currentUser.xp.toLocaleString()} XP</span>
                </div>
                <img src={currentUser.avatar} alt="User Avatar" className="user-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="topbar-left">
                <span className="page-title">
                  {!isAdminMode ? (
                    <>
                      {activeTab === 'trang-chu' && 'Trang chủ'}
                      {activeTab === 'lo-trinh' && 'Lộ trình học tập'}
                      {activeTab === 'ly-thuyet' && 'Lý thuyết ngôn ngữ'}
                      {activeTab === 'profile' && 'Hồ sơ cá nhân'}
                      {activeTab === 'bai-tap' && 'Bài tập'}
                    </>
                  ) : (
                    <>
                      {adminTab === 'quan-ly-noi-dung' && 'Quản lý Ngân hàng Câu hỏi'}
                      {adminTab === 'upload-trich-xuat' && 'Trình quản lý nội dung'}
                      {adminTab === 'tong-quan' && 'Tổng quan hệ thống'}
                    </>
                  )}
                </span>
                <span className="level-badge" style={{ backgroundColor: darkMode ? '#334155' : '', borderColor: darkMode ? '#475569' : '', color: darkMode ? '#cbd5e1' : '' }}>
                  {isAdminMode ? 'HỆ THỐNG QUẢN TRỊ' : 'TRÌNH ĐỘ N3'}
                </span>
              </div>

              <div className="topbar-right">
                <div className="search-container">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm tài liệu..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ backgroundColor: darkMode ? '#334155' : '', color: darkMode ? 'white' : '' }}
                  />
                </div>

                <div className="streak-badge" style={{ backgroundColor: darkMode ? '#334155' : '', borderColor: darkMode ? '#475569' : '', color: darkMode ? '#cbd5e1' : '' }}>
                  <Flame size={16} fill="#ef4444" stroke="#ef4444" />
                  <span>CHUỖI {currentUser.streak} NGÀY</span>
                </div>

                <div className="xp-badge" style={{ color: darkMode ? '#cbd5e1' : '' }}>
                  <Award size={16} className="text-primary" />
                  <span>{currentUser.xp.toLocaleString()} XP</span>
                </div>

                <div className="topbar-actions">
                  <button className="action-btn" onClick={() => alert('Không có thông báo mới.')}>
                    <Bell size={18} />
                  </button>
                  <button className="action-btn" onClick={() => alert('Cài đặt tài khoản.')}>
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        {/* SYSTEM ADMINISTRATOR VIEWS */}
        {isAdminMode && (
          <>
            {/* 1. Quản lý Ngân hàng Câu hỏi */}
            {adminTab === 'quan-ly-noi-dung' && (
              <div className="page-wrapper">
                <div className="admin-tabs">
                  {['Kanji', 'Từ vựng', 'Ngữ pháp', 'Đọc hiểu', 'Nghe hiểu', 'Viết', 'Nói'].map(tab => (
                    <button 
                      key={tab}
                      className={`admin-tab-btn ${adminSubSkill === tab ? 'active' : ''}`}
                      onClick={() => setAdminSubSkill(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="skill-pill active" style={{ borderRadius: 'var(--radius-sm)' }}>
                      <input 
                        type="checkbox" 
                        style={{ marginRight: '6px', cursor: 'pointer' }}
                        checked={adminQuestions.every(q => q.checked)}
                        onChange={(e) => setAdminQuestions(adminQuestions.map(q => ({ ...q, checked: e.target.checked })))}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>24 câu hỏi đã chọn</span>
                    </div>

                    <select className="form-select" style={{ width: '180px', padding: '8px 12px' }}>
                      <option>Bộ lọc: Ngữ pháp</option>
                      <option>Bộ lọc: N3</option>
                      <option>Bộ lọc: Bản nháp</option>
                    </select>

                    <button 
                      className="skill-btn" 
                      style={{ color: 'var(--error)', borderColor: 'var(--error-border)', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                      onClick={handleMassDelete}
                    >
                      <Trash2 size={14} /> Xóa hàng loạt
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="action-filled-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }} onClick={() => setAdminTab('upload-trich-xuat')}>
                      <UploadCloud size={16} />
                      <span>Tải lên Tài liệu</span>
                    </button>
                    
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Đang hiển thị 1-{adminQuestions.length} của 248 câu hỏi
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="action-btn" style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}><ChevronLeft size={16} /></button>
                      <button className="action-btn" style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Nội dung câu hỏi</th>
                        <th>Chi tiết đáp án</th>
                        <th>Cấp độ</th>
                        <th>Trạng thái</th>
                        <th>Người tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminQuestions.map(q => (
                        <tr key={q.id}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={q.checked}
                              onChange={() => handleSelectQuestion(q.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <span className="q-row-title">{q.title}</span>
                            <div className="q-row-meta">ID: {q.id} • {q.subtext}</div>
                          </td>
                          <td>
                            <div className="opt-bubble-row">
                              {['A', 'B', 'C', 'D'].map(o => (
                                <span 
                                  key={o} 
                                  className={`opt-bubble ${q.ans === o ? 'correct' : ''}`}
                                >
                                  {o}
                                </span>
                              ))}
                              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--success)', marginLeft: '6px' }}>
                                ĐÁP ÁN: {q.ans}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="q-badge-lvl">{q.level}</span>
                          </td>
                          <td>
                            <div 
                              className={`q-badge-status ${q.status === 'Công khai' ? 'public' : 'draft'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setAdminQuestions(adminQuestions.map(item => {
                                  if (item.id === q.id) {
                                    return { ...item, status: item.status === 'Công khai' ? 'Bản nháp' : 'Công khai' };
                                  }
                                  return item;
                                }));
                              }}
                            >
                              <span className={`status-dot ${q.status === 'Công khai' ? 'public' : 'draft'}`}></span>
                              {q.status}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={q.creatorAvatar} className="q-creator-avatar" alt={q.creator} />
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{q.creator}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <div className="focus-card" style={{ width: '300px', flexDirection: 'row', alignItems: 'center', padding: '16px 24px', gap: '16px' }}>
                    <div className="custom-icon" style={{ width: '44px', height: '44px' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>HỌC VIÊN HOẠT ĐỘNG</span>
                      <h4 style={{ fontSize: '24px', fontWeight: 800 }}>12,842</h4>
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>↗ +8.4% tuần này</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. Admin Content Manager (Tải lên & Trích xuất) */}
            {adminTab === 'upload-trich-xuat' && (
              <div className="page-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="action-text-btn" onClick={() => setAdminTab('quan-ly-noi-dung')}>
                    <ArrowLeft size={16} /> Quay lại danh sách
                  </button>
                  <h3 className="mock-test-title">Tải lên & Trích xuất Câu hỏi</h3>
                </div>

                <div className="dropzone-card" onClick={handleSimulateUpload}>
                  <UploadCloud size={48} className="dropzone-icon" />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Kéo và thả tài liệu vào đây</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Hỗ trợ định dạng PDF, DOCX (Tối đa 20MB)
                    </p>
                  </div>
                  <button className="dropzone-btn">
                    {isUploading ? `Đang tải lên ${uploadProgress}%...` : 'Chọn tệp tin'}
                  </button>
                </div>

                {showExtractedQuestions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <h4 className="mock-test-title" style={{ fontSize: '18px' }}>
                        CÂU HỎI ĐƯỢC TRÍCH XUẤT ({extractedQuestionsCount})
                      </h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="skill-btn" style={{ padding: '6px 16px' }} onClick={() => alert('Duyệt thành công tất cả tài liệu!')}>Duyệt tất cả</button>
                        <button className="action-filled-btn" style={{ padding: '6px 16px' }} onClick={() => {
                          alert('Thêm thành công 12 câu hỏi vào Ngân hàng câu hỏi!');
                          setAdminTab('quan-ly-noi-dung');
                        }}>Thêm vào ngân hàng</button>
                      </div>
                    </div>

                    {!isApprovedIndex ? (
                      <div className="extracted-card">
                        <div className="extracted-meta">
                          <span className="extracted-pill">NGỮ PHÁP N3</span>
                          <span className="extracted-confidence">Độ tin cậy: 98%</span>
                        </div>

                        <h4 className="question-prompt" style={{ fontSize: '15px', fontWeight: 700 }}>
                          Câu 1: Hãy chọn cấu trúc đúng để hoàn thành câu sau: "雨が降っている____、傘を持っていきませんでした。"
                        </h4>

                        <div className="vocab-options-grid">
                          <div className="vocab-option-card">
                            <div className="vocab-option-label">A</div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>ので</span>
                          </div>
                          <div className="vocab-option-card selected">
                            <div className="vocab-option-label" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>B</div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>のに</span>
                          </div>
                          <div className="vocab-option-card">
                            <div className="vocab-option-label">C</div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>から</span>
                          </div>
                          <div className="vocab-option-card">
                            <div className="vocab-option-label">D</div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>ため</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                            Đáp án đúng: B
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="action-btn" style={{ border: '1px solid var(--border)', borderRadius: '4px' }}><Edit2 size={14} /></button>
                            <button className="action-btn" style={{ border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--error)' }}><Trash2 size={14} /></button>
                            <button className="action-filled-btn" style={{ padding: '6px 18px', fontSize: '12px' }} onClick={handleApproveQuestion}>
                              Phê duyệt
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="speaking-feedback-card pronunciation">
                        <div className="feedback-icon-box"><CheckCircle size={18} /></div>
                        <div className="feedback-content">
                          <span className="feedback-title">Trích xuất câu hỏi hoàn tất</span>
                          <span className="feedback-detail">Câu hỏi đã được duyệt và chuyển vào thư viện Ngân hàng.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* 3. Tổng quan admin */}
            {adminTab === 'tong-quan' && (
              <div className="page-wrapper">
                <h3 className="mock-test-title">Tổng quan bảng quản trị</h3>
                <div className="skills-grid">
                  <div className="skill-card">
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-light)' }}>TỔNG SỐ CÂU HỎI</span>
                    <h4 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>248</h4>
                  </div>
                  <div className="skill-card">
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-light)' }}>HỌC VIÊN ĐĂNG KÝ</span>
                    <h4 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>12,842</h4>
                  </div>
                  <div className="skill-card">
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-light)' }}>TRẠNG THÁI MÁY CHỦ</span>
                    <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>Hoạt động tốt</h4>
                  </div>
                </div>
                <button className="action-filled-btn" onClick={() => setIsAdminMode(false)} style={{ width: 'fit-content' }}>
                  Quay lại chế độ Học viên
                </button>
              </div>
            )}
          </>
        )}

        {/* STUDENT VIEWS */}
        {!isAdminMode && (
          <>
            {/* Trang chủ */}
            {activeTab === 'trang-chu' && !testActive && (
              <div className="page-wrapper">
                
                <div className="page-intro">
                  <h2 className="page-heading">Chào buổi sáng, {currentUser.name.split(' ')[0]}!</h2>
                  <p className="page-subheading">Hôm nay là một ngày tuyệt vời để chinh phục Kanji.</p>
                </div>

                {/* Daily Schedule Section */}
                <div className="dashboard-grid">
                  
                  <div className="focus-card">
                    <div className="focus-header">
                      <span className="focus-badge">Mục tiêu chính</span>
                      <span className="focus-level">Cấp độ: N2</span>
                    </div>
                    
                    <h3 className="focus-title">
                      読解 <span>(Đọc hiểu)</span>
                    </h3>

                    <div className="checklist-group">
                      {checklist.map(item => (
                        <div 
                          key={item.id} 
                          className={`checklist-item ${item.checked ? 'checked' : ''}`}
                          onClick={() => setChecklist(checklist.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                        >
                          <div className="checkbox-custom">
                            {item.checked && <CheckCircle size={14} fill="var(--primary)" stroke="white" />}
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="focus-footer">
                      <button className="banner-btn-primary" onClick={() => setActiveTab('reading')}>
                        Bắt đầu ngay
                      </button>
                      <div className="focus-progress">
                        <span className="focus-progress-lbl">
                          Tiến độ bài học: {Math.round((checklist.filter(c => c.checked).length / checklist.length) * 100)}%
                        </span>
                        <div className="skill-progress-bar" style={{ height: '6px' }}>
                          <div 
                            className="skill-progress-fill" 
                            style={{ width: `${(checklist.filter(c => c.checked).length / checklist.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="quick-quiz-card">
                    <span className="quick-quiz-title">Bắt đầu Quiz nhanh</span>
                    <p style={{ fontSize: '13px', opacity: 0.85 }}>Thử thách 5 câu hỏi nhanh để tăng tốc ghi nhớ.</p>
                    <button className="quick-quiz-btn" onClick={() => setActiveTab('kanji')}>
                      Bắt đầu Quiz
                    </button>
                  </div>

                </div>

                {/* Recent Activity */}
                <div className="dashboard-grid">
                  <div className="recent-activity-card" style={{ backgroundColor: darkMode ? '#1e293b' : '', borderColor: darkMode ? '#334155' : '' }}>
                    <span className="recent-activity-title">
                      <RotateCw size={14} /> Hoạt động gần đây
                    </span>
                    <div className="activity-list">
                      <div className="activity-item">
                        <span className="activity-name">Ngữ pháp N2</span>
                        <span className="activity-val">85%</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-name">Kanji Lesson 4</span>
                        <span className="activity-val">100%</span>
                      </div>
                      <div className="activity-item">
                        <span className="activity-name">Nghe hiểu hội thoại</span>
                        <span className="activity-val">72%</span>
                      </div>
                    </div>
                  </div>

                  <div className="recent-activity-card" style={{ justifyContent: 'center', backgroundColor: darkMode ? '#1e293b' : '', borderColor: darkMode ? '#334155' : '' }}>
                    <span className="recent-activity-title">Luyện tập phụ trội</span>
                    <button className="skill-btn" style={{ marginTop: '8px' }} onClick={() => setActiveTab('vocab')}>
                      Khám phá Từ vựng
                    </button>
                  </div>
                </div>

                {/* Skill categories grid */}
                <div>
                  <h3 className="section-title">Lý thuyết & Kỹ năng</h3>
                  <div className="skills-grid">
                    
                    {/* Kanji */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><FileText size={18} /></div>
                        <span className="skill-progress-text">92%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Chữ Hán (Kanji)</span>
                        <p className="skill-desc">Hệ thống AI phân tích bộ thủ và liên tưởng hình ảnh sinh động.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '92%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Vocabulary */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><BookOpen size={18} /></div>
                        <span className="skill-progress-text">78%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Từ vựng</span>
                        <p className="skill-desc">Lặp lại ngắt quãng (SRS) giúp từ vựng đi vào bộ nhớ dài hạn.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '78%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Grammar */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><Book size={18} /></div>
                        <span className="skill-progress-text">65%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Ngữ pháp</span>
                        <p className="skill-desc">Sơ đồ tư duy cấu trúc câu phức theo logic khoa học.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '65%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Reading */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><BookOpen size={18} /></div>
                        <span className="skill-progress-text">41%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Đọc hiểu</span>
                        <p className="skill-desc">Kỹ thuật Skimming & Scanning văn bản thư tín và tài liệu N2.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '41%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Listening */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><Volume2 size={18} /></div>
                        <span className="skill-progress-text">55%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Nghe hiểu</span>
                        <p className="skill-desc">Shadowing kết hợp nghe thụ động hội thoại cuộc sống.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '55%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Speaking */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><Mic size={18} /></div>
                        <span className="skill-progress-text">30%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Luyện nói</span>
                        <p className="skill-desc">Luyện tập phát âm với AI Real-time Feedback ngay lập tức.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '30%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    {/* Writing */}
                    <div className="skill-card">
                      <div className="skill-header">
                        <div className="skill-icon"><FileText size={18} /></div>
                        <span className="skill-progress-text">25%</span>
                      </div>
                      <div className="skill-info">
                        <span className="skill-name">Luyện viết</span>
                        <p className="skill-desc">Sáng tạo văn bản với sự hỗ trợ của AI Grammar Checker.</p>
                      </div>
                      <div className="skill-progress-bar">
                        <div className="skill-progress-fill" style={{ width: '25%' }}></div>
                      </div>
                      <button className="skill-btn" onClick={() => setActiveTab('ly-thuyet')}>Học ngay</button>
                    </div>

                    <div className="skill-card custom" onClick={() => alert('Thêm kỹ năng học tập mới!')}>
                      <div className="custom-icon"><Plus size={16} /></div>
                      <span className="custom-title">Thêm kỹ năng mới</span>
                    </div>

                  </div>
                </div>

                <div className="promo-banner-large" style={{ backgroundColor: darkMode ? '#1e293b' : '', borderColor: darkMode ? '#334155' : '' }}>
                  <div className="banner-content">
                    <span className="banner-badge">Trợ lý thông minh</span>
                    <h4 className="banner-title">Bạn gặp khó khăn với bài Reading N2 vừa rồi?</h4>
                    <p className="banner-desc">
                      AI của chúng tôi đã phân tích lỗi sai của bạn trong bài đọc hiểu kinh tế. Nhấn vào đây để nhận giải thích chi tiết và các câu hỏi bổ trợ cá nhân hóa.
                    </p>
                  </div>
                  <div className="banner-actions">
                    <button className="banner-btn-primary" onClick={() => setActiveTab('reading')}>
                      Nhận feedback ngay
                    </button>
                    <button className="banner-btn-secondary">
                      Để sau
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Bài tập tổng hợp */}
            {activeTab === 'bai-tap' && (
              <div className="page-wrapper">
                <div className="page-intro">
                  <h2 className="page-heading">Thư viện bài tập tương tác</h2>
                  <p className="page-subheading">Lựa chọn một kỹ năng bên dưới để bắt đầu luyện tập với trợ lý AI của bạn.</p>
                </div>
                
                <div className="skills-grid">
                  {/* Grammar */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><Book size={18} /></div>
                      <span className="skill-progress-text">65%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Ngữ pháp</span>
                      <p className="skill-desc">Sắp xếp các từ để tạo thành câu hoàn chỉnh đúng cấu trúc ngữ pháp N2.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '65%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => {
                      setGrammarSelected([]);
                      setGrammarRemaining(grammarQuizData.sentenceOrder.words);
                      setIsGrammarChecked(false);
                      setIsGrammarCorrect(null);
                      setActiveTab('grammar');
                    }}>Bắt đầu</button>
                  </div>

                  {/* Vocabulary */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><BookOpen size={18} /></div>
                      <span className="skill-progress-text">78%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Từ vựng</span>
                      <p className="skill-desc">Chọn từ phù hợp nhất điền vào chỗ trống theo ngữ cảnh trang trọng/thân mật.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '78%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => {
                      setSelectedVocabOption(null);
                      setIsVocabAnswerChecked(false);
                      setActiveTab('vocab');
                    }}>Bắt đầu</button>
                  </div>

                  {/* Reading */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><BookOpen size={18} /></div>
                      <span className="skill-progress-text">41%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Đọc hiểu</span>
                      <p className="skill-desc">Đọc hiểu văn bản tiếng Nhật cổ điển & hiện đại, tra nghĩa từ khó nhanh chóng.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '41%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => {
                      setSelectedReadingOption(null);
                      setIsReadingAnswerChecked(false);
                      setActiveTab('reading');
                    }}>Bắt đầu</button>
                  </div>

                  {/* Listening */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><Volume2 size={18} /></div>
                      <span className="skill-progress-text">55%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Nghe hiểu</span>
                      <p className="skill-desc">Nghe đoạn hội thoại sinh động và điền/trắc nghiệm các câu hỏi chi tiết.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '55%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => {
                      setSelectedListeningOption(null);
                      setIsListeningAnswerChecked(false);
                      setAudioPlaying(false);
                      setAudioTime(0);
                      setActiveTab('listening');
                    }}>Bắt đầu</button>
                  </div>

                  {/* Writing */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><FileText size={18} /></div>
                      <span className="skill-progress-text">25%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Viết (Writing Lab)</span>
                      <p className="skill-desc">Soạn thảo văn bản và nhận phản hồi, sửa lỗi thời gian thực từ AI.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '25%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => setActiveTab('writing')}>Bắt đầu</button>
                  </div>

                  {/* Speaking */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><Mic size={18} /></div>
                      <span className="skill-progress-text">30%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Nói</span>
                      <p className="skill-desc">Giao tiếp đàm thoại với AI Sensei, phân tích độ chuẩn xác phát âm.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '30%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => setActiveTab('speaking')}>Bắt đầu</button>
                  </div>

                  {/* Kanji */}
                  <div className="skill-card">
                    <div className="skill-header">
                      <div className="skill-icon"><FileText size={18} /></div>
                      <span className="skill-progress-text">92%</span>
                    </div>
                    <div className="skill-info">
                      <span className="skill-name">Luyện tập Kanji</span>
                      <p className="skill-desc">Hệ thống trắc nghiệm nhận diện chữ Hán, bộ thủ và mẹo nhớ trực quan.</p>
                    </div>
                    <div className="skill-progress-bar">
                      <div className="skill-progress-fill" style={{ width: '92%' }}></div>
                    </div>
                    <button className="skill-btn" onClick={() => {
                      setSelectedKanjiOption(null);
                      setIsKanjiAnswerChecked(false);
                      setActiveTab('kanji');
                    }}>Bắt đầu</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lộ trình học viên */}
            {activeTab === 'lo-trinh' && (
              <div className="page-wrapper">
                <div className="page-intro">
                  <h2 className="page-heading">Lộ Trình Học Tập Cá Nhân</h2>
                  <p className="page-subheading">Hệ thống AI đề xuất nội dung ôn thi và giám sát mục tiêu hoàn thành.</p>
                </div>
                
                <div className="mock-test-section" style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer' }} onClick={() => setActiveTab('reading')}>
                  <div style={{ flex: 1 }}>
                    <span className="focus-badge" style={{ marginBottom: '12px' }}>ĐANG TRỌNG TÂM</span>
                    <h4 className="visual-japanese" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>読解 (Đọc hiểu N2)</h4>
                    <p className="mock-test-desc" style={{ marginTop: '8px' }}>Luyện tập đọc văn bản và trích xuất câu hỏi nội dung.</p>
                  </div>
                  <ChevronRight size={24} className="text-primary" />
                </div>

                <div className="skills-grid" style={{ marginTop: '20px' }}>
                  <div className="skill-card" onClick={() => setActiveTab('listening')}>
                    <div className="skill-header">
                      <span className="focus-badge">TIẾP THEO</span>
                    </div>
                    <h4 className="vocab-jp" style={{ fontSize: '18px' }}>聴解 (Nghe hiểu N2)</h4>
                    <p className="skill-desc">Luyện kỹ năng đàm thoại ga tàu điện ngầm và quán cà phê.</p>
                    <button className="skill-btn" style={{ marginTop: 'auto' }}>Mở bài học</button>
                  </div>

                  <div className="skill-card" onClick={() => setActiveTab('speaking')}>
                    <div className="skill-header">
                      <span className="focus-badge" style={{ backgroundColor: 'var(--text-light)' }}>ĐÃ XONG</span>
                    </div>
                    <h4 className="vocab-jp" style={{ fontSize: '18px' }}>会話 (Hội thoại N2)</h4>
                    <p className="skill-desc">Chủ đề nghề nghiệp và sử dụng kính ngữ.</p>
                    <button className="skill-btn" style={{ marginTop: 'auto' }}>Xem lại</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lý thuyết ngôn ngữ (Linguistic Theory) Tab - Separate page */}
            {activeTab === 'ly-thuyet' && (
              <div className="page-wrapper">
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="page-intro">
                    <h2 className="page-heading">Lý thuyết ngôn ngữ</h2>
                    <p className="page-subheading">
                      Tìm hiểu sâu sắc các cấu trúc nền tảng của tiếng Nhật. Làm chủ ngữ pháp, âm vị học và hệ thống chữ viết.
                    </p>
                  </div>
                  
                  <div className="streak-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)', fontSize: '12px' }}>
                    <span>{theoryData.roadmapTitle}</span>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> Gợi ý từ AI
                  </h3>
                  
                  <div className="dashboard-grid">
                    
                    {/* Passive Voice lesson box */}
                    <div className="rec-card primary" style={{ padding: '32px' }}>
                      <span className="focus-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', marginBottom: '8px' }}>
                        {theoryData.aiRec.badge}
                      </span>
                      <h4 style={{ fontSize: '28px', fontWeight: 800 }}>{theoryData.aiRec.title}</h4>
                      <p className="rec-desc" style={{ marginTop: '12px', fontSize: '15px' }}>
                        {theoryData.aiRec.desc}
                      </p>
                      <button className="rec-btn" style={{ marginTop: '24px', padding: '12px 24px', fontSize: '14px' }} onClick={() => alert('Bắt đầu bài giảng lý thuyết nâng cao!')}>
                        Bắt đầu học nâng cao <ChevronRight size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                      </button>
                    </div>

                    {/* Daily Kanji Core */}
                    <div className="focus-card" style={{ alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Hán tự cốt lõi hàng ngày</span>
                      <h2 style={{ fontSize: '72px', fontFamily: 'var(--font-jp)', margin: '12px 0', color: 'var(--text-primary)' }}>
                        {theoryData.kanjiCore.kanji}
                      </h2>
                      <p style={{ fontStyle: 'italic', fontSize: '14px', color: 'var(--text-secondary)' }}>{theoryData.kanjiCore.meaning}</p>
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', width: '100%', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>{theoryData.kanjiCore.retained}</span>
                        <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: 700 }}>{theoryData.kanjiCore.priority}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Grid list of skills */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>Kỹ năng Lý thuyết</h3>
                    <button className="skill-btn" style={{ width: 'auto', padding: '6px 16px' }}>Bộ lọc tất cả</button>
                  </div>

                  <div className="skills-grid">
                    {theoryData.skills.map((skill, idx) => (
                      <div key={idx} className="skill-card">
                        <div className="skill-header">
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>Tỷ lệ: {skill.mastery}</span>
                        </div>
                        <h4 className="vocab-jp" style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '8px' }}>{skill.name}</h4>
                        <p className="skill-desc" style={{ marginTop: '4px' }}>{skill.desc}</p>
                        <button className="skill-btn" style={{ marginTop: 'auto' }} onClick={() => alert(`Đang tải học trình lý thuyết của ${skill.name}`)}>
                          Học lý thuyết
                        </button>
                      </div>
                    ))}

                    {/* Progress Metrics card */}
                    <div className="skill-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>CHỈ SỐ TIẾN ĐỘ</span>
                      <h4 style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px' }}>Chỉ số Tiến độ</h4>
                      
                      <div style={{ margin: '16px 0 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span>Mục tiêu tuần</span>
                          <span>80%</span>
                        </div>
                        <div className="skill-progress-bar" style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                          <div className="skill-progress-fill" style={{ width: '80%', backgroundColor: 'white' }}></div>
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', opacity: 0.85, fontStyle: 'italic' }}>
                        "Bạn nằm trong top 5% học viên chăm chỉ nhất tuần này."
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Luyện Nói */}
            {activeTab === 'speaking' && (
              <div className="split-layout">
                <div className="main-column">
                  <div className="chat-container">
                    <div className="chat-header">
                      <span className="chat-header-title">Bản phiên âm đối thoại</span>
                      <span className="chat-header-badge">Đang hoạt động: N2</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`chat-bubble ${chat.sender}`}>
                          <span className="bubble-sender">
                            {chat.sender === 'teacher' ? <Volume2 size={12} /> : <User size={12} />}
                            {chat.senderName}
                          </span>
                          <p className="bubble-jp">{chat.jp}</p>
                          <p className="bubble-vi">{chat.vi}</p>
                        </div>
                      ))}

                      {isAiSpeaking && (
                        <div className="speaking-status">
                          <span>AI Sensei đang nói</span>
                          <div className="typing-dots">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sidebar-column">
                  <div className="visualizer-container">
                    <span className={`visualizer-status ${isRecording ? 'recording' : ''}`}>
                      {isRecording ? 'ĐANG GHI ÂM GIỌNG NÓI' : 'ĐANG CHỜ PHẢN HỒI'}
                    </span>

                    <div className="circle-visualizer">
                      <div className={`visualizer-ring ${isRecording ? 'recording' : ''}`}>
                        {isRecording ? (
                          <div className="waveform-container">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((h, i) => (
                              <div 
                                key={i} 
                                className="wave-bar active" 
                                style={{ 
                                  height: `${h * 4}px`,
                                  animationDelay: `${i * 0.08}s`
                                }}
                              ></div>
                            ))}
                          </div>
                        ) : (
                          <Mic size={48} className="text-light" />
                        )}
                      </div>
                      {isRecording && <div className="visualizer-pulse animate-pulse-ring"></div>}
                    </div>

                    <div className="topic-card">
                      <span className="topic-label">Chủ đề hội thoại</span>
                      <h4 className="topic-title">{speakingData.activeTopic}</h4>
                      <div className="topic-tags">
                        {speakingData.tags.map((tag, i) => (
                          <span key={i} className="topic-tag">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <button 
                      className={`record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={handleMicrophoneClick}
                      disabled={isAiSpeaking}
                    >
                      {isRecording ? <X size={32} /> : <Mic size={32} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Luyện Viết */}
            {activeTab === 'writing' && (
              <div className="split-layout equal">
                <div className="main-column">
                  <div className="writing-prompt-card">
                    <div className="prompt-icon-box"><FileText size={24} /></div>
                    <div className="prompt-details">
                      <span className="prompt-badge">Đề bài viết</span>
                      <h4 className="prompt-title-en">{writingData.promptTitleEn}</h4>
                      <p className="prompt-title-jp">{writingData.promptTitleJp}</p>
                      <div className="prompt-tags">
                        {writingData.tags.map((tag, i) => (
                          <span key={i} className="prompt-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="editor-container">
                    <div className="editor-toolbar">
                      <div className="toolbar-left">
                        <button className="toolbar-btn" onClick={() => setWritingText(writingData.initialText)}><RotateCcw size={16} /></button>
                      </div>
                      <div className="toolbar-right">
                        <span className="toolbar-info">Số ký tự: {writingText.length}</span>
                      </div>
                    </div>

                    <div className="editor-area-wrapper">
                      <div className="editor-backdrop">{renderHighlightedText()}</div>
                      <textarea className="editor-textarea" value={writingText} onChange={(e) => setWritingText(e.target.value)} />
                    </div>

                    {showWritingToast && (
                      <div className="editor-suggestion-toast">
                        <div className="toast-message-box">
                          <Sparkles size={16} className="toast-icon" />
                          <span className="toast-text">{writingData.aiSuggestion}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button className="toast-action-btn" onClick={handleAddToastSuggestion}>Thêm giúp tôi</button>
                          <button className="toast-close" onClick={() => setShowWritingToast(false)}><X size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sidebar-column">
                  <span className="section-title">Phản hồi từ AI</span>
                  {writingIssues.map(issue => !issue.solved && (
                    <div key={issue.id} className="issue-card error">
                      <span className="issue-label">{issue.label}</span>
                      <div className="issue-correction">
                        <span className="original-val">{issue.original}</span>
                        <ChevronRight size={14} className="issue-arrow" />
                        <span className="corrected-val">{issue.corrected}</span>
                      </div>
                      <p className="issue-desc">{issue.desc}</p>
                      <button className="apply-btn" onClick={() => applyCorrection(issue)}>Áp dụng sửa lỗi</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Luyện Kanji */}
            {activeTab === 'kanji' && (
              <div className="split-layout">
                <div className="main-column">
                  <div className="kanji-detail-card">
                    <span className="kanji-main-char">{kanjiQuizData[kanjiIndex].kanji}</span>
                    <span className="kanji-sino-viet">{kanjiQuizData[kanjiIndex].sinoViet}</span>
                    <p className="kanji-meaning">Nghĩa Việt: {kanjiQuizData[kanjiIndex].meaning}</p>
                  </div>

                  <div className="kanji-question-card">
                    <h4 className="question-prompt">{kanjiQuizData[kanjiIndex].question}</h4>
                    <div className="options-grid">
                      {kanjiQuizData[kanjiIndex].options.map(option => (
                        <button 
                          key={option.key} 
                          className="option-btn"
                          onClick={() => {
                            setSelectedKanjiOption(option.key);
                            setIsKanjiAnswerChecked(true);
                            if (option.correct) setCurrentUser(prev => ({ ...prev, xp: prev.xp + 20 }));
                          }}
                        >
                          {option.key}. {option.text}
                        </button>
                      ))}
                    </div>
                    <div className="nav-actions-row">
                      <button className="action-text-btn" onClick={() => setActiveTab('trang-chu')}>Bỏ qua</button>
                      <button className="action-filled-btn" onClick={() => {
                        if (kanjiIndex < kanjiQuizData.length - 1) {
                          setKanjiIndex(kanjiIndex + 1);
                          setSelectedKanjiOption(null);
                          setIsKanjiAnswerChecked(false);
                        } else {
                          setActiveTab('trang-chu');
                        }
                      }}>Tiếp theo</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Luyện Từ vựng */}
            {activeTab === 'vocab' && (
              <div className="split-layout">
                <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="focus-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: 'fit-content' }}>
                      CONTEXTUAL LEARNING
                    </span>
                    <h3 className="mock-test-title" style={{ fontSize: '24px', fontWeight: 800 }}>
                      Chọn từ phù hợp nhất vào chỗ trống
                    </h3>
                  </div>

                  <div className="vocab-main-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', backgroundColor: 'var(--bg-card)', position: 'relative', alignItems: 'center' }}>
                    
                    {/* Book Icon */}
                    <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center' }}>
                      <BookOpen size={48} />
                    </div>

                    <div className="vocab-sentence-box" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                      <span className="sentence-jp" style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-jp)', letterSpacing: '0.5px' }}>
                        明日の会議には、<span style={{ borderBottom: '2px solid var(--primary)', padding: '0 16px', color: 'var(--primary)' }}>
                          {selectedVocabOption ? vocabQuizData[vocabIndex].options.find(o => o.key === selectedVocabOption).text : '__________'}
                        </span> してください。
                      </span>
                      
                      <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 24px', borderRadius: 'var(--radius-md)', display: 'inline-block', margin: '0 auto', maxWidth: '80%' }}>
                        <span className="sentence-vi" style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 600 }}>
                          {vocabQuizData[vocabIndex].sentenceVi}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {vocabQuizData[vocabIndex].options.map(opt => {
                      const isSelected = selectedVocabOption === opt.key;
                      const isCorrect = opt.correct;
                      let borderStyle = '1px solid var(--border)';
                      let bgStyle = 'var(--bg-card)';
                      if (isSelected) {
                        borderStyle = '2px solid var(--primary)';
                        bgStyle = 'var(--primary-light)';
                      }
                      if (isVocabAnswerChecked) {
                        if (isCorrect) {
                          borderStyle = '2px solid var(--success)';
                          bgStyle = 'rgba(16, 185, 129, 0.1)';
                        } else if (isSelected) {
                          borderStyle = '2px solid var(--error)';
                          bgStyle = 'rgba(239, 68, 68, 0.1)';
                        }
                      }
                      
                      return (
                        <button 
                          key={opt.key} 
                          className="vocab-option-card-new"
                          onClick={() => {
                            if (!isVocabAnswerChecked) {
                              setSelectedVocabOption(opt.key);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '18px 24px',
                            borderRadius: 'var(--radius-md)',
                            border: borderStyle,
                            backgroundColor: bgStyle,
                            cursor: isVocabAnswerChecked ? 'default' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            position: 'relative'
                          }}
                        >
                          <div 
                            className="vocab-option-label" 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-main)', 
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {opt.key}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{opt.text}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 600 }}>{opt.roman} • {opt.translation}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <button 
                      className="action-text-btn" 
                      onClick={() => {
                        setSelectedVocabOption(null);
                        setIsVocabAnswerChecked(false);
                      }}
                      style={{ fontWeight: 700, fontSize: '15px' }}
                    >
                      Bỏ qua
                    </button>
                    
                    <button 
                      className="action-filled-btn"
                      disabled={selectedVocabOption === null}
                      onClick={() => {
                        if (!isVocabAnswerChecked) {
                          setIsVocabAnswerChecked(true);
                          const currentOpt = vocabQuizData[vocabIndex].options.find(o => o.key === selectedVocabOption);
                          if (currentOpt && currentOpt.correct) {
                            setCurrentUser(prev => ({ ...prev, xp: prev.xp + 20 }));
                          }
                        } else {
                          // Go to next or reset
                          setIsVocabAnswerChecked(false);
                          setSelectedVocabOption(null);
                          alert('Bạn đã hoàn thành bài luyện tập Từ vựng này!');
                          setActiveTab('bai-tap');
                        }
                      }}
                      style={{ padding: '14px 40px', fontSize: '15px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
                    >
                      {isVocabAnswerChecked ? 'TIẾP THEO' : 'KIỂM TRA'}
                    </button>
                  </div>
                </div>

                {/* Right Sidebar - AI Word Insights */}
                <div className="sidebar-column" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 className="recent-activity-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Sparkles size={16} /> AI Word Insights
                  </h3>

                  {/* Memorization Strategy */}
                  <div className="focus-card" style={{ padding: '20px', gap: '8px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                      📍 CHIẾN LƯỢC GHI NHỚ
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {vocabQuizData[vocabIndex].mnemonic.split(':')[0]}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {vocabQuizData[vocabIndex].mnemonic.split(':').slice(1).join(':')}
                    </p>
                  </div>

                  {/* Register context */}
                  <div className="focus-card" style={{ padding: '20px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.5px' }}>
                        REGISTER (NGỮ CẢNH)
                      </span>
                      <span className="focus-badge" style={{ backgroundColor: 'var(--primary)', color: 'white', fontSize: '9px' }}>
                        {vocabQuizData[vocabIndex].registerLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', fontWeight: 700 }}>
                      <span>Thân mật</span>
                      <span>Tiêu chuẩn</span>
                      <span>Trang trọng</span>
                    </div>

                    <div className="skill-progress-bar" style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div className="skill-progress-fill" style={{ width: `${vocabQuizData[vocabIndex].registerValue}%`, height: '100%' }}></div>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {vocabQuizData[vocabIndex].registerDesc}
                    </p>
                  </div>

                  {/* Collocations */}
                  <div className="focus-card" style={{ padding: '20px', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.5px' }}>
                      CỤM TỪ ĐI KÈM (COLLOCATIONS)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {vocabQuizData[vocabIndex].collocations.map((col, i) => (
                        <div key={i} style={{ padding: '10px 14px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-jp)', fontSize: '14px', fontWeight: 800 }}>{col.jp}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>({col.vi})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synonyms & Antonyms */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="focus-card" style={{ padding: '14px 16px', gap: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 800 }}>ĐỒNG NGHĨA</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-jp)' }}>
                        {vocabQuizData[vocabIndex].synonym}
                      </span>
                    </div>
                    <div className="focus-card" style={{ padding: '14px 16px', gap: '4px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 800 }}>PHẢN NGHĨA</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--error)', fontFamily: 'var(--font-jp)' }}>
                        {vocabQuizData[vocabIndex].antonym}
                      </span>
                    </div>
                  </div>

                  {/* Office Meeting Image */}
                  <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400" 
                      alt="Office Meeting" 
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Luyện tập Ngữ pháp */}
            {activeTab === 'grammar' && (
              <div className="split-layout">
                <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 className="mock-test-title" style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} className="text-primary" /> Sắp xếp câu
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Sắp xếp các từ sau để tạo thành câu hoàn chỉnh đúng với ngữ pháp N2.
                    </p>
                  </div>

                  <div className="vocab-main-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', backgroundColor: 'var(--bg-card)' }}>
                    
                    {/* Dịch nghĩa */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>文 Dịch nghĩa:</span>
                      <span style={{ fontWeight: 600 }}>{grammarQuizData.sentenceOrder.translation}</span>
                    </div>

                    {/* Target Answer Area (Dashed border) */}
                    <div 
                      style={{ 
                        minHeight: '80px', 
                        border: '2px dashed var(--primary-light)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '16px', 
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {grammarSelected.length === 0 ? (
                        <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: 600 }}>
                          Chọn các từ bên dưới để ghép câu vào đây...
                        </span>
                      ) : (
                        grammarSelected.map((w, idx) => (
                          <button
                            key={`${w.id}-${idx}`}
                            onClick={() => {
                              if (!isGrammarChecked) {
                                setGrammarSelected(prev => prev.filter((_, i) => i !== idx));
                                setGrammarRemaining(prev => [...prev, w]);
                              }
                            }}
                            style={{
                              padding: '10px 16px',
                              backgroundColor: 'white',
                              border: '1px solid var(--primary)',
                              borderRadius: '6px',
                              fontFamily: 'var(--font-jp)',
                              fontSize: '15px',
                              fontWeight: 700,
                              cursor: isGrammarChecked ? 'default' : 'pointer',
                              boxShadow: 'var(--shadow-sm)',
                              color: 'var(--primary)'
                            }}
                          >
                            {w.text}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Word Choices Scrambled */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '12px', 
                        justifyContent: 'center', 
                        padding: '16px 0',
                        minHeight: '60px'
                      }}
                    >
                      {grammarRemaining.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            if (!isGrammarChecked) {
                              setGrammarSelected(prev => [...prev, w]);
                              setGrammarRemaining(prev => prev.filter(item => item.id !== w.id));
                            }
                          }}
                          style={{
                            padding: '10px 18px',
                            backgroundColor: darkMode ? '#1e293b' : 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontFamily: 'var(--font-jp)',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            color: 'var(--text-primary)',
                            transition: 'transform 0.1s'
                          }}
                          className="grammar-word-pill"
                        >
                          {w.text}
                        </button>
                      ))}
                    </div>

                    {/* Verify Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                      <button 
                        className="action-text-btn"
                        onClick={() => {
                          setGrammarSelected([]);
                          setGrammarRemaining(grammarQuizData.sentenceOrder.words);
                          setIsGrammarChecked(false);
                          setIsGrammarCorrect(null);
                        }}
                        style={{ fontWeight: 700 }}
                      >
                        Xóa hết
                      </button>

                      <button 
                        className="action-filled-btn"
                        disabled={grammarSelected.length === 0}
                        onClick={() => {
                          if (!isGrammarChecked) {
                            setIsGrammarChecked(true);
                            // Verify order
                            const selectedIds = grammarSelected.map(w => w.id);
                            const correctIds = grammarQuizData.sentenceOrder.correctOrder;
                            const isCorrect = JSON.stringify(selectedIds) === JSON.stringify(correctIds);
                            setIsGrammarCorrect(isCorrect);
                            if (isCorrect) {
                              setCurrentUser(prev => ({ ...prev, xp: prev.xp + 30 }));
                            }
                          } else {
                            // Move next or finish
                            setIsGrammarChecked(false);
                            setIsGrammarCorrect(null);
                            setGrammarSelected([]);
                            setGrammarRemaining(grammarQuizData.sentenceOrder.words);
                            alert('Bạn đã hoàn thành bài tập ngữ pháp này!');
                            setActiveTab('bai-tap');
                          }
                        }}
                        style={{ padding: '10px 32px', borderRadius: 'var(--radius-sm)' }}
                      >
                        {isGrammarChecked ? 'TIẾP THEO' : 'KIỂM TRA'}
                      </button>
                    </div>

                    {/* Verify results feedback */}
                    {isGrammarChecked && (
                      <div 
                        style={{ 
                          padding: '16px', 
                          borderRadius: '6px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          backgroundColor: isGrammarCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isGrammarCorrect ? 'var(--success)' : 'var(--error)'}`,
                          color: isGrammarCorrect ? 'var(--success)' : 'var(--error)',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}
                      >
                        {isGrammarCorrect ? (
                          <>
                            <CheckCircle size={18} />
                            <span>Chính xác! Bạn ghép câu hoàn hảo và nhận thêm +30 XP!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} />
                            <span>Chưa chính xác! Thử lại hoặc xem gợi ý ngữ pháp bên dưới.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Grammar Notes at bottom */}
                  <div className="focus-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="focus-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                        GHI CHÚ NGỮ PHÁP
                      </span>
                      <h4 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-jp)' }}>
                        {grammarQuizData.grammarNote.title}
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800 }}>CẤU TRÚC</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 12px 0', fontFamily: 'var(--font-jp)' }}>
                          {grammarQuizData.grammarNote.structure}
                        </p>

                        <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 800 }}>Ý NGHĨA</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                          {grammarQuizData.grammarNote.meaning}
                        </p>
                      </div>

                      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800 }}>VÍ DỤ KHÁC</span>
                        <p style={{ fontSize: '14px', fontWeight: 800, margin: '4px 0 4px 0', fontFamily: 'var(--font-jp)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {grammarQuizData.grammarNote.otherExampleJp}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                          {grammarQuizData.grammarNote.otherExampleVi}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - AI Error Prevention */}
                <div className="sidebar-column" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 className="recent-activity-title" style={{ fontSize: '13px' }}>
                    AI Error Prevention
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    Dựa trên dữ liệu từ 5.000 học viên N2, đây là những lỗi phổ biến bạn cần tránh:
                  </p>

                  {grammarQuizData.aiErrorPrevention.map((err, idx) => {
                    let cardBg = 'var(--bg-card)';
                    let borderLeft = '4px solid var(--border)';
                    if (err.id === 'err-1') {
                      cardBg = 'rgba(239, 68, 68, 0.02)';
                      borderLeft = '4px solid var(--error)';
                    } else if (err.id === 'err-2') {
                      cardBg = 'rgba(245, 158, 11, 0.02)';
                      borderLeft = '4px solid var(--warning)';
                    } else {
                      cardBg = 'rgba(99, 102, 241, 0.02)';
                      borderLeft = '4px solid var(--primary)';
                    }

                    return (
                      <div 
                        key={idx} 
                        className="focus-card" 
                        style={{ 
                          padding: '16px 20px', 
                          gap: '8px', 
                          borderLeft: borderLeft,
                          backgroundColor: cardBg,
                          borderRadius: 'var(--radius-md)',
                          borderTop: '1px solid var(--border)',
                          borderRight: '1px solid var(--border)',
                          borderBottom: '1px solid var(--border)'
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 800, color: err.id === 'err-1' ? 'var(--error)' : err.id === 'err-2' ? 'var(--warning)' : 'var(--primary)' }}>
                          {err.title}
                        </span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {err.desc}
                        </p>
                        {err.wrong && (
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginTop: '4px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--error)' }}>Sai: {err.wrong}</span>
                            <span style={{ color: 'var(--success)' }}>Đúng: {err.right}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Desktop and Pen Illustration Image */}
                  <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', marginTop: 'auto' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400" 
                      alt="Study Desk" 
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Luyện tập Đọc hiểu */}
            {activeTab === 'reading' && (
              <div className="split-layout">
                <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="mock-test-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                      Luyện tập Đọc hiểu
                    </h3>
                    
                    <div className="furigana-toggle-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="furigana-toggle-lbl" style={{ fontSize: '12px', fontWeight: 800 }}>HIỂN THỊ FURIGANA</span>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={showFurigana}
                          onChange={(e) => setShowFurigana(e.target.checked)}
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>
                  </div>

                  <div className="reading-passage-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', backgroundColor: 'var(--bg-card)', position: 'relative' }}>
                    
                    {/* Furigana title */}
                    <div className="reading-title-jp" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                      {showFurigana ? (
                        <ruby style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-jp)' }}>
                          日本<rt style={{ fontSize: '12px' }}>にほん</rt>の文化<rt style={{ fontSize: '12px' }}>ぶんか</rt>と技術<rt style={{ fontSize: '12px' }}>ぎじゅつ</rt>
                        </ruby>
                      ) : (
                        <span style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-jp)' }}>日本の文化と技術</span>
                      )}
                    </div>

                    {/* Passage text */}
                    <div className="reading-text-wrapper" style={{ fontSize: '18px', lineHeight: '2.8', fontFamily: 'var(--font-jp)' }}>
                      {readingQuizData[readingIndex].passageMarkup.map((item, idx) => {
                        let isUnderline = item.isUnderline;
                        let textNode = item.text === 'ot' ? 'と' : item.text === 'hown' ? 'ほう' : item.text === 'どうn' ? 'どうにゅう' : item.text;
                        
                        let element = showFurigana && item.ruby ? (
                          <ruby key={idx} style={{ cursor: isUnderline ? 'pointer' : 'default' }}>
                            {textNode}
                            <rt>{item.ruby}</rt>
                          </ruby>
                        ) : (
                          <span key={idx} style={{ cursor: isUnderline ? 'pointer' : 'default' }}>
                            {textNode}
                          </span>
                        );

                        if (isUnderline) {
                          return (
                            <span 
                              key={idx} 
                              className="passage-underline-btn"
                              onClick={() => setDefinitionTooltip(item.wordMean)}
                              title="Click để xem nghĩa từ vựng"
                              style={{ borderBottom: '2px dashed var(--primary)', paddingBottom: '2px' }}
                            >
                              {element}
                            </span>
                          );
                        }

                        return element;
                      })}
                    </div>

                    {/* Word explanation tooltip */}
                    {definitionTooltip && (
                      <div 
                        style={{ 
                          marginTop: '24px', 
                          padding: '16px 20px', 
                          backgroundColor: 'var(--primary-light)', 
                          borderLeft: '4px solid var(--primary)', 
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          animation: 'slide-up 0.2s ease-out'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                            💡 GIẢI NGHĨA TỪ KHÓ
                          </span>
                          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {definitionTooltip}
                          </span>
                        </div>
                        <button 
                          onClick={() => setDefinitionTooltip(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 800, padding: '4px' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* bottom bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <button className="action-text-btn" onClick={() => setActiveTab('bai-tap')} style={{ fontWeight: 700 }}>
                      Bỏ qua
                    </button>
                    <button 
                      className="action-filled-btn"
                      onClick={() => {
                        if (isReadingAnswerChecked) {
                          setIsReadingAnswerChecked(false);
                          setSelectedReadingOption(null);
                          alert('Bạn đã hoàn thành bài tập Đọc hiểu!');
                          setActiveTab('bai-tap');
                        } else if (selectedReadingOption) {
                          setIsReadingAnswerChecked(true);
                          const isCorrect = readingQuizData[readingIndex].options.find(o => o.key === selectedReadingOption).correct;
                          if (isCorrect) {
                            setCurrentUser(prev => ({ ...prev, xp: prev.xp + 40 }));
                          }
                        } else {
                          alert('Vui lòng chọn đáp án!');
                        }
                      }}
                      style={{ padding: '12px 32px' }}
                    >
                      {isReadingAnswerChecked ? 'Tiếp theo' : 'Kiểm tra'}
                    </button>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="sidebar-column" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.5px' }}>
                    CÂU HỎI 1 / 4
                  </span>
                  
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {readingQuizData[readingIndex].question}
                  </h4>

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {readingQuizData[readingIndex].options.map(opt => {
                      const isSelected = selectedReadingOption === opt.key;
                      let borderStyle = '1px solid var(--border)';
                      let bgStyle = 'var(--bg-card)';
                      if (isSelected) {
                        borderStyle = '2px solid var(--primary)';
                        bgStyle = 'var(--primary-light)';
                      }
                      if (isReadingAnswerChecked) {
                        if (opt.correct) {
                          borderStyle = '2px solid var(--success)';
                          bgStyle = 'rgba(16, 185, 129, 0.08)';
                        } else if (isSelected) {
                          borderStyle = '2px solid var(--error)';
                          bgStyle = 'rgba(239, 68, 68, 0.08)';
                        }
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            if (!isReadingAnswerChecked) {
                              setSelectedReadingOption(opt.key);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: borderStyle,
                            backgroundColor: bgStyle,
                            cursor: isReadingAnswerChecked ? 'default' : 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border)',
                              backgroundColor: 'white',
                              flexShrink: 0
                            }}
                          ></div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {opt.key}. {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* AI Hint Box */}
                  <div style={{ marginTop: 'auto', padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> GỢI Ý TỪ AI SENSEI
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {readingQuizData[readingIndex].aiHint}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Luyện tập Nghe hiểu */}
            {activeTab === 'listening' && (
              <div className="split-layout">
                <div className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Audio player card */}
                  <div className="audio-player-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="audio-icon-box" style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Volume2 size={24} />
                    </div>

                    <div className="audio-details" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="audio-title" style={{ fontSize: '16px', fontWeight: 800 }}>
                        {listeningQuizData[listeningIndex].title}
                      </span>
                      <span className="audio-meta" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {listeningQuizData[listeningIndex].subtitle}
                      </span>
                    </div>

                    <div className="audio-controls-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Play/pause */}
                      <button 
                        className="audio-play-btn" 
                        onClick={() => setAudioPlaying(!audioPlaying)}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {audioPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: '2px' }} />}
                      </button>

                      {/* Progress bar */}
                      <div 
                        className="audio-progress-bar-container" 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const width = rect.width;
                          const clickPercent = clickX / width;
                          setAudioTime(Math.floor(clickPercent * listeningQuizData[listeningIndex].fullDuration));
                        }}
                        style={{ width: '160px', height: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '100px', cursor: 'pointer', position: 'relative' }}
                      >
                        <div 
                          className="audio-progress-fill" 
                          style={{ width: `${(audioTime / listeningQuizData[listeningIndex].fullDuration) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '100px' }}
                        ></div>
                      </div>

                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {Math.floor(audioTime / 60)}:{(audioTime % 60).toString().padStart(2, '0')} / 2:45
                      </span>

                      {/* Playback rate selector */}
                      <div className="audio-speed-controls" style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        {[0.5, 1.0, 1.5].map(rate => (
                          <button
                            key={rate}
                            onClick={() => setAudioRate(rate)}
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: '11px', 
                              fontWeight: 800, 
                              border: 'none', 
                              backgroundColor: audioRate === rate ? 'var(--primary-light)' : 'var(--bg-card)', 
                              color: audioRate === rate ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer' 
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transcript block */}
                  <div className="subtitle-panel" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.5px' }}>
                        BẢN PHỤ ĐỀ TRỰC TIẾP (NHẬT - VIỆT)
                      </span>
                      <button 
                        className="subtitle-show-all-btn" 
                        onClick={() => setShowAllSubtitles(!showAllSubtitles)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {showAllSubtitles ? 'Ẩn phụ đề chưa phát' : 'Hiện tất cả'}
                      </button>
                    </div>

                    <div className="subtitle-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '240px', overflowY: 'auto' }}>
                      {listeningQuizData[listeningIndex].dialog.map((line, idx) => {
                        const isBlurred = audioTime < line.time && !showAllSubtitles;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`subtitle-item ${isBlurred ? 'blurred' : ''}`}
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '48px 1fr', 
                              gap: '12px', 
                              fontSize: '15px', 
                              lineHeight: '1.6', 
                              transition: 'all 0.3s',
                              filter: isBlurred ? 'blur(4px)' : 'none',
                              opacity: isBlurred ? 0.35 : 1,
                              pointerEvents: isBlurred ? 'none' : 'auto'
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)' }}>
                              0:{line.time.toString().padStart(2, '0')}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontFamily: 'var(--font-jp)', color: 'var(--text-primary)', fontWeight: 800 }}>
                                {line.jpActual || line.jp}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {line.vi}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question block */}
                  <div className="focus-card" style={{ padding: '24px', gap: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ❓ Câu hỏi hiểu bài
                    </h4>
                    <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                      {listeningQuizData[listeningIndex].question}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listeningQuizData[listeningIndex].options.map(opt => {
                        const isSelected = selectedListeningOption === opt.key;
                        let borderStyle = '1px solid var(--border)';
                        let bgStyle = 'var(--bg-card)';
                        if (isSelected) {
                          borderStyle = '2px solid var(--primary)';
                          bgStyle = 'var(--primary-light)';
                        }
                        if (isListeningAnswerChecked) {
                          if (opt.correct) {
                            borderStyle = '2px solid var(--success)';
                            bgStyle = 'rgba(16, 185, 129, 0.08)';
                          } else if (isSelected) {
                            borderStyle = '2px solid var(--error)';
                            bgStyle = 'rgba(239, 68, 68, 0.08)';
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (!isListeningAnswerChecked) {
                                setSelectedListeningOption(opt.key);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 20px',
                              borderRadius: 'var(--radius-md)',
                              border: borderStyle,
                              backgroundColor: bgStyle,
                              cursor: isListeningAnswerChecked ? 'default' : 'pointer',
                              textAlign: 'left',
                              width: '100%',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border)',
                                backgroundColor: 'white',
                                flexShrink: 0
                              }}
                            ></div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button 
                        className="action-filled-btn"
                        disabled={selectedListeningOption === null}
                        onClick={() => {
                          if (isListeningAnswerChecked) {
                            setIsListeningAnswerChecked(false);
                            setSelectedListeningOption(null);
                            alert('Bạn đã hoàn thành bài tập Nghe hiểu!');
                            setActiveTab('bai-tap');
                          } else if (selectedListeningOption) {
                            setIsListeningAnswerChecked(true);
                            const isCorrect = listeningQuizData[listeningIndex].options.find(o => o.key === selectedListeningOption).correct;
                            if (isCorrect) {
                              setCurrentUser(prev => ({ ...prev, xp: prev.xp + 40 }));
                            }
                          }
                        }}
                      >
                        {isListeningAnswerChecked ? 'Tiếp theo' : 'Kiểm tra'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="sidebar-column" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 className="recent-activity-title" style={{ fontSize: '13px' }}>
                    💡 GỢI Ý NGHE HIỂU
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {listeningQuizData[listeningIndex].grammarTips.map((tip, idx) => (
                      <div key={idx} className="focus-card" style={{ padding: '16px', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="focus-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', fontSize: '10px' }}>
                            {tip.badge}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800 }}>{tip.title}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {tip.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Sensei bubble */}
                  <div style={{ marginTop: 'auto', padding: '16px 20px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                      Lời khuyên của AI Sensei
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                      "{listeningQuizData[listeningIndex].senseiAdvice}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hồ sơ cá nhân (Student Profile view) */}
            {activeTab === 'profile' && (
              <div className="page-wrapper">
                
                {/* Okaeri Card & Pro Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexGrow: 1 }}>
                    <img 
                      src={currentUser.avatar} 
                      alt="Avatar" 
                      style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--primary-light)' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 800 }}>
                        {currentUser.name === 'Akira Sato' ? 'Chào mừng trở lại, Akira!' : `Chào ${currentUser.name}!`}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>
                        Hành trình chinh phục JLPT N2 của bạn đã hoàn thành 64%. Hãy giữ vững phong độ!
                      </p>
                    </div>
                  </div>

                  <div className="promo-card" style={{ width: '380px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-lg)' }}>
                    <span className="focus-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', marginBottom: '8px' }}>THÀNH VIÊN PRO</span>
                    <h4 style={{ fontSize: '20px', fontWeight: 800 }}>Komorebi Pro</h4>
                    <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px', lineHeight: 1.4 }}>
                      Truy cập không giới hạn giáo trình N1 và các cuộc trò chuyện trực tuyến cùng gia sư AI.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>Gia hạn: 12/10/2026</span>
                      <button className="skill-btn" style={{ width: 'auto', backgroundColor: 'white', color: 'var(--primary)', border: 'none', padding: '6px 14px', fontSize: '12px' }} onClick={() => alert('Quản lý dịch vụ Pro')}>
                        Quản lý
                      </button>
                    </div>
                  </div>

                </div>

                {/* Stats cards grid */}
                <div className="skills-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  
                  {/* Streak */}
                  <div className="skill-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16px 20px', gap: '16px' }}>
                    <div className="custom-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                      <Flame size={20} fill="#ef4444" />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Chuỗi ngày</span>
                      <h4 style={{ fontSize: '24px', fontWeight: 800 }}>{currentUser.streak} ngày</h4>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="skill-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16px 20px', gap: '16px' }}>
                    <div className="custom-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
                      <Award size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Tổng điểm XP</span>
                      <h4 style={{ fontSize: '24px', fontWeight: 800 }}>{currentUser.xp.toLocaleString()}</h4>
                      <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>+450 hôm nay</span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="skill-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16px 20px', gap: '16px' }}>
                    <div className="custom-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--success)' }}>
                      <RotateCw size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Thời gian học</span>
                      <h4 style={{ fontSize: '24px', fontWeight: 800 }}>{currentUser.hours} giờ</h4>
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Top 5% tháng này</span>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="skill-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16px 20px', gap: '16px' }}>
                    <div className="custom-icon" style={{ backgroundColor: '#fffbeb', color: 'var(--warning)' }}>
                      <Compass size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Mục tiêu</span>
                      <h4 style={{ fontSize: '24px', fontWeight: 800 }}>N2 Nâng cao</h4>
                      <div className="skill-progress-bar" style={{ height: '4px', width: '80px', marginTop: '4px' }}>
                        <div className="skill-progress-fill" style={{ width: '64%' }}></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dashboard layout main content split */}
                <div className="split-layout" style={{ height: 'auto', overflow: 'visible' }}>
                  
                  {/* Left: SVG learning chart */}
                  <div className="focus-card" style={{ gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="recent-activity-title">Thống kê học tập</span>
                      <select className="form-select" style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}>
                        <option>7 ngày qua</option>
                        <option>Tháng này</option>
                      </select>
                    </div>

                    <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                        <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4" />
                        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4" />
                        <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4" />
                        <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border)" strokeWidth="0.5" />

                        <path d="M 40 170 L 40 120 L 113 90 L 186 130 L 259 80 L 332 50 L 405 110 L 478 170 Z" fill="rgba(60, 48, 211, 0.05)" />
                        
                        <path d="M 40 120 L 113 90 L 186 130 L 259 80 L 332 50 L 405 110 L 478 70" fill="none" stroke="var(--primary)" strokeWidth="3" />
                        
                        <line x1="40" y1="100" x2="480" y2="100" stroke="var(--success)" strokeWidth="2" strokeDasharray="6" />

                        <circle cx="40" cy="120" r="5" fill="var(--primary)" />
                        <circle cx="113" cy="90" r="5" fill="var(--primary)" />
                        <circle cx="186" cy="130" r="5" fill="var(--primary)" />
                        <circle cx="259" cy="80" r="5" fill="var(--primary)" />
                        <circle cx="332" cy="50" r="5" fill="var(--primary)" />
                        <circle cx="405" cy="110" r="5" fill="var(--primary)" />
                        <circle cx="478" cy="70" r="5" fill="var(--primary)" />

                        <text x="40" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">T2</text>
                        <text x="113" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">T3</text>
                        <text x="186" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">T4</text>
                        <text x="259" y="190" textAnchor="middle" fontSize="10" fill="var(--primary)" fontWeight="800">T5</text>
                        <text x="332" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">T6</text>
                        <text x="405" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">T7</text>
                        <text x="478" y="190" textAnchor="middle" fontSize="10" fill="var(--text-light)" fontWeight="700">CN</text>
                      </svg>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 700, justifyContent: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                        XP nhận được
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
                        Mục tiêu trung bình
                      </span>
                    </div>

                  </div>

                  {/* Right: Achievements & Settings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Achievements */}
                    <div className="focus-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="recent-activity-title" style={{ marginBottom: 0 }}>Thành tựu đạt được</span>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Xem tất cả</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Bậc thầy N3">
                          <div className="custom-icon" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: 'var(--primary)' }}><Award size={16} /></div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Hán tự N3</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Vua tăng tốc">
                          <div className="custom-icon" style={{ width: '36px', height: '36px', backgroundColor: '#fef2f2', color: '#ef4444' }}><Flame size={16} /></div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Nước rút</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Bạn thân AI">
                          <div className="custom-icon" style={{ width: '36px', height: '36px', backgroundColor: '#ecfdf5', color: 'var(--success)' }}><Sparkles size={16} /></div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Bạn AI</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Thành viên 30 ngày">
                          <div className="custom-icon" style={{ width: '36px', height: '36px', backgroundColor: '#fffbeb', color: 'var(--warning)' }}><Calendar size={16} /></div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>30 Ngày</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Chưa mở khóa">
                          <div className="custom-icon" style={{ width: '36px', height: '36px', backgroundColor: 'var(--bg-main)', color: 'var(--text-light)' }}><Lock size={16} /></div>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center' }}>Khóa</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Settings */}
                    <div className="focus-card" style={{ padding: '20px' }}>
                      <span className="recent-activity-title">Cài đặt nhanh</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} onClick={handleToggleUserAccount}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <User size={16} className="text-primary" />
                            <span>Chuyển tài khoản (Admin/Học viên)</span>
                          </div>
                          <ChevronRight size={14} className="text-light" />
                        </div>

                        {currentUser.role === 'Quản trị viên' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setIsAdminMode(true)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Sliders size={16} style={{ color: '#059669' }} />
                              <span style={{ color: '#059669' }}>Truy cập trang Quản trị</span>
                            </div>
                            <ChevronRight size={14} className="text-light" />
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={16} className="text-primary" />
                            <span>Ngôn ngữ hiển thị</span>
                          </div>
                          <span className="text-light" style={{ fontSize: '12px' }}>Tiếng Việt</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Moon size={16} className="text-primary" />
                            <span>Giao diện tối</span>
                          </div>
                          <button 
                            className="action-btn" 
                            onClick={() => setDarkMode(!darkMode)}
                            style={{ color: 'var(--primary)' }}
                          >
                            {darkMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-light" />}
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: 'var(--error)', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }} onClick={handleLogout}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LogOut size={16} style={{ color: 'var(--error)' }} />
                            <span>Đăng xuất tài khoản</span>
                          </div>
                          <ChevronRight size={14} style={{ color: 'var(--error)' }} />
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* User Dashboard Fields */}
                <div className="focus-card" style={{ gap: '20px' }}>
                  <span className="recent-activity-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    Bảng điều khiển học viên
                  </span>

                  <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Tên hiển thị</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.name} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Địa chỉ Email</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.email} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Ngôn ngữ mẹ đẻ</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value="Tiếng Việt" readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Mục tiêu ngày</span>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Sửa</span>
                      </div>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.goal} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Kỹ năng trọng tâm</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['KANJI', 'NGỮ PHÁP', 'NGHE HIỂU'].map(pill => (
                          <span key={pill} style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Thành viên từ</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.memberSince} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Ngày sinh</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.dob} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Số điện thoại</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.phone} readOnly />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase' }}>Địa chỉ nhà</span>
                      <input type="text" className="search-input" style={{ width: '100%', borderRadius: '4px', cursor: 'default' }} value={currentUser.address} readOnly />
                    </div>

                  </div>
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Floating chatbot assistant */}
      <button 
        className="float-chat-btn animate-pulse-ring"
        onClick={() => setShowHelperChat(!showHelperChat)}
        title="Trợ lý AI Sensei trực tuyến"
      >
        <MessageSquare size={24} />
      </button>

      {showHelperChat && (
        <div className="helper-chat-panel">
          <div className="helper-chat-header">
            <span className="helper-chat-title">AI Sensei Assistant</span>
            <button className="action-btn" style={{ color: 'white' }} onClick={() => setShowHelperChat(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="helper-chat-body">
            {helperMessages.map((msg, idx) => (
              <div key={idx} className={`helper-bubble ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="helper-chat-input-row">
            <input 
              type="text" 
              className="helper-input"
              placeholder="Hỏi về ngữ pháp, bài tập..."
              value={helperInput}
              onChange={(e) => setHelperInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendHelperMessage();
              }}
            />
            <button className="helper-send-btn" onClick={handleSendHelperMessage}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mock Test Ready Modal */}
      {showTestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowTestModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Sparkles size={22} />
              <span>Đề thi thử đã sẵn sàng</span>
            </h3>
            <p className="modal-desc">
              Hệ thống AI đã biên soạn xong cấu trúc đề thi thử JLPT N2.
            </p>
            <div className="modal-buttons">
              <button className="action-text-btn" onClick={() => setShowTestModal(false)}>Hủy</button>
              <button className="action-filled-btn" onClick={handleStartMockTest}>Bắt đầu làm bài</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
