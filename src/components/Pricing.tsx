import React from 'react';
import { Check, HardDrive, Users, Image } from 'lucide-react';
import { Badge } from './UI';
import { formatRwf, getPlanQuote, type SubscriptionPlan, type BillingCycle } from '../services/pricing';

export function BillingCycleToggle({ value, onChange }: { value: BillingCycle; onChange: (cycle: BillingCycle) => void }) {
  return <div role="group" aria-label="Billing period" className="inline-flex p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] gap-1">
    {(['monthly', 'annual'] as const).map(cycle => <button type="button" key={cycle} aria-pressed={value === cycle} onClick={() => onChange(cycle)} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${value === cycle ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{cycle === 'monthly' ? 'Monthly' : 'Annual'}</button>)}
  </div>;
}

export function PlanPrice({ plan, cycle }: { plan: SubscriptionPlan; cycle: BillingCycle }) {
  const quote = getPlanQuote(plan, cycle);
  const monthlyTotal = getPlanQuote(plan, 'monthly').amountRwf * 12;
  const saving = cycle === 'annual' ? Math.max(0, monthlyTotal - quote.amountRwf) : 0;
  return <div className="my-5 space-y-2">
    {quote.discountPercent > 0 && <div className="flex flex-wrap items-center gap-2 text-sm"><del className="text-[var(--text-secondary)]">{formatRwf(quote.baseAmountRwf)}</del><Badge variant="success">{quote.discountPercent}% off</Badge></div>}
    <p className="flex flex-wrap items-baseline gap-x-1.5"><span className="text-3xl font-bold tracking-tight">{plan.id === 'free' ? 'Free' : formatRwf(quote.amountRwf)}</span>{plan.id !== 'free' && <span className="text-sm text-[var(--text-secondary)]">/{cycle === 'annual' ? 'year' : 'month'}</span>}</p>
    <p className="text-xs text-[var(--text-secondary)]">{plan.id === 'free' ? 'No payment required.' : cycle === 'annual' ? 'One payment for 12 months. No automatic renewal.' : 'One payment for 1 month. No automatic renewal.'}</p>
    {saving > 0 && plan.id !== 'free' && <p className="text-xs text-emerald-700 dark:text-emerald-400">Save {formatRwf(saving)} compared with 12 monthly payments.</p>}
  </div>;
}

export function PlanCard({ plan, cycle, current = false, action }: { plan: SubscriptionPlan; cycle: BillingCycle; current?: boolean; action: React.ReactNode }) {
  return <article className={`relative flex flex-col rounded-2xl border bg-[var(--bg-card)] p-5 sm:p-6 ${current || plan.popular ? 'border-[var(--accent)] shadow-[var(--shadow-md)]' : 'border-[var(--border-color)]'}`}>
    <div className="min-h-6 mb-3">{current ? <Badge variant="success">Current plan</Badge> : plan.popular ? <Badge variant="info">Most popular</Badge> : <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{plan.id === 'free' ? 'Start creating' : 'Grow your studio'}</span>}</div>
    <h3 className="text-xl font-semibold">{plan.name}</h3>{plan.description && <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">{plan.description}</p>}
    <PlanPrice plan={plan} cycle={cycle} />
    <ul className="space-y-3 text-sm text-[var(--text-secondary)] mb-7">
      <li className="flex gap-2 items-start"><HardDrive aria-hidden="true" size={16} className="shrink-0 text-[var(--accent)]" />{plan.storageGb} GB storage</li>
      <li className="flex gap-2 items-start"><Users aria-hidden="true" size={16} className="shrink-0 text-[var(--accent)]" />{plan.maxClients < 0 ? 'Unlimited' : plan.maxClients} clients</li>
      <li className="flex gap-2 items-start"><Image aria-hidden="true" size={16} className="shrink-0 text-[var(--accent)]" />{plan.maxGalleries < 0 ? 'Unlimited' : plan.maxGalleries} galleries</li>
      {plan.features.map((feature, index) => <li key={index} className="flex gap-2 items-start"><Check aria-hidden="true" size={16} className="shrink-0 text-[var(--accent)]" /><span className="break-words min-w-0">{feature}</span></li>)}
    </ul><div className="mt-auto">{action}</div>
  </article>;
}
