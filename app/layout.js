import './globals.css';
import Link from 'next/link';
import { Flame, PlusCircle, BookOpen, Compass, LogIn } from 'lucide-react';

export const metadata = {
  title: 'Wildfire Library | Books in the Wild',
  description: 'A community-powered traveling library tracking books passing from reader to reader.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fdfbf7] text-stone-900 antialiased selection:bg-amber-100 selection:text-amber-800">
        
        {/* Global Navigation Header */}
        <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            
            {/* Logo / Brand Name */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm group-hover:bg-amber-700 transition">
                <Flame className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-stone-900 leading-tight">
                  Wildfire Library
                </span>
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                  Books In Motion
                </span>
              </div>
            </Link>

            {/* Navigation Links & Actions */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-amber-600 px-3 py-1.5 rounded-lg transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </Link>
              
              <Link
                href="/how-it-works"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-amber-600 px-3 py-1.5 rounded-lg transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>How It Works</span>
              </Link>

              <Link
                href="/add-book"
                className="flex items-center gap-1.5 text-xs font-medium bg-stone-900 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Book</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-amber-600 px-3 py-1.5 rounded-lg border border-stone-300 hover:border-amber-500 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-stone-200 bg-stone-100 py-8 text-xs text-stone-500">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span className="font-serif font-semibold text-stone-800">Wildfire Library</span>
              <span>— Set stories loose in the wild.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/how-it-works" className="hover:text-amber-600 transition">
                How It Works
              </Link>
              <Link href="/" className="hover:text-amber-600 transition">
                Find a Book
              </Link>
              <a
                href="https://instagram.com/wildfire_library"
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-600 transition"
              >
                Instagram
              </a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
