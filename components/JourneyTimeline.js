'use client';

import { MapPin, Star, Calendar, Flame, BookCheck, Sparkles, Navigation } from 'lucide-react';

const STATUS_CONFIG = {
  'Registered': { label: 'Released into the Wild', icon: Flame, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'Currently Reading': { label: 'Currently Reading', icon: Sparkles, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'Finished Reading': { label: 'Finished Reading', icon: BookCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'Ready for Next Reader': { label: 'Passed Along', icon: Navigation, color: 'text-stone-700 bg-stone-100 border-stone-200' },
};

export default function JourneyTimeline({ stops = [] }) {
  if (!stops || stops.length === 0) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center text-stone-500 text-xs">
        <MapPin className="w-6 h-6 text-stone-400 mx-auto mb-2" />
        No journey stops logged yet. Scan the bookplate QR code to record the first stop!
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
      {stops.map((stop, index) => {
        const config = STATUS_CONFIG[stop.status_event] || {
          label: stop.status_event || 'Journey Update',
          icon: MapPin,
          color: 'text-stone-700 bg-stone-100 border-stone-200',
        };
        const StatusIcon = config.icon;
        const formattedDate = stop.created_at
          ? new Date(stop.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recent';

        return (
          <div key={stop.id || index} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-stone-300 group-hover:border-amber-600 transition flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-stone-500 group-hover:text-amber-700">
                {stops.length - index}
              </span>
            </div>

            {/* Stop content card */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2.5 hover:border-stone-300 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border rounded-md ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{config.label}</span>
                  </span>
                  
                  {stop.reader_name && (
                    <span className="text-xs font-semibold text-stone-900">
                      {stop.reader_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-stone-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Location indicator */}
              {(stop.location || stop.location_city) && (
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{stop.location || stop.location_city}</span>
                </div>
              )}

              {/* Reader Takeaway */}
              {stop.takeaway && (
                <blockquote className="text-xs text-stone-700 bg-stone-50 border-l-2 border-amber-500 py-1.5 px-3 rounded-r-md italic">
                  "{stop.takeaway}"
                </blockquote>
              )}

              {/* Star rating if provided */}
              {stop.rating && (
                <div className="flex items-center gap-1 pt-1 text-amber-500 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < stop.rating ? 'fill-amber-400 text-amber-500' : 'text-stone-200'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
