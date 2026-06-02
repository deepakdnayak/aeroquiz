import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Quiz from '@/lib/models/Quiz';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // Find submission for this quiz
    const submission = await Submission.findOne({ quizId: id })
      .populate('studentId', 'username');

    if (!submission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 });
    }

    // Fetch quiz separately to guarantee questions array is present
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Merge into one response object
    const result = {
      ...submission.toObject(),
      quizId: quiz.toObject(),
      studentId: submission.studentId,
    };

    return NextResponse.json({ submission: result });
  } catch (err: any) {
    console.error('Grade GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const { submissionId, gradedAnswers } = body;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Apply grades
    submission.answers = submission.answers.map((ans) => {
      const graded = gradedAnswers.find(
        (g: any) => g.questionId === ans.questionId.toString()
      );
      if (!graded) return ans;

      if (ans.type === 'paragraph') {
        ans.marksAwarded = Number(graded.marksAwarded) || 0;
        ans.adminComment = graded.adminComment || '';
      }
      if (ans.type === 'mcq') {
        ans.adminComment = graded.adminComment || '';
      }
      return ans;
    });

    submission.totalMarksAwarded = submission.answers.reduce(
      (sum, a) => sum + (a.marksAwarded || 0), 0
    );
    submission.status = 'graded';
    submission.resultsVisible = true;

    await submission.save();

    return NextResponse.json({ submission });
  } catch (err: any) {
    console.error('Grade PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}