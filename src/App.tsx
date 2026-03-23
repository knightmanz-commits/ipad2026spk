import React, { useState, useEffect, useCallback } from 'react';
import { User, Device, Category, UserRole, DeviceStatus, TranslationKey, ServiceLog, Student, ServiceReport, Teacher, ActivityLog } from './types';
import { translations } from './constants';
import { supabaseService } from './services/supabaseService';

// Components
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import BorrowReturn from './components/BorrowReturn';
import AdminPanel from './components/Admin';
import Service from './components/Service';
import Logs from './components/Logs';
import StudentsRegistry from './components/StudentsRegistry';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language] = useState<'th' | 'en'>('th');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0,
    maintenance: 0
  });

  const t = useCallback((key: TranslationKey): string => {
    return (translations[language] as any)[key] || key;
  }, [language]);

  const loadPublicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devicesRes, categoriesRes] = await Promise.all([
        supabaseService.read('Devices'),
        supabaseService.read('Categories')
      ]);

      if (devicesRes.success && categoriesRes.success) {
        const loadedCategories = categoriesRes.items as Category[];
        const loadedDevices = (devicesRes.items as Device[]).map(d => {
          const cat = loadedCategories.find(c => c.category === d.category_id);
          return {
            ...d,
            name: cat?.name || 'Unknown Device',
            categoryName: cat?.name,
            imageUrl: cat?.imageUrl,
            designatedFor: cat?.designatedFor
          };
        });
        setCategories(loadedCategories);
        setDevices(loadedDevices);
        
        // Calculate stats
        setStats({
          total: devicesRes.total || loadedDevices.length,
          available: loadedDevices.filter(d => d.status === DeviceStatus.Available).length,
          borrowed: loadedDevices.filter(d => d.status === DeviceStatus.Borrowed).length,
          maintenance: loadedDevices.filter(d => d.status === DeviceStatus.Maintenance).length
        });
      }
    } catch (error) {
      console.error('Failed to load public data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExtendedData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const [usersRes, serviceLogsRes, serviceRes, logsRes] = await Promise.all([
        supabaseService.read('Users'),
        supabaseService.read('serviceLogs'),
        supabaseService.read('Service'),
        supabaseService.read('Logs')
      ]);

      if (usersRes.success) setUsers(usersRes.items as User[]);
      if (serviceLogsRes.success) setServiceLogs(serviceLogsRes.items as ServiceLog[]);
      if (serviceRes.success) setServiceReports(serviceRes.items as ServiceReport[]);
      if (logsRes.success) setActivityLogs(logsRes.items as ActivityLog[]);
    } catch (error) {
      console.error('Failed to load extended data', error);
    }
  }, [currentUser]);

  const normalizeGrade = (grade: any): string => {
    const g = String(grade).trim();
    if (!g) return '';
    if (g.startsWith('ม.')) return g;
    if (/^\d+$/.test(g)) return `ม.${g}`;
    return g;
  };

  const loadStudentsData = useCallback(async () => {
    if (!currentUser || students.length > 0) return;
    
    setIsLoading(true);
    try {
      const [studentsM4Res, studentsM5Res, studentsM6Res, teachersRes] = await Promise.all([
        supabaseService.read('StudentsM4'),
        supabaseService.read('StudentsM5'),
        supabaseService.read('StudentsM6'),
        supabaseService.read('Teachers')
      ]);

      const allStudents = [
        ...(studentsM4Res.success ? studentsM4Res.items as any[] : []),
        ...(studentsM5Res.success ? studentsM5Res.items as any[] : []),
        ...(studentsM6Res.success ? studentsM6Res.items as any[] : [])
      ].map(s => {
        // Robust mapping for student name
        const fullName = s.fullName || s['ชื่อ-นามสกุล'] || s['ชื่อ'] || s['name'] || 'ยังไม่ระบุ';
        const studentId = s.studentId || s['รหัสนักเรียน'] || s['รหัสประจำตัว'] || s['id'] || 'ยังไม่ระบุ';
        const grade = normalizeGrade(s.grade || s['ชั้น'] || s['ระดับชั้น']);
        const classroom = s.classroom || s['ห้อง'] || 'ยังไม่ระบุ';
        const email = s.email || s['อีเมล'] || 'ยังไม่ระบุ';

        return {
          ...s,
          studentId: String(studentId),
          fullName,
          grade,
          classroom: String(classroom),
          email
        };
      });

      setStudents(allStudents as any);
      if (teachersRes.success) setTeachers(teachersRes.items as Teacher[]);
    } catch (error) {
      console.error('Failed to load students data', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, students.length]);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await supabaseService.read('Categories');
        setDbConnected(res.success);
      } catch {
        setDbConnected(false);
      }
    };
    checkDb();
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    if (currentUser) {
      loadExtendedData();
    }
  }, [currentUser, loadExtendedData]);

  useEffect(() => {
    if (currentUser && (activeTab === 'borrow' || activeTab === 'students' || activeTab === 'admin')) {
      loadStudentsData();
    }
  }, [currentUser, activeTab, loadStudentsData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(false);
    setActiveTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="w-16 h-16 border-4 border-spk-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-spk-blue font-semibold">ICT Inventory System Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} t={t} />;
    }
    return <LandingPage 
      onStart={() => setShowLogin(true)} 
      onAdminLogin={() => setShowLogin(true)} 
      categories={categories}
      devices={devices}
    />;
  }

  const renderContent = () => {
    const extendedDevices = [...devices] as any;
    extendedDevices.users = users;
    extendedDevices.serviceLogs = serviceLogs;
    extendedDevices.students = students;
    extendedDevices.serviceReports = serviceReports;
    extendedDevices.teachers = teachers;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onRefresh={loadPublicData} t={t} />;
      case 'inventory':
        return <Inventory devices={devices} categories={categories} t={t} />;
      case 'borrow':
        return <BorrowReturn devices={extendedDevices} students={students} currentUser={currentUser} onRefresh={loadPublicData} t={t} />;
      case 'service':
        return <Service devices={extendedDevices} t={t} />;
      case 'students':
        return <StudentsRegistry students={students} teachers={teachers} t={t} />;
      case 'logs':
        return <Logs logs={activityLogs} t={t} />;
      case 'admin':
        return (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Staff) ? (
          <AdminPanel 
            categories={categories} 
            onRefresh={loadPublicData} 
            t={t} 
          />
        ) : (
          <Dashboard stats={stats} onRefresh={loadPublicData} t={t} />
        );
      default:
        return <Dashboard stats={stats} onRefresh={loadPublicData} t={t} />;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
      t={t}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
