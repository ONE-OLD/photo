import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Image, Lock, Shield } from 'lucide-react';
import { ThemeToggle } from './UI';

export function GoogleIcon() {
  return <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.85 46.98 24.55Z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.76 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
  </svg>;
}

export function AuthLayout({ mode, children }: { mode: 'login' | 'register'; children: React.ReactNode }) {
  const signingUp = mode === 'register';
  return <main className="auth-page"><div className="auth-shell">
    <aside className="auth-story" aria-label="KigaliPix studio">
      <img src="/home-hero.jpg" alt="" className="auth-story-image" /><div className="auth-story-shade" />
      <Link to="/" className="relative z-10 inline-flex items-center gap-3 self-start text-white"><img src="/kigalipix.png" alt="" className="w-10 h-10 rounded-xl object-contain" /><span className="font-semibold text-lg">KigaliPix<span className="block text-xs font-normal text-white/75">Your creative studio</span></span></Link>
      <div className="relative z-10 mt-auto pt-24"><span className="auth-story-label"><Camera size={14} /> Made for the moments that matter</span><h2 className="mt-6 text-4xl xl:text-5xl font-semibold leading-[1.12] tracking-tight">Your vision.<br />Beautifully delivered.</h2><p className="mt-5 text-sm leading-relaxed text-white/85 max-w-sm">A considered home for your photography. Curate your work, connect with clients, and turn every gallery into an experience.</p><div className="flex flex-wrap gap-2 mt-7"><span className="auth-story-label"><Image size={13} /> Beautiful galleries</span><span className="auth-story-label"><Lock size={13} /> Private by default</span></div></div>
      <p className="relative z-10 text-xs text-white/65 mt-12">Every story deserves a beautiful home.</p>
    </aside>
    <section className="auth-form-panel" aria-labelledby="auth-title">
      <div className="flex items-center justify-between gap-3 mb-8"><Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"><ArrowLeft size={15} />Back to home</Link><ThemeToggle /></div>
      <div className="auth-form-content"><Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-7 font-semibold"><img src="/kigalipix.png" alt="" className="w-9 h-9 rounded-lg object-contain" />KigaliPix</Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)] mb-3">{signingUp ? 'Start your next chapter' : 'Your studio awaits'}</p>
        <h1 id="auth-title" className="text-3xl sm:text-4xl font-semibold tracking-tight">{signingUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-3 mb-7 leading-relaxed">{signingUp ? 'A little less admin. More room to create. Start with a free account.' : 'Sign in to your studio and pick up where you left off.'}</p>
        {children}
        <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] mt-7"><Shield size={14} aria-hidden="true" /> Secure access to your creative studio</p>
      </div>
      <p className="text-xs text-center text-[var(--text-secondary)] mt-8">By continuing, you agree to our <Link to="/terms" className="underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
    </section>
  </div></main>;
}
