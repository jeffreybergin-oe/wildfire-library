import './globals.css';
import Navbar from '../components/Navbar';
import { Instagram, Youtube } from 'lucide-react';

export const metadata = {
  title: 'Wildfire Library',
  description: 'Books are meant to wander, not sit on shelves. Track and discover books across community libraries.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-stone-200 bg-white py-8 px-4 text-center text-xs sm:text-sm text-stone-500">
          <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-3">
            <img
              src="/WF_Circle_Logo.png"
              alt="Wildfire Library"
              className="h-7 w-7 rounded-full object-contain opacity-85"
            />
            <p className="text-stone-600 font-medium">
              Books are meant to wander, not sit on shelves.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/wildfire_library/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wildfire Library on Instagram"
                className="p-2 rounded-lg bg-stone-100 hover:bg-amber-600 text-stone-600 hover:text-white transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@Wildfire_Library"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wildfire Library on YouTube"
                className="p-2 rounded-lg bg-stone-100 hover:bg-amber-600 text-stone-600 hover:text-white transition"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-stone-400 max-w-md">
              Disclosure: As a Bookshop.org affiliate, Wildfire Library earns a small commission on qualifying purchases at no extra cost to you.
            </p>
            <p className="text-xs text-stone-400">
              © {new Date().getFullYear()} Wildfire Library. Built for community book sharing.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
