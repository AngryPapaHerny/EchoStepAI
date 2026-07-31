import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { PracticeGrid } from './components/PracticeGrid';
import { RoleplayScreen } from './components/RoleplayScreen';
import { ExitTicketModal } from './components/ExitTicketModal';
import { ReviewView } from './components/ReviewView';
import { ProfileView } from './components/ProfileView';
import { CustomScenarioModal } from './components/CustomScenarioModal';
import { AuthScreen } from './components/AuthScreen';

import { SCENARIOS } from './data/scenarios';
import { supabase } from './lib/supabase';
import { fetchLearnerData, LearnerData } from './lib/db';
import { ChatMessage, ExitTicket, ModeType, Scenario } from './types';

export default function App() {
  // ── 인증 세션 ────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthChecked(true);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  // ── 학습자 데이터 ────────────────────────────────────────
  const [data, setData] = useState<LearnerData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      setData(await fetchLearnerData());
    } catch (err) {
      console.error('Failed to load learner data:', err);
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    loadData();
  }, [userId, loadData]);

  // ── 화면 상태 ────────────────────────────────────────────
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [activeRoleplayMode, setActiveRoleplayMode] = useState<ModeType>('voice');
  const [activeExitTicket, setActiveExitTicket] = useState<ExitTicket | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<ChatMessage[] | null>(null);

  const handleStartRoleplay = (scenario: Scenario, mode: ModeType = 'voice') => {
    setActiveScenario(scenario);
    setActiveRoleplayMode(mode);
    setActiveTranscript(null);
  };

  const handleCreateCustomScenario = (newScenario: Scenario) => {
    setScenarios((prev) => [newScenario, ...prev]);
    setShowCustomModal(false);
    handleStartRoleplay(newScenario, 'voice');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveTab('home');
    setActiveScenario(null);
    setActiveTranscript(null);
    setActiveExitTicket(null);
  };

  // ── 렌더링 ───────────────────────────────────────────────
  if (!authChecked) return <FullScreenSpinner label="세션을 확인하는 중..." />;
  if (!session) return <AuthScreen />;

  if (loadError) {
    return (
      <FullScreenError message={loadError} onRetry={loadData} onSignOut={handleSignOut} />
    );
  }

  if (!data) return <FullScreenSpinner label="학습 기록을 불러오는 중..." />;

  const { profile, exitTickets, vocabulary, cafHistory } = data;
  const todaysScenario = scenarios.find((s) => s.id === 'hotel') ?? scenarios[0];
  const isFullscreenFlow = Boolean(activeScenario || activeTranscript);

  return (
    <div className="min-h-screen bg-[#f7fafc] text-[#181c1e] font-sans antialiased selection:bg-[#4fd1c5]/30">
      {!isFullscreenFlow && (
        <Header
          user={profile}
          onProfileClick={() => setActiveTab('profile')}
          onNotificationClick={() => setActiveTab('review')}
          onSignOut={handleSignOut}
        />
      )}

      {!isFullscreenFlow && (
        <main>
          {activeTab === 'home' && (
            <HomeView
              user={profile}
              todaysScenario={todaysScenario}
              recentTickets={exitTickets}
              onStartRoleplay={(s) => handleStartRoleplay(s, profile.preferredMode)}
              onOpenReflection={(t) => setActiveExitTicket(t ?? exitTickets[0] ?? null)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'practice' && (
            <PracticeGrid
              scenarios={scenarios}
              preferredMode={profile.preferredMode}
              userMajor={profile.majorOrJob}
              onSelectScenario={(s, mode) => handleStartRoleplay(s, mode)}
              onCreateCustomScenario={() => setShowCustomModal(true)}
            />
          )}

          {activeTab === 'review' && (
            <ReviewView
              user={profile}
              exitTickets={exitTickets}
              vocabularyList={vocabulary}
              onOpenTicket={(t) => setActiveExitTicket(t)}
              onVocabularyChanged={loadData}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={profile}
              cafHistory={cafHistory}
              onProfileUpdated={loadData}
            />
          )}

          <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
        </main>
      )}

      {activeScenario && !activeTranscript && (
        <RoleplayScreen
          scenario={activeScenario}
          user={profile}
          initialMode={activeRoleplayMode}
          onClose={() => setActiveScenario(null)}
          onFinishSession={(transcript) => setActiveTranscript(transcript)}
        />
      )}

      {(activeTranscript || activeExitTicket) && (
        <ExitTicketModal
          existingTicket={activeExitTicket}
          scenario={activeScenario ?? undefined}
          user={profile}
          transcript={activeTranscript ?? undefined}
          onClose={() => {
            setActiveTranscript(null);
            setActiveExitTicket(null);
            setActiveScenario(null);
          }}
          onSaved={loadData}
        />
      )}

      {showCustomModal && (
        <CustomScenarioModal
          userMajor={profile.majorOrJob}
          onClose={() => setShowCustomModal(false)}
          onCreate={handleCreateCustomScenario}
        />
      )}
    </div>
  );
}

const FullScreenSpinner: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-screen bg-[#f7fafc] flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-[#006a63] animate-spin" />
    <p className="text-xs text-[#3c4947]">{label}</p>
  </div>
);

const FullScreenError: React.FC<{
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}> = ({ message, onRetry, onSignOut }) => (
  <div className="min-h-screen bg-[#f7fafc] flex flex-col items-center justify-center gap-4 px-6 text-center">
    <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
      <AlertCircle className="w-7 h-7" />
    </div>
    <div className="space-y-1">
      <h2 className="text-lg font-bold text-[#181c1e]">학습 기록을 불러오지 못했습니다</h2>
      <p className="text-xs text-[#3c4947] max-w-xs break-words">{message}</p>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onRetry}
        className="px-5 h-11 bg-[#006a63] text-white rounded-2xl font-bold text-xs flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> 다시 시도
      </button>
      <button
        onClick={onSignOut}
        className="px-5 h-11 border border-[#bbc9c7] text-[#3c4947] rounded-2xl font-bold text-xs"
      >
        로그아웃
      </button>
    </div>
  </div>
);
