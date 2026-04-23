import React, { useState, useEffect, useMemo } from 'react';
import { StudentTable } from './components/StudentTable';
import { PenaltyTable } from './components/PenaltyTable';
import { DailyTaskTable } from './components/DailyTaskTable';
import { AIStudio } from './components/AIStudio';
import { LandingPage } from './components/LandingPage';
import { AIModal } from './components/AIModal';
import { AttendanceTable } from './components/AttendanceTable';
import { FinanceTable } from './components/FinanceTable';
import { CardGenerator } from './components/CardGenerator';
import { MaintenancePanel } from './components/MaintenancePanel';
import { Sidebar } from './components/Sidebar';
import { ContactManager } from './components/ContactManager';
import { SupermanAnimation } from './components/SupermanAnimation';
import ReminderTable from './components/ReminderTable';
import { AppData, Student, CurrentUser, UserRole, ColumnConfig, Tab, ViewMode, AppSettings, StudentCategory } from './types';
import { subscribeToData, saveData } from './services/firebase';
import { Menu, MessageSquare, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format } from 'date-fns';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'c1', key: 'name', label: 'FULL NAME', width: 220, visible: true, type: 'text' },
  { id: 'c2', key: 'teachers', label: 'TEACHERS', width: 180, visible: true, type: 'text' },
  { id: 'c3', key: 'level', label: 'LEVEL', width: 85, visible: true, type: 'text' },
  { id: 'c5', key: 'behavior', label: 'BEHAVIOR', width: 180, visible: true, type: 'text' },
  { id: 'c_schedule', key: 'schedule', label: 'SCHEDULE', width: 140, visible: true, type: 'text' },
  { id: 'c4', key: 'time', label: 'TIME', width: 110, visible: true, type: 'text' },
  { id: 'c6', key: 'duration', label: 'DURATION', width: 100, visible: true, type: 'text' },
  { id: 'c7', key: 'startDate', label: 'START', width: 100, visible: true, type: 'text' },
  { id: 'c8', key: 'deadline', label: 'DEADLINE', width: 100, visible: true, type: 'text' },
  { id: 'c9', key: 'assistant', label: 'ASSISTANT', width: 150, visible: true, type: 'text' }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem('dps_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [data, setData] = useState<AppData>({ 
    students: [], 
    settings: { 
      fontSize: 12, 
      fontFamily: "'Inter', sans-serif", 
      columns: DEFAULT_COLUMNS,
      backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000'
    },
    attendance: {}
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.Hall);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('Default');
  const [globalScale, setGlobalScale] = useState(1);
  
  const [filters, setFilters] = useState<any>({
    searchQuery: '', 
    teacher: '', 
    assistant: '',
    time: '', 
    level: '', 
    behavior: '', 
    deadline: '', 
    showHidden: false,
    attendanceTab: 'PartTime',
    attendanceClass: ''
  });

  const OFFICIAL_DAILY_TASKS = useMemo(() => [
    { name: "Souyean & Sreythea", level: "1A + (5.1)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sreythea & Vilya", level: "1A + (5.1)", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Chhenglay & Nita", level: "1B-(16.10)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhenglay & Derith", level: "1B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Meymey & Naza", level: "1B- (1.9)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Naza & Pulvatey", level: "1B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Mengthou & Meymey", level: "Pre-2A(I)-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chanpanha & Sonita", level: "Pre-2A(I)-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Derith & Mengthou", level: "Pre-2A(I)+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Lina & Davina", level: "Pre-2A(I)+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Pha & Saravottey", level: "Pre-2A(II)-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Virak & Chhenglay", level: "Pre-2A(II)-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Sreypov & Chhorvornn", level: "2A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Pha & Liza", level: "2A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Sreyleap & Chhengly", level: "2B-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhorvornn & Sreyren", level: "2B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "S.Vottey & Soklim", level: "2B+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Davina & Virak", level: "2B+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Piseth & Kimheang", level: "3A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Nita & Thida", level: "3A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sathyaboth & Thida", level: "3A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Chhengly & Pisey", level: "3A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhengly & Naza", level: "3A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Souyean & Soklim", level: "3B +", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Soklim & Chanpanha", level: "3B +", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Lina & Bormey", level: "4A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sreyren & Both", level: "4A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Pisey & Chhenglay", level: "4A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sonita & Chhorvornn", level: "4A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Virak & Socheata", level: "4A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Derith & Socheata", level: "4A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Bormey & Chomnan", level: "4B+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Socheata & Dalin", level: "4B+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Seavninh & Derith", level: "5A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Dalin & Piseth", level: "5A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Thida & Sreypov", level: "5B-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Pulvatey & Pha", level: "5B-", shift: "Afternoon", category: "DailyTask" as StudentCategory }
  ], []);

  // One-time seed for Daily Tasks
  useEffect(() => {
    if (!loading) {
        const hasTasks = data.students.some(s => s.category === 'DailyTask');
        if (!hasTasks) {
            const newTasks: Student[] = OFFICIAL_DAILY_TASKS.map(t => ({
                ...t,
                id: uuidv4(),
                teachers: '',
                behavior: '',
                time: '',
                duration: '',
                startDate: '',
                deadline: format(new Date(), 'dd/MM/yy'),
                assistant: '',
                order: 0,
                isHidden: false
            }));
            handleUpdate({ ...data, students: [...data.students, ...newTasks] });
        }
    }
  }, [loading, data.students.length === 0]);

  const uniqueTeachers = useMemo(() => {
    const ts = new Set<string>();
    // From students
    data.students.forEach(s => {
      if (s.teachers) String(s.teachers).split('&').forEach(t => ts.add(t.trim()));
    });
    // From staff directory (all can be teachers/assistants)
    if (data.staffDirectory) {
      Object.keys(data.staffDirectory).forEach(name => ts.add(name.trim()));
    }
    return Array.from(ts).filter(Boolean).sort();
  }, [data.students, data.staffDirectory]);

  const uniqueAssistants = useMemo(() => {
    const asst = new Set<string>();
    // From students
    data.students.forEach(s => {
      if (s.assistant) asst.add(String(s.assistant).trim());
    });
    // From staff directory
    if (data.staffDirectory) {
      Object.keys(data.staffDirectory).forEach(name => asst.add(name.trim()));
    }
    return Array.from(asst).filter(Boolean).sort();
  }, [data.students, data.staffDirectory]);

  const uniqueTimes = useMemo(() => {
    const tm = new Set<string>();
    data.students.forEach(s => s.time && tm.add(String(s.time).trim()));
    return Array.from(tm).filter(Boolean).sort();
  }, [data.students]);

  const uniqueLevels = useMemo(() => {
    const lv = new Set<string>();
    data.students.forEach(s => s.level && lv.add(String(s.level).trim()));
    return Array.from(lv).filter(Boolean).sort();
  }, [data.students]);

  const uniqueBehaviors = useMemo(() => {
    const bh = new Set<string>();
    data.students.forEach(s => s.behavior && bh.add(String(s.behavior).trim()));
    return Array.from(bh).filter(Boolean).sort();
  }, [data.students]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToData((newData) => {
      if (!newData.settings?.columns) {
          newData.settings = { ...(newData.settings || { fontSize: 12, fontFamily: "'Inter', sans-serif" }), columns: DEFAULT_COLUMNS };
      }
      setData(newData);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [currentUser]);

  const handleUpdate = (newData: AppData) => {
      setData(newData);
      saveData(newData);
  };

  const handleAddStudent = (parsedData?: Partial<Student> | Partial<Student>[]) => {
    const incomingData = Array.isArray(parsedData) ? parsedData : (parsedData ? [parsedData] : [{}]);
    const newStudents = incomingData.map((s, index) => {
        const today = new Date();
        
        let determinedCategory: StudentCategory = 'Hall';
        if (activeTab === Tab.Attendance) determinedCategory = 'Class';
        else if (activeTab === Tab.Finance) determinedCategory = 'Office';
        else if (activeTab === Tab.Penalty) determinedCategory = 'Penalty';
        
        return {
          id: uuidv4(),
          name: '',
          category: determinedCategory,
          order: data.students.length + index,
          isHidden: false,
          parentContact: false,
          headTeacher: false,
          startDate: s.startDate || format(today, 'dd/MM/yyyy'),
          deadline: s.deadline || format(addMonths(today, 1), 'dd/MM/yyyy'),
          ...s
        } as Student;
    });
    handleUpdate({ ...data, students: [...newStudents, ...data.students] });
  };

  const handleLogin = (name: string, role: UserRole, pin: string) => {
    const pins: Record<UserRole, string> = { Admin: '888', Teacher: '1234', Finance: '555' };
    if (pin === (pins as any)[role]) {
      const user: CurrentUser = { name, role };
      setCurrentUser(user);
      localStorage.setItem('dps_user', JSON.stringify(user));
    } else {
      alert("Invalid PIN.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dps_user');
  };

  const handleClearCategory = (categories: StudentCategory[]) => {
    if (!window.confirm(`Are you sure you want to delete ALL students in ${categories.join('/')}? This action is irreversible.`)) return;
    const remaining = data.students.filter(s => !categories.includes(s.category));
    handleUpdate({ ...data, students: remaining });
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      handleUpdate({ ...data, students: data.students.filter(s => s.id !== id) });
    }
  };

  if (!currentUser) return <LandingPage onLogin={handleLogin} />;

  const isModuleLocked = (module: 'Hall' | 'Attendance' | 'Finance') => {
    return data.moduleLocks?.[module] || false;
  };

  return (
    <div 
      className="h-screen bg-transparent flex font-sans overflow-hidden transition-all duration-700" 
      style={{ 
        fontFamily: data.settings?.fontFamily || "'Inter', sans-serif"
      }}
    >
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        role={currentUser.role} 
        onContactsOpen={() => setIsContactsOpen(true)}
        filters={filters}
        setFilters={setFilters}
        uniqueTeachers={uniqueTeachers}
        uniqueAssistants={uniqueAssistants}
        uniqueTimes={uniqueTimes}
        uniqueLevels={uniqueLevels}
        uniqueBehaviors={uniqueBehaviors}
        viewMode={viewMode}
        setViewMode={setViewMode}
        globalScale={globalScale}
        setGlobalScale={setGlobalScale}
        settings={data.settings}
        onUpdateSettings={(s) => handleUpdate({...data, settings: s})}
      />
      
      <AIModal 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        onAdd={handleAddStudent} 
        mode={
            activeTab === Tab.Attendance ? 'Attendance' : 
            activeTab === Tab.Finance ? 'Finance' : 
            activeTab === Tab.DailyTask ? 'DailyTask' : 'Hall'
        } 
      />
      
      <ContactManager 
        isOpen={isContactsOpen} 
        onClose={() => setIsContactsOpen(false)} 
        data={data} 
        onUpdate={(dir) => handleUpdate({...data, staffDirectory: dir})} 
      />

      {isAiStudioOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsAiStudioOpen(false)}></div>
          <div className="relative w-full max-w-4xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300">
             <button onClick={() => setIsAiStudioOpen(false)} className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-100 rounded-full transition-all">
               <X size={24} className="text-slate-400" />
             </button>
             <AIStudio />
          </div>
        </div>
      )}

      <SupermanAnimation students={data.students} />

      <main 
        className="flex-1 flex flex-col overflow-hidden transition-transform duration-300 origin-top-left bg-transparent"
        style={{ transform: `scale(${globalScale})`, width: `${100/globalScale}%`, height: `${100/globalScale}%` }}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-900 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-sm tracking-widest uppercase">Syncing Cloud...</p>
          </div>
        ) : (
          <>
            {activeTab === Tab.Hall && (
              <StudentTable 
                students={data.students} 
                columns={data.settings?.columns || DEFAULT_COLUMNS}
                onUpdate={students => handleUpdate({...data, students})} 
                onUpdateColumns={cols => handleUpdate({...data, settings: { ...data.settings!, columns: cols }})}
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                uniqueTimes={uniqueTimes}
                uniqueLevels={uniqueLevels}
                uniqueBehaviors={uniqueBehaviors}
                onQuickAdd={() => setIsAiOpen(true)} 
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
              />
            )}
            {activeTab === Tab.Penalty && (
              <PenaltyTable 
                students={data.students} 
                onUpdate={students => handleUpdate({...data, students})} 
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                uniqueLevels={uniqueLevels}
                onQuickAdd={() => setIsAiOpen(true)} 
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
              />
            )}
            {activeTab === Tab.DailyTask && (
              <DailyTaskTable 
                students={data.students} 
                data={data}
                onUpdate={handleUpdate} 
                filters={filters} 
                setFilters={setFilters}
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
              />
            )}
            {activeTab === Tab.Reminder && (
              <ReminderTable 
                students={data.students} 
                onAddStudent={handleAddStudent}
                onUpdateStudent={(id, updates) => handleUpdate({ ...data, students: data.students.map(s => s.id === id ? { ...s, ...updates } : s) })}
                onDeleteStudent={handleDeleteStudent}
                onClearCategory={handleClearCategory}
                filters={filters}
                setFilters={setFilters}
                role={currentUser.role}
              />
            )}
            {activeTab === Tab.Attendance && (
              <AttendanceTable 
                students={data.students} 
                data={data} 
                filters={filters} 
                setFilters={setFilters}
                onUpdate={handleUpdate} 
                onAddStudent={handleAddStudent}
                onQuickAdd={() => setIsAiOpen(true)}
                isLocked={isModuleLocked('Attendance')}
                role={currentUser.role}
                onClearCategory={handleClearCategory}
              />
            )}
            {activeTab === Tab.Finance && (
              <FinanceTable 
                students={data.students} 
                data={data} 
                onUpdate={handleUpdate} 
                onQuickAdd={() => setIsAiOpen(true)}
                onAddStudent={handleAddStudent}
                isLocked={isModuleLocked('Finance')}
              />
            )}
            {activeTab === Tab.StudentCard && (
              <CardGenerator 
                students={data.students} 
                data={data} 
                onUpdate={handleUpdate} 
                onQuickAdd={() => setIsAiOpen(true)}
                onAddStudent={handleAddStudent}
              />
            )}
            {activeTab === Tab.Maintenance && (
              <MaintenancePanel data={data} onUpdate={handleUpdate} />
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 no-print z-50">
          <button onClick={() => setIsAiStudioOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-white">
            <MessageSquare size={24} />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-2xl flex items-center justify-center hover:text-primary-500 hover:scale-110 active:scale-95 transition-all border-2 border-slate-100 md:hidden">
            <Menu size={24} />
          </button>
      </div>
    </div>
  );
};

export default App;