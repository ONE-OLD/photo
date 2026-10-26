import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../context/AppContext';
import { AuthLayout, GoogleIcon } from '../components/AuthLayout';
import { PlanCard, BillingCycleToggle } from '../components/Pricing';
import { usePlans } from '../hooks/usePlans';
import type { BillingCycle } from '../services/pricing';
import { Button, Input, Spinner, ThemeToggle } from '../components/UI';
import { Camera, Image, Users, Shield, Heart, Download, Share2, Lock, Zap, Globe, Star, ChevronRight, Menu, X, Eye, EyeOff, ArrowRight, MessageCircle, Phone, Instagram } from 'lucide-react';

const CONTACT_DETAILS = {
  whatsapp: { label: '0780966163', href: 'https://wa.me/250780966163' },
  phones: [
    { label: '0792575986', href: 'tel:+250792575986' },
    { label: '0796395652', href: 'tel:+250796395652' },
  ],
  instagram: { label: '@dreammakerdevelopers', href: 'https://www.instagram.com/dreammakerdevelopers/' },
};

// Navbar for public pages
function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/kigalipix.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="kigalipix.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
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
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-sm mb-3">Get in touch</h4>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <a href={CONTACT_DETAILS.whatsapp.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--accent)]"><MessageCircle size={16} aria-hidden="true" /><span>WhatsApp: {CONTACT_DETAILS.whatsapp.label}</span></a>
              {CONTACT_DETAILS.phones.map(phone => <a key={phone.href} href={phone.href} className="flex items-center gap-2 hover:text-[var(--accent)]"><Phone size={16} aria-hidden="true" /><span>{phone.label}</span></a>)}
              <a href={CONTACT_DETAILS.instagram.href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-[var(--accent)]"><Instagram size={16} className="shrink-0 mt-0.5" aria-hidden="true" /><span className="break-all">{CONTACT_DETAILS.instagram.label}</span></a>
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

function PageLoadingIndicator() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const image = new window.Image();
    const finish = () => { if (active) setLoading(false); };
    const timeout = window.setTimeout(finish, 8000);
    image.onload = () => { void image.decode().catch(() => {}).then(finish); };
    image.onerror = finish;
    image.src = '/home-hero.jpg';
    if (image.complete) finish();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  if (!loading) return null;

  return (
    <div role="status" aria-live="polite" aria-label="Loading page" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#10171b]/95 backdrop-blur-md text-white">
      <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-2 border-white/15 border-t-amber-200 animate-spin motion-reduce:animate-none" />
        <Camera size={26} className="text-amber-100" />
      </div>
      <p className="text-sm font-medium tracking-widest animate-pulse motion-reduce:animate-none">Loading...</p>
    </div>
  );
}

