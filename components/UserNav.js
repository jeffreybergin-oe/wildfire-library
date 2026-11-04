'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { User, LogOut, LogIn } from 'lucide-react';

export default function UserNav() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial user session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return <div className="w-16 h-7 bg-paper-200 animate-pulse rounded-lg" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-xs font-medium text-ink-700 hover:text-ember-600 px-3 py-1.5 rounded-lg border border-paper-300 hover:border-ember-500 transition"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-paper-200/60 px-2.5 py-1 rounded-lg text-xs font-medium text-ink-800">
        <User className="w-3.5 h-3.5 text-ember-600" />
        <span className="max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
      </div>
      <button
        onClick={handleSignOut}
        title="Sign Out"
        className="p-1.5 text-ink-500 hover:text-ember-600 rounded-lg hover:bg-paper-200 transition"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
