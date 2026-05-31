'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quiz {
  _id: string;
  title: string;
  subject: string;
  quizType: string;
  status: string;
  availableFrom: string;
  availableTo: string;
  duration: number;
  totalMarks: number;
}

const subjectColor: Record<string, string> = {
  Science: 'subject-science',
  Social:  'subject-social',
  English: 'subject-english',
  Maths:   'subject-maths',
};

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => { fetchQuizzes(); }, []);

  async function fetchQuizzes() {
    const res = await fetch('/api/quiz');
    const data = await res.json();
    setQuizzes(data.quizzes || []);
    setLoading(false);
  }

  async function deleteQuiz(id: string) {
    if (!confirm('Delete this quiz?')) return;
    await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
    fetchQuizzes();
  }

  async function publishQuiz(id: string) {
    await fetch(`/api/quiz/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    fetchQuizzes();
  }

  const filtered = filter === 'all' ? quizzes : quizzes.filter(q => q.status === filter);

  const stats = {
    total:     quizzes.length,
    published: quizzes.filter(q => q.status === 'published').length,
    draft:     quizzes.filter(q => q.status === 'draft').length,
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Manage and monitor all quizzes
        </p>
      </div>

      {/* Stats Row */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Quizzes',     value: stats.total,     icon: '📋', color: 'var(--accent)' },
          { label: 'Published',         value: stats.published, icon: '✅', color: 'var(--success)' },
          { label: 'Drafts',            value: stats.draft,     icon: '📝', color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Create */}
      <div className="fade-up-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'published', 'draft'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid',
                borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                background:  filter === f ? 'rgba(108,99,255,0.15)' : 'transparent',
                color:       filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <Link href="/admin/create-quiz">
          <button className="btn-primary">+ Create Quiz</button>
        </Link>
      </div>

      {/* Quiz List */}
      <div className="fade-up-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
            Loading quizzes...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            No quizzes found. <Link href="/admin/create-quiz" style={{ color: 'var(--accent)' }}>Create one →</Link>
          </div>
        )}
        {filtered.map(quiz => (
          <div key={quiz._id} className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Subject tag */}
            <span className={`subject-tag ${subjectColor[quiz.subject] || ''}`}>
              {quiz.subject}
            </span>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{quiz.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {quiz.quizType} · {quiz.duration} min · {quiz.totalMarks} marks · {' '}
                {new Date(quiz.availableFrom).toLocaleDateString()} – {new Date(quiz.availableTo).toLocaleDateString()}
              </div>
            </div>

            {/* Status badge */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: quiz.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
              color: quiz.status === 'published' ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${quiz.status === 'published' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              {quiz.status}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {quiz.status === 'draft' && (
                <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => publishQuiz(quiz._id)}>
                  Publish
                </button>
              )}
              <Link href={`/admin/grade/${quiz._id}`}>
                <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
                  Grade
                </button>
              </Link>
              <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12, color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => deleteQuiz(quiz._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}