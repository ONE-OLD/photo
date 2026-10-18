import { auth, db } from '../config/firebase';
import { ref, set, get, update, remove, push, onValue, query, orderByChild, equalTo, off } from 'firebase/database';
import type { Database } from 'firebase/database';

// Types
// ─── Subscriptions & Pricing ────────────────────────────────────────────────
export const MTN_MOMO_MERCHANT_CODE = '678879';
export const MTN_MOMO_USSD_DIAL = '*182*8*1*678879#';

export { DEFAULT_PLANS, getPlanById, formatRwf } from './pricing';
export type { PlanId, SubscriptionPlan, BillingCycle } from './pricing';
import { getPlanById, formatRwf, normalizePlans, validatePlans, addCalendarMonths, paymentDuration, validatePaymentQuote, type PlanId, type SubscriptionPlan, type BillingCycle } from './pricing';

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: PlanId;
  planName: string;
  amountRwf: number;
  billingCycle?: BillingCycle;
  durationMonths?: number;
  baseAmountRwf?: number;
  discountPercent?: number;
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
  ownerUid: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Gallery {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  coverImageId?: string;
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
  ownerUid: string;
  galleryId: string;
  title: string;
  coverImage?: string;
  order: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  ownerUid: string;
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
  ownerUid: string;
  galleryId: string;
  photoId: string;
  clientEmail: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  ownerUid: string;
  galleryId: string;
  photoId: string;
  clientEmail: string;
  clientName: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  ownerUid: string;
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

function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to access photographer data.');
  return uid;
}

async function getOwnedRecords<T>(collection: string, uid = currentUid()): Promise<T[]> {
  const recordsQuery = query(ref(db, collection), orderByChild('ownerUid'), equalTo(uid));
  const snapshot = await get(recordsQuery);
  return snapshot.val() ? Object.values(snapshot.val()) as T[] : [];
}

