import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateQuizWithAI } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, topicDescription, numMCQ, numParagraph, marksPerMCQ, marksPerParagraph } = body;

    if (!subject || !topicDescription) {
      return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 });
    }

    if ((numMCQ + numParagraph) === 0) {
      return NextResponse.json({ error: 'Total questions must be at least 1' }, { status: 400 });
    }

    const questions = await generateQuizWithAI({
      subject,
      topicDescription,
      numMCQ:            numMCQ || 0,
      numParagraph:      numParagraph || 0,
      marksPerMCQ:       marksPerMCQ || 1,
      marksPerParagraph: marksPerParagraph || 5,
    });

    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error('AI generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }
}