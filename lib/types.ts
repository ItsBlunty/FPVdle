// Shared types for client/server boundary. Keep these in sync with Prisma.

export interface ClueDTO {
  position: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption: string | null;
}

export interface DiagnosisDTO {
  id: string;
  name: string;
  category: string;
  aliases: string[];
}

export interface PuzzleTodayDTO {
  id: number;
  number: number;
  publishDate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalClues: number;
  clues: ClueDTO[];
  // Note: answerId is NOT sent until the player completes the puzzle.
}

export interface PuzzleResultDTO {
  answerId: string;
  answerName: string;
  explanation: string;
  difficulty: string;
}

export interface StatsDTO {
  totalPlays: number;
  solvedCount: number;
  percentSolved: number;
  averageClues: number | null;
}

export interface ArchiveItemDTO {
  id: number;
  number: number;
  publishDate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalClues: number;
}
