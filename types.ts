export enum AppMode {
  LANDING = 'LANDING',
  WRITING_TASK_1 = 'WRITING_TASK_1',
  WRITING_TASK_2 = 'WRITING_TASK_2',
  SPEAKING = 'SPEAKING',
  PRACTICE = 'PRACTICE',
  FEEDBACK = 'FEEDBACK',
  HISTORY = 'HISTORY'
}

export enum SpeakingPart {
  INTRO = 'INTRO',
  PART_1 = 'PART_1',
  PART_2_PREP = 'PART_2_PREP',
  PART_2_SPEAK = 'PART_2_SPEAK',
  PART_3 = 'PART_3',
  FINISHED = 'FINISHED'
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface ScoreCriteria {
  name: string;
  score: number;
  description: string;
}

export interface Correction {
  original: string;
  correction: string;
  explanation: string;
}

export interface PronunciationTip {
  word: string;
  ipa: string;
  error: string;
  tip: string;
}

export interface TestResult {
  overallBand: number;
  criteriaScores: ScoreCriteria[];
  feedbackText: string;
  corrections: Correction[];
  modelAnswer?: string;
  pronunciationTips?: PronunciationTip[];
  recordingUrl?: string;
  date?: number; // timestamp for history
}

export interface WritingPrompt {
  title: string;
  instructions: string;
  imageDescription?: string; // For Task 1 graphs description if text-based
  imageUrl?: string; // Generated chart image for Task 1
}

export interface HistoryItem {
  id: string;
  date: number;
  mode: AppMode;
  score: number;
  result: TestResult;
}