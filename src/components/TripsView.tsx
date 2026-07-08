import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Story } from '../types';
import { RecordModel } from 'pocketbase';
import { X, MapPin, BookOpen, Clock, Loader2, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

interface TripsViewProps {
  onClose: () => void;
}

/** Groups stories by their `trip` UUID and derives a display name. */
interface TripGroup {
  tripId: string;
  /** The location_name prefix before " — " if a trip name was set, else the raw trip UUID. */
  tripLabel: string;
  stories: Story[];
  /** Earliest `created` timestamp in the group. */
  createdAt: string;
}

function groupByTrip(records: RecordModel[]): TripGroup[] {
  const map = new Map<string, Story[]>();

  for (const r of records) {
    const story: Story = {
      id: r.id,
      user: r.user || '',
      trip: r.trip || 'unassigned',
      location_name: r.location_name || '',
      coordinates: r.coordinates || { lat: 0, lng: 0 },
      lenses_used: r.lenses_used || [],
      content: r.content || '',
      created: r.created || '',
    };
    const key = story.trip;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(story);
  }

  const groups: TripGroup[] = [];
  for (const [tripId, stories] of map.entries()) {
    // Derive a trip label: if location_name contains " — " the prefix is the trip name.
    const firstWithName = stories.find((s) => s.location_name.includes(' — '));
    const tripLabel = firstWithName
      ? firstWithName.location_name.split(' — ')[0].trim()
      : stories[0]?.location_name || tripId.slice(0, 8);

    const sorted = [...stories].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    );

    groups.push({
      tripId,
      tripLabel,
      stories: sorted,
      createdAt: sorted[0]?.created || '',
    });
  }

  // Most recent trip first.
  return groups.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function TripsView({ onClose }: TripsViewProps) {
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const userId = pb.authStore.model?.id ?? '';
        const result = await pb.collection('stories').getList(1, 200, {
          sort: '-created',
          filter: userId ? `user = "${userId}"` : '',
        });
        if (!cancelled) {
          setGroups(groupByTrip(result.items));
        }
      } catch {
        if (!cancelled) {
          setError('Could not load saved stories. Please try again.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const toggleTrip = (tripId: string) => {
    setExpandedTrip((prev) => (prev === tripId ? null : tripId));
    setExpandedStory(null);
  };

  const toggleStory = (storyId: string) => {
    setExpandedStory((prev) => (prev === storyId ? null : storyId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full md:w-2/5 max-w-xl h-full bg-[#0d0d0d] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h2 className="font-serif text-xl font-light text-white">My Trips</h2>
            {!isLoading && groups.length > 0 && (
              <span className="font-sans text-xs text-white/30 ml-1">
                {groups.length} trip{groups.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400/50" />
              <p className="font-sans text-sm">Loading your stories…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
              <p className="font-sans text-sm text-red-400">{error}</p>
            </div>
          )}

          {!isLoading && !error && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <Inbox className="w-10 h-10 text-white/15" />
              <p className="font-serif text-lg text-white/40 font-light">No saved stories yet</p>
              <p className="font-sans text-xs text-white/25 leading-relaxed">
                Generate a story for any location stop and tap "Save to Trip" to see it here.
              </p>
            </div>
          )}

          {!isLoading && !error && groups.length > 0 && (
            <div className="divide-y divide-white/5">
              {groups.map((group) => (
                <div key={group.tripId}>
                  {/* Trip row */}
                  <button
                    onClick={() => toggleTrip(group.tripId)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors text-left"
                  >
                    <div>
                      <p className="font-serif text-base text-white/85 font-light">
                        {group.tripLabel}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 font-sans text-xs text-white/30">
                          <MapPin className="w-3 h-3" />
                          {group.stories.length} stop{group.stories.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 font-sans text-xs text-white/30">
                          <Clock className="w-3 h-3" />
                          {formatRelativeDate(group.createdAt)}
                        </span>
                      </div>
                    </div>
                    {expandedTrip === group.tripId
                      ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                    }
                  </button>

                  {/* Stories list */}
                  {expandedTrip === group.tripId && (
                    <div className="bg-white/2 divide-y divide-white/5">
                      {group.stories.map((story) => {
                        // Strip the trip name prefix from location display.
                        const locationDisplay = story.location_name.includes(' — ')
                          ? story.location_name.split(' — ').slice(1).join(' — ')
                          : story.location_name;

                        return (
                          <div key={story.id} className="px-6 py-4">
                            <button
                              onClick={() => toggleStory(story.id)}
                              className="w-full flex items-start justify-between gap-3 text-left"
                            >
                              <div className="min-w-0">
                                <p className="font-sans text-sm text-white/70 font-medium truncate">
                                  {locationDisplay || 'Unknown location'}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {story.lenses_used.map((lens) => (
                                    <span
                                      key={lens}
                                      className="font-sans text-[10px] text-amber-400/60 bg-amber-500/8 border border-amber-500/15 rounded-full px-2 py-0.5"
                                    >
                                      {lens}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {expandedStory === story.id
                                ? <ChevronUp className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
                                : <ChevronDown className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
                              }
                            </button>

                            {expandedStory === story.id && (
                              <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-4">
                                <p className="font-serif text-sm text-white/75 leading-[1.9] italic">
                                  {story.content}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
