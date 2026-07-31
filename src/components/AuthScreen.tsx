import React, { useState } from 'react';
import { AlertCircle, Loader2, LogIn, Mail, MailCheck, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ESPCategory } from '../types';

type Mode = 'signin' | 'signup';

const ESP_OPTIONS: { id: ESPCategory; label: string }[] = [
  { id: 'Engineering', label: '공학 / IT' },
  { id: 'Business', label: '경영 / 비즈니스' },
  { id: 'Healthcare', label: '의료 / 보건' },
  { id: 'Hospitality', label: '호텔 / 관광' },
  { id: 'General', label: '일반 / 일상' },
];

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [majorOrJob, setMajorOrJob] = useState<ESPCategory>('General');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim(), major_or_job: majorOrJob },
          },
        });
        if (signUpError) throw signUpError;

        // 이메일 확인이 켜져 있으면 세션 없이 반환된다.
        if (!data.session) setConfirmationSent(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      // 로그인에 성공하면 onAuthStateChange가 App의 화면을 전환한다.
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <Shell>
        <div className="text-center space-y-3 py-4">
          <div className="w-14 h-14 rounded-full bg-[#4fd1c5]/20 flex items-center justify-center mx-auto text-[#006a63]">
            <MailCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#181c1e]">확인 메일을 보냈습니다</h2>
          <p className="text-xs text-[#3c4947] leading-relaxed">
            <span className="font-semibold text-[#006a63]">{email}</span> 으로 전송된
            링크를 눌러 가입을 완료한 뒤 다시 로그인해주세요.
          </p>
          <button
            onClick={() => {
              setConfirmationSent(false);
              setMode('signin');
            }}
            className="text-xs font-bold text-[#006a63] underline"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex bg-[#ebeef0] p-1 rounded-full border border-[#bbc9c7]/30 mb-5">
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
            mode === 'signin' ? 'bg-[#006a63] text-white shadow-xs' : 'text-[#3c4947]'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
            mode === 'signup' ? 'bg-[#006a63] text-white shadow-xs' : 'text-[#3c4947]'
          }`}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">이름</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김민수"
              className="w-full h-11 px-3 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-sm focus:outline-none focus:border-[#006a63]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#181c1e] mb-1">이메일</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#6c7a77] absolute left-3 top-3.5" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full h-11 pl-9 pr-3 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-sm focus:outline-none focus:border-[#006a63]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#181c1e] mb-1">비밀번호</label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            className="w-full h-11 px-3 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-sm focus:outline-none focus:border-[#006a63]"
          />
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-[#181c1e] mb-1">
              전공 / 직무 (ESP 분야)
            </label>
            <select
              value={majorOrJob}
              onChange={(e) => setMajorOrJob(e.target.value as ESPCategory)}
              className="w-full h-11 px-3 bg-[#f7fafc] border border-[#bbc9c7]/40 rounded-xl text-sm focus:outline-none focus:border-[#006a63]"
            >
              {ESP_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6c7a77] mt-1">
              나중에 마이페이지에서 언제든 바꿀 수 있습니다.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 p-3 rounded-xl flex items-start gap-2 text-xs text-[#93000a]">
            <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#006a63] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#005750] disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === 'signup' ? (
            <UserPlus className="w-4 h-4" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? '처리 중...' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}
        </button>
      </form>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#f7fafc] flex flex-col items-center justify-center px-5 py-10">
    <div className="w-full max-w-sm">
      <div className="text-center mb-6 space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#006a63] flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-7 h-7 text-[#4fd1c5]" />
        </div>
        <h1 className="text-2xl font-bold text-[#181c1e]">EchoStep AI</h1>
        <p className="text-xs text-[#3c4947]">
          AI 과업 수행 기반(TBLT) 영어 말하기 &amp; 구두 성찰 학습
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(49,151,149,0.12)] border border-[#bbc9c7]/20">
        {children}
      </div>

      <p className="text-[11px] text-[#6c7a77] text-center mt-4 leading-relaxed">
        학습 기록은 계정에 안전하게 저장되어 어느 기기에서든 이어집니다.
      </p>
    </div>
  </div>
);

function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/Invalid login credentials/i.test(message)) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (/User already registered/i.test(message)) {
    return '이미 가입된 이메일입니다. 로그인 탭을 이용해주세요.';
  }
  if (/Password should be at least/i.test(message)) {
    return '비밀번호는 6자 이상이어야 합니다.';
  }
  if (/Email not confirmed/i.test(message)) {
    return '메일함에서 확인 링크를 눌러 가입을 완료해주세요.';
  }
  if (/rate limit|too many/i.test(message)) {
    return '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.';
  }
  return `오류가 발생했습니다: ${message}`;
}
