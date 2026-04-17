import exifr from 'exifr';
import { MapPin, Cluster } from '../types';

export async function processPhotos(
  files: FileList | File[],
  onProgress?: (current: number, total: number) => void
): Promise<MapPin[]> {
  const fileArray = Array.from(files);
  const pins: MapPin[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    onProgress?.(i, fileArray.length);
    try {
      const gps = await exifr.gps(file);
      if (!gps) continue;

      const meta = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
      let timestamp = Date.now();
      if (meta?.DateTimeOriginal) timestamp = new Date(meta.DateTimeOriginal).getTime();
      else if (meta?.CreateDate) timestamp = new Date(meta.CreateDate).getTime();

      const objectUrl = URL.createObjectURL(file);

      pins.push({
        id: crypto.randomUUID(),
        lat: gps.latitude,
        lng: gps.longitude,
        timestamp,
        fileName: file.name,
        thumbnailUrl: objectUrl,
      });
    } catch (err) {
      console.warn(`Failed to process ${file.name}`, err);
    }
  }

  onProgress?.(fileArray.length, fileArray.length);
  return pins.sort((a, b) => a.timestamp - b.timestamp);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function clusterPins(pins: MapPin[], radiusKm = 5): Cluster[] {
  const sorted = [...pins].sort((a, b) => a.timestamp - b.timestamp);
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  for (const pin of sorted) {
    if (assigned.has(pin.id)) continue;

    const group: MapPin[] = [pin];
    assigned.add(pin.id);

    for (const other of sorted) {
      if (assigned.has(other.id)) continue;
      if (haversineKm(pin.lat, pin.lng, other.lat, other.lng) <= radiusKm) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    const centerLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    const centerLng = group.reduce((s, p) => s + p.lng, 0) / group.length;

    clusters.push({
      id: crypto.randomUUID(),
      center: { lat: centerLat, lng: centerLng },
      pins: group,
    });
  }

  return clusters;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    const addr = data.address;
    const city = addr?.city || addr?.town || addr?.village || addr?.county || '';
    const country = addr?.country || '';
    return city && country ? `${city}, ${country}` : data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
