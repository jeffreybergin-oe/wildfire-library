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

        <div className="flex
