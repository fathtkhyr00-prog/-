import React, { useState, useEffect } from 'react';
import { Store, Product, Category } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Filter,
  Package,
  Barcode,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SmartProductAddModal } from './SmartProductAddModal';

interface ProductsManagerProps {
  stores: Store[];
  selectedStoreId: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  stores,
  selectedStoreId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number>(5);
  const [editBarcode, setEditBarcode] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        api.getProducts({ storeId: selectedStoreId }),
        api.getCategories(selectedStoreId === 'all' ? undefined : selectedStoreId),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  // Open Edit modal
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.sellingPrice);
    setEditCost(p.costPrice);
    setEditMinStock(p.minStockAlert);
    setEditBarcode(p.barcode);
    setEditExpiry(p.expiryDate || '');
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        sellingPrice: editPrice,
        costPrice: editCost,
        minStockAlert: editMinStock,
        barcode: editBarcode,
        expiryDate: editExpiry || undefined,
      });
      setEditingProduct(null);
      loadData();
      toast('تم تعديل بيانات المنتج بنجاح', 'success');
    } catch (err: any) {
      toast(err.message || 'فشل تعديل المنتج', 'error');
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`)) return;
    try {
      await api.deleteProduct(p.id);
      loadData();
      toast('تم حذف المنتج بنجاح', 'success');
    } catch (err: any) {
      toast(err.message || 'فشل حذف المنتج', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['اسم المنتج', 'المحل', 'الباركود', 'سعر الشراء', 'سعر البيع', 'المخزون الحالي', 'الحد الأدنى', 'الصلاحية'];
    const rows = filteredProducts.map(p => {
      const st = stores.find(s => s.id === p.storeId);
      return [
        `"${p.name}"`,
        `"${st?.name || ''}"`,
        `"${p.barcode}"`,
        p.costPrice,
        p.sellingPrice,
        p.currentStock,
        p.minStockAlert,
        p.expiryDate || 'غير محدد',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قائمة_منتجات_المتاجر_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const filteredProducts = products.filter(p => {
    if (filterType === 'low' && (p.currentStock > p.minStockAlert || p.currentStock <= 0)) return false;
    if (filterType === 'out' && p.currentStock > 0) return false;
    if (filterType === 'expiring' && (!p.expiryDate || p.expiryDate > nextWeek)) return false;

    if (!search) return true;
    const q = search.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.brand.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <span>إدارة المنتجات والأسعار والمخزون</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            قاعدة بيانات الأصناف والباركودات، تعديل أسعار البيع والتكلفة، وتنبيهات النواقص.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الماركة، أو امسح الباركود..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              الكل ({products.length})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              أوشك على النفاد ({products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockAlert).length})
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              نافد ({products.filter(p => p.currentStock <= 0).length})
            </button>
            <button
              onClick={() => setFilterType('expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'expiring'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
              }`}
            >
              قريب الصلاحية ({products.filter(p => p.expiryDate && p.expiryDate <= nextWeek).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل المنتجات...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">لا توجد منتجات مطابقة للبحث أو الفلتر</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">اسم المنتج</th>
                  <th className="py-3 px-4">المحل والفرع</th>
                  <th className="py-3 px-4">الباركود</th>
                  <th className="py-3 px-4">سعر الشراء</th>
                  <th className="py-3 px-4">سعر البيع</th>
                  <th className="py-3 px-4">هامش الربح</th>
                  <th className="py-3 px-4">المخزون الحالي</th>
                  <th className="py-3 px-4">تاريخ الصلاحية</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(prod => {
                  const st = stores.find(s => s.id === prod.storeId);
                  const profitMargin = prod.sellingPrice - prod.costPrice;
                  const profitPercent = prod.costPrice > 0 ? ((profitMargin / prod.costPrice) * 100).toFixed(0) : '0';
                  const isOutOfStock = prod.currentStock <= 0;
                  const isLowStock = prod.currentStock <= prod.minStockAlert && !isOutOfStock;
                  const isExpiring = prod.expiryDate && prod.expiryDate <= nextWeek;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">{prod.brand} • {prod.unit}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white whitespace-nowrap"
                          style={{ backgroundColor: st?.color || '#0d9488' }}
                        >
                          {st?.name.split(' ')[1] || 'المحل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {prod.barcode}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {prod.costPrice.toFixed(2)} ج.م
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {prod.sellingPrice.toFixed(2)} ج.م
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                        +{profitMargin.toFixed(1)} ج.م ({profitPercent}%)
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold font-mono text-xs ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {prod.expiryDate ? (
                          <span className={isExpiring ? 'text-orange-600 font-bold' : ''}>
                            {prod.expiryDate} {isExpiring && '⚠️'}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="تعديل السعر والباركود"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">تعديل بيانات المنتج</h2>
            <p className="text-xs text-slate-500 mb-4">{editingProduct.name}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الباركود:</label>
                <input
                  type="text"
                  value={editBarcode}
                  onChange={e => setEditBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر الشراء (ج.م):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCost}
                    onChange={e => setEditCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع (ج.م):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editPrice}
                    onChange={e => setEditPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-teal-500 rounded-xl font-mono text-xs font-black text-teal-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد تنبيه النقص:</label>
                  <input
                    type="number"
                    value={editMinStock}
                    onChange={e => setEditMinStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الصلاحية:</label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={e => setEditExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Product Add Modal */}
      {showAddModal && (
        <SmartProductAddModal
          stores={stores}
          defaultStoreId={selectedStoreId}
          onClose={() => setShowAddModal(false)}
          onProductAdded={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
