import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState(() => {
    const st = window.history.state as any;
    return (st?.luminaPage as string) || 'overview';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep page in sync when navigating with browser back/forward
  useEffect(() => {
    const st = window.history.state as any;
    if (st?.luminaPage) {
      setCurrentPage(st.luminaPage);
      if (st.luminaPage !== 'gallery-editor') setEditingGalleryId(null);
    }
  }, [location.key]);

  const goToPage = (page: string) => {
    setCurrentPage(page);
    setEditingGalleryId(page === 'gallery-editor' ? editingGalleryId : null);
    navigate('/dashboard', { state: { luminaPage: page } });
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

  const handleEditGallery = (id: string) => {
    setEditingGalleryId(id);
    goToPage('gallery-editor');
  };

  const renderPage = () => {
    if (editingGalleryId && currentPage === 'gallery-editor') {
      return <GalleryEditorPage galleryId={editingGalleryId} onBack={() => { setEditingGalleryId(null); setCurrentPage('galleries'); }} />;
    }
    switch (currentPage) {
      case 'overview': return <DashboardOverview />;
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
        currentPage={currentPage} 
        onNavigate={goToPage}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} title={pageTitle[currentPage] || 'Dashboard'} />
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
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center animate-pulse-soft">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Loading Lumina...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
