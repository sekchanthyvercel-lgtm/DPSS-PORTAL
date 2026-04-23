import React, { useState, useMemo } from 'react';
import { Student, AppData, UserRole, StudentCategory } from '../types';
import { format, addDays, getDaysInMonth, startOfMonth } from 'date-fns';
import { 
  Plus, UserCheck, 
  ChevronLeft, ChevronRight, ArrowUpDown, Calendar, Maximize2,
  Trash2, Eye, EyeOff, Zap, Check, AlertCircle
} from 'lucide-react';

interface Props {
  students: Student[];
  data: AppData;
  filters: any;
  setFilters?: (f: any) => void;
  onUpdate: (newData: AppData) => void;
  onAddStudent: (defaults: Partial<Student>) => void;
  onQuickAdd: () => void;
  isLocked?: boolean;
  role?: UserRole;
  onClearCategory?: (cats: StudentCategory[]) => void;
}

// Fixed color mapping based on provided screenshot
const ASSISTANT_COLORS: Record<string, string> = {
  'DALIN': '#EBF5FF', // Light Blue
  'LEAP': '#F0FFF4',  // Light Green
  'VORN': '#FFF5F5',  // Light Red/Pink
  'KHEANG': '#FFF9EB', // Light Orange
};

const getRowBg = (idx: number): string => {
  const colors = [
    'bg-sky-400/5',
    'bg-emerald-400/5',
    'bg-amber-400/5',
    'bg-indigo-400/5',
    'bg-rose-400/5',
    'bg-violet-400/5',
    'bg-teal-400/5',
    'bg-orange-400/5'
  ];
  return colors[idx % colors.length];
};

/**
 * Icons for the Attendance Status based on screenshot: 
 * status 0 is a green solid check box.
 */
const getStatusIcon = (status?: number) => {
  if (status === 0) return (
    <div className="w-8 h-6 bg-[#67B18E] rounded-sm flex items-center justify-center text-white shadow-sm mx-auto">
      <Check size={16} strokeWidth={4} />
    </div>
  );
  if (status === 0.25) return (
    <div className="w-8 h-6 bg-orange-500 rounded-sm flex items-center justify-center text-white shadow-sm mx-auto">
       <span className="text-[10px] font-black">L</span>
    </div>
  );
  if (status === 1) return (
    <div className="w-8 h-6 bg-red-500 rounded-sm flex items-center justify-center text-white shadow-sm mx-auto">
       <span className="text-[10px] font-black">A</span>
    </div>
  );
  return (
    <div className="w-8 h-6 border-2 border-slate-200 rounded-sm mx-auto bg-white/20"></div>
  );
};

