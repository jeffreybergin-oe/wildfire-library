'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export default function IsbnScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    hasScannedRef.current = false;
    setError('');
    const readerElementId = 'isbn-barcode-reader';
    let html5QrCode;

    async function startScanner() {
      try {
        html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Rear phone camera
          {
            fps: 10,
            qrbox: { width: 260, height: 120 }, // Wide horizontal box shaped for book barcodes
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            const cleanDigits = decodedText.replace(/[^0-9X]/gi, '');
            if (cleanDigits.length === 10 || cleanDigits.length === 13) {
              hasScannedRef.current = true;
              onScanSuccess(cleanDigits);
              stopAndClose();
            }
          },
          () => {
            // Ignore per-frame scan misses while aiming
          }
        );
      } catch (err) {
        console.error('Camera scanner error:', err);
        setError(
          'Unable to access camera. Make sure camera permissions are allowed in your browser settings.'
        );
      }
    }

    async function stopAndClose() {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error stopping scanner:', e);
        }
      }
      onClose();
    }

    // Small delay ensures the modal DOM container is mounted before attaching video
    const timer = setTimeout(startScanner, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              Scan Book Barcode
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 space-y-3 bg-stone-900 text-center">
          <div
            id="isbn-barcode-reader"
            className="w-full rounded-xl overflow-hidden bg-black min-h-[220px]"
          />
          <p className="text-xs text-stone-300">
            Point your rear camera at the <strong>ISBN barcode</strong> on the back cover of the book.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
