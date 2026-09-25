import { database, generateId } from '../services/database';

const demoGalleryIds = ['wedding-smith', 'portrait-session', 'event-corporate', 'family-outdoor', 'fashion-editorial'];
const demoAlbumData = [
  { titles: ['Getting Ready', 'Ceremony', 'Reception', 'Portraits', 'Details'], galleryIdx: 0 },
  { titles: ['Studio Session', 'Outdoor Portraits'], galleryIdx: 1 },
  { titles: ['Keynote', 'Networking', 'Awards'], galleryIdx: 2 },
  { titles: ['Park Session', 'Candid Moments', 'Group Photos'], galleryIdx: 3 },
  { titles: ['Look 1', 'Look 2', 'Behind the Scenes'], galleryIdx: 4 },
];

// Placeholder image URLs using picsum
function placeholderImg(seed: number, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export async function seedDemoData() {
  // Check if already seeded
  const galleries = await database.getGalleries();
  if (galleries.length > 0) return;

  const now = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Create clients
  const clients = [
    { name: 'Sarah & James', email: 'sarah.j@email.com', phone: '+1 (555) 123-4567', notes: 'Wedding clients - June 2024' },
    { name: 'Michael Chen', email: 'mchen@corp.com', phone: '+1 (555) 234-5678', notes: 'Corporate headshots' },
    { name: 'Emma Wilson', email: 'emma.w@email.com', phone: '+1 (555) 345-6789', notes: 'Family portrait session' },
    { name: 'TechCorp Inc.', email: 'events@techcorp.com', phone: '+1 (555) 456-7890', notes: 'Annual conference photography' },
    { name: 'Vogue Magazine', email: 'photo@vogue.com', phone: '+1 (555) 567-8901', notes: 'Fashion editorial shoot' },
  ];

  for (const c of clients) {
    await database.createClient(c);
  }

  // Create galleries
  const galleryData = [
    { title: 'Sarah & James Wedding', description: 'A beautiful summer wedding celebration', clientName: 'Sarah & James', clientEmail: 'sarah.j@email.com', status: 'published' as const, visibility: 'private' as const, passwordProtected: true, password: 'demo123', allowDownloads: true, allowFavorites: true, allowComments: true, eventDate: '2024-06-15', coverImage: placeholderImg(10, 1200, 600) },
    { title: 'Michael - Portrait Session', description: 'Professional headshots and creative portraits', clientName: 'Michael Chen', clientEmail: 'mchen@corp.com', status: 'published' as const, visibility: 'public' as const, passwordProtected: false, allowDownloads: true, allowFavorites: true, allowComments: false, eventDate: '2024-07-20', coverImage: placeholderImg(20, 1200, 600) },
    { title: 'TechCorp Annual Conference', description: 'Corporate event photography', clientName: 'TechCorp Inc.', clientEmail: 'events@techcorp.com', status: 'published' as const, visibility: 'private' as const, passwordProtected: false, allowDownloads: false, allowFavorites: true, allowComments: true, eventDate: '2024-08-10', coverImage: placeholderImg(30, 1200, 600) },
    { title: 'Wilson Family Portraits', description: 'Outdoor family photography session', clientName: 'Emma Wilson', clientEmail: 'emma.w@email.com', status: 'draft' as const, visibility: 'private' as const, passwordProtected: false, allowDownloads: true, allowFavorites: true, allowComments: true, eventDate: '2024-09-05', coverImage: placeholderImg(40, 1200, 600) },
    { title: 'Fashion Editorial - Fall Collection', description: 'High fashion editorial shoot', clientName: 'Vogue Magazine', clientEmail: 'photo@vogue.com', status: 'published' as const, visibility: 'private' as const, passwordProtected: true, password: 'fashion2024', allowDownloads: false, allowFavorites: false, allowComments: false, eventDate: '2024-09-20', coverImage: placeholderImg(50, 1200, 600) },
  ];

  const createdGalleries: any[] = [];
  for (const g of galleryData) {
    const created = await database.createGallery(g);
    createdGalleries.push(created);
  }

  // Create albums for each gallery
  const createdAlbums: any[] = [];
  for (const albumGroup of demoAlbumData) {
    const galleryId = createdGalleries[albumGroup.galleryIdx]?.id;
    if (!galleryId) continue;
    for (let i = 0; i < albumGroup.titles.length; i++) {
      const album = await database.createAlbum({
        galleryId,
        title: albumGroup.titles[i],
        order: i,
        coverImage: '',
      });
      createdAlbums.push({ ...album, galleryIdx: albumGroup.galleryIdx });
    }
  }

  // Create photos for each album
  let photoSeed = 100;
  for (const album of createdAlbums) {
    const numPhotos = 6 + Math.floor(Math.random() * 6); // 6-11 photos per album
    for (let i = 0; i < numPhotos; i++) {
      photoSeed++;
      const w = 800 + Math.floor(Math.random() * 400);
      const h = 600 + Math.floor(Math.random() * 600);
      await database.addPhoto({
        galleryId: album.galleryId,
        albumId: album.id,
        publicId: `demo_photo_${photoSeed}`,
        secureUrl: placeholderImg(photoSeed, w, h),
        thumbnailUrl: placeholderImg(photoSeed, 400, 300),
        width: w,
        height: h,
        format: 'jpg',
        bytes: 500000 + Math.floor(Math.random() * 2000000),
      });
    }
  }

  // Log some activity
  await database.logActivity('gallery_created', 'Gallery "Sarah & James Wedding" created');
  await database.logActivity('photos_uploaded', '12 photos uploaded to Ceremony album');
  await database.logActivity('gallery_published', 'Gallery "Michael - Portrait Session" published');
  await database.logActivity('client_added', 'Client "TechCorp Inc." added');
  await database.logActivity('gallery_created', 'Gallery "Fashion Editorial" created');
  await database.logActivity('photos_uploaded', '8 photos uploaded to Getting Ready album');
  await database.logActivity('gallery_published', 'Gallery "TechCorp Annual Conference" published');
}
