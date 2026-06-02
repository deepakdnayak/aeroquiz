import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export interface GenerateQuizParams {
  subject: string;
  topicDescription: string;
  numMCQ: number;
  numParagraph: number;
  marksPerMCQ: number;
  marksPerParagraph: number;
}

export interface GeneratedQuestion {
  type: 'mcq' | 'paragraph';
  questionText: string;
  options?: string[];
  correctOptions?: number[];
  referenceAnswer?: string;
  marks: number;
}

export async function generateQuizWithAI(
  params: GenerateQuizParams
): Promise<GeneratedQuestion[]> {
  const prompt = `
You are an expert quiz creator for school students.

Generate a quiz with the following specifications:
- Subject: ${params.subject}
- Topic: ${params.topicDescription}
- Number of MCQ questions: ${params.numMCQ}
- Number of Paragraph/Subjective questions: ${params.numParagraph}
- Marks per MCQ: ${params.marksPerMCQ}
- Marks per Paragraph question: ${params.marksPerParagraph}

Rules:
1. MCQ questions must have exactly 4 options.
2. Some MCQ questions can have multiple correct answers (mark correctOptions as array of 0-based indices). Most should have one correct answer.
3. Paragraph questions must have a detailed reference answer that a teacher can use for grading.
4. Questions must be appropriate for a school student.
5. Make questions based strictly on the topic provided.
6. Return ONLY a raw JSON array. No explanation, no markdown, no code fences. Just the JSON array starting with [ and ending with ].

Format each question exactly like this:
[
  {
    "type": "mcq",
    "questionText": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptions": [0],
    "referenceAnswer": "",
    "marks": ${params.marksPerMCQ}
  },
  {
    "type": "paragraph",
    "questionText": "Question here?",
    "options": [],
    "correctOptions": [],
    "referenceAnswer": "Detailed model answer here that covers all key points.",
    "marks": ${params.marksPerParagraph}
  }
]

Generate exactly ${params.numMCQ} MCQ questions followed by exactly ${params.numParagraph} paragraph questions. Total questions: ${params.numMCQ + params.numParagraph}.
`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a quiz generator. You always respond with valid raw JSON arrays only. Never use markdown code blocks. Never add explanations before or after the JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const text = response.choices[0]?.message?.content?.trim() || '';

  // Strip any accidental markdown fences
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  // Find the JSON array in the response robustly
  const start = cleaned.indexOf('[');
  const end   = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1) {
    throw new Error('AI did not return a valid JSON array. Please try again.');
  }

  const jsonStr = cleaned.slice(start, end + 1);
  const parsed: GeneratedQuestion[] = JSON.parse(jsonStr);

  // Validate structure
  if (!Array.isArray(parsed)) {
    throw new Error('AI response was not an array.');
  }

  return parsed.map(q => ({
    type:            q.type,
    questionText:    q.questionText,
    options:         q.options || [],
    correctOptions:  q.correctOptions || [],
    referenceAnswer: q.referenceAnswer || '',
    marks:           q.marks,
  }));
}