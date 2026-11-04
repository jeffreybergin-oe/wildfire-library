'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { User, LogOut, LogIn } from 'lucide-react';

export default function UserNav() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return <div className="w-16 h-7 bg-paper-200/50 animate-pulse rounded-lg" />;
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
        <span className="max-w-[120px] truncate">
          {user.user_metadata?.full_name || user.email?.split('@')[0]}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        type="button"
        title="Sign Out"
        className="p-1.5 text-ink-500 hover:text-ember-600 rounded-lg hover:bg-paper-200 transition"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
