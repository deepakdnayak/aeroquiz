import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/lib/models/Quiz';

// GET - fetch all quizzes (admin gets all, student gets published only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    let filter: any = {};

    if (session.user.role === 'student') {
      filter.status = 'published';
    }

    if (subject) {
      filter.subject = subject;
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 }).select('-questions');

    return NextResponse.json({ quizzes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - create new quiz (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      title,
      subject,
      quizType,
      availableFrom,
      availableTo,
      duration,
      questions,
      topicDescription,
      status,
    } = body;

    const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);

    const quiz = await Quiz.create({
      title,
      subject,
      quizType,
      availableFrom: new Date(availableFrom),
      availableTo: new Date(availableTo),
      duration,
      questions,
      topicDescription,
      totalMarks,
      status: status || 'draft',
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}