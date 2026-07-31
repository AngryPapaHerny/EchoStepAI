import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, MessageSquare, Sparkles, Send, HelpCircle, Languages, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Scenario, ChatMessage, ModeType, UserProfile } from '../types';
import { speechHandler } from '../lib/speech';
import { requestRoleplayTurn, requestTranslation } from '../lib/api';

/**
 * 시나리오 목표로 첫 발화 제안을 만든다.
 *
 * 목표문은 학습자를 2인칭으로 지시하는 문장("Check in under your reservation name,
 * and politely request ...")이라 그대로 쓸 수 없다. 첫 절만 떼어내고 인칭을
 * 1인칭으로 바꿔 문법적으로 완결된 한 문장을 만든다.
 * (이전에는 30자에서 잘라 "...to C..." 같은 깨진 문장을 AI에게 보냈다.)
 */
function buildOpeningSuggestions(scenario: Scenario): string[] {
  const goal = scenario.defaultGoal.trim().replace(/\.+$/, '');
  const firstClause = goal.split(/,|\s+and\s+/i)[0].trim();

  const request = (firstClause.charAt(0).toLowerCase() + firstClause.slice(1))
    .replace(/\byour\b/gi, 'my')
    .replace(/\byou are\b/gi, 'I am');

  return [
    `Hello, I'd like to ${request}.`,
    `Hi! Could you help me with ${scenario.title}?`,
    `Excuse me, I have a quick question.`
  ];
}

interface RoleplayScreenProps {
  scenario: Scenario;
  user: UserProfile;
  initialMode: ModeType;
  onClose: () => void;
  onFinishSession: (transcript: ChatMessage[], selfReflection?: string) => void;
}

