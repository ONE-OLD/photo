import type { Photo } from '../services/database';

const IMAGE_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
]);

export function buildPhotoShareUrl(photoId: string, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.search = '';
  url.hash = '';
  url.searchParams.set('photo', photoId);
  return url.toString();
}

export async function preparePhotoShareFile(
  photo: Pick<Photo, 'id' | 'secureUrl'>,
  signal: AbortSignal,
): Promise<File> {
  const url = new URL(photo.secureUrl);
  if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/')) {
    url.pathname = url.pathname.replace('/image/upload/', '/image/upload/f_jpg,c_limit,w_2048/');
  }

  const response = await fetch(url.toString(), {
    mode: 'cors',
    credentials: 'omit',
    signal,
  });
  if (!response.ok) throw new Error(`Could not load this photo (HTTP ${response.status}).`);

  const blob = await response.blob();
  const mimeType = blob.type.split(';', 1)[0].trim().toLowerCase();
  const extension = IMAGE_EXTENSIONS.get(mimeType);
  if (!blob.size) throw new Error('This photo is empty.');
  if (!extension) throw new Error('This photo format cannot be shared.');

  const safeId = photo.id.replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';
  return new File([blob], `photo_${safeId}.${extension}`, { type: mimeType });
}
