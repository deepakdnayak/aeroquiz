'use client';

import { useEffect, useState } from 'react';

interface Submission {
  _id: string;
  status: string;
  isLate: boolean;
  totalMarksAwarded: number;
  totalMaxMarks: number;
  resultsVisible: boolean;
  submittedAt: string;
  quizId: {
    title: string;
    subject: string;
    quizType: string;
  };
}

const subjectColor: Record<string, string> = {
  Science: 'subject-science',
  Social:  'subject-social',
  English: 'subject-english',
  Maths:   'subject-maths',
};

export default function ResultsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submissions/mine')
      .then(r => r.json())
      .then(d => { setSubmissions(d.submissions || []); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading results...
    </div>
  );

  const scoreColor = (p: number) =>
    p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>My Results</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          All your quiz submissions and scores
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          No submissions yet. Attempt a quiz to see results here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.map(sub => {
            const pct = sub.totalMaxMarks > 0
              ? Math.round((sub.totalMarksAwarded / sub.totalMaxMarks) * 100)
              : 0;

            return (
              <div key={sub._id} className="card fade-up-1" style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className={`subject-tag ${subjectColor[sub.quizId?.subject] || ''}`}>
                    {sub.quizId?.subject}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                      {sub.quizId?.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                      {sub.isLate && (
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 20,
                          background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                          border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                        }}>Late</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  {sub.resultsVisible ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(pct) }}>
                        {sub.totalMarksAwarded}
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
                          /{sub.totalMaxMarks}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: scoreColor(pct), fontWeight: 700 }}>
                        {pct}%
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                      background: 'var(--bg-elevated)', padding: '6px 14px',
                      borderRadius: 8, border: '1px solid var(--border)',
                    }}>
                      Awaiting grades
                    </div>
                  )}
                </div>

                {/* Score bar */}
                {sub.resultsVisible && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      height: 5, background: 'var(--bg-elevated)',
                      borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: scoreColor(pct), borderRadius: 3,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}