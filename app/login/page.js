'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Flame, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://wildfire-library.vercel.app/auth/callback';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-4">
          <Flame className="w-5 h-5" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
          Sign in to Wildfire
        </h1>
        <p className="text-sm text-stone-600 mb-6">
          Enter your email to receive a passwordless magic link to access your curator account.
        </p>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Check your inbox!</p>
              <p className="text-emerald-700 mt-1">
                We sent a magic sign-in link to <span className="font-medium text-emerald-900">{email}</span>. Click the link in that email to sign in.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
