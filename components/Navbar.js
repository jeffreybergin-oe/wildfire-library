'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { PlusCircle, User, LogIn, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
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
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Wide Brand Logo (Home Link) */}
          <Link
            href="/"
            className="flex items-center h-16 sm:h-20 w-[220px] sm:w-[280px] overflow-hidden shrink-0"
          >
            <img
              src="/WF_Wide_Logo.png"
              alt="Wildfire Library"
              className="h-full w-auto object-contain object-left scale-[1.45] origin-left translate-y-4"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center gap-6 text-base font-semibold">
            <Link
              href="/"
              className={`hover:text-stone-900 transition ${
                pathname === '/' ? 'text-stone-900 font-bold' : 'text-stone-700'
              }`}
            >
              Catalog
            </Link>

            <Link
              href="/add-book"
              className={`inline-flex items-center gap-1.5 hover:text-stone-900 transition ${
                pathname === '/add-book' ? 'text-stone-900 font-bold' : 'text-stone-700'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-600" />
              <span>Add Book</span>
            </Link>

            {/* Auth / Reader status */}
            {user ? (
              <div className="flex items-center gap-4 pl-5 border-l border-stone-200">
                <Link
                  href="/profile"
                  className={`inline-flex items-center gap-2 hover:text-stone-900 transition ${
                    pathname === '/profile' ? 'text-stone-900 font-bold' : 'text-stone-800'
                  }`}
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span>{displayName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-stone-400 hover:text-stone-700 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-2xs transition"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-3 text-base font-medium">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-1.5 ${
              pathname === '/' ? 'font-bold text-stone-900' : 'text-stone-700'
            }`}
          >
            Catalog
          </Link>
          <Link
            href="/add-book"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-1.5 ${
              pathname === '/add-book' ? 'font-bold text-stone-900' : 'text-stone-700'
            }`}
          >
            Add Book
          </Link>
          {user ? (
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="font-bold text-stone-900 py-1"
              >
                {displayName} (Dashboard)
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-stone-500 hover:text-stone-800 py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-100">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-center bg-stone-900 text-white rounded-xl font-bold"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
