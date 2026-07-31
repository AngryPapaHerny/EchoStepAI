import React, { useMemo, useState } from 'react';
import { Volume2, Brain, BookOpen, Check } from 'lucide-react';
import { ExitTicket, UserProfile, VocabularyItem } from '../types';
import { setVocabularyMastered } from '../lib/db';
import { speechHandler } from '../lib/speech';

interface ReviewViewProps {
  user: UserProfile;
  exitTickets: ExitTicket[];
  vocabularyList: VocabularyItem[];
  onOpenTicket: (ticket: ExitTicket) => void;
  /** 어휘 상태가 바뀌어 상위에서 데이터를 다시 불러와야 할 때 호출된다. */
  onVocabularyChanged: () => void;
}

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const ReviewView: React.FC<ReviewViewProps> = ({
  user,
  exitTickets,
  vocabularyList,
  onOpenTicket,
  onVocabularyChanged
}) => {
  const userMajor = user.majorOrJob;
  const [activeTab, setActiveTab] = useState<'history' | 'vocab'>('history');
  const [selectedEspCategory, setSelectedEspCategory] = useState<string>('all');
  const [pendingVocabId, setPendingVocabId] = useState<string | null>(null);

  const handleToggleMastered = async (item: VocabularyItem) => {
    if (pendingVocabId) return;
    setPendingVocabId(item.id);
    try {
      await setVocabularyMastered(item.id, !item.mastered);
      onVocabularyChanged();
    } catch (err) {
      console.error('Failed to update vocabulary:', err);
    } finally {
      setPendingVocabId(null);
    }
  };

  const playAudio = (text: string) => {
    speechHandler.speakText(text, 0.95);
  };

  const filteredVocab = vocabularyList.filter(item => {
    if (selectedEspCategory === 'all') return true;
    if (selectedEspCategory === 'major') return item.espCategory === userMajor;
    return item.espCategory.toLowerCase() === selectedEspCategory.toLowerCase();
  });

  /** 최근 7일간 요일별 세션 수 (주간 학습 활동 차트용) */
  const weeklyActivity = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(startOfToday);
      date.setDate(date.getDate() - (6 - offset));
      return { date, label: KOREAN_WEEKDAYS[date.getDay()], count: 0 };
    });

    for (const ticket of exitTickets) {
      const created = new Date(ticket.createdAt);
      created.setHours(0, 0, 0, 0);
      const slot = days.find(d => d.date.getTime() === created.getTime());
      if (slot) slot.count += 1;
    }

    const max = Math.max(1, ...days.map(d => d.count));
    return days.map(d => ({ ...d, ratio: d.count / max }));
  }, [exitTickets]);

  const totalStudyHours = Math.floor(user.totalStudyMinutes / 60);
  const masteredCount = vocabularyList.filter(v => v.mastered).length;

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
            <span className="text-2xl font-bold text-[#006a63]">{totalStudyHours}</span>
            <span className="text-xs font-semibold text-[#181c1e] pb-0.5">
              시간 {user.totalStudyMinutes % 60}분
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20">
          <p className="text-xs text-[#3c4947] mb-1">완료한 대화</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-[#006a63]">{user.completedSessionsCount}</span>
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
          {exitTickets.length === 0 && (
            <EmptyState
              title="아직 완료한 과업이 없습니다"
              description="'상황 선택'에서 시나리오를 골라 첫 롤플레이를 마치면 AI 성찰 일지가 여기에 쌓입니다."
            />
          )}

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
            <h3 className="font-bold text-base text-[#181c1e]">주간 학습 활동 (완료한 과업 수)</h3>
            <div className="flex justify-between items-end h-28 px-2">
              {weeklyActivity.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#006a63] h-3">
                    {item.count > 0 ? item.count : ''}
                  </span>
                  <div
                    className={`w-7 rounded-t-lg transition-all duration-700 ${
                      item.count > 0 ? 'bg-[#006a63]' : 'bg-[#dfe0e0]'
                    }`}
                    style={{ height: `${Math.max(item.ratio * 100, 6)}%` }}
                  />
                  <span className="text-xs text-[#3c4947]">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Vocabulary & ESP Expression Repository */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {vocabularyList.length > 0 && (
            <p className="text-xs text-[#3c4947]">
              총 {vocabularyList.length}개 중{' '}
              <span className="font-bold text-[#006a63]">{masteredCount}개</span> 암기 완료
            </p>
          )}

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

          {filteredVocab.length === 0 && (
            <EmptyState
              title={
                vocabularyList.length === 0
                  ? '아직 저장된 표현이 없습니다'
                  : '이 분야에 해당하는 표현이 없습니다'
              }
              description={
                vocabularyList.length === 0
                  ? '롤플레이를 마치고 성찰 일지를 저장하면 AI가 뽑아낸 핵심 표현이 자동으로 쌓입니다.'
                  : '다른 ESP 분야 필터를 선택해보세요.'
              }
            />
          )}

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
                  onClick={() => handleToggleMastered(vocab)}
                  disabled={pendingVocabId === vocab.id}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-50 ${
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

const EmptyState: React.FC<{ title: string; description: string }> = ({
  title,
  description
}) => (
  <div className="bg-white border border-dashed border-[#bbc9c7]/60 rounded-2xl p-8 flex flex-col items-center text-center gap-2">
    <div className="w-12 h-12 rounded-full bg-[#4fd1c5]/15 flex items-center justify-center text-[#006a63]">
      <BookOpen className="w-6 h-6" />
    </div>
    <p className="text-sm font-bold text-[#181c1e]">{title}</p>
    <p className="text-xs text-[#3c4947] max-w-xs leading-relaxed">{description}</p>
  </div>
);
