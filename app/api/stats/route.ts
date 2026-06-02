import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    let studentObjectId: mongoose.Types.ObjectId;

    if (session.user.role === 'admin') {
      // Admin: find the student user and use their _id
      const studentUser = await User.findOne({ role: 'student' });
      if (!studentUser) {
        return NextResponse.json({
          totalAttempted:    0,
          averagePercentage: 0,
          subjectStats:      [],
          monthlyTrend:      [],
          lateCount:         0,
          autoSubmittedCount: 0,
          recentSubmissions: [],
          pendingGrading:    0,
        });
      }
      studentObjectId = studentUser._id as mongoose.Types.ObjectId;
    } else {
      // Student: use their own session ID converted to ObjectId
      studentObjectId = new mongoose.Types.ObjectId(session.user.id);
    }

    // Fetch ALL submissions (both submitted and graded) for correct counts
    const allSubmissions = await Submission.find({
      studentId: studentObjectId,
    }).populate('quizId', 'title subject quizType totalMarks availableFrom availableTo');

    const totalAttempted = allSubmissions.length;
    const pendingGrading = allSubmissions.filter(s => s.status === 'submitted').length;

    // For score-based stats, use all submissions that have marks
    // (graded ones have full marks; submitted ones have MCQ marks already)
    const scoredSubmissions = allSubmissions.filter(s => s.totalMaxMarks > 0);

    const totalMarksAwarded = scoredSubmissions.reduce(
      (sum, sub) => sum + sub.totalMarksAwarded, 0
    );
    const totalMaxMarks = scoredSubmissions.reduce(
      (sum, sub) => sum + sub.totalMaxMarks, 0
    );
    const averagePercentage = totalMaxMarks > 0
      ? Math.round((totalMarksAwarded / totalMaxMarks) * 100)
      : 0;

    // Per subject stats — use all submissions
    const subjectMap: Record<string, { total: number; max: number; count: number }> = {};

    for (const sub of allSubmissions) {
      const quiz = sub.quizId as any;
      const subj = quiz?.subject;
      if (!subj) continue;
      if (!subjectMap[subj]) subjectMap[subj] = { total: 0, max: 0, count: 0 };
      subjectMap[subj].total += sub.totalMarksAwarded;
      subjectMap[subj].max   += sub.totalMaxMarks;
      subjectMap[subj].count += 1;
    }

    const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      averagePercentage: data.max > 0
        ? Math.round((data.total / data.max) * 100)
        : 0,
      count: data.count,
    }));

    // Monthly trend — use submittedAt date (always present)
    const monthlyMap: Record<string, { total: number; max: number }> = {};

    for (const sub of allSubmissions) {
      const date = sub.submittedAt
        ? new Date(sub.submittedAt)
        : new Date((sub as any).createdAt);

      if (isNaN(date.getTime())) continue;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, max: 0 };
      monthlyMap[key].total += sub.totalMarksAwarded;
      monthlyMap[key].max   += sub.totalMaxMarks;
    }

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        percentage: data.max > 0
          ? Math.round((data.total / data.max) * 100)
          : 0,
      }));

    const lateCount          = allSubmissions.filter(s => s.isLate).length;
    const autoSubmittedCount = allSubmissions.filter(s => s.autoSubmitted).length;

    // Recent submissions — last 5, most recent first
    const recentSubmissions = [...allSubmissions]
      .sort((a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 5)
      .map(s => {
        const quiz = s.quizId as any;
        const pct  = s.totalMaxMarks > 0
          ? Math.round((s.totalMarksAwarded / s.totalMaxMarks) * 100)
          : 0;
        return {
          quizTitle:   quiz?.title   || 'Unknown Quiz',
          subject:     quiz?.subject || 'Unknown',
          score:       `${s.totalMarksAwarded}/${s.totalMaxMarks}`,
          percentage:  pct,
          isLate:      s.isLate,
          status:      s.status,
          submittedAt: s.submittedAt,
        };
      });

    return NextResponse.json({
      totalAttempted,
      averagePercentage,
      subjectStats,
      monthlyTrend,
      lateCount,
      autoSubmittedCount,
      recentSubmissions,
      pendingGrading,
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}