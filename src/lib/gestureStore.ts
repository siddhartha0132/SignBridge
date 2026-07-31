const STORAGE_KEY = "signbridge:custom-gestures:v1";

export type CustomGesture = {
  word: string;
  samples: number[][]; // preprocessed 42-d landmark vectors, few-shot examples
};

function load(): CustomGesture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(gestures: CustomGesture[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gestures));
}

export function listCustomGestures(): CustomGesture[] {
  return load();
}

// Adds one training sample for `word`. Call this 3-5 times per sign (the
// "few-shot" trainer) — more samples = a tighter, more reliable cluster for
// the kNN classifier to match against.
export function addSample(word: string, vector: number[]) {
  const gestures = load();
  const existing = gestures.find((g) => g.word === word);
  if (existing) {
    existing.samples.push(vector);
  } else {
    gestures.push({ word, samples: [vector] });
  }
  save(gestures);
}

export function deleteGesture(word: string) {
  save(load().filter((g) => g.word !== word));
}

export function clearAll() {
  save([]);
}
