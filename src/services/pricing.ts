export type BillingCycle = 'monthly' | 'annual';

export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  priceRwf: number;      // editable by admin (changing-price page)
  storageGb: number;     // storage quota in GB
  maxClients: number;    // maximum number of clients allowed
  maxGalleries: number;  // maximum number of galleries allowed
  features: string[];
  popular?: boolean;
  annualPriceRwf?: number;
  monthlyDiscountPercent?: number;
  annualDiscountPercent?: number;
  description?: string;
}

// Default tiers – Free 1GB, Basic 5GB/5000RWF, Pro 10GB/10000RWF, Enterprise 100GB/50000RWF
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free', name: 'Free', priceRwf: 0, storageGb: 1, maxClients: 5, maxGalleries: 10,
    features: ['1 GB storage', 'Up to 5 clients', 'Up to 10 galleries', 'Password-protected galleries', 'Client favorites & comments'],
  },
  {
    id: 'basic', name: 'Basic', priceRwf: 5000, storageGb: 5, maxClients: 25, maxGalleries: 50,
    features: ['5 GB storage', 'Up to 25 clients', 'Up to 50 galleries', 'Custom branding', 'Priority email support'],
    popular: true,
  },
  {
    id: 'pro', name: 'Pro', priceRwf: 10000, storageGb: 10, maxClients: 100, maxGalleries: 200,
    features: ['10 GB storage', 'Up to 100 clients', 'Up to 200 galleries', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', priceRwf: 50000, storageGb: 100, maxClients: -1, maxGalleries: -1,
    features: ['100 GB storage', 'Unlimited clients', 'Unlimited galleries', 'White-label sharing', 'Dedicated support'],
  },
];

