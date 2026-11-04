'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Bookplate from '../../components/Bookplate';
import { Search, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AddBookPage() {
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Form Fields (Auto-filled by ISBN lookup, editable if needed)
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success State
  const [createdBook, setCreatedBook] = useState(null);

  // Live ISBN Lookup via Open Library API
  const handleIsbnLookup = async () => {
    const cleanedIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (!cleanedIsbn) return;

    setLookingUp(true);
    setLookupError('');

    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanedIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookData = data[`ISBN:${cleanedIsbn}`];

      if (bookData) {
        setTitle(bookData.title || '');
        if (bookData.authors && bookData.authors.length > 0) {
          setAuthor(bookData.authors.map((a) => a.name).join(', '));
        }
        if (bookData.cover && (bookData.cover.large || bookData.cover.medium)) {
          setCoverUrl(bookData.cover.large || bookData.cover.medium);
        } else {
          setCoverUrl(`https://covers.openlibrary.org/b/isbn/${cleanedIsbn}-L.jpg`);
        }
      } else {
        setLookupError('No matching book found for that ISBN. You can still enter details manually below.');
      }
    } catch (err) {
      console.error(err);
      setLookupError('Lookup failed. Please verify the ISBN or type details manually.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author) {
      alert('Please provide a title and author.');
      return;
    }

    setSubmitting(true);

    try {
      // Inserting without providing an 'id' allows the database sequence to assign the next WF-xxx ID
      const { data, error } = await supabase
        .from('books')
        .insert([
          {
            isbn: isbn.trim(),
            title: title.trim(),
            author: author.trim(),
            genre: genre,
            cover_image_url: coverUrl.trim(),
            status: 'Ready for Next Reader',
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCreatedBook(data);
    } catch (err) {
      console.error('Error inserting book:', err);
      alert(`Could not save book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* If book was successfully registered, show Bookplate print view */}
      {createdBook ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Book successfully added to the catalog!</p>
              <p className="text-xs text-emerald-800">Assigned Wildfire Identifier: <span className="font-mono font-bold">{createdBook.id}</span></p>
            </div>
          </div>

          {/* 3x3 Printable Bookplate Component */}
          <Bookplate 
            bookId={createdBook.id} 
            title={createdBook.title} 
            author={createdBook.author} 
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-stone-200 no-print">
            <button
              onClick={() => {
                setCreatedBook(null);
                setIsbn('');
                setTitle('');
                setAuthor('');
                setCoverUrl('');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              + Register Another Book
            </button>
            <Link
              href={`/book/${createdBook.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-lg transition"
            >
              <span>View Book Journey Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Intake Form */
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-stone-900">Add a Book to Wildfire</h1>
            <p className="text-stone-500 text-xs sm:text-sm">
              Enter the ISBN to autofill title, author, and cover art, or fill them in manually.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ISBN Lookup Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                ISBN Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 9780143127741"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleIsbnLookup();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  disabled={lookingUp || !isbn.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition"
                >
                  {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{lookingUp ? 'Finding...' : 'Look Up'}</span>
                </button>
              </div>
              {lookupError && (
                <p className="text-xs text-amber-600 mt-1.5">{lookupError}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Book Title *
              </label>
              <input
                type="text"
                required
                placeholder="The Great Gatsby"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Author *
              </label>
              <input
                type="text"
                required
                placeholder="F. Scott Fitzgerald"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition"
              >
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Memoir / Biography">Memoir / Biography</option>
                <option value="Sci-Fi / Fantasy">Sci-Fi / Fantasy</option>
                <option value="Mystery / Thriller">Mystery / Thriller</option>
                <option value="Personal Growth">Personal Growth</option>
                <option value="Essays / Poetry">Essays / Poetry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition"
              />
              {coverUrl && (
                <div className="mt-2 flex items-center gap-3 bg-stone-50 p-2 rounded-lg border border-stone-200">
                  <img src={coverUrl} alt="Preview" className="w-12 h-16 object-cover rounded shadow-sm" />
                  <span className="text-xs text-stone-500">Cover preview loaded</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning Wildfire ID & Creating Bookplate...</span>
                </>
              ) : (
                <span>Register Book & Generate Bookplate</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
