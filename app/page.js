'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  MapPin, 
  Search, 
  Plus, 
  Sparkles, 
  Compass, 
  Users, 
  UserCheck, 
  UserPlus, 
  Library, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  QrCode, 
  BookOpenCheck, 
  Send
} from 'lucide-react';

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Auth & Profile State
  const [user, setUser] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Live Metrics State
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    totalStops: 0,
    currentlyReading: 0,
    locationsCount: 0,
    readersCount: 0,
  });

  useEffect(() => {
    async function fetchCatalogAndMetrics() {
      setLoading(true);

      try {
        // 0. Check Auth Session & Profile Completeness
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser || null);

        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

          const hasName = profile && (
            profile.full_name || 
            profile.display_name || 
            profile.name || 
            profile.username
          );
          if (!hasName) {
            setProfileIncomplete(true);
          }
        }

        // 1. Fetch Books Catalog
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (booksError) throw booksError;
        const booksList = booksData || [];
        setBooks(booksList);

        // 2. Fetch Journey Stops (Safe fetch for schema flexibility)
        let stops = [];
        const { data: orderedStops, error: stopsError } = await supabase
          .from('journey_stops')
          .select('location, status_event')
          .order('created_at', { ascending: false });

        if (stopsError) {
          const { data: fallbackStops } = await supabase
            .from('journey_stops')
            .select('location, status_event');
          stops = fallbackStops || [];
        } else {
          stops = orderedStops || [];
        }

        // 3. Fetch Registered Readers Count from profiles
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Calculate unique drop spots
        const uniqueLocations = new Set(
          stops
            .map((s) => s.location?.trim().toLowerCase())
            .filter(Boolean)
        );

        const activeReadersCount = booksList.filter(
          (b) => b.status === 'Currently Being Read'
        ).length;

        setMetrics({
          totalBooks: booksList.length,
          totalStops: stops.length,
          currentlyReading: activeReadersCount,
          locationsCount: uniqueLocations.size,
          readersCount: profilesCount || 0,
        });
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalogAndMetrics();
  }, []);

  // Build unique genre list for dropdown
  const genres = ['All', ...new Set(books.map((b) => b.genre).filter(Boolean))];

  // Filter books by search, status, and genre
  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.book_id || book.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' || book.status === statusFilter;

    const matchesGenre = 
      selectedGenre === 'All' || book.genre === selectedGenre;

    return matchesSearch && matchesStatus && matchesGenre;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Incomplete Profile Reminder Banner */}
      {user && profileIncomplete && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Finish setting up your profile:</strong> Add your reader name so your stops and released books appear properly.
              </span>
            </div>
            <Link
              href="/profile"
              className="font-semibold underline hover:text-amber-700 whitespace-nowrap"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/80 to-stone-50/20 border-b border-stone-200 py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wide border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>A Free, Roaming Community Library</span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-stone-900 tracking-tight leading-tight">
            Books meant to wander, <br className="hidden sm:inline" />
            not sit on shelves.
          </h1>

          <p className="max-w-xl mx-auto text-stone-600 text-sm sm:text-base leading-relaxed">
            Every book in the Wildfire Library carries a unique passport. 
            Scan the plate, see where it has traveled, and pass it along into the wild for the next reader.
          </p>

          {/* Process-Oriented Hero Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link
                  href="/my-catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
                >
                  <Library className="w-4 h-4" />
                  <span>My Catalog</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create an Account</span>
                </Link>
              )}

              <Link
                href="/add-book"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 text-stone-600" />
                <span>Release a Book</span>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                <span>How It Works</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>

            {!user && (
              <p className="text-xs text-stone-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-stone-800 underline hover:text-amber-800 transition">
                  Sign in here
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Live Impact Metrics Bar (5 Metrics) */}
      <section className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
          <div className="flex items-center gap-3.5 pt-2 lg:pt-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.totalBooks}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                In Circulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.totalStops}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Stops Logged
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.currentlyReading}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Being Read Now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0 border border-rose-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.locationsCount}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Drop Locations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-5 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0 border border-purple-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.readersCount}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Readers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the Journey Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 pt-2">
        <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-1">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-700">Simple &amp; Free</span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">How the Journey Works</h2>
            <p className="text-stone-500 text-xs sm:text-sm">No due dates, library cards, or fees—just books traveling hand to hand.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {/* Step 1 */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 relative shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-stone-300">01</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-sm text-stone-900">Find &amp; Scan</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Spot a book in a café, park bench, or little free library. Scan the 3&quot; bookplate QR code to see its backstory.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 relative shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-stone-300">02</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-sm text-stone-900">Confirm Pickup</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Tap &quot;Just Picked Up&quot; to let previous readers know the copy is in good hands. Take your time enjoying the read.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 relative shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-800 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-stone-300">03</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-sm text-stone-900">Pass It Along</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Leave a quick takeaway note and star rating, then release it in a new spot for someone else to discover.
                </p>
              </div>
            </div>
          </div>

          {/* Account Perk Reminder */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-stone-900">
                Want to keep a personal reading passport?
              </p>
              <p className="text-xs text-stone-500">
                No account is required to log a stop, but creating a free profile lets you track every book you&apos;ve read or released.
              </p>
            </div>
            {!user && (
              <Link
                href="/login"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Catalog Search & Grid (Directly below How It Works) */}
      <section id="catalog-view" className="max-w-5xl mx-auto px-4 space-y-6 pt-4">
        {/* Section Header & Divider */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-stone-200">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-stone-400">Directory</span>
            <h2 className="font-serif font-bold text-2xl text-stone-900">Community Catalog</h2>
          </div>
          <p className="text-stone-500 text-xs">
            Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'copy' : 'copies'} in circulation
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-2">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, or book ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Ready for Next Reader', 'Currently Being Read', 'Not Released'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre === 'All' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="py-20 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>Loading community catalog...</span>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-stone-800 text-sm font-medium">No matching books found</p>
            <p className="text-stone-500 text-xs">Try adjusting your search terms or release a new copy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredBooks.map((book) => {
              const displayId = book.book_id || book.id;
              const coverImg = book.cover_image || book.cover_image_url;

              return (
                <Link
                  key={book.id}
                  href={`/book/${displayId}`}
                  className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-400 hover:shadow-xs transition flex flex-col"
                >
                  <div className="aspect-[2/3] bg-stone-100 relative overflow-hidden flex items-center justify-center">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-stone-300" />
                    )}
                    <span className="absolute top-2 left-2 font-mono text-[10px] font-bold bg-stone-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                      {displayId}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h2 className="font-serif font-bold text-xs sm:text-sm text-stone-900 line-clamp-1 group-hover:text-amber-800 transition">
                        {book.title}
                      </h2>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {book.author}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                        {book.status || 'Not Released'}
                      </span>
                      {book.release_location && (
                        <span className="text-stone-400 truncate max-w-[90px] flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {book.release_location}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
