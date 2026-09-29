import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database, type Gallery, type Album, type Photo, type Comment } from '../services/database';
import JSZip from 'jszip';
import app from '../config/firebase';
import { useToast } from '../context/AppContext';
import { Button, Input, Modal, Spinner, EmptyState, Badge } from '../components/UI';
import { Heart, Download, ChevronLeft, ChevronRight, X, Lock, MessageCircle, Send, Camera, ArrowLeft, ZoomIn, Share2, Archive, ArrowDown } from 'lucide-react';

function buildJustifiedRows(photos: Photo[], width: number, targetHeight: number) {
  const rows: { photos: Photo[]; widths: number[]; height: number }[] = [];
  if (width <= 0) return rows;

  let rowPhotos: Photo[] = [];
  let rowRatios: number[] = [];
  let ratioTotal = 0;
  const gap = width <= 480 ? 8 : 12;

  const finishRow = (isLastRow: boolean) => {
    if (!rowPhotos.length) return;
    const availableWidth = Math.max(0, width - gap * (rowPhotos.length - 1));
    const height = isLastRow ? targetHeight : availableWidth / ratioTotal;
    rows.push({
      photos: rowPhotos,
      widths: isLastRow
        ? rowRatios.map(ratio => ratio * height)
        : rowRatios.map(ratio => (ratio / ratioTotal) * availableWidth),
      height,
    });
    rowPhotos = [];
    rowRatios = [];
    ratioTotal = 0;
  };

  photos.forEach(photo => {
    const ratio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
    rowPhotos.push(photo);
    rowRatios.push(ratio);
    ratioTotal += ratio;
    if (ratioTotal * targetHeight >= width) finishRow(false);
  });

  finishRow(true);
  return rows;
}

