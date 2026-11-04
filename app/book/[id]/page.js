'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, MapPin, Star, MessageSquare, Check, ArrowRight, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [readerName, setReaderName] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [rating, setRating] = useState(5);
  const [takeaway, setTakeaway] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch book and its journey stops
  const loadBookData = async () => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch book details
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
    } else {
      setBook(bookData);
    }

    // 2. Fetch journey stops
    const { data: stopData, error: stopError } = await supabase
      .from('journey_stops')
      .select('*')
      .eq('book_id', id)
      .order('created_at', { ascending: false });

    if (!stopError) {
      setStops(stopData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadBookData();
  }, [id]);

  // Handle "I Just Received This Book"
  const handleClaimBook = async (e) => {
    e.preventDefault();
    if (!readerName.trim()) {
      alert('Please enter your name or handle.');
      return;
    }
    setSubmitting(true);

    try {
      // Create journey stop entry
      const { error: stopError } = await supabase.from('journey_stops').insert([
        {
          book_id: id,
          reader_name: readerName.trim(),
          location_city: locationCity.trim() || 'Unknown Location',
          status_event: 'Picked Up',
        },
      ]);
      if (stopError) throw stopError;

      // Update book status
      const { error: bookError } = await supabase
        .from('books')
        .update({ status: 'Being Read' })
        .eq('id', id);
      if (bookError) throw bookError;

      setActionSuccess('Enjoy your read! Keep this tab open or scan again when you are finished.');
      setReaderName('');
      setLocationCity('');
      loadBookData();
    } catch (err) {
      console.error(err);
      alert(`Error updating book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle "I Finished This Book"
  const handleFinishBook = async (e) => {
    e.preventDefault();
    if (!readerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    setSubmitting(true);

    try {
      // Record completed stop with review
      const { error: stopError } = await supabase.from('journey_stops').insert([
        {
          book_id: id,
          reader_name: readerName.trim(),
          location_city: locationCity.trim() || 'Passed Along',
          rating: rating,
          takeaway: takeaway.trim(),
          status_event: 'Finished & Passed',
        },
      ]);
      if (stopError) throw stopError;

      // Flip status back to Ready for Next Reader
      const { error: bookError } = await supabase
        .from('books')
        .update({ status: 'Ready for Next Reader' })
        .eq('id', id);
      if (bookError) throw bookError;

      setActionSuccess('Thank you for logging your review! Pass the book along to its next stop.');
      setReaderName('');
      setLocationCity('');
      setTakeaway('');
      loadBookData();
    } catch (err) {
      console.error(err);
      alert(`Error completing book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-sm">
        Loading book journey...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Book Not Found</h2>
        <p className="text-xs text-stone-600">No book was found matching the identifier "{id}".</p>
        <Link href="/" className="inline-block text-xs font-semibold text-amber-700 underline">
          Return to Library Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Book Banner Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
        {/* Cover Art */}
        <div className="w-32 sm:w-40 flex-shrink-0 aspect-[2/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-10 h-10 text-stone-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
              {book.id}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                book.status === 'Ready for Next Reader'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {book.status}
            </span>
            {book.genre && (
              <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                {book.genre}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
            {book.title}
          </h1>
          <p className="text-sm font-medium text-stone-600">by {book.author}</p>

          <p className="text-xs text-stone-500 pt-2">
            Tracked {stops.length} journey {stops.length === 1 ? 'stop' : 'stops'} so far.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Interactive QR Action Box */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        {book.status === 'Ready for Next Reader' ? (
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Are you holding this book?</h2>
            <p className="text-xs text-stone-400 mb-4">
              Let the community know this book has found a reader. No account needed.
            </p>
            <form onSubmit={handleClaimBook} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Your Name or Reader Handle *"
                value={readerName}
                onChange={(e) => setReaderName(e.target.value)}
                className="px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
              />
              <input
                type="text"
                placeholder="Current City / Location (e.g. Syracuse, NY)"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Updating...' : "I'm Reading This Next!"}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Finished Reading?</h2>
            <p className="text-xs text-stone-400 mb-4">
              Leave your rating and favorite takeaway before passing it to the next reader.
            </p>
            <form onSubmit={handleFinishBook} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={readerName}
                  onChange={(e) => setReaderName(e.target.value)}
                  className="px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Where are you leaving / passing it? (e.g. Salt City Market)"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-300 mb-1">Your Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Loved it)</option>
                  <option value={4}>⭐⭐⭐⭐ (Great read)</option>
                  <option value={3}>⭐⭐⭐ (Good)</option>
                  <option value={2}>⭐⭐ (Not for me)</option>
                  <option value={1}>⭐ (Struggled to finish)</option>
                </select>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Favorite line, takeaway, or note to the next reader..."
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Complete Read & Mark Available for Next Reader'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Journey Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-stone-900">Book Journey History</h2>
        {stops.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-xs text-stone-500">
            This book is at the start of its journey. Be the first to log a stop!
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop) => (
              <div key={stop.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">{stop.reader_name}</span>
                    {stop.status_event && (
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                        {stop.status_event}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {new Date(stop.created_at).toLocaleDateString()}
                  </span>
                </div>

                {stop.location_city && (
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{stop.location_city}</span>
                  </div>
                )}

                {stop.takeaway && (
                  <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100 italic">
                    "{stop.takeaway}"
                  </div>
                )}

                {stop.rating && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    {'★'.repeat(stop.rating)}
                    {'☆'.repeat(5 - stop.rating)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
