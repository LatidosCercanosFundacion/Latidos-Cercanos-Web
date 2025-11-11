export type PostType = 'LOST' | 'FOUND';
export type View = 'home' | 'createPost';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PetPost {
  id: string;
  type: PostType;
  userId: string;
  userName: string;
  photoUrl: string;
  breed: string;
  color: string;
  size: string;
  description: string;
  location: GeoPoint;
  createdAt: Date;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GroundedResponse {
  text: string;
  sources: GroundingSource[];
}

// Since Leaflet is loaded via a script tag, we declare its global variable `L` for TypeScript.
// FIX: Wrap 'L' declaration in `declare global` to correctly augment the global scope from within a module.
declare global {
  var L: any;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
