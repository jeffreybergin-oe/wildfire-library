'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Search, Book, Sparkles, Filter } from 'lucide-react';

const GENRES = [
  'All Genres',
  'Fiction & Literature',
  'Non-Fiction',
  'Personal Growth / Business',
  'Mystery / Thriller',
  'Sci-Fi / Fantasy',
  'Biography / Memoir',
];

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All Genres');

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
      } else {
        setBooks(data || []);
      }
      setLoading(false);
    }

    fetchBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const bookId = book.book_id || book.id || '';
    const matchesSearch =
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      genreFilter === 'All Genres' || book.genre === genreFilter;

    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Books Passed in the Wild
        </h1>
        <p className="text-stone-600 text-sm sm:text-base">
          Track stories as they travel from reader to reader. Pick up an available book or check on one you set free.
        </p>
      </div>

      {/* Search & Genre Filters */}
      <div className="flex flex-col gap-4 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by title, author, or Book ID (e.g. WF-1042)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent shadow-xs transition"
          />
        </div>

        {/* 6 Genre Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setGenreFilter(genre)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition whitespace-nowrap cursor-pointer ${
                genreFilter === genre
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
          <span>Loading the library catalog...</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-2xl max-w-md mx-auto p-8 space-y-3">
          <Book className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-stone-700 font-medium text-sm">No books found</p>
          <p className="text-stone-500 text-xs">
            Try adjusting your search terms or genre filter.
          </p>
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
                className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col cursor-pointer"
              >
                {/* Cover Art Area */}
                <div className="aspect-[2/3] w-full bg-stone-100 relative overflow-hidden flex items-center justify-center">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                      <Book className="w-10 h-10 mb-2 stroke-[1.5]" />
                      <span className="text-xs">No cover image</span>
                    </div>
                  )}

                  {/* Bookplate Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-stone-900/85 backdrop-blur text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg shadow-xs">
                    {displayId}
                  </span>
                </div>

                {/* Book Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-medium text-stone-600">
                        {book.status || 'In the Wild'}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-stone-900 text-base leading-snug line-clamp-2 group-hover:text-amber-700 transition">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-1">
                      {book.author}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="truncate max-w-[140px] font-medium">
                      {book.genre || 'General'}
                    </span>
                    <span className="text-amber-700 font-semibold group-hover:underline shrink-0">
                      View Journey →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
