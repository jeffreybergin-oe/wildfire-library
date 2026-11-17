import Link from 'next/link';
import { Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <Link href="/" className="shrink-0">
            <img
              src="/WF_Circle_Logo.png"
              alt="Wildfire Library"
              className="w-10 h-10 object-contain"
            />
          </Link>
          <div>
            <p className="font-serif font-bold text-sm text-white">
              Wildfire Library
            </p>
            <p className="text-xs text-stone-400">
              Books are meant to wander, not sit on shelves.
            </p>
          </div>
        </div>

        {/* Navigation & Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium">
          <Link href="/" className="hover:text-white transition">
            Catalog
          </Link>
          <Link href="/add-book" className="hover:text-white transition">
            Release a Book
          </Link>
          <Link href="/my-catalog" className="hover:text-white transition">
            My Passport
          </Link>

          <span className="hidden sm:inline text-stone-700">|</span>

          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/wildfire_library/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Wildfire Library on Instagram"
              className="p-2 rounded-lg bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white transition"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.youtube.com/@WildfireLibrary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Wildfire Library on YouTube"
              className="p-2 rounded-lg bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white transition"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
