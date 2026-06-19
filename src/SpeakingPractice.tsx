import React, { useState, useRef } from 'react';

export default function SpeakingPractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ userSpeechText: string; evaluation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Bắt đầu ghi âm
  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      setAudioUrl(URL.createObjectURL(audioBlob));
      
      // Tự động gửi file lên Backend sau khi dừng ghi âm
      await uploadAudio(audioBlob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  // Dừng ghi âm
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Tắt micro
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Gửi file audio lên Backend FastAPI/Express
  const uploadAudio = async (blob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');

    try {
      const response = await fetch('http://localhost:8000/api/assessment/speaking', {
        method: 'POST',
        body: formData, // Không để Header Content-Type, trình duyệt sẽ tự gán boundary
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Lỗi gửi file ghi âm:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-xl mx-auto mt-10 text-center">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Luyện Phát Âm Tiếng Nhật Tiêu Chuẩn</h2>
      
      <div className="mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-full font-semibold text-white transition-all ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRecording ? '🛑 Dừng & Chấm điểm' : '🎙️ Bắt đầu Nói'}
        </button>
      </div>

      {loading && <p className="text-blue-500 animate-bounce">Groq Whisper đang xử lý giọng nói...</p>}

      {result && (
        <div className="text-left bg-gray-50 p-4 rounded-lg border space-y-3">
          <div>
            <h4 className="font-semibold text-gray-700">🗣️ Câu bạn vừa nói (Whisper nhận diện):</h4>
            <p className="text-lg text-indigo-600 font-medium bg-white p-2 rounded border mt-1">{result.userSpeechText}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">🤖 Đánh giá từ Chuyên gia (Evaluation Expert):</h4>
            <div className="text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border mt-1">{result.evaluation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
