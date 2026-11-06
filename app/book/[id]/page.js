'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, MapPin, Check, Loader2, BookMarked, CheckCircle2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active user action: 'pickup' | 'finish' | null
  const [selectedAction, setSelectedAction] = useState(null);

  // Form State
  const [readerName, setReaderName] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [rating, setRating] = useState(5);
  const [takeaway, setTakeaway] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Check for logged-in curator/user to pre-fill info
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, home_base')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.display_name || user.email) {
            setReaderName(profile?.display_name || user.email.split('@')[0]);
          }
          if (profile?.home_base) {
            setLocationCity(profile.home_base);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    loadUser();
  }, []);

  const loadBookData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      let { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('book_id', id)
        .maybeSingle();

      if (!bookData && !bookError) {
        const fallback = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        bookData = fallback.data;
      }

      if (bookData) {
        setBook(bookData);

        const queryId = bookData.book_id || bookData.id;
        const { data: stopData, error: stopError } = await supabase
          .from('journey_stops')
          .select('*')
          .eq('book_id', queryId)
          .order('created_at', { ascending: false });

        if (!stopError) {
          setStops(stopData || []);
        }
      }
    } catch (err) {
      console.error('Error loading book journey:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!readerName.trim()) {
      alert('Please enter your name or reader handle.');
      return;
    }
    setSubmitting(true);

    const isPickup = selectedAction === 'pickup';
    const locValue = locationCity.trim() || (isPickup ? 'Reading nearby' : 'Passed Along');
    const targetBookId = book?.book_id || book?.id || id;

    try {
      const { error: stopError } = await supabase.from('journey_stops').insert([
        {
          book_id: targetBookId,
          reader_name: readerName.trim(),
          location: locValue,
          location_city: locValue,
          status_event: isPickup ? 'Picked Up' : 'Finished & Passed',
          rating: isPickup ? null : rating,
          takeaway: isPickup ? null : takeaway.trim(),
        },
      ]);
      if (stopError) throw stopError;

      const newStatus = isPickup ? 'Being Read' : 'Ready for Next Reader';
      const { error: bookError } = await supabase
        .from('books')
        .update({ status: newStatus })
        .eq('id', book.id);

      if (bookError) throw bookError;

      setActionSuccess(
        isPickup
          ? 'Happy reading! Come back and scan this page when you are ready to pass it on.'
          : "Thank you for leaving your review! Your stop has been logged into this book's journey."
      );

      setSelectedAction(null);
      setTakeaway('');
      loadBookData();
    } catch (err) {
      console.error(err);
      alert(`Error updating book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-sm flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span>Loading book journey...</span>
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

  const bookIdToDisplay = book.book_id || book.id;
  const coverImage = book.cover_image || book.cover_image_url;
  const trackingUrl = `https://wildfire-library.vercel.app/book/${bookIdToDisplay}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}`;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-plate, #print-plate * {
            visibility: visible !important;
          }
          #print-plate {
            position: absolute !important;
            left: 0.5in !important;
            top: 0.5in !important;
            width: 3in !important;
            height: 3in !important;
            max-width: 3in !important;
            max-height: 3in !important;
            padding: 0.15in !important;
            border: 2px dashed #1c1917 !important;
            border-radius: 12px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-8 px-4 py-8">
        <div className="no-print">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Library Catalog
          </Link>
        </div>

        {/* Book Summary Card */}
        <div className="no-print bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-28 sm:w-36 flex-shrink-0 aspect-[2/3] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center">
            {coverImage ? (
              <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-10 h-10 text-stone-400" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2 py-0.5 rounded-md">
                {bookIdToDisplay}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  book.status === 'Ready for Next Reader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {book.status || 'In the Wild'}
              </span>
              {book.genre && (
                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {book.genre}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
              {book.title}
            </h1>
            <p className="text-sm font-medium text-stone-600">by {book.author}</p>
            <p className="text-xs text-stone-500 pt-1">
              Tracked {stops.length} journey {stops.length === 1 ? 'stop' : 'stops'} so far.
            </p>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition cursor-pointer border border-stone-200"
              >
                <Printer className="w-3.5 h-3.5" />
                Print 3" × 3" Bookplate
              </button>
            </div>
          </div>
        </div>

        {/* 3x3 Bookplate Container */}
        <div className="no-print bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
          <p className="text-xs font-semibold text-stone-700 mb-3">Bookplate &amp; QR Sticker</p>
          <div
            id="print-plate"
            className="bg-amber-50/60 border-2 border-stone-800 rounded-2xl p-4 max-w-[280px] mx-auto text-center shadow-xs"
          >
            <div>
              <div className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center justify-center gap-1">
                <span>🔥</span> Wildfire Library
              </div>
              <p className="text-[10px] text-stone-600 tracking-tight">Read • Log Journey • Pass Along</p>
            </div>

            <div className="bg-white p-2 rounded-xl border border-stone-200 inline-block shadow-xs my-2 print:my-1">
              <img
                src={qrCodeUrl}
                alt={`QR code for ${bookIdToDisplay}`}
                className="w-32 h-32 print:w-28 print:h-28 object-contain mx-auto"
              />
            </div>

            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Book ID</div>
              <div className="font-mono text-lg print:text-base font-extrabold tracking-widest text-stone-900">
                {bookIdToDisplay}
              </div>
              <p className="text-[9px] text-stone-400 font-mono tracking-tighter">wildfire-library.vercel.app</p>
            </div>
          </div>
        </div>

        {/* Success Notification */}
        {actionSuccess && (
          <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action Selector: Two Choices */}
        <div className="no-print bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Are you currently holding this book?</h2>
            <p className="text-xs text-stone-400 mt-1">
              Log your reading progress to keep the community journey map alive. No login needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedAction('pickup')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                selectedAction === 'pickup'
                  ? 'bg-amber-600 border-amber-500 text-white shadow'
                  : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-750'
              }`}
            >
              <BookMarked className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">I just picked this up</p>
                <p className="text-[11px] text-stone-300 mt-0.5">Let others know this book is actively being read.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction('finish')}
              className={`p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                selectedAction === 'finish'
                  ? 'bg-amber-600 border-amber-500 text-white shadow'
                  : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-750'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">I just finished it</p>
                <p className="text-[11px] text-stone-300 mt-0.5">Leave a rating and note for the next reader.</p>
              </div>
            </button>
          </div>

          {/* Dynamic Sub-Question Form */}
          {selectedAction && (
            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 border-t border-stone-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-300 mb-1">Your Name or Reader Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex S."
                    value={readerName}
                    onChange={(e) => setReaderName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-300 mb-1">
                    {selectedAction === 'pickup' ? 'Where are you reading it?' : 'Where are you passing it?'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salt City Market or Syracuse, NY"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {selectedAction === 'finish' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-stone-300 mb-1">Your Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full sm:w-auto px-3 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none cursor-pointer"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (Loved it)</option>
                      <option value={4}>⭐⭐⭐⭐ (Great read)</option>
                      <option value={3}>⭐⭐⭐ (Good)</option>
                      <option value={2}>⭐⭐ (Not for me)</option>
                      <option value={1}>⭐ (Struggled to finish)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-300 mb-1">
                      Favorite quote, takeaway, or note to the next reader (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="What did you think of the ending? Any quote that stuck with you?"
                      value={takeaway}
                      onChange={(e) => setTakeaway(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs text-stone-900 bg-white rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging your stop...</span>
                  </>
                ) : (
                  <span>
                    {selectedAction === 'pickup'
                      ? 'Start Reading & Mark "Being Read"'
                      : 'Submit Review & Mark "Ready for Next Reader"'}
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Journey Timeline History */}
        <div className="no-print space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-900">Book Journey History</h2>
          {stops.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-xs text-stone-500">
              This book is at the start of its journey. Be the first to log a stop!
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop) => (
                <div key={stop.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-2">
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

                  {(stop.location || stop.location_city) && (
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{stop.location || stop.location_city}</span>
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
    </>
  );
}
