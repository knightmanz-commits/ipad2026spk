import React from 'react';
import { User, UserRole, TranslationKey } from '../types';
import { LayoutDashboard, Package, RefreshCw, Settings, LogOut, Wrench, History, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  t: (key: TranslationKey) => string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, activeTab, setActiveTab, onLogout, t }) => {
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'inventory', label: t('inventory'), icon: Package },
    { id: 'borrow', label: t('borrow'), icon: RefreshCw },
    { id: 'service', label: t('service'), icon: Wrench },
  ];

  if (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Staff) {
    menuItems.push({ id: 'students', label: t('studentsRegistry'), icon: Users });
    menuItems.push({ id: 'logs', label: t('logs'), icon: History });
    menuItems.push({ id: 'admin', label: t('admin'), icon: Settings });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-spk-gray">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-spk-blue text-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-spk-yellow p-2 rounded-lg">
            <Package className="text-spk-blue w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">iPad Check</h1>
            <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">โรงเรียนสารคามพิทยาคม</p>
          </div>
        </div>

        <nav className="flex-grow space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                activeTab === item.id 
                  ? "bg-spk-yellow text-spk-blue font-bold shadow-lg" 
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-spk-yellow flex items-center justify-center text-spk-blue font-bold overflow-hidden">
              {(currentUser.name || currentUser.users || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold truncate">{currentUser.name || currentUser.users}</p>
              <p className="text-xs text-white/50 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-spk-blue text-white p-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Package className="text-spk-yellow w-6 h-6" />
            <div>
              <h1 className="font-bold leading-none">iPad Check</h1>
              <p className="text-[8px] text-white/50 font-medium">โรงเรียนสารคามพิทยาคม</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-white/70 cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-grow p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="hidden md:block bg-white border-t border-gray-100 py-4 px-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} iPad Check System - ศูนย์ ไอซีที โรงเรียนสารคามพิทยาคม
          </p>
        </footer>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer",
                activeTab === item.id ? "text-spk-yellow" : "text-gray-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
