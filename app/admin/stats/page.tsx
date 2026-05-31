'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Stats {
  totalAttempted: number;
  averagePercentage: number;
  lateCount: number;
  autoSubmittedCount: number;
  subjectStats: { subject: string; averagePercentage: number; count: number }[];
  monthlyTrend: { month: string; percentage: number }[];
  recentSubmissions: {
    quizTitle: string;
    subject: string;
    score: string;
    percentage: number;
    isLate: boolean;
    submittedAt: string;
  }[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Science: '#3b82f6',
  Social:  '#f59e0b',
  English: '#22c55e',
  Maths:   '#ec4899',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{payload[0].value}%</div>
    </div>
  );
};

export default function AdminStatsPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading statistics...
    </div>
  );

  if (!stats) return null;

  const scoreColor = (p: number) =>
    p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Statistics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Shashank's performance overview
        </p>
      </div>

      {/* Top KPI cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28,
      }}>
        {[
          { label: 'Quizzes Attempted', value: stats.totalAttempted, icon: '📋', color: 'var(--accent)' },
          { label: 'Average Score',     value: `${stats.averagePercentage}%`, icon: '📊', color: scoreColor(stats.averagePercentage) },
          { label: 'Late Submissions',  value: stats.lateCount,   icon: '⏰', color: 'var(--warning)' },
          { label: 'Auto-Submitted',    value: stats.autoSubmittedCount, icon: '⚠️', color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Monthly trend */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Monthly Performance</h3>
          {stats.monthlyTrend.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthlyTrend}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="percentage"
                  stroke="var(--accent)" strokeWidth={2.5}
                  dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subject breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Subject Breakdown</h3>
          {stats.subjectStats.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.subjectStats} barSize={32}>
                <XAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="averagePercentage" radius={[6, 6, 0, 0]}>
                  {stats.subjectStats.map((entry) => (
                    <Cell key={entry.subject} fill={SUBJECT_COLORS[entry.subject] || 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject detail cards */}
      <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {['Science', 'Social', 'English', 'Maths'].map(subj => {
          const s = stats.subjectStats.find(x => x.subject === subj);
          return (
            <div key={subj} className="card" style={{ padding: 18 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: SUBJECT_COLORS[subj], marginBottom: 10,
              }} />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{subj}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: SUBJECT_COLORS[subj] }}>
                {s ? `${s.averagePercentage}%` : '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {s ? `${s.count} quiz${s.count !== 1 ? 'zes' : ''}` : 'No data'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent submissions table */}
      <div className="card fade-up-3" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Recent Submissions</h3>
        {stats.recentSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            No submissions yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Quiz', 'Subject', 'Score', 'Percentage', 'Status', 'Date'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', padding: '0 12px 12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentSubmissions.map((s, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 14, fontWeight: 600 }}>
                    {s.quizTitle}
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <span className={`subject-tag subject-${s.subject.toLowerCase()}`}>
                      {s.subject}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px 12px 0', fontSize: 14, fontFamily: 'JetBrains Mono' }}>
                    {s.score}
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        flex: 1, height: 6, background: 'var(--bg-elevated)',
                        borderRadius: 3, overflow: 'hidden', maxWidth: 80,
                      }}>
                        <div style={{
                          height: '100%', width: `${s.percentage}%`,
                          background: scoreColor(s.percentage), borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 13, color: scoreColor(s.percentage), fontWeight: 700 }}>
                        {s.percentage}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    {s.isLate && (
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                        border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                      }}>Late</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(s.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}