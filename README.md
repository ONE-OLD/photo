# Kigalipix — Photography Client Gallery Platform

A professional, full-stack photography platform for managing client galleries, delivering photos, and building your photography business.

## Features

### Public Website
- Beautiful landing page with hero section
- Features showcase
- Pricing page
- About page
- Contact form
- Privacy Policy & Terms of Service

### Authentication
- Email/password registration & login
- Password reset
- Persistent sessions
- Protected routes

### Admin Dashboard
- Overview with statistics & activity
- Gallery management (CRUD, publish/unpublish, archive)
- Album organization within galleries
- Client management
- Photo upload with drag & drop
- Favorites tracking
- Activity log
- Settings & branding customization
- Portfolio website management

### Client Gallery Experience
- Private gallery links
- Password-protected galleries
- Beautiful masonry photo grid
- Full-screen lightbox viewer
- Swipe navigation (mobile)
- Keyboard navigation (desktop)
- Favorites system
- Comments on photos
- Download permissions
- Gallery expiration

### Technical Features
- Dark/Light/System theme modes
- Fully responsive design
- Toast notifications
- Loading states & skeleton loaders
- Empty states with actions
- Search & filtering
- Cloudinary image optimization
- Firebase Realtime Database
- Demo mode (works without configuration)

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS 4
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth + Realtime Database)
- **Media**: Cloudinary
- **Build**: Vite

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (optional - works in demo mode)
- Cloudinary account (optional - uses local files in demo mode)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

#### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Realtime Database
4. Copy your config values to `.env`

#### Cloudinary Setup
1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Create an unsigned upload preset
3. Add your cloud name and upload preset to `.env`

#### Account Security and Deletion
Account deletion uses a Firebase Callable Function to delete the photographer's Cloudinary images, Realtime Database records, and Firebase Authentication account. Cloud Functions deployment requires a Firebase project on the Blaze plan. Do not put the Cloudinary API key or secret in the frontend `.env` file.

