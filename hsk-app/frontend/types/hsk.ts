// ─── Core vocabulary types ────────────────────────────────────────────────────

export interface PosTag {
  code: string;
  label: string;
}

export interface Word {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  pinyinNumeric: string;
  meanings: string[];   // tất cả nghĩa tiếng Anh (tối đa 5)
  meaning: string;      // nghĩa ngắn nhất
  meaningVi: string;    // nghĩa tiếng Việt (có thể rỗng)
  pos: PosTag[];
  radical: string;
  frequency: number;
  classifiers: string[];
  level: string;        // "new-1" … "new-7"
  audioUrl: string;
}

export interface Lesson {
  id: string;
  level: string;
  lessonNumber: number;
  title: string;
  description: string;
  words: Word[];
  wordCount: number;
}

export interface LevelData {
  level: string;
  levelNumber: number;
  totalWords: number;
  totalLessons: number;
  lessons: Lesson[];
}

export interface LevelMeta {
  level: string;
  levelNumber: number;
  label: string;
  dataFile: string;
  totalLessons: number;
  wordsPerLesson: number;
}

// ─── SM-2 Flashcard types ────────────────────────────────────────────────────

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Card {
  wordId: string;
  easeFactor: number;     // default 2.5
  interval: number;       // ngày đến lần review tiếp theo
  repetitions: number;    // số lần đã review
  nextReview: string;     // ISO date string
  lastReview: string;     // ISO date string
}

// ─── Progress / Storage types ────────────────────────────────────────────────

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;         // 0-100
  completedAt?: string;
}

export interface VocabProgress {
  userId?: string;
  lessons: Record<string, LessonProgress>;
  flashcards: Record<string, SM2Card>;
  streak: number;
  lastStudied?: string;
}

// ─── Game types ───────────────────────────────────────────────────────────────

export type GameMode = "meaning" | "pinyin" | "hanzi";

export interface QuizQuestion {
  word: Word;
  options: Word[];        // 4 lựa chọn (1 đúng + 3 sai)
  correctIndex: number;
  mode: GameMode;
}

export interface GameResult {
  totalQuestions: number;
  correct: number;
  wrong: number;
  timeTaken: number;      // ms
  details: Array<{
    word: Word;
    userAnswer: string;
    correct: boolean;
    timeTaken: number;
  }>;
}

// ─── Test types ───────────────────────────────────────────────────────────────

export interface TestQuestion {
  word: Word;
  type: "multiple-choice" | "fill-in";
  options?: string[];
  correctAnswer: string;
}

export interface TestResult {
  score: number;          // 0-100
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  details: Array<{
    question: TestQuestion;
    userAnswer: string;
    correct: boolean;
  }>;
}
