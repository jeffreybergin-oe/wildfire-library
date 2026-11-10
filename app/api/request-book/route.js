import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { book_id, book_title, requester_name, requester_email, message } =
      await request.json();

    if (!book_id || !requester_name || !requester_email || !message) {
      return NextResponse.json(
        { error: 'Please fill out all fields.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    // 1. Find the most recent reader's email from journey_stops
    let holderEmail = null;
    let holderName = 'Reader';

    const { data: latestStop } = await supabase
      .from('journey_stops')
      .select('reader_email, reader_name')
      .eq('book_id', book_id)
      .not('reader_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestStop?.reader_email) {
      holderEmail = latestStop.reader_email;
      holderName = latestStop.reader_name || 'Reader';
    } else {
      // 2. Fall back to the book's original curator if no stops have an email
      const { data: bookData } = await supabase
        .from('books')
        .select('curator_email, curator_name')
        .or(`id.eq.${book_id},book_id.eq.${book_id}`)
        .maybeSingle();

      if (bookData?.curator_email) {
        holderEmail = bookData.curator_email;
        holderName = bookData.curator_name || 'Reader';
      }
    }

    if (!holderEmail) {
      return NextResponse.json(
        { error: 'No contact email is on file for the current holder of this book.' },
        { status: 404 }
      );
    }

    // 3. Send the email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wildfire Library <hello@wildfirelibrary.com>',
        to: [holderEmail],
        reply_to: requester_email,
        subject: `Someone wants to read "${book_title}" next!`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #292524; line-height: 1.6;">
            <p>Hi ${holderName},</p>
            <p><strong>${requester_name}</strong> saw <strong>${book_title}</strong> (${book_id}) in the Wildfire Library catalog and would love to read it next.</p>
            <blockquote style="background: #fafaf9; border-left: 3px solid #d97706; padding: 12px 16px; margin: 16px 0; color: #44403c;">
              "${message.replace(/\n/g, '<br/>')}"
            </blockquote>
            <p>If you're finished with the book and ready to pass it along, just <strong>hit Reply</strong> to email ${requester_name} directly and coordinate a handoff.</p>
            <p style="font-size: 12px; color: #78716c; margin-top: 24px;">
              — Wildfire Library
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      console.error('Resend API error:', errData);
      return NextResponse.json(
        { error: 'Failed to send email notification.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Request book route error:', err);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
