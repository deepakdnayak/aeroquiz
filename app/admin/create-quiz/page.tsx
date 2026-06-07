'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  type: 'mcq' | 'paragraph';
  questionText: string;
  options: string[];
  correctOptions: number[];
  referenceAnswer: string;
  marks: number;
}

const SUBJECTS = ['Science', 'Social', 'English', 'Maths'];
const QUIZ_TYPES = ['daily', 'weekly', 'special'];

export default function CreateQuizPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    subject: 'Science',
    quizType: 'daily',
    availableFrom: '',
    availableTo: '',
    duration: 30,
    topicDescription: '',
    numMCQ: 5,
    numParagraph: 2,
    marksPerMCQ: 1,
    marksPerParagraph: 5,
  });

  const [questions, setQuestions]   = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [step, setStep]             = useState<'form' | 'preview'>('form');

  function updateForm(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    if (!form.topicDescription.trim()) {
      setError('Please enter a topic description for AI generation.');
      return;
    }
    setGenerating(true);
    setError('');

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: form.subject,
        topicDescription: form.topicDescription,
        numMCQ: form.numMCQ,
        numParagraph: form.numParagraph,
        marksPerMCQ: form.marksPerMCQ,
        marksPerParagraph: form.marksPerParagraph,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error || 'Generation failed');
      return;
    }

    setQuestions(data.questions.map((q: any) => ({
      ...q,
      options:        q.options || ['', '', '', ''],
      correctOptions: q.correctOptions || [],
      referenceAnswer: q.referenceAnswer || '',
    })));
    setStep('preview');
  }

  function updateQuestion(idx: number, field: string, value: any) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = value;
      return { ...q, options: opts };
    }));
  }

  function toggleCorrect(qIdx: number, oIdx: number) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const co = q.correctOptions.includes(oIdx)
        ? q.correctOptions.filter(c => c !== oIdx)
        : [...q.correctOptions, oIdx];
      return { ...q, correctOptions: co };
    }));
  }

  function toLocalISO(localStr: string): string {
    if (!localStr) return localStr;

    // datetime-local gives "YYYY-MM-DDTHH:mm" with NO timezone info
    // We need to interpret it as the user's local time and convert to UTC ISO

    // Split the string manually — do NOT pass to new Date() directly
    // because Node.js treats no-timezone strings as UTC, browser treats as local
    // We want consistent local-time behaviour on both
    const [datePart, timePart] = localStr.split('T');
    const [year, month, day]   = datePart.split('-').map(Number);
    const [hour, minute]       = timePart.split(':').map(Number);

    // Construct date using local values — browser interprets these as local time
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Now convert to UTC ISO string
    return localDate.toISOString();
  }

  async function handlePublish(status: 'draft' | 'published') {
    if (!form.title || !form.availableFrom || !form.availableTo) {
      setError('Please fill title and time window before publishing.');
      return;
    }
    setSaving(true);
    setError('');

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        availableFrom: toLocalISO(form.availableFrom),
        availableTo:   toLocalISO(form.availableTo),
        questions,
        status,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Failed to save');
      return;
    }

    router.push('/admin');
  }

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Create Quiz</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Fill details then generate questions with AI
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: 'var(--danger)', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {step === 'form' && (
        <div className="fade-up-1 card" style={{ padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">Quiz Title</label>
              <input className="input" placeholder="e.g. Chapter 3 - Photosynthesis Quiz"
                value={form.title} onChange={e => updateForm('title', e.target.value)} />
            </div>

            <div>
              <label className="label">Subject</label>
              <select className="input" value={form.subject} onChange={e => updateForm('subject', e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Quiz Type</label>
              <select className="input" value={form.quizType} onChange={e => updateForm('quizType', e.target.value)}>
                {QUIZ_TYPES.map(t => <option key={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Available From</label>
              <input className="input" type="datetime-local"
                value={form.availableFrom} onChange={e => updateForm('availableFrom', e.target.value)} />
            </div>

            <div>
              <label className="label">Available To</label>
              <input className="input" type="datetime-local"
                value={form.availableTo} onChange={e => updateForm('availableTo', e.target.value)} />
            </div>

            <div>
              <label className="label">Duration (minutes)</label>
              <input className="input" type="number" min={5} max={180}
                value={form.duration} onChange={e => updateForm('duration', +e.target.value)} />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">Topic Description (for AI)</label>
              <textarea className="input" rows={3}
                placeholder="Describe the topics, chapters, concepts to be tested. e.g. 'Chapter 5: Cell Structure and Functions - organelles, cell membrane, nucleus'"
                value={form.topicDescription}
                onChange={e => updateForm('topicDescription', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label className="label">Number of MCQ Questions</label>
              <input className="input" type="number" min={0} max={30}
                value={form.numMCQ} onChange={e => updateForm('numMCQ', +e.target.value)} />
            </div>

            <div>
              <label className="label">Number of Paragraph Questions</label>
              <input className="input" type="number" min={0} max={20}
                value={form.numParagraph} onChange={e => updateForm('numParagraph', +e.target.value)} />
            </div>

            <div>
              <label className="label">Marks per MCQ</label>
              <input className="input" type="number" min={1} max={10}
                value={form.marksPerMCQ} onChange={e => updateForm('marksPerMCQ', +e.target.value)} />
            </div>

            <div>
              <label className="label">Marks per Paragraph</label>
              <input className="input" type="number" min={1} max={20}
                value={form.marksPerParagraph} onChange={e => updateForm('marksPerParagraph', +e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating}
              style={{ padding: '12px 28px', fontSize: 15 }}>
              {generating ? '⏳ Generating with AI...' : '✦ Generate Questions with AI'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="fade-up-1">
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Review & Edit Questions</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {questions.length} questions generated — edit anything before publishing
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={() => setStep('form')}>← Back</button>
              <button className="btn-ghost" onClick={() => handlePublish('draft')} disabled={saving}>
                Save as Draft
              </button>
              <button className="btn-primary" onClick={() => handlePublish('published')} disabled={saving}
                style={{ padding: '10px 22px' }}>
                {saving ? 'Publishing...' : '🚀 Publish Quiz'}
              </button>
            </div>
          </div>

          {/* Question cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, idx) => (
              <div key={idx} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: q.type === 'mcq' ? 'rgba(108,99,255,0.15)' : 'rgba(34,197,94,0.15)',
                    color: q.type === 'mcq' ? 'var(--accent)' : 'var(--success)',
                    border: `1px solid ${q.type === 'mcq' ? 'rgba(108,99,255,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  }}>
                    {q.type === 'mcq' ? 'MCQ' : 'Paragraph'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Q{idx + 1}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label className="label" style={{ margin: 0 }}>Marks:</label>
                    <input className="input" type="number" min={1} max={20}
                      value={q.marks}
                      onChange={e => updateQuestion(idx, 'marks', +e.target.value)}
                      style={{ width: 70 }}
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Question</label>
                  <textarea className="input" rows={2}
                    value={q.questionText}
                    onChange={e => updateQuestion(idx, 'questionText', e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* MCQ Options */}
                {q.type === 'mcq' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">Options (click checkbox = correct answer)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="checkbox"
                            checked={q.correctOptions.includes(oIdx)}
                            onChange={() => toggleCorrect(idx, oIdx)}
                            style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, minWidth: 20 }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <input className="input" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={e => updateOption(idx, oIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    {q.correctOptions.length === 0 && (
                      <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>
                        ⚠ No correct answer selected
                      </p>
                    )}
                  </div>
                )}

                {/* Reference Answer */}
                <div>
                  <label className="label">
                    {q.type === 'mcq' ? 'Explanation / Note (optional)' : 'Reference Answer (for grading)'}
                  </label>
                  <textarea className="input" rows={3}
                    value={q.referenceAnswer}
                    onChange={e => updateQuestion(idx, 'referenceAnswer', e.target.value)}
                    style={{ resize: 'vertical' }}
                    placeholder={q.type === 'mcq' ? 'Optional explanation...' : 'Model answer for reference during grading...'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-ghost" onClick={() => handlePublish('draft')} disabled={saving}>
              Save as Draft
            </button>
            <button className="btn-primary" onClick={() => handlePublish('published')} disabled={saving}
              style={{ padding: '12px 28px', fontSize: 15 }}>
              {saving ? 'Publishing...' : '🚀 Publish Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}