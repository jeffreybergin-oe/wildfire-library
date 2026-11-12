'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getBookSynopsis } from '../../../lib/bookSynopsis';
import { 
  ArrowLeft, 
  BookOpen, 
  MapPin, 
  Printer, 
  Loader2, 
  PlusCircle, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';

const JourneyMap = dynamic(() => import('../../../components/JourneyMap'), {
  ssr: false,
});

export default function BookDetailPage() {
  const params = useParams();
  const bookIdParam = params?.id;

  const [book, setBook] = useState(null);
  const [synopsis, setSynopsis] = useState(null);
  const [showSynopsis, setShowSynopsis] = useState(false);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // User state
  const [currentUser, setCurrentUser] = useState(null);

  // Log Stop Modal & Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingStop, setSubmittingStop] = useState(false);
  const [newStop, setNewStop] = useState({
    reader_name: '',
    reader_email: '',
    status_event: 'Just Picked Up Book',
    location: '',
    takeaway: '',
    rating: 5,
    followBook: true,
  });

  // Request Book Modal & Form State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requester_name: '',
    requester_email: '',
    message: '',
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
          setRequestForm((prev) => ({
            ...prev,
            requester_name: userName,
            requester_email: userEmail,
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

        // Fetch synopsis (use saved value if present, otherwise look up by ISBN)
        if (bookData.synopsis) {
          setSynopsis(bookData.synopsis);
        } else if (bookData.isbn) {
          getBookSynopsis(bookData.isbn).then((text) => {
            if (text) setSynopsis(text);
          });
        }

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

      // Geocode location text via OpenStreetMap Nominatim (free, no key needed)
      let lat = null;
      let lng = null;
      if (newStop.location.trim()) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              newStop.location.trim()
            )}&limit=1`
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
        } catch (geoErr) {
          console.warn('Geocoding skipped:', geoErr);
        }
      }

      const basePayload = {
        book_id: activeBookId,
        reader_name: newStop.reader_name.trim() || 'Anonymous Reader',
        reader_email: newStop.reader_email.trim().toLowerCase() || null,
        status_event: newStop.status_event,
        location: newStop.location.trim() || null,
        lat,
        lng,
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
      if (
        newStop.status_event === 'Ready to Pass Along' ||
        newStop.status_event === 'Finished Reading'
      ) {
        await supabase
          .from('books')
          .update({ status: 'Ready for Next Reader' })
          .eq('id', book.id);

        setBook((prev) => ({ ...prev, status: 'Ready for Next Reader' }));
      } else if (newStop.status_event === 'Just Picked Up Book') {
        await supabase
          .from('books')
          .update({ status: 'Currently Being Read' })
          .eq('id', book.id);

        setBook((prev) => ({ ...prev, status: 'Currently Being Read' }));
      }

      setStops((prev) => [insertedRecord, ...prev]);

      // Save follower if they opted in with an email
      if (newStop.followBook && newStop.reader_email.trim()) {
        await supabase
          .from('book_followers')
          .upsert(
            {
              book_id: activeBookId,
              email: newStop.reader_email.trim().toLowerCase(),
            },
            { onConflict: 'book_id,email' }
          );
      }

      // Notify existing followers in the background
      fetch('/api/notify-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: activeBookId,
          book_title: book.title,
          status_event: newStop.status_event,
          location: newStop.location.trim(),
          reader_name: newStop.reader_name.trim() || 'A reader',
          reader_email: newStop.reader_email.trim().toLowerCase(),
        }),
      }).catch((err) => console.error('Follower notification error:', err));

      setShowLogModal(false);
      setNewStop((prev) => ({
        ...prev,
        status_event: 'Just Picked Up Book',
        location: '',
        takeaway: '',
        rating: 5,
        followBook: true,
      }));
    } catch (err) {
      console.error('Error logging journey stop:', err);
      alert(err.message || 'Error recording stop.');
    } finally {
      setSubmittingStop(false);
    }
  };

  const handleRequestBook = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);

    try {
      const res = await fetch('/api/request-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id || book.book_id,
          book_title: book.title,
          requester_name: requestForm.requester_name.trim(),
          requester_email: requestForm.requester_email.trim().toLowerCase(),
          message: requestForm.message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send book request.');
      }

      setRequestSuccess(true);
      setRequestForm((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      console.error('Error requesting book:', err);
      alert(err.message || 'Failed to send request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Helper for distinct status badge colors (matches homepage catalog)
  const getStatusBadgeStyle = (status) => {
    if (status === 'Ready for Next Reader') {
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    }
    if (status === 'Currently Being Read') {
      return 'bg-amber-100 text-amber-900 border border-amber-200';
    }
    return 'bg-stone-100 text-stone-600 border border-stone-200';
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-600 text-sm flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span>Loading book journey...</span>
      </div>
    );
  }

  if (errorMsg || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-900 text-base font-semibold">{errorMsg || 'Book not found'}</p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const displayId = book.id || book.book_id;
  const coverImage = book.cover_image || book.cover_image_url;
  const currentStatus = book.status || 'Not Released';
  const qrTargetUrl = typeof window !== 'undefined' ? `${window.location.origin}/book/${displayId}` : `https://wildfire-library.vercel.app/book/${displayId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTargetUrl)}&margin=0`;

  const isJustPickedUp = newStop.status_event === 'Just Picked Up Book';
  const isReadyForNext = currentStatus === 'Ready for Next Reader';
  const hasMappedStops = stops.some((s) => typeof s.lat === 'number' && typeof s.lng === 'number');

  // Quick Stats Calculations
  const uniqueLocations = new Set(
    stops
      .map((s) => s.location?.trim().toLowerCase())
      .filter(Boolean)
  );
  const ratedStops = stops.filter((s) => typeof s.rating === 'number' && s.rating > 0);
  const avgRating =
    ratedStops.length > 0
      ? (ratedStops.reduce((sum, s) => sum + s.rating, 0) / ratedStops.length).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Catalog</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>Print Bookplate</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRequestSuccess(false);
              setShowRequestModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              isReadyForNext
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Request Book</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              isReadyForNext
                ? 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-700'
                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Reading Stop</span>
          </button>
        </div>
      </div>

      {/* Book Info Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-5 sm:gap-6 items-start justify-between">
        <div className="flex items-start gap-4 sm:gap-6 flex-1 w-full">
          <div className="w-24 sm:w-32 aspect-[2/3] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center shrink-0">
            {coverImage ? (
              <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-8 h-8 text-stone-300" />
            )}
          </div>

          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-stone-900 text-white px-2.5 py-0.5 rounded">
                {displayId}
              </span>
              <span className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadgeStyle(currentStatus)}`}>
                {currentStatus}
              </span>
              {book.genre && (
                <span className="text-xs sm:text-sm text-stone-600 border border-stone-200 bg-stone-50 px-2.5 py-0.5 rounded-md">
                  {book.genre}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 leading-snug">{book.title}</h1>
              <p className="text-sm sm:text-base text-stone-600 mt-0.5">by {book.author}</p>
            </div>
            <div className="pt-2.5 border-t border-stone-100 flex flex-wrap gap-y-2 gap-x-5 text-xs sm:text-sm text-stone-600">
              <div>
                <span className="text-stone-400">Released by: </span>
                <span className="text-stone-800 font-medium">{book.curator_name || 'Reader'}</span>
              </div>
              {book.release_location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{book.release_location}</span>
                </div>
              )}
              {book.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{new Date(book.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* On-Screen QR Code Box (Desktop only) */}
        <div className="hidden md:flex bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex-col items-center justify-center text-center shrink-0 self-start">
          <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-2xs">
            <img 
              src={qrCodeApiUrl} 
              alt={`QR Code for ${displayId}`} 
              className="w-24 h-24 object-contain" 
            />
          </div>
          <span className="font-mono text-xs font-bold text-stone-800 mt-2">{displayId}</span>
          <span className="text-[11px] text-stone-500">Scan to share</span>
        </div>
      </div>

      {/* Collapsible Book Synopsis */}
      {synopsis && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowSynopsis(!showSynopsis)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <h2 className="font-serif font-bold text-lg text-stone-900">About This Book</h2>
            {showSynopsis ? (
              <ChevronUp className="w-5 h-5 text-stone-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-500" />
            )}
          </button>
          {showSynopsis && (
            <p className="mt-3 pt-3 border-t border-stone-100 text-sm sm:text-base leading-relaxed text-stone-700">
              {synopsis}
            </p>
          )}
        </div>
      )}

      {/* Journey Stops Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200">
          <div>
            <h2 className="font-serif font-bold text-xl text-stone-900">Book Journey</h2>
            <p className="text-xs sm:text-sm text-stone-600">Tracking every hand and location this copy travels through.</p>
          </div>
          <span className="text-xs sm:text-sm font-mono font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
            {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
          </span>
        </div>

        {/* Quick Stats + Mini Journey Map */}
        {stops.length > 0 && (
          <div className={`grid grid-cols-1 gap-4 ${hasMappedStops ? 'md:grid-cols-3' : ''}`}>
            <div className={`grid gap-3 ${hasMappedStops ? 'grid-cols-3 md:grid-cols-1' : 'grid-cols-3'}`}>
              <div className="bg-white border border-stone-200 rounded-xl p-3.5 text-center shadow-2xs flex flex-col justify-center">
                <p className="text-xl font-bold font-mono text-stone-900">{stops.length}</p>
                <p className="text-xs font-medium text-stone-600 mt-0.5">Total Stops</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-3.5 text-center shadow-2xs flex flex-col justify-center">
                <p className="text-xl font-bold font-mono text-stone-900">{uniqueLocations.size}</p>
                <p className="text-xs font-medium text-stone-600 mt-0.5">Places Visited</p>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-3.5 text-center shadow-2xs flex flex-col justify-center">
                <p className="text-xl font-bold font-mono text-stone-900">
                  {avgRating ? `${avgRating} ★` : '—'}
                </p>
                <p className="text-xs font-medium text-stone-600 mt-0.5">Avg Rating</p>
              </div>
            </div>

            {hasMappedStops && (
              <div className="md:col-span-2">
                <JourneyMap stops={stops} />
              </div>
            )}
          </div>
        )}

        {stops.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-stone-600 text-sm">
            No journey stops logged yet. Scan the bookplate QR code to record the first stop!
          </div>
        ) : (
          /* Visual Timeline */
          <div className="relative pl-6 ml-2 border-l-2 border-stone-200 space-y-4">
            {stops.map((stop, idx) => {
              const dateDisplay = stop.created_at || stop.date 
                ? new Date(stop.created_at || stop.date).toLocaleDateString()
                : null;

              const dotColor =
                stop.status_event === 'Ready to Pass Along'
                  ? 'bg-emerald-500'
                  : stop.status_event === 'Just Picked Up Book'
                  ? 'bg-amber-500'
                  : 'bg-stone-500';

              const eventBadgeStyle =
                stop.status_event === 'Ready to Pass Along'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : stop.status_event === 'Just Picked Up Book'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-stone-100 text-stone-700 border border-stone-200';

              return (
                <div key={stop.id || idx} className="relative">
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-xs ${dotColor}`}
                  />
                  <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-stone-900">{stop.reader_name || 'Anonymous Reader'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventBadgeStyle}`}>
                          {stop.status_event}
                        </span>
                      </div>
                      {dateDisplay && (
                        <span className="text-xs text-stone-500">
                          {dateDisplay}
                        </span>
                      )}
                    </div>
                    {stop.rating && (
                      <div className="text-amber-500 text-sm tracking-wide">
                        {'★'.repeat(stop.rating)}{'☆'.repeat(5 - stop.rating)}
                      </div>
                    )}
                    {stop.location && (
                      <p className="text-stone-600 flex items-center gap-1.5 text-xs sm:text-sm">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{stop.location}</span>
                      </p>
                    )}
                    {stop.takeaway && (
                      <blockquote className="text-stone-700 italic bg-stone-50 border-l-2 border-amber-500 py-2 px-3.5 rounded-r-lg text-sm leading-relaxed">
                        &ldquo;{stop.takeaway}&rdquo;
                      </blockquote>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Book Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <h3 className="font-serif font-bold text-lg text-stone-900">Request This Book</h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-stone-400 hover:text-stone-700 text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {requestSuccess ? (
              <div className="space-y-4 py-2 text-sm text-stone-700">
                <p className="text-base font-semibold text-emerald-700">Request sent!</p>
                <p className="leading-relaxed">
                  We&apos;ve emailed the current holder of <strong>{book.title}</strong> with your message. If they&apos;re ready to pass it along, they can reply directly to your email to coordinate the handoff.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestBook} className="space-y-3.5 text-sm">
                <p className="text-stone-600 leading-relaxed">
                  Send a note to the current reader of <strong>{book.title}</strong>. Your email is only shared with them so they can reply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={requestForm.requester_name}
                      onChange={(e) => setRequestForm({ ...requestForm, requester_name: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={requestForm.requester_email}
                      onChange={(e) => setRequestForm({ ...requestForm, requester_email: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Message</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Where are you located, and how would you like to coordinate pickup or shipping?"
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-3.5 py-2 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-xs"
                  >
                    {submittingRequest ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <h3 className="font-serif font-bold text-lg text-stone-900">Log Reading Stop</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-stone-400 hover:text-stone-700 text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogStop} className="space-y-3.5 text-sm">
              {/* Name & Email (Pre-filled if logged in) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reader"
                    value={newStop.reader_name}
                    onChange={(e) => setNewStop({ ...newStop, reader_name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newStop.reader_email}
                    onChange={(e) => setNewStop({ ...newStop, reader_email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                  />
                </div>
              </div>

              {/* Status Event Selector */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status Event</label>
                <select
                  value={newStop.status_event}
                  onChange={(e) => setNewStop({ ...newStop, status_event: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900 cursor-pointer font-medium"
                >
                  <option value="Just Picked Up Book">Just Picked Up Book</option>
                  <option value="Finished Reading">Finished Reading</option>
                  <option value="Ready to Pass Along">Ready to Pass Along</option>
                </select>
              </div>

              {/* Location (Always visible so pickups also appear on the map) */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {isJustPickedUp
                    ? 'Where did you find it? (City or Spot)'
                    : newStop.status_event === 'Ready to Pass Along'
                    ? 'Drop-off Spot / Next Location'
                    : 'Where are you reading it? (optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Syracuse, NY or Elm St Little Free Library"
                  value={newStop.location}
                  onChange={(e) => setNewStop({ ...newStop, location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                />
              </div>

              {/* Conditional Fields: Hidden if "Just Picked Up Book" */}
              {!isJustPickedUp && (
                <>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Rating (1-5)</label>
                    <select
                      value={newStop.rating}
                      onChange={(e) => setNewStop({ ...newStop, rating: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900 cursor-pointer"
                    >
                      <option value="5">★★★★★ (5/5)</option>
                      <option value="4">★★★★☆ (4/5)</option>
                      <option value="3">★★★☆☆ (3/5)</option>
                      <option value="2">★★☆☆☆ (2/5)</option>
                      <option value="1">★☆☆☆☆ (1/5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      {newStop.status_event === 'Finished Reading' ? 'Book Review & Thoughts' : 'Reader Note for Next Person'}
                    </label>
                    <textarea
                      rows="3"
                      placeholder="What resonated with you? Any favorite quotes or thoughts?"
                      value={newStop.takeaway}
                      onChange={(e) => setNewStop({ ...newStop, takeaway: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base sm:text-sm text-stone-900"
                    />
                  </div>
                </>
              )}

              {/* Follow This Book Checkbox */}
              {newStop.reader_email.trim() && (
                <label className="flex items-center gap-2.5 text-stone-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newStop.followBook}
                    onChange={(e) => setNewStop({ ...newStop, followBook: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Email me when this book moves to its next stop</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStop}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
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

      {/* Printable 3" x 3" Bookplate */}
      <div className="hidden print:block fixed inset-0 bg-white p-6">
        <div className="w-[3in] h-[3in] border-2 border-dashed border-stone-900 p-3 mx-auto flex flex-col justify-between items-center text-center">
          <div className="w-full space-y-1">
            <img
              src="/WF_Main_Logo.png"
              alt="Wildfire Library"
              className="h-9 w-auto mx-auto object-contain"
            />
            <div className="pt-0.5 border-t border-stone-200">
              <p className="font-serif font-bold text-[11px] text-stone-900 line-clamp-1 leading-tight">
                {book.title}
              </p>
              <p className="text-[9px] text-stone-600 line-clamp-1">
                by {book.author}
              </p>
            </div>
          </div>

          <div className="my-0.5">
            <img src={qrCodeApiUrl} alt="Scan QR" className="w-20 h-20 mx-auto" />
          </div>

          <div className="space-y-0.5">
            <p className="font-mono font-bold text-[11px] text-stone-900">{displayId}</p>
            <p className="text-[8px] text-stone-600 leading-tight">
              Scan to read journey &amp; log where you pass it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
