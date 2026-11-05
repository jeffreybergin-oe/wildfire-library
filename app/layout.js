import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Wildfire Library',
  description: 'Track and discover books across community libraries',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Wildfire Library. Built for community book sharing.</p>
        </footer>
      </body>
    </html>
  );
}
