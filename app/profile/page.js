'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, MapPin, BookOpen, Check } from 'lucide-react';

const AVATARS = ['🔥', '📖', '🌲', '🦉', '☕', '⚡', '🎒', '🌟'];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [homeBase, setHomeBase] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [avatar, setAvatar] = useState('🔥');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || '');
        setHomeBase(data.home_base || '');
        setFavoriteGenre(data.favorite_genre || '');
        setAvatar(data.avatar_url || '🔥');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      display_name: displayName,
      home_base: homeBase,
      favorite_genre: favoriteGenre,
      avatar_url: avatar,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm text-stone-500">Loading profile...</div>;

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Curator Profile</h1>
        <p className="text-xs text-stone-500 mb-6">Customize how you appear when you release and track books.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">Choose Avatar</label>
            <div className="flex gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition ${
                    avatar === emoji ? 'border-amber-600 bg-amber-50 scale-105' : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex S."
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Home Base (Neighborhood / City)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value)}
                placeholder="e.g. Onondaga Hill, Syracuse"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Favorite Genre</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={favoriteGenre}
                onChange={(e) => setFavoriteGenre(e.target.value)}
                placeholder="e.g. Literary Fiction, Memoirs, Thrillers"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-2.5 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Saved!
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              'Save Profile'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
