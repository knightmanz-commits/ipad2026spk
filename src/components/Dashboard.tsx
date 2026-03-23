import React from 'react';
import { Device, TranslationKey } from '../types';
import { Package, CheckCircle, RefreshCw, AlertCircle, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  stats: {
    total: number;
    available: number;
    borrowed: number;
    maintenance: number;
  };
  onRefresh?: () => void;
  t: (key: TranslationKey) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onRefresh, t }) => {
  const statCards = [
    { label: t('total_devices'), value: stats.total, icon: Package, color: 'bg-spk-blue', textColor: 'text-white' },
    { label: t('available'), value: stats.available, icon: CheckCircle, color: 'bg-green-500', textColor: 'text-white' },
    { label: t('borrowed'), value: stats.borrowed, icon: RefreshCw, color: 'bg-blue-500', textColor: 'text-white' },
    { label: t('maintenance'), value: stats.maintenance, icon: AlertCircle, color: 'bg-orange-500', textColor: 'text-white' },
  ];

  const recentActivities: Device[] = []; // History should be fetched from Transactions sheet in future update

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('dashboard')}</h2>
          <p className="text-gray-500">ICT Inventory System Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-spk-gray transition-all text-spk-blue font-bold text-sm cursor-pointer"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card flex flex-col justify-between h-40 md:h-48 overflow-hidden relative group`}
          >
            <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2 rounded-lg shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="mt-auto">
              <h3 className="text-4xl md:text-5xl font-extrabold text-spk-blue">{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-1">รายการอุปกรณ์</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-spk-blue flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              รายการยืมล่าสุด
            </h3>
            <button className="text-xs font-bold text-spk-blue hover:underline cursor-pointer">ดูทั้งหมด</button>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-spk-gray/50 hover:bg-spk-gray transition-colors border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{device.name}</p>
                      <p className="text-xs text-gray-500">S/N: <span className="font-medium text-spk-blue">{device.serial_number}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">สถานะ</p>
                    <p className="text-sm font-medium text-gray-700">{device.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>ยังไม่มีรายการยืมในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats / Chart Placeholder */}
        <div className="card flex flex-col">
          <h3 className="text-lg font-bold text-spk-blue flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5" />
            สัดส่วนการใช้งาน
          </h3>
          <div className="flex-grow flex flex-col justify-center items-center space-y-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * stats.available) / (stats.total || 1)}
                  className="text-green-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-spk-blue">{Math.round((stats.available / (stats.total || 1)) * 100)}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">พร้อมใช้งาน</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">พร้อมใช้งาน</span>
                </div>
                <span className="font-bold">{stats.available}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">ถูกยืม</span>
                </div>
                <span className="font-bold">{stats.borrowed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">ซ่อมบำรุง</span>
                </div>
                <span className="font-bold">{stats.maintenance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
