'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Answer {
  questionId:      string;
  type:            'mcq' | 'paragraph';
  selectedOptions?: number[];
  writtenAnswer?:  string;
  marksAwarded:    number;
  maxMarks:        number;
  isCorrect?:      boolean;
  adminComment?:   string;
}

interface QuizQuestion {
  _id:             string;
  type:            'mcq' | 'paragraph';
  questionText:    string;
  options?:        string[];
  correctOptions?: number[];
  referenceAnswer?: string;
  marks:           number;
}

interface SubmissionDetail {
  _id:              string;
  status:           string;
  isLate:           boolean;
  autoSubmitted:    boolean;
  tabSwitchCount:   number;
  submittedAt:      string;
  totalMarksAwarded: number;
  totalMaxMarks:    number;
  resultsVisible:   boolean;
  answers:          Answer[];
  quizId: {
    _id:       string;
    title:     string;
    subject:   string;
    quizType:  string;
    questions: QuizQuestion[];
  };
}

const subjectColor: Record<string, string> = {
  Science: 'subject-science',
  Social:  'subject-social',
  English: 'subject-english',
  Maths:   'subject-maths',
};

export default function ResultDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [data, setData]       = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) { setError(d.error || 'Failed to load'); setLoading(false); return; }
        setData(d.submission);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading your answers...
    </div>
  );

  if (error) return (
    <div style={{
      margin: 40, padding: 24, borderRadius: 12,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      color: 'var(--danger)', fontSize: 14,
    }}>
      {error}
    </div>
  );

  if (!data) return null;

  const quiz = data.quizId;
  const pct  = data.totalMaxMarks > 0
    ? Math.round((data.totalMarksAwarded / data.totalMaxMarks) * 100)
    : 0;

  const scoreColor = (p: number) =>
    p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)';

  const mcqCorrect  = data.answers.filter(a => a.type === 'mcq' && a.isCorrect).length;
  const mcqTotal    = data.answers.filter(a => a.type === 'mcq').length;
  const paraTotal   = data.answers.filter(a => a.type === 'paragraph').length;

  return (
    <div>
      {/* Back button */}
      <button
        className="btn-ghost"
        onClick={() => router.push('/dashboard/results')}
        style={{ marginBottom: 24, fontSize: 13 }}
      >
        ← Back to Results
      </button>

      {/* Header card */}
      <div className="card fade-up" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className={`subject-tag ${subjectColor[quiz.subject] || ''}`}>
                {quiz.subject}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                textTransform: 'capitalize',
                background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
                {quiz.quizType}
              </span>
              {data.isLate && (
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                  border: '1px solid rgba(245,158,11,0.3)',
                }}>Late Submission</span>
              )}
              {data.autoSubmitted && (
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}>Auto-Submitted</span>
              )}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {quiz.title}
            </h1>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
              <span>Submitted: {new Date(data.submittedAt).toLocaleString()}</span>
              {data.tabSwitchCount > 0 && (
                <span style={{ color: 'var(--warning)' }}>
                  ⚠ {data.tabSwitchCount} tab switch{data.tabSwitchCount !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Score circle */}
          <div style={{
            textAlign: 'center', minWidth: 110,
            background: 'var(--bg-elevated)', borderRadius: 16,
            padding: '18px 24px', border: `2px solid ${scoreColor(pct)}`,
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(pct), lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {data.totalMarksAwarded}/{data.totalMaxMarks}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>marks</div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{
            height: 8, background: 'var(--bg-elevated)',
            borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: scoreColor(pct), borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

        {/* Mini stats row */}
        <div style={{
          display: 'flex', gap: 24, marginTop: 18,
          paddingTop: 18, borderTop: '1px solid var(--border)',
        }}>
          {mcqTotal > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                MCQ Score
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>
                {mcqCorrect}/{mcqTotal} correct
              </div>
            </div>
          )}
          {paraTotal > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Paragraph Questions
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>
                {paraTotal} answered
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Questions
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {quiz.questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Questions review */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {quiz.questions.map((q, idx) => {
          const ans = data.answers.find(a => a.questionId === q._id?.toString());
          if (!ans) return null;

          return (
            <div key={q._id} className="card fade-up-1" style={{ padding: 24 }}>

              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: q.type === 'mcq' ? 'rgba(108,99,255,0.15)' : 'rgba(34,197,94,0.15)',
                  color:      q.type === 'mcq' ? 'var(--accent)'         : 'var(--success)',
                  border:     `1px solid ${q.type === 'mcq' ? 'rgba(108,99,255,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}>
                  {q.type === 'mcq' ? 'MCQ' : 'Paragraph'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Question {idx + 1}
                </span>

                {/* Marks awarded badge */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {q.type === 'mcq' ? (
                    <span style={{
                      fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                      background: ans.isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color:      ans.isCorrect ? 'var(--success)'      : 'var(--danger)',
                      border:     `1px solid ${ans.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      {ans.isCorrect ? '✅' : '❌'} {ans.marksAwarded}/{ans.maxMarks} marks
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                      background: 'rgba(108,99,255,0.1)', color: 'var(--accent)',
                      border: '1px solid rgba(108,99,255,0.3)',
                    }}>
                      {ans.marksAwarded}/{ans.maxMarks} marks
                    </span>
                  )}
                </div>
              </div>

              {/* Question text */}
              <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 20 }}>
                {q.questionText}
              </p>

              {/* MCQ options with colour coding */}
              {q.type === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {(q.options || []).map((opt, oIdx) => {
                    const selected = ans.selectedOptions?.includes(oIdx);
                    const correct  = q.correctOptions?.includes(oIdx);

                    let bg     = 'transparent';
                    let border = 'var(--border)';
                    let color  = 'var(--text-secondary)';
                    let icon   = '';
                    let label  = '';

                    if (correct && selected) {
                      bg = 'rgba(34,197,94,0.12)'; border = 'rgba(34,197,94,0.5)';
                      color = 'var(--success)'; icon = '✅'; label = 'Your answer · Correct';
                    } else if (selected && !correct) {
                      bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.5)';
                      color = 'var(--danger)'; icon = '❌'; label = 'Your answer · Wrong';
                    } else if (correct && !selected) {
                      bg = 'rgba(245,158,11,0.08)'; border = 'rgba(245,158,11,0.4)';
                      color = 'var(--warning)'; icon = '⚡'; label = 'Correct answer';
                    }

                    return (
                      <div key={oIdx} style={{
                        padding: '12px 16px', borderRadius: 10,
                        border: `1px solid ${border}`, background: bg,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          border: `2px solid ${border}`,
                          background: selected ? (correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color,
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span style={{ fontSize: 14, color, flex: 1 }}>{opt}</span>
                        {(selected || correct) && (
                          <span style={{ fontSize: 12, fontWeight: 600, color }}>
                            {icon} {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paragraph: student answer + reference answer side by side */}
              {q.type === 'paragraph' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: q.referenceAnswer ? '1fr 1fr' : '1fr',
                  gap: 16, marginBottom: 16,
                }}>
                  <div>
                    <label className="label">Your Answer</label>
                    <div style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '14px 16px', fontSize: 14,
                      lineHeight: 1.7, minHeight: 100, color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {ans.writtenAnswer?.trim()
                        ? ans.writtenAnswer
                        : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No answer written</span>
                      }
                    </div>
                  </div>

                  {q.referenceAnswer && (
                    <div>
                      <label className="label">Model Answer</label>
                      <div style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: 10, padding: '14px 16px', fontSize: 14,
                        lineHeight: 1.7, minHeight: 100, color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {q.referenceAnswer}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin comment / feedback */}
              {ans.adminComment && ans.adminComment.trim() !== '' && (
                <div style={{
                  marginTop: 12,
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.25)',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                  }}>
                    💬 Feedback from Deepak
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {ans.adminComment}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom back button */}
      <div style={{ marginTop: 28, paddingBottom: 40 }}>
        <button
          className="btn-ghost"
          onClick={() => router.push('/dashboard/results')}
          style={{ fontSize: 13 }}
        >
          ← Back to Results
        </button>
      </div>
    </div>
  );
}