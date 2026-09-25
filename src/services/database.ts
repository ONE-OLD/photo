import { db } from '../config/firebase';
import { ref, set, get, update, remove, push, onValue, query, orderByChild, equalTo, off } from 'firebase/database';
import type { Database } from 'firebase/database';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  studioName?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  location?: string;
  bio?: string;
  logo?: string;
  profileImage?: string;
  brandColor?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Gallery {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private';
  password?: string;
  passwordProtected: boolean;
  allowDownloads: boolean;
  allowFavorites: boolean;
  allowComments: boolean;
  expirationDate?: string;
  eventDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  galleryId: string;
  title: string;
  coverImage?: string;
  order: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  galleryId: string;
  albumId: string;
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
}

export interface Favorite {
  galleryId: string;
  photoId: string;
  clientEmail: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  galleryId: string;
  photoId: string;
  clientEmail: string;
  clientName: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface SiteSettings {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutText?: string;
  services?: string[];
  socialLinks?: Record<string, string>;
}

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Demo data mode - used when Firebase is not configured
const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key';

// In-memory storage for demo mode
let demoData: Record<string, any> = {
  users: {},
  clients: {},
  galleries: {},
  albums: {},
  photos: {},
  favorites: {},
  comments: {},
  activity: {},
  settings: {
    heroTitle: 'Capture Every Moment',
    heroSubtitle: 'Professional photography gallery platform for delivering stunning client experiences',
    aboutText: 'We help photographers deliver beautiful, organized galleries to their clients.',
    services: ['Wedding Photography', 'Portrait Sessions', 'Event Coverage', 'Commercial Work']
  }
};

// Listeners for demo mode
const demoListeners: Record<string, Function[]> = {};

function notifyListeners(path: string) {
  if (demoListeners[path]) {
    demoListeners[path].forEach(cb => cb(demoData[path]));
  }
}

// Database operations
export const database = {
  // User operations
  async createUserProfile(uid: string, profile: Partial<UserProfile>) {
    if (isDemoMode) {
      demoData.users[uid] = { uid, ...profile, createdAt: new Date().toISOString() };
      return demoData.users[uid];
    }
    const userRef = ref(db, `users/${uid}`);
    await set(userRef, { ...profile, uid, createdAt: new Date().toISOString() });
    return { uid, ...profile };
  },

  async getUserProfile(uid: string) {
    if (isDemoMode) return demoData.users[uid] || null;
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    if (isDemoMode) {
      demoData.users[uid] = { ...demoData.users[uid], ...data };
      return demoData.users[uid];
    }
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, data);
    return { ...demoData.users?.[uid], ...data };
  },

  // Client operations
  async createClient(client: Omit<Client, 'id' | 'createdAt'>) {
    const id = generateId();
    if (isDemoMode) {
      demoData.clients[id] = { ...client, id, createdAt: new Date().toISOString() };
      notifyListeners('clients');
      return demoData.clients[id];
    }
    const clientRef = ref(db, `clients/${id}`);
    await set(clientRef, { ...client, id, createdAt: new Date().toISOString() });
    return { ...client, id };
  },