async function removeRecordsByField(collection: string, field: string, value: string) {
  const recordsQuery = query(ref(db, collection), orderByChild(field), equalTo(value));
  const snapshot = await get(recordsQuery);
  if (!snapshot.val()) return;
  await Promise.all(Object.keys(snapshot.val()).map(id => remove(ref(db, `${collection}/${id}`))));
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
    const updates = Object.fromEntries(
      Object.entries(data).map(([field, value]) => [`users/${uid}/${field}`, value])
    );
    await update(ref(db), updates);
    return this.getUserProfile(uid);
  },

  // Client operations
  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'ownerUid'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'clients');
      if (quotaError) throw new QuotaError(quotaError);
    }
    const id = generateId();
    const clientRef = ref(db, `clients/${id}`);
    const data = { ...client, id, ownerUid: currentUid(), createdAt: new Date().toISOString() };
    await set(clientRef, data);
    return data;
  },

  async getClients() {
    return getOwnedRecords<Client>('clients');
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
  async createGallery(gallery: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'galleries');
      if (quotaError) throw new QuotaError(quotaError);
    }
    const id = generateId();
    const galleryRef = ref(db, `galleries/${id}`);
    const data = { ...gallery, id, ownerUid: currentUid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await set(galleryRef, data);
    this.logActivity('gallery_created', `Gallery "${gallery.title}" created`);
    return data;
  },

  async getGalleries() {
    return getOwnedRecords<Gallery>('galleries');
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
    const gallery = await this.getGallery(id) as Gallery | null;
    if (!gallery || gallery.ownerUid !== currentUid()) throw new Error('You do not own this gallery.');
    await Promise.all([
      removeRecordsByField('albums', 'galleryId', id),
      removeRecordsByField('photos', 'galleryId', id),
      removeRecordsByField('favorites', 'galleryId', id),
      removeRecordsByField('comments', 'galleryId', id),
    ]);
    await remove(ref(db, `galleries/${id}`));
  },

  // Album operations
  async createAlbum(album: Omit<Album, 'id' | 'createdAt' | 'ownerUid'>) {
    const gallery = await this.getGallery(album.galleryId) as Gallery | null;
    const ownerUid = currentUid();
    if (!gallery || gallery.ownerUid !== ownerUid) throw new Error('You do not own this gallery.');
    const id = generateId();
    const albumRef = ref(db, `albums/${id}`);
    const data = { ...album, id, ownerUid, createdAt: new Date().toISOString() };
    await set(albumRef, data);
    return data;
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
    const albumSnapshot = await get(ref(db, `albums/${id}`));
    if (albumSnapshot.val()?.ownerUid !== currentUid()) throw new Error('You do not own this album.');
    await removeRecordsByField('photos', 'albumId', id);
    await remove(ref(db, `albums/${id}`));
  },

  // Photo operations
  async addPhoto(photo: Omit<Photo, 'id' | 'createdAt' | 'ownerUid'>, profile?: UserProfile | null) {
    if (profile) {
      const quotaError = await this.checkQuota(profile, 'storage', photo.bytes || 0);
      if (quotaError) throw new QuotaError(quotaError);
    }
    const gallery = await this.getGallery(photo.galleryId) as Gallery | null;
    const ownerUid = currentUid();
    if (!gallery || gallery.ownerUid !== ownerUid) throw new Error('You do not own this gallery.');
    const id = generateId();
    const photoRef = ref(db, `photos/${id}`);
    const data = { ...photo, id, ownerUid, createdAt: new Date().toISOString() };
    await set(photoRef, data);
    return data;
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
    const gallery = await this.getGallery(galleryId) as Gallery | null;
    if (!gallery) throw new Error('Gallery not found.');
    await set(ref(db, `favorites/${id}`), { ownerUid: gallery.ownerUid, galleryId, photoId, clientEmail, createdAt: new Date().toISOString() });
  },

  async removeFavorite(galleryId: string, photoId: string, clientEmail: string) {
    const id = `${galleryId}_${photoId}_${clientEmail.replace(/[^a-z0-9]/gi, '_')}`;
    await remove(ref(db, `favorites/${id}`));
  },

  async getFavorites(galleryId: string, clientEmail?: string) {
    const favRef = ref(db, 'favorites');
    const q = query(favRef, orderByChild('galleryId'), equalTo(galleryId));
    const snapshot = await get(q);
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
  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'ownerUid'>) {
    const id = generateId();
    const gallery = await this.getGallery(comment.galleryId) as Gallery | null;
    if (!gallery) throw new Error('Gallery not found.');
    if (gallery.status !== 'published' || !gallery.allowComments || (gallery.expirationDate && new Date(gallery.expirationDate) < new Date())) throw new Error('Comments are unavailable for this gallery.');
    const text = comment.text.trim();
    if (!text || text.length > 2000) throw new Error('Comments must contain between 1 and 2000 characters.');
    const photoSnapshot = await get(ref(db, `photos/${comment.photoId}`));
    if (photoSnapshot.val()?.galleryId !== gallery.id) throw new Error('Photo does not belong to this gallery.');
    const data = { ...comment, text, id, ownerUid: gallery.ownerUid, createdAt: new Date().toISOString() };
    await set(ref(db, `comments/${id}`), data);
    return data;
  },

  async getComments(galleryId: string, photoId?: string): Promise<Comment[]> {
    const uid = currentUid();
    const gallery = await this.getGallery(galleryId) as Gallery | null;
    if (!gallery || gallery.ownerUid !== uid) throw new Error('Only the gallery owner can read comments.');
    const comments = await getOwnedRecords<Comment>('comments', uid);
    return comments.filter(comment => comment.galleryId === galleryId && (!photoId || comment.photoId === photoId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async deleteComment(id: string) {
    await remove(ref(db, `comments/${id}`));
  },

  // Activity
  async logActivity(type: string, message: string) {
    const id = generateId();
    await set(ref(db, `activity/${id}`), { id, ownerUid: currentUid(), type, message, createdAt: new Date().toISOString() });
  },

  async getActivity(limit = 20) {
    const activity = await getOwnedRecords<Activity>('activity');
    return activity.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  },

  // Settings
  async getSettings() {
    const settingsRef = ref(db, `settings/${currentUid()}`);
    const snapshot = await get(settingsRef);
    return snapshot.val() || {};
  },

  async updateSettings(data: Partial<SiteSettings>) {
    const settingsRef = ref(db, `settings/${currentUid()}`);
    await update(settingsRef, data);
    const snapshot = await get(settingsRef);
    return snapshot.val() || {};
  },

  // ─── Subscription plans / pricing ────────────────────────────────────────
  async getPlans(): Promise<SubscriptionPlan[]> {
    const snapshot = await get(ref(db, 'pricing'));
    return normalizePlans(snapshot.val());
  },

  async savePlans(plans: SubscriptionPlan[]) {
    validatePlans(plans);
    const cleaned = normalizePlans(plans);
    await set(ref(db, 'pricing'), cleaned);
    void this.logActivity('pricing_updated', 'Subscription pricing was updated');
    return cleaned;
  },

  subscribeToPlans(callback: (plans: SubscriptionPlan[]) => void, onError?: (error: Error) => void) {
    return onValue(ref(db, 'pricing'), snapshot => callback(normalizePlans(snapshot.val())), onError);
  },

  // ─── Usage & quota enforcement ───────────────────────────────────────────
  async getUserUsage(uid = currentUid()) {
    const [photos, galleries, clients] = await Promise.all([
      getOwnedRecords<Photo>('photos', uid),
      getOwnedRecords<Gallery>('galleries', uid),
      getOwnedRecords<Client>('clients', uid),
    ]);
    const totalBytes = (photos as Photo[]).reduce((sum, photo) => sum + (photo.bytes || 0), 0);
    return {
      storageBytes: totalBytes,
      storageGb: totalBytes / (1024 * 1024 * 1024),
      totalPhotos: photos.length,
      totalClients: clients.length,
      totalGalleries: galleries.length,
    };
  },

  async getPhotoBytesAll(uid = currentUid()): Promise<number> {
    const photos = await this.getPhotosByOwner(uid);
    return photos.reduce((sum, photo) => sum + (photo.bytes || 0), 0);
  },

  async getPhotosByOwner(uid: string): Promise<Photo[]> {
    return getOwnedRecords<Photo>('photos', uid);
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
    validatePaymentQuote(payment);
    const record: PaymentRecord = { ...payment, id, status: 'pending', createdAt: new Date().toISOString() };
    await set(ref(db, `payments/${id}`), record);
    void this.logActivity('payment_initiated', `${record.userEmail} started MoMo payment for ${record.planName} (${formatRwf(record.amountRwf)})`);
    return record;
  },

  async getPayments(): Promise<PaymentRecord[]> {
    const snapshot = await get(ref(db, 'payments'));
    if (!snapshot.val()) return [];
    return (Object.values(snapshot.val()) as PaymentRecord[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPaymentsByUser(uid: string): Promise<PaymentRecord[]> {
    const paymentsRef = ref(db, 'payments');
    const userPayments = query(paymentsRef, orderByChild('userId'), equalTo(uid));
    const snapshot = await get(userPayments);
    if (!snapshot.val()) return [];
    return (Object.values(snapshot.val()) as PaymentRecord[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async setPaymentStatus(id: string, status: 'confirmed' | 'rejected') {
    const adminUid = currentUid();
    const admin = await this.getUserProfile(adminUid);
    if (admin?.role !== 'admin') throw new Error('Admin access is required to review payments.');
    const snapshot = await get(ref(db, `payments/${id}`));
    const payment = snapshot.val() as PaymentRecord | null;
    if (!payment) throw new Error('Payment not found.');
    if (payment.status === status) return payment;
    if (payment.status !== 'pending') throw new Error('This payment was already reviewed. Reload the payment list.');
    const now = new Date();
    const changes: Record<string, unknown> = { [`payments/${id}/status`]: status };
    if (status === 'confirmed') {
      validatePaymentQuote(payment);
      const months = paymentDuration(payment);
      const existing = await this.getUserProfile(payment.userId);
      if (!existing) throw new Error('The payer profile no longer exists.');
      const oldExpiry = existing.subscriptionExpiresAt ? new Date(existing.subscriptionExpiresAt) : null;
      const start = existing.subscriptionPlan === payment.planId && oldExpiry && oldExpiry.getTime() > now.getTime() ? oldExpiry : now;
      changes[`payments/${id}/confirmedAt`] = now.toISOString();
      changes[`users/${payment.userId}/subscriptionPlan`] = payment.planId;
      changes[`users/${payment.userId}/subscriptionGrantedAt`] = now.toISOString();
      changes[`users/${payment.userId}/subscriptionExpiresAt`] = addCalendarMonths(start, months).toISOString();
      changes[`users/${payment.userId}/subscriptionNote`] = `MoMo payment ${payment.reference || id}: ${payment.planName}, ${months} month(s), ${formatRwf(payment.amountRwf)}`;
    }
    // Record review and activation together: neither can succeed alone.
    await update(ref(db), changes);
    return { ...payment, status };
  },

  // Admin grants (or revokes) a subscription plan to a user
  async grantSubscription(adminUid: string, targetUid: string, planId: PlanId, months: number, note?: string) {
    if (adminUid !== currentUid() || (await this.getUserProfile(adminUid))?.role !== 'admin') throw new Error('Admin access is required to manage subscriptions.');
    if (!['free', 'basic', 'pro', 'enterprise'].includes(planId)) throw new Error('Choose an existing plan.');
    if (!Number.isSafeInteger(months) || months < 0 || (planId === 'free' && months !== 0)) throw new Error('Choose a valid duration.');
    const existing = await this.getUserProfile(targetUid);
    if (!existing) throw new Error('This account no longer exists.');
    const now = new Date();
    const expires = addCalendarMonths(now, months);
    if (months > 0 && !Number.isFinite(expires.getTime())) throw new Error('Choose a valid duration.');
    const data: Partial<UserProfile> = {
      subscriptionPlan: planId,
      subscriptionGrantedAt: now.toISOString(),
      subscriptionExpiresAt: months > 0 ? expires.toISOString() : '',
      subscriptionNote: note || '',
    };
    await update(ref(db, `users/${targetUid}`), data);
    void this.logActivity('subscription_granted', `Subscription "${planId}" granted to ${existing?.email || targetUid}${months > 0 ? ` for ${months} month(s)` : ''} by admin ${adminUid}`).catch(() => {});
    return { ...existing, ...data };
  },

  // Realtime listeners
  subscribeToGalleries(callback: (galleries: Gallery[]) => void) {
    const galleriesRef = ref(db, 'galleries');
    const galleriesQuery = query(galleriesRef, orderByChild('ownerUid'), equalTo(currentUid()));
    const handler = (snapshot: any) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      callback(data as Gallery[]);
    };
    onValue(galleriesQuery, handler);
    return () => off(galleriesQuery, 'value', handler);
  },

  subscribeToClients(callback: (clients: Client[]) => void) {
    const clientsRef = ref(db, 'clients');
    const clientsQuery = query(clientsRef, orderByChild('ownerUid'), equalTo(currentUid()));
    const handler = (snapshot: any) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      callback(data as Client[]);
    };
    onValue(clientsQuery, handler);
    return () => off(clientsQuery, 'value', handler);
  },

  // Stats
  async getStats(allUsers = false) {
    const collections = allUsers
      ? await Promise.all(['galleries', 'clients', 'photos', 'albums', 'favorites'].map(async collection => {
        const snapshot = await get(ref(db, collection));
        return snapshot.val() ? Object.values(snapshot.val()) : [];
      }))
      : await Promise.all([
        getOwnedRecords<Gallery>('galleries'),
        getOwnedRecords<Client>('clients'),
        getOwnedRecords<Photo>('photos'),
        getOwnedRecords<Album>('albums'),
        getOwnedRecords<Favorite>('favorites'),
      ]);
    const [galleries, clients, photos, albums, favorites] = collections;
    return {
      totalGalleries: galleries.length,
      publishedGalleries: galleries.filter((g: any) => g.status === 'published').length,
      totalClients: clients.length,
      totalPhotos: photos.length,
      totalAlbums: albums.length,
      totalFavorites: favorites.length,
    };
  }
};
