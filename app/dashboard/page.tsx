'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Quiz {
  _id: string;
  title: string;
  subject: string;
  quizType: string;
  availableFrom: string;
  availableTo: string;
  duration: number;
  totalMarks: number;
}

interface Stats {
  totalAttempted: number;
  averagePercentage: number;
  monthlyTrend: { month: string; percentage: number }[];
}

const subjectColor: Record<string, string> = {
  Science: 'subject-science',
  Social:  'subject-social',
  English: 'subject-english',
  Maths:   'subject-maths',
};

function Countdown({ to }: { to: string }) {
  const [diff, setDiff] = useState('');

  useEffect(() => {
    const calc = () => {
      const ms = new Date(to).getTime() - Date.now();
      if (ms <= 0) { setDiff('Expired'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setDiff(`${h}h ${m}m left`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [to]);

  const expired = diff === 'Expired';
  return (
    <span style={{ color: expired ? 'var(--danger)' : 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
      ⏰ {diff}
    </span>
  );
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/quiz').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/submissions/mine').then(r => r.json()),
    ]).then(([qData, sData, subData]) => {
      setQuizzes(qData.quizzes || []);
      setStats(sData);
      const ids = new Set<string>((subData.submissions || []).map((s: any) => s.quizId));
      setAttempted(ids);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const available = quizzes.filter(q => {
    const from = new Date(q.availableFrom);
    const to   = new Date(q.availableTo);
    return now >= from && now <= to && !attempted.has(q._id);
  });
  const upcoming = quizzes.filter(q => new Date(q.availableFrom) > now && !attempted.has(q._id));
  const past     = quizzes.filter(q => attempted.has(q._id) || new Date(q.availableTo) < now);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading your quizzes...
    </div>
  );

  return (
    <div>
      {/* Greeting */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Hey, {session?.user?.username?.split('d')[0] || 'Shashank'} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Here are your quizzes for today
        </p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="fade-up-1" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32,
        }}>
          {[
            { label: 'Attempted',    value: stats.totalAttempted,       color: '#22c55e' },
            { label: 'Average Score', value: `${stats.averagePercentage}%`, color: 'var(--accent)' },
            { label: 'Available Now', value: available.length,           color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Available now */}
      {available.length > 0 && (
        <section className="fade-up-2" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 8px var(--success)' }} />
            Available Now
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {available.map(q => (
              <div key={q._id} className="card" style={{
                padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16,
                borderColor: 'rgba(34,197,94,0.3)',
              }}>
                <span className={`subject-tag ${subjectColor[q.subject] || ''}`}>{q.subject}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{q.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span>⏱ {q.duration} min</span>
                    <span>📝 {q.totalMarks} marks</span>
                    <Countdown to={q.availableTo} />
                  </div>
                </div>
                <Link href={`/dashboard/quiz/${q._id}`}>
                  <button className="btn-primary" style={{ padding: '9px 22px' }}>
                    Start →
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="fade-up-3" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
            Upcoming
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(q => (
              <div key={q._id} className="card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.7 }}>
                <span className={`subject-tag ${subjectColor[q.subject] || ''}`}>{q.subject}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{q.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Available from {new Date(q.availableFrom).toLocaleString()}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No quizzes */}
      {available.length === 0 && upcoming.length === 0 && (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>All caught up!</div>
          <div style={{ fontSize: 13 }}>No quizzes available right now. Check back later.</div>
        </div>
      )}
    </div>
  );
}