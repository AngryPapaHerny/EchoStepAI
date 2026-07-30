import React, { useState, useEffect } from 'react';
import { Stars, Check, X, Volume2, Save, Home, Sparkles, Send, RefreshCw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExitTicket, ChatMessage, Scenario, UserProfile } from '../types';
import { saveExitTicket } from '../lib/storage';
import { speechHandler } from '../lib/speech';

interface ExitTicketModalProps {
  existingTicket?: ExitTicket | null;
  scenario?: Scenario;
  user?: UserProfile;
  transcript?: ChatMessage[];
  onClose: () => void;
  onSaved: (ticket: ExitTicket) => void;
}

export const ExitTicketModal: React.FC<ExitTicketModalProps> = ({
  existingTicket,
  scenario,
  user,
  transcript,
  onClose,
  onSaved
}) => {
  const [ticket, setTicket] = useState<ExitTicket | null>(existingTicket || null);
  const [loading, setLoading] = useState<boolean>(!existingTicket);
  const [selfReflectionText, setSelfReflectionText] = useState<string>(existingTicket?.selfReflection || '');
  const [isSaved, setIsSaved] = useState<boolean>(!!existingTicket);

  // Trigger celebration confetti on initial load
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#006a63', '#4fd1c5', '#79f7ea']
    });
  }, []);

  // Fetch or generate exit ticket if new session
  useEffect(() => {
    if (existingTicket) return;

    async function generateTicket() {
      setLoading(true);
      try {
        const response = await fetch('/api/chat/exit-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioTitle: scenario?.title || "Roleplay Task",
            transcript: transcript || [],
            userMajorOrJob: user?.majorOrJob || "General",
            selfReflection: selfReflectionText
          })
        });

        const data = await response.json();

        const newTicket: ExitTicket = {
          id: `ticket-${Date.now()}`,
          scenarioId: scenario?.id || 'custom',
          scenarioTitle: scenario?.titleKo || scenario?.title || '역할극 과업',
          overallScore: data.overallScore || 88,
          fluencyLevel: data.fluencyLevel || 'Advanced',
          accuracyLevel: data.accuracyLevel || 'Good',
          topMistakes: data.topMistakes || [],
          newExpressions: (data.newExpressions || []).map((exp: any, idx: number) => ({
            id: `vocab-${Date.now()}-${idx}`,
            expression: exp.expression,
            meaning: exp.meaning,
            exampleSentence: exp.exampleSentence,
            espCategory: exp.espCategory || user?.majorOrJob || 'General',
            dateAdded: new Date().toISOString().split('T')[0]
          })),
          encouragement: data.encouragement || "Great job today! Your speaking confidence is visibly growing.",
          cafData: data.cafData || { fluencyScore: 85, accuracyScore: 80, complexityScore: 78 },
          selfReflection: selfReflectionText,
          date: '오늘'
        };

        setTicket(newTicket);
      } catch (err) {
        console.error('Error fetching exit ticket:', err);
      } finally {
        setLoading(false);
      }
    }

    generateTicket();
  }, [existingTicket]);

  const handleSave = () => {
    if (!ticket) return;
    const updatedTicket = { ...ticket, selfReflection: selfReflectionText };
    saveExitTicket(updatedTicket);
    setIsSaved(true);
    onSaved(updatedTicket);
  };

  const playAudio = (text: string) => {
    speechHandler.speakText(text, 0.95);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f7fafc] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#4fd1c5]/20 flex items-center justify-center animate-spin text-[#006a63]">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#006a63]">AI 출구 성찰 일지(Exit Ticket) 생성 중...</h2>
        <p className="text-xs text-[#3c4947] max-w-xs">
          과업 대화 내용을 분석하여 주요 오류 교정안과 핵심 어휘를 추출하고 있습니다.
        </p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#f7fafc] overflow-y-auto pb-28 max-w-2xl mx-auto shadow-2xl">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#f7fafc]/90 backdrop-blur-md px-5 h-16 flex items-center justify-between border-b border-[#bbc9c7]/30">
        <h1 className="font-bold text-lg text-[#006a63] flex items-center gap-2">
          <Award className="w-5 h-5" /> 학습 결과 및 성찰 피드백
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#4fd1c5]/20 text-[#006a63]"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="px-5 pt-4 space-y-6">
        {/* Header Summary Banner */}
        <section className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 bg-[#79f7ea] rounded-full flex items-center justify-center mb-3 shadow-md animate-bounce">
            <Stars className="w-8 h-8 text-[#006a63]" />
          </div>
          <h2 className="text-2xl font-bold text-[#181c1e] mb-1">Great job today!</h2>
          <p className="text-xs text-[#3c4947]">{ticket.encouragement}</p>
        </section>

        {/* Bento Performance Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-white border border-[#bbc9c7]/30 rounded-2xl p-4 shadow-[0_4px_12px_rgba(49,151,149,0.08)] flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6c7a77] font-medium mb-1">Overall Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#006a63]">{ticket.overallScore}</span>
                <span className="text-xs text-[#3c4947]">/ 100</span>
              </div>
            </div>
            <div className="w-32 h-3 bg-[#4fd1c5]/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006a63] rounded-full transition-all duration-1000"
                style={{ width: `${ticket.overallScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#bbc9c7]/30 rounded-2xl p-4 shadow-[0_4px_12px_rgba(49,151,149,0.08)]">
            <p className="text-xs text-[#6c7a77] font-medium">Fluency (유창성)</p>
            <p className="text-lg font-bold text-[#181c1e]">{ticket.fluencyLevel}</p>
            <span className="text-[10px] text-[#006a63]">CAF: {ticket.cafData.fluencyScore} pts</span>
          </div>

          <div className="bg-white border border-[#bbc9c7]/30 rounded-2xl p-4 shadow-[0_4px_12px_rgba(49,151,149,0.08)]">
            <p className="text-xs text-[#6c7a77] font-medium">Accuracy (정확성)</p>
            <p className="text-lg font-bold text-[#181c1e]">{ticket.accuracyLevel}</p>
            <span className="text-[10px] text-[#006a68]">CAF: {ticket.cafData.accuracyScore} pts</span>
          </div>
        </section>

        {/* My Mistakes Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#181c1e]">My Mistakes (주요 실수 TOP 3)</h3>
            <span className="bg-[#ffdad6] text-[#93000a] px-2.5 py-0.5 rounded-full text-xs font-bold">
              {ticket.topMistakes.length} Corrections
            </span>
          </div>

          <div className="space-y-3">
            {ticket.topMistakes.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#bbc9c7]/30 rounded-2xl p-4 shadow-[0_4px_12px_rgba(49,151,149,0.08)] space-y-2.5"
              >
                {/* Incorrect */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  </div>
                  <p className="text-xs text-[#3c4947] italic">"{item.mistake}"</p>
                </div>

                {/* Correct */}
                <div className="flex gap-2.5 bg-[#4fd1c5]/10 p-3 rounded-xl border border-[#4fd1c5]/20">
                  <div className="w-5 h-5 rounded-full bg-[#4fd1c5] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#005750]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#005750]">"{item.correction}"</p>
                    <p className="text-[11px] text-[#005750]/80 mt-0.5">{item.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Expressions Section */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[#181c1e]">New Expressions (오늘 배운 핵심 표현)</h3>
          <div className="flex flex-wrap gap-2">
            {ticket.newExpressions.map((exp, idx) => (
              <div
                key={idx}
                onClick={() => playAudio(exp.expression)}
                className="bg-[#6ecdcb]/20 border border-[#6ecdcb]/40 px-3.5 py-2 rounded-2xl flex items-center gap-2 hover:bg-[#6ecdcb]/40 transition-all cursor-pointer text-xs font-semibold text-[#005655]"
              >
                <span>{exp.expression}</span>
                <Volume2 className="w-3.5 h-3.5 text-[#006a68]" />
              </div>
            ))}
          </div>
        </section>

        {/* Self-Reflection Input Form */}
        <section className="bg-white border border-[#bbc9c7]/30 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-[#006a63] font-bold text-sm">
            <Sparkles className="w-4 h-4 text-[#006a63]" />
            Self-Reflection (오늘 과업에서 깨달은 점)
          </div>
          <p className="text-xs text-[#3c4947]">
            AI와 대화하며 깨달은 유용한 정황적 표현이나 나만의 팁을 적어보세요.
          </p>
          <textarea
            value={selfReflectionText}
            onChange={(e) => setSelfReflectionText(e.target.value)}
            placeholder="예: 공항 상황에서 'I was wondering if...'를 사용하면 훨씬 부드럽게 요청할 수 있다는 점을 깨달았다."
            className="w-full h-24 p-3 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-xs text-[#181c1e] focus:outline-none focus:border-[#006a63]"
          />
        </section>

        {/* Action Buttons */}
        <section className="space-y-2.5 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="w-full h-12 bg-[#006a63] text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#005750] disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaved ? '성찰 일지가 저장되었습니다' : '성찰 보고서 저장하기'}
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 bg-white border-2 border-[#4fd1c5] text-[#006a63] rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#4fd1c5]/10 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            홈으로 이동
          </button>
        </section>
      </main>
    </div>
  );
};