// HOME PAGE
export function HomePage() {
  return (
    <div className="min-h-screen">
      <PageLoadingIndicator />
      <PublicNav />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative isolate overflow-hidden flex min-h-[85svh] items-center bg-[#10171b]">
        <img src="/home-hero.jpg" alt="" aria-hidden="true" fetchPriority="high" decoding="async" width={1672} height={941} className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" aria-hidden="true" />
        <div className="page-load-sequence max-w-7xl w-full mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm text-white/90 mb-6">
            <Star size={14} className="text-yellow-500" />
            Trusted by professional photographers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
            Deliver Beautiful<br />
            <span className="bg-gradient-to-r from-amber-100 to-orange-300 bg-clip-text text-transparent">Client Galleries</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-10">
            The professional photography platform that helps you upload, organize, and share stunning galleries with your clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg">Start Free Trial <ChevronRight size={16} className="ml-1" /></Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg" className="border-white/50! bg-white/10 text-white! hover:bg-white/20! hover:border-white! backdrop-blur-sm">See Features</Button>
            </Link>
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
  const { plans, loading, error, retry } = usePlans();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const { user } = useAuth();
  return <div className="min-h-screen"><PublicNav /><section className="pt-28 sm:pt-32 pb-20 px-4"><div className="max-w-7xl mx-auto">
    <div className="text-center max-w-2xl mx-auto mb-10"><p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] font-semibold mb-4">Room for every story</p><h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">A plan for your studio.</h1><p className="text-[var(--text-secondary)] mb-7">Start free, then choose the space and tools your photography needs. Pay monthly or for a full year with MTN MoMo.</p><BillingCycleToggle value={cycle} onChange={setCycle} /><p className="text-xs text-[var(--text-secondary)] mt-4">Prices in RWF. Annual plans are paid in full for 12 months.</p></div>
    {loading ? <Spinner /> : error ? <div role="alert" className="text-center space-y-3"><p>Pricing is temporarily unavailable. Please try again.</p><Button variant="secondary" onClick={retry}>Retry pricing</Button></div> : <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">{plans.map(plan => <PlanCard key={plan.id} plan={plan} cycle={cycle} action={<Link className="block" to={user ? '/dashboard' : '/register'} state={user ? { luminaPage: 'subscription', billingCycle: cycle } : undefined}><Button className="w-full">{plan.id === 'free' ? 'Start free' : 'Choose ' + plan.name}</Button></Link>} />)}</div>}
    <p className="text-center text-xs text-[var(--text-secondary)] mt-8">Paid plans are activated after payment verification. No automatic charges.</p>
  </div></section><Footer /></div>;
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const update = (setter: (value: string) => void, value: string) => { setter(value); setDraft(null); };
  const prepareMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const text = [`Hello KigaliPix,`, `Name: ${name.trim()}`, `Email: ${email.trim()}`, subject.trim() ? `Subject: ${subject.trim()}` : '', '', message.trim()].filter((line, index) => line || index === 4).join('\n');
    setDraft(`${CONTACT_DETAILS.whatsapp.href}?text=${encodeURIComponent(text)}`);
  };
  return <div className="min-h-screen"><PublicNav />
    <section className="pt-28 sm:pt-32 pb-20 px-4"><div className="max-w-5xl mx-auto">
      <div className="text-center max-w-xl mx-auto mb-10"><p className="text-xs uppercase tracking-[0.18em] font-semibold text-[var(--accent)] mb-3">We're here to help</p><h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">Let's talk.</h1><p className="text-[var(--text-secondary)]">Questions about your studio, galleries, or subscription? Reach us on WhatsApp, give us a call, or find us on Instagram.</p></div>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <a href={CONTACT_DETAILS.whatsapp.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 hover:border-[var(--accent)] transition-colors"><MessageCircle size={24} className="text-[var(--accent)] mb-4" aria-hidden="true" /><h2 className="font-semibold mb-2">WhatsApp</h2><p className="text-sm text-[var(--text-secondary)]">{CONTACT_DETAILS.whatsapp.label}</p><p className="text-xs text-[var(--text-secondary)] mt-3">Start a conversation <span aria-hidden="true">&rarr;</span></p></a>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"><Phone size={24} className="text-[var(--accent)] mb-4" aria-hidden="true" /><h2 className="font-semibold mb-2">Call us</h2><div className="space-y-2">{CONTACT_DETAILS.phones.map(phone => <a key={phone.href} href={phone.href} className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] underline underline-offset-4">{phone.label}</a>)}</div></div>
        <a href={CONTACT_DETAILS.instagram.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 hover:border-[var(--accent)] transition-colors"><Instagram size={24} className="text-[var(--accent)] mb-4" aria-hidden="true" /><h2 className="font-semibold mb-2">Instagram</h2><p className="text-sm text-[var(--text-secondary)] break-all">{CONTACT_DETAILS.instagram.label}</p><p className="text-xs text-[var(--text-secondary)] mt-3">Visit our profile <span aria-hidden="true">&rarr;</span></p></a>
      </div>
      <div className="max-w-2xl mx-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 sm:p-8">
        <h2 className="text-xl font-semibold mb-2">Send us a message</h2><p id="contact-help" className="text-sm text-[var(--text-secondary)] mb-6">Prepare your message here, then open WhatsApp to review and send it.</p>
        <form onSubmit={prepareMessage} aria-describedby="contact-help" className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4"><Input label="Name" autoComplete="name" value={name} onChange={event => update(setName, event.target.value)} placeholder="Your name" required /><Input label="Email" autoComplete="email" type="email" value={email} onChange={event => update(setEmail, event.target.value)} placeholder="you@studio.com" required /></div>
          <Input label="Subject (optional)" value={subject} onChange={event => update(setSubject, event.target.value)} placeholder="How can we help?" />
          <div className="space-y-1.5"><label htmlFor="contact-message" className="block text-sm font-medium text-[var(--text-secondary)]">Message</label><textarea id="contact-message" rows={5} value={message} onChange={event => update(setMessage, event.target.value)} placeholder="Tell us more..." required className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-y" /></div>
          <Button type="submit" className="w-full gap-2" size="lg"><MessageCircle size={18} aria-hidden="true" />Prepare WhatsApp message</Button>
        </form>
        {draft && <div role="status" className="mt-5 p-4 rounded-xl bg-[var(--bg-tertiary)]"><p className="text-sm mb-3">Your message is ready. Open WhatsApp to review and send it.</p><a href={draft} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline">Open WhatsApp <ArrowRight size={16} aria-hidden="true" /></a></div>}
      </div>
    </div></section><Footer /></div>;
}

// LOGIN PAGE
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, authBusy } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authBusy) return;
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    if (loading || authBusy) return;
    setError(''); setLoading(true);
    try { await googleLogin(); navigate('/dashboard', { replace: true }); }
    catch (error: any) { setError(error.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout mode="login">
      <Button type="button" variant="secondary" className="auth-google-button w-full gap-3" disabled={loading || authBusy} onClick={handleGoogle}><GoogleIcon />Continue with Google</Button>
      <div className="auth-divider"><span>or continue with email</span></div>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading || authBusy}>
        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}

        <Input label="Email address" name="email" autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" required disabled={loading || authBusy} />
        <div className="relative">
          <Input label="Password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pr-12" placeholder="Enter your password" minLength={1} required disabled={loading || authBusy} />
          <button type="button" className="absolute right-1 bottom-0.5 p-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)]" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <div className="flex justify-end"><Link to="/forgot-password" className="text-sm text-[var(--accent)] hover:underline">Forgot password?</Link></div>
        <Button type="submit" className="w-full gap-2" size="lg" loading={loading} disabled={authBusy}>Sign in to your studio <ArrowRight size={17} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">New to KigaliPix? <Link to="/register" className="text-[var(--accent)] hover:underline font-semibold">Create an account</Link></p>
    </AuthLayout>
  );
}

// REGISTER PAGE
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin, authBusy } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authBusy) return;
    setError('');
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    if (loading || authBusy) return;
    setError(''); setLoading(true);
    try { await googleLogin(); navigate('/dashboard', { replace: true }); }
    catch (error: any) { setError(error.message); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout mode="register">
      <Button type="button" variant="secondary" className="auth-google-button w-full gap-3" disabled={loading || authBusy} onClick={handleGoogle}><GoogleIcon />Continue with Google</Button>
      <div className="auth-divider"><span>or continue with email</span></div>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading || authBusy}>
        {error && <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
        <Input label="Full name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required disabled={loading || authBusy} />
        <Input label="Email address" name="email" autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" required disabled={loading || authBusy} />
        <div className="relative">
          <Input label="Password" name="password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pr-12" placeholder="At least 6 characters" minLength={6} required disabled={loading || authBusy} />
          <button type="button" className="absolute right-1 bottom-0.5 p-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)]" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">Use at least 6 characters for your password.</p>
        <Button type="submit" className="w-full gap-2" size="lg" loading={loading} disabled={authBusy}>Create free account <ArrowRight size={17} /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">Already have an account? <Link to="/login" className="text-[var(--accent)] hover:underline font-semibold">Sign in</Link></p>
    </AuthLayout>
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
            <img src="kigalipix.png" alt="Kigalipix" className="w-10 h-10 rounded-xl object-contain" />
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
