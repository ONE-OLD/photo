import React, { useEffect, useRef, useState } from 'react';
import { useAuth, useToast } from '../context/AppContext';
import { database, type PlanId, type SubscriptionPlan, type UserProfile } from '../services/database';
import { addCalendarMonths, resolveGrantMonths, type GrantDuration } from '../services/pricing';
import { PlanPrice } from './Pricing';
import { Button, Input, Modal, Select } from './UI';

export function ManageSubscriptionDialog({ target, plans, onClose, onSaved }: {
  target: UserProfile; plans: SubscriptionPlan[]; onClose: () => void; onSaved: () => void;
}) {
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [planId, setPlanId] = useState<PlanId>(() => plans.find(plan => plan.id === target.subscriptionPlan)?.id || 'free');
  const [duration, setDuration] = useState<GrantDuration>('monthly');
  const [customMonths, setCustomMonths] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const plan = plans.find(plan => plan.id === planId);
  let months: number | null = null;
  try { months = resolveGrantMonths(planId, duration, customMonths); } catch { /* Inline validation is shown when Apply is pressed. */ }
  const expiry = months ? addCalendarMonths(new Date(), months).toLocaleDateString() : null;
  useEffect(() => {
    if (!busy) return;
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: Event) => event.preventDefault();
    window.addEventListener('beforeunload', leave); window.addEventListener('studio-before-navigate', navigate);
    return () => { window.removeEventListener('beforeunload', leave); window.removeEventListener('studio-before-navigate', navigate); };
  }, [busy]);
  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    setError('');
    let selectedMonths: number;
    try { if (!plan || !profile) throw new Error('Choose a plan and sign in as an administrator.'); selectedMonths = resolveGrantMonths(planId, duration, customMonths); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Review the duration.'); return; }
    lock.current = true; setBusy(true);
    try {
      await database.grantSubscription(profile!.uid, target.uid, planId, selectedMonths, note.trim() || undefined);
      addToast(`${plan!.name} applied to ${target.email}${selectedMonths ? ` for ${selectedMonths} month(s)` : ' with no expiry'}.`, 'success');
      onSaved();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not update this subscription. Your choices are preserved.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Modal isOpen onClose={() => !lock.current && onClose()} closeDisabled={busy} title="Manage subscription">
    <form onSubmit={apply} className="space-y-5" aria-busy={busy} noValidate>
      <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm"><p className="font-semibold break-words">{target.name || target.email}</p><p className="text-[var(--text-secondary)] break-all mt-1">{target.email}</p><p className="text-xs text-[var(--text-secondary)] mt-2">Current plan: {plans.find(plan => plan.id === target.subscriptionPlan)?.name || 'Free'}{target.subscriptionExpiresAt && target.subscriptionPlan !== 'free' ? ` · Expires ${new Date(target.subscriptionExpiresAt).toLocaleDateString()}` : ' · No expiry'}</p></div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Select label="Plan" value={planId} disabled={busy} onChange={event => { setPlanId(event.target.value as PlanId); setError(''); }} options={plans.map(plan => ({ value: plan.id, label: `${plan.name} · ${plan.storageGb} GB storage` }))} />
      {planId !== 'free' && <Select label="Duration" value={duration} disabled={busy} onChange={event => { setDuration(event.target.value as GrantDuration); setError(''); }} options={[
        { value: 'monthly', label: 'Monthly — 1 month' }, { value: 'annual', label: 'Annual — 12 months' }, { value: 'custom', label: 'Custom duration' }, { value: 'no-expiry', label: 'No expiry — manual grant' },
      ]} />}
      {planId !== 'free' && duration === 'custom' && <Input label="Number of months" type="number" min={1} step={1} value={customMonths} disabled={busy} onChange={event => { setCustomMonths(event.target.value); setError(''); }} required />}
      {plan && planId !== 'free' && (duration === 'monthly' || duration === 'annual') && <div className="rounded-xl border border-[var(--border-color)] p-4"><p className="text-xs font-medium text-[var(--text-secondary)]">Current catalog price</p><PlanPrice plan={plan} cycle={duration} /></div>}
      <div className="text-sm text-[var(--text-secondary)] space-y-2" aria-live="polite">
        {planId === 'free' ? <p>Applies the Free plan immediately with no expiry. Existing galleries and photos are preserved; Free-plan limits apply.</p> : months === 0 ? <p>This is an ongoing manual grant with no expiry. It does not renew or charge the account.</p> : expiry ? <p>This manual grant starts today and replaces the current expiry. New expiry: <strong className="text-[var(--text-primary)]">{expiry}</strong>.</p> : <p>Enter a positive whole number of months to see the new expiry.</p>}
        <p className="text-xs">This action changes access only. To record and confirm a payment, use MoMo Payment Requests.</p>
      </div>
      <Input label="Admin note (optional)" value={note} disabled={busy} onChange={event => setNote(event.target.value)} placeholder="Reason for this grant or adjustment" />
      <div className="flex flex-wrap justify-end gap-2 pt-2"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" loading={busy} disabled={!plan}>{planId === 'free' ? 'Apply Free plan' : 'Apply subscription'}</Button></div>
    </form>
  </Modal>;
}
