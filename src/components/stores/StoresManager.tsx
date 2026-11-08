import React, { useState, useEffect } from 'react';
import { Store, Category } from '../../types';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';
import {
  Store as StoreIcon,
  Layers,
  Edit2,
  CheckCircle,
  Plus,
  Phone,
  MapPin,
  Receipt,
  Building,
} from 'lucide-react';

interface StoresManagerProps {
  stores: Store[];
  onStoresUpdated: () => void;
}

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores,
  onStoresUpdated,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store>(stores[0]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Category addition
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories(selectedStore.id);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [selectedStore.id]);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    try {
      await api.updateStore(editingStore.id, {
        name: editingStore.name,
        phone: editingStore.phone,
        address: editingStore.address,
        taxNumber: editingStore.taxNumber,
        receiptFooter: editingStore.receiptFooter,
      });

      setStatusMsg(`تم حفظ إعدادات ${editingStore.name} بنجاح`);
      setEditingStore(null);
      onStoresUpdated();
      toast('تم حفظ إعدادات المحل بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل حفظ الإعدادات', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.createCategory({
        storeId: selectedStore.id,
        name: newCatName.trim(),
      });

      setStatusMsg(`تمت إضافة القسم "${newCatName}" إلى ${selectedStore.name}`);
      setNewCatName('');
      setShowAddCategory(false);
      loadCategories();
      toast('تمت إضافة القسم بنجاح', 'success');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      toast(err.message || 'فشل إضافة القسم', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-teal-600" />
            <span>إعدادات المحلات والفروع والأقسام</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بيانات الفروع الثلاثة، أرقام التواصل والضرائب، نصوص الفواتير، وهيكل الأقسام والتصنيفات.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Stores Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stores.map(st => (
          <div
            key={st.id}
            onClick={() => setSelectedStore(st)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden shadow-xs ${
              selectedStore.id === st.id
                ? 'bg-white border-teal-500 ring-2 ring-teal-500/20'
                : 'bg-slate-50/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: st.color }} />
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-sm text-slate-900">{st.name}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditingStore({ ...st });
                }}
                className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="تعديل الإعدادات والفاتورة"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{st.description}</p>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{st.address}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{st.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Categories of Selected Store */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>أقسام وتصنيفات: {selectedStore.name} ({categories.length} قسم)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">تظهر هذه الأقسام للكاشير في شاشة الـ POS وفي فرز الأصناف</p>
          </div>

          <button
            onClick={() => setShowAddCategory(true)}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between group hover:bg-teal-50 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">{idx + 1}</span>
                <span>{cat.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Store Settings Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">تعديل إعدادات وبيانات المحل</h2>
            <form onSubmit={handleSaveStoreSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المحل التجاري:</label>
                <input
                  type="text"
                  value={editingStore.name}
                  onChange={e => setEditingStore({ ...editingStore, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={editingStore.phone}
                    onChange={e => setEditingStore({ ...editingStore, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السجل التجاري / الضريبي:</label>
                  <input
                    type="text"
                    value={editingStore.taxNumber}
                    onChange={e => setEditingStore({ ...editingStore, taxNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان والفرع:</label>
                <input
                  type="text"
                  value={editingStore.address}
                  onChange={e => setEditingStore({ ...editingStore, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص تذييل الفاتورة والإيصال:</label>
                <textarea
                  rows={2}
                  value={editingStore.receiptFooter}
                  onChange={e => setEditingStore({ ...editingStore, receiptFooter: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-3">إضافة قسم جديد لـ {selectedStore.name}</h2>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم / التصنيف:</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="مثال: البسكويت والشوكولاتة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
