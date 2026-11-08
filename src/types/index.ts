export interface Store {
  id: string;
  name: string;
  code: string;
  type: 'grocery' | 'detergents' | 'sweets_imported';
  description: string;
  phone: string;
  address: string;
  color: string;
  currency: string;
  taxNumber: string;
  receiptFooter: string;
}

export interface User {
  id: string;
  username: string;
  pin: string;
  name: string;
  role: 'admin' | 'cashier';
  storeId?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  icon?: string;
  displayOrder: number;
}

export interface SuggestedProduct {
  id: string;
  storeType: 'grocery' | 'detergents' | 'sweets_imported';
  categoryName: string;
  name: string;
  brand: string;
  unit: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  origin?: string;
  description?: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  brand: string;
  barcode: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  expiryDate?: string;
  productionDate?: string;
  batchNumber?: string;
  origin?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  returnsAmount: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  billsCount: number;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  shiftId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'split';
  cashPaid: number;
  cardPaid: number;
  changeAmount: number;
  customerName?: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  storeId: string;
  productsSupplied: string;
  balance: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  storeId: string;
  originalSaleId?: string;
  originalInvoiceNumber?: string;
  shiftId?: string;
  cashierId: string;
  cashierName: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: 'cash' | 'card';
  reason: string;
  restock: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  storeId: string;
  category: 'rent' | 'electricity' | 'water' | 'salaries' | 'transport' | 'maintenance' | 'other';
  categoryLabel: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface DailyClosing {
  id: string;
  storeId: string;
  date: string;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalReturns: number;
  totalExpenses: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  shiftsCount: number;
  openShiftsCount: number;
  totalDifference: number;
  closedBy: string;
  createdAt: string;
  status: 'closed';
  notes?: string;
}

export interface Promotion {
  id: string;
  storeId: string;
  title: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  targetType: 'all' | 'category' | 'product';
  targetId?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface TransferRecord {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  productName: string;
  quantity: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface DashboardSummary {
  todaySales: number;
  monthSales: number;
  todayExpenses: number;
  monthExpenses: number;
  todayReturns: number;
  netMonthProfit: number;
  totalBillsToday: number;
  productsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  openShifts: number;
  closedShifts: number;
  storesComparison: {
    id: string;
    name: string;
    type: string;
    color: string;
    totalSales: number;
    expenses: number;
    profit: number;
    productsCount: number;
  }[];
}