export function ClientGalleryPage() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [zipProgress, setZipProgress] = useState('');
  const [zipBusy, setZipBusy] = useState(false);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const currentPhotos = selectedAlbum ? photos.filter(p => p.albumId === selectedAlbum) : photos;
  const coverImageUrl = photos.find(photo => photo.id === gallery?.coverImageId)?.secureUrl || gallery?.coverImage || photos[0]?.secureUrl;
  const targetRowHeight = galleryWidth < 600 ? 150 : galleryWidth < 900 ? 190 : 240;
  const photoRows = buildJustifiedRows(currentPhotos, galleryWidth, targetRowHeight);

  useEffect(() => {
    const element = galleryGridRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      setGalleryWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [authorized, currentPhotos.length]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!galleryId) return;
        const g = await database.getGallery(galleryId);
        if (!g) return;
        setGallery(g as Gallery);

        const gal = g as Gallery;
        if (gal.status !== 'published') return;
        if (gal.expirationDate && new Date(gal.expirationDate) < new Date()) return;
        if (!gal.passwordProtected) {
          setAuthorized(true);
          const [a, p] = await Promise.all([
            database.getAlbumsByGallery(galleryId),
            database.getPhotosByGallery(galleryId),
          ]);
          setAlbums(a as Album[]);
          setPhotos(p as Photo[]);

          const favs = await database.getFavorites(galleryId);
          setFavorites((favs as any[]).filter(f => f.clientEmail === clientEmail).map(f => f.photoId));
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load this gallery.');
      } finally {
        setLoading(false);
      }
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
    // Ensure Cloudinary forces a download instead of in-browser navigation
    link.href = photo.secureUrl.includes('/image/upload/') && !photo.secureUrl.includes('/fl_attachment/')
      ? photo.secureUrl.replace('/image/upload/', '/image/upload/fl_attachment/')
      : photo.secureUrl;
    link.download = `photo_${photo.id}.${photo.format || 'jpg'}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    if (!galleryId || !gallery || zipBusy || !gallery.allowDownloads) return;
    const downloadPhotos = selectedAlbum ? photos.filter(p => p.albumId === selectedAlbum) : photos;
    if (downloadPhotos.length === 0) {
      addToast('No photos available to download in this gallery.', 'info');
      return;
    }

    setZipBusy(true);
    setZipProgress('Starting download...');

    try {
      const zip = new JSZip();
      let successCount = 0;
      const total = downloadPhotos.length;

      // Build Cloudinary URL with fl_attachment so the CDN sets permissive CORS + download headers.
      // For non-Cloudinary URLs we try a plain fetch with cors mode.
      const buildFetchUrl = (url: string) => {
        if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
          // Insert fl_attachment flag right after /upload/
          return url.replace('/image/upload/', '/image/upload/fl_attachment/');
        }
        return url;
      };

      // Download in parallel batches of 4 for speed without exhausting memory
      const BATCH_SIZE = 4;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = downloadPhotos.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (photo, batchIdx) => {
            const index = i + batchIdx;
            try {
              const fetchUrl = buildFetchUrl(photo.secureUrl);
              const res = await fetch(fetchUrl, { mode: 'cors', credentials: 'omit' });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const blob = await res.blob();
              const ext = (photo.format || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
              const filename = `photo-${String(index + 1).padStart(3, '0')}.${ext}`;
              zip.file(filename, blob);
              successCount++;
            } catch (fetchErr) {
              console.warn(`Could not fetch photo ${photo.id}:`, fetchErr);
            }
          })
        );
        const currentDone = Math.min(i + BATCH_SIZE, total);
        setZipProgress(`Downloading photos: ${currentDone}/${total}`);
      }

      if (successCount === 0) {
        throw new Error('Could not download any photos. Please check your internet connection.');
      }

      setZipProgress('Creating ZIP archive...');
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'STORE' },
        metadata => {
          setZipProgress(`Creating ZIP: ${Math.round(metadata.percent)}%`);
        }
      );

      const cleanTitle = (gallery.title || 'gallery').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'gallery';
      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${cleanTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

      setZipProgress('Download complete!');
      addToast(`Downloaded ${successCount} photos in ZIP!`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ZIP download failed.';
      setZipProgress(message);
      addToast(message, 'error');
    } finally {
      setZipBusy(false);
      setTimeout(() => setZipProgress(''), 4000);
    }
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div role="alert" className="max-w-md text-center text-sm text-red-600 dark:text-red-400">
          Could not load this gallery: {loadError}
        </div>
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
          {coverImageUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
              <img src={coverImageUrl} alt={gallery.title} className="w-full aspect-video object-cover" />
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
    <div className="client-gallery-page min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="client-gallery-header z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-sm">{gallery.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <Badge variant="danger"><Heart size={12} className="mr-1" />{favorites.length}</Badge>
            )}
          </div>
        </div>
      </header>

      <section className="gallery-cover-hero" aria-label={`${gallery.title} gallery cover`}>
        {coverImageUrl && (
          <img className="gallery-cover-image" src={coverImageUrl} alt={gallery.title} fetchPriority="high" />
        )}
        <div className="gallery-cover-shade" />
        <div className="gallery-cover-copy">
          {gallery.clientName && <p className="gallery-cover-author">{gallery.clientName}</p>}
          <h1>{gallery.title}</h1>
          {gallery.description && <p className="gallery-cover-description">{gallery.description}</p>}
          <div className="gallery-cover-meta">
            {gallery.eventDate && <span>{new Date(gallery.eventDate).toLocaleDateString()}</span>}
            <span>{photos.length} photos</span>
            {albums.length > 0 && <span>{albums.length} albums</span>}
          </div>
          <button className="gallery-view-button" onClick={() => document.getElementById('gallery-photos')?.scrollIntoView({ behavior: 'smooth' })}>
            View Gallery <ArrowDown size={16} />
          </button>
        </div>
      </section>

      {/* Gallery photos */}
      <div id="gallery-photos" className="max-w-7xl mx-auto px-4 py-8 scroll-mt-6">
        {gallery.allowDownloads && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-muted)]">{photos.length} photos</div>
            <div className="flex flex-wrap items-center gap-3">
              {zipProgress && <span role="status" className="text-sm text-[var(--text-secondary)]">{zipProgress}</span>}
              <Button onClick={handleDownloadAll} disabled={zipBusy || photos.length === 0}>
                <Archive size={16} className="mr-2" />{zipBusy ? 'Preparing ZIP...' : 'Download All (.zip)'}
              </Button>
            </div>
          </div>
        )}

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
          <div ref={galleryGridRef} className="justified-gallery">
            {photoRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="justified-gallery-row">
                {row.photos.map((photo, columnIndex) => {
                  const index = currentPhotos.indexOf(photo);
                  return (
                  <div key={photo.id} className="justified-gallery-item" style={{ width: `${row.widths[columnIndex]}px`, height: `${row.height}px` }}>
                <div className="relative group h-full rounded-lg overflow-hidden bg-[var(--bg-tertiary)] cursor-pointer" onClick={() => openLightbox(photo, index)}>
                  <img src={photo.thumbnailUrl || photo.secureUrl} alt="" className="w-full h-full object-cover block hover:opacity-90 transition-opacity" loading="lazy" />
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
                  );
                })}
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
