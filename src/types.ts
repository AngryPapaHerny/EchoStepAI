export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ESPCategory = 'Engineering' | 'Business' | 'Healthcare' | 'Hospitality' | 'General';
export type ModeType = 'voice' | 'text';

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
  fluencyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  accuracyLevel: 'Needs Work' | 'Good' | 'Excellent';
  topMistakes: MistakeCorrection[];
  newExpressions: VocabularyItem[];
  encouragement: string;
  cafData: CAFData;
  selfReflection: string;
  date: string;
}

export interface UserProfile {
  name: string;
  majorOrJob: ESPCategory;
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1';
  preferredMode: ModeType;
  coins: number;
  streakDays: number;
  totalStudyMinutes: number;
  completedSessionsCount: number;
  badges: string[];
}

export interface CAFHistoryPoint {
  date: string;
  fluency: number;
  accuracy: number;
  complexity: number;
}
