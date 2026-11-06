'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { BookPlus, CheckCircle2, AlertCircle, Loader2, ArrowLeft, UserCheck } from 'lucide-react';

export default function AddBookPage() {
  const router = useRouter();
  const [curator, setCurator] = useState(null);
  const [loadingCurator, setLoadingCurator] = useState(true);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseLocation, setReleaseLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [registeredBook, setRegisteredBook] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function loadCurator() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setCurator(null);
          setLoadingCurator(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, home_base')
          .eq('id', user.id)
          .maybeSingle();

        setCurator({
          id: user.id,
          email: user.email,
          displayName: profile?.display_name || user.email.split('@')[0],
          avatar: profile?.avatar_url || '🔥',
          homeBase: profile?.home_base || '',
        });

        if (profile?.home_base) {
          setReleaseLocation(profile.home_base);
        }
      } catch (err) {
        console.error('Error fetching curator profile:', err);
      } finally {
        setLoadingCurator(false);
      }
    }

    loadCurator();
  }, []);

  // Generate a random tracking code like WF-7842 if empty
  const handleGenerateTrackingCode = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setTrackingCode(`WF-${randomDigits}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const codeToUse = trackingCode.trim() || `WF-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBook = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || null,
        tracking_code: codeToUse,
        genre: genre.trim() || null,
        release_location: releaseLocation.trim() || null,
        notes: notes.trim() || null,
        user_id: curator ? curator.id : null,
        curator_name: curator ? curator.displayName : 'Anonymous Curator',
        curator_avatar: curator ? curator.avatar : '📖',
        status: 'in_the_wild',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('books')
        .insert([newBook])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setRegisteredBook(data || newBook);
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to register book. Please check database permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCurator) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-xs font-medium">Checking curator session...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      {/* Curator Banner */}
      {curator ? (
        <div className="mb-6 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-xl flex items-center justify-center shadow-sm">
              {curator.avatar}
            </span>
            <div>
              <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Registering as {curator.displayName}
              </div>
              <p className="text-[11px] text-stone-500">
                This book will be tracked under your curator profile.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            Edit
          </Link>
        </div>
      ) : (
        <div className="mb-6 bg-stone-100 border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-stone-800">Unregistered Curator</div>
            <p className="text-[11px] text-stone-500">
              Sign in to earn attribution and track journeys on your profile.
            </p>
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 bg-stone-900 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {registeredBook ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">Book Registered!</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            Write this Wildfire Tracking Code inside the front cover or on a bookmark before leaving it in the wild:
          </p>

          <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl py-3 px-6 inline-block font-mono text-xl font-bold text-stone-800 tracking-wider mb-6">
            {registeredBook.tracking_code}
          </div>

          <div className="text-xs text-stone-600 bg-stone-50 rounded-xl p-4 mb-6 text-left space-y-1">
            <div><strong>Title:</strong> {registeredBook.title}</div>
            <div><strong>Author:</strong> {registeredBook.author}</div>
            <div><strong>Curator:</strong> {registeredBook.curator_avatar} {registeredBook.curator_name}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setRegisteredBook(null);
                setTitle('');
                setAuthor('');
                setIsbn('');
                setTrackingCode('');
                setNotes('');
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition"
            >
              Register Another Book
            </button>
            <Link
              href="/catalog"
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition"
            >
              View Catalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BookPlus className="w-5 h-5 text-amber-600" />
            <h1 className="font-serif text-xl font-bold text-stone-900">Release a Book</h1>
          </div>
          <p className="text-xs text-stone-500 mb-6">
            Add a book to the library, label it with a tracking code, and set it free into the community.
          </p>

          {errorMessage && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="e.g. The Overstory"
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
                placeholder="e.g. Richard Powers"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="isbn" className="block text-xs font-semibold text-stone-700 mb-1">
                  ISBN (Optional)
                </label>
                <input
                  id="isbn"
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="e.g. 9780393356687"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-xs font-semibold text-stone-700 mb-1">
                  Genre (Optional)
                </label>
                <input
                  id="genre"
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Fiction, Nature"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="trackingCode" className="block text-xs font-semibold text-stone-700">
                  Tracking Code
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTrackingCode}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition"
                >
                  Generate random code
                </button>
              </div>
              <input
                id="trackingCode"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="e.g. WF-4821 (or leave blank to auto-generate)"
                className="w-full px-3 py-2 text-sm font-mono uppercase bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="releaseLocation" className="block text-xs font-semibold text-stone-700 mb-1">
                Release Location / Drop-off Spot
              </label>
              <input
                id="releaseLocation"
                type="text"
                value={releaseLocation}
                onChange={(e) => setReleaseLocation(e.target.value)}
                placeholder="e.g. Little Free Library on Elm St, Community Center"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-stone-700 mb-1">
                Curator Note (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why did you pick this book? Any message for the next reader?"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-amber-600 focus:bg-white outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Book...
                </>
              ) : (
                'Register & Generate Label'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
