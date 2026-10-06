'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, Search, Filter } from 'lucide-react';
import { getCheckInReports, ReportPeriod } from '@/lib/services/reports';
import { useAuth } from '@/components/providers/AuthProvider';

const splitThaiName = (fullName: string) => {
  let prefix = '';
  let first = '';
  let last = '';
  if (!fullName) return { prefix, first, last };
  let str = fullName.trim();
  const prefixes = ['เด็กหญิง', 'เด็กชาย', 'ด.ช.', 'ด.ญ.', 'นาย', 'นางสาว', 'ด.ช', 'ด.ญ', 'ดช.', 'ดญ.'];
  for (const p of prefixes) {
    if (str.startsWith(p)) {
      prefix = p;
      str = str.substring(p.length).trim();
      break;
    }
  }
  const parts = str.split(/\s+/);
  if (parts.length >= 2) {
    first = parts[0];
    last = parts.slice(1).join(' ');
  } else {
    first = parts[0] || '';
  }
  return { prefix, first, last };
};

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [groupBy, setGroupBy] = useState<'student' | 'room' | 'session' | 'raw'>('student');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData(selectedPeriod: ReportPeriod) {
    setLoading(true);
    const result = await getCheckInReports(selectedPeriod);
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }
    
    if (user?.role === 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData(period);
    }
  }, [user, authLoading, router, period]);

  const exportCSV = () => {
    if (data.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (groupBy === 'raw') {
      csvContent += "คำนำหน้า,ชื่อ,นามสกุล,ชื่อเล่น,เลขประจำตัวนักเรียน,ชั้น,แนวเสียง,เวลา\n";
      getFilteredAndGroupedData().forEach((row: any) => {
        const nameData = splitThaiName(row.userFullName || row.studentName);
        csvContent += `"${nameData.prefix}","${nameData.first}","${nameData.last}","${row.userNickname || '-'}","${row.actualStudentId || row.studentId}","${row.userSection || row.room || '-'}","${row.studentVoiceType || '-'}","${new Date(row.timestamp).toLocaleString('th-TH')}"\n`;
      });
    } else if (groupBy === 'student') {
      csvContent += "คำนำหน้า,ชื่อ,นามสกุล,ชื่อเล่น,เลขประจำตัวนักเรียน,ชั้น,แนวเสียง,จำนวนครั้งที่เข้าเรียน\n";
      getFilteredAndGroupedData().forEach((row: any) => {
        const nameData = splitThaiName(row.name);
        csvContent += `"${nameData.prefix}","${nameData.first}","${nameData.last}","${row.nickname || '-'}","${row.id}","${row.section || '-'}","${row.voiceType || '-'}","${row.count}"\n`;
      });
    } else if (groupBy === 'room') {
      csvContent += "ห้อง,จำนวนครั้งเช็คชื่อทั้งหมด\n";
      getFilteredAndGroupedData().forEach((row: any) => {
        csvContent += `"${row.name}","${row.count}"\n`;
      });
    } else {
      csvContent += "ชื่อกิจกรรม,จำนวนคนเข้าเรียน\n";
      getFilteredAndGroupedData().forEach((row: any) => {
        csvContent += `"${row.name}","${row.count}"\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${period}_${groupBy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredAndGroupedData = () => {
    // 1. Search filter
    const lowerSearch = search.toLowerCase();
    const filtered = data.filter(item => 
      item.studentName?.toLowerCase().includes(lowerSearch) || 
      item.studentId?.toLowerCase().includes(lowerSearch) ||
      item.room?.toLowerCase().includes(lowerSearch)
    );

    // 2. Grouping
    if (groupBy === 'raw') {
      return filtered;
    }

    const grouped: Record<string, any> = {};
    filtered.forEach(item => {
      let key = '';
      if (groupBy === 'student') {
        key = item.studentId;
        if (!grouped[key]) grouped[key] = { 
          id: item.actualStudentId || item.studentId, 
          name: item.userFullName || item.studentName,
          nickname: item.userNickname,
          section: item.userSection || item.room,
          voiceType: item.studentVoiceType,
          count: 0 
        };
        grouped[key].count += 1;
      } else if (groupBy === 'room') {
        key = item.room || 'ไม่ระบุ';
        if (!grouped[key]) grouped[key] = { name: key, count: 0 };
        grouped[key].count += 1;
      } else if (groupBy === 'session') {
        key = item.sessionId || 'ไม่ระบุ';
        if (!grouped[key]) grouped[key] = { name: item.sessionName || key, count: 0 };
        grouped[key].count += 1;
      }
    });

    return Object.values(grouped).sort((a: any, b: any) => b.count - a.count); // sort by count desc
  };

  const processedData = getFilteredAndGroupedData();

  if (authLoading || !user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>รายงานสรุปข้อมูล (Analytics)</h1>
        </div>
        <button onClick={exportCSV} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2ed573', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: '0.8rem 1.5rem', fontWeight: 'bold' }}>
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ช่วงเวลา</label>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
          >
            <option value="today">วันนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="month">เดือนนี้</option>
            <option value="term1">เทอม 1 (พ.ค. - ต.ค.)</option>
            <option value="term2">เทอม 2 (พ.ย. - มี.ค.)</option>
            <option value="year">ปีการศึกษาปัจจุบัน</option>
            <option value="all">ทั้งหมด (ตั้งแต่เปิดระบบ)</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>รูปแบบการสรุปข้อมูล</label>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value as any)}
            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
          >
            <option value="student">สรุปรายบุคคล (นับจำนวนครั้งเข้าเรียน)</option>
            <option value="room">สรุปภาพรวมแต่ละห้องเรียน</option>
            <option value="session">สรุปยอดผู้เข้าร่วมแต่ละกิจกรรม</option>
            <option value="raw">ดูข้อมูลดิบ (บันทึกรายครั้ง)</option>
          </select>
        </div>

        <div style={{ flex: '2 1 300px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ค้นหา (ชื่อ / รหัส / ห้อง)</label>
          <div style={{ position: 'relative' }}>
            <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา..."
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
            />
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
            <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                  {groupBy === 'raw' && (
                    <>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>คำนำหน้า</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อ</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>นามสกุล</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อเล่น</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>เลขประจำตัวนักเรียน</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชั้น</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>แนวเสียง</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>เวลา</th>
                    </>
                  )}
                  {groupBy === 'student' && (
                    <>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>คำนำหน้า</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อ</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>นามสกุล</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชื่อเล่น</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>เลขประจำตัวนักเรียน</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ชั้น</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>แนวเสียง</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>จำนวนครั้งที่เข้าร่วม</th>
                    </>
                  )}
                  {groupBy === 'room' && (
                    <>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>ห้องเรียน</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>จำนวนการเช็คชื่อรวม (ครั้ง)</th>
                    </>
                  )}
                  {groupBy === 'session' && (
                    <>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>ชื่อกิจกรรม</th>
                      <th style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>ยอดผู้เข้าร่วม (คน)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      ไม่พบข้อมูลในช่วงเวลาที่เลือก หรือไม่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  processedData.map((row: any, i: number) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {groupBy === 'raw' && (() => {
                        const nameData = splitThaiName(row.userFullName || row.studentName);
                        return (
                          <>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{nameData.prefix}</td>
                            <td style={{ padding: '1rem 1.2rem' }}>{nameData.first}</td>
                            <td style={{ padding: '1rem 1.2rem' }}>{nameData.last}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.userNickname || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.actualStudentId || row.studentId}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.userSection || row.room || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.studentVoiceType || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(row.timestamp).toLocaleString('th-TH')}</td>
                          </>
                        );
                      })()}
                      {groupBy === 'student' && (() => {
                        const nameData = splitThaiName(row.name);
                        return (
                          <>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{nameData.prefix}</td>
                            <td style={{ padding: '1rem 1.2rem' }}>{nameData.first}</td>
                            <td style={{ padding: '1rem 1.2rem' }}>{nameData.last}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.nickname || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.id}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.section || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.voiceType || '-'}</td>
                            <td style={{ padding: '1rem 1.2rem', color: 'var(--success)', fontWeight: 'bold' }}>{row.count}</td>
                          </>
                        );
                      })()}
                      {groupBy === 'room' && (
                        <>
                          <td style={{ padding: '1rem 1.2rem' }}><strong>{row.name}</strong></td>
                          <td style={{ padding: '1rem 1.2rem', color: 'var(--success)' }}>{row.count}</td>
                        </>
                      )}
                      {groupBy === 'session' && (
                        <>
                          <td style={{ padding: '1rem 1.2rem' }}><strong>{row.name}</strong></td>
                          <td style={{ padding: '1rem 1.2rem', color: 'var(--success)' }}>{row.count}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
