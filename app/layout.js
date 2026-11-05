import Navbar from '../components/Navbar';
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
       <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}

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
