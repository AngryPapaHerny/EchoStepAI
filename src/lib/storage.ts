import { UserProfile, ExitTicket, VocabularyItem, CAFHistoryPoint } from '../types';

const PROFILE_KEY = 'echostep_user_profile';
const EXIT_TICKETS_KEY = 'echostep_exit_tickets';
const VOCABULARY_KEY = 'echostep_vocabulary';
const CAF_HISTORY_KEY = 'echostep_caf_history';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '민수',
  majorOrJob: 'Engineering',
  cefrLevel: 'B1',
  preferredMode: 'voice',
  coins: 340,
  streakDays: 5,
  totalStudyMinutes: 720, // 12 hours
  completedSessionsCount: 48,
  badges: ['First Roleplay', 'Streak Master', 'Airport Explorer', 'Reflection Scholar']
};

export const INITIAL_EXIT_TICKETS: ExitTicket[] = [
  {
    id: 'ticket-1',
    scenarioId: 'cafe',
    scenarioTitle: 'Starbucks Ordering (카페에서 주문하기)',
    overallScore: 92,
    fluencyLevel: 'Advanced',
    accuracyLevel: 'Good',
    topMistakes: [
      {
        mistake: "I'll take a hot coffee with ice.",
        correction: "Could I get an iced coffee, please?",
        explanation: "Hot and ice are contradictory; specify iced coffee directly."
      }
    ],
    newExpressions: [
      {
        id: 'vocab-1',
        expression: 'Catch up with',
        meaning: '밀린 소식을 나누다',
        exampleSentence: 'It was great to catch up with you over coffee.',
        espCategory: 'General',
        dateAdded: '2026-07-29'
      },
      {
        id: 'vocab-2',
        expression: 'Oat milk substitute',
        meaning: '귀리 우유 대체 옵션',
        exampleSentence: 'Can I substitute oat milk in my latte?',
        espCategory: 'Hospitality',
        dateAdded: '2026-07-29'
      }
    ],
    encouragement: "자연스러운 억양과 정중한 표현 사용이 훌륭했습니다. 특히 메뉴 수정 요청 시 'Actually'를 적절하게 활용하셨네요.",
    cafData: { fluencyScore: 92, accuracyScore: 88, complexityScore: 84 },
    selfReflection: "ChatGPT와 대화하며 'Actually'를 사용하여 부드럽게 말을 정정하는 노하우를 깨달았다.",
    date: '어제'
  },
  {
    id: 'ticket-2',
    scenarioId: 'business_kickoff',
    scenarioTitle: 'Project Kick-off (비즈니스 미팅)',
    overallScore: 86,
    fluencyLevel: 'Intermediate',
    accuracyLevel: 'Excellent',
    topMistakes: [
      {
        mistake: "Don't you think this timeline is bad?",
        correction: "Wouldn't you agree that we need more time?",
        explanation: "In business meetings, 'Wouldn't you agree' sounds far more diplomatic."
      }
    ],
    newExpressions: [
      {
        id: 'vocab-3',
        expression: 'Hit the ground running',
        meaning: '지체 없이 신속하게 착수하다',
        exampleSentence: 'We are ready to hit the ground running on the new sprint.',
        espCategory: 'Engineering',
        dateAdded: '2026-07-27'
      },
      {
        id: 'vocab-4',
        expression: 'On the same page',
        meaning: '동일한 이해와 입장을 공유하다',
        exampleSentence: 'Let\'s make sure the engineering team is on the same page.',
        espCategory: 'Engineering',
        dateAdded: '2026-07-27'
      }
    ],
    encouragement: "전문적인 공학 어휘 선택이 돋보였습니다. 다음에는 동의를 구할 때 정중한 기법을 연습해보세요.",
    cafData: { fluencyScore: 82, accuracyScore: 92, complexityScore: 86 },
    selfReflection: "상대방의 의견에 정중히 이의를 제기할 때 쓸 수 있는 다듬어진 표현의 중요성을 느꼈음.",
    date: '3일 전'
  },
  {
    id: 'ticket-3',
    scenarioId: 'airport',
    scenarioTitle: 'Check-in Counter (여행/공항)',
    overallScore: 88,
    fluencyLevel: 'Advanced',
    accuracyLevel: 'Good',
    topMistakes: [
      {
        mistake: "I have went to the airport yesterday.",
        correction: "I went to the airport yesterday.",
        explanation: "Simple past tense is used for specific finished past times."
      },
      {
        mistake: "She don't check my baggage.",
        correction: "She doesn't check my baggage.",
        explanation: "Third-person singular agreement requiring 'doesn't'."
      }
    ],
    newExpressions: [
      {
        id: 'vocab-5',
        expression: 'Cut to the chase',
        meaning: '본론으로 바로 들어가다',
        exampleSentence: 'To cut to the chase, my flight leaves in 30 minutes.',
        espCategory: 'General',
        dateAdded: '2026-07-23'
      },
      {
        id: 'vocab-6',
        expression: 'Chicken out',
        meaning: '겁을 먹고 포기하다/머뭇거리다',
        exampleSentence: 'Don\'t chicken out when speaking to airport customs officers!',
        espCategory: 'General',
        dateAdded: '2026-07-23'
      }
    ],
    encouragement: "짧은 대화였지만 핵심 정보(수하물, 좌석)를 명확히 전달했습니다.",
    cafData: { fluencyScore: 88, accuracyScore: 84, complexityScore: 82 },
    selfReflection: "공항 체크인에서 빠르게 좌석 변경을 요청하는 패턴을 기억하게 됨.",
    date: '지난주'
  }
];

