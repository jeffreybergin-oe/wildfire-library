import Link from 'next/link';
import { QrCode, BookMarked, Share2, Flame, HeartHandshake, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'How It Works | Wildfire Library',
  description: 'How books travel from reader to reader through the Wildfire Library community.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Find a Wild Book',
      description:
        'You might spot a Wildfire book at a local coffee shop, park bench, airport lounge, or Little Free Library. Look inside the front cover for the official 3×3 Wildfire bookplate.',
      icon: BookMarked,
    },
    {
      number: '02',
      title: 'Scan the Bookplate',
      description:
        'Open your phone camera and scan the QR code. You will land directly on the book’s living timeline—no account or app download required.',
      icon: QrCode,
    },
    {
      number: '03',
      title: 'Log Your Pickup',
      description:
        'Tap "I just picked this up" and enter your first name and city. This lets previous readers know their copy has found a new home and is actively being read.',
      icon: Flame,
    },
    {
      number: '04',
      title: 'Finish & Set It Free',
      description:
        'Once you turn the final page, scan the QR code again. Leave a 1–5 star rating and an optional takeaway note, then leave the book somewhere special for the next reader.',
      icon: Share2,
    },
  ];

  const faqs = [
    {
      q: 'Do I need an account to log a book?',
      a: 'No. The entire experience is frictionless by design. Anyone with a smartphone camera can claim or review a book in under 15 seconds.',
    },
    {
      q: 'Can I keep a book if I really love it?',
      a: 'While we encourage passing books along so their journey maps grow, books are meant to be cherished. If a book changes your life, keep it on your shelf—just drop a note on its timeline so the original owner knows it found a permanent home.',
    },
    {
      q: 'Where should I leave a book when I finish?',
      a: 'Any dry, public place with foot traffic: coffee shop community shelves, university lounges, Little Free Libraries, train stations, or airport waiting areas.',
    },
    {
      q: 'Can I release my own books into the wild?',
      a: 'Yes! Anyone can register a book from their personal collection using our intake page, print the generated 3×3 badge, and set it loose in their community.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-4 sm:pt-8 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ember-100 text-ember-800 text-xs font-semibold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-ember-600" />
          The Wildfire Concept
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-ink-900 tracking-tight leading-tight">
          Books are meant to travel, not sit on dusty shelves.
        </h1>
        <p className="text-sm sm:text-base text-ink-700 leading-relaxed">
          Wildfire Library is a decentralized, traveling book project. Every book carries a unique identifier and a physical QR code that maps its journey across cities, hands, and minds.
        </p>
      </div>

      {/* 4-Step Journey Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-white border border-paper-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-paper-100 border border-paper-200 flex items-center justify-center text-ember-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-ink-500 bg-paper-100 px-2 py-0.5 rounded">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-ink-900">{step.title}</h3>
                <p className="text-xs sm:text-sm text-ink-700 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community Ethos Callout */}
      <div className="bg-ink-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-ember-500 text-xs font-semibold uppercase tracking-widest">
            <HeartHandshake className="w-4 h-4" />
            Pass It On
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold leading-snug">
            Ready to release a story of your own?
          </h2>
          <p className="text-xs sm:text-sm text-stone-300">
            Have a favorite book you want to share? Register it in under 30 seconds, print the cutout bookplate, and send it into the wild.
          </p>
        </div>
        <Link
          href="/add-book"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ember-600 hover:bg-ember-700 text-white text-xs font-semibold transition shadow-sm"
        >
          <span>Register a Book</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-8 pt-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-ink-500 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-ember-600" />
            Common Questions
          </div>
          <h2 className="text-2xl font-serif font-bold text-ink-900">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-paper-200 rounded-xl p-6 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-ink-900">{faq.q}</h3>
              <p className="text-xs text-ink-700 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
