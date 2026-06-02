import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Quiz from '@/lib/models/Quiz';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const submission = await Submission.findById(id)
      .populate('studentId', 'username');

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Students can only view their own submissions
    if (
      session.user.role === 'student' &&
      submission.studentId._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch quiz separately to get full questions
    const quiz = await Quiz.findById(submission.quizId);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // For students — strip correctOptions and referenceAnswer
    // only if results are NOT visible yet
    let quizData;
    if (session.user.role === 'student' && !submission.resultsVisible) {
      quizData = {
        ...quiz.toObject(),
        questions: quiz.questions.map(q => ({
          _id:          q._id,
          type:         q.type,
          questionText: q.questionText,
          options:      q.options,
          marks:        q.marks,
          // hide answers until graded
        })),
      };
    } else {
      // Results visible or admin — show everything
      quizData = quiz.toObject();
    }

    return NextResponse.json({
      submission: {
        ...submission.toObject(),
        quizId: quizData,
      },
    });
  } catch (err: any) {
    console.error('Submission detail error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}