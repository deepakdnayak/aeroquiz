import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Quiz from '@/lib/models/Quiz';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = session.user.role === 'student' ? session.user.id : searchParams.get('studentId');

    const submissions = await Submission.find({
      studentId,
      status: 'graded',
    }).populate('quizId', 'title subject quizType totalMarks availableFrom');

    const totalAttempted = submissions.length;

    const totalMarksAwarded = submissions.reduce((s, sub) => s + sub.totalMarksAwarded, 0);
    const totalMaxMarks = submissions.reduce((s, sub) => s + sub.totalMaxMarks, 0);
    const averagePercentage = totalMaxMarks > 0
      ? Math.round((totalMarksAwarded / totalMaxMarks) * 100)
      : 0;

    // Per subject stats
    const subjectMap: Record<string, { total: number; max: number; count: number }> = {};
    for (const sub of submissions) {
      const quiz = sub.quizId as any;
      const subj = quiz?.subject || 'Unknown';
      if (!subjectMap[subj]) subjectMap[subj] = { total: 0, max: 0, count: 0 };
      subjectMap[subj].total += sub.totalMarksAwarded;
      subjectMap[subj].max += sub.totalMaxMarks;
      subjectMap[subj].count += 1;
    }

    const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      averagePercentage: data.max > 0 ? Math.round((data.total / data.max) * 100) : 0,
      count: data.count,
    }));

    // Monthly trend - last 6 months
    const monthlyMap: Record<string, { total: number; max: number }> = {};
    for (const sub of submissions) {
      const quiz = sub.quizId as any;
      const date = new Date(quiz?.availableFrom || sub.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, max: 0 };
      monthlyMap[key].total += sub.totalMarksAwarded;
      monthlyMap[key].max += sub.totalMaxMarks;
    }

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        percentage: data.max > 0 ? Math.round((data.total / data.max) * 100) : 0,
      }));

    // Late submissions count
    const lateCount = submissions.filter((s) => s.isLate).length;
    const autoSubmittedCount = submissions.filter((s) => s.autoSubmitted).length;

    return NextResponse.json({
      totalAttempted,
      averagePercentage,
      subjectStats,
      monthlyTrend,
      lateCount,
      autoSubmittedCount,
      recentSubmissions: submissions.slice(-5).reverse().map((s) => ({
        quizTitle: (s.quizId as any)?.title,
        subject: (s.quizId as any)?.subject,
        score: `${s.totalMarksAwarded}/${s.totalMaxMarks}`,
        percentage: s.totalMaxMarks > 0
          ? Math.round((s.totalMarksAwarded / s.totalMaxMarks) * 100)
          : 0,
        isLate: s.isLate,
        submittedAt: s.submittedAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}