import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/lib/models/Quiz';
import Submission from '@/lib/models/Submission';
import User from '@/lib/models/User';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
const quiz = await Quiz.findById(id);
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    // Check for existing submission
    const existing = await Submission.findOne({
      quizId: id,
      studentId: session.user.id,
    });
    if (existing) {
      return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
    }

    const body = await req.json();
    const { answers, startedAt, tabSwitchCount, autoSubmitted } = body;

    const now = new Date();
    const isLate = now > new Date(quiz.availableTo);

    // Auto-correct MCQ answers
    let totalMarksAwarded = 0;
    const gradedAnswers = answers.map((ans: any) => {
      const question = quiz.questions.find(
        (q) => q._id?.toString() === ans.questionId
      );

      if (!question) return ans;

      if (ans.type === 'mcq') {
        const selected: number[] = ans.selectedOptions || [];
        const correct: number[] = question.correctOptions || [];

        const isCorrect =
          selected.length === correct.length &&
          selected.every((s) => correct.includes(s));

        const marksAwarded = isCorrect ? question.marks : 0;
        totalMarksAwarded += marksAwarded;

        return {
          questionId: ans.questionId,
          type: 'mcq',
          selectedOptions: selected,
          marksAwarded,
          maxMarks: question.marks,
          isCorrect,
          adminComment: '',
        };
      }

      // Paragraph — marks given by admin later
      return {
        questionId: ans.questionId,
        type: 'paragraph',
        writtenAnswer: ans.writtenAnswer || '',
        marksAwarded: 0,
        maxMarks: question.marks,
        isCorrect: undefined,
        adminComment: '',
      };
    });

    const totalMaxMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);

    const submission = await Submission.create({
      quizId: id,
      studentId: session.user.id,
      startedAt: new Date(startedAt),
      submittedAt: now,
      isLate,
      tabSwitchCount: tabSwitchCount || 0,
      autoSubmitted: autoSubmitted || false,
      status: 'submitted',
      answers: gradedAnswers,
      totalMarksAwarded,
      totalMaxMarks,
      resultsVisible: false,
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}