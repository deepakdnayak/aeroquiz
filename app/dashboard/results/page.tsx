'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  _id: string;
  status: string;
  isLate: boolean;
  autoSubmitted: boolean;
  totalMarksAwarded: number;
  totalMaxMarks: number;
  resultsVisible: boolean;
  submittedAt: string;
  tabSwitchCount: number;
  quizId: {
    title:   string;
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
  const [loading, setLoading]         = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/submissions/mine')
      .then(r => r.json())
      .then(d => {
        setSubmissions(d.submissions || []);
        setLoading(false);
      });
  }, []);

  const scoreColor = (p: number) =>
    p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading results...
    </div>
  );

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          My Results
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Click any quiz to review your answers
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
            const canReview = sub.resultsVisible;

            return (
              <div
                key={sub._id}
                className="card fade-up-1"
                onClick={() => canReview && router.push(`/dashboard/results/${sub._id}`)}
                style={{
                  padding: '20px 24px',
                  cursor: canReview ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, transform 0.15s',
                  borderColor: canReview ? 'var(--border)' : 'var(--border)',
                }}
                onMouseEnter={e => {
                  if (canReview) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Subject tag */}
                  <span className={`subject-tag ${subjectColor[sub.quizId?.subject] || ''}`}>
                    {sub.quizId?.subject}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      {sub.quizId?.title}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)',
                      display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                      {sub.isLate && (
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 20,
                          background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                          border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                        }}>Late</span>
                      )}
                      {sub.autoSubmitted && (
                        <span style={{
                          fontSize: 11, padding: '2px 7px', borderRadius: 20,
                          background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                          border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700,
                        }}>Auto-submitted</span>
                      )}
                    </div>
                  </div>

                  {/* Score or pending */}
                  {sub.resultsVisible ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor(pct) }}>
                        {sub.totalMarksAwarded}
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
                          /{sub.totalMaxMarks}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: scoreColor(pct), fontWeight: 700 }}>
                        {pct}%
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                      background: 'var(--bg-elevated)', padding: '8px 16px',
                      borderRadius: 8, border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}>
                      ⏳ Awaiting<br />
                      <span style={{ fontSize: 11 }}>grades</span>
                    </div>
                  )}

                  {/* Arrow indicator */}
                  {canReview && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</div>
                  )}
                </div>

                {/* Score bar */}
                {sub.resultsVisible && (
                  <div style={{ marginTop: 14 }}>
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