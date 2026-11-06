'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, BookPlus, Loader2, Sparkles, MapPin } from 'lucide-react';

const GENRES = [
  'Non-Fiction',
  'Sci-Fi / Fantasy',
  'Mystery / Thriller',
  'Personal Growth / Business',
  'Fiction',
  'Biography',
];

export default function AddBookPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'Non-Fiction',
    curator_name: '',
    release_location: '',
    cover_image_url: '',
    initial_takeaway: '',
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name, home_base')
            .eq('email', user.email)
            .maybeSingle();

          setFormData((prev) => ({
            ...prev,
            curator_name: prof?.display_name || user.email.split('@')[0],
            release_location: prof?.home_base || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Fetch latest book_id to calculate next sequence (WF-XXX)
      const { data: existingBooks } = await supabase
        .from('books')
        .select('book_id')
        .order('created_at', { ascending: false })
        .limit(50);

      let maxNumber = 0;
      if (existingBooks && existingBooks.length > 0) {
        existingBooks.forEach((b) => {
          if (b.book_id && b.book_id.startsWith('WF-')) {
            const numPart = parseInt(b.book_id.replace('WF-', ''), 10);
            if (!isNaN(numPart) && numPart > maxNumber) {
              maxNumber = numPart;
            }
          }
        });
      }

      const nextId = `WF-${String(maxNumber + 1).padStart(3, '0')}`;

      // 2. Insert into books table
      const bookPayload = {
        book_id: nextId,
        title: formData.title.trim(),
        author: formData.author.trim(),
        genre: formData.genre,
        curator_name: formData.curator_name.trim() || 'Wildfire Reader',
        release_location: formData.release_location.trim(),
        cover_image: formData.cover_image_url.trim() || null,
        cover_image_url: formData.cover_image_url.trim() || null,
        status: 'Ready for Next Reader',
        created_at: new Date().toISOString(),
      };

      const { data: insertedBook, error: bookError } = await supabase
        .from('books')
        .insert([bookPayload])
        .select()
        .single();

      if (bookError) throw bookError;

      // 3. Log initial registration stop in journey_stops
      const activeBookId = insertedBook.book_id || nextId;
      const stopPayload = {
        book_id: activeBookId,
        reader_name: formData.curator_name.trim() || 'Wildfire Reader',
        status_event: 'Registered',
        location: formData.release_location.trim(),
        takeaway: formData.initial_takeaway.trim() || 'Released into the wild.',
        created_at: new Date().toISOString(),
      };

      await supabase.from('journey_stops').insert([stopPayload]);

      // 4. Redirect directly to the new book journey page
      router.push(`/book/${activeBookId}`);
    } catch (err) {
      console.error('Error adding book:', err);
      setErrorMessage(err.message || 'Failed to release book. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Catalog</span>
      </Link>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wildfire Registration</span>
          </div>
          <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
            Release a Book into the Wild
          </h1>
          <p className="text-xs text-stone-500">
            Add a book to the library, assign it a unique tracking ID, and generate a printable QR bookplate.
          </p>
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Book Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Overstory"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Author *</label>
              <input
                type="text"
                required
                placeholder="e.g. Richard Powers"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Genre *</label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Released By (Your Name) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex S."
                value={formData.curator_name}
                onChange={(e) => setFormData({ ...formData, curator_name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Release Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Syracuse, NY"
                value={formData.release_location}
                onChange={(e) => setFormData({ ...formData, release_location: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Cover Image URL (optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or Google Books image URL"
              value={formData.cover_image_url}
              onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Why are you sharing this copy? (optional note)</label>
            <textarea
              rows="3"
              placeholder="A favorite quote, why you loved it, or where you're dropping it..."
              value={formData.initial_takeaway}
              onChange={(e) => setFormData({ ...formData, initial_takeaway: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <BookPlus className="w-3.5 h-3.5" />
                  <span>Release Book</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
