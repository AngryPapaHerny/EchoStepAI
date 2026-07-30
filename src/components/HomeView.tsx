import React from 'react';
import { Mic, Sparkles, BarChart3, AlertCircle, Lightbulb, ChevronRight, Plane, Award, ArrowRight } from 'lucide-react';
import { UserProfile, ExitTicket, Scenario } from '../types';

interface HomeViewProps {
  user: UserProfile;
  todaysScenario: Scenario;
  recentTickets: ExitTicket[];
  onStartRoleplay: (scenario: Scenario) => void;
  onOpenReflection: (ticket?: ExitTicket) => void;
  onNavigateTab: (tab: 'practice' | 'review') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  todaysScenario,
  recentTickets,
  onStartRoleplay,
  onOpenReflection,
  onNavigateTab
}) => {
  const latestTicket = recentTickets[0];

  return (
    <div className="px-5 pt-4 pb-28 space-y-6 max-w-2xl mx-auto">
      {/* 1. Today's Challenge Section */}
      <section className="space-y-3">
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 relative overflow-hidden group">
          <div className="relative z-10 space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#94f2f0] text-[#00504e] font-semibold text-xs">
              오늘의 도전 과업
            </span>
            <h2 className="text-2xl font-bold text-[#181c1e] leading-tight">
              {todaysScenario.titleKo || todaysScenario.title}
            </h2>
            <p className="text-[#3c4947] text-sm">
              실제 상황처럼 AI와 대화하며 실력을 쌓아보세요.
            </p>
          </div>

          {/* Background Illustration / Watermark */}
          <div className="absolute -right-3 -bottom-3 w-36 h-36 opacity-15 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#006a63] to-[#4fd1c5] flex items-center justify-center text-white font-black text-4xl">
              Echo
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-col gap-2.5 relative z-10">
            <button
              onClick={() => onStartRoleplay(todaysScenario)}
              className="flex items-center justify-center gap-2 bg-[#006a63] text-white w-full h-[54px] rounded-full font-semibold text-base shadow-[0_8px_20px_rgba(49,151,149,0.2)] hover:bg-[#005750] active:scale-[0.98] transition-all"
            >
              <Mic className="w-5 h-5 text-[#4fd1c5]" />
              롤플레이 시작
            </button>
            <button
              onClick={() => onOpenReflection(latestTicket)}
              className="flex items-center justify-center gap-2 bg-[#4fd1c5]/20 text-[#006a63] w-full h-[50px] rounded-full font-semibold text-sm hover:bg-[#4fd1c5]/30 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#006a63]" />
              AI 성찰 복습
            </button>
          </div>
        </div>
      </section>

      {/* 2. Recent Progress & AI Reflection Summary */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-lg font-bold text-[#181c1e]">
            최근 완료한 과업 및 성찰
          </h3>
          <button
            onClick={() => onNavigateTab('review')}
            className="text-[#006a63] font-semibold text-sm hover:underline flex items-center gap-0.5"
          >
            전체보기 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Analysis Summary Card */}
        {latestTicket && (
          <div
            onClick={() => onOpenReflection(latestTicket)}
            className="bg-[#4fd1c5]/10 border border-[#4fd1c5]/30 rounded-2xl p-4 space-y-3 cursor-pointer hover:bg-[#4fd1c5]/15 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#006a63]" />
                <h4 className="font-semibold text-sm text-[#006a63]">
                  AI 분석 요약 ({latestTicket.scenarioTitle})
                </h4>
              </div>
              <span className="text-xs bg-[#006a63] text-white font-bold px-2 py-0.5 rounded-full">
                {latestTicket.overallScore}점
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/80 rounded-xl p-3 flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-[#ffdad6] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#ba1a1a]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#3c4947]">나의 주요 실수</p>
                  <p className="text-xs font-semibold text-[#181c1e] line-clamp-1">
                    {latestTicket.topMistakes[0]?.mistake || "관사(a/the) 사용 주의"}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3 flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-lg bg-[#4fd1c5]/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-[#006a63]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#3c4947]">오늘 배운 핵심 표현</p>
                  <p className="text-xs font-semibold text-[#006a63] italic line-clamp-1">
                    "{latestTicket.newExpressions[0]?.expression || "I'd like to check in, please."}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List items */}
        <div className="space-y-2.5">
          {recentTickets.slice(0, 2).map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onOpenReflection(ticket)}
              className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.04)] border border-[#bbc9c7]/20 hover:border-[#006a63]/40 transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#dfe0e0] flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-[#5d5f5f]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#181c1e]">
                    {ticket.scenarioTitle}
                  </p>
                  <p className="text-xs text-[#3c4947]">
                    완료 • {ticket.date}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#bbc9c7]" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Audio Waveform Visual Flourish */}
      <section className="py-2">
        <div className="bg-white border border-[#bbc9c7]/30 h-20 rounded-2xl flex items-center justify-center gap-1.5 px-6 overflow-hidden relative shadow-[0_4px_12px_rgba(49,151,149,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4fd1c5]/10 to-transparent animate-pulse" />
          <div className="w-1.5 h-6 bg-[#006a63] rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1.5 h-10 bg-[#006a63] rounded-full opacity-70 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-14 bg-[#006a63] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          <div className="w-1.5 h-8 bg-[#006a63] rounded-full opacity-80 animate-bounce" style={{ animationDelay: '0.4s' }} />
          <div className="w-1.5 h-12 bg-[#006a63] rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="w-1.5 h-5 bg-[#006a63] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.6s' }} />
          <div className="w-1.5 h-10 bg-[#006a63] rounded-full opacity-80 animate-bounce" style={{ animationDelay: '0.7s' }} />
          <div className="w-1.5 h-7 bg-[#006a63] rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.8s' }} />
        </div>
      </section>

      {/* 4. Ready for a Challenge Banner */}
      <section className="rounded-2xl p-5 bg-[#00504a] text-white overflow-hidden relative shadow-md">
        <div className="relative z-10">
          <h4 className="font-bold text-lg mb-1">Ready for a challenge?</h4>
          <p className="text-xs text-white/80 mb-4">
            오늘의 AI 추천 시나리오를 완료하고 20 코인 보상을 받으세요.
          </p>
          <button
            onClick={() => onNavigateTab('practice')}
            className="bg-[#4fd1c5] text-[#005750] px-5 py-2.5 rounded-full font-bold text-xs hover:bg-[#3bbfae] active:scale-95 transition-all shadow-sm"
          >
            AI 추천 시나리오 시작하기
          </button>
        </div>
      </section>
    </div>
  );
};
