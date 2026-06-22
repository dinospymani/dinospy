export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastReadNotification?: string;
  dismissedNotifications?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'offer' | 'trending' | 'new_arrival' | 'general' | 'order' | 'security' | 'promotion';
  link?: string;
  createdAt: string;
  expiresAt?: string;
}

export type HorologicalTheme = 'noir' | 'titanium' | 'heritage';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  offerPrice?: number;
  rating?: number;
  specs?: {
    case?: string;
    movement?: string;
    crystal?: string;
  };
}
