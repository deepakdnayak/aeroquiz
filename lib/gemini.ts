import { GoogleGenerativeAI } from '@google/generative-ai';

console.log(
  "Gemini key loaded:",
  !!process.env.GEMINI_API_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

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

export async function generateQuizWithGemini(
  params: GenerateQuizParams
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
2. Some MCQ questions can have multiple correct answers (mark correctOptions as array of 0-based indices).
3. Paragraph questions must have a detailed reference answer that a teacher can use for grading.
4. Questions must be appropriate for a school student.
5. Make questions based strictly on the topic provided.

Respond ONLY with a valid JSON array. No explanation, no markdown, no code blocks. Just raw JSON.

Format:
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
    "referenceAnswer": "Detailed model answer here.",
    "marks": ${params.marksPerParagraph}
  }
]

Generate exactly ${params.numMCQ} MCQ and ${params.numParagraph} paragraph questions.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if Gemini wraps them
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const parsed: GeneratedQuestion[] = JSON.parse(cleaned);
  return parsed;
}