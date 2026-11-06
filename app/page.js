'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { BookOpen, Loader2, Search } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Search & Genre Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, author, or Book ID (e.g. WF-008)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
        <div className="py-20 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span>Loading catalog...</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
          No books found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBooks.map((book) => {
            const displayId = book.book_id || book.id;
            const coverImage = book.cover_image || book.cover_image_url;

            return (
              <Link
                key={displayId}
                href={`/book/${displayId}`}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-400 transition flex flex-col justify-between group"
              >
                <div className="p-3 space-y-2">
                  <div className="w-full aspect-[2/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-100 flex items-center justify-center">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-stone-600">
                        {displayId}
                      </span>
                    </div>

                    <h2 className="font-serif font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                      {book.title}
                    </h2>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{book.author}</p>
                  </div>
                </div>

                <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-500 flex justify-between items-center">
                  <span className="truncate">{book.curator_name || 'Reader'}</span>
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
