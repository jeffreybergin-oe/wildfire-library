'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, 
  MapPin, 
  BookMarked, 
  CheckCircle2, 
  Printer, 
  Calendar, 
  Loader2, 
  Flame, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [releasedBooks, setReleasedBooks] = useState([]);
  const [readingStops, setReadingStops] = useState([]);
  const [activeTab, setActiveTab] = useState('released'); // 'released' | 'log'

  // Pre-seeded curator selection if unauthenticated
  const [curatorsList, setCuratorsList] = useState([]);
  const [selectedCuratorEmail, setSelectedCuratorEmail] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      try {
        // 1. Fetch available curators for easy switching
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('display_name', { ascending: true });

        if (allProfiles && allProfiles.length > 0) {
          setCuratorsList(allProfiles);
        }

        // 2. Check for active Supabase Auth user
        const { data: { user } } = await supabase.auth.getUser();

        let currentEmail = user?.email || selectedCuratorEmail;

        // If no auth user and no manually selected curator, default to the first profile or Jeffrey
        if (!currentEmail && allProfiles && allProfiles.length > 0) {
          const defaultCurator = allProfiles.find(p => p.email === 'jeffrey.bergin@gmail.com') || allProfiles[0];
          currentEmail = defaultCurator.email;
        }

        if (currentEmail) {
          setSelectedCuratorEmail(currentEmail);

          // Get profile
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', currentEmail)
            .maybeSingle();

          setProfile(profData || { email: currentEmail, display_name: currentEmail.split('@')[0], home_base: 'Central NY' });

          const curatorName = profData?.display_name || currentEmail.split('@')[0];

          // 3. Fetch books released by this curator (matching curator_name or email)
          const { data: booksData } = await supabase
            .from('books')
            .select('*')
            .or(`curator_name.ilike.%${curatorName}%,curator_name.eq.${currentEmail}`)
            .order('created_at', { ascending: false });

          setReleasedBooks(booksData || []);

          // 4. Fetch journey stops logged by this reader
          const { data: stopsData } = await supabase
            .from('journey_stops')
            .select('*')
            .or(`reader_email.eq.${currentEmail},reader_name.ilike.%${curatorName}%`)
            .order('created_at', { ascending: false });

          setReadingStops(stopsData || []);
        }
      } catch (err) {
        console.error('Error loading curator profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedCuratorEmail]);

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-sm flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span>Loading curator dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Curator Identity Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
            {profile?.avatar_url || '🔥'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {profile?.display_name || 'Curator'}
              </h1>
              <span className="bg-stone-900 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold">
                Curator
              </span>
            </div>

            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{profile?.home_base || 'New York'}</span>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-stone-400">{profile?.email}</span>
            </p>
          </div>
        </div>

        {/* Quick Curator Switcher dropdown (handy for testing your 6 seeded users) */}
        {curatorsList.length > 0 && (
          <div className="w-full md:w-auto flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200">
            <UserCheck className="w-4 h-4 text-stone-500 shrink-0 ml-1" />
            <select
              value={selectedCuratorEmail}
              onChange={(e) => setSelectedCuratorEmail(e.target.value)}
              className="text-xs bg-transparent text-stone-800 font-medium focus:outline-none cursor-pointer pr-2"
            >
              {curatorsList.map((c) => (
                <option key={c.id || c.email} value={c.email}>
                  Viewing as: {c.display_name} ({c.home_base})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Impact Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Books Released</p>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1 flex items-baseline gap-1.5">
            <span>{releasedBooks.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">in circulation</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Journeys Logged</p>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-600 mt-1 flex items-baseline gap-1.5">
            <span>{readingStops.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">stops</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Library Role</p>
          <div className="text-sm font-semibold text-stone-800 mt-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-600" />
            <span>Wildfire Spark Keeper</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('released')}
          className={`pb-3 text-sm font-semibold transition cursor-pointer relative ${
            activeTab === 'released'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          My Released Books ({releasedBooks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`pb-3 text-sm font-semibold transition cursor-pointer relative ${
            activeTab === 'log'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          My Reading History ({readingStops.length})
        </button>
      </div>

      {/* TAB 1: My Released Books */}
      {activeTab === 'released' && (
        <div className="space-y-4">
          {releasedBooks.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-stone-800 font-medium text-sm">No books released yet</p>
              <p className="text-stone-500 text-xs">
                Register a new book with its ISBN to generate a 3" × 3" QR bookplate and release it into the wild.
              </p>
              <div className="pt-2">
                <Link
                  href="/add-book"
                  className="inline-block px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition"
                >
                  Release Your First Book
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {releasedBooks.map((book) => {
                const displayId = book.book_id || book.id;
                const coverImage = book.cover_image || book.cover_image_url;

                return (
                  <div
                    key={displayId}
                    className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="p-4 flex gap-4">
                      <div className="w-20 aspect-[2/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
                        {coverImage ? (
                          <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-stone-400" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold bg-stone-900 text-white px-1.5 py-0.5 rounded">
                            {displayId}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              book.status === 'Ready for Next Reader'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {book.status || 'In the Wild'}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug line-clamp-2 pt-1">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-stone-600 line-clamp-1">{book.author}</p>
                        {book.release_location && (
                          <p className="text-[10px] text-stone-400 flex items-center gap-1 pt-1">
                            <MapPin className="w-3 h-3 text-stone-300" />
                            {book.release_location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                      <Link
                        href={`/book/${displayId}`}
                        className="text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        View Journey →
                      </Link>
                      <Link
                        href={`/book/${displayId}`}
                        className="text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 text-[11px]"
                      >
                        <Printer className="w-3 h-3" />
                        Print Plate
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Reading History */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {readingStops.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <BookMarked className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-stone-800 font-medium text-sm">No reading stops recorded</p>
              <p className="text-stone-500 text-xs">
                When you pick up or finish a book from the library, log your stop to keep the journey history alive.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {readingStops.map((stop) => (
                <div
                  key={stop.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/book/${stop.book_id}`}
                        className="font-mono text-xs font-bold text-amber-700 hover:underline"
                      >
                        {stop.book_id}
                      </Link>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono font-medium">
                        {stop.status_event}
                      </span>
                      {stop.rating && (
                        <span className="text-amber-500 text-xs">
                          {'★'.repeat(stop.rating)}
                        </span>
                      )}
                    </div>

                    {(stop.location || stop.location_city) && (
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{stop.location || stop.location_city}</span>
                      </p>
                    )}

                    {stop.takeaway && (
                      <p className="text-xs text-stone-700 italic bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        "{stop.takeaway}"
                      </p>
                    )}
                  </div>

                  <div className="text-right sm:shrink-0 text-xs text-stone-400">
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