export const RoleplayScreen: React.FC<RoleplayScreenProps> = ({
  scenario,
  user,
  initialMode,
  onClose,
  onFinishSession
}) => {
  const [mode, setMode] = useState<ModeType>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [showTranslationMap, setShowTranslationMap] = useState<Record<string, boolean>>({});
  // 학습자 메시지는 번역을 요청해야 하므로 메시지별 진행/오류 상태를 따로 둔다.
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 minute default countdown
  const [nudgeCorrection, setNudgeCorrection] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** 재생을 멈추고 "재생 중" 표시도 함께 내린다. */
  const stopPlayback = () => {
    speechHandler.stopSpeaking();
    setSpeakingMessageId(null);
    setIsAiSpeaking(false);
  };

  // Stop speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      speechHandler.stopListening();
      speechHandler.stopSpeaking();
    };
  }, []);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Session timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initial greeting from AI when component mounts
  useEffect(() => {
    const initialAiText = `Hello! Welcome. I'm your ${scenario.aiRole}. How can I help you with your ${scenario.title.toLowerCase()} today?`;
    const initialMessage: ChatMessage = {
      id: 'msg-0',
      sender: 'ai',
      text: initialAiText,
      translation: `안녕하세요! 환영합니다. 저는 ${scenario.aiRole}입니다. 오늘 ${scenario.titleKo}와 관련해서 어떻게 도와드릴까요?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([initialMessage]);
    setSuggestedReplies(buildOpeningSuggestions(scenario));
    setCurrentHint(`Tip: State your purpose clearly using "I'd like to..." or "Could you please..."`);

    // Speak AI greeting if voice mode
    if (mode === 'voice') {
      playAudioForMessage(initialMessage);
    }
  }, [scenario]);

  // Handle sending a message (Voice or Text)
  const handleSendMessage = async (userMsgText: string) => {
    if (!userMsgText.trim() || isLoading) return;

    stopPlayback();
    speechHandler.stopListening();
    setIsListening(false);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userMsgText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setNudgeCorrection(null);

    try {
      const data = await requestRoleplayTurn({
        scenario,
        user,
        conversationHistory: updatedMessages,
        userMessage: userMsgText,
        mode
      });

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: data.aiResponse || "Thank you. What else can I assist you with?",
        translation: data.koreanTranslation || "감사합니다. 다른 것은 무엇을 도와드릴까요?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nudgeCorrection: data.nudgeCorrection
      };

      setMessages(prev => [...prev, aiMessage]);
      if (data.hint) setCurrentHint(data.hint);
      if (data.suggestedReplies) setSuggestedReplies(data.suggestedReplies);
      if (data.nudgeCorrection) setNudgeCorrection(data.nudgeCorrection);

      // Play audio response in voice mode
      if (mode === 'voice') {
        playAudioForMessage(aiMessage);
      }

    } catch (err) {
      console.error('Error during roleplay round:', err);
      const fallbackAiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: "I understand! Let's continue with your goal.",
        translation: "이해했습니다! 목적인 대화를 계속 진행해볼까요?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      speechHandler.stopListening();
      setIsListening(false);
    } else {
      if (!speechHandler.isSupported()) {
        setSpeechError('이 브라우저에서는 음성 인식이 지원되지 않습니다. Chrome, Edge 또는 Safari를 권장합니다.');
        return;
      }
      stopPlayback();
      setIsListening(true);
      speechHandler.startListening(
        (transcriptText, isFinal) => {
          setInputText(transcriptText);
          if (isFinal) {
            handleSendMessage(transcriptText);
          }
        },
        (err) => {
          console.warn("STT error:", err);
          setIsListening(false);
          if (err === 'not-allowed') {
            setSpeechError('마이크 권한이 차단되었습니다. 브라우저 설정에서 마이크를 허용해주세요.');
          } else if (err === 'no-speech') {
            setSpeechError('음성이 감지되지 않았습니다. 마이크에 가까이 대고 다시 말씀해 보세요.');
          } else if (typeof err === 'string' && err.length > 0) {
            setSpeechError(`음성 인식 안내: ${err}`);
          }
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  /**
   * 번역 토글.
   *
   * AI 메시지는 응답에 koreanTranslation이 함께 오지만, 학습자가 직접 입력한
   * 메시지에는 번역이 없다. 처음 펼칠 때 한 번만 번역을 받아 메시지에 캐시하고
   * 이후에는 재요청하지 않는다.
   */
  const toggleTranslation = async (msg: ChatMessage) => {
    const willShow = !showTranslationMap[msg.id];
    setShowTranslationMap(prev => ({ ...prev, [msg.id]: willShow }));

    if (!willShow || msg.translation || translatingIds[msg.id]) return;

    setTranslatingIds(prev => ({ ...prev, [msg.id]: true }));
    setTranslationErrors(prev => {
      const next = { ...prev };
      delete next[msg.id];
      return next;
    });

    try {
      const { translation } = await requestTranslation(msg.text);
      setMessages(prev =>
        prev.map(m => (m.id === msg.id ? { ...m, translation } : m))
      );
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslationErrors(prev => ({
        ...prev,
        [msg.id]: '번역을 가져오지 못했습니다. 다시 시도해주세요.'
      }));
    } finally {
      setTranslatingIds(prev => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
    }
  };

  /**
   * 특정 메시지의 발음 재생.
   *
   * AI 발화일 때만 아바타의 "말하는 중" 표시를 켠다. 학습자 본인 문장을
   * 들을 때 AI가 말하는 것처럼 보이면 안 되기 때문이다.
   */
  const playAudioForMessage = (msg: ChatMessage) => {
    stopPlayback();
    setSpeakingMessageId(msg.id);
    if (msg.sender === 'ai') setIsAiSpeaking(true);

    speechHandler.speakText(msg.text, 0.95, () => {
      setSpeakingMessageId(current => (current === msg.id ? null : current));
      if (msg.sender === 'ai') setIsAiSpeaking(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f7fafc] flex flex-col overflow-hidden max-w-2xl mx-auto shadow-2xl">
      {/* 1. Top App Bar */}
      <header className="sticky top-0 z-50 bg-white flex justify-between items-center px-4 h-16 shadow-[0_4px_12px_rgba(49,151,149,0.08)] border-b border-[#bbc9c7]/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuitModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#4fd1c5]/20 active:scale-95 transition-all text-[#006a63]"
            title="종료"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-bold text-base text-[#006a63] line-clamp-1">
              {scenario.titleKo || scenario.title}
            </h1>
            <p className="text-[10px] text-[#3c4947]">
              {scenario.aiRole} • {scenario.difficulty}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => {
              const newMode = mode === 'voice' ? 'text' : 'voice';
              setMode(newMode);
              if (newMode === 'text') stopPlayback();
            }}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4fd1c5]/20 text-[#005750] flex items-center gap-1"
          >
            {mode === 'voice' ? <Volume2 className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            {mode === 'voice' ? '음성' : '텍스트'}
          </button>

          {/* Timer */}
          <div className="flex items-center gap-1 px-3 py-1 bg-[#4fd1c5]/20 rounded-full text-[#006a63] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#006a63] animate-ping" />
            {formatTimer(timerSeconds)}
          </div>
        </div>
      </header>

      {/* 2. Main Conversation Canvas */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Scenario Goal Card */}
        <div className="bg-white border border-[#bbc9c7]/30 rounded-xl p-3.5 flex gap-3 items-center shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#6ecdcb]/20 flex items-center justify-center shrink-0 text-[#006a68]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6c7a77] font-semibold">Goal</p>
            <p className="text-xs font-semibold text-[#181c1e]">{scenario.defaultGoalKo || scenario.defaultGoal}</p>
          </div>
        </div>

        {/* AI Avatar & Waveform Glow */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Glowing rings */}
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isAiSpeaking ? 'bg-[#4fd1c5]/30 animate-pulse scale-110' : 'bg-[#4fd1c5]/10'}`} />
            <div className={`absolute inset-2 rounded-full transition-all duration-700 ${isListening ? 'bg-[#ba1a1a]/20 animate-ping' : ''}`} />
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#006a63]/10 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
                alt={scenario.aiRole}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="font-bold text-xs text-[#006a63]">{scenario.aiRole}</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#006a63] mt-1">
            {isAiSpeaking ? "AI Partner 말하는 중..." : isListening ? "듣고 있습니다... 말씀하세요" : scenario.aiRole}
          </span>
        </div>

        {/* Non-judgmental Recast Toast Banner */}
        {nudgeCorrection && (
          <div className="bg-[#4fd1c5]/15 border border-[#4fd1c5]/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#005750]">
            <CheckCircle className="w-4 h-4 text-[#006a63] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">자연스러운 표현 추천: </span>
              <span>{nudgeCorrection}</span>
            </div>
          </div>
        )}

        {/* Conversation Message Feed */}
        <div className="space-y-3 pb-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            const showTrans = showTranslationMap[msg.id];
            const isTranslating = translatingIds[msg.id];
            const translationError = translationErrors[msg.id];
            const isSpeaking = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-xs space-y-1.5 ${
                    isAi
                      ? 'bg-white rounded-tl-none border border-[#bbc9c7]/30 text-[#181c1e]'
                      : 'bg-[#006a63] text-white rounded-tr-none'
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed italic md:not-italic break-words whitespace-pre-wrap">
                    "{msg.text}"
                  </p>

                  {/* 번역 결과 — 학습자 메시지는 요청해서 받아온다 */}
                  {showTrans && (isTranslating || translationError || msg.translation) && (
                    <p
                      className={`text-xs font-normal pt-1 border-t break-words ${
                        isAi
                          ? 'text-[#006a63] border-[#f1f4f6]'
                          : 'text-[#94f2f0] border-white/25'
                      }`}
                    >
                      {isTranslating ? (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> 번역하는 중...
                        </span>
                      ) : (
                        translationError ?? msg.translation
                      )}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => toggleTranslation(msg)}
                      disabled={isTranslating}
                      className={`text-[11px] font-semibold underline flex items-center gap-1 disabled:opacity-60 ${
                        isAi ? 'text-[#006a63]' : 'text-[#94f2f0]'
                      }`}
                    >
                      <Languages className="w-3 h-3" />
                      {showTrans ? '번역 숨기기' : '한국어 번역'}
                    </button>
                    <button
                      onClick={() => playAudioForMessage(msg)}
                      className={`text-[11px] flex items-center gap-1 ${
                        isAi
                          ? 'text-[#3c4947] hover:text-[#006a63]'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      {isSpeaking ? '재생 중...' : '발음 듣기'}
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-[#6c7a77] px-1 mt-0.5">{msg.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#006a63] font-medium p-3 bg-white rounded-xl w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-[#006a63]" />
              AI가 응답을 생성하고 있습니다...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 3. Bottom Controls & Thumb Zone */}
      <footer className="sticky bottom-0 bg-white border-t border-[#bbc9c7]/30 p-4 space-y-3 shadow-lg">
        {/* Speech Error / Microphone Permission Warning */}
        {speechError && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 p-3 rounded-xl flex items-center justify-between gap-2 text-xs text-[#93000a]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="text-xs font-bold text-[#ba1a1a] hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* Real-time Waveform Indicator when Listening */}
        {isListening && (
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="flex items-center gap-1 h-8">
              {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.3, 0.1].map((delay, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-[#006a63] rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.sin(idx) * 16}px`,
                    animationDelay: `${delay}s`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-[#006a63] font-semibold animate-pulse">Listening... (말씀이 끝나면 자동 전송됩니다)</span>
          </div>
        )}

        {/* Quick Hint & Helper Chips */}
        {currentHint && (
          <div className="bg-[#f1f4f6] px-3 py-1.5 rounded-lg text-xs text-[#3c4947] flex items-center justify-between">
            <span className="flex items-start gap-1 break-words">
              <HelpCircle className="w-3.5 h-3.5 text-[#006a63] shrink-0 mt-0.5" />
              <span>
                <span className="font-medium text-[#006a63]">추천 힌트:</span> {currentHint}
              </span>
            </span>
          </div>
        )}

        {/*
          Suggested Replies Quick Chips
          제안 문장이 길어도 전체가 보이도록 줄바꿈시킨다 (가로 스크롤로 숨기지 않음).
        */}
        {suggestedReplies.length > 0 && !isListening && (
          <div className="flex flex-wrap gap-2 pb-1 max-h-28 overflow-y-auto scrollbar-none">
            {suggestedReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(reply)}
                className="px-3 py-1.5 bg-[#4fd1c5]/15 hover:bg-[#4fd1c5]/30 text-[#005750] rounded-full text-xs font-semibold text-left break-words active:scale-95 transition-all"
              >
                💡 {reply}
              </button>
            ))}
          </div>
        )}

        {/* Main Action Bar */}
        <div className="flex items-center gap-2">
          {/* Text Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder={isListening ? "음성을 인식 중입니다..." : "영어로 대화 입력..."}
              className="w-full h-12 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-full px-4 pr-10 text-sm focus:outline-none focus:border-[#006a63]"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="absolute right-2 top-2 w-8 h-8 rounded-full bg-[#006a63] text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Speech Recording Button */}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all ${
              isListening ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#006a63] hover:bg-[#005750]'
            }`}
            title={isListening ? "음성 인식 중지" : "음성으로 말하기"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>

        {/* Finish Session CTA */}
        {messages.length >= 3 && (
          <button
            onClick={() => onFinishSession(messages)}
            className="w-full py-2.5 bg-[#4fd1c5] text-[#005750] font-bold text-xs rounded-xl hover:bg-[#3bbfae] active:scale-98 transition-all shadow-sm"
          >
            과업 완수 및 AI 성찰 일지(Exit Ticket) 작성
          </button>
        )}
      </footer>

      {/* Quit Modal */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#181c1e]">세션을 종료하시겠습니까?</h3>
            <p className="text-xs text-[#3c4947]">
              현재 진행 상황으로 AI 성찰 보고서를 생성하거나 Home으로 돌아갈 수 있습니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onFinishSession(messages)}
                className="w-full py-2.5 rounded-xl bg-[#006a63] text-white font-semibold text-xs shadow-sm"
              >
                성찰 보고서 작성 후 종료
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] font-semibold text-xs"
              >
                보고서 없이 바로 나가기
              </button>
              <button
                onClick={() => setShowQuitModal(false)}
                className="w-full py-2.5 rounded-xl border border-[#bbc9c7] text-[#3c4947] font-semibold text-xs"
              >
                계속 대화하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