export const INITIAL_VOCABULARY: VocabularyItem[] = [
  {
    id: 'vocab-1',
    expression: 'Catch up with',
    meaning: '소식을 나누다 / 밀린 이야기를 하다',
    exampleSentence: 'It was great to catch up with you at the terminal.',
    espCategory: 'General',
    dateAdded: '2026-07-29',
    mastered: false
  },
  {
    id: 'vocab-2',
    expression: 'Hit the ground running',
    meaning: '지체 없이 빠르게 활발히 시작하다',
    exampleSentence: 'Our engineering team is ready to hit the ground running.',
    espCategory: 'Engineering',
    dateAdded: '2026-07-27',
    mastered: true
  },
  {
    id: 'vocab-3',
    expression: 'On the same page',
    meaning: '같은 생각과 오해 없는 입장을 공유하다',
    exampleSentence: 'Let\'s confirm that everyone is on the same page.',
    espCategory: 'Business',
    dateAdded: '2026-07-27',
    mastered: true
  },
  {
    id: 'vocab-4',
    expression: 'Cut to the chase',
    meaning: '사설을 빼고 바로 본론으로 들어가다',
    exampleSentence: 'Let\'s cut to the chase and discuss the API integration.',
    espCategory: 'Engineering',
    dateAdded: '2026-07-23',
    mastered: false
  },
  {
    id: 'vocab-5',
    expression: 'Chicken out',
    meaning: '두려움 때문에 중간에 포기하다/머뭇거리다',
    exampleSentence: 'I almost chickened out before pressing the speak button.',
    espCategory: 'General',
    dateAdded: '2026-07-20',
    mastered: false
  },
  {
    id: 'vocab-6',
    expression: 'Nibbles',
    meaning: '가볍게 먹는 간단한 음식 / 주전부리',
    exampleSentence: 'The lounge offers complimentary drinks and light nibbles.',
    espCategory: 'Hospitality',
    dateAdded: '2026-07-18',
    mastered: true
  }
];

export const INITIAL_CAF_HISTORY: CAFHistoryPoint[] = [
  { date: '월', fluency: 65, accuracy: 82, complexity: 60 },
  { date: '화', fluency: 72, accuracy: 78, complexity: 64 }, // Trade-off drop in accuracy as fluency rises
  { date: '수', fluency: 78, accuracy: 80, complexity: 70 },
  { date: '목', fluency: 81, accuracy: 84, complexity: 75 },
  { date: '금', fluency: 88, accuracy: 85, complexity: 82 },
  { date: '토', fluency: 84, accuracy: 88, complexity: 80 },
  { date: '일', fluency: 90, accuracy: 89, complexity: 85 }
];

export function getUserProfile(): UserProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return INITIAL_USER_PROFILE;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getExitTickets(): ExitTicket[] {
  const data = localStorage.getItem(EXIT_TICKETS_KEY);
  if (!data) return INITIAL_EXIT_TICKETS;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_EXIT_TICKETS;
  }
}

export function saveExitTicket(ticket: ExitTicket): ExitTicket[] {
  const existing = getExitTickets();
  const updated = [ticket, ...existing];
  localStorage.setItem(EXIT_TICKETS_KEY, JSON.stringify(updated));

  // Also extract new expressions into vocabulary store
  if (ticket.newExpressions && ticket.newExpressions.length > 0) {
    const vocabList = getVocabulary();
    const newItems = ticket.newExpressions.map((item, idx) => ({
      ...item,
      id: `vocab-${Date.now()}-${idx}`,
      dateAdded: new Date().toISOString().split('T')[0]
    }));
    saveVocabulary([...newItems, ...vocabList]);
  }

  // Update user stats
  const profile = getUserProfile();
  profile.completedSessionsCount += 1;
  profile.totalStudyMinutes += 5;
  profile.coins += 20;
  saveUserProfile(profile);

  return updated;
}

export function getVocabulary(): VocabularyItem[] {
  const data = localStorage.getItem(VOCABULARY_KEY);
  if (!data) return INITIAL_VOCABULARY;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_VOCABULARY;
  }
}

export function saveVocabulary(items: VocabularyItem[]): void {
  localStorage.setItem(VOCABULARY_KEY, JSON.stringify(items));
}

export function toggleVocabularyMastered(id: string): VocabularyItem[] {
  const items = getVocabulary();
  const updated = items.map(item => item.id === id ? { ...item, mastered: !item.mastered } : item);
  saveVocabulary(updated);
  return updated;
}

export function getCAFHistory(): CAFHistoryPoint[] {
  const data = localStorage.getItem(CAF_HISTORY_KEY);
  if (!data) return INITIAL_CAF_HISTORY;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CAF_HISTORY;
  }
}
