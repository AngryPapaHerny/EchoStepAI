export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ESPCategory = 'Engineering' | 'Business' | 'Healthcare' | 'Hospitality' | 'General';
export type ModeType = 'voice' | 'text';
export type CEFRLevel = 'A2' | 'B1' | 'B2' | 'C1';
export type FluencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type AccuracyLevel = 'Needs Work' | 'Good' | 'Excellent';

export interface Scenario {
  id: string;
  title: string;
  titleKo: string;
  category: string;
  categoryKo: string;
  difficulty: Difficulty;
  description: string;
  descriptionKo: string;
  iconName: string;
  aiRole: string;
  userRole: string;
  defaultGoal: string;
  defaultGoalKo: string;
  espField: ESPCategory;
  estimatedMinutes: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
  timestamp: string;
  nudgeCorrection?: string | null;
}

export interface MistakeCorrection {
  mistake: string;
  correction: string;
  explanation: string;
}

export interface VocabularyItem {
  id: string;
  expression: string;
  meaning: string;
  exampleSentence: string;
  espCategory: string;
  dateAdded: string;
  mastered?: boolean;
}

export interface CAFData {
  fluencyScore: number;
  accuracyScore: number;
  complexityScore: number;
}

export interface ExitTicket {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  overallScore: number;
  fluencyLevel: FluencyLevel;
  accuracyLevel: AccuracyLevel;
  topMistakes: MistakeCorrection[];
  newExpressions: VocabularyItem[];
  encouragement: string;
  cafData: CAFData;
  selfReflection: string;
  /** DB의 created_at (ISO 8601) */
  createdAt: string;
  /** 화면 표시용 상대 날짜 ("오늘", "어제", "3일 전" …) */
  date: string;
}

/** AI가 막 생성했지만 아직 DB에 저장되지 않은 Exit Ticket */
export type ExitTicketDraft = Omit<ExitTicket, 'id' | 'createdAt' | 'date'>;

export interface UserProfile {
  /** auth.users.id 와 동일 */
  id: string;
  name: string;
  majorOrJob: ESPCategory;
  cefrLevel: CEFRLevel;
  preferredMode: ModeType;
  coins: number;
  streakDays: number;
  totalStudyMinutes: number;
  completedSessionsCount: number;
  badges: string[];
}

/** 학습자가 직접 수정할 수 있는 프로필 항목 */
export type EditableProfile = Pick<
  UserProfile,
  'name' | 'majorOrJob' | 'cefrLevel' | 'preferredMode'
>;

export interface CAFHistoryPoint {
  date: string;
  fluency: number;
  accuracy: number;
  complexity: number;
}
