import { useEffect, useState } from 'react';
import { database, type Comment, type Photo } from '../services/database';
import { Button, Modal, Spinner } from './UI';

export function GalleryCommentsDialog({ galleryId, photos, photo, onClose }: { galleryId: string; photos: Photo[]; photo: Photo | null; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    database.getComments(galleryId, photo?.id)
      .then(items => { if (active) setComments(items); })
      .catch(() => { if (active) setError('Could not load comments. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [galleryId, photo?.id, refresh]);

  return (
    <Modal isOpen onClose={onClose} title={photo ? 'Photo comments' : 'Client comments'} size="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">Private messages from clients to you.</p>
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      </div>
      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : error ? (
        <p role="alert" className="text-sm text-red-500">{error}</p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">No comments received{photo ? ' for this photo' : ''} yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => {
            const commentPhoto = photos.find(item => item.id === comment.photoId);
            return (
              <article key={comment.id} className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] p-3">
                {commentPhoto && <img src={commentPhoto.thumbnailUrl || commentPhoto.secureUrl} alt="Commented photo" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--text-primary)]">{comment.clientName || 'Guest'}</span>
                    <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
                  </div>
                  {!commentPhoto && <p className="mt-1 text-xs text-[var(--text-muted)]">Photo no longer in this gallery</p>}
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">{comment.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
