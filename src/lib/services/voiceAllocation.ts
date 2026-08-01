// Pitch and Voice Allocation Service for Choir Auditions

export interface VoicePartSpec {
  name: string;
  minMidi: number; // Lowest expected note
  maxMidi: number; // Highest expected note
  idealLowMidi: number;
  idealHighMidi: number;
  genderHint?: 'F' | 'M' | 'Any';
}

export const VOICE_PART_SPECS: Record<string, VoicePartSpec> = {
  'Soprano 1': { name: 'Soprano 1', minMidi: 60, maxMidi: 84, idealLowMidi: 62, idealHighMidi: 81, genderHint: 'F' }, // C4 - C6
  'Soprano 2': { name: 'Soprano 2', minMidi: 59, maxMidi: 81, idealLowMidi: 60, idealHighMidi: 79, genderHint: 'F' }, // B3 - A5
  'Alto 1':    { name: 'Alto 1',    minMidi: 57, maxMidi: 77, idealLowMidi: 59, idealHighMidi: 74, genderHint: 'F' }, // A3 - F5
  'Alto 2':    { name: 'Alto 2',    minMidi: 53, maxMidi: 74, idealLowMidi: 55, idealHighMidi: 72, genderHint: 'F' }, // F3 - D5
  'Tenor 1':   { name: 'Tenor 1',   minMidi: 48, maxMidi: 72, idealLowMidi: 50, idealHighMidi: 69, genderHint: 'M' }, // C3 - C5
  'Tenor 2':   { name: 'Tenor 2',   minMidi: 46, maxMidi: 69, idealLowMidi: 48, idealHighMidi: 67, genderHint: 'M' }, // Bb2 - A4
  'Baritone':  { name: 'Baritone',  minMidi: 43, maxMidi: 65, idealLowMidi: 45, idealHighMidi: 64, genderHint: 'M' }, // G2 - F4
  'Bass':      { name: 'Bass',      minMidi: 40, maxMidi: 64, idealLowMidi: 41, idealHighMidi: 62, genderHint: 'M' }, // E2 - E4
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert Scientific Pitch Notation (e.g. C3, F#4, Bb2) to MIDI note number
 */
export function noteToMidi(noteStr: string): number {
  if (!noteStr) return 60; // Default C4
  
  const clean = noteStr.trim().toUpperCase();
  const match = clean.match(/^([A-G])([#B]?)(-?\d+)$/);
  if (!match) return 60;
  
  let [, letter, accidental, octaveStr] = match;
  let octave = parseInt(octaveStr, 10);
  
  let noteIndex = NOTE_NAMES.indexOf(letter);
  if (accidental === '#') {
    noteIndex += 1;
  } else if (accidental === 'B') {
    noteIndex -= 1;
  }
  
  if (noteIndex < 0) noteIndex += 12;
  if (noteIndex >= 12) noteIndex -= 12;
  
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Convert MIDI note number to Scientific Pitch Notation (e.g. 60 -> C4)
 */
export function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = Math.abs(midi % 12);
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export interface StudentFitResult {
  studentId: string;
  studentName: string;
  lowestNote: string;
  highestNote: string;
  lowestMidi: number;
  highestMidi: number;
  rangeInSemitones: number;
  scores: Record<string, number>; // VoicePart -> Score 0-100%
  topSuggestedPart: string;
  topFitScore: number;
  assignedVoicePart: string;
}

/**
 * Calculate suitability score (0-100%) for a given student range against a voice part spec
 */
export function calculateFitScore(lowMidi: number, highMidi: number, voicePart: string): number {
  const spec = VOICE_PART_SPECS[voicePart];
  if (!spec) return 0;

  // Measure range overlap
  const overlapLow = Math.max(lowMidi, spec.minMidi);
  const overlapHigh = Math.min(highMidi, spec.maxMidi);
  const overlap = Math.max(0, overlapHigh - overlapLow);

  const studentSpan = Math.max(1, highMidi - lowMidi);
  const specSpan = Math.max(1, spec.maxMidi - spec.minMidi);

  // Overlap ratio
  const overlapRatio = overlap / Math.min(studentSpan, specSpan);

  // Center point comparison
  const studentCenter = (lowMidi + highMidi) / 2;
  const specCenter = (spec.idealLowMidi + spec.idealHighMidi) / 2;
  const centerDistance = Math.abs(studentCenter - specCenter);

  // Score computation
  let score = (overlapRatio * 70) + Math.max(0, (30 - centerDistance * 2));
  
  // Penalize if high or low notes are far off
  if (highMidi < spec.minMidi || lowMidi > spec.maxMidi) {
    score *= 0.1;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Smart allocation engine balancing individual suitability scores with teacher target section quotas
 */
export function smartAllocateVoiceParts(
  students: Array<{
    id: string;
    name: string;
    lowestNote: string;
    highestNote: string;
    currentVoiceType?: string;
  }>,
  targetRatios: Record<string, number> // e.g. { 'Soprano 1': 15, 'Soprano 2': 15, ... } (percentages)
): StudentFitResult[] {
  const totalStudents = students.length;
  if (totalStudents === 0) return [];

  // 1. Calculate individual fit scores for each student
  const studentFits: StudentFitResult[] = students.map((s) => {
    const lowMidi = noteToMidi(s.lowestNote || 'C4');
    const highMidi = noteToMidi(s.highestNote || 'C5');
    const rangeInSemitones = Math.max(0, highMidi - lowMidi);

    const scores: Record<string, number> = {};
    let topPart = 'Soprano 1';
    let topScore = -1;

    Object.keys(VOICE_PART_SPECS).forEach((part) => {
      const score = calculateFitScore(lowMidi, highMidi, part);
      scores[part] = score;
      if (score > topScore) {
        topScore = score;
        topPart = part;
      }
    });

    return {
      studentId: s.id,
      studentName: s.name,
      lowestNote: s.lowestNote || 'C4',
      highestNote: s.highestNote || 'C5',
      lowestMidi: lowMidi,
      highestMidi: highMidi,
      rangeInSemitones,
      scores,
      topSuggestedPart: topPart,
      topFitScore: topScore,
      assignedVoicePart: s.currentVoiceType || topPart,
    };
  });

  // 2. Compute target capacity for each voice part based on targetRatios
  const targetCounts: Record<string, number> = {};
  let allocatedCount = 0;
  const parts = Object.keys(VOICE_PART_SPECS);

  parts.forEach((part) => {
    const pct = targetRatios[part] || 12.5; // default 100/8 = 12.5%
    const target = Math.max(1, Math.round((pct / 100) * totalStudents));
    targetCounts[part] = target;
    allocatedCount += target;
  });

  // Adjust target count discrepancies due to rounding
  let diff = totalStudents - allocatedCount;
  let partIdx = 0;
  while (diff !== 0 && parts.length > 0) {
    const part = parts[partIdx % parts.length];
    if (diff > 0) {
      targetCounts[part] += 1;
      diff--;
    } else if (diff < 0 && targetCounts[part] > 1) {
      targetCounts[part] -= 1;
      diff++;
    }
    partIdx++;
  }

  // 3. Smart Assignment: Greedy allocation sorted by highest fit score
  const partAssignments: Record<string, number> = {};
  parts.forEach((p) => (partAssignments[p] = 0));

  // Sort students by highest fit score descending to prioritize clear matches
  const sortedStudents = [...studentFits].sort((a, b) => b.topFitScore - a.topFitScore);

  sortedStudents.forEach((student) => {
    // Find highest scoring part that still has quota, or fallback to best overall score
    const sortedPartsForStudent = Object.keys(student.scores).sort(
      (p1, p2) => student.scores[p2] - student.scores[p1]
    );

    let chosenPart = sortedPartsForStudent[0];
    for (const part of sortedPartsForStudent) {
      if ((partAssignments[part] || 0) < (targetCounts[part] || 1)) {
        chosenPart = part;
        break;
      }
    }

    partAssignments[chosenPart] = (partAssignments[chosenPart] || 0) + 1;
    student.assignedVoicePart = chosenPart;
  });

  return studentFits;
}
