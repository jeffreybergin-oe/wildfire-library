'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Search, Loader2, BookOpen, Printer, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';

export default function AddBookPage() {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredBook, setRegisteredBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch metadata from Open Library API
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!isbn.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setBookData(null);

    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookKey = `ISBN:${cleanIsbn}`;

      if (data && data[bookKey]) {
        const info = data[bookKey];
        setBookData({
          isbn: cleanIsbn,
          title: info.title || 'Untitled',
          author: info.authors ? info.authors.map((a) => a.name).join(', ') : 'Unknown Author',
          cover_image_url: info.cover?.large || info.cover?.medium || info.cover?.small || '',
          genre: info.subjects ? info.subjects.slice(0, 3).map((s) => s.name).join(', ') : 'General Literature',
        });
      } else {
        setErrorMessage('No book found matching that ISBN. You can still enter details manually below.');
        setBookData({
          isbn: cleanIsbn,
          title: '',
          author: '',
          cover_image_url: '',
          genre: '',
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to connect to book database. Please enter details manually.');
      setBookData({
        isbn: cleanIsbn,
        title: '',
        author: '',
        cover_image_url: '',
        genre: '',
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate next WF-xxx ID and save book into Supabase
  const handleRegisterBook = async () => {
    if (!bookData.title.trim()) {
      alert('Please provide at least a title for the book.');
      return;
    }

    setSubmitting(true);

    try {
      // Check current user session for attribution
      const { data: { user } } = await supabase.auth.getUser();

      // Find the highest WF- number to auto-increment
      const { data: latestBooks, error: fetchError } = await supabase
        .from('books')
        .select('id')
        .like('id', 'WF-%')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let nextNumber = 1;
      if (latestBooks && latestBooks.length > 0) {
        const lastId = latestBooks[0].id;
        const numPart = parseInt(lastId.replace('WF-', ''), 10);
        if (!isNaN(numPart)) {
          nextNumber = numPart + 1;
        }
      }

      const assignedId = `WF-${String(nextNumber).padStart(3, '0')}`;

      // Insert book record into Supabase
      const { error: insertError } = await supabase.from('books').insert([
        {
          id: assignedId,
          isbn: bookData.isbn || null,
          title: bookData.title.trim(),
          author: bookData.author.trim() || 'Unknown',
          cover_image_url: bookData.cover_image_url || null,
          genre: bookData.genre || 'Literature',
          status: 'Ready for Next Reader',
          registered_by_user_id: user?.id || null,
          registered_by_name: user?.user_metadata?.full_name || user?.email || 'Wildfire Community',
        },
      ]);

      if (insertError) throw insertError;

      setRegisteredBook({
        id: assignedId,
        ...bookData,
      });
    } catch (err) {
      console.error(err);
      alert(`Could not save book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Print-Only Style Hook */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding-top: 2rem;
          }
        }
      `}</style>

      {/* Confirmation State: Book Registered & Printable Badge */}
      {registeredBook ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-sm">Book Registered Successfully!</p>
              <p className="text-emerald-700">Assigned identifier: <strong className="font-mono">{registeredBook.id}</strong></p>
            </div>
          </div>

          <div id="print-area">
            {/* Official 3x3 Bookplate Cutout with Logo & High-Res QR */}
            <div
              id="bookplate-badge"
              className="w-full max-w-[320px] mx-auto aspect-square bg-[#fdfbf7] border-2 border-dashed border-stone-800 rounded-xl p-5 flex flex-col justify-between text-center shadow-sm select-none"
            >
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1.5 text-stone-900">
                  <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
                  <h2 className="font-serif font-black text-xl sm:text-2xl tracking-tight leading-none text-stone-900">
                    Wildfire Library
                  </h2>
                </div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-stone-600 font-semibold">
                  A Community Traveling Book
                </p>
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <div className="p-2.5 bg-white border border-stone-300 rounded-xl shadow-xs">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://wildfirelibrary.com'}/book/${registeredBook.id}`}
                    size={144}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ea580c" stroke="%23ffffff" stroke-width="1.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                </div>
                <span className="font-mono text-xs font-black tracking-wider text-stone-900 mt-2 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200">
                  {registeredBook.id}
                </span>
              </div>

              <div className="space-y-1 border-t border-stone-200 pt-2">
                <p className="text-[11px] font-bold text-stone-900 leading-tight">
                  Scan to Log • Read • Pass Along
                </p>
                <p className="text-[9px] text-stone-500 font-sans leading-none">
                  Free to read. Never hoard or sell.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bookplate (3×3)</span>
            </button>
            <Link
              href={`/book/${registeredBook.id}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition"
            >
              <span>View Journey Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setRegisteredBook(null);
                setBookData(null);
                setIsbn('');
              }}
              type="button"
              className="text-xs text-stone-500 hover:underline"
            >
              Register another book
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">Register a Traveling Book</h1>
            <p className="text-xs text-stone-500 mt-1">
              Enter an ISBN barcode number to pull metadata automatically, or enter the book details by hand.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter ISBN (e.g. 9780143127741)"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Look Up</span>
            </button>
          </form>

          {errorMessage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              {errorMessage}
            </p>
          )}

          {bookData && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Confirm Book Details
              </h2>

              <div className="flex gap-4 items-start">
                <div className="w-20 aspect-[2/3] bg-stone-100 rounded border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {bookData.cover_image_url ? (
                    <img src={bookData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-stone-400" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Title *</label>
                    <input
                      type="text"
                      required
                      value={bookData.title}
                      onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Author</label>
                    <input
                      type="text"
                      value={bookData.author}
                      onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Genre / Subject</label>
                    <input
                      type="text"
                      value={bookData.genre}
                      onChange={(e) => setBookData({ ...bookData, genre: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleRegisterBook}
                disabled={submitting}
                type="button"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering book...</span>
                  </>
                ) : (
                  <span>Register Book & Generate Bookplate</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
