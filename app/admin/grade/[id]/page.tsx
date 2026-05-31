'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Answer {
  questionId: string;
  type: 'mcq' | 'paragraph';
  selectedOptions?: number[];
  writtenAnswer?: string;
  marksAwarded: number;
  maxMarks: number;
  isCorrect?: boolean;
  adminComment: string;
}

interface QuizQuestion {
  _id: string;
  type: 'mcq' | 'paragraph';
  questionText: string;
  options?: string[];
  correctOptions?: number[];
  referenceAnswer?: string;
  marks: number;
}

interface SubmissionData {
  _id: string;
  status: string;
  isLate: boolean;
  autoSubmitted: boolean;
  tabSwitchCount: number;
  submittedAt: string;
  totalMarksAwarded: number;
  totalMaxMarks: number;
  answers: Answer[];
  quizId: {
    _id: string;
    title: string;
    subject: string;
    questions: QuizQuestion[];
  };
  studentId: { username: string };
}

export default function GradePage() {
  const { id } = useParams();
  const router  = useRouter();

  const [data, setData]       = useState<SubmissionData | null>(null);
  const [grades, setGrades]   = useState<Record<string, { marks: number; comment: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${id}/grade`)
      .then(r => r.json())
      .then(d => {
        if (d.submission) {
          setData(d.submission);
          // pre-fill existing grades
          const init: Record<string, { marks: number; comment: string }> = {};
          d.submission.answers.forEach((a: Answer) => {
            init[a.questionId] = {
              marks:   a.marksAwarded || 0,
              comment: a.adminComment || '',
            };
          });
          setGrades(init);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function updateGrade(qId: string, field: 'marks' | 'comment', value: any) {
    setGrades(prev => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value },
    }));
  }

  async function handleSubmitGrades() {
    if (!data) return;
    setSaving(true);
    setError('');

    const gradedAnswers = data.answers.map(a => ({
      questionId:   a.questionId,
      type:         a.type,
      marksAwarded: grades[a.questionId]?.marks ?? a.marksAwarded,
      adminComment: grades[a.questionId]?.comment ?? '',
    }));

    const res = await fetch(`/api/quiz/${id}/grade`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ submissionId: data._id, gradedAnswers }),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to save grades');
      return;
    }

    setSaved(true);
    setTimeout(() => router.push('/admin'), 1200);
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      Loading submission...
    </div>
  );

  if (!data) return (
    <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', margin: 20 }}>
      No submission found for this quiz yet.
    </div>
  );

  const quiz = data.quizId;
  const totalAwarded = Object.values(grades).reduce((s, g) => s + (g.marks || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Grade: {quiz.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Student: <strong style={{ color: 'var(--text-primary)' }}>{data.studentId?.username}</strong>
              &nbsp;·&nbsp;Submitted: {new Date(data.submittedAt).toLocaleString()}
              {data.isLate && (
                <span style={{
                  marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(245,158,11,0.1)', color: 'var(--warning)',
                  border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700,
                }}>LATE</span>
              )}
              {data.autoSubmitted && (
                <span style={{
                  marginLeft: 6, fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700,
                }}>AUTO-SUBMITTED</span>
              )}
            </p>
            {data.tabSwitchCount > 0 && (
              <p style={{ color: 'var(--warning)', fontSize: 12, marginTop: 4 }}>
                ⚠ Tab switched {data.tabSwitchCount} time{data.tabSwitchCount !== 1 ? 's' : ''} during quiz
              </p>
            )}
          </div>
          {/* Running total */}
          <div className="card" style={{ padding: '14px 22px', textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
              {totalAwarded}
              <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>
                /{data.totalMaxMarks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: 'var(--danger)', fontSize: 13,
        }}>{error}</div>
      )}

      {saved && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: 'var(--success)', fontSize: 13, fontWeight: 600,
        }}>✅ Grades submitted! Redirecting...</div>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {quiz.questions.map((q, idx) => {
          const ans = data.answers.find(a => a.questionId === q._id?.toString());
          if (!ans) return null;
          const g = grades[ans.questionId] || { marks: 0, comment: '' };

          return (
            <div key={q._id} className="card fade-up-1" style={{ padding: 24 }}>
              {/* Q header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: q.type === 'mcq' ? 'rgba(108,99,255,0.15)' : 'rgba(34,197,94,0.15)',
                  color:      q.type === 'mcq' ? 'var(--accent)'         : 'var(--success)',
                  border:     `1px solid ${q.type === 'mcq' ? 'rgba(108,99,255,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}>{q.type === 'mcq' ? 'MCQ' : 'Paragraph'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Q{idx + 1}</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
                  Max: <strong style={{ color: 'var(--text-primary)' }}>{q.marks}</strong>
                </span>
              </div>

              {/* Question text */}
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, lineHeight: 1.5 }}>
                {q.questionText}
              </p>

              {/* MCQ Answer */}
              {q.type === 'mcq' && (
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Student's Answer</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(q.options || []).map((opt, oIdx) => {
                      const selected = ans.selectedOptions?.includes(oIdx);
                      const correct  = q.correctOptions?.includes(oIdx);
                      let bg = 'transparent';
                      let border = 'var(--border)';
                      let color  = 'var(--text-secondary)';
                      if (selected && correct)  { bg = 'rgba(34,197,94,0.1)';  border = 'rgba(34,197,94,0.4)';  color = 'var(--success)'; }
                      if (selected && !correct) { bg = 'rgba(239,68,68,0.1)';  border = 'rgba(239,68,68,0.4)';  color = 'var(--danger)'; }
                      if (!selected && correct) { bg = 'rgba(245,158,11,0.08)'; border = 'rgba(245,158,11,0.3)'; color = 'var(--warning)'; }
                      return (
                        <div key={oIdx} style={{
                          padding: '8px 14px', borderRadius: 8,
                          border: `1px solid ${border}`, background: bg,
                          fontSize: 13, color, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{ fontWeight: 700, minWidth: 20 }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                          {selected && correct  && <span style={{ marginLeft: 'auto' }}>✅ Selected · Correct</span>}
                          {selected && !correct && <span style={{ marginLeft: 'auto' }}>❌ Selected · Wrong</span>}
                          {!selected && correct && <span style={{ marginLeft: 'auto' }}>⚠ Correct answer (not selected)</span>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Auto result */}
                  <div style={{
                    marginTop: 12, padding: '8px 14px', borderRadius: 8,
                    background: ans.isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${ans.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    fontSize: 13, fontWeight: 600,
                    color: ans.isCorrect ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {ans.isCorrect ? `✅ Correct — ${q.marks}/${q.marks} marks awarded` : `❌ Incorrect — 0/${q.marks} marks`}
                  </div>
                </div>
              )}

              {/* Paragraph Answer */}
              {q.type === 'paragraph' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label">Student's Answer</label>
                    <div style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '12px 14px', fontSize: 13,
                      lineHeight: 1.7, minHeight: 100, color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {ans.writtenAnswer || <span style={{ color: 'var(--text-muted)' }}>No answer written</span>}
                    </div>
                  </div>
                  <div>
                    <label className="label">Reference Answer</label>
                    <div style={{
                      background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.2)',
                      borderRadius: 10, padding: '12px 14px', fontSize: 13,
                      lineHeight: 1.7, minHeight: 100, color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {q.referenceAnswer || <span style={{ color: 'var(--text-muted)' }}>No reference answer</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Marks + Comment (paragraph grading) */}
              {q.type === 'paragraph' && (
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 14 }}>
                  <div>
                    <label className="label">Marks Awarded</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={q.marks}
                      value={g.marks}
                      onChange={e => updateGrade(ans.questionId, 'marks', Math.min(+e.target.value, q.marks))}
                      style={{ fontWeight: 700, fontSize: 16, textAlign: 'center' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                      out of {q.marks}
                    </div>
                  </div>
                  <div>
                    <label className="label">Comment / Feedback</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Optional feedback for Shashank..."
                      value={g.comment}
                      onChange={e => updateGrade(ans.questionId, 'comment', e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* MCQ comment box */}
              {q.type === 'mcq' && (
                <div style={{ marginTop: 12 }}>
                  <label className="label">Comment / Feedback (optional)</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Optional comment..."
                    value={g.comment}
                    onChange={e => updateGrade(ans.questionId, 'comment', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit bar */}
      <div style={{
        position: 'sticky', bottom: 24, marginTop: 24,
        display: 'flex', justifyContent: 'flex-end', gap: 12,
      }}>
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '16px 24px', borderColor: 'var(--accent)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Running Total:&nbsp;
            <strong style={{ color: 'var(--accent)', fontSize: 18 }}>{totalAwarded}</strong>
            <span style={{ color: 'var(--text-muted)' }}>/{data.totalMaxMarks}</span>
          </span>
          <button
            className="btn-primary"
            onClick={handleSubmitGrades}
            disabled={saving || saved}
            style={{ padding: '11px 28px', fontSize: 15 }}
          >
            {saving ? 'Submitting...' : '✅ Submit Grades'}
          </button>
        </div>
      </div>
    </div>
  );
}