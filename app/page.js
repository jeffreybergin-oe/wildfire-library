'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, 
  MapPin, 
  BookMarked, 
  Printer, 
  Loader2, 
  Flame, 
  UserCheck,
  Pencil,
  Check,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [releasedBooks, setReleasedBooks] = useState([]);
  const [readingStops, setReadingStops] = useState([]);
  const [activeTab, setActiveTab] = useState('released');

  // Reader selection & auth state
  const [readersList, setReadersList] = useState([]);
  const [selectedReaderEmail, setSelectedReaderEmail] = useState('');
  const [currentAuthUser, setCurrentAuthUser] = useState(null);

  // Edit Profile mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editForm, setEditForm] = useState({
    display_name: '',
    home_base: '',
    avatar_url: '🔥',
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      try {
        // 1. Fetch available readers for quick switching
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('display_name', { ascending: true });

        if (allProfiles && allProfiles.length > 0) {
          setReadersList(allProfiles);
        }

        // 2. Check for active Supabase Auth user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentAuthUser(user);

        let activeEmail = user?.email || selectedReaderEmail;

        if (!activeEmail && allProfiles && allProfiles.length > 0) {
          const defaultReader = allProfiles.find(p => p.email === 'jeffrey.bergin@gmail.com') || allProfiles[0];
          activeEmail = defaultReader.email;
        }

        if (activeEmail) {
          setSelectedReaderEmail(activeEmail);

          // Fetch profile data
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', activeEmail)
            .maybeSingle();

          const loadedProfile = profData || {
            email: activeEmail,
            display_name: activeEmail.split('@')[0],
            home_base: '',
            avatar_url: '🔥',
          };

          setProfile(loadedProfile);
          setEditForm({
            display_name: loadedProfile.display_name || '',
            home_base: loadedProfile.home_base || '',
            avatar_url: loadedProfile.avatar_url || '🔥',
          });

          const readerName = loadedProfile.display_name || activeEmail.split('@')[0];

          // 3. Fetch books released by this reader
          const { data: booksData } = await supabase
            .from('books')
            .select('*')
            .or(`curator_name.ilike.%${readerName}%,curator_name.eq.${activeEmail}`)
            .order('created_at', { ascending: false });

          setReleasedBooks(booksData || []);

          // 4. Fetch journey stops logged by this reader
          const { data: stopsData } = await supabase
            .from('journey_stops')
            .select('*')
            .or(`reader_email.eq.${activeEmail},reader_name.ilike.%${readerName}%`)
            .order('created_at', { ascending: false });

          setReadingStops(stopsData || []);
        }
      } catch (err) {
        console.error('Error loading reader profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedReaderEmail]);

  // Handle Profile Update Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      const updates = {
        display_name: editForm.display_name.trim(),
        home_base: editForm.home_base.trim(),
        avatar_url: editForm.avatar_url.trim() || '🔥',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('email', selectedReaderEmail);

      if (error) throw error;

      // Update local view
      setProfile((prev) => ({ ...prev, ...updates }));
      setIsEditing(false);

      // Refresh reader list in switcher dropdown
      setReadersList((prevList) =>
        prevList.map((item) =>
          item.email === selectedReaderEmail ? { ...item, ...updates } : item
        )
      );
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isOwner = !currentAuthUser || currentAuthUser.email === selectedReaderEmail;

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span>Loading reader dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Reader Identity Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h2 className="font-serif font-bold text-lg text-stone-900">Edit Profile</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError('');
                }}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Avatar / Emoji</label>
                <input
                  type="text"
                  maxLength="4"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  placeholder="e.g. 🔥 or 📚"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Home Base</label>
                <input
                  type="text"
                  value={editForm.home_base}
                  onChange={(e) => setEditForm({ ...editForm, home_base: e.target.value })}
                  placeholder="e.g. Syracuse, NY"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                {profile?.avatar_url || '🔥'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                    {profile?.display_name || 'Reader'}
                  </h1>
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-mono px-2 py-0.5 rounded font-medium">
                    Reader
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      title="Edit Profile"
                      className="p-1 text-stone-400 hover:text-stone-700 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{profile?.home_base || 'No location set'}</span>
                  <span className="text-stone-300">•</span>
                  <span className="font-mono text-stone-400">{profile?.email}</span>
                </p>
              </div>
            </div>

            {/* Quick Switcher */}
            {readersList.length > 0 && (
              <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 self-stretch sm:self-auto">
                <UserCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
                <select
                  value={selectedReaderEmail}
                  onChange={(e) => setSelectedReaderEmail(e.target.value)}
                  className="text-xs bg-transparent text-stone-800 font-medium focus:outline-none cursor-pointer pr-2 w-full"
                >
                  {readersList.map((c) => (
                    <option key={c.id || c.email} value={c.email}>
                      Viewing as: {c.display_name} {c.home_base ? `(${c.home_base})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Impact Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Books Released</p>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1 flex items-baseline gap-1.5">
            <span>{releasedBooks.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">in circulation</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Journeys Logged</p>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1 flex items-baseline gap-1.5">
            <span>{readingStops.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">stops</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Library Role</p>
          <div className="text-xs font-semibold text-stone-800 mt-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Wildfire Spark Keeper</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('released')}
          className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'released'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Released Books ({releasedBooks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'log'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Reading History ({readingStops.length})
        </button>
      </div>

      {/* Released Books Tab */}
      {activeTab === 'released' && (
        <div className="space-y-4">
          {releasedBooks.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center max-w-sm mx-auto space-y-2">
              <BookOpen className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="text-stone-800 font-medium text-xs">No books released yet</p>
              <div className="pt-2">
                <Link
                  href="/add-book"
                  className="inline-block px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  Release a Book
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {releasedBooks.map((book) => {
                const displayId = book.book_id || book.id;
                const coverImage = book.cover_image || book.cover_image_url;

                return (
                  <div
                    key={displayId}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="p-3.5 flex gap-3">
                      <div className="w-16 aspect-[2/3] bg-stone-100 rounded-md overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
                        {coverImage ? (
                          <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-stone-300" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-stone-600">
                            {displayId}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{book.author}</p>
                        {book.release_location && (
                          <p className="text-[10px] text-stone-400 flex items-center gap-1 pt-0.5">
                            <MapPin className="w-3 h-3 text-stone-300" />
                            {book.release_location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px]">
                      <Link
                        href={`/book/${displayId}`}
                        className="text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        Journey →
                      </Link>
                      <Link
                        href={`/book/${displayId}`}
                        className="text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 text-[10px]"
                      >
                        <Printer className="w-3 h-3" />
                        Plate
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reading History Tab */}
      {activeTab === 'log' && (
        <div className="space-y-3">
          {readingStops.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center max-w-sm mx-auto space-y-1">
              <BookMarked className="w-6 h-6 text-stone-400 mx-auto" />
              <p className="text-stone-800 font-medium text-xs">No reading stops recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readingStops.map((stop) => (
                <div
                  key={stop.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/book/${stop.book_id}`}
                        className="font-mono text-xs font-bold text-amber-700 hover:underline"
                      >
                        {stop.book_id}
                      </Link>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                        {stop.status_event}
                      </span>
                      {stop.rating && (
                        <span className="text-amber-500">
                          {'★'.repeat(stop.rating)}
                        </span>
                      )}
                    </div>

                    {(stop.location || stop.location_city) && (
                      <p className="text-[11px] text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{stop.location || stop.location_city}</span>
                      </p>
                    )}

                    {stop.takeaway && (
                      <p className="text-stone-700 italic bg-stone-50 p-2 rounded border border-stone-100 text-[11px]">
                        "{stop.takeaway}"
                      </p>
                    )}
                  </div>

                  <div className="text-right sm:shrink-0 text-[10px] text-stone-400">
                    {new Date(stop.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
