import React, { useRef } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  CalendarCheck, 
  Contact, 
  LayoutGrid,
  ChevronDown,
  Eye,
  EyeOff,
  ChevronLeft,
  Menu,
  User as UserIcon,
  UserCheck,
  BookOpen,
  FilterX,
  Zap,
  ClipboardList,
  Bell,
  Image as ImageIcon,
  Trash2,
  FileText
} from 'lucide-react';
import { Tab, UserRole, AppSettings, ViewMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  role: UserRole;
  onContactsOpen: () => void;
  filters: any;
  setFilters: (f: any) => void;
  uniqueTeachers: string[];
  uniqueAssistants: string[];
  uniqueTimes: string[];
  uniqueLevels?: string[];
  uniqueBehaviors?: string[];
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  globalScale: number;
  setGlobalScale: (s: number) => void;
  settings?: AppSettings;
  onUpdateSettings?: (s: AppSettings) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen,
  activeTab, 
  setActiveTab, 
  onLogout, 
  role,
  onContactsOpen,
  filters,
  setFilters,
  uniqueTeachers,
  uniqueAssistants,
  uniqueLevels = [],
  settings,
  onUpdateSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleTabSelect = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateSettings) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateSettings({
          ...(settings || { fontSize: 12, fontFamily: "'Inter', sans-serif" }),
          backgroundImage: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        ...(settings || { fontSize: 12, fontFamily: "'Inter', sans-serif" }),
        backgroundImage: undefined
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      ...filters,
      teacher: '',
      assistant: '',
      time: '',
      level: '',
      behavior: '',
      searchQuery: '',
      deadline: '',
      showHidden: false
    });
  };

  const navItems = [
    { id: Tab.Hall, icon: LayoutGrid, label: 'Hall Study', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Penalty, icon: Zap, label: 'Late/Absence Log', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.DailyTask, icon: ClipboardList, label: 'Daily Task', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Reminder, icon: Bell, label: 'Reminder', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Attendance, icon: CalendarCheck, label: 'Attendance', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.DPSS, icon: FileText, label: 'DPSS', roles: ['Admin', 'Teacher', 'Finance'] },
  ];

  const filterSelectStyle = "w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-[11px] text-slate-900 font-black outline-none transition-all cursor-pointer appearance-none hover:bg-white/20 focus:ring-4 focus:ring-primary-500/10 backdrop-blur-md";
  const labelStyle = "text-[10px] font-black text-slate-800 mb-2 flex items-center gap-2 ml-1 tracking-[3px]";

  return (
    <>
      {/* Re-open button when hidden */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[60] w-12 h-12 bg-white text-[#1B254B] rounded-xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-100"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:relative h-full z-50 md:z-40 bg-white/[0.01] backdrop-blur-[1px] border-r border-white/5 text-slate-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-2xl no-print shrink-0 ${
          isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 overflow-hidden'
        }`}
      >
        {/* Branding Area with Collapse Toggle */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
              D
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none text-slate-900">DPS Portal</h2>
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1">Clean Management</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white/10 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation & Filters */}
        <div className="flex-1 px-5 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          <nav className="space-y-2">
              {navItems.filter(item => item.roles.includes(role)).map(item => (
                <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all w-full group ${
                      activeTab === item.id 
                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 backdrop-blur-[4px]' 
                        : 'text-slate-600 hover:text-orange-600 hover:bg-white/[0.05]'
                    }`}
                >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
                    <span className="text-[11px] font-black tracking-widest">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-6 px-1">
                  <p className="text-[10px] font-black text-orange-600 tracking-[3px]">Advanced Filters</p>
                  <button onClick={resetFilters} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                      <FilterX size={14} />
                  </button>
              </div>
              
              <div className="space-y-5 px-1">
                  <div>
                    <label className={labelStyle}><UserIcon size={12}/> Teacher</label>
                    <div className="relative">
                        <select value={filters.teacher} onChange={e => updateFilter('teacher', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Teachers</option>
                            {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}><UserCheck size={12}/> Assistant</label>
                    <div className="relative">
                        <select value={filters.assistant} onChange={e => updateFilter('assistant', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Assistants</option>
                            {uniqueAssistants.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}><BookOpen size={12}/> Level</label>
                    <div className="relative">
                        <select value={filters.level} onChange={e => updateFilter('level', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Levels</option>
                            {uniqueLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <button 
                      onClick={() => updateFilter('showHidden', !filters.showHidden)}
                      className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all text-[10px] font-black uppercase tracking-[2px] border ${filters.showHidden ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                      {filters.showHidden ? <Eye size={16}/> : <EyeOff size={16}/>}
                      {filters.showHidden ? 'Hidden Records Visible' : 'Show Hidden Records'}
                  </button>
              </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 bg-white/[0.03] border-t border-white/5 space-y-2 no-print shrink-0 backdrop-blur-[2px]">
          <div className="px-2 pb-2">
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3">Customization</p>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/10 border border-white/20 rounded-xl text-slate-800 hover:text-orange-600 hover:border-orange-200 transition-all text-[9px] font-black uppercase"
              >
                <ImageIcon size={14} /> Background
              </button>
              <input type="file" ref={fileInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
              {settings?.backgroundImage && (
                <button onClick={removeBackground} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={onContactsOpen}
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/10 transition-all w-full"
          >
            <Contact size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Staff Contacts</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-slate-600 hover:text-red-500 hover:bg-red-50/10 transition-all w-full"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
