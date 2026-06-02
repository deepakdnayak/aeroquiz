import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/lib/models/Quiz';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const quiz = await Quiz.findById(id);

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    if (session.user.role === 'student') {
      const sanitized = {
        ...quiz.toObject(),
        questions: quiz.questions.map((q) => ({
          _id:          q._id,
          type:         q.type,
          questionText: q.questionText,
          options:      q.options,
          marks:        q.marks,
        })),
      };
      return NextResponse.json({ quiz: sanitized });
    }

    return NextResponse.json({ quiz });
  } catch (err: any) {
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

    if (body.questions) {
      body.totalMarks = body.questions.reduce(
        (sum: number, q: any) => sum + (q.marks || 0), 0
      );
    }

    const quiz = await Quiz.findByIdAndUpdate(id, body, { new: true });
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    return NextResponse.json({ quiz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
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
    await Quiz.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Quiz deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}