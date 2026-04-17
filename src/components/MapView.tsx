import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cluster } from '../types';

interface MapViewProps {
  clusters: Cluster[];
  selectedCluster: Cluster | null;
  onClusterSelect: (cluster: Cluster) => void;
}

function ClusterMarkers({ clusters, selectedCluster, onClusterSelect }: MapViewProps) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    clusters.forEach((cluster, idx) => {
      const isSelected = selectedCluster?.id === cluster.id;
      const count = cluster.pins.length;

      const el = document.createElement('div');
      el.className = 'cluster-marker';
      el.innerHTML = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width:48px;height:48px">
          <div class="absolute inset-0 rounded-full transition-all duration-300 ${isSelected ? 'bg-amber-400 scale-110' : 'bg-amber-500 group-hover:scale-110'}" style="opacity:${isSelected ? 1 : 0.9}"></div>
          <div class="absolute inset-0 rounded-full border-2 ${isSelected ? 'border-white' : 'border-amber-300/40'}" style="transform:scale(1.2)"></div>
          ${isSelected ? '<div class="absolute inset-0 rounded-full bg-amber-400/30 animate-ping"></div>' : ''}
          <span class="relative z-10 text-black font-bold text-xs font-sans">${count > 1 ? count : (idx + 1)}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: el.innerHTML,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([cluster.center.lat, cluster.center.lng], { icon });
      marker.on('click', () => onClusterSelect(cluster));
      marker.addTo(map);

      if (cluster.locationName) {
        marker.bindTooltip(cluster.locationName, {
          className: 'cluster-tooltip',
          direction: 'top',
          offset: [0, -28],
        });
      }

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [clusters, selectedCluster, map, onClusterSelect]);

  return null;
}

function MapFitter({ clusters }: { clusters: Cluster[] }) {
  const map = useMap();

  useEffect(() => {
    if (clusters.length === 0) return;
    if (clusters.length === 1) {
      map.setView([clusters[0].center.lat, clusters[0].center.lng], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(clusters.map((c) => [c.center.lat, c.center.lng]));
    map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1 });
  }, [clusters, map]);

  return null;
}

export function MapView({ clusters, selectedCluster, onClusterSelect }: MapViewProps) {
  const polylinePositions = clusters.map((c) => [c.center.lat, c.center.lng] as [number, number]);

  return (
    <div className="absolute inset-0">
      <style>{`
        .cluster-tooltip {
          background: rgba(0,0,0,0.8) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          color: #fff !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 12px !important;
          padding: 4px 10px !important;
          backdrop-filter: blur(12px);
          white-space: nowrap;
        }
        .cluster-tooltip::before { display: none !important; }
        .leaflet-container { background: #0a0a0a; }
        .leaflet-control-attribution { display: none; }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.6) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.6) !important;
          backdrop-filter: blur(12px);
        }
        .leaflet-control-zoom a:hover {
          background: rgba(245,158,11,0.2) !important;
          color: #f59e0b !important;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {clusters.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: 'rgba(245,158,11,0.35)',
              weight: 2,
              dashArray: '6 8',
            }}
          />
        )}
        <ClusterMarkers
          clusters={clusters}
          selectedCluster={selectedCluster}
          onClusterSelect={onClusterSelect}
        />
        <MapFitter clusters={clusters} />
      </MapContainer>
    </div>
  );
}
