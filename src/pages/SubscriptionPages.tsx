import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '../context/AppContext';
import {
  database,
  getPlanById,
  formatRwf,
  DEFAULT_PLANS,
  MTN_MOMO_MERCHANT_CODE,
  MTN_MOMO_USSD_DIAL,
  type SubscriptionPlan,
  type PaymentRecord,
} from '../services/database';
import { Button, Card, Badge, PageHeader, StatCard, Input, Modal, Spinner, EmptyState } from '../components/UI';
import { CreditCard, HardDrive, Users, Image as ImageIcon, Smartphone, Check, Clock, Shield, Copy, AlertTriangle } from 'lucide-react';

const GB = 1024 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

// ─── SUBSCRIPTION PAGE (photographer-facing) ────────────────────────────────
export function SubscriptionPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<{ storageBytes: number; totalPhotos: number; totalClients: number; totalGalleries: number } | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [payerNumber, setPayerNumber] = useState(profile?.phone || '');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [p, u, pays] = await Promise.all([
        database.getPlans(),
        database.getUserUsage(user?.uid),
        user ? database.getPaymentsByUser(user.uid) : Promise.resolve([]),
      ]);
      setPlans(p);
      setUsage(u as any);
      setPayments(pays);
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner />;
  if (loadError) {
    return (
      <div role="alert" className="space-y-3 text-sm text-red-600 dark:text-red-400">
        <p>Could not load subscription data: {loadError}</p>
        <Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>Retry</Button>
      </div>
    );
  }

  const currentPlan = getPlanById(plans, profile?.subscriptionPlan);
  const expired = currentPlan.id !== 'free' && !!profile?.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt).getTime() < Date.now();
  const effectivePlan = expired ? getPlanById(plans, 'free') : currentPlan;
  const storageUsedGb = usage ? usage.storageBytes / GB : 0;
  const storagePct = effectivePlan.storageGb > 0 ? Math.min(100, (storageUsedGb / effectivePlan.storageGb) * 100) : 100;
  const pendingPayment = payments.find(p => p.status === 'pending');

  const handlePay = async () => {
    if (!selectedPlan || !user || !profile) return;
    if (selectedPlan.id === 'free') { addToast('You are already on the Free plan', 'info'); return; }
    if (!/^(\+?25)?0?7[89]\d{7}$/.test(payerNumber.replace(/\s/g, ''))) {
      addToast('Enter a valid Rwandan MoMo number (e.g. 078XXXXXXX)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await database.createPayment({
        userId: user.uid,
        userEmail: profile.email,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amountRwf: selectedPlan.priceRwf,
        method: 'mtn-momo',
        payerNumber: payerNumber.replace(/\s/g, ''),
        reference: reference.trim() || undefined,
      });
      await refreshProfile();
      await load();
      setSelectedPlan(null);
      setReference('');
      addToast('Payment reported! The admin will verify your MoMo payment and activate your plan shortly.', 'success');
    } catch {
      addToast('Failed to record payment. Try again.', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in max-w-6xl">
      <PageHeader title="Subscription" description="Manage your plan, storage and client limits" />

      {expired && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">Your {currentPlan.name} subscription expired on {new Date(profile!.subscriptionExpiresAt!).toLocaleDateString()}. You are now on Free-plan limits. Pay again with MTN MoMo to restore access.</span>
        </div>
      )}

      {/* Current plan & usage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Current Plan" value={effectivePlan.name} icon={<Shield size={20} />} />
        <StatCard title="Storage Used" value={`${storageUsedGb.toFixed(2)} / ${effectivePlan.storageGb} GB`} icon={<HardDrive size={20} />} />
        <StatCard title="Clients" value={effectivePlan.maxClients < 0 ? `${usage?.totalClients ?? '—'} / ∞` : `${usage?.totalClients ?? '—'} / ${effectivePlan.maxClients}`} icon={<Users size={20} />} />
        <StatCard title="Galleries" value={effectivePlan.maxGalleries < 0 ? `${usage?.totalGalleries ?? 0} / ∞` : `${usage?.totalGalleries ?? 0} / ${effectivePlan.maxGalleries}`} icon={<ImageIcon size={20} />} />
      </div>

      <Card className="p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">Storage usage ({formatBytes(usage?.storageBytes || 0)} of {effectivePlan.storageGb} GB)</h3>
          <span className="text-xs text-[var(--text-muted)]">{storagePct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${storagePct > 90 ? 'bg-red-500' : storagePct > 70 ? 'bg-amber-500' : 'bg-[var(--accent)]'}`}
            style={{ width: `${Math.max(1, storagePct)}%` }}
          />
        </div>
        {profile?.subscriptionExpiresAt && !expired && (
          <p className="text-xs text-[var(--text-muted)] mt-3">
            {effectivePlan.id === 'free' ? 'Free plan — no expiry.' : `Your ${effectivePlan.name} plan is active until ${new Date(profile.subscriptionExpiresAt).toLocaleDateString()}.`}
          </p>
        )}
      </Card>

      {/* How to pay */}
      <Card className="p-6 mb-8 border-[var(--accent)]/40">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
            <Smartphone size={22} className="text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">How to pay — MTN Mobile Money (Rwanda)</h3>
            <ol className="text-sm text-[var(--text-secondary)] space-y-1.5 list-decimal list-inside mt-2">
              <li>Dial <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono text-[var(--text-primary)] font-semibold">{MTN_MOMO_USSD_DIAL}</code> from your MTN line (merchant code <span className="font-semibold">{MTN_MOMO_MERCHANT_CODE}</span>).</li>
              <li>Choose "Pay for Goods &amp; Services" (Purchase/Lipa), enter the amount for your chosen plan and confirm with your MoMo PIN.</li>
              <li>Click <span className="font-semibold">"Pay &amp; Notify"</span> on your chosen plan below and enter the phone number you paid from plus the MoMo transaction reference.</li>
              <li>The administrator verifies the payment in your MoMo statement and manually activates your extra storage and client limits — usually within a few hours.</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-lg">Available plans</h3>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {plans.map(plan => {
          const isCurrent = plan.id === effectivePlan.id && !expired;
          return (
            <div key={plan.id} className={`relative rounded-2xl p-6 border transition-all ${isCurrent ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50'}`}>
              {plan.popular && !isCurrent && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent)] text-white">POPULAR</span>}
              {isCurrent && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white">CURRENT PLAN</span>}
              <h4 className="font-bold text-[var(--text-primary)]">{plan.name}</h4>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{plan.priceRwf === 0 ? 'Free' : formatRwf(plan.priceRwf)}</span>
                {plan.priceRwf > 0 && <span className="text-sm text-[var(--text-muted)]"> /month</span>}
              </div>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-6">
                <li className="flex items-center gap-2"><HardDrive size={14} className="text-[var(--accent)] flex-shrink-0" /> {plan.storageGb} GB storage</li>
                <li className="flex items-center gap-2"><Users size={14} className="text-[var(--accent)] flex-shrink-0" /> {plan.maxClients < 0 ? 'Unlimited' : plan.maxClients} clients</li>
                <li className="flex items-center gap-2"><ImageIcon size={14} className="text-[var(--accent)] flex-shrink-0" /> {plan.maxGalleries < 0 ? 'Unlimited' : plan.maxGalleries} galleries</li>
                {plan.features.slice(3).map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check size={14} className="text-[var(--accent)] flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>Active</Button>
              ) : plan.priceRwf === 0 ? (
                <Button variant="secondary" className="w-full" disabled>Default plan</Button>
              ) : (
                <Button className="w-full" onClick={() => setSelectedPlan(plan)}>Pay {formatRwf(plan.priceRwf)} via MoMo</Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      <Card className="p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Payment history</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No payments yet. Choose a plan above to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">MoMo Number</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-primary)] font-medium">{p.planName}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{formatRwf(p.amountRwf)}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-muted)] font-mono text-xs">{p.payerNumber || '—'}</td>
                    <td className="py-2.5">
                      <Badge variant={p.status === 'confirmed' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pendingPayment && (
          <p className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
            <Clock size={12} /> A payment is awaiting admin verification. Your plan upgrades automatically once confirmed.
          </p>
        )}
      </Card>

      {/* Pay modal */}
      <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title={`Pay ${selectedPlan ? formatRwf(selectedPlan.priceRwf) : ''} for ${selectedPlan?.name || ''} plan`}>
        {selectedPlan && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 text-sm">
              <p className="text-[var(--text-secondary)]">Step 1 — Pay with MTN MoMo:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] font-mono font-bold text-[var(--text-primary)] text-base select-all">
                  {MTN_MOMO_USSD_DIAL}
                </code>
                <Button
                  variant="secondary" size="sm"
                  onClick={() => { navigator.clipboard.writeText(MTN_MOMO_USSD_DIAL); addToast('USSD code copied!', 'success'); }}
                ><Copy size={14} /></Button>
              </div>
              <p className="text-[var(--text-muted)] text-xs">Dial this code, pay <span className="font-semibold text-[var(--text-primary)]">{formatRwf(selectedPlan.priceRwf)}</span> to merchant <span className="font-semibold">{MTN_MOMO_MERCHANT_CODE}</span>, then confirm with your PIN.</p>
            </div>

            <div className="text-sm text-[var(--text-secondary)]">Step 2 — Tell us you have paid so the admin can verify and activate your plan:</div>
            <Input label="MoMo phone number you paid from" value={payerNumber} onChange={e => setPayerNumber(e.target.value)} placeholder="078XXXXXXX" />
            <Input label="Transaction reference (optional)" value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. MoMo SMS reference ID" />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedPlan(null)}>Cancel</Button>
              <Button onClick={handlePay} loading={submitting}><CreditCard size={15} className="mr-1.5" /> I have paid — Notify admin</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ADMIN PRICING PAGE (changing prices) ───────────────────────────────────
export function AdminPricingPage() {
  const { isAdmin, profile } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    database.getPlans().then(p => { setPlans(p.map(x => ({ ...x }))); setLoading(false); });
  }, [isAdmin]);

  if (!isAdmin) {
    return <EmptyState icon={<Shield size={48} />} title="Access Denied" description="You need admin privileges to manage pricing." />;
  }
  if (loading) return <Spinner />;

  const updateField = (idx: number, field: keyof SubscriptionPlan, value: any) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await database.savePlans(plans);
      setPlans(saved.map(x => ({ ...x })));
      setDirty(false);
      addToast('Pricing updated successfully', 'success');
    } catch {
      addToast('Failed to save pricing', 'error');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      // Restore the built-in default tiers (Free 1GB, 5GB/5000, 10GB/10000, 100GB/50000)
      const saved = await database.savePlans(DEFAULT_PLANS.map(p => ({ ...p })));
      setPlans(saved.map(x => ({ ...x })));
      setDirty(false);
      addToast('Pricing reset to defaults', 'success');
    } catch {
      addToast('Failed to reset pricing', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in max-w-5xl">
      <PageHeader
        title="Pricing Management"
        description="Change subscription prices, storage and client limits. Changes apply immediately for all photographers."
        action={<Button onClick={handleSave} loading={saving} disabled={!dirty}>Save Changes</Button>}
      />

      <Card className="p-4 mb-6 border-yellow-500/40 bg-yellow-500/5">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Smartphone size={16} className="text-yellow-500 flex-shrink-0" />
          Payments go to MTN MoMo merchant code <span className="font-mono font-bold text-[var(--text-primary)]">{MTN_MOMO_MERCHANT_CODE}</span> — dial <span className="font-mono font-bold text-[var(--text-primary)]">{MTN_MOMO_USSD_DIAL}</span>. Prices shown here are what photographers will be asked to pay.
        </div>
      </Card>

      <div className="space-y-4">
        {plans.map((plan, idx) => (
          <Card key={plan.id} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold text-[var(--text-primary)]">{plan.name}</h3>
              <Badge variant={plan.priceRwf === 0 ? 'info' : plan.id === 'enterprise' ? 'warning' : 'success'}>
                {plan.priceRwf === 0 ? 'Free tier' : formatRwf(plan.priceRwf) + '/mo'}
              </Badge>
              {plan.popular && <Badge variant="default">Popular</Badge>}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Price (RWF / month)"
                type="number" min={0} step={500}
                value={String(plan.priceRwf)}
                onChange={e => updateField(idx, 'priceRwf', Number(e.target.value))}
                disabled={plan.id === 'free'}
              />
              <Input
                label="Storage (GB)"
                type="number" min={0} step={1}
                value={String(plan.storageGb)}
                onChange={e => updateField(idx, 'storageGb', Number(e.target.value))}
              />
              <Input
                label="Max clients (-1 = unlimited)"
                type="number" min={-1} step={1}
                value={String(plan.maxClients)}
                onChange={e => updateField(idx, 'maxClients', Number(e.target.value))}
              />
              <Input
                label="Max galleries (-1 = unlimited)"
                type="number" min={-1} step={1}
                value={String(plan.maxGalleries)}
                onChange={e => updateField(idx, 'maxGalleries', Number(e.target.value))}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={handleReset} loading={saving && !dirty}>Reset to defaults</Button>
        <Button onClick={handleSave} loading={saving} disabled={!dirty}>Save Changes</Button>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-4">Admin: {profile?.email}</p>
    </div>
  );
}
