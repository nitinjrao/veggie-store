export interface Category {
  id: string;
  name: string;
  nameHindi: string | null;
  nameKannada?: string | null;
  image: string | null;
  sortOrder: number;
  _count?: {
    vegetables: number;
  };
}

export interface Price {
  id: string;
  vegetableId: string;
  pricePerKg: string | null;
  pricePerPiece: string | null;
  pricePerPacket: string | null;
  packetWeight: string | null;
  effectiveFrom: string;
}

export interface Vegetable {
  id: string;
  name: string;
  nameHindi: string | null;
  nameKannada?: string | null;
  image: string | null;
  emoji: string | null;
  description: string | null;
  available: boolean;
  stockKg?: string;
  minStockAlert?: string;
  categoryId: string;
  category: Category;
  prices: Price[];
}

export interface User {
  id: string;
  role: 'customer' | 'admin';
  name?: string | null;
  phone?: string;
  email?: string;
}

export type UnitType = 'KG' | 'GRAM' | 'PIECE' | 'BUNCH' | 'PACKET';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface CartItem {
  vegetableId: string;
  vegetable: Vegetable;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  vegetableId: string;
  quantity: string;
  unit: UnitType;
  unitPrice: string;
  totalPrice: string;
  vegetable: Vegetable;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: string;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlaceOrderPayload {
  items: {
    vegetableId: string;
    quantity: number;
    unit: UnitType;
  }[];
  address?: string;
  notes?: string;
}
