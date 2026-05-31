import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/lib/models/Quiz';

// GET single quiz
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const quiz = await Quiz.findById(params.id);

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    // Students should not see correctOptions or referenceAnswer
    if (session.user.role === 'student') {
      const sanitized = {
        ...quiz.toObject(),
        questions: quiz.questions.map((q) => ({
          _id: q._id,
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
          // correctOptions and referenceAnswer intentionally omitted
        })),
      };
      return NextResponse.json({ quiz: sanitized });
    }

    return NextResponse.json({ quiz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - update quiz (admin only) — used to publish or edit
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    if (body.questions) {
      body.totalMarks = body.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);
    }

    const quiz = await Quiz.findByIdAndUpdate(params.id, body, { new: true });
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    return NextResponse.json({ quiz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - delete quiz (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Quiz.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Quiz deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}