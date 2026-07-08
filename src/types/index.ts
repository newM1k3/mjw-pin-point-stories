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
  /** Relation to the users collection — required on create, set to pb.authStore.model.id */
  user: string;
  trip: string;
  location_name: string;
  coordinates: { lat: number; lng: number };
  lenses_used: string[];
  content: string;
  created: string;
}

/** Per-cluster story state lifted to App.tsx so it survives cluster navigation. */
export interface ClusterStoryState {
  selectedLenses: TravelerLens[];
  story: string;
  isSaved: boolean;
}

export interface AppState {
  pins: MapPin[];
  clusters: Cluster[];
  selectedCluster: Cluster | null;
  isProcessing: boolean;
  processingProgress: number;
}
