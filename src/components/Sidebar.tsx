import React from 'react';
import {
  Sliders,
  LayoutDashboard,
  Layers,
  TrendingUp,
  DollarSign,
  Copy,
  Table,
  Calculator,
  X,
  Package,
} from 'lucide-react';

export type TabId =
  | 'parameters'
  | 'overview'
  | 'policies'
  | 'chart'
  | 'costs'
  | 'scenarios'
  | 'dailylog'
  | 'formulas';

interface TabItem {
  id: TabId;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TABS: TabItem[] = [
  {
    id: 'parameters',
    label: 'Parameters',
    shortDesc: 'Simulation inputs & controls',
    icon: Sliders,
  },
  {
    id: 'overview',
    label: 'Overview',
    shortDesc: 'Best policy & key KPIs',
    icon: LayoutDashboard,
  },
  {
    id: 'policies',
    label: 'Policy Comparison',
    shortDesc: '3 policies side by side',
    icon: Layers,
  },
  {
    id: 'chart',
    label: 'Inventory Chart',
    shortDesc: 'Trajectory & buffer levels',
    icon: TrendingUp,
  },
  {
    id: 'costs',
    label: 'Cost Breakdown',
    shortDesc: 'Ordering vs holding spend',
    icon: DollarSign,
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    shortDesc: 'Compare up to 3 runs',
    icon: Copy,
  },
  {
    id: 'dailylog',
    label: 'Daily Log',
    shortDesc: 'Daily simulation data & CSV',
    icon: Table,
  },
  {
    id: 'formulas',
    label: 'Formulas',
    shortDesc: 'Operations research equations',
    icon: Calculator,
  },
];

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleTabClick = (tabId: TabId) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar: Starts directly below the header with 0 gap, fixed on desktop, scrollable */}
      <aside
        className={`fixed md:static inset-y-0 md:inset-y-auto left-0 z-50 md:z-auto h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Mobile-only Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Navigation Menu
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation List: Clean, starts at the top, scrollable, no extra items below Formulas */}
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto pb-6">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Simulator Views
          </div>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate leading-tight">{tab.label}</div>
                  <div
                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {tab.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
