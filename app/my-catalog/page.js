'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import {
  BookOpen,
  MapPin,
  Search,
  Plus,
  Star,
  Send,
  Compass,
  Library,
  Loader2,
  LogIn,
  ArrowLeft,
} from 'lucide-react';

export default function MyCatalogPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myBooks, setMyBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [metrics, setMetrics] = useState({
    totalInteracted: 0,
    totalReleased: 0,
    totalStops: 0,
    avgRating: null,
  });

  useEffect(() => {
    async function fetchMyCatalog() {
      setLoading(true);

      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // 1. Fetch User Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        setProfile(profileData || null);

        // 2. Fetch Books Released by This User
        const { data: releasedBooksData } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        const releasedBooks = releasedBooksData || [];

        // 3. Fetch Journey Stops Logged by This User
        const { data: userStopsData } = await supabase
          .from('journey_stops')
          .select('*')
          .eq('user_id', currentUser.id);

        const userStops = userStopsData || [];

        // Calculate Personal Average Rating
        const ratedStops = userStops.filter(
          (s) => typeof s.rating === 'number' && s.rating > 0
        );
        const avgRating =
          ratedStops.length > 0
            ? (
                ratedStops.reduce((sum, s) => sum + s.rating, 0) /
                ratedStops.length
              ).toFixed(1)
            : null;

        // 4. Fetch Book Details for Any Books Read/Picked Up (not already in releasedBooks)
        const releasedIds = new Set(
          releasedBooks.flatMap((b) => [b.id, b.book_id].filter(Boolean))
        );

        const stopBookIds = Array.from(
          new Set(userStops.map((s) => s.book_id).filter(Boolean))
        );

        const missingBookIds = stopBookIds.filter((id) => !releasedIds.has(id));

        let readBooks = [];
        if (missingBookIds.length > 0) {
          // Query both book_id and id to support legacy & new entries
          const { data: byBookId } = await supabase
            .from('books')
            .select('*')
            .in('book_id', missingBookIds);

          const { data: byId } = await supabase
            .from('books')
            .select('*')
            .in('id', missingBookIds);

          const combinedRead = [...(byBookId || []), ...(byId || [])];
          const seen = new Set();
          readBooks = combinedRead.filter((b) => {
            if (seen.has(b.id)) return false;
            seen.add(b.id);
            return true;
          });
        }

        // 5. Merge & Annotate Books with User's Relationship and Personal Rating
        const allBooksMap = new Map();

        releasedBooks.forEach((book) => {
          allBooksMap.set(book.id, {
            ...book,
            isReleased: true,
            isRead: false,
            myRating: null,
          });
        });

        readBooks.forEach((book) => {
          allBooksMap.set(book.id, {
            ...book,
            isReleased: false,
            isRead: true,
            myRating: null,
          });
        });

        // Attach stop info (read status & personal rating)
        userStops.forEach((stop) => {
          for (const [key, book] of allBooksMap.entries()) {
            if (book.id === stop.book_id || book.book_id === stop.book_id) {
              book.isRead = true;
              if (typeof stop.rating === 'number' && stop.rating > 0) {
                book.myRating = stop.rating;
              }
              allBooksMap.set(key, book);
            }
          }
        });

        const mergedBooks = Array.from(allBooksMap.values());
        setMyBooks(mergedBooks);

        setMetrics({
          totalInteracted: mergedBooks.length,
          totalReleased: releasedBooks.length,
          totalStops: userStops.length,
          avgRating,
        });
      } catch (err) {
        console.error('Error fetching personal catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyCatalog();
  }, []);

  const filteredBooks = myBooks.filter((book) => {
    const matchesSearch =
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.book_id || book.id || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'All' ||
      (roleFilter === 'Released by Me' && book.isReleased) ||
      (roleFilter === 'Read / Picked Up' && book.isRead);

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="py-28 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span>Loading your reading passport...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto border border-stone-200">
          <Library className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif font-bold text-2xl text-stone-900">
            Sign in to view your catalog
          </h1>
          <p className="text-stone-500 text-sm">
            Keep track of every book you&apos;ve released into the wild, stops
            you&apos;ve logged, and your personal ratings.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-sm font-medium transition"
          >
            <span>Back Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.username ||
    user.email?.split('@')[0] ||
    'Reader';

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <section className="bg-gradient-to-b from-stone-100/80 to-stone-50/20 border-b border-stone-200 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Community Catalog</span>
            </Link>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900 tracking-tight">
              {displayName}&apos;s Reading Passport
            </h1>
            <p className="text-stone-600 text-sm">
              Every book you&apos;ve released into the wild or picked up along
              the way.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition"
            >
              Edit Profile
            </Link>
            <Link
              href="/add-book"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Release a Book</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Personal Metrics Bar */}
      <section className="max-w-5xl mx-auto px-4 -mt-4">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
          <div className="flex items-center gap-3.5 pt-2 lg:pt-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.totalInteracted}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                My Books
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.totalReleased}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Released
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100">
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

          <div className="flex items-center gap-3.5 pt-4 lg:pt-0 lg:pl-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center shrink-0 border border-yellow-200">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            </div>
            <div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                {metrics.avgRating ? `${metrics.avgRating} ★` : '—'}
              </p>
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                My Avg Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Catalog Grid */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-stone-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Released by Me', 'Read / Picked Up'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  roleFilter === role
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-stone-800 text-sm font-medium">
              No books in your passport yet
            </p>
            <p className="text-stone-500 text-xs">
              Release a book into the wild or scan a bookplate to log your first
              stop.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredBooks.map((book) => {
              const displayId = book.book_id || book.id;
              const coverImg = book.cover_image || book.cover_image_url;
              const roleLabel =
                book.isReleased && book.isRead
                  ? 'Released & Read'
                  : book.isReleased
                  ? 'Released'
                  : 'Read';

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

                    {book.myRating && (
                      <span className="absolute top-2 right-2 font-mono text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                        {book.myRating} ★
                      </span>
                    )}
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
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {roleLabel}
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
