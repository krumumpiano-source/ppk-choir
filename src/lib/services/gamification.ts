export interface StudentStats {
  studentId: string;
  streak: number;
  lastPracticeDate: string; // ISO date string "YYYY-MM-DD"
  badges: string[];
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  try {
    const res = await fetch(`/api/gamification?studentId=${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = (await res.json()) as any;
    return data.stats;
  } catch (error) {
    console.error('Error getting student stats:', error);
    return { studentId, streak: 0, lastPracticeDate: '', badges: [] };
  }
}

export async function updateStreakAndBadges(studentId: string): Promise<any> {
  try {
    const res = await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, action: 'update_streak' })
    });
    const result = (await res.json()) as any;
    return result;
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error };
  }
}

export async function awardBadge(studentId: string, badgeId: string): Promise<any> {
  try {
    const res = await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, action: 'award_badge', badgeId })
    });
    const result = (await res.json()) as any;
    return result;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return { success: false, error };
  }
}
