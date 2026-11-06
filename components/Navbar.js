'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Flame, PlusCircle, BookOpen, User, LogIn, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // 1. Get initial session
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchProfileName(session.user.email);
      }
    }

    async function fetchProfileName(email) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('email', email)
        .maybeSingle();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        setDisplayName(email?.split('@')[0] || 'Reader');
      }
    }

    checkUser();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileName(session.user.email);
      } else {
        setUser(null);
        setDisplayName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600 fill-amber-600" />
            <span className="font-serif font-bold text-base text-stone-900 tracking-tight">
              Wildfire Library
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
            <Link
              href="/"
              className={`hover:text-stone-900 transition ${
                pathname === '/' ? 'text-stone-900 font-bold' : 'text-stone-500'
              }`}
            >
              Catalog
            </Link>

            <Link
              href="/add-book"
              className={`inline-flex items-center gap-1 hover:text-stone-900 transition ${
                pathname === '/add-book' ? 'text-stone-900 font-bold' : 'text-stone-500'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Book</span>
            </Link>

            {/* Auth / Reader status */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
                <Link
                  href="/profile"
                  className={`inline-flex items-center gap-1.5 hover:text-stone-900 transition ${
                    pathname === '/profile' ? 'text-stone-900 font-bold' : 'text-stone-600'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>{displayName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-stone-400 hover:text-stone-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-stone-400" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-stone-600"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-stone-100 bg-white px-4 py-3 space-y-2 text-xs">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 text-stone-700"
          >
            Catalog
          </Link>
          <Link
            href="/add-book"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1 text-stone-700"
          >
            Add Book
          </Link>
          {user ? (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="font-semibold text-stone-800"
              >
                {displayName} (Dashboard)
              </Link>
              <button
                onClick={handleSignOut}
                className="text-stone-500 hover:text-stone-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-amber-700 font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
