'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  MapPin, 
  Search, 
  Plus, 
  Compass, 
  Users, 
  UserCheck, 
  UserPlus, 
  Library, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  BookOpenCheck, 
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showHowItWorksMobile, setShowHowItWorksMobile] = useState(false);

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

  // Helper for distinct status badge colors
  const getStatusBadgeStyle = (status) => {
    if (status === 'Ready for Next Reader') {
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    }
    if (status === 'Currently Being Read') {
      return 'bg-amber-100 text-amber-900 border border-amber-200';
    }
    return 'bg-stone-100 text-stone-600 border border-stone-200';
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* Incomplete Profile Reminder Banner */}
      {user && profileIncomplete && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-amber-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                <strong>Finish setting up your profile:</strong> Add your reader name so your stops and released books appear properly.
              </span>
            </div>
            <Link
              href="/profile"
              className="font-semibold underline hover:text-amber-800 whitespace-nowrap"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Tightened Dark Warm Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-50 border-b border-stone-800 pt-8 pb-12 sm:pt-11 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3.5 sm:space-y-4">
          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Books meant to wander, <br className="hidden sm:inline" />
            not sit on shelves.
          </h1>

          <p className="max-w-xl mx-auto text-stone-300 text-base sm:text-lg leading-relaxed">
            A free, roaming community library where every book carries a unique passport. 
            Scan the plate, see where it has traveled, and pass it along for the next reader.
          </p>

          {/* Process-Oriented Hero Buttons */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {user ? (
                <Link
                  href="/my-catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
                >
                  <Library className="w-4 h-4" />
                  <span>My Catalog</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create an Account</span>
                </Link>
              )}

              <Link
                href="/add-book"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Release a Book</span>
              </Link>
            </div>

            {!user && (
              <p className="text-xs sm:text-sm text-stone-400">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-amber-300 underline hover:text-amber-200 transition">
                  Sign in here
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Compact Live Impact Metrics Bar */}
      <section className="max-w-5xl mx-auto px-4 -mt-9 sm:-mt-12 relative z-10">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-3.5 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 lg:divide-x divide-stone-100">
          <div className="flex items-center gap-3 p-1.5 sm:p-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-mono text-lg sm:text-2xl font-bold text-stone-900 leading-none">
                {metrics.totalBooks}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                In Circulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 sm:p-0 lg:pl-5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-mono text-lg sm:text-2xl font-bold text-stone-900 leading-none">
                {metrics.totalStops}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                Stops Logged
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 sm:p-0 lg:pl-5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-mono text-lg sm:text-2xl font-bold text-stone-900 leading-none">
                {metrics.currentlyReading}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                Being Read Now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 sm:p-0 lg:pl-5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-mono text-lg sm:text-2xl font-bold text-stone-900 leading-none">
                {metrics.locationsCount}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                Drop Locations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 sm:p-0 lg:pl-5 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="font-mono text-lg sm:text-2xl font-bold text-stone-900 leading-none">
                {metrics.readersCount}
              </p>
              <p className="text-xs font-medium text-stone-600 mt-1">
                Readers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the Journey Works (Collapsible on Mobile so Catalog sits right below metrics) */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4">
        <div className="bg-stone-100/90 border border-stone-200 rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-6">
          {/* Mobile Accordion Header */}
          <button
            type="button"
            onClick={() => setShowHowItWorksMobile(!showHowItWorksMobile)}
            className="w-full flex md:hidden items-center justify-between text-left cursor-pointer"
          >
            <div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-800 block">
                New Here?
              </span>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                How the Journey Works
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-700">
              <span>{showHowItWorksMobile ? 'Hide' : 'Show'}</span>
              {showHowItWorksMobile ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </span>
          </button>

          {/* Desktop Header */}
          <div className="hidden md:block text-center max-w-lg mx-auto space-y-1">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-800">
              Simple &amp; Free
            </span>
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              How the Journey Works
            </h2>
            <p className="text-stone-600 text-sm">
              No due dates, library cards, or fees—just books traveling hand to hand.
            </p>
          </div>

          {/* Collapsible Body on Mobile, Always Open on Desktop */}
          <div className={`${showHowItWorksMobile ? 'block' : 'hidden'} md:block space-y-4 sm:space-y-6`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
              {/* Step 1 */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-400">01</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-stone-900">Find &amp; Scan</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Spot a book in a café, park bench, or little free library. Scan the 3&quot; bookplate QR code to see its backstory.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <BookOpenCheck className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-400">02</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-stone-900">Confirm Pickup</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Tap &quot;Just Picked Up&quot; to let previous readers know the copy is in good hands. Take your time enjoying the read.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-400">03</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-stone-900">Pass It Along</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    Leave a quick takeaway note and star rating, then release it in a new spot for someone else to discover.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Perk Reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-stone-900">
                  Want to keep a personal reading passport?
                </p>
                <p className="text-xs sm:text-sm text-stone-600">
                  No account is required to log a stop, but creating a free profile lets you track every book you&apos;ve read or released.
                </p>
              </div>
              {!user && (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-semibold whitespace-nowrap transition"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Grid (Tinted Warm Band for Clear Visual Separation) */}
      <section id="catalog-view" className="bg-amber-50/40 border-t border-amber-200/70 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 space-y-5">
          {/* Section Header & Divider */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 pb-3 border-b border-amber-200/80">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-800">
                Directory
              </span>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
                Community Catalog
              </h2>
            </div>
            <p className="text-stone-600 text-sm">
              Showing <strong>{filteredBooks.length}</strong> {filteredBooks.length === 1 ? 'copy' : 'copies'} in circulation
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, author, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-base sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Ready for Next Reader', 'Currently Being Read', 'Not Released'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === status
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            <div className="py-16 text-center text-stone-600 text-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <span>Loading community catalog...</span>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-stone-900 text-base font-semibold">No matching books found</p>
              <p className="text-stone-600 text-sm">Try adjusting your search terms or release a new copy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredBooks.map((book) => {
                const displayId = book.book_id || book.id;
                const coverImg = book.cover_image || book.cover_image_url;
                const currentStatus = book.status || 'Not Released';

                return (
                  <Link
                    key={book.id}
                    href={`/book/${displayId}`}
                    className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-md transition flex flex-col"
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
                      <span className="absolute top-2 left-2 font-mono text-xs font-bold bg-stone-900/85 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                        {displayId}
                      </span>
                    </div>

                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 line-clamp-1 group-hover:text-amber-800 transition">
                          {book.title}
                        </h2>
                        <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                          {book.author}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(currentStatus)}`}>
                          {currentStatus}
                        </span>
                        {book.release_location && (
                          <span className="text-stone-500 truncate max-w-[95px] flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
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
        </div>
      </section>
    </div>
  );
}
