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
  const bookIdParam = params?.id;

  const [book, setBook] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // User state
  const [currentUser, setCurrentUser] = useState(null);

  // Modal & Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingStop, setSubmittingStop] = useState(false);
  const [newStop, setNewStop] = useState({
    reader_name: '',
    reader_email: '',
    status_event: 'Just Picked Up Book',
    location: '',
    takeaway: '',
    rating: 5,
  });

  // Check auth and auto-populate user info
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();

          const userName = profile?.display_name || user.email?.split('@')[0] || '';
          const userEmail = user.email || '';

          setCurrentUser({ name: userName, email: userEmail });
          setNewStop((prev) => ({
            ...prev,
            reader_name: userName,
            reader_email: userEmail,
          }));
        }
      } catch (err) {
        console.error('Error fetching auth state:', err);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function loadBookData() {
      if (!bookIdParam) return;
      setLoading(true);
      setErrorMsg('');

      try {
        const cleanParam = decodeURIComponent(bookIdParam).trim();

        // 1. Look up book in `id` first, then `book_id`
        let { data: bookData } = await supabase
          .from('books')
          .select('*')
          .eq('id', cleanParam)
          .maybeSingle();

        if (!bookData) {
          const { data: altData } = await supabase
            .from('books')
            .select('*')
            .eq('book_id', cleanParam)
            .maybeSingle();
          bookData = altData;
        }

        if (!bookData) {
          setErrorMsg('Book not found.');
          setLoading(false);
          return;
        }

        setBook(bookData);

        // 2. Fetch journey stops safely with created_at fallback
        try {
          const targetId = bookData.id || bookData.book_id || cleanParam;
          
          let { data: stopsData, error: stopsError } = await supabase
            .from('journey_stops')
            .select('*')
            .eq('book_id', targetId)
            .order('created_at', { ascending: false });

          // If created_at is missing from schema cache, fetch unordered
          if (stopsError) {
            console.warn('Falling back to unordered stops query:', stopsError.message);
            const fallback = await supabase
              .from('journey_stops')
              .select('*')
              .eq('book_id', targetId);
            stopsData = fallback.data;
          }

          setStops(stopsData || []);
        } catch (stopErr) {
          console.warn('Could not load stops:', stopErr);
          setStops([]);
        }
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
      const activeBookId = book.id || book.book_id;
      const isJustPickedUp = newStop.status_event === 'Just Picked Up Book';

      const basePayload = {
        book_id: activeBookId,
        reader_name: newStop.reader_name.trim() || 'Anonymous Reader',
        reader_email: newStop.reader_email.trim().toLowerCase() || null,
        status_event: newStop.status_event,
        location: newStop.location.trim() || null,
        takeaway: isJustPickedUp ? null : newStop.takeaway.trim() || null,
        rating: isJustPickedUp ? null : Number(newStop.rating),
      };

      // Try inserting with created_at first; fall back if schema lacks the column
      let insertedRecord = null;
      const { data: withDateData, error: withDateError } = await supabase
        .from('journey_stops')
        .insert([{ ...basePayload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (withDateError) {
        console.warn('Failed with created_at, retrying without it:', withDateError.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('journey_stops')
          .insert([basePayload])
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        insertedRecord = fallbackData;
      } else {
        insertedRecord = withDateData;
      }

      // Update book status badge depending on event
      if (newStop.status_event === 'Ready to Pass Along') {
        await supabase
          .from('books')
          .update({ status: 'Ready for Next Reader' })
          .eq('id', book.id);

        setBook((prev) => ({ ...prev, status: 'Ready for Next Reader' }));
      } else if (newStop.status_event === 'Just Picked Up Book') {
        await supabase
          .from('books')
          .update({ status: 'Currently Reading' })
          .eq('id', book.id);

        setBook((prev) => ({ ...prev, status: 'Currently Reading' }));
      }

      setStops((prev) => [insertedRecord, ...prev]);
      setShowLogModal(false);
      setNewStop((prev) => ({
        ...prev,
        status_event: 'Just Picked Up Book',
        location: '',
        takeaway: '',
        rating: 5,
      }));
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

  const displayId = book.id || book.book_id;
  const coverImage = book.cover_image || book.cover_image_url;
  const qrTargetUrl = typeof window !== 'undefined' ? `${window.location.origin}/book/${displayId}` : `https://wildfire-library.vercel.app/book/${displayId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTargetUrl)}&margin=0`;

  const isJustPickedUp = newStop.status_event === 'Just Picked Up Book';

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
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row gap-6 items-start justify-between">
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

        {/* On-Screen QR Code Box */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shrink-0 self-center md:self-start">
          <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-2xs">
            <img 
              src={qrCodeApiUrl} 
              alt={`QR Code for ${displayId}`} 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
            />
          </div>
          <span className="font-mono text-[10px] font-bold text-stone-800 mt-2">{displayId}</span>
          <span className="text-[9px] text-stone-400">Scan to share</span>
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
            {stops.map((stop, idx) => {
              const dateDisplay = stop.created_at || stop.date 
                ? new Date(stop.created_at || stop.date).toLocaleDateString()
                : null;

              return (
                <div key={stop.id || idx} className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{stop.reader_name || 'Anonymous Reader'}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                        {stop.status_event}
                      </span>
                    </div>
                    {dateDisplay && (
                      <span className="text-[11px] text-stone-400">
                        {dateDisplay}
                      </span>
                    )}
                  </div>
                  {stop.rating && (
                    <div className="text-amber-500 text-xs">
                      {'★'.repeat(stop.rating)}{'☆'.repeat(5 - stop.rating)}
                    </div>
                  )}
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
              );
            })}
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
              {/* Name & Email (Pre-filled if logged in) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reader"
                    value={newStop.reader_name}
                    onChange={(e) => setNewStop({ ...newStop, reader_name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newStop.reader_email}
                    onChange={(e) => setNewStop({ ...newStop, reader_email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                  />
                </div>
              </div>

              {/* Status Event Selector */}
              <div>
                <label className="block font-medium text-stone-700 mb-1">Status Event</label>
                <select
                  value={newStop.status_event}
                  onChange={(e) => setNewStop({ ...newStop, status_event: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 cursor-pointer font-medium"
                >
                  <option value="Just Picked Up Book">Just Picked Up Book</option>
                  <option value="Finished Reading">Finished Reading</option>
                  <option value="Ready to Pass Along">Ready to Pass Along</option>
                </select>
              </div>

              {/* Conditional Fields: Hidden if "Just Picked Up Book" */}
              {!isJustPickedUp && (
                <>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Rating (1-5)</label>
                    <select
                      value={newStop.rating}
                      onChange={(e) => setNewStop({ ...newStop, rating: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 cursor-pointer"
                    >
                      <option value="5">★★★★★ (5/5)</option>
                      <option value="4">★★★★☆ (4/5)</option>
                      <option value="3">★★★☆☆ (3/5)</option>
                      <option value="2">★★☆☆☆ (2/5)</option>
                      <option value="1">★☆☆☆☆ (1/5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      {newStop.status_event === 'Ready to Pass Along' ? 'Drop-off Spot / Next Location' : 'Where are you reading it? (optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elm St Little Free Library or Coffee Shop bench"
                      value={newStop.location}
                      onChange={(e) => setNewStop({ ...newStop, location: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      {newStop.status_event === 'Finished Reading' ? 'Book Review & Thoughts' : 'Reader Note for Next Person'}
                    </label>
                    <textarea
                      rows="3"
                      placeholder="What resonated with you? Any favorite quotes or thoughts?"
                      value={newStop.takeaway}
                      onChange={(e) => setNewStop({ ...newStop, takeaway: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStop}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submittingStop ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{isJustPickedUp ? 'Confirm Pickup' : 'Submit Stop'}</span>
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
