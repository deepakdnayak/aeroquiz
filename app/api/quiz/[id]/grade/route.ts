import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { submissionId, gradedAnswers } = body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    // Merge admin grades for paragraph answers
    submission.answers = submission.answers.map((ans) => {
      const graded = gradedAnswers.find(
        (g: any) => g.questionId === ans.questionId.toString()
      );
      if (graded && ans.type === 'paragraph') {
        ans.marksAwarded = graded.marksAwarded;
        ans.adminComment = graded.adminComment;
      }
      if (graded && ans.type === 'mcq') {
        ans.adminComment = graded.adminComment || '';
      }
      return ans;
    });

    submission.totalMarksAwarded = submission.answers.reduce(
      (sum, a) => sum + (a.marksAwarded || 0),
      0
    );
    submission.status = 'graded';
    submission.resultsVisible = true;

    await submission.save();

    return NextResponse.json({ submission });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET submission for a quiz (admin sees all answers + reference)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const submission = await Submission.findOne({ quizId: params.id })
      .populate('quizId')
      .populate('studentId', 'username');

    if (!submission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}