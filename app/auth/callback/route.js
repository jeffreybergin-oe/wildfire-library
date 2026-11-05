import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('Supabase auth callback error:', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin));
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Successfully authenticated — redirect to add-book or home
      return NextResponse.redirect(new URL('/add-book', requestUrl.origin));
    }
    console.error('Exchange code error:', exchangeError.message);
  }

  // Fallback to home if session already exists, or login if failed
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