export function getPlanById(plans: SubscriptionPlan[], planId?: string): SubscriptionPlan {
  return plans.find(p => p.id === planId) || plans.find(p => p.id === 'free') || DEFAULT_PLANS[0];
}

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString('en-US')} RWF`;
}


const amount = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
const limit = (value: unknown, fallback: number) => typeof value === 'number' && Number.isInteger(value) && value >= -1 ? value : fallback;
const discount = (value: unknown) => Math.min(99, amount(value, 0));
const quotaFeature = /^(?:[\d.]+ GB storage|Up to \d+ clients|Up to \d+ galleries|Unlimited clients|Unlimited galleries)$/i;

export function normalizePlans(stored: unknown): SubscriptionPlan[] {
  const rows: any[] = Array.isArray(stored) ? stored : stored && typeof stored === 'object' ? Object.values(stored) : [];
  return DEFAULT_PLANS.map(def => {
    const row = rows.find(row => row?.id === def.id) || {};
    const monthly = def.id === 'free' ? 0 : amount(row.priceRwf, def.priceRwf);
    return { ...def, name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : def.name,
      priceRwf: monthly, annualPriceRwf: def.id === 'free' ? 0 : amount(row.annualPriceRwf, monthly * 12),
      monthlyDiscountPercent: def.id === 'free' ? 0 : discount(row.monthlyDiscountPercent),
      annualDiscountPercent: def.id === 'free' ? 0 : discount(row.annualDiscountPercent),
      description: typeof row.description === 'string' ? row.description : '',
      storageGb: amount(row.storageGb, def.storageGb), maxClients: limit(row.maxClients, def.maxClients), maxGalleries: limit(row.maxGalleries, def.maxGalleries),
      popular: typeof row.popular === 'boolean' ? row.popular : !!def.popular,
      features: (Array.isArray(row.features) ? row.features : def.features).filter((feature: unknown): feature is string => typeof feature === 'string' && !!feature.trim() && !quotaFeature.test(feature.trim())).map((feature: string) => feature.trim()),
    };
  });
}

export function validatePlans(plans: SubscriptionPlan[]): void {
  if (plans.length !== DEFAULT_PLANS.length || new Set(plans.map(plan => plan.id)).size !== DEFAULT_PLANS.length || DEFAULT_PLANS.some(def => !plans.some(plan => plan.id === def.id))) throw new Error('Keep all four existing plan IDs.');
  for (const plan of plans) {
    if (!plan.name.trim()) throw new Error('Every plan needs a name.');
    for (const price of [plan.priceRwf, plan.annualPriceRwf ?? plan.priceRwf * 12]) if (!Number.isSafeInteger(price) || price < (plan.id === 'free' ? 0 : 1)) throw new Error(`${plan.name}: prices must be whole RWF amounts; paid plans must cost at least 1 RWF.`);
    for (const percent of [plan.monthlyDiscountPercent ?? 0, plan.annualDiscountPercent ?? 0]) if (!Number.isFinite(percent) || percent < 0 || percent > 99) throw new Error(`${plan.name}: discounts must be between 0 and 99%.`);
    if (!Number.isFinite(plan.storageGb) || plan.storageGb <= 0) throw new Error(`${plan.name}: storage must be greater than zero.`);
    for (const value of [plan.maxClients, plan.maxGalleries]) if (!Number.isInteger(value) || value < -1) throw new Error(`${plan.name}: limits must be whole numbers, or -1 for unlimited.`);
    if (!Array.isArray(plan.features) || plan.features.some(feature => typeof feature !== 'string')) throw new Error(`${plan.name}: enter one feature per line.`);
    if (plan.id === 'free' && (plan.priceRwf !== 0 || (plan.annualPriceRwf ?? 0) !== 0 || plan.monthlyDiscountPercent || plan.annualDiscountPercent)) throw new Error('The Free plan must remain free.');
  }
}

export function getPlanQuote(plan: SubscriptionPlan, cycle: BillingCycle) {
  const baseAmountRwf = plan.id === 'free' ? 0 : Math.round(cycle === 'annual' ? plan.annualPriceRwf ?? plan.priceRwf * 12 : plan.priceRwf);
  const discountPercent = plan.id === 'free' ? 0 : discount(cycle === 'annual' ? plan.annualDiscountPercent : plan.monthlyDiscountPercent);
  const amountRwf = plan.id === 'free' ? 0 : Math.max(1, Math.round(baseAmountRwf * (1 - discountPercent / 100)));
  return { billingCycle: cycle, durationMonths: cycle === 'annual' ? 12 : 1, baseAmountRwf, discountPercent, amountRwf };
}

export function addCalendarMonths(start: Date, months: number): Date {
  const result = new Date(start); const day = result.getUTCDate();
  result.setUTCDate(1); result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay)); return result;
}

export function paymentDuration(payment: { billingCycle?: BillingCycle; durationMonths?: number }): number {
  if (payment.billingCycle !== undefined && payment.billingCycle !== 'monthly' && payment.billingCycle !== 'annual') throw new Error('Invalid payment billing period.');
  const months = payment.billingCycle === 'annual' ? 12 : 1;
  if (payment.durationMonths !== undefined && payment.durationMonths !== months) throw new Error('Payment duration does not match its billing period.');
  return months;
}

export function validatePaymentQuote(payment: { planId: string; amountRwf: number; billingCycle?: BillingCycle; durationMonths?: number; baseAmountRwf?: number; discountPercent?: number }): void {
  paymentDuration(payment);
  if (!['basic', 'pro', 'enterprise'].includes(payment.planId)) throw new Error('Select a paid plan.');
  if (!Number.isSafeInteger(payment.amountRwf) || payment.amountRwf < 1) throw new Error('Payment amount must be a positive whole RWF amount.');
  if (payment.baseAmountRwf !== undefined || payment.discountPercent !== undefined) {
    if (!Number.isSafeInteger(payment.baseAmountRwf) || payment.baseAmountRwf! < 1 || typeof payment.discountPercent !== 'number' || !Number.isFinite(payment.discountPercent) || payment.discountPercent < 0 || payment.discountPercent > 99) throw new Error('Invalid payment price snapshot.');
    if (Math.max(1, Math.round(payment.baseAmountRwf! * (1 - payment.discountPercent / 100))) !== payment.amountRwf) throw new Error('Payment amount does not match its saved price and discount.');
  }
}

export type GrantDuration = 'monthly' | 'annual' | 'custom' | 'no-expiry';
export function resolveGrantMonths(planId: PlanId, duration: GrantDuration, customMonths: string): number {
  if (!DEFAULT_PLANS.some(plan => plan.id === planId)) throw new Error('Choose an existing plan.');
  if (planId === 'free') return 0;
  if (duration === 'monthly') return 1;
  if (duration === 'annual') return 12;
  if (duration === 'no-expiry') return 0;
  if (duration !== 'custom' || !customMonths.trim()) throw new Error('Enter a positive whole number of months.');
  const months = Number(customMonths);
  if (!Number.isSafeInteger(months) || months < 1 || !Number.isFinite(addCalendarMonths(new Date(), months).getTime())) throw new Error('Enter a valid positive whole number of months.');
  return months;
}
