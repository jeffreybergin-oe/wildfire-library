import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const { book_id, book_title, status_event, location, reader_name, reader_email } =
      await request.json();

    if (!book_id || !book_title) {
      return NextResponse.json({ error: 'Missing book details.' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }

    // 1. Fetch all followers for this book
    const { data: followers, error } = await supabase
      .from('book_followers')
      .select('email')
      .eq('book_id', book_id);

    if (error || !followers || followers.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // 2. Exclude the reader who just logged this stop
    const recipientEmails = followers
      .map((f) => f.email.toLowerCase())
      .filter((email) => email !== reader_email?.toLowerCase());

    if (recipientEmails.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const locationText = location ? ` in ${location}` : '';
    const bookUrl = `https://www.wildfirelibrary.com/book/${book_id}`;

    // 3. Send via Resend (using BCC so followers don't see each other's emails)
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wildfire Library <hello@wildfirelibrary.com>',
        to: ['hello@wildfirelibrary.com'],
        bcc: recipientEmails,
        subject: `"${book_title}" just moved!`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #292524; line-height: 1.6;">
            <p>Quick update from the road:</p>
            <p><strong>${reader_name || 'A reader'}</strong> just logged a new stop for <strong>${book_title}</strong> (${book_id}):</p>
            <p style="background: #fafaf9; border-left: 3px solid #d97706; padding: 10px 14px; color: #44403c;">
              <strong>${status_event}</strong>${locationText}
            </p>
            <p>
              <a href="${bookUrl}" style="color: #d97706; font-weight: bold; text-decoration: none;">
                View the full journey &rarr;
              </a>
            </p>
            <p style="font-size: 12px; color: #78716c; margin-top: 24px;">
              — Wildfire Library
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json();
      console.error('Resend error:', errData);
      return NextResponse.json({ error: 'Failed to send alerts.' }, { status: 500 });
    }

    return NextResponse.json({ sent: recipientEmails.length });
  } catch (err) {
    console.error('Notify followers error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
