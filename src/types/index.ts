export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  fileName: string;
  thumbnailUrl?: string;
}

export interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  pins: MapPin[];
  locationName?: string;
}

export type TravelerLens =
  | 'Food & Wine'
  | 'Architecture'
  | 'Romance'
  | 'History'
  | 'Culture & Arts'
  | 'Nature'
  | 'Adventure';

export interface Story {
  id: string;
  trip: string;
  location_name: string;
  coordinates: { lat: number; lng: number };
  lenses_used: string[];
  content: string;
  created: string;
}

export interface AppState {
  pins: MapPin[];
  clusters: Cluster[];
  selectedCluster: Cluster | null;
  isProcessing: boolean;
  processingProgress: number;
}
