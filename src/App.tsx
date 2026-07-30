import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { PracticeGrid } from './components/PracticeGrid';
import { RoleplayScreen } from './components/RoleplayScreen';
import { ExitTicketModal } from './components/ExitTicketModal';
import { ReviewView } from './components/ReviewView';
import { ProfileView } from './components/ProfileView';
import { CustomScenarioModal } from './components/CustomScenarioModal';

import { SCENARIOS } from './data/scenarios';
import {
  getUserProfile,
  getExitTickets,
  getVocabulary,
  getCAFHistory
} from './lib/storage';
import { Scenario, ExitTicket, ModeType, UserProfile, VocabularyItem, ChatMessage } from './types';

export default function App() {
  const [user, setUser] = useState<UserProfile>(getUserProfile());
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [exitTickets, setExitTickets] = useState<ExitTicket[]>(getExitTickets());
  const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>(getVocabulary());
  const [cafHistory] = useState(getCAFHistory());

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [activeRoleplayMode, setActiveRoleplayMode] = useState<ModeType>('voice');
  const [activeExitTicket, setActiveExitTicket] = useState<ExitTicket | null>(null);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [activeTranscript, setActiveTranscript] = useState<ChatMessage[] | null>(null);

  // Today's recommended challenge scenario
  const todaysScenario = scenarios.find(s => s.id === 'hotel') || scenarios[0];

  // Start a Roleplay Session
  const handleStartRoleplay = (scenario: Scenario, mode: ModeType = 'voice') => {
    setActiveScenario(scenario);
    setActiveRoleplayMode(mode);
    setActiveTranscript(null);
  };

  // Finish Roleplay -> Open AI Exit Ticket modal
  const handleFinishRoleplaySession = (transcript: ChatMessage[], selfReflection?: string) => {
    setActiveTranscript(transcript);
    setActiveExitTicket(null); // Will generate a new ticket inside modal
  };

  // When exit ticket is saved
  const handleSavedExitTicket = (newTicket: ExitTicket) => {
    setExitTickets(getExitTickets());
    setVocabularyList(getVocabulary());
    setUser(getUserProfile());
  };

  // Custom scenario creation handler
  const handleCreateCustomScenario = (newScenario: Scenario) => {
    setScenarios(prev => [newScenario, ...prev]);
    setShowCustomModal(false);
    handleStartRoleplay(newScenario, 'voice');
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] text-[#181c1e] font-sans antialiased selection:bg-[#4fd1c5]/30">
      {/* App Header (Hidden during live roleplay fullscreen) */}
      {!activeScenario && !activeTranscript && (
        <Header
          user={user}
          onProfileClick={() => setActiveTab('profile')}
          onNotificationClick={() => setActiveTab('review')}
        />
      )}

      {/* Main Tab Views */}
      {!activeScenario && !activeTranscript && (
        <main>
          {activeTab === 'home' && (
            <HomeView
              user={user}
              todaysScenario={todaysScenario}
              recentTickets={exitTickets}
              onStartRoleplay={(s) => handleStartRoleplay(s, 'voice')}
              onOpenReflection={(t) => setActiveExitTicket(t || exitTickets[0])}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'practice' && (
            <PracticeGrid
              scenarios={scenarios}
              preferredMode={user.preferredMode}
              userMajor={user.majorOrJob}
              onSelectScenario={(s, mode) => handleStartRoleplay(s, mode)}
              onCreateCustomScenario={() => setShowCustomModal(true)}
            />
          )}

          {activeTab === 'review' && (
            <ReviewView
              exitTickets={exitTickets}
              vocabularyList={vocabularyList}
              userMajor={user.majorOrJob}
              onOpenTicket={(t) => setActiveExitTicket(t)}
              onUpdateVocabulary={(updated) => setVocabularyList(updated)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              cafHistory={cafHistory}
              onProfileUpdate={(updated) => setUser(updated)}
            />
          )}

          {/* Bottom Nav Bar */}
          <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
        </main>
      )}

      {/* Fullscreen Interactive Roleplay Screen */}
      {activeScenario && !activeTranscript && (
        <RoleplayScreen
          scenario={activeScenario}
          user={user}
          initialMode={activeRoleplayMode}
          onClose={() => setActiveScenario(null)}
          onFinishSession={(transcript) => handleFinishRoleplaySession(transcript)}
        />
      )}

      {/* AI Exit Ticket & Self-Reflection Modal */}
      {(activeTranscript || activeExitTicket) && (
        <ExitTicketModal
          existingTicket={activeExitTicket}
          scenario={activeScenario || undefined}
          user={user}
          transcript={activeTranscript || undefined}
          onClose={() => {
            setActiveTranscript(null);
            setActiveExitTicket(null);
            setActiveScenario(null);
          }}
          onSaved={handleSavedExitTicket}
        />
      )}

      {/* Custom Scenario Creation Modal */}
      {showCustomModal && (
        <CustomScenarioModal
          userMajor={user.majorOrJob}
          onClose={() => setShowCustomModal(false)}
          onCreate={handleCreateCustomScenario}
        />
      )}
    </div>
  );
}
