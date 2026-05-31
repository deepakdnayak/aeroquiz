import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  type: 'mcq' | 'paragraph';
  selectedOptions?: number[];
  writtenAnswer?: string;
  marksAwarded: number;
  maxMarks: number;
  adminComment?: string;
  isCorrect?: boolean;
}

export interface ISubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt: Date;
  isLate: boolean;
  tabSwitchCount: number;
  autoSubmitted: boolean;
  status: 'submitted' | 'graded';
  answers: IAnswer[];
  totalMarksAwarded: number;
  totalMaxMarks: number;
  resultsVisible: boolean;
  createdAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['mcq', 'paragraph'], required: true },
  selectedOptions: [{ type: Number }],
  writtenAnswer: { type: String },
  marksAwarded: { type: Number, default: 0 },
  maxMarks: { type: Number, required: true },
  adminComment: { type: String, default: '' },
  isCorrect: { type: Boolean },
});

const SubmissionSchema = new Schema<ISubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    isLate: { type: Boolean, default: false },
    tabSwitchCount: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    answers: [AnswerSchema],
    totalMarksAwarded: { type: Number, default: 0 },
    totalMaxMarks: { type: Number, default: 0 },
    resultsVisible: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;