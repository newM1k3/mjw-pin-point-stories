import { useState } from 'react';
import { Cluster, TravelerLens, Story } from '../types';
import { pb } from '../lib/pocketbase';
import {
  Sparkles,
  BookOpen,
  MapPin,
  Images,
  Clock,
  Save,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ALL_LENSES: TravelerLens[] = [
  'Food & Wine',
  'Architecture',
  'Romance',
  'History',
  'Culture & Arts',
  'Nature',
  'Adventure',
];

interface StoryPanelProps {
  cluster: Cluster;
  clusterIndex: number;
  totalClusters: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function StoryPanel({ cluster, clusterIndex, totalClusters, onNavigate }: StoryPanelProps) {
  const [selectedLenses, setSelectedLenses] = useState<TravelerLens[]>([]);
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const toggleLens = (lens: TravelerLens) => {
    setSelectedLenses((prev) =>
      prev.includes(lens) ? prev.filter((l) => l !== lens) : [...prev, lens]
    );
    setIsSaved(false);
  };

  const generateStory = async () => {
    if (selectedLenses.length === 0) {
      setError('Select at least one lens to shape your story.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setStory('');
    setIsSaved(false);

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: cluster.locationName || `${cluster.center.lat.toFixed(4)}, ${cluster.center.lng.toFixed(4)}`,
          lenses: selectedLenses,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setStory(data.story || '');
    } catch {
      setError('Story generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = async () => {
    if (!story) return;
    setIsSaving(true);
    try {
      const record: Partial<Story> = {
        location_name: cluster.locationName || '',
        coordinates: cluster.center,
        lenses_used: selectedLenses,
        content: story,
      };
      await pb.collection('stories').create(record);
      setIsSaved(true);
    } catch {
      setError('Could not save story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const earliestPin = cluster.pins.reduce((a, b) => (a.timestamp < b.timestamp ? a : b));
  const latestPin = cluster.pins.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  const dateRange = formatDateRange(earliestPin.timestamp, latestPin.timestamp);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-in-right">
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="font-sans text-xs text-amber-400/70 uppercase tracking-widest">
            Stop {clusterIndex + 1} of {totalClusters}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('prev')}
              disabled={clusterIndex === 0}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed transition-colors hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              disabled={clusterIndex === totalClusters - 1}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed transition-colors hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-light text-white leading-tight">
          {cluster.locationName || 'Unknown Location'}
        </h2>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-white/40">
            <Images className="w-3.5 h-3.5" />
            <span className="font-sans text-xs">{cluster.pins.length} photo{cluster.pins.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-sans text-xs">{dateRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-sans text-xs">
              {cluster.center.lat.toFixed(3)}, {cluster.center.lng.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {cluster.pins.some((p) => p.thumbnailUrl) && (
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {cluster.pins
              .filter((p) => p.thumbnailUrl)
              .slice(0, 8)
              .map((pin) => (
                <img
                  key={pin.id}
                  src={pin.thumbnailUrl}
                  alt={pin.fileName}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
                />
              ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <div>
          <h3 className="font-sans text-xs text-white/40 uppercase tracking-widest mb-3">
            Traveler's Lens
          </h3>
          <div className="flex flex-wrap gap-2">
            {ALL_LENSES.map((lens) => (
              <button
                key={lens}
                onClick={() => toggleLens(lens)}
                className={`
                  px-3 py-1.5 rounded-full font-sans text-xs font-medium transition-all duration-200
                  ${selectedLenses.includes(lens)
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-amber-500/30 hover:text-white/70 hover:bg-white/8'}
                `}
              >
                {lens}
              </button>
            ))}
          </div>
          {error && !story && (
            <p className="font-sans text-xs text-red-400 mt-2 animate-fade-in">{error}</p>
          )}
        </div>

        {story ? (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h3 className="font-sans text-xs text-white/40 uppercase tracking-widest">
                Your Story
              </h3>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-5">
              <p className="font-serif text-base text-white/85 leading-[1.8] italic">
                {story}
              </p>
            </div>
          </div>
        ) : null}

        {isGenerating && (
          <div className="animate-fade-in flex flex-col items-center py-8">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-amber-400" />
            </div>
            <p className="font-serif text-lg text-white/70 italic">Crafting your story...</p>
            <p className="font-sans text-xs text-white/30 mt-1">This takes about 15 seconds</p>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-6 border-t border-white/10 space-y-3">
        {error && story && (
          <p className="font-sans text-xs text-red-400 animate-fade-in">{error}</p>
        )}
        <button
          onClick={generateStory}
          disabled={isGenerating || selectedLenses.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-black font-sans font-semibold text-sm rounded-xl px-6 py-3.5 transition-all duration-200 shadow-lg shadow-amber-500/10"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {story ? 'Regenerate Story' : 'Generate Story'}
            </>
          )}
        </button>

        {story && (
          <button
            onClick={saveStory}
            disabled={isSaving || isSaved}
            className={`
              w-full flex items-center justify-center gap-2
              font-sans font-medium text-sm rounded-xl px-6 py-3 transition-all duration-200
              ${isSaved
                ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8 hover:border-white/20'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved to Trip
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save to Trip
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function formatDateRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (start === end || s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString('en-US', opts);
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', opts)}`;
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}
