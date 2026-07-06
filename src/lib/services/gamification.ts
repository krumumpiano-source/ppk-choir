import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface StudentStats {
  studentId: string;
  streak: number;
  lastPracticeDate: string; // ISO date string "YYYY-MM-DD"
  badges: string[];
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  try {
    const docRef = doc(db, 'student_stats', studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as StudentStats;
    } else {
      const defaultStats: StudentStats = {
        studentId,
        streak: 0,
        lastPracticeDate: '',
        badges: []
      };
      await setDoc(docRef, defaultStats);
      return defaultStats;
    }
  } catch (error) {
    console.error('Error getting student stats:', error);
    return { studentId, streak: 0, lastPracticeDate: '', badges: [] };
  }
}

export async function updateStreakAndBadges(studentId: string) {
  try {
    const stats = await getStudentStats(studentId);
    const today = new Date().toISOString().split('T')[0];
    
    if (stats.lastPracticeDate === today) {
      return { success: true, stats };
    }
    
    let newStreak = stats.streak;
    let newBadges = [...stats.badges];
    
    if (!stats.lastPracticeDate) {
      newStreak = 1;
      if (!newBadges.includes('first_note')) newBadges.push('first_note');
    } else {
      const lastDate = new Date(stats.lastPracticeDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }
    
    if (newStreak >= 3 && !newBadges.includes('streak_3')) newBadges.push('streak_3');
    if (newStreak >= 7 && !newBadges.includes('streak_7')) newBadges.push('streak_7');
    
    const updatedStats: StudentStats = {
      studentId,
      streak: newStreak,
      lastPracticeDate: today,
      badges: newBadges
    };
    
    const docRef = doc(db, 'student_stats', studentId);
    await updateDoc(docRef, { ...updatedStats });
    
    return { success: true, stats: updatedStats };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error };
  }
}

export async function awardBadge(studentId: string, badgeId: string) {
  try {
    const stats = await getStudentStats(studentId);
    if (!stats.badges.includes(badgeId)) {
      const newBadges = [...stats.badges, badgeId];
      const docRef = doc(db, 'student_stats', studentId);
      await updateDoc(docRef, { badges: newBadges });
    }
    return { success: true };
  } catch (error) {
    console.error('Error awarding badge:', error);
    return { success: false, error };
  }
}