export const AttendanceTable: React.FC<Props> = ({ 
  students, data, filters, onUpdate, onAddStudent, isLocked = false, role, onClearCategory
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const monthKey = format(viewDate, 'yyyy-MM');
  const daysInMonth = getDaysInMonth(viewDate);
  const dayDisplay = format(viewDate, 'd');

  /**
   * Fixes: Error in file components/AttendanceTable.tsx on line 133: Cannot find name 'handleSort'.
   */
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      const query = filters.searchQuery?.toLowerCase() || '';
      const matchesSearch = !query || 
        s.name.toLowerCase().includes(query) ||
        (s.assistant && s.assistant.toLowerCase().includes(query)) ||
        (s.teachers && s.teachers.toLowerCase().includes(query));

      return (s.category === 'Class' || s.category === 'Hall') && 
        (filters.showHidden || !s.isHidden) && 
        matchesSearch && 
        (!filters.teacher || (s.teachers && s.teachers.toUpperCase().includes(filters.teacher.toUpperCase()))) && 
        (!filters.assistant || (s.assistant && s.assistant.toUpperCase().includes(filters.assistant.toUpperCase()))) && 
        (!filters.level || (s.level && s.level.toUpperCase() === filters.level.toUpperCase()));
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let valA = String((a as any)[sortConfig.key] || '').toLowerCase();
        let valB = String((b as any)[sortConfig.key] || '').toLowerCase();
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    } else {
      result.sort((a, b) => a.order - b.order);
    }
    return result;
  }, [students, filters, sortConfig]);

  const cycleStatus = (studentId: string, day: number) => {
    if (isLocked) return;
    const dayKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    const newAttendance = { ...data.attendance };
    const studentRecord = { ...(newAttendance[studentId] || {}) };
    const cur = studentRecord[dayKey];
    
    let next: number | undefined;
    if (cur === undefined) next = 0; // Present
    else if (cur === 0) next = 0.25; // Late
    else if (cur === 0.25) next = 1; // Absent
    else next = undefined; // Reset

    if (next === undefined) {
      delete studentRecord[dayKey];
    } else {
      studentRecord[dayKey] = next;
    }
    
    newAttendance[studentId] = studentRecord;
    onUpdate({ ...data, attendance: newAttendance });
  };

  const markAllPresent = () => {
    if (isLocked) return;
    const dayKey = `${monthKey}-${String(viewDate.getDate()).padStart(2, '0')}`;
    const newAttendance = { ...data.attendance };
    filteredStudents.forEach(s => {
      const studentRecord = { ...(newAttendance[s.id] || {}) };
      studentRecord[dayKey] = 0;
      newAttendance[s.id] = studentRecord;
    });
    onUpdate({ ...data, attendance: newAttendance });
  };

  const Th = ({ label, colId, width, stickyLeft }: { label: string, colId: string, width?: number, stickyLeft?: number }) => (
    <th 
      onClick={() => handleSort(colId)}
      className={`px-4 py-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors group ${stickyLeft !== undefined ? 'sticky z-20 bg-inherit' : ''}`}
      style={{ width, left: stickyLeft }}
    >
      <div className="flex items-center justify-between">
        {label}
        <ArrowUpDown size={10} className={`${sortConfig?.key === colId ? 'opacity-100 text-primary-500' : 'opacity-20 group-hover:opacity-100'} transition-opacity`} />
      </div>
    </th>
  );

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden p-2 md:p-6 lg:p-8">
      {/* Table Header UI */}
      <div className="bg-white/[0.02] backdrop-blur-[2px] rounded-[32px] p-6 mb-6 flex items-center justify-between shadow-2xl shadow-indigo-900/10 border border-white/5 flex-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
            <UserCheck size={24} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1B254B] uppercase tracking-tighter leading-none">Attendance Log</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-[2px]">{format(viewDate, 'MMMM yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mx-4 shrink-0">
          <div className="flex items-center bg-[#F4F7FE] p-1 rounded-xl border border-slate-200">
            <button onClick={() => setViewDate(d => addDays(d, -1))} className="p-1.5 text-slate-500 hover:text-primary-500 transition-colors"><ChevronLeft size={18}/></button>
            <span className="px-5 text-[11px] font-black text-[#1B254B] uppercase tracking-[2px] min-w-[80px] text-center">
                {format(viewDate, 'MMM d').toUpperCase()}
            </span>
            <button onClick={() => setViewDate(d => addDays(d, 1))} className="p-1.5 text-slate-500 hover:text-primary-500 transition-colors"><ChevronRight size={18}/></button>
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary-500 transition-all shadow-sm">
            <Calendar size={18} />
          </button>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary-500 transition-all shadow-sm">
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            disabled={isLocked}
            onClick={markAllPresent}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all h-11 ${!isLocked ? 'bg-[#F4F7FE] text-slate-300 border border-slate-100 hover:bg-slate-200' : 'opacity-30'}`}
          >
            <Zap size={14} /> Mark All Present
          </button>
          
          {role === 'Admin' && (
            <button 
              onClick={() => onClearCategory?.(['Class'])}
              title="CLEAR ALL CLASS RECORDS"
              className="w-11 h-11 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all"
            >
              <AlertCircle size={20} />
            </button>
          )}

          <button 
            onClick={() => onAddStudent({ category: 'Class' })}
            className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={4} />
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="flex-1 bg-white/[0.02] backdrop-blur-[2px] rounded-[40px] shadow-2xl shadow-indigo-900/10 border border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full border-collapse table-fixed min-w-[1200px]">
            <thead className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-[2px] border-b border-white/5">
              <tr>
                <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-900 w-12 border-r border-white/5 sticky left-0 z-50 bg-white/[0.02] backdrop-blur-[2px]">#</th>
                <Th label="Student Name" colId="name" width={220} stickyLeft={48} />
                <Th label="Teacher" colId="teachers" width={160} />
                <Th label="Level" colId="level" width={100} />
                <Th label="Time" colId="time" width={140} />
                <Th label="Assistant" colId="assistant" width={150} />
                
                {/* Numeric Date Columns */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                   <th 
                    key={day}
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                    className={`text-center text-[10px] font-black w-12 border-r border-slate-100 cursor-pointer transition-colors ${parseInt(dayDisplay) === day ? 'bg-orange-50/50 text-orange-600 border-b-2 border-b-orange-400' : 'text-slate-400 hover:bg-slate-50'}`}
                   >
                     {day}
                   </th>
                ))}
                
                <th className="px-4 py-4 text-center text-[10px] font-black uppercase text-slate-400 w-24 sticky right-0 z-50 bg-[#F8FAFC] border-l border-slate-100 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => {
                const rowBgClass = getRowBg(idx);
                const isHidden = s.isHidden;

                return (
                  <tr 
                    key={s.id} 
                    className={`group transition-all hover:brightness-95 h-12 ${isHidden ? 'bg-slate-50' : rowBgClass}`}
                  >
                    <td className="px-4 text-center text-xs font-black text-slate-400 border-r border-slate-200/10 sticky left-0 z-30 bg-inherit">{idx + 1}</td>
                    <td className="px-5 border-r border-slate-200/10 sticky left-[48px] z-30 bg-inherit shadow-sm">
                      <div className={`text-[12px] font-black text-[#1B254B] uppercase tracking-tight truncate ${isHidden ? 'opacity-30' : ''}`}>{s.name}</div>
                    </td>
                    <td className="px-4 border-r border-slate-200/10">
                      <div className={`text-[11px] font-bold text-slate-500 uppercase truncate ${isHidden ? 'opacity-30' : ''}`}>{s.teachers || 'N/A'}</div>
                    </td>
                    <td className="px-4 border-r border-slate-200/10 text-center">
                      <div className={`text-[11px] font-black text-slate-600 uppercase ${isHidden ? 'opacity-30' : ''}`}>{s.level || 'N/A'}</div>
                    </td>
                    <td className="px-4 border-r border-slate-200/10">
                      <div className={`text-[11px] font-black text-slate-500 ${isHidden ? 'opacity-30' : ''}`}>{s.time || 'N/A'}</div>
                    </td>
                    <td className="px-4 border-r border-slate-200/10">
                      <div className={`text-[11px] font-black text-primary-600 uppercase tracking-widest ${isHidden ? 'opacity-30' : ''}`}>{s.assistant || 'N/A'}</div>
                    </td>
                    
                    {/* Dynamic Date Columns */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const dayKey = `${monthKey}-${String(day).padStart(2, '0')}`;
                        const status = data.attendance[s.id]?.[dayKey];
                        const isCurrentColumn = parseInt(dayDisplay) === day;

                        return (
                          <td 
                            key={day} 
                            onClick={() => cycleStatus(s.id, day)}
                            className={`p-0 border-r border-slate-200/10 cursor-pointer transition-colors ${isCurrentColumn ? 'bg-orange-500/5' : ''}`}
                          >
                            <div className={`w-full h-full flex items-center justify-center ${isHidden ? 'opacity-20 grayscale' : ''}`}>
                                {getStatusIcon(status)}
                            </div>
                          </td>
                        );
                    })}

                    {/* Actions Sticky Column */}
                    <td className="px-4 sticky right-0 z-30 bg-inherit border-l border-slate-200/10 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onUpdate({ ...data, students: students.map(st => st.id === s.id ? { ...st, isHidden: !isHidden } : st) })}
                          className={`p-1.5 rounded-lg transition-all ${isHidden ? 'bg-[#1B254B] text-white' : 'text-slate-300 hover:text-primary-500 hover:bg-white'}`}
                        >
                          {isHidden ? <Eye size={16}/> : <EyeOff size={16}/>}
                        </button>
                        <button 
                          onClick={() => confirm('Delete record?') && onUpdate({ ...data, students: students.filter(st => st.id !== s.id) })}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};