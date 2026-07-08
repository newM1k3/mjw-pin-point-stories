import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { MapView } from './components/MapView';
import { PhotoDropzone } from './components/PhotoDropzone';
import { StoryPanel } from './components/StoryPanel';
import { TripsView } from './components/TripsView';
import { MapPin, Cluster, ClusterStoryState } from './types';
import { LogOut, Map as MapIcon, Plus, ChevronDown, BookOpen } from 'lucide-react';

function AppContent() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tripId, setTripId] = useState<string>('');
  const [tripName, setTripName] = useState<string>('');

  // Lifted story state: keyed by cluster.id so each stop remembers its story
  // across navigation without re-mounting StoryPanel.
  const [storyStateMap, setStoryStateMap] = useState<globalThis.Map<string, ClusterStoryState>>(() => new globalThis.Map<string, ClusterStoryState>());

  // My Trips overlay visibility
  const [showTrips, setShowTrips] = useState(false);

  const handlePinsReady = useCallback((newPins: MapPin[], newClusters: Cluster[]) => {
    // Generate a fresh trip ID for this session when photos are first loaded.
    const newTripId = crypto.randomUUID();
    setTripId(newTripId);
    setTripName('');
    setStoryStateMap(new globalThis.Map<string, ClusterStoryState>());
    setPins(newPins);
    setClusters(newClusters);
    if (newClusters.length > 0) {
      setSelectedCluster(newClusters[0]);
      setSidebarOpen(true);
    }
  }, []);

  const handleClusterSelect = useCallback((cluster: Cluster) => {
    setSelectedCluster(cluster);
    setSidebarOpen(true);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedCluster) return;
    const idx = clusters.findIndex((c) => c.id === selectedCluster.id);
    const nextIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (nextIdx >= 0 && nextIdx < clusters.length) {
      setSelectedCluster(clusters[nextIdx]);
    }
  }, [clusters, selectedCluster]);

  const handleStoryStateChange = useCallback((clusterId: string, state: ClusterStoryState) => {
    setStoryStateMap((prev) => new globalThis.Map<string, ClusterStoryState>(prev).set(clusterId, state));
  }, []);

  const { logout } = useAuth();
  const handleLogout = () => logout();

  const handleReset = () => {
    pins.forEach((p) => { if (p.thumbnailUrl) URL.revokeObjectURL(p.thumbnailUrl); });
    setPins([]);
    setClusters([]);
    setSelectedCluster(null);
    setTripId('');
    setTripName('');
    setStoryStateMap(new globalThis.Map<string, ClusterStoryState>());
  };

  const showDropzone = pins.length === 0;
  const selectedIndex = selectedCluster ? clusters.findIndex((c) => c.id === selectedCluster.id) : 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-sans">
      <div className="absolute inset-0">
        {clusters.length > 0 ? (
          <MapView
            clusters={clusters}
            selectedCluster={selectedCluster}
            onClusterSelect={handleClusterSelect}
          />
        ) : (
          <div className="absolute inset-0 bg-[#0a0a0a]" />
        )}
      </div>

      {showDropzone && <PhotoDropzone onPinsReady={handlePinsReady} />}

      {/* Top-left: brand + trip name input + new trip button */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-xl">
          <MapIcon className="w-4 h-4 text-amber-400" />
          <span className="font-serif text-base font-light text-white/90 tracking-wide">
            MemoryMap
          </span>
          <span className="font-sans text-[10px] text-amber-400/60 uppercase tracking-widest border border-amber-500/20 rounded-full px-1.5 py-0.5">
            Beta
          </span>
        </div>

        {clusters.length > 0 && (
          <>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Name this trip…"
              className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white/70 placeholder-white/20 text-xs font-sans shadow-xl focus:outline-none focus:border-amber-500/40 focus:text-white/90 w-40 transition-colors"
            />
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white/50 hover:text-white/80 transition-colors text-xs font-sans shadow-xl"
              title="Load new photos"
            >
              <Plus className="w-3.5 h-3.5" />
              New Trip
            </button>
          </>
        )}
      </div>

      {/* Top-right: My Trips + Sign out */}
      <div
        className="absolute top-4 z-30 flex items-center gap-2"
        style={{ right: clusters.length > 0 && sidebarOpen ? 'calc(33.333% + 16px)' : '16px' }}
      >
        <button
          onClick={() => setShowTrips(true)}
          className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white/50 hover:text-amber-400/80 transition-colors text-xs font-sans shadow-xl"
          title="View saved trips"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">My Trips</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white/30 hover:text-white/60 transition-colors text-xs font-sans shadow-xl"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      {clusters.length > 0 && (
        <>
          <div
            className={`
              absolute top-0 right-0 h-full z-20
              w-full md:w-1/3
              transition-transform duration-500 ease-out
              ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-full'}
            `}
          >
            <div className="h-full bg-black/75 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col">
              <StoryPanel
                cluster={selectedCluster || clusters[0]}
                clusterIndex={selectedIndex}
                totalClusters={clusters.length}
                tripId={tripId}
                tripName={tripName}
                storyState={storyStateMap.get((selectedCluster || clusters[0]).id)}
                onStoryStateChange={handleStoryStateChange}
                onNavigate={handleNavigate}
              />
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              absolute top-1/2 -translate-y-1/2 z-30
              hidden md:flex items-center justify-center
              w-7 h-14 bg-black/70 backdrop-blur-xl border border-white/10
              rounded-l-xl text-white/40 hover:text-white/70 transition-all duration-300
              ${sidebarOpen ? 'right-1/3' : 'right-0'}
            `}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>

          {!sidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 text-center"
              >
                <span className="font-serif text-base text-white/60">
                  {selectedCluster?.locationName || 'Select a location'}
                </span>
              </button>
            </div>
          )}

          {sidebarOpen && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 md:hidden"
              style={{ height: '60vh' }}
            >
              <div className="h-full bg-black/85 backdrop-blur-2xl border-t border-white/10 overflow-hidden flex flex-col">
                <div
                  className="flex justify-center py-3 cursor-pointer"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <StoryPanel
                    cluster={selectedCluster || clusters[0]}
                    clusterIndex={selectedIndex}
                    totalClusters={clusters.length}
                    tripId={tripId}
                    tripName={tripName}
                    storyState={storyStateMap.get((selectedCluster || clusters[0]).id)}
                    onStoryStateChange={handleStoryStateChange}
                    onNavigate={handleNavigate}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* My Trips overlay */}
      {showTrips && (
        <TripsView onClose={() => setShowTrips(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}
