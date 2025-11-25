
export interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctAnswer: string; // The text of the correct answer
  explanation?: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answers: Record<string, string>; // questionId -> selectedOption
  isFinished: boolean;
}

export interface CategoryPerformance {
  category: string;
  total: number;
  correct: number;
}

export interface QuestionSet {
  id: string;
  title: string;
  dateAdded: number;
  questions: Question[];
}

export interface ExamResult {
  id: string;
  date: number; // timestamp
  totalQuestions: number;
  correctCount: number;
  score: number;
  categoryStats: Record<string, { total: number; correct: number }>;
}

// Interface for the Gemini/User provided JSON format
export interface RawGeminiQuestion {
  id: number | string;
  alan: string;
  soru: string;
  siklar: Record<string, string>; // { "A": "Option A", "B": "Option B" }
  cevap: string; // "A", "B", etc.
  cozum?: string;
}