  async getClients() {
    if (isDemoMode) return Object.values(demoData.clients);
    const clientsRef = ref(db, 'clients');
    const snapshot = await get(clientsRef);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getClient(id: string) {
    if (isDemoMode) return demoData.clients[id] || null;
    const clientRef = ref(db, `clients/${id}`);
    const snapshot = await get(clientRef);
    return snapshot.val();
  },

  async updateClient(id: string, data: Partial<Client>) {
    if (isDemoMode) {
      demoData.clients[id] = { ...demoData.clients[id], ...data };
      notifyListeners('clients');
      return demoData.clients[id];
    }
    const clientRef = ref(db, `clients/${id}`);
    await update(clientRef, data);
    return { ...demoData.clients[id], ...data };
  },

  async deleteClient(id: string) {
    if (isDemoMode) {
      delete demoData.clients[id];
      notifyListeners('clients');
      return;
    }
    const clientRef = ref(db, `clients/${id}`);
    await remove(clientRef);
  },

  // Gallery operations
  async createGallery(gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = generateId();
    if (isDemoMode) {
      demoData.galleries[id] = { ...gallery, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      notifyListeners('galleries');
      this.logActivity('gallery_created', `Gallery "${gallery.title}" created`);
      return demoData.galleries[id];
    }
    const galleryRef = ref(db, `galleries/${id}`);
    const data = { ...gallery, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await set(galleryRef, data);
    this.logActivity('gallery_created', `Gallery "${gallery.title}" created`);
    return data;
  },

  async getGalleries() {
    if (isDemoMode) return Object.values(demoData.galleries);
    const galleriesRef = ref(db, 'galleries');
    const snapshot = await get(galleriesRef);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getGallery(id: string) {
    if (isDemoMode) return demoData.galleries[id] || null;
    const galleryRef = ref(db, `galleries/${id}`);
    const snapshot = await get(galleryRef);
    return snapshot.val();
  },

  async updateGallery(id: string, data: Partial<Gallery>) {
    if (isDemoMode) {
      demoData.galleries[id] = { ...demoData.galleries[id], ...data, updatedAt: new Date().toISOString() };
      notifyListeners('galleries');
      return demoData.galleries[id];
    }
    const galleryRef = ref(db, `galleries/${id}`);
    await update(galleryRef, { ...data, updatedAt: new Date().toISOString() });
    return { ...demoData.galleries[id], ...data };
  },

  async deleteGallery(id: string) {
    if (isDemoMode) {
      delete demoData.galleries[id];
      // Also delete related albums and photos
      Object.keys(demoData.albums).forEach(aid => {
        if (demoData.albums[aid].galleryId === id) delete demoData.albums[aid];
      });
      Object.keys(demoData.photos).forEach(pid => {
        if (demoData.photos[pid].galleryId === id) delete demoData.photos[pid];
      });
      notifyListeners('galleries');
      return;
    }
    await remove(ref(db, `galleries/${id}`));
  },

  // Album operations
  async createAlbum(album: Omit<Album, 'id' | 'createdAt'>) {
    const id = generateId();
    if (isDemoMode) {
      demoData.albums[id] = { ...album, id, createdAt: new Date().toISOString() };
      notifyListeners('albums');
      return demoData.albums[id];
    }
    const albumRef = ref(db, `albums/${id}`);
    await set(albumRef, { ...album, id, createdAt: new Date().toISOString() });
    return { ...album, id };
  },

  async getAlbumsByGallery(galleryId: string) {
    if (isDemoMode) return (Object.values(demoData.albums) as Album[]).filter((a) => a.galleryId === galleryId).sort((a, b) => a.order - b.order);
    const albumsRef = ref(db, 'albums');
    const q = query(albumsRef, orderByChild('galleryId'), equalTo(galleryId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()).sort((a: any, b: any) => a.order - b.order) : [];
  },

  async updateAlbum(id: string, data: Partial<Album>) {
    if (isDemoMode) {
      demoData.albums[id] = { ...demoData.albums[id], ...data };
      notifyListeners('albums');
      return demoData.albums[id];
    }
    const albumRef = ref(db, `albums/${id}`);
    await update(albumRef, data);
    return { ...demoData.albums[id], ...data };
  },

  async deleteAlbum(id: string) {
    if (isDemoMode) {
      delete demoData.albums[id];
      Object.keys(demoData.photos).forEach(pid => {
        if (demoData.photos[pid].albumId === id) delete demoData.photos[pid];
      });
      notifyListeners('albums');
      return;
    }
    await remove(ref(db, `albums/${id}`));
  },

  // Photo operations
  async addPhoto(photo: Omit<Photo, 'id' | 'createdAt'>) {
    const id = generateId();
    if (isDemoMode) {
      demoData.photos[id] = { ...photo, id, createdAt: new Date().toISOString() };
      notifyListeners('photos');
      return demoData.photos[id];
    }
    const photoRef = ref(db, `photos/${id}`);
    await set(photoRef, { ...photo, id, createdAt: new Date().toISOString() });
    return { ...photo, id };
  },

  async getPhotosByAlbum(albumId: string) {
    if (isDemoMode) return (Object.values(demoData.photos) as Photo[]).filter((p) => p.albumId === albumId);
    const photosRef = ref(db, 'photos');
    const q = query(photosRef, orderByChild('albumId'), equalTo(albumId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getPhotosByGallery(galleryId: string) {
    if (isDemoMode) return (Object.values(demoData.photos) as Photo[]).filter((p) => p.galleryId === galleryId);
    const photosRef = ref(db, 'photos');
    const q = query(photosRef, orderByChild('galleryId'), equalTo(galleryId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async deletePhoto(id: string) {
    if (isDemoMode) {
      delete demoData.photos[id];
      notifyListeners('photos');
      return;
    }
    await remove(ref(db, `photos/${id}`));
  },

  // Favorites
  async addFavorite(galleryId: string, photoId: string, clientEmail: string) {
    const id = `${galleryId}_${photoId}_${clientEmail.replace(/[^a-z0-9]/gi, '_')}`;
    if (isDemoMode) {
      demoData.favorites[id] = { galleryId, photoId, clientEmail, createdAt: new Date().toISOString() };
      notifyListeners('favorites');
      return;
    }
    await set(ref(db, `favorites/${id}`), { galleryId, photoId, clientEmail, createdAt: new Date().toISOString() });
  },

  async removeFavorite(galleryId: string, photoId: string, clientEmail: string) {
    const id = `${galleryId}_${photoId}_${clientEmail.replace(/[^a-z0-9]/gi, '_')}`;
    if (isDemoMode) {
      delete demoData.favorites[id];
      notifyListeners('favorites');
      return;
    }
    await remove(ref(db, `favorites/${id}`));
  },

  async getFavorites(galleryId: string, clientEmail?: string) {
    if (isDemoMode) {
      return (Object.values(demoData.favorites) as Favorite[]).filter((f) => 
        f.galleryId === galleryId && (!clientEmail || f.clientEmail === clientEmail)
      );
    }
    const favRef = ref(db, 'favorites');
    const snapshot = await get(favRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).filter((f: any) => 
      f.galleryId === galleryId && (!clientEmail || f.clientEmail === clientEmail)
    );
  },

  // Comments
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const id = generateId();
    if (isDemoMode) {
      demoData.comments[id] = { ...comment, id, createdAt: new Date().toISOString() };
      notifyListeners('comments');
      return demoData.comments[id];
    }
    await set(ref(db, `comments/${id}`), { ...comment, id, createdAt: new Date().toISOString() });
    return { ...comment, id };
  },

  async getComments(galleryId: string, photoId?: string) {
    if (isDemoMode) {
      return (Object.values(demoData.comments) as Comment[]).filter((c) => 
        c.galleryId === galleryId && (!photoId || c.photoId === photoId)
      );
    }
    const commentsRef = ref(db, 'comments');
    const snapshot = await get(commentsRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).filter((c: any) => 
      c.galleryId === galleryId && (!photoId || c.photoId === photoId)
    );
  },

  async deleteComment(id: string) {
    if (isDemoMode) {
      delete demoData.comments[id];
      notifyListeners('comments');
      return;
    }
    await remove(ref(db, `comments/${id}`));
  },

  // Activity
  async logActivity(type: string, message: string) {
    const id = generateId();
    if (isDemoMode) {
      demoData.activity[id] = { id, type, message, createdAt: new Date().toISOString() };
      notifyListeners('activity');
      return;
    }
    await set(ref(db, `activity/${id}`), { id, type, message, createdAt: new Date().toISOString() });
  },

  async getActivity(limit = 20) {
    if (isDemoMode) {
      return Object.values(demoData.activity).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, limit);
    }
    const activityRef = ref(db, 'activity');
    const snapshot = await get(activityRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  },

  // Settings
  async getSettings() {
    if (isDemoMode) return demoData.settings;
    const settingsRef = ref(db, 'settings');
    const snapshot = await get(settingsRef);
    return snapshot.val() || {};
  },

  async updateSettings(data: Partial<SiteSettings>) {
    if (isDemoMode) {
      demoData.settings = { ...demoData.settings, ...data };
      return demoData.settings;
    }
    const settingsRef = ref(db, 'settings');
    await update(settingsRef, data);
    return { ...demoData.settings, ...data };
  },

  // Realtime listeners
  subscribeToGalleries(callback: (galleries: Gallery[]) => void) {
    if (isDemoMode) {
      const cb = () => callback(Object.values(demoData.galleries));
      if (!demoListeners['galleries']) demoListeners['galleries'] = [];
      demoListeners['galleries'].push(cb);
      callback(Object.values(demoData.galleries));
      return () => {
        demoListeners['galleries'] = demoListeners['galleries'].filter(f => f !== cb);
      };
    }
    const galleriesRef = ref(db, 'galleries');
    const handler = (snapshot: any) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      callback(data as Gallery[]);
    };
    onValue(galleriesRef, handler);
    return () => off(galleriesRef, 'value', handler);
  },

  subscribeToClients(callback: (clients: Client[]) => void) {
    if (isDemoMode) {
      const cb = () => callback(Object.values(demoData.clients));
      if (!demoListeners['clients']) demoListeners['clients'] = [];
      demoListeners['clients'].push(cb);
      callback(Object.values(demoData.clients));
      return () => {
        demoListeners['clients'] = demoListeners['clients'].filter(f => f !== cb);
      };
    }
    const clientsRef = ref(db, 'clients');
    const handler = (snapshot: any) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      callback(data as Client[]);
    };
    onValue(clientsRef, handler);
    return () => off(clientsRef, 'value', handler);
  },

  // Stats
  async getStats() {
    if (isDemoMode) {
      return {
        totalGalleries: Object.keys(demoData.galleries).length,
        publishedGalleries: (Object.values(demoData.galleries) as Gallery[]).filter((g) => g.status === 'published').length,
        totalClients: Object.keys(demoData.clients).length,
        totalPhotos: Object.keys(demoData.photos).length,
        totalAlbums: Object.keys(demoData.albums).length,
        totalFavorites: Object.keys(demoData.favorites).length,
      };
    }
    const [galleriesSnap, clientsSnap, photosSnap, albumsSnap, favoritesSnap] = await Promise.all([
      get(ref(db, 'galleries')),
      get(ref(db, 'clients')),
      get(ref(db, 'photos')),
      get(ref(db, 'albums')),
      get(ref(db, 'favorites')),
    ]);
    const galleries = galleriesSnap.val() ? Object.values(galleriesSnap.val()) : [];
    return {
      totalGalleries: galleries.length,
      publishedGalleries: galleries.filter((g: any) => g.status === 'published').length,
      totalClients: clientsSnap.val() ? Object.keys(clientsSnap.val()).length : 0,
      totalPhotos: photosSnap.val() ? Object.keys(photosSnap.val()).length : 0,
      totalAlbums: albumsSnap.val() ? Object.keys(albumsSnap.val()).length : 0,
      totalFavorites: favoritesSnap.val() ? Object.keys(favoritesSnap.val()).length : 0,
    };
  }
};
