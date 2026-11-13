'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import IsbnScannerModal from '../../components/IsbnScannerModal';
import { Search, BookCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Printer, ExternalLink, Camera } from 'lucide-react';

const GENRES = [
  'Fiction & Literature',
  'Non-Fiction',
  'Personal Growth / Business',
  'Mystery / Thriller',
  'Sci-Fi / Fantasy',
  'Biography / Memoir',
];

export default function AddBookPage() {
  const [curator, setCurator] = useState(null);
  const [loadingCurator, setLoadingCurator] = useState(true);

  // Form State
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [coverUrl, setCoverUrl] = useState('');
  const [releaseLocation, setReleaseLocation] = useState('');

  // Lookup, Scanner & Submit States
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredBook, setRegisteredBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [origin, setOrigin] = useState('https://wildfire-library.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    async function loadCurator() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, home_base')
            .eq('id', user.id)
            .maybeSingle();

          setCurator({
            id: user.id,
            displayName: profile?.display_name || user.email?.split('@')[0],
            avatar: profile?.avatar_url || '🔥',
          });

          if (profile?.home_base) {
            setReleaseLocation(profile.home_base);
          }
        }
      } catch (err) {
        console.error('Error loading curator:', err);
      } finally {
        setLoadingCurator(false);
      }
    }

    loadCurator();
  }, []);

  const handleLookupIsbn = useCallback(async (overrideIsbn) => {
    const rawValue = typeof overrideIsbn === 'string' ? overrideIsbn : isbn;
    const cleanedIsbn = rawValue.replace(/[^0-9X]/gi, '').trim();
    if (!cleanedIsbn) {
      setLookupMessage({ type: 'error', text: 'Please enter a valid ISBN.' });
      return;
    }

    setLookingUp(true);
    setLookupMessage(null);

    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanedIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookData = data[`ISBN:${cleanedIsbn}`];

      if (bookData) {
        setTitle(bookData.title || '');
        if (bookData.authors && bookData.authors.length > 0) {
          setAuthor(bookData.authors.map((a) => a.name).join(', '));
        }
        if (bookData.cover?.large || bookData.cover?.medium) {
          setCoverUrl(bookData.cover.large || bookData.cover.medium);
        } else {
          setCoverUrl('');
        }
        setLookupMessage({ type: 'success', text: 'Book details and cover found!' });
      } else {
        setLookupMessage({
          type: 'error',
          text: 'Book not found automatically. You can enter the title and author manually.',
        });
      }
    } catch (err) {
      console.error('ISBN lookup error:', err);
      setLookupMessage({ type: 'error', text: 'Could not fetch book details. Please fill in below.' });
    } finally {
      setLookingUp(false);
    }
  }, [isbn]);

  const handleScanSuccess = useCallback((scannedCode) => {
    setIsbn(scannedCode);
    handleLookupIsbn(scannedCode);
  }, [handleLookupIsbn]);

  const handleCloseScanner = useCallback(() => {
    setScannerOpen(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const generatedBookId = `WF-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBook = {
        book_id: generatedBookId,
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || null,
        genre: genre,
        cover_image: coverUrl || null,
        release_location: releaseLocation.trim() || null,
        user_id: curator ? curator.id : null,
        curator_name: curator ? curator.displayName : 'Anonymous Curator',
        curator_avatar: curator ? curator.avatar : '📖',
        status: 'Ready for Next Reader',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('books')
        .insert([newBook])
        .select()
        .single();

      if (error) throw error;

      setRegisteredBook(data || newBook);
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to register book.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCurator) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-xs font-medium">Loading...</span>
      </div>
    );
  }

  const bookIdToDisplay = registeredBook?.book_id || '';
  const trackingUrl = bookIdToDisplay ? `${origin}/book/${bookIdToDisplay}` : '';
  const qrCodeUrl = trackingUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}`
    : '';

  return (
    <>
      {/* Print-specific style: isolates the 3x3 plate and hides everything else */}
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

      <div className="max-w-lg mx-auto py-10 px-4 sm:px-6">
        <div className="no-print">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {registeredBook ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
            <div className="no-print">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">Book Registered!</h2>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                Print this 3" × 3" bookplate to stick inside the front cover before releasing it.
              </p>
            </div>

            {/* The 3x3 Bookplate Container */}
            <div
              id="print-plate"
              className="bg-amber-50/60 border-2 border-stone-800 rounded-2xl p-4 mb-6 max-w-[280px] mx-auto text-center shadow-sm"
            >
              <div>
                <div className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center justify-center gap-1">
                  <span>🔥</span> Wildfire Library
                </div>
                <p className="text-[10px] text-stone-600 tracking-tight">Read • Log Journey • Pass Along</p>
              </div>

              {/* QR Code scaled for 3in dimension */}
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

            {/* Metadata (Visible on screen only; hidden when printed) */}
            <div className="no-print text-xs text-stone-600 bg-stone-50 rounded-xl p-4 mb-6 text-left space-y-1">
              <div><strong>Title:</strong> {registeredBook.title}</div>
              <div><strong>Author:</strong> {registeredBook.author}</div>
              <div><strong>Genre:</strong> {registeredBook.genre}</div>
              <div><strong>Book ID:</strong> {registeredBook.book_id}</div>
              <div><strong>Curator:</strong> {registeredBook.curator_avatar} {registeredBook.curator_name}</div>
            </div>

            {/* Action Buttons */}
            <div className="no-print flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print 3" × 3" Bookplate
              </button>
              <button
                onClick={() => {
                  setRegisteredBook(null);
                  setIsbn('');
                  setTitle('');
                  setAuthor('');
                  setCoverUrl('');
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Register Another Book
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1"
              >
                Catalog
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookCheck className="w-5 h-5 text-amber-600" />
              <h1 className="font-serif text-xl font-bold text-stone-900">Release a Book</h1>
            </div>
            <p className="text-xs text-stone-500 mb-6">
              Enter the ISBN to autofill details and cover art, choose a genre, and generate a Book ID.
            </p>

            {errorMessage && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ISBN Search Bar */}
            <div className="mb-6">
              <label htmlFor="isbn" className="block text-xs font-semibold text-stone-700 mb-1">
                ISBN Number
              </label>
              <div className="flex gap-2">
                <input
                  id="isbn"
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Scan or enter 10 or 13-digit ISBN"
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="sm:hidden px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  aria-label="Scan ISBN barcode with camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan
                </button>
                <button
                  type="button"
                  onClick={() => handleLookupIsbn()}
                  disabled={lookingUp || !isbn.trim()}
                  className="px-4 py-2 bg-stone-900 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {lookingUp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  Check ISBN
                </button>
              </div>
              {lookupMessage && (
                <p className={`mt-2 text-xs ${lookupMessage.type === 'success' ? 'text-emerald-600' : 'text-stone-500'}`}>
                  {lookupMessage.text}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 items-start">
                {coverUrl ? (
                  <div className="w-24 h-36 shrink-0 rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100 relative">
                    <img
                      src={coverUrl}
                      alt="Book Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-36 shrink-0 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center p-2 text-center text-stone-400">
                    <span className="text-xl mb-1">📖</span>
                    <span className="text-[10px] leading-tight">Cover preview</span>
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold text-stone-700 mb-1">
                      Book Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Auto-fills from ISBN"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="author" className="block text-xs font-semibold text-stone-700 mb-1">
                      Author *
                    </label>
                    <input
                      id="author"
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Auto-fills from ISBN"
                      className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="genre" className="block text-xs font-semibold text-stone-700 mb-1">
                  Genre *
                </label>
                <select
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="releaseLocation" className="block text-xs font-semibold text-stone-700 mb-1">
                  Drop-off Spot / Release Location (Optional)
                </label>
                <input
                  id="releaseLocation"
                  type="text"
                  value={releaseLocation}
                  onChange={(e) => setReleaseLocation(e.target.value)}
                  placeholder="e.g. Elm St Little Library, Coffee Shop"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !title.trim() || !author.trim()}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Registering Book...
                  </>
                ) : (
                  'Register & Generate Book ID / QR'
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Camera ISBN Scanner Modal */}
      <IsbnScannerModal
        isOpen={scannerOpen}
        onClose={handleCloseScanner}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
