import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Download, Facebook, Instagram, MessageCircle, Share2, X } from 'lucide-react';
import type { Photo } from '../services/database';
import { buildPhotoShareUrl, preparePhotoShareFile } from '../utils/photoSharing';
import { Button } from './UI';

interface PhotoShareDialogProps {
  photo: Photo;
  galleryTitle: string;
  allowDownloads: boolean;
  passwordProtected: boolean;
  onClose: () => void;
  onDownload: (photo: Photo) => void;
}

export function PhotoShareDialog({ photo, galleryTitle, allowDownloads, passwordProtected, onClose, onDownload }: PhotoShareDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');
  const shareUrl = buildPhotoShareUrl(photo.id, window.location.href);
  const supportsNativeShare = typeof navigator.share === 'function';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${galleryTitle}\n${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    if (!allowDownloads || !supportsNativeShare || typeof navigator.canShare !== 'function') return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    let active = true;
    setPreparing(true);

    // Prepare before the next click so opening the OS share menu keeps user activation.
    preparePhotoShareFile(photo, controller.signal)
      .then(file => {
        if (active && navigator.canShare({ files: [file] })) setShareFile(file);
      })
      .catch(() => {
        if (active) setMessage('Photo sharing is unavailable right now. You can still share the link or download the photo.');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setPreparing(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [photo.id, photo.secureUrl, allowDownloads, supportsNativeShare]);

  const handleNativeShare = async () => {
    if (!supportsNativeShare || preparing || sharing) return;
    setSharing(true);
    setMessage('');
    try {
      await navigator.share(shareFile && allowDownloads
        ? { files: [shareFile], title: galleryTitle }
        : { title: galleryTitle, text: `Photo from ${galleryTitle}`, url: shareUrl });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setMessage('Could not open sharing. Try again, or use one of the options below.');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareUrl);
      setMessage('Photo link copied.');
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setMessage('Select and copy the photo link below.');
    }
  };

  const handleInstagram = () => {
    if (shareFile) {
      void handleNativeShare();
    } else {
      onDownload(photo);
      setMessage('Photo download started. Select it when creating an Instagram post or story.');
    }
  };

  const optionClass = 'flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-left text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]';

  return createPortal(
    <dialog
      ref={dialogRef}
      className="photo-share-dialog w-[calc(100%_-_2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-xl)]"
      aria-labelledby="photo-share-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div>
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <h2 id="photo-share-title" className="text-lg font-semibold">Share photo</h2>
          <button type="button" onClick={onClose} aria-label="Close sharing" className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)]">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <img src={photo.thumbnailUrl || photo.secureUrl} alt="Photo to share" className="h-16 w-16 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{galleryTitle}</p>
              <p className="text-xs text-[var(--text-muted)]">Send this photo to friends or share it on social media.</p>
            </div>
          </div>

          {supportsNativeShare && (
            <div className="space-y-2">
              <Button className="w-full" onClick={handleNativeShare} loading={preparing || sharing}>
                {!preparing && !sharing && <Share2 size={18} className="mr-2" />}
                {preparing ? 'Preparing photo...' : sharing ? 'Sharing...' : shareFile ? 'Share photo to apps' : 'Share photo link'}
              </Button>
              <p className="text-xs text-[var(--text-muted)]">
                {shareFile
                  ? 'Choose Instagram, WhatsApp, Facebook or another available app in your device’s share menu.'
                  : 'Share a link to this photo using your device’s share menu.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={optionClass}>
              <MessageCircle size={22} className="shrink-0 text-green-500" />
              <span><span className="block text-sm font-medium">WhatsApp</span><span className="block text-xs text-[var(--text-muted)]">Share photo link</span></span>
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={optionClass}>
              <Facebook size={22} className="shrink-0 text-blue-500" />
              <span><span className="block text-sm font-medium">Facebook</span><span className="block text-xs text-[var(--text-muted)]">Share photo link</span></span>
            </a>
            {allowDownloads && (
              <>
                <button type="button" onClick={handleInstagram} disabled={preparing || sharing} className={`${optionClass} disabled:cursor-not-allowed disabled:opacity-50`}>
                  <Instagram size={22} className="shrink-0 text-pink-500" />
                  <span><span className="block text-sm font-medium">Instagram</span><span className="block text-xs text-[var(--text-muted)]">{shareFile ? 'Choose in share menu' : 'Download to post'}</span></span>
                </button>
                <button type="button" onClick={() => { onDownload(photo); setMessage('Photo download started.'); }} className={optionClass}>
                  <Download size={22} className="shrink-0 text-[var(--text-secondary)]" />
                  <span><span className="block text-sm font-medium">Download</span><span className="block text-xs text-[var(--text-muted)]">Save photo</span></span>
                </button>
              </>
            )}
          </div>

          {allowDownloads && !shareFile && !preparing && (
            <p className="text-xs text-[var(--text-muted)]">To post on Instagram, download the photo, then select it in Instagram.</p>
          )}
          {passwordProtected && <p className="text-xs text-[var(--text-muted)]">People opening this link will need the gallery password.</p>}
          <div className="flex gap-2">
            <input ref={linkRef} aria-label="Photo link" value={shareUrl} readOnly onFocus={event => event.target.select()} className="min-w-0 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs" />
            <Button variant="secondary" onClick={handleCopyLink} aria-label="Copy photo link" title="Copy photo link"><Copy size={18} /></Button>
          </div>
          {message && <p role="status" className="text-sm text-[var(--text-secondary)]">{message}</p>}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
