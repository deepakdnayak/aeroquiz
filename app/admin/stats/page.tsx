'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Stats {
  totalAttempted:    number;
  averagePercentage: number;
  lateCount:         number;
  autoSubmittedCount: number;
  pendingGrading:    number;
  subjectStats:      { subject: string; averagePercentage: number; count: number }[];
  monthlyTrend:      { month: string; percentage: number }[];
  recentSubmissions: {
    quizTitle:   string;
    subject:     string;
    score:       string;
    percentage:  number;
    isLate:      boolean;
    status:      string;
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
      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
        {payload[0].value}%
      </div>
    </div>
  );
};

export default function AdminStatsPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) { setError(d.error || 'Failed to load'); setLoading(false); return; }
        setStats(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading statistics...
    </div>
  );

  if (error) return (
    <div style={{
      margin: 40, padding: 24, borderRadius: 12,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      color: 'var(--danger)', fontSize: 14,
    }}>
      Error: {error}
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

      {/* KPI cards */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28,
      }}>
        {[
          { label: 'Attempted',      value: stats.totalAttempted,       icon: '📋', color: 'var(--accent)' },
          { label: 'Average Score',  value: `${stats.averagePercentage}%`, icon: '📊', color: scoreColor(stats.averagePercentage) },
          { label: 'Pending Grades', value: stats.pendingGrading,       icon: '⏳', color: 'var(--warning)' },
          { label: 'Late Submits',   value: stats.lateCount,            icon: '⏰', color: 'var(--warning)' },
          { label: 'Auto-Submitted', value: stats.autoSubmittedCount,   icon: '⚠️', color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="fade-up-2" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24,
      }}>
        {/* Monthly trend */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            Monthly Performance
          </h3>
          {stats.monthlyTrend.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>
              No data yet — submit and grade a quiz first
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthlyTrend}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
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
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            Subject Breakdown
          </h3>
          {stats.subjectStats.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>
              No data yet — submit a quiz first
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.subjectStats} barSize={32}>
                <XAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="averagePercentage" radius={[6, 6, 0, 0]}>
                  {stats.subjectStats.map(entry => (
                    <Cell
                      key={entry.subject}
                      fill={SUBJECT_COLORS[entry.subject] || 'var(--accent)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject detail cards */}
      <div className="fade-up-3" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28,
      }}>
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
                {s ? `${s.count} quiz${s.count !== 1 ? 'zes' : ''}` : 'No attempts'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent submissions table */}
      <div className="card fade-up-3" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
          Recent Submissions
        </h3>
        {stats.recentSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32, fontSize: 13 }}>
            No submissions yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Quiz', 'Subject', 'Score', 'Percentage', 'Flags', 'Date'].map(h => (
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
                  <td style={{
                    padding: '12px 12px 12px 0', fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {s.status === 'submitted' ? (
                      <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                    ) : s.score}
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    {s.status === 'graded' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 6, background: 'var(--bg-elevated)',
                          borderRadius: 3, overflow: 'hidden', maxWidth: 80,
                        }}>
                          <div style={{
                            height: '100%', width: `${s.percentage}%`,
                            background: scoreColor(s.percentage), borderRadius: 3,
                          }} />
                        </div>
                        <span style={{
                          fontSize: 13, color: scoreColor(s.percentage), fontWeight: 700,
                        }}>
                          {s.percentage}%
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                        border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                      }}>Awaiting grades</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.isLate && (
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 20,
                          background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                          border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                        }}>Late</span>
                      )}
                    </div>
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