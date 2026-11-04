'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';

export default function Bookplate({ bookId, title, author }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!bookId) return;
    
    // Construct the live URL that the QR code will scan to
    const targetUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/book/${bookId}` 
      : `https://wildfirelibrary.com/book/${bookId}`;

    QRCode.toDataURL(targetUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#1c1917', // stone-900
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [bookId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 my-6">
      {/* Screen Instructions */}
      <div className="no-print text-center max-w-md bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-sm mb-1">Your Bookplate is Ready!</p>
        <p>
          Print this 3×3 badge, cut it along the border, and tape it inside the front cover. 
          Readers can scan it to track and pass this book along.
        </p>
        <button
          onClick={handlePrint}
          type="button"
          className="mt-3 inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded-md shadow-sm transition text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Bookplate (3×3)</span>
        </button>
      </div>

      {/* 3x3 Physical Cutout Container */}
      <div 
        id="printable-bookplate" 
        className="w-[3in] h-[3in] bg-white border-2 border-dashed border-stone-800 p-3 flex flex-col justify-between items-center text-center shadow-md print:shadow-none print:m-0"
      >
        {/* Top Header */}
        <div className="w-full border-b border-stone-300 pb-1">
          <h2 className="text-sm font-extrabold tracking-widest text-stone-900 font-serif uppercase">
            Wildfire Library
          </h2>
          <p className="text-[9px] text-stone-600 italic">
            Enjoy this book on its journey!
          </p>
        </div>

        {/* Center Section: QR Code & WF ID */}
        <div className="flex flex-col items-center justify-center my-auto">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code for ${bookId}`} 
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className="w-24 h-24 bg-stone-100 flex items-center justify-center text-[10px] text-stone-400">
              Generating QR...
            </div>
          )}
          <span className="text-xs font-mono font-bold tracking-wider text-stone-900 mt-0.5">
            {bookId || 'WF-###'}
          </span>
        </div>

        {/* Bottom Details */}
        <div className="w-full border-t border-stone-300 pt-1">
          <p className="text-[10px] font-bold text-stone-900 truncate max-w-[2.6in] mx-auto">
            {title || 'Untitled Book'}
          </p>
          <p className="text-[9px] text-stone-600 truncate max-w-[2.6in] mx-auto">
            {author || 'Unknown Author'}
          </p>
        </div>
      </div>

      {/* Print Specific CSS Overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bookplate, #printable-bookplate * {
            visibility: visible;
          }
          #printable-bookplate {
            position: fixed;
            left: 50%;
            top: 20%;
            transform: translate(-50%, 0);
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
