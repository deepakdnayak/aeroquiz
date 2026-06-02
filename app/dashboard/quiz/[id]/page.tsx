'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  _id: string;
  type: 'mcq' | 'paragraph';
  questionText: string;
  options?: string[];
  marks: number;
}

interface Quiz {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  availableTo: string;
  questions: Question[];
}

type Answers = Record<string, { selectedOptions: number[]; writtenAnswer: string }>;

const WARN_LIMIT = 3;

export default function QuizPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [quiz, setQuiz]         = useState<Quiz | null>(null);
  const [loading, setLoading]   = useState(true);
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt]             = useState(new Date().toISOString());
  const [tabWarnings, setTabWarnings] = useState(0);
  const [warningMsg, setWarningMsg]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const tabSwitchCount = useRef(0);
  const timerRef       = useRef<NodeJS.Timeout | null>(null);

  // Load quiz
  useEffect(() => {
    fetch(`/api/quiz/${id}`)
      .then(async r => {
        const d = await r.json();
        console.log('Quiz fetch response:', d);
        if (!r.ok) {
          console.error('Quiz fetch failed:', r.status, d);
          setLoading(false);
          return;
        }
        if (d.quiz) {
          setQuiz(d.quiz);
          setTimeLeft(d.quiz.duration * 60);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Quiz fetch error:', err);
        setLoading(false);
      });
  }, [id]);

  // Submit handler (stable ref)
  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting || submitted || !quiz) return;
    setSubmitting(true);

    const answersArr = quiz.questions.map(q => ({
      questionId:     q._id,
      type:           q.type,
      selectedOptions: answers[q._id]?.selectedOptions || [],
      writtenAnswer:  answers[q._id]?.writtenAnswer || '',
    }));

    await fetch(`/api/quiz/${id}/submit`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        answers:         answersArr,
        startedAt,
        tabSwitchCount:  tabSwitchCount.current,
        autoSubmitted:   auto,
      }),
    });

    setSubmitted(true);
    router.push('/dashboard/results');
  }, [submitting, submitted, quiz, answers, id, startedAt, router]);

  // Timer
  useEffect(() => {
    if (!quiz || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [quiz, submitted, handleSubmit]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        tabSwitchCount.current += 1;
        setTabWarnings(tabSwitchCount.current);

        if (tabSwitchCount.current >= WARN_LIMIT) {
          setWarningMsg('⚠ You have been warned 3 times. Quiz is being auto-submitted!');
          setTimeout(() => handleSubmit(true), 2000);
        } else {
          setWarningMsg(
            `⚠ Warning ${tabSwitchCount.current}/${WARN_LIMIT}: Do not switch tabs! ` +
            `After ${WARN_LIMIT} warnings, your quiz will be auto-submitted.`
          );
          setTimeout(() => setWarningMsg(''), 5000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [submitted, handleSubmit]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function toggleMCQ(qId: string, oIdx: number) {
    setAnswers(prev => {
      const cur = prev[qId]?.selectedOptions || [];
      const next = cur.includes(oIdx) ? cur.filter(x => x !== oIdx) : [...cur, oIdx];
      return { ...prev, [qId]: { ...prev[qId], selectedOptions: next } };
    });
  }

  function setParagraph(qId: string, text: string) {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], writtenAnswer: text, selectedOptions: [] } }));
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text-muted)' }}>Loading quiz...</div>
    </div>
  );

  if (!quiz) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--danger)' }}>Quiz not found.</div>
    </div>
  );

  const q       = quiz.questions[current];
  const ans     = answers[q._id] || { selectedOptions: [], writtenAnswer: '' };
  const pctTime = (timeLeft / (quiz.duration * 60)) * 100;
  const timerColor = timeLeft < 60 ? 'var(--danger)' : timeLeft < 300 ? 'var(--warning)' : 'var(--success)';
  const answered = quiz.questions.filter(qu => {
    const a = answers[qu._id];
    return qu.type === 'mcq' ? a?.selectedOptions?.length > 0 : a?.writtenAnswer?.trim().length > 0;
  }).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Tab warning banner */}
      {warningMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          background: tabWarnings >= WARN_LIMIT ? 'var(--danger)' : 'var(--warning)',
          color: 'white', padding: '12px 24px', textAlign: 'center',
          fontWeight: 700, fontSize: 14,
        }}>
          {warningMsg}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 20,
      }}>
        {/* Quiz title */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{quiz.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {answered}/{quiz.questions.length} answered
          </div>
        </div>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-elevated)', borderRadius: 10, padding: '8px 18px',
          border: `1px solid ${timerColor}`,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Time Left</span>
          <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: timerColor }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Submit btn */}
        <button
          className="btn-primary"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          style={{ padding: '9px 22px' }}
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>

      {/* Timer bar */}
      <div style={{ height: 3, background: 'var(--bg-elevated)' }}>
        <div style={{
          height: '100%', width: `${pctTime}%`,
          background: timerColor, transition: 'width 1s linear',
        }} />
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* Question navigator sidebar */}
        <div style={{
          width: 220, borderRight: '1px solid var(--border)',
          padding: 20, background: 'var(--bg-card)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Questions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quiz.questions.map((qu, idx) => {
              const a = answers[qu._id];
              const isDone = qu.type === 'mcq'
                ? a?.selectedOptions?.length > 0
                : a?.writtenAnswer?.trim().length > 0;
              return (
                <button
                  key={qu._id}
                  onClick={() => setCurrent(idx)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    borderColor: current === idx
                      ? 'var(--accent)'
                      : isDone ? 'rgba(34,197,94,0.5)' : 'var(--border)',
                    background: current === idx
                      ? 'rgba(108,99,255,0.2)'
                      : isDone ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: current === idx
                      ? 'var(--accent)'
                      : isDone ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.5)' }} />
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
              Not answered
            </div>
          </div>
        </div>

        {/* Question area */}
        <div style={{ flex: 1, padding: '36px 48px', maxWidth: 780 }}>
          <div className="fade-up">
            {/* Q meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: q.type === 'mcq' ? 'rgba(108,99,255,0.15)' : 'rgba(34,197,94,0.15)',
                color: q.type === 'mcq' ? 'var(--accent)' : 'var(--success)',
                border: `1px solid ${q.type === 'mcq' ? 'rgba(108,99,255,0.3)' : 'rgba(34,197,94,0.3)'}`,
              }}>{q.type === 'mcq' ? 'MCQ' : 'Paragraph'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Question {current + 1} of {quiz.questions.length}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
                {q.marks} mark{q.marks !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Question text */}
            <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6, marginBottom: 28 }}>
              {q.questionText}
            </p>

            {/* MCQ options */}
            {q.type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(q.options || []).map((opt, oIdx) => {
                  const selected = ans.selectedOptions?.includes(oIdx);
                  return (
                    <button
                      key={oIdx}
                      onClick={() => toggleMCQ(q._id, oIdx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        background: selected ? 'rgba(108,99,255,0.1)' : 'var(--bg-elevated)',
                        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textAlign: 'left', transition: 'all 0.15s', width: '100%',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        background: selected ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                        transition: 'all 0.15s',
                      }}>
                        {selected ? '✓' : String.fromCharCode(65 + oIdx)}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: selected ? 600 : 400 }}>{opt}</span>
                    </button>
                  );
                })}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  * Select all that apply
                </p>
              </div>
            )}

            {/* Paragraph */}
            {q.type === 'paragraph' && (
              <textarea
                className="input"
                rows={8}
                placeholder="Write your answer here..."
                value={ans.writtenAnswer}
                onChange={e => setParagraph(q._id, e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7, fontSize: 14 }}
              />
            )}

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <button
                className="btn-ghost"
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
              >
                ← Previous
              </button>
              {current < quiz.questions.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => setCurrent(c => c + 1)}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  style={{ background: 'var(--success)' }}
                >
                  {submitting ? 'Submitting...' : '✅ Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}