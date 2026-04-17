import { useCallback, useState, useRef } from 'react';
import { Upload, Shield, Camera, Loader2 } from 'lucide-react';
import { processPhotos, clusterPins, reverseGeocode } from '../lib/exif';
import { MapPin, Cluster } from '../types';

interface PhotoDropzoneProps {
  onPinsReady: (pins: MapPin[], clusters: Cluster[]) => void;
}

export function PhotoDropzone({ onPinsReady }: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [phase, setPhase] = useState<'idle' | 'extracting' | 'geocoding'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (arr.length === 0) return;

      setIsProcessing(true);
      setPhase('extracting');
      setProgress({ current: 0, total: arr.length });

      try {
        const pins = await processPhotos(arr, (cur, tot) => {
          setProgress({ current: cur, total: tot });
        });

        if (pins.length === 0) {
          setIsProcessing(false);
          setPhase('idle');
          return;
        }

        const clusters = clusterPins(pins);
        setPhase('geocoding');

        for (let i = 0; i < clusters.length; i++) {
          const c = clusters[i];
          c.locationName = await reverseGeocode(c.center.lat, c.center.lng);
          setProgress({ current: i + 1, total: clusters.length });
        }

        onPinsReady(pins, clusters);
      } finally {
        setIsProcessing(false);
        setPhase('idle');
      }
    },
    [onPinsReady]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  if (isProcessing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70 backdrop-blur-sm">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          </div>
          <h3 className="font-serif text-2xl text-white mb-2">
            {phase === 'extracting' ? 'Extracting GPS data' : 'Identifying locations'}
          </h3>
          <p className="font-sans text-sm text-white/40 mb-6">
            {phase === 'extracting'
              ? `Processing ${progress.current} of ${progress.total} photos locally`
              : `Geocoding cluster ${progress.current} of ${progress.total}`}
          </p>
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
          <p className="font-sans text-xs text-amber-400/60 mt-4 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" />
            Photos never leave your device
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
            <Camera className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-3 tracking-wide">
            MemoryMap
          </h1>
          <p className="font-sans text-white/40 text-sm">
            Transform your travel photos into evocative stories
          </p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 group
            ${isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-white/15 hover:border-amber-500/40 bg-white/3 hover:bg-amber-500/5'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onInputChange}
          />

          <div className={`
            inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5
            transition-all duration-300
            ${isDragging ? 'bg-amber-500/20 scale-110' : 'bg-white/5 group-hover:bg-amber-500/10'}
          `}>
            <Upload className={`w-6 h-6 transition-colors duration-300 ${isDragging ? 'text-amber-400' : 'text-white/40 group-hover:text-amber-400'}`} />
          </div>

          <h3 className="font-serif text-xl font-light text-white mb-2">
            Drop your travel photos here
          </h3>
          <p className="font-sans text-sm text-white/40 mb-6">
            Or click to browse your files · Supports JPG, HEIC, and RAW formats
          </p>

          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-sans text-xs text-emerald-300 font-medium">
              Processed locally. Never uploaded.
            </span>
          </div>
        </div>

        <p className="text-center font-sans text-xs text-white/20 mt-5">
          Photos must contain GPS EXIF data · iPhone, Android, and most DSLRs supported
        </p>
      </div>
    </div>
  );
}
