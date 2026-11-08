import {
  Store,
  User,
  Category,
  Product,
  SuggestedProduct,
  Shift,
  Sale,
  ReturnRecord,
  Expense,
  DailyClosing,
  Supplier,
  Purchase,
  Promotion,
  DashboardSummary,
  InventoryMovement,
  TransferRecord,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  }
  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username?: string; pin: string }) =>
    fetchJson<{ user: User; store: Store | null; activeShift: Shift | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getUsers: () => fetchJson<User[]>('/api/auth/users'),
  createUser: (data: Partial<User>) =>
    fetchJson<User>('/api/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Partial<User>) =>
    fetchJson<User>(`/api/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Stores
  getStores: () => fetchJson<Store[]>('/api/stores'),
  updateStore: (id: string, data: Partial<Store>) =>
    fetchJson<Store>(`/api/stores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Categories
  getCategories: (storeId?: string) =>
    fetchJson<Category[]>(`/api/categories${storeId ? `?storeId=${storeId}` : ''}`),
  createCategory: (data: { storeId: string; name: string; icon?: string }) =>
    fetchJson<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params?: { storeId?: string; search?: string; categoryId?: string; lowStock?: boolean; expiringSoon?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.storeId) q.set('storeId', params.storeId);
    if (params?.search) q.set('search', params.search);
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.lowStock) q.set('lowStock', 'true');
    if (params?.expiringSoon) q.set('expiringSoon', 'true');
    return fetchJson<Product[]>(`/api/products?${q.toString()}`);
  },
  createProduct: (data: any) =>
    fetchJson<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    fetchJson<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),

  // Suggested Catalog
  getSuggestedProducts: (params?: { storeType?: string; categoryName?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.storeType) q.set('storeType', params.storeType);
    if (params?.categoryName) q.set('categoryName', params.categoryName);
    if (params?.search) q.set('search', params.search);
    return fetchJson<SuggestedProduct[]>(`/api/products/suggested?${q.toString()}`);
  },
  adoptSuggestedProduct: (data: any) =>
    fetchJson<Product>('/api/products/adopt-suggested', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory Adjustments & Transfers
  adjustInventory: (data: { productId: string; actualCount: number; reason: string; userId?: string; userName?: string }) =>
    fetchJson<{ success: boolean; product: Product; diff: number }>('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transferInventory: (data: { fromStoreId: string; toStoreId: string; productId: string; quantity: number; notes?: string; userId?: string; userName?: string }) =>
    fetchJson<{ success: boolean; transfer: TransferRecord }>('/api/inventory/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInventoryMovements: (params?: { storeId?: string; productId?: string }) => {
    const q = new URLSearchParams();
    if (params?.storeId) q.set('storeId', params.storeId);
    if (params?.productId) q.set('productId', params.productId);
    return fetchJson<InventoryMovement[]>(`/api/inventory/movements?${q.toString()}`);
  },

  // Shifts & Drawer
  getActiveShift: (cashierId?: string, storeId?: string) => {
    const q = new URLSearchParams();
    if (cashierId) q.set('cashierId', cashierId);
    if (storeId) q.set('storeId', storeId);
    return fetchJson<Shift | null>(`/api/shifts/active?${q.toString()}`);
  },
  openShift: (data: { storeId: string; cashierId: string; cashierName: string; openingFloat: number; notes?: string }) =>
    fetchJson<Shift>('/api/shifts/open', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data: { shiftId: string; actualCash: number; notes?: string; userId?: string; userName?: string }) =>
    fetchJson<{ success: boolean; shift: Shift }>('/api/shifts/close', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  shiftCashMovement: (data: { shiftId: string; type: 'in' | 'out'; amount: number; reason: string; userId?: string; userName?: string }) =>
    fetchJson<{ success: boolean; shift: Shift }>('/api/shifts/movement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getShiftsHistory: (params?: { storeId?: string; cashierId?: string }) => {
    const q = new URLSearchParams();
    if (params?.storeId) q.set('storeId', params.storeId);
    if (params?.cashierId) q.set('cashierId', params.cashierId);
    return fetchJson<Shift[]>(`/api/shifts/history?${q.toString()}`);
  },

  // Sales & POS
  createSale: (data: any) =>
    fetchJson<{ success: boolean; sale: Sale; store: Store }>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSales: (params?: { storeId?: string; shiftId?: string; date?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.storeId) q.set('storeId', params.storeId);
    if (params?.shiftId) q.set('shiftId', params.shiftId);
    if (params?.date) q.set('date', params.date);
    if (params?.limit) q.set('limit', params.limit.toString());
    return fetchJson<Sale[]>(`/api/sales?${q.toString()}`);
  },
  getSale: (id: string) => fetchJson<{ sale: Sale; store: Store }>(`/api/sales/${id}`),

  // Returns
  createReturn: (data: any) =>
    fetchJson<{ success: boolean; returnRecord: ReturnRecord }>('/api/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getReturns: (storeId?: string) =>
    fetchJson<ReturnRecord[]>(`/api/returns${storeId ? `?storeId=${storeId}` : ''}`),

  // Purchases & Suppliers
  getSuppliers: (storeId?: string) =>
    fetchJson<Supplier[]>(`/api/suppliers${storeId ? `?storeId=${storeId}` : ''}`),
  createSupplier: (data: any) =>
    fetchJson<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getPurchases: (storeId?: string) =>
    fetchJson<Purchase[]>(`/api/purchases${storeId ? `?storeId=${storeId}` : ''}`),
  createPurchase: (data: any) =>
    fetchJson<{ success: boolean; purchase: Purchase }>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: (params?: { storeId?: string; month?: string }) => {
    const q = new URLSearchParams();
    if (params?.storeId) q.set('storeId', params.storeId);
    if (params?.month) q.set('month', params.month);
    return fetchJson<Expense[]>(`/api/expenses?${q.toString()}`);
  },
  createExpense: (data: any) =>
    fetchJson<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Daily Closings
  getDailyClosings: (storeId?: string) =>
    fetchJson<DailyClosing[]>(`/api/daily-closings${storeId ? `?storeId=${storeId}` : ''}`),
  createDailyClosing: (data: { storeId: string; date?: string; forceClose?: boolean; userId?: string; userName?: string; notes?: string }) =>
    fetchJson<{ success: boolean; closing: DailyClosing }>('/api/daily-closings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Promotions
  getPromotions: (storeId?: string) =>
    fetchJson<Promotion[]>(`/api/promotions${storeId ? `?storeId=${storeId}` : ''}`),
  createPromotion: (data: any) =>
    fetchJson<Promotion>('/api/promotions', { method: 'POST', body: JSON.stringify(data) }),
  togglePromotion: (id: string) =>
    fetchJson<Promotion>(`/api/promotions/${id}/toggle`, { method: 'PATCH' }),

  // Reports Summary
  getDashboardSummary: (storeId?: string) =>
    fetchJson<DashboardSummary>(`/api/reports/summary${storeId ? `?storeId=${storeId}` : ''}`),

  // Gemini AI Features
  textToSpeech: (text: string, voice?: string) =>
    fetchJson<{ success: boolean; audioBase64?: string; mimeType?: string; fallback?: boolean; text?: string }>('/api/ai/tts', {
      method: 'POST',
      body: JSON.stringify({ text, voice }),
    }),
  searchMarketPrice: (query: string) =>
    fetchJson<{ answer: string; sources: any[] }>('/api/ai/market-price', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  analyzeImage: (imageBase64: string, task: 'receipt' | 'product', mimeType?: string) =>
    fetchJson<{ success: boolean; data: any }>('/api/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, task, mimeType }),
    }),
};
