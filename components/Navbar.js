'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Flame, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // 2. Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-stone-900">
          <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </span>
          Wildfire Library
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/catalog" className="hover:text-stone-900 transition">Catalog</Link>
          <Link href="/add-book" className="hover:text-stone-900 transition">Register Book</Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-full transition text-xs font-semibold"
              >
                {profile?.avatar_url ? (
                  <span className="text-base">{profile.avatar_url}</span>
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{profile?.display_name || user.email?.split('@')[0]}</span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="text-stone-400 hover:text-stone-700 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-stone-900 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
