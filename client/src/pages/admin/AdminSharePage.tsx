import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, MessageCircle } from 'lucide-react';

export default function AdminSharePage() {
  const [copied, setCopied] = useState(false);
  const storeUrl = window.location.origin;
  const whatsappMessage = `Check out fresh vegetables at Veggie Store! Order online: ${storeUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = storeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-heading font-bold text-2xl mb-2">Share Store</h1>
      <p className="text-text-muted text-sm mb-8">
        Share your store link with customers via WhatsApp or QR code.
      </p>

      {/* Store Link */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-medium text-text-dark mb-3">Store Link</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-text-dark truncate">
            {storeUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              copied
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-primary-green text-white hover:bg-primary-green-dark'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* WhatsApp Share */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-medium text-text-dark mb-3">Share via WhatsApp</h2>
        <p className="text-sm text-text-muted mb-4">
          Send the store link to customers or share in groups.
        </p>
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Share on WhatsApp
        </a>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-medium text-text-dark mb-3">QR Code</h2>
        <p className="text-sm text-text-muted mb-4">
          Print this QR code or display it in your store for customers to scan.
        </p>
        <div className="flex justify-center p-6 bg-white border border-gray-200 rounded-xl">
          <QRCodeSVG
            value={storeUrl}
            size={200}
            level="M"
            includeMargin
            fgColor="#1a1a2e"
          />
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
          <Share2 className="w-3.5 h-3.5" />
          Scan to visit {storeUrl}
        </div>
      </div>
    </div>
  );
}
