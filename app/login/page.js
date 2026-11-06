'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Mail, Loader2, CheckCircle2, Flame, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Failed to send login link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Catalog</span>
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600 fill-amber-600" />
            <h1 className="font-serif font-bold text-xl text-stone-900">Sign in to Wildfire</h1>
          </div>
          <p className="text-xs text-stone-500">
            Enter your email to receive a passwordless magic login link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Magic link sent! Check your inbox to sign in.</span>
            </div>
            <p className="text-[11px] text-stone-400">
              Sent to <span className="font-medium text-stone-600">{email}</span>. Click the link in that email to be logged in automatically.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="text-xs text-amber-700 hover:underline pt-2 block"
            >
              Sign in with a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            {errorMsg && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-medium text-stone-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 placeholder:text-stone-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending link...</span>
                </>
              ) : (
                <span>Send Magic Link</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
