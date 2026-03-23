import React, { useState, useMemo } from 'react';
import { ActivityLog, TranslationKey } from '../types';
import { Search, History, Filter, ChevronLeft, ChevronRight, Clock, User, Tag } from 'lucide-react';
import { formatThaiDate } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface LogsProps {
  logs: ActivityLog[];
  t: (key: TranslationKey) => string;
}

const Logs: React.FC<LogsProps> = ({ logs, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('borrow')) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (a.includes('return')) return 'text-green-600 bg-green-50 border-green-100';
    if (a.includes('add') || a.includes('create')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (a.includes('delete')) return 'text-red-600 bg-red-50 border-red-100';
    if (a.includes('update') || a.includes('edit')) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-gray-600 bg-gray-50 border-gray-100';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('logs')}</h2>
          <p className="text-gray-500">บันทึกประวัติการทำรายการทั้งหมดในระบบ</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาประวัติ..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="input pl-12"
          />
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-spk-gray text-spk-blue font-bold text-xs uppercase tracking-widest">
                <th className="px-6 py-4 rounded-tl-xl"><div className="flex items-center gap-2"><Clock className="w-4 h-4" /> วันที่-เวลา</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><User className="w-4 h-4" /> ผู้ดำเนินการ</div></th>
                <th className="px-6 py-4"><div className="flex items-center gap-2"><Tag className="w-4 h-4" /> การดำเนินการ</div></th>
                <th className="px-6 py-4 rounded-tr-xl">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {currentLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-spk-gray/30 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">{formatThaiDate(log.timestamp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[10px] font-bold text-spk-blue uppercase">
                          {log.user_id.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{log.user_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-medium group-hover:text-spk-blue transition-colors line-clamp-1" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-20 text-center">
            <History className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">ไม่พบประวัติการทำรายการ</h3>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:bg-spk-gray transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-bold transition-all cursor-pointer ${
                  currentPage === page 
                    ? "bg-spk-blue text-white shadow-lg" 
                    : "bg-white text-gray-400 border border-gray-200 hover:bg-spk-gray"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:bg-spk-gray transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Logs;
