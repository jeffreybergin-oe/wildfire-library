import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Wildfire Library',
  description: 'Books meant to wander, not sit on shelves. Track and discover books across community libraries.',
  icons: {
    icon: '/WF_Circle_Logo.png',
    shortcut: '/WF_Circle_Logo.png',
    apple: '/WF_Circle_Logo.png',
  },
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
          <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-2.5">
            <img
              src="/WF_Circle_Logo.png"
              alt="Wildfire Library"
              className="h-7 w-7 rounded-full object-contain opacity-85"
            />
            <p>© {new Date().getFullYear()} Wildfire Library. Built for community book sharing.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
