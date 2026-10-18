import { useEffect, useState } from 'react';
import { database, type SubscriptionPlan } from '../services/database';

export function usePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setLoading(true); setError('');
    return database.subscribeToPlans(value => { setPlans(value); setError(''); setLoading(false); }, failure => { setError(failure.message || 'Could not load pricing.'); setLoading(false); });
  }, [attempt]);
  return { plans, loading, error, retry: () => setAttempt(value => value + 1) };
}
