import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { VoiceType } from '@/lib/services/library';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = getDb();
    const result = await db.prepare('SELECT * FROM practices').all<any>();
    
    const practices = result.results.map((r: any) => ({
      ...r,
      rubricScore: r.rubricScore ? JSON.parse(r.rubricScore) : undefined
    }));
    
    const totalPractices = practices.length;
    const assessedPractices = practices.filter((p: any) => p.rubricScore).length;
    
    const voiceGroups: Record<string, any[]> = {};
    practices.forEach((p: any) => {
      if (p.rubricScore && p.voiceType) {
        if (!voiceGroups[p.voiceType]) voiceGroups[p.voiceType] = [];
        voiceGroups[p.voiceType].push(p);
      }
    });
    
    const voiceStats: any[] = [];
    const insights: string[] = [];
    const suggestedResearch: string[] = [];
    let lowestScore = 5;
    let weakestVoice = '';
    let weakestSkill = '';
    
    for (const [voice, group] of Object.entries(voiceGroups)) {
      if (group.length === 0) continue;
      
      let sumPitch = 0, sumRhythm = 0, sumTech = 0;
      group.forEach(p => {
        sumPitch += p.rubricScore.pitch;
        sumRhythm += p.rubricScore.rhythm;
        sumTech += p.rubricScore.technique;
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
    
    return NextResponse.json({ totalPractices, assessedPractices, voiceStats, insights, suggestedResearch });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
