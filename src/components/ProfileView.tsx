import React, { useState } from 'react';
import { Award, TrendingUp, Sparkles, Share2, Check, Coins, Zap, MessageSquare, Volume2 } from 'lucide-react';
import { CAFHistoryPoint, CEFRLevel, EditableProfile, ESPCategory, ModeType, UserProfile } from '../types';
import { updateProfile } from '../lib/db';

interface ProfileViewProps {
  user: UserProfile;
  cafHistory: CAFHistoryPoint[];
  /** 프로필이 저장되어 상위에서 데이터를 다시 불러와야 할 때 호출된다. */
  onProfileUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  cafHistory,
  onProfileUpdated
}) => {
  // 서버 저장이 끝나기 전에도 UI가 즉시 반응하도록 낙관적 로컬 상태를 둔다.
  const [profile, setProfile] = useState<UserProfile>(user);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const applyPatch = async (patch: Partial<EditableProfile>) => {
    const previous = profile;
    setProfile({ ...profile, ...patch });
    setSaveError(null);
    try {
      await updateProfile(user.id, patch);
      onProfileUpdated();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfile(previous); // 저장 실패 시 되돌린다.
      setSaveError('설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleEspChange = (major: ESPCategory) => applyPatch({ majorOrJob: major });
  const handleCefrChange = (cefr: CEFRLevel) => applyPatch({ cefrLevel: cefr });
  const handleModeChange = (mode: ModeType) => applyPatch({ preferredMode: mode });

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // CAF 지표는 최근 기록의 평균으로 계산한다 (기록이 없으면 0).
  const latest = cafHistory[cafHistory.length - 1];
  const caf = {
    fluency: latest?.fluency ?? 0,
    accuracy: latest?.accuracy ?? 0,
    complexity: latest?.complexity ?? 0
  };

  return (
    <div className="px-5 pt-4 pb-28 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#181c1e] mb-1">마이 페이지 & CAF 분석 대시보드</h2>
        <p className="text-xs text-[#3c4947]">
          초개인화 학습 지표, 언어 습득 절충 가설 가이드 및 전공/직무 설정을 관리하세요.
        </p>
      </div>

      {/* User Card */}
      <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-[#4fd1c5]/20 border-2 border-[#006a63] flex items-center justify-center font-bold text-[#006a63] text-xl">
            {profile.name.slice(0, 1)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#181c1e]">{profile.name}님</h3>
            <p className="text-xs text-[#3c4947]">
              {profile.majorOrJob} • CEFR {profile.cefrLevel} Level
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-bold text-[#006a63] bg-[#4fd1c5]/20 px-3 py-1 rounded-full flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> {profile.coins} 코인
          </span>
          <span className="text-[11px] text-[#3c4947]">연속 학습 🔥 {profile.streakDays}일</span>
        </div>
      </section>

      {/* 1. CAF (Complexity, Accuracy, Fluency) Engine & Trade-Off Guidance */}
      <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-[#006a63] font-bold text-base">
            <TrendingUp className="w-5 h-5 text-[#006a63]" />
            CAF (정확성-유창성-복잡성) 지표 분석
          </div>
          <span className="text-xs text-[#6c7a77]">Skehan's CAF Model</span>
        </div>

        {cafHistory.length === 0 ? (
          <p className="text-xs text-[#3c4947] bg-[#f1f4f6] p-3.5 rounded-xl">
            아직 분석할 세션이 없습니다. 롤플레이를 완료하고 성찰 일지를 저장하면
            CAF 지표가 여기에 표시됩니다.
          </p>
        ) : (
          <>
            {/* CAF Meters */}
            <div className="space-y-3">
              <CafMeter
                label="Fluency (유창성 / 발화 속도)"
                value={caf.fluency}
                barClass="bg-[#006a63]"
                labelClass="text-[#006a63]"
              />
              <CafMeter
                label="Accuracy (문법 정확성)"
                value={caf.accuracy}
                barClass="bg-[#6ecdcb]"
                labelClass="text-[#006a68]"
              />
              <CafMeter
                label="Complexity (구문 복잡성)"
                value={caf.complexity}
                barClass="bg-[#5d5f5f]"
                labelClass="text-[#3c4947]"
              />
            </div>

            {/* 최근 추이 스파크 차트 */}
            {cafHistory.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#181c1e]">최근 추이 (유창성)</p>
                <div className="flex items-end justify-between h-16 gap-1.5">
                  {cafHistory.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-[#006a63]/70 rounded-t transition-all duration-700"
                        style={{ height: `${Math.max(point.fluency, 4)}%` }}
                        title={`유창성 ${point.fluency} / 정확성 ${point.accuracy} / 복잡성 ${point.complexity}`}
                      />
                      <span className="text-[10px] text-[#6c7a77]">{point.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Trade-Off Hypothesis Guide Box */}
        <div className="bg-[#4fd1c5]/15 border border-[#4fd1c5]/30 p-3.5 rounded-xl space-y-1 text-xs text-[#005750]">
          <p className="font-bold flex items-center gap-1">
            <Zap className="w-4 h-4 text-[#006a63]" />
            상관관계 가이드: 절충 가설(Trade-Off Hypothesis) 안내
          </p>
          <p className="text-[11px] leading-relaxed text-[#3c4947]">
            유창성(Fluency)이 상승할 때 문법 정확성(Accuracy)이 일시적으로 변동될 수 있습니다. 이는 발화량을 넓히는 과정에서 자연스러운 중간언어(Interlanguage) 단계이므로 불안해하지 마세요!
          </p>
        </div>
      </section>

      {/* 2. ESP (Special Purpose English) & Major Selection */}
      <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 space-y-3">
        <h3 className="font-bold text-base text-[#181c1e] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#006a63]" />
          맞춤형 ESP (특수목적영어) 분야 설정
        </h3>
        <p className="text-xs text-[#3c4947]">
          전공이나 직무 분야를 설정하면 시나리오와 어휘 추천이 최적화됩니다.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'Engineering', label: '공학 / IT (Engineering)' },
            { id: 'Business', label: '경영 / 비즈니스 (Business)' },
            { id: 'Healthcare', label: '의료 / 보건 (Healthcare)' },
            { id: 'Hospitality', label: '호텔 / 관광 (Hospitality)' },
            { id: 'General', label: '일반 / 일상 (General)' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleEspChange(item.id as ESPCategory)}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                profile.majorOrJob === item.id
                  ? 'border-[#006a63] bg-[#4fd1c5]/20 text-[#005750]'
                  : 'border-[#bbc9c7]/30 text-[#3c4947] hover:border-[#006a63]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* 2-1. CEFR 레벨 & 기본 대화 모드 */}
      <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-base text-[#181c1e]">현재 영어 수준 (CEFR)</h3>
          <p className="text-xs text-[#3c4947]">
            AI가 이 수준에 맞춰 어휘 난이도와 발화 속도를 조절합니다.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(['A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map(level => (
              <button
                key={level}
                onClick={() => handleCefrChange(level)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  profile.cefrLevel === level
                    ? 'border-[#006a63] bg-[#4fd1c5]/20 text-[#005750]'
                    : 'border-[#bbc9c7]/30 text-[#3c4947] hover:border-[#006a63]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-base text-[#181c1e]">기본 대화 모드</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'voice' as ModeType, label: '음성 (Voice)', icon: <Volume2 className="w-4 h-4" /> },
              { id: 'text' as ModeType, label: '텍스트 (Text)', icon: <MessageSquare className="w-4 h-4" /> }
            ]).map(item => (
              <button
                key={item.id}
                onClick={() => handleModeChange(item.id)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  profile.preferredMode === item.id
                    ? 'border-[#006a63] bg-[#4fd1c5]/20 text-[#005750]'
                    : 'border-[#bbc9c7]/30 text-[#3c4947] hover:border-[#006a63]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-[#93000a] bg-[#ffdad6] border border-[#ba1a1a]/30 p-3 rounded-xl">
            {saveError}
          </p>
        )}
      </section>

      {/* 3. Gamification Badges */}
      <section className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(49,151,149,0.08)] border border-[#bbc9c7]/20 space-y-3">
        <h3 className="font-bold text-base text-[#181c1e] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#006a63]" />
          달성한 배지 & 보상
        </h3>

        {profile.badges.length === 0 ? (
          <p className="text-xs text-[#3c4947] bg-[#f1f4f6] p-3.5 rounded-xl">
            첫 롤플레이를 완료하면 배지가 부여됩니다. 연속 학습, 어휘 수집, 유창성 향상 등
            10종의 배지가 준비되어 있습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {profile.badges.map((badge, idx) => (
              <div key={idx} className="bg-[#f1f4f6] p-3 rounded-xl flex flex-col items-center text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#4fd1c5] flex items-center justify-center text-[#005750]">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#181c1e]">{badge}</span>
                <span className="text-[10px] text-[#006a63]">완수 획득</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Export & Share */}
      <section className="flex gap-3">
        <button
          onClick={handleShareLink}
          className="flex-1 py-3 bg-[#006a63] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-[#005750]"
        >
          {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copiedLink ? '링크 복사 완료!' : '학습 성과 공유 링크 생성'}
        </button>
      </section>
    </div>
  );
};

const CafMeter: React.FC<{
  label: string;
  value: number;
  barClass: string;
  labelClass: string;
}> = ({ label, value, barClass, labelClass }) => (
  <div>
    <div className="flex justify-between text-xs font-bold mb-1">
      <span className={labelClass}>{label}</span>
      <span>{value} / 100</span>
    </div>
    <div className="h-2.5 bg-[#f1f4f6] rounded-full overflow-hidden">
      <div
        className={`h-full ${barClass} rounded-full transition-all duration-700`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
