import './globals.css';
import Link from 'next/link';
import { BookOpen, PlusCircle } from 'lucide-react';

export const metadata = {
  title: 'Wildfire Library',
  description: 'A community lending library tracking books on their journey from reader to reader.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-stone-50 text-stone-900 antialiased font-sans">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo / Home Link */}
            <Link 
              href="/" 
              className="flex items-center gap-2.5 font-bold tracking-tight text-amber-700 hover:text-amber-800 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-serif text-stone-900 tracking-normal">Wildfire Library</span>
            </Link>

            {/* Navigation Actions */}
            <nav className="flex items-center gap-3 sm:gap-4">
              <Link 
                href="/" 
                className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-md hover:bg-stone-100 transition"
              >
                Catalog
              </Link>
              <Link 
                href="/add-book" 
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-amber-700 hover:bg-amber-800 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add a Book</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-stone-200 bg-white mt-auto py-6 text-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Wildfire Library. Books passed in the wild.</p>
        </footer>
      </body>
    </html>
  );
}
