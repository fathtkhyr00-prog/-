import React from 'react';
import {
  LayoutDashboard,
  Store as StoreIcon,
  Package,
  Layers,
  Boxes,
  PlusCircle,
  Receipt,
  Clock,
  CalendarCheck2,
  ShoppingCart,
  Users,
  Undo2,
  Wallet,
  Tag,
  UserCheck,
  BarChart3,
  Sparkles,
  Bot,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'stores'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'smart_add'
  | 'sales'
  | 'shifts'
  | 'daily_closing'
  | 'purchases'
  | 'suppliers'
  | 'returns'
  | 'expenses'
  | 'promotions'
  | 'users'
  | 'reports'
  | 'ai_tools';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lowStockCount?: number;
  openShiftsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount = 0,
  openShiftsCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'stores', label: 'المحلات والفروع والتحويلات', icon: StoreIcon },
    {
      id: 'products',
      label: 'المنتجات والأسعار',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} ناقص` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'categories', label: 'الأقسام والتصنيفات', icon: Layers },
    { id: 'smart_add', label: 'إضافة المنتجات والكتالوج الذكي', icon: PlusCircle, isHighlight: true },
    { id: 'inventory', label: 'المخازن والتسوية والجرد', icon: Boxes },
    { id: 'sales', label: 'سجل المبيعات والفواتير', icon: Receipt },
    {
      id: 'shifts',
      label: 'الورديات وجرد الكاشير',
      icon: Clock,
      badge: openShiftsCount > 0 ? `${openShiftsCount} نشطة` : undefined,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    { id: 'daily_closing', label: 'إغلاق اليومية', icon: CalendarCheck2 },
    { id: 'purchases', label: 'المشتريات وفواتير الوارد', icon: ShoppingCart },
    { id: 'suppliers', label: 'دليل الموردين', icon: Users },
    { id: 'returns', label: 'سجل المرتجعات', icon: Undo2 },
    { id: 'expenses', label: 'المصروفات والأرباح', icon: Wallet },
    { id: 'promotions', label: 'العروض والخصومات', icon: Tag },
    { id: 'users', label: 'المستخدمون والكاشيرات', icon: UserCheck },
    { id: 'reports', label: 'التقارير المالية والمقارنات', icon: BarChart3 },
    { id: 'ai_tools', label: 'أدوات الذكاء الاصطناعي', icon: Bot, isHighlight: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-l border-slate-800 select-none overflow-y-auto">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">
            لوحة الإدارة المركزية
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">إدارة ٣ فروع متكاملة</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : item.isHighlight
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-teal-300 border border-teal-500/20'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isHighlight ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="leading-tight">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer system status */}
      <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
        <span>قاعدة البيانات نشطة • خادم متصل</span>
      </div>
    </aside>
  );
};
