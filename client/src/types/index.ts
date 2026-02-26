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
  pricePerBundle: string | null;
  pricePerBunch: string | null;
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
  role: 'customer' | 'admin' | 'producer' | 'supplier' | 'transporter';
  staffRole?: string;
  name?: string | null;
  phone?: string;
  email?: string;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';

export type PaymentMethod = 'CASH' | 'UPI';

export interface Payment {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  receivedAt: string;
  createdAt: string;
  loggedBy?: { name: string };
}

export type UnitType = 'KG' | 'GRAM' | 'PIECE' | 'BUNCH' | 'PACKET' | 'BUNDLE';

export interface CartItem {
  vegetableId: string;
  vegetable: Vegetable;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  id: string;
  label: string;
  text: string;
  isDefault: boolean;
  createdAt: string;
}

// ---- Fridge / Refrigerator types ----

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  active: boolean;
  refrigerators?: Refrigerator[];
}

export type RefrigeratorStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type FridgeOrderStatus = 'PENDING' | 'CONFIRMED' | 'READY' | 'PICKED_UP' | 'CANCELLED';

export interface Refrigerator {
  id: string;
  locationId: string;
  name: string;
  status: RefrigeratorStatus;
  location?: Location;
  _count?: { inventory: number };
}

export interface FridgeInventoryItem {
  id: string;
  refrigeratorId: string;
  vegetableId: string;
  quantityAvailable: string;
  minimumThreshold: string;
  vegetable: Vegetable;
}

export interface FridgePickupOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  refrigeratorId: string;
  status: FridgeOrderStatus;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  assignedToId: string | null;
  notes: string | null;
  confirmedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: FridgePickupItem[];
  refrigerator?: Refrigerator & { location?: Location };
  payments?: Payment[];
  assignedTo?: { id: string; name: string } | null;
  customer?: { id: string; name: string | null; phone: string };
}

export interface FridgePickupItem {
  id: string;
  pickupOrderId: string;
  vegetableId: string;
  quantity: string;
  unit: UnitType;
  unitPrice: string;
  totalPrice: string;
  vegetable: Vegetable;
}

export interface FridgeCartItem {
  vegetableId: string;
  vegetable: Vegetable;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalPrice: number;
}
