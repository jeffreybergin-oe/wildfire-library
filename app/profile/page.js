'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { User, MapPin, BookOpen, Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const AVATARS = ['🔥', '📖', '🌲', '🦉', '☕', '⚡', '🎒', '🌟', '🦊', '🚀'];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [homeBase, setHomeBase] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [avatar, setAvatar] = useState('🔥');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn('No active session found, redirecting to /login');
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, home_base, favorite_genre, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile from Supabase:', error);
        }

        if (data) {
          setDisplayName(data.display_name || '');
          setHomeBase(data.home_base || '');
          setFavoriteGenre(data.favorite_genre || '');
          setAvatar(data.avatar_url || '🔥');
        } else {
          setDisplayName(user.email ? user.email.split('@')[0] : '');
        }
      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage('Session expired. Please sign in again.');
        setSaving(false);
        return;
      }

      const payload = {
        id: user.id,
        email: user.email,
        display_name: (displayName || '').trim(),
        home_base: (homeBase || '').trim(),
        favorite_genre: (favoriteGenre || '').trim(),
        avatar_url: avatar,
        updated_at: new Date().toISOString(),
      };

      console.log('Sending profile payload to Supabase:', payload);

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) {
        console.error('Supabase upsert failed:', upsertError);
        setErrorMessage(upsertError.message || 'Database error while saving profile.');
        setSaving(false);
        return;
      }

      setSaved(true);
      setSaving(false);

      // Redirect to /add-book after 1 second so the navbar updates
      setTimeout(() => {
        window.location.href = '/add-book';
      }, 1000);
    } catch (err) {
      console.error('Unexpected save error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-xs font-medium">Loading curator profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-2xl flex items-center justify-center shrink-0 shadow-sm">
            {avatar}
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-stone-900">Curator Profile</h1>
            <p className="text-xs text-stone-500">Customize how your book releases are credited.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">Select Avatar</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center transition border ${
                    avatar === emoji
                      ? 'border-amber-600 bg-amber-50 shadow-sm scale-105'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-semibold text-stone-700 mb-1">
              Curator Name / Handle
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex S."
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="homeBase" className="block text-xs font-semibold text-stone-700 mb-1">
              Home Base (City or Neighborhood)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="homeBase"
                type="text"
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value)}
                placeholder="e.g. Syracuse, NY"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="favoriteGenre" className="block text-xs font-semibold text-stone-700 mb-1">
              Favorite Genre
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="favoriteGenre"
                type="text"
                value={favoriteGenre}
                onChange={(e) => setFavoriteGenre(e.target.value)}
                placeholder="e.g. Literary Fiction, Memoirs, Thrillers"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving Profile...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Saved! Redirecting to Register Book...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
