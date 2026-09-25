# Lumina — Photography Client Gallery Platform

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

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['email', 'name', 'role', 'createdAt'])",
        "role": {
          ".validate": "data.val() === newData.val()"
        }
      }
    },
    "clients": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "galleries": {
      ".read": "auth != null",
      "$gid": {
        ".read": "data.child('visibility').val() === 'public' || (auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin')",
        ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
      }
    },
    "albums": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "photos": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "favorites": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "comments": {
      ".read": true,
      ".write": "auth != null"
    },
    "settings": {
      ".read": true,
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
    },
    "activity": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'",
      ".write": "auth != null && root.child('users/' + auth.uid + '/role').val() === 'admin'"
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
