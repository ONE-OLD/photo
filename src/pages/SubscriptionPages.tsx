import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BillingCycleToggle, PlanCard, PlanPrice } from '../components/Pricing';
import { usePlans } from '../hooks/usePlans';
import { getPlanQuote, normalizePlans, validatePlans, type BillingCycle } from '../services/pricing';
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
import { Button, Card, Badge, PageHeader, StatCard, Input, Textarea, Modal, Spinner, EmptyState } from '../components/UI';
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
  const { plans, loading: plansLoading, error: pricingError, retry: retryPlans } = usePlans();
  const location = useLocation();
  const [cycle, setCycle] = useState<BillingCycle>(() => (location.state as { billingCycle?: string } | null)?.billingCycle === 'annual' ? 'annual' : 'monthly');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const paymentLock = useRef(false);
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
      const [u, pays] = await Promise.all([
        database.getUserUsage(user?.uid),
        user ? database.getPaymentsByUser(user.uid) : Promise.resolve([]),
      ]);
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

  useEffect(() => {
    if (!submitting) return;
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: Event) => event.preventDefault();
    window.addEventListener('beforeunload', leave); window.addEventListener('studio-before-navigate', navigate);
    return () => { window.removeEventListener('beforeunload', leave); window.removeEventListener('studio-before-navigate', navigate); };
  }, [submitting]);

  if (loading || plansLoading) return <Spinner />;
  if (loadError || pricingError) {
    return (
      <div role="alert" className="space-y-3 text-sm text-red-600 dark:text-red-400">
        <p>Could not load subscription data: {loadError || pricingError}</p>
        <Button variant="secondary" onClick={() => { setLoading(true); retryPlans(); void load(); }}>Retry</Button>
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
    if (paymentLock.current || !selectedPlan || !user || !profile) return;
    if (pendingPayment) { addToast('A payment is already awaiting verification. Please wait for it to be reviewed.', 'info'); return; }
    const quote = getPlanQuote(selectedPlan, selectedCycle);
    if (selectedPlan.id === 'free') { addToast('You are already on the Free plan', 'info'); return; }
    if (!/^(\+?25)?0?7[89]\d{7}$/.test(payerNumber.replace(/\s/g, ''))) {
      addToast('Enter a valid Rwandan MoMo number (e.g. 078XXXXXXX)', 'error');
      return;
    }
    paymentLock.current = true;
    setSubmitting(true);
    try {
      const recorded = await database.createPayment({
        userId: user.uid,
        userEmail: profile.email,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        ...quote,
        method: 'mtn-momo',
        payerNumber: payerNumber.replace(/\s/g, ''),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });
      setPayments(previous => [recorded, ...previous]);
      setSelectedPlan(null);
      setReference('');
      addToast('Payment reported. The admin will verify your MoMo payment and activate the selected billing period.', 'success');
      void refreshProfile().catch(() => {});
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to record payment. Try again.', 'error');
    } finally { paymentLock.current = false; setSubmitting(false); }
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
              <li>Click <span className="font-semibold">"Choose monthly" or "Choose annual"</span> on your chosen plan below and enter the phone number you paid from plus the MoMo transaction reference.</li>
              <li>The administrator verifies the transaction and manually activates your plan for the selected period — after review.</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"><div><h2 className="font-semibold text-xl">Choose your next chapter</h2><p className="text-sm text-[var(--text-secondary)] mt-1">Keep monthly billing or pay for a full year.</p></div><BillingCycleToggle value={cycle} onChange={setCycle} /></div>
      {pendingPayment && <p role="status" className="text-sm text-[var(--text-secondary)] mb-5">A payment is awaiting verification. You can choose another plan after it has been reviewed.</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">{plans.map(plan => {
        const isCurrent = plan.id === effectivePlan.id;
        return <PlanCard key={plan.id} plan={plan} cycle={cycle} current={isCurrent} action={plan.id === 'free' ? <Button variant="secondary" className="w-full" disabled>{isCurrent ? 'Current free plan' : 'Default free plan'}</Button> : <Button className="w-full" disabled={!!pendingPayment} onClick={() => { setSelectedCycle(cycle); setSelectedPlan({ ...plan, features: [...plan.features] }); }}>{isCurrent ? 'Renew' : 'Choose'} {cycle === 'annual' ? 'annual' : 'monthly'}</Button>} />;
      })}</div>

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
                  <th className="py-2 pr-4 font-medium">Billing period</th>
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
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{p.billingCycle === 'annual' ? 'Annual (12 months)' : 'Monthly (1 month)'}</td>
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
      <Modal isOpen={!!selectedPlan} onClose={() => !paymentLock.current && setSelectedPlan(null)} closeDisabled={submitting} title={`${selectedPlan?.name || ''} · ${selectedCycle === 'annual' ? 'Annual payment' : 'Monthly payment'}`}>
        {selectedPlan && (
          <div className="space-y-5">
            <PlanPrice plan={selectedPlan} cycle={selectedCycle} />
            <p className="text-xs text-[var(--text-secondary)]">The amount and billing period shown here will be saved with your payment report. New catalog prices apply when you open a new selection.</p>
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2 text-sm">
              <p className="text-[var(--text-secondary)]">Step 1 — Pay with MTN MoMo:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] font-mono font-bold text-[var(--text-primary)] text-base select-all">
                  {MTN_MOMO_USSD_DIAL}
                </code>
                <Button
                  variant="secondary" size="sm"
                  aria-label="Copy MoMo dial code" onClick={async () => { try { await navigator.clipboard.writeText(MTN_MOMO_USSD_DIAL); addToast('USSD code copied!', 'success'); } catch { addToast('Could not copy. Select the dial code and copy it manually.', 'error'); } }}
                ><Copy size={14} /></Button>
              </div>
              <p className="text-[var(--text-muted)] text-xs">Dial this code, pay <span className="font-semibold text-[var(--text-primary)]">{formatRwf(getPlanQuote(selectedPlan, selectedCycle).amountRwf)}</span> to merchant <span className="font-semibold">{MTN_MOMO_MERCHANT_CODE}</span>, then confirm with your PIN.</p>
            </div>

            <div className="text-sm text-[var(--text-secondary)]">Step 2 — Tell us you have paid so the admin can verify and activate your plan:</div>
            <Input label="MoMo phone number you paid from" value={payerNumber} disabled={submitting} onChange={e => setPayerNumber(e.target.value)} placeholder="078XXXXXXX" />
            <Input label="Transaction reference (optional)" value={reference} disabled={submitting} onChange={e => setReference(e.target.value)} placeholder="e.g. MoMo SMS reference ID" />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" disabled={submitting} onClick={() => setSelectedPlan(null)}>Cancel</Button>
              <Button onClick={handlePay} loading={submitting}><CreditCard size={15} className="mr-1.5" /> I have paid — Notify admin</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ADMIN PRICING PAGE (changing prices) ───────────────────────────────────
type PricingNumberField = 'priceRwf' | 'annualPriceRwf' | 'monthlyDiscountPercent' | 'annualDiscountPercent' | 'storageGb' | 'maxClients' | 'maxGalleries';
type PlanDraft = Omit<SubscriptionPlan, PricingNumberField> & Record<PricingNumberField, string>;
const numberFields: PricingNumberField[] = ['priceRwf', 'annualPriceRwf', 'monthlyDiscountPercent', 'annualDiscountPercent', 'storageGb', 'maxClients', 'maxGalleries'];
function toDraft(plan: SubscriptionPlan): PlanDraft {
  const draft: any = { ...plan, features: [...plan.features] };
  numberFields.forEach(field => { draft[field] = String(plan[field] ?? 0); });
  return draft;
}
function fromDraft(draft: PlanDraft): SubscriptionPlan {
  const plan: any = { ...draft, name: draft.name.trim() };
  numberFields.forEach(field => { plan[field] = draft[field].trim() ? Number(draft[field]) : NaN; });
  return plan;
}

export function AdminPricingPage() {
  const { isAdmin, profile } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<PlanDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  const load = () => { setLoading(true); setError(''); database.getPlans().then(value => setPlans(value.map(toDraft))).catch(() => setError('Could not load pricing. Try again.')).finally(() => setLoading(false)); };
  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: Event) => { if (lock.current || !window.confirm('Discard unsaved pricing changes?')) event.preventDefault(); };
    window.addEventListener('beforeunload', leave); window.addEventListener('studio-before-navigate', navigate);
    return () => { window.removeEventListener('beforeunload', leave); window.removeEventListener('studio-before-navigate', navigate); };
  }, [dirty, saving]);
  if (!isAdmin) return <EmptyState icon={<Shield size={48} />} title="Access denied" description="Admin access is required to manage pricing." />;
  if (loading) return <Spinner />;
  const updateField = <K extends keyof PlanDraft>(index: number, field: K, value: PlanDraft[K]) => { setPlans(previous => previous.map((plan, i) => i === index ? { ...plan, [field]: value } : plan)); setDirty(true); };
  const save = async (reset = false) => {
    if (lock.current) return;
    let values: SubscriptionPlan[];
    try { values = reset ? normalizePlans(DEFAULT_PLANS) : plans.map(fromDraft); validatePlans(values); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Review the pricing fields.'); return; }
    lock.current = true; setSaving(true); setError('');
    try { const saved = await database.savePlans(values); setPlans(saved.map(toDraft)); setDirty(false); addToast('Pricing saved. Public pricing and subscriptions are updated.', 'success'); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save pricing. Your edits are preserved.'); }
    finally { lock.current = false; setSaving(false); }
  };
  return <div className="animate-fade-in max-w-6xl">
    <PageHeader title="Pricing management" description="One catalog for your public pricing page and studio subscriptions." action={<Button disabled={!dirty || !plans.length} loading={saving} onClick={() => save()}>Save pricing</Button>} />
    <Card className="p-5 mb-6"><p className="text-sm text-[var(--text-secondary)]">Set monthly and annual base prices, then optional discounts for each period. Annual payments cover 12 months. Prices are whole RWF amounts, discounts range from 0 to 99%, and the Free plan always stays free.</p><p className="text-xs text-[var(--text-secondary)] mt-2">Saved changes appear live on both pricing screens. Payment reports already submitted keep their original price and period. Plan limits apply immediately to everyone on that tier.</p></Card>
    {error && <div role="alert" className="p-4 mb-5 rounded-xl border border-red-500 text-sm text-red-600 dark:text-red-400"><p>{error}</p>{!plans.length && <Button variant="secondary" onClick={load}>Retry</Button>}</div>}
    <div className="space-y-6">{plans.map((plan, index) => <Card key={plan.id} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5"><h2 className="text-xl font-semibold">{plan.name || 'Untitled plan'}</h2><Badge>{plan.id}</Badge>{plan.popular && <Badge variant="info">Most popular</Badge>}</div>
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
        <div className="grid sm:grid-cols-2 gap-4"><Input label="Plan name" value={plan.name} onChange={event => updateField(index, 'name', event.target.value)} /><Textarea label="Plan description" rows={2} value={plan.description || ''} onChange={event => updateField(index, 'description', event.target.value)} /></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{([
          ['priceRwf', 'Monthly base price (RWF)', 1], ['monthlyDiscountPercent', 'Monthly discount (%)', 0], ['annualPriceRwf', 'Annual base price (RWF)', 1], ['annualDiscountPercent', 'Annual discount (%)', 0],
        ] as const).map(([field, label, minimum]) => <Input key={field} label={label} type="number" min={plan.id === 'free' ? 0 : minimum} max={field.includes('Discount') ? 99 : undefined} step={field.includes('Discount') ? 0.1 : 1} value={plan[field]} disabled={plan.id === 'free'} onChange={event => updateField(index, field, event.target.value)} />)}</div>
        <div className="grid sm:grid-cols-3 gap-4">{([['storageGb', 'Storage (GB)', 0.01], ['maxClients', 'Client limit (-1 = unlimited)', -1], ['maxGalleries', 'Gallery limit (-1 = unlimited)', -1]] as const).map(([field, label, minimum]) => <Input key={field} label={label} type="number" min={minimum} step={field === 'storageGb' ? 0.01 : 1} value={plan[field]} onChange={event => updateField(index, field, event.target.value)} />)}</div>
        <Textarea label="Additional features (one per line)" rows={4} value={plan.features.join('\n')} onChange={event => updateField(index, 'features', event.target.value.split('\n'))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!plan.popular} onChange={event => updateField(index, 'popular', event.target.checked)} />Mark as popular</label>
        <details className="rounded-xl bg-[var(--bg-tertiary)] p-4"><summary className="cursor-pointer text-sm font-medium">Preview payment amounts</summary><div className="grid sm:grid-cols-2 gap-4">{['monthly', 'annual'].map(period => { const parsed = fromDraft(plan); const valid = [parsed.priceRwf, parsed.annualPriceRwf, parsed.monthlyDiscountPercent, parsed.annualDiscountPercent].every(value => Number.isFinite(value) && value! >= 0); return <div key={period}><p className="text-sm mt-4 font-semibold capitalize">{period}</p>{valid ? <PlanPrice plan={parsed} cycle={period as BillingCycle} /> : <p className="text-sm mt-4">Enter valid prices and discounts to preview.</p>}</div>; })}</div></details>
      </fieldset>
    </Card>)}</div>
    <div className="flex flex-wrap justify-between gap-3 mt-6"><Button variant="ghost" disabled={saving || !plans.length} onClick={() => { if (window.confirm('Replace all current prices, discounts, descriptions, features, and limits with the built-in defaults?')) void save(true); }}>Reset to defaults</Button><Button disabled={!dirty || !plans.length} loading={saving} onClick={() => save()}>Save pricing</Button></div>
    <p className="text-xs text-[var(--text-secondary)] mt-4">{dirty ? 'Unsaved changes' : 'All changes saved'} · {profile?.email}</p>
  </div>;
}
