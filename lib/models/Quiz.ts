import mongoose, { Schema, Document, Model } from 'mongoose';

export type Subject = 'Science' | 'Social' | 'English' | 'Maths';
export type QuizType = 'daily' | 'weekly' | 'special';
export type QuizStatus = 'draft' | 'published';
export type QuestionType = 'mcq' | 'paragraph';

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctOptions?: number[];
  referenceAnswer?: string;
  marks: number;
}

export interface IQuiz extends Document {
  title: string;
  subject: Subject;
  quizType: QuizType;
  status: QuizStatus;
  availableFrom: Date;
  availableTo: Date;
  duration: number;
  questions: IQuestion[];
  totalMarks: number;
  topicDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, enum: ['mcq', 'paragraph'], required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctOptions: [{ type: Number }],
  referenceAnswer: { type: String },
  marks: { type: Number, required: true, default: 1 },
});

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    subject: { type: String, enum: ['Science', 'Social', 'English', 'Maths'], required: true },
    quizType: { type: String, enum: ['daily', 'weekly', 'special'], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    availableFrom: { type: Date, required: true },
    availableTo: { type: Date, required: true },
    duration: { type: Number, required: true },
    questions: [QuestionSchema],
    totalMarks: { type: Number, required: true, default: 0 },
    topicDescription: { type: String, required: true },
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export default Quiz;