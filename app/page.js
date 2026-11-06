'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { BookOpen, MapPin, Sparkles, Loader2, Search } from 'lucide-react';

const GENRES = [
  'All',
  'Non-Fiction',
  'Sci-Fi / Fantasy',
  'Mystery / Thriller',
  'Personal Growth / Business',
  'Fiction',
  'Biography',
];

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBooks(data || []);
      } catch (err) {
        console.error('Error fetching catalog books:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.book_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'All' || book.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Book-Sharing Movement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
            Track books as they travel through the wild.
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Every book in the Wildfire Library has a unique code. Scan its QR plate, log your reading stop, and pass it along to the next reader.
          </p>
        </div>
      </div>

      {/* Search & Genre Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, author, or Book ID (e.g. WF-008)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="py-24 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span>Loading catalog...</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center text-xs text-stone-500">
          No books found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const displayId = book.book_id || book.id;
            const coverImage = book.cover_image || book.cover_image_url;

            return (
              <Link
                key={displayId}
                href={`/book/${displayId}`}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div className="p-4 space-y-3">
                  <div className="w-full aspect-[2/3] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center relative">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-stone-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
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

                    <h2 className="font-serif font-bold text-stone-900 text-sm leading-snug line-clamp-2 pt-1 group-hover:text-amber-700 transition">
                      {book.title}
                    </h2>
                    <p className="text-[11px] text-stone-600 line-clamp-1">by {book.author}</p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="truncate">Released by: {book.curator_name || 'Reader'}</span>
                  <span className="text-amber-700 font-semibold shrink-0">View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
