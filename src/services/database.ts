import { db } from '../config/firebase';
import { ref, set, get, update, remove, push, onValue, query, orderByChild, equalTo, off } from 'firebase/database';
import type { Database } from 'firebase/database';

// Types
// ─── Subscriptions & Pricing ────────────────────────────────────────────────
export const MTN_MOMO_MERCHANT_CODE = '678879';
export const MTN_MOMO_USSD_DIAL = '*182*8*1*678879#';

export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceRwf: number;      // editable by admin (changing-price page)
  storageGb: number;     // storage quota in GB
  maxClients: number;    // maximum number of clients allowed
  maxGalleries: number;  // maximum number of galleries allowed
  features: string[];
  popular?: boolean;
}

// Default tiers – Free 1GB, Basic 5GB/5000RWF, Pro 10GB/10000RWF, Enterprise 100GB/50000RWF
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free', name: 'Free', priceRwf: 0, storageGb: 1, maxClients: 5, maxGalleries: 10,
    features: ['1 GB storage', 'Up to 5 clients', 'Up to 10 galleries', 'Password-protected galleries', 'Client favorites & comments'],
  },
  {
    id: 'basic', name: 'Basic', priceRwf: 5000, storageGb: 5, maxClients: 25, maxGalleries: 50,
    features: ['5 GB storage', 'Up to 25 clients', 'Up to 50 galleries', 'Custom branding', 'Priority email support'],
    popular: true,
  },
  {
    id: 'pro', name: 'Pro', priceRwf: 10000, storageGb: 10, maxClients: 100, maxGalleries: 200,
    features: ['10 GB storage', 'Up to 100 clients', 'Up to 200 galleries', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', priceRwf: 50000, storageGb: 100, maxClients: -1, maxGalleries: -1,
    features: ['100 GB storage', 'Unlimited clients', 'Unlimited galleries', 'White-label sharing', 'Dedicated support'],
  },
];

