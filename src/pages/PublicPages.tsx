import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../context/AppContext';
import { Button, Input, ThemeToggle } from '../components/UI';
import { Camera, Image, Users, Shield, Heart, Download, Share2, Lock, Zap, Globe, Star, ChevronRight, Menu, X } from 'lucide-react';

// Navbar for public pages
function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lumina-logo.jpg" alt="" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-lg text-[var(--text-primary)]">Kigalipix</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contact</Link>
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-4 space-y-3">
          <Link to="/features" className="block text-sm text-[var(--text-secondary)]" onClick={() => setOpen(false)}>Features</Link>
          <Link to="/pricing" className="block text-sm text-[var(--text-secondary)]" onClick={() => setOpen(false)}>Pricing</Link>
          <Link to="/about" className="block text-sm text-[var(--text-secondary)]" onClick={() => setOpen(false)}>About</Link>
          <Link to="/contact" className="block text-sm text-[var(--text-secondary)]" onClick={() => setOpen(false)}>Contact</Link>
          <div className="flex gap-3 pt-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// Footer
function Footer() {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/lumina-logo.jpg" alt="" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg">Kigalipix</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Professional photography gallery platform for delivering stunning client experiences.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <div className="space-y-2">
              <Link to="/features" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Features</Link>
              <Link to="/pricing" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">About</Link>
              <Link to="/contact" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border-color)] text-center text-sm text-[var(--text-muted)]">
          © {new Date().getFullYear()} Kigalipix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// HOME PAGE
