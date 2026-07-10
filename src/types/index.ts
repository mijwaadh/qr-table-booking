export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'Starters' | 'Main Course' | 'Beverages' | 'Desserts';
  available: boolean;
  type: 'VEG' | 'NON-VEG';
  calories?: string;
  imageUrl?: string;
  badge?: 'Best Seller' | 'Allergy' | 'None';
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  completed?: boolean;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  amount: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  time: string;
  elapsedMinutes: number;
  allergyAlert?: string;
  notes?: string;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'PAYMENT_PENDING';
  seatedTime?: string;
  elapsedMinutes?: number;
  amount?: number;
  serverName?: string;
}
