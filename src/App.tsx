import React, { useState, useEffect } from 'react';
import { User, Store, Shift, DashboardSummary } from './types';
import { api } from './services/api';
import { LoginScreen } from './components/auth/LoginScreen';
import { PosScreen } from './components/pos/PosScreen';
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { ProductsManager } from './components/products/ProductsManager';
import { SmartProductAddModal } from './components/products/SmartProductAddModal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ShiftsManager } from './components/shifts/ShiftsManager';
import { DailyClosingManager } from './components/dailyClosing/DailyClosingManager';
import { PurchasesManager } from './components/purchases/PurchasesManager';
import { ExpensesManager } from './components/expenses/ExpensesManager';
import { SalesHistory } from './components/sales/SalesHistory';
import { ReturnsManager } from './components/returns/ReturnsManager';
import { PromotionsManager } from './components/promotions/PromotionsManager';
import { UsersManager } from './components/users/UsersManager';
import { FinancialReports } from './components/reports/FinancialReports';
import { AiToolsPanel } from './components/ai/AiToolsPanel';
import { StoresManager } from './components/stores/StoresManager';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  // Admin ERP State
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [showSmartAddModal, setShowSmartAddModal] = useState(false);

  // Load stores list
  const loadStores = async () => {
    try {
      const storeList = await api.getStores();
      setStores(storeList);
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };

  const loadSummary = async () => {
    try {
      const sum = await api.getDashboardSummary(selectedStoreId);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSummary();
    }
  }, [user, selectedStoreId]);

  // Handle Login Success
  const handleLoginSuccess = (loggedInUser: User, assignedStore: Store | null, shift: Shift | null) => {
    setUser(loggedInUser);
    setActiveStore(assignedStore);
    setActiveShift(shift);
    if (assignedStore) {
      setSelectedStoreId(assignedStore.id);
    } else {
      setSelectedStoreId('all');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveStore(null);
    setActiveShift(null);
    setCurrentTab('dashboard');
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 1. CASHIER INTERFACE: STRICT FULL SCREEN POS LOCK
  // "عند دخول الكاشير تظهر له شاشة المبيعات فقط. لا تظهر له لوحة الإدارة أو القائمة الجانبية الخاصة بالإدارة."
  if (user.role === 'cashier') {
    const cashierStore = stores.find(s => s.id === user.storeId) || activeStore;
    if (!cashierStore) {
      return (
        <div className="h-screen flex items-center justify-center p-6 text-center text-slate-800">
          <div>
            <p className="font-bold text-base text-red-600 mb-2">تنبيه: لم يتم تعيين فرع تجاري لحساب هذا الكاشير</p>
            <p className="text-xs text-slate-500 mb-4">يرجى من المدير العام تعيين الفرع المناسب في شاشة المستخدمين.</p>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      );
    }

    return (
      <PosScreen
        user={user}
        store={cashierStore}
        activeShift={activeShift}
        onLogout={handleLogout}
        onShiftChange={shift => setActiveShift(shift)}
      />
    );
  }

  // 2. ADMINISTRATOR INTERFACE: FULL ERP DASHBOARD ACROSS 3 STORES
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Cairo',sans-serif] text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={user}
        stores={stores}
        selectedStoreId={selectedStoreId}
        onSelectStore={id => setSelectedStoreId(id)}
        onLogout={handleLogout}
        onRefreshData={() => {
          loadStores();
          loadSummary();
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            if (tab === 'smart_add') {
              setShowSmartAddModal(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          lowStockCount={summary?.lowStockCount || 0}
          openShiftsCount={summary?.openShifts || 0}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <OverviewDashboard
              selectedStoreId={selectedStoreId}
              stores={stores}
              onNavigateTab={tab => {
                if (tab === 'smart_add') {
                  setShowSmartAddModal(true);
                } else {
                  setCurrentTab(tab);
                }
              }}
            />
          )}

          {currentTab === 'stores' && (
            <StoresManager
              stores={stores}
              onStoresUpdated={loadStores}
            />
          )}

          {currentTab === 'products' && (
            <ProductsManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'categories' && (
            <StoresManager
              stores={stores}
              onStoresUpdated={loadStores}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'sales' && (
            <SalesHistory
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'shifts' && (
            <ShiftsManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'daily_closing' && (
            <DailyClosingManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'purchases' && (
            <PurchasesManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'suppliers' && (
            <PurchasesManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'returns' && (
            <ReturnsManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'promotions' && (
            <PromotionsManager
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'users' && (
            <UsersManager stores={stores} />
          )}

          {currentTab === 'reports' && (
            <FinancialReports
              stores={stores}
              selectedStoreId={selectedStoreId}
            />
          )}

          {currentTab === 'ai_tools' && (
            <AiToolsPanel />
          )}
        </main>
      </div>

      {/* Smart Product Add Modal (accessible from sidebar or dashboard) */}
      {showSmartAddModal && (
        <SmartProductAddModal
          stores={stores}
          defaultStoreId={selectedStoreId}
          onClose={() => setShowSmartAddModal(false)}
          onProductAdded={() => {
            loadSummary();
            loadStores();
          }}
        />
      )}
    </div>
  );
}