export function getPlanById(plans: SubscriptionPlan[], planId?: string): SubscriptionPlan {
  return plans.find(p => p.id === planId) || plans.find(p => p.id === 'free') || DEFAULT_PLANS[0];
}

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString('en-US')} RWF`;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: PlanId;
  planName: string;
  amountRwf: number;
  method: 'mtn-momo';
  status: 'pending' | 'confirmed' | 'rejected';
  payerNumber?: string;   // the MoMo number the photographer paid from
  reference?: string;     // MoMo transaction reference reported by the payer
  createdAt: string;
  confirmedAt?: string;
}

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
  // Subscription fields (managed manually after MTN MoMo payment confirmation)
  subscriptionPlan?: PlanId;          // defaults to 'free' when absent
  subscriptionExpiresAt?: string;     // ISO date; empty/absent = no fixed expiry
  subscriptionGrantedAt?: string;
  subscriptionNote?: string;
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

// Error thrown when a subscription quota is exceeded
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Database operations
export const database = {
  // User operations
  async createUserProfile(uid: string, profile: Partial<UserProfile>) {
    const userRef = ref(db, `users/${uid}`);
    await set(userRef, { ...profile, uid, createdAt: new Date().toISOString() });
    return { uid, ...profile };
  },

  async getUserProfile(uid: string) {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await get(ref(db, 'users'));
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()) as UserProfile[];
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, data);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  // Client operations
  async createClient(client: Omit<Client, 'id' | 'createdAt'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'clients');
      if (quotaError) throw new QuotaError(quotaError);
    }
    const id = generateId();
    const clientRef = ref(db, `clients/${id}`);
    await set(clientRef, { ...client, id, createdAt: new Date().toISOString() });
    return { ...client, id };
  },

  async getClients() {
    const clientsRef = ref(db, 'clients');
    const snapshot = await get(clientsRef);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getClient(id: string) {
    const clientRef = ref(db, `clients/${id}`);
    const snapshot = await get(clientRef);
    return snapshot.val();
  },

  async updateClient(id: string, data: Partial<Client>) {
    const clientRef = ref(db, `clients/${id}`);
    await update(clientRef, data);
    const snapshot = await get(clientRef);
    return snapshot.val();
  },

  async deleteClient(id: string) {
    const clientRef = ref(db, `clients/${id}`);
    await remove(clientRef);
  },

  // Gallery operations
  async createGallery(gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'galleries');
      if (quotaError) throw new QuotaError(quotaError);
    }
    const id = generateId();
    const galleryRef = ref(db, `galleries/${id}`);
    const data = { ...gallery, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await set(galleryRef, data);
    this.logActivity('gallery_created', `Gallery "${gallery.title}" created`);
    return data;
  },

  async getGalleries() {
    const galleriesRef = ref(db, 'galleries');
    const snapshot = await get(galleriesRef);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getGallery(id: string) {
    const galleryRef = ref(db, `galleries/${id}`);
    const snapshot = await get(galleryRef);
    return snapshot.val();
  },

  async updateGallery(id: string, data: Partial<Gallery>) {
    const galleryRef = ref(db, `galleries/${id}`);
    await update(galleryRef, { ...data, updatedAt: new Date().toISOString() });
    const snapshot = await get(galleryRef);
    return snapshot.val();
  },

  async deleteGallery(id: string) {
    await remove(ref(db, `galleries/${id}`));
    // Cascade-delete related data in the remote database as well
    const [albums, photos] = await Promise.all([
      get(ref(db, 'albums')),
      get(ref(db, 'photos')),
    ]);
    const updates: Record<string, null> = {};
    if (albums.val()) Object.keys(albums.val()).forEach(aid => {
      if (albums.val()[aid].galleryId === id) updates[`albums/${aid}`] = null;
    });
    if (photos.val()) Object.keys(photos.val()).forEach(pid => {
      if (photos.val()[pid].galleryId === id) updates[`photos/${pid}`] = null;
    });
    const [favorites, comments] = await Promise.all([
      get(ref(db, 'favorites')),
      get(ref(db, 'comments')),
    ]);
    if (favorites.val()) Object.keys(favorites.val()).forEach(fid => {
      if (favorites.val()[fid].galleryId === id) updates[`favorites/${fid}`] = null;
    });
    if (comments.val()) Object.keys(comments.val()).forEach(cid => {
      if (comments.val()[cid].galleryId === id) updates[`comments/${cid}`] = null;
    });
    if (Object.keys(updates).length > 0) await update(ref(db), updates);
  },

  // Album operations
  async createAlbum(album: Omit<Album, 'id' | 'createdAt'>) {
    const id = generateId();
    const albumRef = ref(db, `albums/${id}`);
    await set(albumRef, { ...album, id, createdAt: new Date().toISOString() });
    return { ...album, id };
  },

  async getAlbumsByGallery(galleryId: string) {
    const albumsRef = ref(db, 'albums');
    const q = query(albumsRef, orderByChild('galleryId'), equalTo(galleryId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()).sort((a: any, b: any) => a.order - b.order) : [];
  },

  async updateAlbum(id: string, data: Partial<Album>) {
    const albumRef = ref(db, `albums/${id}`);
    await update(albumRef, data);
    const snapshot = await get(albumRef);
    return snapshot.val();
  },

  async deleteAlbum(id: string) {
    await remove(ref(db, `albums/${id}`));
    // Cascade-delete the album's photos from the remote database as well
    const photosSnap = await get(ref(db, 'photos'));
    if (photosSnap.val()) {
      const updates: Record<string, null> = {};
      Object.keys(photosSnap.val()).forEach(pid => {
        if (photosSnap.val()[pid].albumId === id) updates[`photos/${pid}`] = null;
      });
      if (Object.keys(updates).length > 0) await update(ref(db), updates);
    }
  },

  // Photo operations
  async addPhoto(photo: Omit<Photo, 'id' | 'createdAt'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'storage', photo.bytes || 0);
      if (quotaError) throw new QuotaError(quotaError);
    }
    const id = generateId();
    const photoRef = ref(db, `photos/${id}`);
    await set(photoRef, { ...photo, id, createdAt: new Date().toISOString() });
    return { ...photo, id };
  },

  async getPhotosByAlbum(albumId: string) {
    const photosRef = ref(db, 'photos');
    const q = query(photosRef, orderByChild('albumId'), equalTo(albumId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async getPhotosByGallery(galleryId: string) {
    const photosRef = ref(db, 'photos');
    const q = query(photosRef, orderByChild('galleryId'), equalTo(galleryId));
    const snapshot = await get(q);
    return snapshot.val() ? Object.values(snapshot.val()) : [];
  },

  async deletePhoto(id: string) {
    await remove(ref(db, `photos/${id}`));
  },

  // Favorites
  async addFavorite(galleryId: string, photoId: string, clientEmail: string) {
    const id = `${galleryId}_${photoId}_${clientEmail.replace(/[^a-z0-9]/gi, '_')}`;
    await set(ref(db, `favorites/${id}`), { galleryId, photoId, clientEmail, createdAt: new Date().toISOString() });
  },

  async removeFavorite(galleryId: string, photoId: string, clientEmail: string) {
    const id = `${galleryId}_${photoId}_${clientEmail.replace(/[^a-z0-9]/gi, '_')}`;
    await remove(ref(db, `favorites/${id}`));
  },

  async getFavorites(galleryId: string, clientEmail?: string) {
    const favRef = ref(db, 'favorites');
    const snapshot = await get(favRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).filter((f: any) => 
      f.galleryId === galleryId && (!clientEmail || f.clientEmail === clientEmail)
    );
  },

  async getFavoriteCounts(galleryId: string): Promise<Record<string, number>> {
    const favs = await this.getFavorites(galleryId);
    const counts: Record<string, number> = {};
    (favs as Favorite[]).forEach(f => { counts[f.photoId] = (counts[f.photoId] || 0) + 1; });
    return counts;
  },


  // Comments
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const id = generateId();
    await set(ref(db, `comments/${id}`), { ...comment, id, createdAt: new Date().toISOString() });
    return { ...comment, id };
  },

  async getComments(galleryId: string, photoId?: string) {
    const commentsRef = ref(db, 'comments');
    const snapshot = await get(commentsRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).filter((c: any) => 
      c.galleryId === galleryId && (!photoId || c.photoId === photoId)
    );
  },

  async deleteComment(id: string) {
    await remove(ref(db, `comments/${id}`));
  },

  // Activity
  async logActivity(type: string, message: string) {
    const id = generateId();
    await set(ref(db, `activity/${id}`), { id, type, message, createdAt: new Date().toISOString() });
  },

  async getActivity(limit = 20) {
    const activityRef = ref(db, 'activity');
    const snapshot = await get(activityRef);
    if (!snapshot.val()) return [];
    return Object.values(snapshot.val()).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  },

  // Settings
  async getSettings() {
    const settingsRef = ref(db, 'settings');
    const snapshot = await get(settingsRef);
    return snapshot.val() || {};
  },

  async updateSettings(data: Partial<SiteSettings>) {
    const settingsRef = ref(db, 'settings');
    await update(settingsRef, data);
    const snapshot = await get(settingsRef);
    return snapshot.val() || {};
  },

  // ─── Subscription plans / pricing ────────────────────────────────────────
  async getPlans(): Promise<SubscriptionPlan[]> {
    const snapshot = await get(ref(db, 'pricing'));
    const stored = snapshot.val();
    if (!stored) return DEFAULT_PLANS.map(p => ({ ...p }));
    const storedArr: any[] = Array.isArray(stored) ? Object.values(stored) : [];
    // Merge stored overrides onto defaults so new plan fields never go missing
    return DEFAULT_PLANS.map(def => {
      const s = storedArr.find((p: any) => p.id === def.id);
      return s ? { ...def, priceRwf: Number(s.priceRwf ?? def.priceRwf), storageGb: Number(s.storageGb ?? def.storageGb), maxClients: Number(s.maxClients ?? def.maxClients), maxGalleries: Number(s.maxGalleries ?? def.maxGalleries), name: s.name || def.name } : { ...def };
    });
  },

  async savePlans(plans: SubscriptionPlan[]) {
    const cleaned = plans.map(p => ({
      ...p,
      priceRwf: Math.max(0, Number(p.priceRwf) || 0),
      storageGb: Math.max(0, Number(p.storageGb) || 0),
      maxClients: Number(p.maxClients),
      maxGalleries: Number(p.maxGalleries),
    }));
    await set(ref(db, 'pricing'), cleaned);
    this.logActivity('pricing_updated', 'Subscription pricing was updated');
    return cleaned;
  },

  subscribeToPlans(callback: (plans: SubscriptionPlan[]) => void) {
    const pricingRef = ref(db, 'pricing');
    const handler = (snapshot: any) => {
      const stored = snapshot.val();
      if (!stored) { callback(DEFAULT_PLANS.map(p => ({ ...p }))); return; }
      const storedArr: any[] = Array.isArray(stored) ? Object.values(stored) : [];
      callback(DEFAULT_PLANS.map(def => {
        const s = storedArr.find((p: any) => p.id === def.id);
        return s ? { ...def, priceRwf: Number(s.priceRwf ?? def.priceRwf), storageGb: Number(s.storageGb ?? def.storageGb), maxClients: Number(s.maxClients ?? def.maxClients), maxGalleries: Number(s.maxGalleries ?? def.maxGalleries), name: s.name || def.name } : { ...def };
      }));
    };
    onValue(pricingRef, handler);
    return () => off(pricingRef, 'value', handler);
  },

  // ─── Usage & quota enforcement ───────────────────────────────────────────
  async getUserUsage(uid?: string) {
    const photos = uid
      ? ((await this.getPhotosByOwner(uid)) as Photo[])
      : ((await this.getStats()) as any).totalPhotos;
    const totalBytes = uid
      ? photos.reduce((sum: number, p: Photo) => sum + (p.bytes || 0), 0)
      : ((await this.getPhotoBytesAll()));
    const stats = await this.getStats();
    return {
      storageBytes: totalBytes,
      storageGb: totalBytes / (1024 * 1024 * 1024),
      totalPhotos: stats.totalPhotos,
      totalClients: stats.totalClients,
      totalGalleries: stats.totalGalleries,
    };
  },

  async getPhotoBytesAll(): Promise<number> {
    const snapshot = await get(ref(db, 'photos'));
    if (!snapshot.val()) return 0;
    return (Object.values(snapshot.val()) as Photo[]).reduce((s, p) => s + (p.bytes || 0), 0);
  },

  async getPhotosByOwner(uid: string): Promise<Photo[]> {
    // Photos belong to galleries which belong to the current (single-tenant) workspace
    void uid;
    const snapshot = await get(ref(db, 'photos'));
    return snapshot.val() ? (Object.values(snapshot.val()) as Photo[]) : [];
  },

  // Check whether an action is allowed for the given profile; returns error message or null
  async checkQuota(profile: UserProfile | null, resource: 'clients' | 'galleries' | 'storage', additionalBytes = 0): Promise<string | null> {
    const plans = await this.getPlans();
    const plan = getPlanById(plans, profile?.subscriptionPlan);
    // Expired paid subscriptions fall back to Free limits
    let effectivePlan = plan;
    if (plan.id !== 'free' && profile?.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt).getTime() < Date.now()) {
      effectivePlan = getPlanById(plans, 'free');
    }
    if (resource === 'clients') {
      if (effectivePlan.maxClients >= 0) {
        const count = (await this.getClients() as Client[]).length;
        if (count >= effectivePlan.maxClients) {
          return `Your ${effectivePlan.name} plan allows a maximum of ${effectivePlan.maxClients} clients. Upgrade your subscription to add more.`;
        }
      }
      return null;
    }
    if (resource === 'galleries') {
      if (effectivePlan.maxGalleries >= 0) {
        const count = (await this.getGalleries() as Gallery[]).length;
        if (count >= effectivePlan.maxGalleries) {
          return `Your ${effectivePlan.name} plan allows a maximum of ${effectivePlan.maxGalleries} galleries. Upgrade your subscription to add more.`;
        }
      }
      return null;
    }
    if (resource === 'storage') {
      const used = await this.getPhotoBytesAll();
      const limitBytes = effectivePlan.storageGb * 1024 * 1024 * 1024;
      if (used + additionalBytes > limitBytes) {
        const usedGb = (used / (1024 * 1024 * 1024)).toFixed(2);
        return `Storage limit reached (${usedGb} GB of ${effectivePlan.storageGb} GB used on the ${effectivePlan.name} plan). Delete photos or upgrade your subscription.`;
      }
      return null;
    }
    return null;
  },

  // ─── Manual MTN MoMo payments ────────────────────────────────────────────
  async createPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'status'>): Promise<PaymentRecord> {
    const id = generateId();
    const record: PaymentRecord = { ...payment, id, status: 'pending', createdAt: new Date().toISOString() };
    await set(ref(db, `payments/${id}`), record);
    this.logActivity('payment_initiated', `${record.userEmail} started MoMo payment for ${record.planName} (${formatRwf(record.amountRwf)})`);
    return record;
  },

  async getPayments(): Promise<PaymentRecord[]> {
    const snapshot = await get(ref(db, 'payments'));
    if (!snapshot.val()) return [];
    return (Object.values(snapshot.val()) as PaymentRecord[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPaymentsByUser(uid: string): Promise<PaymentRecord[]> {
    const all = await this.getPayments();
    return all.filter(p => p.userId === uid);
  },

  async setPaymentStatus(id: string, status: 'confirmed' | 'rejected') {
    await update(ref(db, `payments/${id}`), { status, ...(status === 'confirmed' ? { confirmedAt: new Date().toISOString() } : {}) });
    const snapshot = await get(ref(db, `payments/${id}`));
    return snapshot.val();
  },

  // Admin grants (or revokes) a subscription plan to a user
  async grantSubscription(adminUid: string, targetUid: string, planId: PlanId, months: number, note?: string) {
    const existing = await this.getUserProfile(targetUid);
    const now = new Date();
    const expires = new Date(now.getTime());
    if (months > 0) expires.setMonth(expires.getMonth() + months);
    const data: Partial<UserProfile> = {
      subscriptionPlan: planId,
      subscriptionGrantedAt: now.toISOString(),
      subscriptionExpiresAt: months > 0 ? expires.toISOString() : '',
      subscriptionNote: note || '',
    };
    await this.updateUserProfile(targetUid, data);
    this.logActivity('subscription_granted', `Subscription "${planId}" granted to ${existing?.email || targetUid}${months > 0 ? ` for ${months} month(s)` : ''} by admin ${adminUid}`);
    return this.getUserProfile(targetUid);
  },

  // Realtime listeners
  subscribeToGalleries(callback: (galleries: Gallery[]) => void) {
    const galleriesRef = ref(db, 'galleries');
    const handler = (snapshot: any) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      callback(data as Gallery[]);
    };
    onValue(galleriesRef, handler);
    return () => off(galleriesRef, 'value', handler);
  },

  subscribeToClients(callback: (clients: Client[]) => void) {
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
