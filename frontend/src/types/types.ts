export interface User {
    id: number;
    email: string;
    username: string;
    role: string;
    subscriptionTier?: string;
    subscription_id?: string;
    subscription_status?: string;
    subscription_period_end?: string;
    pending_subscription_tier?: string;
    favoriteSport?: string;
    favoriteTeam?: string;
    favoritePlayers?: string;
    image_url?: string;
    store_id?: string;
    
} 
