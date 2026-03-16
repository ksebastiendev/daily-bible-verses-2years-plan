export interface VerseBlockItem {
  verse: number;
  text: string;
}

export const DEFAULT_BLOCK_SIZE = 3;

export function clampStep(step: number, totalVerses: number, blockSize = DEFAULT_BLOCK_SIZE) {
  if (totalVerses <= 0) return 0;
  const maxStep = Math.max(Math.ceil(totalVerses / blockSize) - 1, 0);
  return Math.max(0, Math.min(step, maxStep));
}

export function getInitialStep(versesDone: number, totalVerses: number, blockSize = DEFAULT_BLOCK_SIZE) {
  if (totalVerses <= 0 || versesDone <= 0) return 0;
  const step = Math.floor(versesDone / blockSize);
  return clampStep(step, totalVerses, blockSize);
}

export function getStepVerses<T>(verses: T[], step: number, blockSize = DEFAULT_BLOCK_SIZE) {
  if (!Array.isArray(verses) || verses.length === 0) return [];
  const safeStep = clampStep(step, verses.length, blockSize);
  const start = safeStep * blockSize;
  const end = start + blockSize;
  return verses.slice(start, end);
}

export function getProgress(versesLength: number, step: number, blockSize = DEFAULT_BLOCK_SIZE) {
  if (versesLength <= 0) {
    return {
      totalSteps: 0,
      versesShown: 0,
      isLastStep: true,
      progressPercent: 0,
    };
  }

  const totalSteps = Math.ceil(versesLength / blockSize);
  const safeStep = clampStep(step, versesLength, blockSize);
  const versesShown = Math.min((safeStep + 1) * blockSize, versesLength);
  const isLastStep = safeStep >= totalSteps - 1;
  const progressPercent = Math.round((versesShown / versesLength) * 100);

  return {
    totalSteps,
    versesShown,
    isLastStep,
    progressPercent,
  };
}
