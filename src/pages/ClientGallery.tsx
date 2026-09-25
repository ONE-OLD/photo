import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database, type Gallery, type Album, type Photo, type Comment } from '../services/database';
import { useToast } from '../context/AppContext';
import { Button, Input, Modal, Spinner, EmptyState, Badge } from '../components/UI';
import { Heart, Download, ChevronLeft, ChevronRight, X, Lock, MessageCircle, Send, Camera, ArrowLeft, ZoomIn, Share2 } from 'lucide-react';

export function ClientGalleryPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [clientEmail] = useState(() => `client_${Math.random().toString(36).substring(2, 8)}@guest.com`);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { addToast } = useToast();

  const currentPhotos = selectedAlbum ? photos.filter(p => p.albumId === selectedAlbum) : photos;

  useEffect(() => {
    const load = async () => {
      if (!galleryId) return;
      const g = await database.getGallery(galleryId);
      if (!g) { setLoading(false); return; }
      setGallery(g as Gallery);

      // Check if gallery is accessible
      const gal = g as Gallery;
      if (gal.status !== 'published') {
        setLoading(false);
        return;
      }
      if (gal.expirationDate && new Date(gal.expirationDate) < new Date()) {
        setLoading(false);
        return;
      }
      if (!gal.passwordProtected) {
        setAuthorized(true);
        const [a, p] = await Promise.all([
          database.getAlbumsByGallery(galleryId),
          database.getPhotosByGallery(galleryId),
        ]);
        setAlbums(a as Album[]);
        setPhotos(p as Photo[]);
        if ((a as Album[]).length > 0) setSelectedAlbum((a as Album[])[0].id);
        
        // Load favorites
        const favs = await database.getFavorites(galleryId);
        setFavorites((favs as any[]).filter(f => f.clientEmail === clientEmail).map(f => f.photoId));
      }
      setLoading(false);
    };
    load();
  }, [galleryId]);

  const handlePasswordSubmit = async () => {
    if (!gallery) return;
    if (gallery.password === password) {
      setAuthorized(true);
      setPasswordError('');
      const [a, p] = await Promise.all([
        database.getAlbumsByGallery(galleryId!),
        database.getPhotosByGallery(galleryId!),
      ]);
      setAlbums(a as Album[]);
      setPhotos(p as Photo[]);
      if ((a as Album[]).length > 0) setSelectedAlbum((a as Album[])[0].id);
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const toggleFavorite = async (photoId: string) => {
    if (!galleryId || !gallery?.allowFavorites) return;
    const isFav = favorites.includes(photoId);
    if (isFav) {
      await database.removeFavorite(galleryId, photoId, clientEmail);
      setFavorites(prev => prev.filter(f => f !== photoId));
    } else {
      await database.addFavorite(galleryId, photoId, clientEmail);
      setFavorites(prev => [...prev, photoId]);
    }
  };

  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.secureUrl;
    link.download = `photo_${photo.id}.${photo.format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !galleryId || !lightboxPhoto) return;
    await database.addComment({
      galleryId,
      photoId: lightboxPhoto.id,
      clientEmail,
      clientName: 'Guest',
      text: newComment,
    });
    setNewComment('');
    const c = await database.getComments(galleryId, lightboxPhoto.id);
    setComments(c as Comment[]);
    addToast('Comment added', 'success');
  };

  const openLightbox = (photo: Photo, index: number) => {
    setLightboxPhoto(photo);
    setLightboxIndex(index);
    // Load comments for this photo
    database.getComments(galleryId!, photo.id).then(c => setComments(c as Comment[]));
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (lightboxIndex + 1) % currentPhotos.length 
      : (lightboxIndex - 1 + currentPhotos.length) % currentPhotos.length;
    setLightboxIndex(newIndex);
    setLightboxPhoto(currentPhotos[newIndex]);
    database.getComments(galleryId!, currentPhotos[newIndex].id).then(c => setComments(c as Comment[]));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxPhoto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPhoto(null);
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
      if (e.key === 'ArrowRight') navigateLightbox('next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxPhoto, lightboxIndex]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Gallery not found
  if (!gallery) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <EmptyState icon={<Camera size={48} />} title="Gallery Not Found" description="This gallery doesn't exist or has been removed." />
      </div>
    );
  }

  // Gallery not published or expired
  if (gallery.status !== 'published') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <EmptyState icon={<Camera size={48} />} title="Gallery Unavailable" description="This gallery is not currently available." />
      </div>
    );
  }

  if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <EmptyState icon={<Camera size={48} />} title="Gallery Expired" description="This gallery has expired and is no longer available." />
      </div>
    );
  }

  // Password screen
  if (gallery.passwordProtected && !authorized) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {gallery.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
              <img src={gallery.coverImage} alt={gallery.title} className="w-full aspect-video object-cover" />
            </div>
          )}
          {!gallery.coverImage && (
            <div className="mb-8 w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
              <Lock size={32} className="text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{gallery.title}</h1>
          {gallery.description && <p className="text-[var(--text-muted)] mb-6">{gallery.description}</p>}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-[var(--text-secondary)] mb-4">This gallery is password protected</p>
            <div className="space-y-3">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter gallery password" error={passwordError} onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()} />
              <Button onClick={handlePasswordSubmit} className="w-full" size="lg">View Gallery</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gallery view
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[var(--text-primary)] text-sm">{gallery.title}</h1>
              {gallery.clientName && <p className="text-xs text-[var(--text-muted)]">{gallery.clientName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <Badge variant="danger"><Heart size={12} className="mr-1" />{favorites.length}</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Gallery Info */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {gallery.coverImage && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img src={gallery.coverImage} alt={gallery.title} className="w-full max-h-80 object-cover" />
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[var(--text-muted)]">
          {gallery.eventDate && <span>📅 {new Date(gallery.eventDate).toLocaleDateString()}</span>}
          <span>📷 {photos.length} photos</span>
          {albums.length > 0 && <span>📁 {albums.length} albums</span>}
        </div>

        {/* Albums Navigation */}
        {albums.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            <button onClick={() => setSelectedAlbum('')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${!selectedAlbum ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
              All Photos
            </button>
            {albums.map(a => (
              <button key={a.id} onClick={() => setSelectedAlbum(a.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedAlbum === a.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                {a.title}
              </button>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        {currentPhotos.length === 0 ? (
          <EmptyState icon={<Camera size={48} />} title="No photos yet" description="Photos will appear here once uploaded." />
        ) : (
          <div className="photo-masonry">
            {currentPhotos.map((photo, index) => (
              <div key={photo.id} className="photo-masonry-item">
                <div className="relative group rounded-lg overflow-hidden bg-[var(--bg-tertiary)] cursor-pointer" onClick={() => openLightbox(photo, index)}>
                  <img src={photo.thumbnailUrl} alt="" className="w-full block hover:opacity-90 transition-opacity" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {gallery.allowFavorites && (
                        <button onClick={e => { e.stopPropagation(); toggleFavorite(photo.id); }} className={`p-1.5 rounded-full ${favorites.includes(photo.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700'}`}>
                          <Heart size={14} fill={favorites.includes(photo.id) ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                    {gallery.allowDownloads && (
                      <button onClick={e => { e.stopPropagation(); handleDownload(photo); }} className="p-1.5 rounded-full bg-white/80 text-gray-700">
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                  {favorites.includes(photo.id) && (
                    <div className="absolute top-2 right-2">
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <button onClick={() => setLightboxPhoto(null)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
              <X size={20} />
            </button>
            <span className="text-sm text-white/70">{lightboxIndex + 1} / {currentPhotos.length}</span>
            <div className="flex items-center gap-2">
              {gallery.allowFavorites && (
                <button onClick={() => toggleFavorite(lightboxPhoto.id)} className={`p-2 rounded-lg ${favorites.includes(lightboxPhoto.id) ? 'text-red-500' : 'text-white/70 hover:text-white'} hover:bg-white/10`}>
                  <Heart size={20} fill={favorites.includes(lightboxPhoto.id) ? 'currentColor' : 'none'} />
                </button>
              )}
              {gallery.allowDownloads && (
                <button onClick={() => handleDownload(lightboxPhoto)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
                  <Download size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Image */}
          <div 
            className="flex-1 flex items-center justify-center relative px-4"
            onTouchStart={e => setTouchStart(e.touches[0].clientX)}
            onTouchEnd={e => {
              if (touchStart === null) return;
              const diff = touchStart - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                navigateLightbox(diff > 0 ? 'next' : 'prev');
              }
              setTouchStart(null);
            }}
          >
            <button onClick={() => navigateLightbox('prev')} className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10 max-sm:left-2">
              <ChevronLeft size={24} />
            </button>
            <img src={lightboxPhoto.secureUrl} alt="" className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            <button onClick={() => navigateLightbox('next')} className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10 max-sm:right-2">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Comments Section */}
          {gallery.allowComments && (
            <div className="bg-black/50 border-t border-white/10 px-4 py-3 max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={14} className="text-white/50" />
                <span className="text-xs text-white/50">Comments</span>
              </div>
              {comments.length > 0 && (
                <div className="max-h-24 overflow-y-auto mb-2 space-y-1">
                  {comments.map(c => (
                    <div key={c.id} className="text-xs text-white/70">
                      <span className="font-medium text-white/90">{c.clientName}:</span> {c.text}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30" onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                <button onClick={handleAddComment} className="p-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
