export interface User {
  id: number;
  email: string;
  username: string;
  subscriptionTier?: string;
  subscription_id?: string;
  subscription_status?: string;
  subscription_period_end?: string;
  pending_subscription_tier?: string;
  // ... other existing fields ...
} 