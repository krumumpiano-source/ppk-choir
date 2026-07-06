import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { VoiceType } from './library';
import { PracticeRecord } from './practice';

export interface VoiceStats {
  voiceType: VoiceType;
  totalSubmissions: number;
  avgPitch: number;
  avgRhythm: number;
  avgTechnique: number;
  overallAvg: number;
}

export interface AnalyticsData {
  totalPractices: number;
  assessedPractices: number;
  voiceStats: VoiceStats[];
  insights: string[];
  suggestedResearch: string[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const snapshot = await getDocs(collection(db, 'practices'));
    const practices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PracticeRecord[];
    
    const totalPractices = practices.length;
    const assessedPractices = practices.filter(p => p.rubricScore).length;

    const voiceGroups: Record<string, PracticeRecord[]> = {
      Soprano: [], Alto: [], Tenor: [], Bass: []
    };

    practices.forEach(p => {
      if (p.rubricScore && voiceGroups[p.voiceType]) {
        voiceGroups[p.voiceType].push(p);
      }
    });

    const voiceStats: VoiceStats[] = [];
    const insights: string[] = [];
    const suggestedResearch: string[] = [];

    let lowestScore = 5;
    let weakestVoice = '';
    let weakestSkill = '';

    for (const [voice, group] of Object.entries(voiceGroups)) {
      if (group.length === 0) continue;

      let sumPitch = 0;
      let sumRhythm = 0;
      let sumTech = 0;

      group.forEach(p => {
        sumPitch += p.rubricScore!.pitch;
        sumRhythm += p.rubricScore!.rhythm;
        sumTech += p.rubricScore!.technique;
      });

      const avgPitch = sumPitch / group.length;
      const avgRhythm = sumRhythm / group.length;
      const avgTechnique = sumTech / group.length;
      const overallAvg = (avgPitch + avgRhythm + avgTechnique) / 3;

      voiceStats.push({
        voiceType: voice as VoiceType,
        totalSubmissions: group.length,
        avgPitch: Number(avgPitch.toFixed(2)),
        avgRhythm: Number(avgRhythm.toFixed(2)),
        avgTechnique: Number(avgTechnique.toFixed(2)),
        overallAvg: Number(overallAvg.toFixed(2))
      });

      const scores = { 'ระดับเสียง (Pitch)': avgPitch, 'จังหวะ (Rhythm)': avgRhythm, 'เทคนิค (Technique)': avgTechnique };
      for (const [skill, score] of Object.entries(scores)) {
        if (score < lowestScore) {
          lowestScore = score;
          weakestVoice = voice;
          weakestSkill = skill;
        }
      }
    }

    if (voiceStats.length > 0) {
      insights.push(`พบจุดที่ต้องพัฒนามากที่สุดในกลุ่มแนวเสียง ${weakestVoice} เรื่อง ${weakestSkill} (คะแนนเฉลี่ย ${lowestScore.toFixed(2)}/5)`);
      
      const lowParticipation = voiceStats.filter(v => v.totalSubmissions < (assessedPractices / 4) * 0.5);
      if (lowParticipation.length > 0) {
        insights.push(`แนวเสียง ${lowParticipation.map(v => v.voiceType).join(', ')} มีสัดส่วนการส่งงานที่ได้รับการประเมินค่อนข้างต่ำ ควรมีการติดตามเพิ่มเติม`);
      } else {
        insights.push('ภาพรวมการส่งงานของแต่ละแนวเสียงอยู่ในเกณฑ์สม่ำเสมอ');
      }

      suggestedResearch.push(`"การพัฒนา${weakestSkill} ของนักเรียนแนวเสียง ${weakestVoice} โดยใช้แบบฝึกหัดพิเศษเสริมผ่านระบบ PPK CHOIR"`);
      if (weakestSkill === 'ระดับเสียง (Pitch)') {
        suggestedResearch.push(`"ผลของการใช้ระบบสะท้อนผล (Self-Reflection) เพื่อแก้ปัญหาการร้องเพี้ยนในกลุ่มนักเรียนที่มีคะแนน Pitch ต่ำกว่าเกณฑ์"`);
      } else if (weakestSkill === 'จังหวะ (Rhythm)') {
        suggestedResearch.push(`"การใช้สื่อเสียง (Resource Library) พร้อมเครื่องเคาะจังหวะ เพื่อแก้ปัญหาจังหวะคร่อมในแนว ${weakestVoice}"`);
      }
    } else {
      insights.push('ยังไม่มีข้อมูลการประเมินเพียงพอที่จะวิเคราะห์ได้');
      suggestedResearch.push('แนะนำให้ประเมินผลงานนักเรียนให้ครบก่อน เพื่อให้ AI สามารถนำเสนอหัวข้อวิจัยได้');
    }

    return {
      totalPractices,
      assessedPractices,
      voiceStats,
      insights,
      suggestedResearch
    };
  } catch (error) {
    console.error('Error in Analytics:', error);
    return { totalPractices: 0, assessedPractices: 0, voiceStats: [], insights: ['เกิดข้อผิดพลาดในการดึงข้อมูล'], suggestedResearch: [] };
  }
}
