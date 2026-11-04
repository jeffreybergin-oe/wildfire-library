'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Search, Book, Sparkles } from 'lucide-react';

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    const matchesSearch =
      book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || book.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-4">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Books Passed in the Wild
        </h1>
        <p className="text-stone-600 text-sm sm:text-base">
          Track stories as they travel from reader to reader. Pick up an available book or check on one you set free.
        </p>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search title, author, or WF-ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { label: 'All Books', value: 'ALL' },
            { label: 'Ready for Next Reader', value: 'Ready for Next Reader' },
            { label: 'Being Read', value: 'Being Read' },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition whitespace-nowrap ${
                statusFilter === pill.value
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">
          Loading the library catalog...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-2xl max-w-md mx-auto p-8 space-y-3">
          <Book className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-stone-700 font-medium text-sm">No books found</p>
          <p className="text-stone-500 text-xs">
            Try adjusting your search terms or filter selections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="group bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Cover Art Area */}
              <div className="aspect-[2/3] w-full bg-stone-100 relative overflow-hidden flex items-center justify-center">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
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
                <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {book.id}
                </span>
              </div>

              {/* Book Details */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        book.status === 'Ready for Next Reader'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-stone-600">
                      {book.status || 'In Circulation'}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 text-base leading-snug line-clamp-2 group-hover:text-amber-700 transition">
                    {book.title}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-1">
                    {book.author}
                  </p>
                </div>

                {book.genre && (
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span>{book.genre}</span>
                    <span className="text-amber-700 font-medium group-hover:underline">
                      View Journey →
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
