'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  BookOpen, 
  MapPin, 
  BookMarked, 
  Printer, 
  Loader2, 
  Flame, 
  ArrowLeft,
  Calendar,
  Star
} from 'lucide-react';

export default function ReaderProfilePage() {
  const params = useParams();
  const readerIdentifier = decodeURIComponent(params.id || '');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [releasedBooks, setReleasedBooks] = useState([]);
  const [journeyStops, setJourneyStops] = useState([]);
  const [activeTab, setActiveTab] = useState('released');

  useEffect(() => {
    async function fetchReaderData() {
      if (!readerIdentifier) return;
      setLoading(true);

      try {
        // 1. Fetch Reader Profile by ID or display_name
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${readerIdentifier},display_name.ilike.${readerIdentifier},email.eq.${readerIdentifier}`)
          .maybeSingle();

        const activeName = prof?.display_name || readerIdentifier;
        const activeEmail = prof?.email || '';

        setProfile(prof || {
          display_name: activeName,
          home_base: '',
          avatar_url: '🔥',
        });

        // 2. Fetch Books added/released by this reader
        let booksQuery = supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (activeEmail) {
          booksQuery = booksQuery.or(`curator_name.ilike.%${activeName}%,curator_name.eq.${activeEmail}`);
        } else {
          booksQuery = booksQuery.ilike('curator_name', `%${activeName}%`);
        }

        const { data: bData } = await booksQuery;
        setReleasedBooks(bData || []);

        // 3. Fetch Journey Stops logged by this reader
        let stopsQuery = supabase
          .from('journey_stops')
          .select('*, books(title, author, cover_image, cover_image_url)')
          .order('created_at', { ascending: false });

        if (activeEmail) {
          stopsQuery = stopsQuery.or(`reader_email.eq.${activeEmail},reader_name.ilike.%${activeName}%`);
        } else {
          stopsQuery = stopsQuery.ilike('reader_name', `%${activeName}%`);
        }

        const { data: sData } = await stopsQuery;
        setJourneyStops(sData || []);
      } catch (err) {
        console.error('Error fetching reader profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReaderData();
  }, [readerIdentifier]);

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span>Loading reader profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Catalog</span>
      </Link>

      {/* Reader Identity Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
            {profile?.avatar_url || '🔥'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                {profile?.display_name || readerIdentifier}
              </h1>
              <span className="bg-stone-100 text-stone-700 text-[10px] font-mono px-2 py-0.5 rounded font-medium">
                Reader
              </span>
            </div>

            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{profile?.home_base || 'Wildfire Network'}</span>
            </p>
          </div>
        </div>

        {/* Community Role Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700">
          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span>Wildfire Contributor</span>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Books Released</p>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1 flex items-baseline gap-1.5">
            <span>{releasedBooks.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">in circulation</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Journeys Logged</p>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1 flex items-baseline gap-1.5">
            <span>{journeyStops.length}</span>
            <span className="text-xs font-normal text-stone-500 font-sans">stops recorded</span>
          </div>
        </div>
      </div>

      {/* Content Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('released')}
          className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'released'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Released Books ({releasedBooks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'history'
              ? 'text-stone-900 border-b-2 border-stone-900'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          Logged Journeys ({journeyStops.length})
        </button>
      </div>

      {/* Tab 1: Books Released */}
      {activeTab === 'released' && (
        <div className="space-y-4">
          {releasedBooks.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
              This reader has not released any books into the wild yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {releasedBooks.map((book) => {
                const displayId = book.book_id || book.id;
                const coverImage = book.cover_image || book.cover_image_url;

                return (
                  <div
                    key={displayId}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div className="p-3 space-y-2">
                      <div className="w-full aspect-[2/3] bg-stone-100 rounded-lg overflow-hidden border border-stone-100 flex items-center justify-center">
                        {coverImage ? (
                          <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-stone-300" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-stone-600">
                          {displayId}
                        </span>
                        <h2 className="font-serif font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                          {book.title}
                        </h2>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{book.author}</p>
                      </div>
                    </div>

                    <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      <Link
                        href={`/book/${displayId}`}
                        className="text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        Journey →
                      </Link>
                      <Link
                        href={`/book/${displayId}`}
                        className="text-stone-500 hover:text-stone-800 inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        Plate
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Journey History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {journeyStops.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
              No reading stops recorded by this reader yet.
            </div>
          ) : (
            journeyStops.map((stop) => (
              <div
                key={stop.id}
                className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/book/${stop.book_id}`}
                      className="font-mono text-xs font-bold text-amber-700 hover:underline"
                    >
                      {stop.book_id}
                    </Link>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                      {stop.status_event}
                    </span>
                    {stop.rating && (
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: stop.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  {stop.books?.title && (
                    <p className="font-serif font-bold text-stone-900 text-xs">
                      {stop.books.title} <span className="font-sans font-normal text-stone-500">by {stop.books.author}</span>
                    </p>
                  )}

                  {(stop.location || stop.location_city) && (
                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{stop.location || stop.location_city}</span>
                    </p>
                  )}

                  {stop.takeaway && (
                    <p className="text-stone-700 italic bg-stone-50 p-2 rounded border border-stone-100 text-[11px]">
                      "{stop.takeaway}"
                    </p>
                  )}
                </div>

                <div className="text-right sm:shrink-0 text-[10px] text-stone-400 flex items-center gap-1 self-start sm:self-center">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(stop.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