1. Install the Firebase CLI and select the Firebase project: `firebase use photographers-9690c`.
2. From the `functions` directory, run `npm install`.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` with `firebase functions:secrets:set <SECRET_NAME>`. Enter each value directly in the terminal prompt.
4. Deploy with `firebase deploy --only functions`. On first deploy, provide the `DATABASE_URL` parameter using the Realtime Database URL from `.env.example`.

Existing records must be backfilled with the correct `ownerUid` before deletion can remove them. The function deletes records and images tied to owned galleries and does not guess ownership for legacy records without an owner.

### Demo Mode

The app works without any configuration! Simply run:

```bash
npm run dev
```

In demo mode:
- All data is stored in memory
- Sample galleries, clients, and photos are auto-generated
- Login with any email/password
- Photos use placeholder images from picsum.photos

### Production Build

```bash
npm run build
```

The output will be in the `dist/` directory.

## Firebase Security Rules

Recommended security rules for your Firebase Realtime Database:

Photographer-owned records in `clients`, `galleries`, `albums`, `photos`, `favorites`, `comments`, and `activity` must include an `ownerUid` equal to the photographer's Firebase Auth UID. Existing records created before ownership was added must be backfilled to their actual owners using a trusted Admin SDK migration before publishing these rules. Records without `ownerUid` will not appear in photographer queries and cannot be changed by photographer accounts. Move existing per-studio website settings to `settings/{uid}` as well. Do not temporarily make these collections readable by every signed-in user as a migration workaround.

New accounts are always photographers (`role: "client"`). To bootstrap an administrator, register the trusted account first, then set `users/{uid}/role` to `admin` from the Firebase Console or a trusted Admin SDK. The client app cannot promote itself, and subscription fields are writable only by administrators.

```json
{
  "rules": {
    "users": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'",
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null && ((!data.exists() && $uid === auth.uid && newData.child('role').val() === 'client') || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".validate": "newData.hasChildren(['email', 'name', 'role', 'createdAt'])",
        "email": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "name": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "studioName": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "phone": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "website": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "instagram": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "facebook": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "location": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "bio": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "logo": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "profileImage": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "brandColor": { ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')" },
        "subscriptionPlan": { ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'" },
        "subscriptionExpiresAt": { ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'" },
        "subscriptionGrantedAt": { ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'" },
        "subscriptionNote": { ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'" },
        "role": {
          ".validate": "data.val() === newData.val() || (!data.exists() && newData.val() === 'client')"
        }
      }
    },
    "clients": {
      ".indexOn": ["ownerUid"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid)",
      "$clientId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin'))",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (data.exists() ? data.child('ownerUid').val() === auth.uid : newData.child('ownerUid').val() === auth.uid))",
        "ownerUid": { ".validate": "newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid)" }
      }
    },
    "galleries": {
      ".indexOn": ["ownerUid"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid)",
      "$galleryId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')) || data.child('status').val() === 'published'",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (data.exists() ? data.child('ownerUid').val() === auth.uid : newData.child('ownerUid').val() === auth.uid))",
        "ownerUid": { ".validate": "newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid)" }
      }
    },
    "albums": {
      ".indexOn": ["ownerUid", "galleryId"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid) || (query.orderByChild === 'galleryId' && ((auth != null && root.child('galleries/' + query.equalTo + '/ownerUid').val() === auth.uid) || root.child('galleries/' + query.equalTo + '/status').val() === 'published'))",
      "$albumId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')) || root.child('galleries/' + data.child('galleryId').val() + '/status').val() === 'published'",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (data.exists() ? data.child('ownerUid').val() === auth.uid : newData.child('ownerUid').val() === auth.uid))",
        "ownerUid": { ".validate": "newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid)" }
      }
    },
    "photos": {
      ".indexOn": ["ownerUid", "galleryId", "albumId"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid) || (query.orderByChild === 'galleryId' && ((auth != null && root.child('galleries/' + query.equalTo + '/ownerUid').val() === auth.uid) || root.child('galleries/' + query.equalTo + '/status').val() === 'published')) || (query.orderByChild === 'albumId' && ((auth != null && root.child('albums/' + query.equalTo + '/ownerUid').val() === auth.uid) || root.child('galleries/' + root.child('albums/' + query.equalTo + '/galleryId').val() + '/status').val() === 'published'))",
      "$photoId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')) || root.child('galleries/' + data.child('galleryId').val() + '/status').val() === 'published'",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (data.exists() ? data.child('ownerUid').val() === auth.uid : newData.child('ownerUid').val() === auth.uid))",
        "ownerUid": { ".validate": "newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid)" }
      }
    },
    "favorites": {
      ".indexOn": ["ownerUid", "galleryId"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid) || (query.orderByChild === 'galleryId' && ((auth != null && root.child('galleries/' + query.equalTo + '/ownerUid').val() === auth.uid) || root.child('galleries/' + query.equalTo + '/status').val() === 'published'))",
      "$favoriteId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')) || root.child('galleries/' + data.child('galleryId').val() + '/status').val() === 'published'",
        ".write": "(auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || data.child('ownerUid').val() === auth.uid)) || root.child('galleries/' + (data.exists() ? data.child('galleryId').val() : newData.child('galleryId').val()) + '/status').val() === 'published'",
        "ownerUid": { ".validate": "newData.val() === root.child('galleries/' + newData.parent().child('galleryId').val() + '/ownerUid').val()" }
      }
    },
    "comments": {
      ".indexOn": ["ownerUid", "galleryId"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid) || (query.orderByChild === 'galleryId' && ((auth != null && root.child('galleries/' + query.equalTo + '/ownerUid').val() === auth.uid) || root.child('galleries/' + query.equalTo + '/status').val() === 'published'))",
      "$commentId": {
        ".read": "(auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')) || root.child('galleries/' + data.child('galleryId').val() + '/status').val() === 'published'",
        ".write": "(auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || data.child('ownerUid').val() === auth.uid)) || root.child('galleries/' + (data.exists() ? data.child('galleryId').val() : newData.child('galleryId').val()) + '/status').val() === 'published'",
        "ownerUid": { ".validate": "newData.val() === root.child('galleries/' + newData.parent().child('galleryId').val() + '/ownerUid').val()" }
      }
    },
    "settings": {
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && ($uid === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')"
      }
    },
    "pricing": {
      ".read": true,
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "payments": {
      ".indexOn": ["userId"],
      ".read": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (query.orderByChild === 'userId' && query.equalTo === auth.uid))",
      "$paymentId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (!data.exists() && newData.child('userId').val() === auth.uid && newData.child('status').val() === 'pending'))"
      }
    },
    "activity": {
      ".indexOn": ["ownerUid"],
      ".read": "(auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin') || (auth != null && query.orderByChild === 'ownerUid' && query.equalTo === auth.uid)",
      "$activityId": {
        ".read": "auth != null && (data.child('ownerUid').val() === auth.uid || root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && (root.child('users/' + auth.uid + '/role').val() === 'admin' || (data.exists() ? data.child('ownerUid').val() === auth.uid : newData.child('ownerUid').val() === auth.uid))",
        "ownerUid": { ".validate": "newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid)" }
      }
    }
  }
}
```

## Cloudinary Security

- Use an **unsigned upload preset** for client-side uploads
- Restrict the upload preset to specific folders
- Limit allowed file formats to images
- Never expose your Cloudinary API secret in frontend code
- Use Cloudinary transformations for optimized delivery

## Project Structure

```
src/
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
├── index.css            # Global styles & theme variables
├── config/
│   └── firebase.ts      # Firebase initialization
├── context/
│   └── AppContext.tsx    # Auth, Theme, Toast providers
├── services/
│   └── database.ts      # Database operations & types
├── components/
│   └── UI.tsx           # Shared UI components
├── pages/
│   ├── PublicPages.tsx  # Home, Features, Pricing, etc.
│   ├── DashboardPages.tsx # Dashboard, Galleries, Clients, etc.
│   └── ClientGallery.tsx  # Client-facing gallery viewer
└── utils/
    └── seedDemo.ts      # Demo data seeder
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | For production |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | For production |
| `VITE_FIREBASE_DATABASE_URL` | Firebase database URL | For production |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | For production |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | For production |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | For production |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | For production |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | For uploads |

## License

MIT
