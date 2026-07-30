import React, { useState } from 'react';
import { History, Volume2, Brain, Zap, Star, BookOpen, Check, Filter, Calendar } from 'lucide-react';
import { ExitTicket, VocabularyItem, ESPCategory } from '../types';
import { toggleVocabularyMastered } from '../lib/storage';
import { speechHandler } from '../lib/speech';

interface ReviewViewProps {
  exitTickets: ExitTicket[];
  vocabularyList: VocabularyItem[];
  userMajor: ESPCategory;
  onOpenTicket: (ticket: ExitTicket) => void;
  onUpdateVocabulary: (updatedList: VocabularyItem[]) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  exitTickets,
  vocabularyList,
  userMajor,
  onOpenTicket,
  onUpdateVocabulary
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'vocab'>('history');
  const [selectedEspCategory, setSelectedEspCategory] = useState<string>('all');

  const handleToggleMastered = (id: string) => {
    const updated = toggleVocabularyMastered(id);
    onUpdateVocabulary(updated);
  };

  const playAudio = (text: string) => {
    speechHandler.speakText(text, 0.95);
  };

  const filteredVocab = vocabularyList.filter(item => {
    if (selectedEspCategory === 'all') return true;
    if (selectedEspCategory === 'major') return item.espCategory === userMajor;
    return item.espCategory.toLowerCase() === selectedEspCategory.toLowerCase();
  });

  return (
    <div className="px-5 pt-4 pb-28 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#181c1e] mb-1">지난 학습 기록 & 성찰</h2>
        <p className="text-xs text-[#3c4947]">
          AI와 진행했던 대화 일지, 성찰 메모, 어휘 저장소를 복습하세요.
        </p>
      </div>

      {/* Top Stats Cards */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20">
          <p className="text-xs text-[#3c4947] mb-1">총 학습 시간</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-[#006a63]">12</span>
            <span className="text-xs font-semibold text-[#181c1e] pb-0.5">시간</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20">
          <p className="text-xs text-[#3c4947] mb-1">완료한 대화</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-[#006a63]">{exitTickets.length + 45}</span>
            <span className="text-xs font-semibold text-[#181c1e] pb-0.5">개</span>
          </div>
        </div>
      </section>

      {/* View Switcher: Conversation History vs Vocabulary Repository */}
      <div className="flex bg-[#ebeef0] p-1 rounded-full border border-[#bbc9c7]/30">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
            activeTab === 'history'
              ? 'bg-[#006a63] text-white shadow-xs'
              : 'text-[#3c4947] hover:text-[#006a63]'
          }`}
        >
          대화 및 성찰 일지 ({exitTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
            activeTab === 'vocab'
              ? 'bg-[#006a63] text-white shadow-xs'
              : 'text-[#3c4947] hover:text-[#006a63]'
          }`}
        >
          어휘/표현 저장소 ({vocabularyList.length})
        </button>
      </div>

      {/* Tab 1: Conversation History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {exitTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onOpenTicket(ticket)}
                className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 transition-all hover:border-[#006a63] cursor-pointer active:scale-[0.99] space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4fd1c5]/20 text-[#005750] mb-1.5">
                      {ticket.scenarioTitle}
                    </span>
                    <h3 className="text-base font-bold text-[#181c1e]">
                      {ticket.scenarioTitle}
                    </h3>
                  </div>
                  <span className="text-xs text-[#3c4947]">{ticket.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#006a63] text-[9px] flex items-center justify-center text-white font-bold">AI</div>
                    <div className="w-5 h-5 rounded-full bg-[#dfe0e0] text-[9px] flex items-center justify-center text-[#616363] font-bold">ME</div>
                  </div>
                  <p className="text-xs text-[#3c4947]">Score: {ticket.overallScore}점 • Fluency: {ticket.fluencyLevel}</p>
                </div>

                {/* AI Insights Note */}
                <div className="bg-[#f1f4f6] p-3 rounded-xl flex items-start gap-2 text-xs">
                  <Brain className="w-4 h-4 text-[#006a63] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#006a63]">AI Insights</p>
                    <p className="text-[#3c4947] italic line-clamp-2">
                      "{ticket.encouragement}"
                    </p>
                  </div>
                </div>

                {/* Learner Self-Reflection Note if present */}
                {ticket.selfReflection && (
                  <div className="bg-[#4fd1c5]/10 p-2.5 rounded-xl text-xs border border-[#4fd1c5]/20">
                    <span className="font-bold text-[#005750]">📝 Self-Reflection: </span>
                    <span className="text-[#181c1e]">{ticket.selfReflection}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Weekly Progress Mini Chart */}
          <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] space-y-4">
            <h3 className="font-bold text-base text-[#181c1e]">주간 학습 활동 (발화 수)</h3>
            <div className="flex justify-between items-end h-28 px-2">
              {[
                { day: '월', height: '40%', bg: 'bg-[#dfe0e0]' },
                { day: '화', height: '85%', bg: 'bg-[#006a63]' },
                { day: '수', height: '30%', bg: 'bg-[#dfe0e0]' },
                { day: '목', height: '60%', bg: 'bg-[#006a63]' },
                { day: '금', height: '95%', bg: 'bg-[#4fd1c5]' },
                { day: '토', height: '20%', bg: 'bg-[#dfe0e0]' },
                { day: '일', height: '10%', bg: 'bg-[#bbc9c7]/30' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className={`w-7 ${item.bg} rounded-t-lg transition-all duration-700`} style={{ height: item.height }} />
                  <span className="text-xs text-[#3c4947]">{item.day}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Vocabulary & ESP Expression Repository */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: '전체' },
              { id: 'major', label: `내 전공 (${userMajor})` },
              { id: 'Engineering', label: 'Engineering' },
              { id: 'Business', label: 'Business' },
              { id: 'Hospitality', label: 'Hospitality' },
              { id: 'General', label: 'General' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedEspCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedEspCategory === cat.id
                    ? 'bg-[#006a63] text-white'
                    : 'bg-white border border-[#bbc9c7]/30 text-[#3c4947]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Vocabulary List */}
          <div className="space-y-3">
            {filteredVocab.map((vocab) => (
              <div
                key={vocab.id}
                className={`bg-white p-4 rounded-2xl border shadow-xs flex items-start justify-between gap-3 transition-all ${
                  vocab.mastered ? 'border-[#4fd1c5] bg-[#4fd1c5]/5' : 'border-[#bbc9c7]/30'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#006a63]">{vocab.expression}</span>
                    <button
                      onClick={() => playAudio(vocab.expression)}
                      className="p-1 text-[#006a63] hover:bg-[#4fd1c5]/20 rounded-full"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] bg-[#dfe0e0] text-[#616363] px-2 py-0.5 rounded-full font-bold">
                      ESP: {vocab.espCategory}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#181c1e]">{vocab.meaning}</p>
                  <p className="text-xs text-[#3c4947] italic">"{vocab.exampleSentence}"</p>
                </div>

                <button
                  onClick={() => handleToggleMastered(vocab.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    vocab.mastered
                      ? 'bg-[#006a63] text-white'
                      : 'border border-[#bbc9c7] text-[#bbc9c7] hover:border-[#006a63]'
                  }`}
                  title={vocab.mastered ? "암기 완료" : "암기 완료로 표시"}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
