'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, 
  BookOpen, 
  MapPin, 
  Printer, 
  Loader2, 
  PlusCircle, 
  Calendar 
} from 'lucide-react';

export default function BookDetailPage() {
  const params = useParams();
  const bookIdParam = params.id;

  const [book, setBook] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingStop, setSubmittingStop] = useState(false);
  const [newStop, setNewStop] = useState({
    reader_name: '',
    reader_email: '',
    status_event: 'Currently Reading',
    location: '',
    takeaway: '',
    rating: 5,
  });

  useEffect(() => {
    async function loadBookData() {
      if (!bookIdParam) return;
      setLoading(true);
      setErrorMsg('');

      try {
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .or(`book_id.eq.${bookIdParam},id.eq.${bookIdParam}`)
          .maybeSingle();

        if (bookError) throw bookError;
        if (!bookData) {
          setErrorMsg('Book not found.');
          setLoading(false);
          return;
        }

        setBook(bookData);

        const queryId = bookData.book_id || bookData.id;
        const { data: stopsData, error: stopsError } = await supabase
          .from('journey_stops')
          .select('*')
          .eq('book_id', queryId)
          .order('created_at', { ascending: false });

        if (stopsError) throw stopsError;
        setStops(stopsData || []);
      } catch (err) {
        console.error('Error fetching book details:', err);
        setErrorMsg('Failed to load book journey.');
      } finally {
        setLoading(false);
      }
    }

    loadBookData();
  }, [bookIdParam]);

  const handleLogStop = async (e) => {
    e.preventDefault();
    setSubmittingStop(true);

    try {
      const activeBookId = book.book_id || book.id;
      const payload = {
        book_id: activeBookId,
        reader_name: newStop.reader_name.trim(),
        reader_email: newStop.reader_email.trim().toLowerCase(),
        status_event: newStop.status_event,
        location: newStop.location.trim(),
        takeaway: newStop.takeaway.trim(),
        rating: Number(newStop.rating),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('journey_stops')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (newStop.status_event === 'Ready for Next Reader') {
        await supabase
          .from('books')
          .update({ status: 'Ready for Next Reader' })
          .eq('id', book.id);

        setBook((prev) => ({ ...prev, status: 'Ready for Next Reader' }));
      }

      setStops((prev) => [data, ...prev]);
      setShowLogModal(false);
      setNewStop((prev) => ({ ...prev, takeaway: '' }));
    } catch (err) {
      console.error('Error logging journey stop:', err);
      alert(err.message || 'Error recording stop.');
    } finally {
      setSubmittingStop(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span>Loading book journey...</span>
      </div>
    );
  }

  if (errorMsg || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-800 text-sm font-medium">{errorMsg || 'Book not found'}</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const displayId = book.book_id || book.id;
  const coverImage = book.cover_image || book.cover_image_url;
  const qrTargetUrl = typeof window !== 'undefined' ? `${window.location.origin}/book/${displayId}` : `https://wildfire-library.vercel.app/book/${displayId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTargetUrl)}&margin=0`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>Print Bookplate</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Reading Stop</span>
          </button>
        </div>
      </div>

      {/* Book Info Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row gap-6">
        <div className="w-28 sm:w-32 aspect-[2/3] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
          {coverImage ? (
            <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-8 h-8 text-stone-300" />
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
              {displayId}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {book.status || 'In the Wild'}
            </span>
            {book.genre && (
              <span className="text-xs text-stone-500 border border-stone-200 px-2 py-0.5 rounded-md">
                {book.genre}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">{book.title}</h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">by {book.author}</p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-y-2 gap-x-6 text-xs text-stone-500">
            <div>
              <span className="text-stone-400">Released by: </span>
              <span className="text-stone-800 font-medium">{book.curator_name || 'Reader'}</span>
            </div>
            {book.release_location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{book.release_location}</span>
              </div>
            )}
            {book.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{new Date(book.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Journey Stops Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h2 className="font-serif font-bold text-lg text-stone-900">Book Journey</h2>
            <p className="text-xs text-stone-500">Tracking every hand and location this copy travels through.</p>
          </div>
          <span className="text-xs font-mono font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
            {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>
        {stops.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center text-stone-500 text-xs">
            No journey stops logged yet. Scan the bookplate QR code to record the first stop!
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop) => (
              <div key={stop.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{stop.reader_name || 'Anonymous Reader'}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                      {stop.status_event}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {new Date(stop.created_at).toLocaleDateString()}
                  </span>
                </div>
                {stop.location && (
                  <p className="text-stone-500 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{stop.location}</span>
                  </p>
                )}
                {stop.takeaway && (
                  <blockquote className="text-stone-700 italic bg-stone-50 border-l-2 border-amber-500 py-1.5 px-3 rounded-r-md text-[11px]">
                    "{stop.takeaway}"
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">Log Reading Stop</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogStop} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex S."
                  value={newStop.reader_name}
                  onChange={(e) => setNewStop({ ...newStop, reader_name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Your Email (optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={newStop.reader_email}
                  onChange={(e) => setNewStop({ ...newStop, reader_email: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Status Event</label>
                  <select
                    value={newStop.status_event}
                    onChange={(e) => setNewStop({ ...newStop, status_event: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                  >
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Finished Reading">Finished Reading</option>
                    <option value="Ready for Next Reader">Passed Along</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Rating (1-5)</label>
                  <select
                    value={newStop.rating}
                    onChange={(e) => setNewStop({ ...newStop, rating: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                  >
                    <option value="5">★★★★★ (5/5)</option>
                    <option value="4">★★★★☆ (4/5)</option>
                    <option value="3">★★★☆☆ (3/5)</option>
                    <option value="2">★★☆☆☆ (2/5)</option>
                    <option value="1">★☆☆☆☆ (1/5)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Location / Drop Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Syracuse, NY (Coffee Shop bench)"
                  value={newStop.location}
                  onChange={(e) => setNewStop({ ...newStop, location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Reader Takeaway / Note</label>
                <textarea
                  rows="3"
                  placeholder="What did you think of the book or where are you passing it next?"
                  value={newStop.takeaway}
                  onChange={(e) => setNewStop({ ...newStop, takeaway: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStop}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {submittingStop ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Submit Stop</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Bookplate */}
      <div className="hidden print:block fixed inset-0 bg-white p-6">
        <div className="w-[3in] h-[3in] border-2 border-dashed border-stone-900 p-3 mx-auto flex flex-col justify-between items-center text-center">
          <div className="space-y-0.5">
            <p className="font-serif font-bold text-sm text-stone-900">Wildfire Library</p>
            <p className="text-[9px] uppercase tracking-widest text-stone-500">Books in the Wild</p>
          </div>
          <div className="my-1">
            <img src={qrCodeApiUrl} alt="Scan QR" className="w-24 h-24 mx-auto" />
          </div>
          <div className="space-y-0.5">
            <p className="font-mono font-bold text-xs text-stone-900">{displayId}</p>
            <p className="text-[8px] text-stone-600">Scan to read journey & log where you pass it</p>
          </div>
        </div>
      </div>
    </div>
  );
}
