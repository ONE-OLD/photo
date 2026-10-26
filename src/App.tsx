import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { GuestRoute } from './components/GuestRoute';
import { AppProvider, useAuth } from './context/AppContext';
import { ToastContainer, Spinner, DashboardSidebar, DashboardHeader } from './components/UI';
import { HomePage, FeaturesPage, PricingPage, AboutPage, ContactPage, LoginPage, RegisterPage, ForgotPasswordPage, PrivacyPage, TermsPage } from './pages/PublicPages';
import { DashboardOverview, GalleriesPage, ClientsPage, AlbumsPage, FavoritesPage, ActivityPage, SettingsPage, AdminPage, GalleryEditorPage } from './pages/DashboardPages';
import { ClientGalleryPage } from './pages/ClientGallery';
import { SubscriptionPage, AdminPricingPage } from './pages/SubscriptionPages';

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Dashboard Layout
function DashboardLayout() {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => {
    const st = window.history.state as any;
    return (st?.usr?.luminaPage as string) || (st?.luminaPage as string) || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(() => {
    const st = window.history.state as any;
    return st?.usr?.galleryId || st?.galleryId || null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  const historyIndex = useRef(window.history.state?.idx || 0);
  const restoringHistory = useRef(false);
  useEffect(() => { historyIndex.current = window.history.state?.idx || 0; }, [location.key]);
  useEffect(() => {
    const pop = (event: PopStateEvent) => {
      if (restoringHistory.current) { restoringHistory.current = false; return; }
      const next = event.state?.idx || 0;
      if (!window.dispatchEvent(new Event('studio-before-navigate', { cancelable: true }))) {
        event.stopImmediatePropagation();
        restoringHistory.current = true;
        window.history.go(historyIndex.current - next);
      }
    };
    window.addEventListener('popstate', pop, true);
    return () => window.removeEventListener('popstate', pop, true);
  }, []);

  // Keep page in sync when navigating with browser back/forward
  useEffect(() => {
    const state = location.state as { luminaPage?: string; galleryId?: string } | null;
    if (state?.luminaPage) {
      setCurrentPage(state.luminaPage);
      setEditingGalleryId(state.luminaPage === 'gallery-editor' ? state.galleryId || null : null);
    }
  }, [location.key, location.state]);

  const goToPage = (page: string, galleryId?: string) => {
    if (!window.dispatchEvent(new Event('studio-before-navigate', { cancelable: true }))) return;
    setCurrentPage(page);
    setEditingGalleryId(page === 'gallery-editor' ? galleryId || null : null);
    navigate('/dashboard', { state: { luminaPage: page, galleryId: page === 'gallery-editor' ? galleryId : undefined } });
  };

  const pageTitle: Record<string, string> = {
    overview: 'Dashboard',
    galleries: 'Galleries',
    clients: 'Clients',
    albums: 'Albums',
    favorites: 'Favorites',
    activity: 'Activity',
    subscription: 'Subscription',
    settings: 'Settings',
    admin: 'Admin',
    pricing: 'Pricing Management',
  };
  const visiblePage = !isAdmin && (currentPage === 'admin' || currentPage === 'pricing')
    ? 'overview'
    : currentPage;

  const handleEditGallery = (id: string) => {
    goToPage('gallery-editor', id);
  };

  const renderPage = () => {
    if (editingGalleryId && visiblePage === 'gallery-editor') {
      return <GalleryEditorPage galleryId={editingGalleryId} onBack={() => goToPage('galleries')} />;
    }
    switch (visiblePage) {
      case 'overview': return <DashboardOverview onNavigate={goToPage} />;
      case 'galleries': return <GalleriesPage onEditGallery={handleEditGallery} />;
      case 'clients': return <ClientsPage />;
      case 'albums': return <AlbumsPage />;
      case 'favorites': return <FavoritesPage />;
      case 'activity': return <ActivityPage />;
      case 'subscription': return <SubscriptionPage />;
      case 'settings': return <SettingsPage />;
      case 'admin': return <AdminPage onNavigate={goToPage} />;
      case 'pricing': return <AdminPricingPage />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      <DashboardSidebar 
        currentPage={visiblePage}
        onNavigate={goToPage}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} title={pageTitle[visiblePage] || 'Dashboard'} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// Main App Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<GuestRoute><HomePage /></GuestRoute>} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      <Route path="/dashboard/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
      
      {/* Client Gallery */}
      <Route path="/gallery/:galleryId" element={<ClientGalleryPage />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Firebase & Cloudinary are configured via environment variables — no local/demo data
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <img src="/kigalipix.png" alt="" className="w-12 h-12 mx-auto mb-4 rounded-xl object-contain animate-pulse-soft" />
          <p className="text-sm text-[var(--text-muted)]">Loading Kigalipix...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
