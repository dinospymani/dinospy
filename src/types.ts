export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastReadNotification?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'offer' | 'trending' | 'new_arrival' | 'general';
  link?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  offerPrice?: number;
  rating?: number;
}
