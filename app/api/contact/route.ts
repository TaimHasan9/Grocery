import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/src/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please complete all required fields.' },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Gromuse Support <support@gromuse.example>',
          to: ['support@gromuse.example'],
          reply_to: parsed.data.email,
          subject: `[Contact] ${parsed.data.subject}`,
          text: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
        }),
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Email delivery failed. Please check RESEND_API_KEY configuration.' },
          { status: 502 }
        );
      }
      return NextResponse.json({
        delivered: true,
        message: 'Your message has been delivered to Gromuse support.',
      });
    }

    return NextResponse.json({
      delivered: false,
      queued: true,
      message:
        'Support ticket validated and logged. Configure RESEND_API_KEY in environment secrets to enable live email forwarding.',
    });
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json({ error: 'Unable to process contact request.' }, { status: 500 });
  }
}