export function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] mb-6">
            <Star size={14} className="text-yellow-500" />
            Trusted by professional photographers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[var(--text-primary)] leading-tight mb-6">
            Deliver Beautiful<br />
            <span className="bg-gradient-to-r from-[var(--accent)] to-purple-500 bg-clip-text text-transparent">Client Galleries</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            The professional photography platform that helps you upload, organize, and share stunning galleries with your clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg">Start Free Trial <ChevronRight size={16} className="ml-1" /></Button>
            </Link>
            <Link to="/features">
              <Button variant="secondary" size="lg">See Features</Button>
            </Link>
          </div>
          
          {/* Hero image placeholder */}
          <div className="mt-16 relative">
            <div className="bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow-xl)] p-4 max-w-4xl mx-auto">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-3 p-8 w-full max-w-lg">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm" style={{ opacity: 1 - i * 0.05 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">Everything You Need</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Powerful tools designed for professional photographers to deliver exceptional client experiences.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Image size={24} />, title: 'Beautiful Galleries', desc: 'Create stunning, organized galleries with albums and collections.' },
              { icon: <Users size={24} />, title: 'Client Management', desc: 'Manage clients, track favorites, and deliver personalized experiences.' },
              { icon: <Shield size={24} />, title: 'Password Protection', desc: 'Secure galleries with passwords and private sharing links.' },
              { icon: <Heart size={24} />, title: 'Favorites System', desc: 'Let clients mark their favorite photos for easy selection.' },
              { icon: <Download size={24} />, title: 'Client Downloads', desc: 'Allow clients to download photos with permission controls.' },
              { icon: <Zap size={24} />, title: 'Fast & Optimized', desc: 'Cloudinary-powered delivery with automatic optimization.' },
            ].map((f, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 hover:shadow-[var(--shadow-md)] transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Join photographers who deliver exceptional gallery experiences to their clients.</p>
          <Link to="/register"><Button size="lg" className="bg-white text-[var(--accent)] hover:bg-white/90">Get Started Free</Button></Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// FEATURES PAGE
export function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">Powerful Features</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Everything you need to manage your photography business and deliver stunning galleries.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: <Image size={28} />, title: 'Gallery Management', items: ['Create unlimited galleries', 'Album organization', 'Drag & drop uploads', 'Cover image selection', 'Gallery status management'] },
              { icon: <Users size={28} />, title: 'Client Experience', items: ['Private gallery links', 'Password protection', 'Favorites collection', 'Photo comments', 'Download permissions'] },
              { icon: <Globe size={28} />, title: 'Sharing & Delivery', items: ['Custom share URLs', 'QR code generation', 'Email notifications', 'Gallery expiration', 'Social sharing'] },
              { icon: <Shield size={28} />, title: 'Security & Privacy', items: ['Password-protected galleries', 'Role-based access', 'Secure authentication', 'Data encryption', 'Expiration controls'] },
              { icon: <Zap size={28} />, title: 'Performance', items: ['Cloudinary optimization', 'Lazy loading images', 'Responsive thumbnails', 'Progressive loading', 'CDN delivery'] },
              { icon: <Star size={28} />, title: 'Customization', items: ['Brand customization', 'Custom colors', 'Logo integration', 'Typography choices', 'Portfolio website'] },
            ].map((section, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">{section.icon}</div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// PRICING PAGE
export function PricingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">Simple Pricing</h1>
            <p className="text-lg text-[var(--text-secondary)]">Choose the plan that fits your photography business.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Free', price: '0 Rwf', period: '/mo', features: ['Unlimited Gallery', '1 GB Storage', 'Basic Sharing'], highlighted: false },
              { name: 'Starter', price: '5,000 Rwf', period: '/mo', features: ['Unlimited Galleries', '5 GB Storage', 'Basic Sharing', 'Email Support'], highlighted: true },
              { name: 'Professional', price: '10,000 Rwf', period: '/mo', features: ['Unlimited Galleries', '10 GB Storage', 'Password Protection', 'Client Favorites', 'Priority Support', 'Custom Branding'], highlighted: false },
              { name: 'Studio', price: '50,000 Rwf', period: '/mo', features: ['Everything in Pro','100 GB Storage', 'Dedicated Support', 'Custom Integrations'], highlighted: false },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 ${plan.highlighted ? 'bg-gradient-to-br from-[var(--accent)] to-purple-600 text-white shadow-xl scale-105' : 'bg-[var(--bg-card)] border border-[var(--border-color)]'}`}>
                {plan.highlighted && <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">Most Popular</span>}
                <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-[var(--text-primary)]'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-white/70' : 'text-[var(--text-muted)]'}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-white/90' : 'text-[var(--text-secondary)]'}`}>
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant={plan.highlighted ? 'secondary' : 'primary'} className="w-full" size="lg">
                    {plan.highlighted ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// ABOUT PAGE
export function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">About Kigalipix</h1>
            <p className="text-lg text-[var(--text-secondary)]">We're building the future of photography delivery.</p>
          </div>
          <div className="prose prose-lg max-w-none">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 sm:p-12">
              <p className="text-[var(--text-secondary)] mb-6">
                Kigalipix was created with a simple mission: to help photographers deliver their work beautifully. We understand that your photographs are more than just images — they're stories, memories, and art.
              </p>
              <p className="text-[var(--text-secondary)] mb-6">
                Our platform provides photographers with professional-grade tools for managing client galleries, organizing photos into albums, and sharing stunning collections with clients through secure, password-protected links.
              </p>
              <p className="text-[var(--text-secondary)]">
                From independent photographers to established studios, Kigalipix scales with your business. We handle the technical complexity so you can focus on what matters most — creating beautiful photography.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 mt-10">
              {[
                { value: '10K+', label: 'Photographers' },
                { value: '500K+', label: 'Galleries Delivered' },
                { value: '50M+', label: 'Photos Shared' },
              ].map((stat, i) => (
                <div key={i} className="text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
                  <div className="text-3xl font-bold text-[var(--accent)]">{stat.value}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// CONTACT PAGE
export function ContactPage() {
  const [sent, setSent] = useState(false);
  
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Get in Touch</h1>
            <p className="text-[var(--text-secondary)]">Have questions? We'd love to hear from you.</p>
          </div>
          {sent ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Message Sent!</h3>
              <p className="text-green-600 dark:text-green-400 text-sm">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8">
              <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-5">
                <Input label="Name" placeholder="Your name" required />
                <Input label="Email" type="email" placeholder="your@email.com" required />
                <Input label="Subject" placeholder="How can we help?" />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Message</label>
                  <textarea rows={5} placeholder="Tell us more..." className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-none" required />
                </div>
                <Button type="submit" className="w-full" size="lg">Send Message</Button>
              </form>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

// LOGIN PAGE
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/lumina-logo.jpg" alt="Kigalipix" className="w-10 h-10 rounded-xl object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-[var(--text-muted)] mt-1">Sign in to your account</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" className="rounded border-[var(--border-color)]" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Don't have an account? <Link to="/register" className="text-[var(--accent)] hover:underline font-medium">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// REGISTER PAGE
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/lumina-logo.jpg" alt="Kigalipix" className="w-10 h-10 rounded-xl object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
          <p className="text-[var(--text-muted)] mt-1">Start delivering beautiful galleries</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
            <Button type="submit" className="w-full" size="lg" loading={loading}>Create Account</Button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already have an account? <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// FORGOT PASSWORD PAGE
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/lumina-logo.jpg" alt="Kigalipix" className="w-10 h-10 rounded-xl object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset Password</h1>
          <p className="text-[var(--text-muted)] mt-1">Enter your email to receive a reset link</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-[var(--shadow-md)]">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Check your email</h3>
              <p className="text-sm text-[var(--text-muted)]">We've sent a password reset link to {email}</p>
              <Link to="/login" className="mt-4 inline-block text-[var(--accent)] hover:underline text-sm">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              <Button type="submit" className="w-full" size="lg" loading={loading}>Send Reset Link</Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// PRIVACY PAGE
export function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">Privacy Policy</h1>
          <div className="prose text-[var(--text-secondary)] space-y-4">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>Kigalipix ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our photography gallery platform.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, and photographs you upload to our platform. We also collect usage data to improve our services.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">How We Use Your Information</h2>
            <p>Your information is used to provide and improve our services, manage your account, deliver galleries to your clients, and communicate with you about your account.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Data Security</h2>
            <p>We implement appropriate security measures to protect your data. Photographs are stored securely using Cloudinary's infrastructure, and account data is protected through Firebase's security features.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us through our contact page.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// TERMS PAGE
export function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">Terms of Service</h1>
          <div className="prose text-[var(--text-secondary)] space-y-4">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>By using Kigalipix, you agree to these Terms of Service. Please read them carefully.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Use of Service</h2>
            <p>You may use our service for lawful purposes only. You are responsible for the content you upload and share through the platform. You must have the rights to any photographs you upload.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials. You must not share your login information with unauthorized parties.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Content Ownership</h2>
            <p>You retain all rights to the photographs you upload. By using our service, you grant us a limited license to store, process, and deliver your content as part of the service.</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-8">Limitation of Liability</h2>
            <p>Our service is provided "as is" without warranties. We are not liable for any indirect damages arising from your use of the platform.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
