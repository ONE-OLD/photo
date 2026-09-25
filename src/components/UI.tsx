import React, { useState, useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, useToast, useAuth } from '../context/AppContext';
import { X, Check, AlertCircle, Info, AlertTriangle, Moon, Sun, Monitor, Menu, LogOut, Camera, LayoutDashboard, Image, Users, Settings, Shield, Heart, Activity, FolderOpen, CreditCard } from 'lucide-react';

// Button Component
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent)] shadow-sm',
    secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]',
    ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    outline: 'border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

// Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <textarea
        className={`w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none resize-none ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <select
        className={`w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none ${className}`}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal((
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-xl)] border border-[var(--border-color)] animate-fade-in max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  ), document.body);
}

// Toast Container
export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  
  const icons = {
    success: <Check size={16} className="text-green-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    info: <Info size={16} className="text-blue-500" />,
    warning: <AlertTriangle size={16} className="text-yellow-500" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div key={toast.id} className="toast-enter flex items-center gap-3 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-lg)]">
          {icons[toast.type]}
          <span className="text-sm text-[var(--text-primary)] flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Loading Spinner
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--accent)]`} />
    </div>
  );
}

// Skeleton Loader
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// Empty State
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-[var(--text-muted)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

// Theme Toggle
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-[var(--bg-card)] shadow-sm' : 'text-[var(--text-muted)]'}`} aria-label="Light mode">
        <Sun size={14} />
      </button>
      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-[var(--bg-card)] shadow-sm' : 'text-[var(--text-muted)]'}`} aria-label="Dark mode">
        <Moon size={14} />
      </button>
      <button onClick={() => setTheme('system')} className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-[var(--bg-card)] shadow-sm' : 'text-[var(--text-muted)]'}`} aria-label="System theme">
        <Monitor size={14} />
      </button>
    </div>
  );
}

// Card Component
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-sm)] ${onClick ? 'cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

// Badge
export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
}

// Stat Card
export function StatCard({ title, value, icon, trend }: { title: string; value: string | number; icon: ReactNode; trend?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
          {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--accent)]">
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Dashboard Sidebar
export function DashboardSidebar({ currentPage, onNavigate, mobileOpen, onCloseMobile }: { 
  currentPage: string; 
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { logout, profile } = useAuth();
  
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'galleries', label: 'Galleries', icon: <Image size={18} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={18} /> },
    { id: 'albums', label: 'Albums', icon: <FolderOpen size={18} /> },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'admin', label: 'Admin', icon: <Shield size={18} /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <img src="/lumina-logo.jpg" alt="" className="w-9 h-9 rounded-lg object-contain" />
          <div>
            <h1 className="font-semibold text-[var(--text-primary)] text-sm">Lumina</h1>
            <p className="text-xs text-[var(--text-muted)]">{profile?.studioName || 'Studio'}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 sidebar-scroll overflow-y-auto">
        {navItems.filter(item => item.id !== 'admin' || profile?.role === 'admin').map(item => (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentPage === item.id 
                ? 'bg-[var(--accent)] text-white shadow-sm' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-3 border-t border-[var(--border-color)]">
        <button onClick={() => { logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-red-500 transition-all">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[var(--bg-card)] border-r border-[var(--border-color)] h-screen sticky top-0">
        {sidebarContent}
      </aside>
      
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--bg-card)] shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// Dashboard Header
export function DashboardHeader({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]" aria-label="Menu">
            <Menu size={20} />
          </button>
          {title && <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

// Page Header
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Search Input
export function SearchInput({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none text-sm"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

// Confirm Dialog
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; danger?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-[var(--text-secondary)] mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
