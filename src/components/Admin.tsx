import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Device, Category, User, Teacher, Student, ServiceLog, ServiceReport, TranslationKey, UserRole, DeviceStatus } from '../types';
import { supabaseService } from '../services/supabaseService';
import { 
  Settings, Package, Users, GraduationCap, Wrench, History, Plus, Edit2, Trash2, 
  Search, Filter, ChevronLeft, ChevronRight, X, Save, AlertCircle, CheckCircle,
  MoreVertical, Download, Upload, Shield, RefreshCw, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { formatValue } from '../utils/format';

interface AdminPanelProps {
  categories: Category[];
  onRefresh: () => void;
  t: (key: TranslationKey) => string;
}

type AdminTab = 'devices' | 'categories' | 'users' | 'teachers' | 'students' | 'serviceLogs' | 'serviceReports';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  categories, onRefresh, t 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('devices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importReport, setImportReport] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  const tabs = [
    { id: 'devices', label: 'อุปกรณ์', icon: Package, sheet: 'Devices' },
    { id: 'categories', label: 'หมวดหมู่', icon: Filter, sheet: 'Categories' },
    { id: 'users', label: 'ผู้ใช้งานระบบ', icon: Shield, sheet: 'Users' },
    { id: 'teachers', label: 'ครูที่ปรึกษา', icon: Users, sheet: 'Teachers' },
    { id: 'students', label: 'นักเรียน', icon: 'Students' }, // Special case for students
    { id: 'serviceLogs', label: 'ประวัติซ่อม', icon: Wrench, sheet: 'serviceLogs' },
    { id: 'serviceReports', label: 'รายงานปัญหา', icon: AlertCircle, sheet: 'Service' },
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const tabInfo = tabs.find(t => t.id === activeTab);
      if (!tabInfo) return;

      const offset = (currentPage - 1) * itemsPerPage;
      
      // Special handling for students (multiple sheets)
      if (activeTab === 'students') {
        const res = await supabaseService.read('Students', { searchTerm: debouncedSearch });
        
        if (res.success) {
          setTotal(res.total);
          setItems(res.items.slice(offset, offset + itemsPerPage));
        }
      } else {
        const res = await supabaseService.read(tabInfo.sheet as string, {
          offset,
          limit: itemsPerPage,
          searchTerm: debouncedSearch
        });

        if (res.success) {
          setItems(res.items);
          setTotal(res.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;
    
    setIsLoading(true);
    try {
      const actionMap: Record<AdminTab, string> = {
        devices: 'deleteDevice',
        categories: 'deleteCategory',
        users: 'deleteUser',
        teachers: 'deleteTeacher',
        students: 'deleteStudent',
        serviceLogs: 'deleteServiceLog',
        serviceReports: 'deleteServiceReport'
      };
      
      const result = await supabaseService.handleAction(actionMap[activeTab], null, { id });
      if (result.success) {
        // Clear cache for this action if it was cached
        const cacheKey = `spk_cache_read${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}_`;
        localStorage.removeItem(cacheKey);
        fetchData();
        onRefresh();
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const isEdit = !!editingItem;
      const actionPrefix = isEdit ? 'update' : 'add';
      const entityName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/s$/, '');
      const action = `${actionPrefix}${entityName}`;
      
      const result = await supabaseService.handleAction(action, null, isEdit ? { ...data, id: editingItem.id || editingItem.category || editingItem.users || editingItem.studentId } : data);
      
      if (result.success) {
        // Clear cache
        const cacheKey = `spk_cache_read${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}_`;
        localStorage.removeItem(cacheKey);
        
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
        onRefresh();
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportReport(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        const actionPrefix = 'add';
        const entityName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/s$/, '');
        const action = `${actionPrefix}${entityName}`;

        for (const row of results.data as any[]) {
          try {
            // Basic data cleaning: remove empty strings if they are optional
            const cleanRow = Object.fromEntries(
              Object.entries(row).map(([k, v]) => [k, v === '' ? null : v])
            );

            const result = await supabaseService.handleAction(action, null, cleanRow);
            if (result.success) {
              successCount++;
            } else {
              failedCount++;
              errors.push(`Row ${successCount + failedCount}: ${result.message || 'Unknown error'}`);
            }
          } catch (err) {
            failedCount++;
            errors.push(`Row ${successCount + failedCount}: ${err instanceof Error ? err.message : 'System error'}`);
          }
        }

        setImportReport({ success: successCount, failed: failedCount, errors });
        setIsLoading(false);
        fetchData();
        onRefresh();
        
        // Reset input
        e.target.value = '';
      },
      error: (error) => {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message);
        setIsLoading(false);
      }
    });
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('admin')}</h2>
          <p className="text-gray-500">จัดการข้อมูลพื้นฐานและตั้งค่าระบบ</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-spk-blue" />}
          <button className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm cursor-pointer relative">
            <Upload className="w-4 h-4" /> Import
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </button>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-5 h-5" /> เพิ่มข้อมูล
          </button>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as AdminTab); setCurrentPage(1); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id 
                ? "bg-spk-blue text-white shadow-md" 
                : "bg-white text-gray-400 hover:bg-spk-gray hover:text-spk-blue"
            }`}
          >
            {typeof tab.icon === 'string' ? <GraduationCap className="w-4 h-4" /> : <tab.icon className="w-4 h-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`ค้นหาใน${tabs.find(t => t.id === activeTab)?.label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
          <History className="w-4 h-4" />
          พบ {total} รายการ
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-spk-gray text-spk-blue font-bold text-xs uppercase tracking-widest">
                <th className="px-6 py-4">ข้อมูล</th>
                <th className="px-6 py-4">รายละเอียด</th>
                <th className="px-6 py-4">สถานะ/ประเภท</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.tr
                    key={item.id || item.serial_number || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-spk-gray/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-spk-blue font-bold">
                          {activeTab === 'devices' ? <Package className="w-5 h-5" /> : (item.name || item.users || item.fullName || 'ID').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{formatValue(item.name || item.users || item.fullName || item.student_id)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {formatValue(item.id || item.category || item.serial_number || item.studentId)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {activeTab === 'devices' && <p>S/N: <span className="font-mono">{formatValue(item.serial_number)}</span></p>}
                        {activeTab === 'students' && <p>ชั้น ม.{formatValue(item.grade)}/{formatValue(item.classroom || item.room)}</p>}
                        {activeTab === 'teachers' && <p>ม.{formatValue(item.grade)}/{formatValue(item.classroom)} • {formatValue(item.phone)}</p>}
                        {activeTab === 'users' && <p>{formatValue(item.role)}</p>}
                        {activeTab === 'serviceReports' && <p className="line-clamp-1">{formatValue(item.details)}</p>}
                        {activeTab === 'categories' && <p>{formatValue(item.description)}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === DeviceStatus.Available ? 'bg-green-50 text-green-600 border-green-100' :
                          item.status === DeviceStatus.Borrowed ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {item.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="p-2 hover:bg-white rounded-lg transition-all text-spk-blue shadow-sm border border-transparent hover:border-gray-200 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id || item.category || item.studentId || item.users)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-all text-red-500 shadow-sm border border-transparent hover:border-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
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

      {/* Modal */}
      <AnimatePresence>
        {importReport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-spk-blue/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 bg-spk-blue text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" /> ผลการนำเข้าข้อมูล
                </h3>
                <button onClick={() => setImportReport(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-2xl text-center border border-green-100">
                    <p className="text-3xl font-bold text-green-600">{importReport.success}</p>
                    <p className="text-xs font-bold text-green-700 uppercase tracking-widest mt-1">สำเร็จ</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl text-center border border-red-100">
                    <p className="text-3xl font-bold text-red-600">{importReport.failed}</p>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-widest mt-1">ล้มเหลว</p>
                  </div>
                </div>

                {importReport.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รายละเอียดข้อผิดพลาด (สูงสุด 5 รายการ)</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-xs text-red-500 font-mono space-y-1 max-h-32 overflow-y-auto">
                      {importReport.errors.slice(0, 5).map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                      {importReport.errors.length > 5 && <p className="text-gray-400 italic">... และอีก {importReport.errors.length - 5} รายการ</p>}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setImportReport(null)}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-spk-blue shadow-lg hover:bg-blue-900 transition-all cursor-pointer"
                >
                  ตกลง
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-spk-blue/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-spk-yellow"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-spk-blue flex items-center gap-2">
                  {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'} - {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-spk-gray rounded-xl transition-colors cursor-pointer">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {activeTab === 'devices' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสอุปกรณ์ (ID)</label>
                      <input name="id" defaultValue={editingItem?.id} required className="input" placeholder="เช่น L001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">หมวดหมู่</label>
                      <select name="category_id" defaultValue={editingItem?.category_id} required className="input">
                        {categories.map(cat => <option key={cat.category} value={cat.category}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Serial Number</label>
                      <input name="serial_number" defaultValue={editingItem?.serial_number} required className="input" placeholder="S/N" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">อุปกรณ์เสริม</label>
                      <input name="defaultAccessories" defaultValue={editingItem?.defaultAccessories} className="input" placeholder="เช่น สายชาร์จ, เคส" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">สถานะ</label>
                      <select name="status" defaultValue={editingItem?.status || DeviceStatus.Available} required className="input">
                        {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <input type="checkbox" name="is_featured" defaultChecked={editingItem?.is_featured} className="w-5 h-5" />
                      <label className="text-sm font-bold text-gray-600">สินค้าแนะนำ (Featured)</label>
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสหมวดหมู่ (ID)</label>
                        <input name="category" defaultValue={editingItem?.category} required className="input" placeholder="เช่น laptop, tablet" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อหมวดหมู่ภาษาไทย</label>
                        <input name="name" defaultValue={editingItem?.name} required className="input" placeholder="เช่น แท็บเล็ต, โน้ตบุ๊ก" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รายละเอียด</label>
                      <textarea name="description" defaultValue={editingItem?.description} className="input min-h-[100px]" placeholder="คำอธิบายหมวดหมู่..."></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">กลุ่มเป้าหมาย</label>
                        <select name="designatedFor" defaultValue={editingItem?.designatedFor || 'all'} required className="input">
                          <option value="student">นักเรียน (Student)</option>
                          <option value="teacher">ครู (Teacher)</option>
                          <option value="all">ทั้งหมด (All)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">URL รูปภาพ</label>
                        <input name="imageUrl" defaultValue={editingItem?.imageUrl} className="input" placeholder="https://..." />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อผู้ใช้งาน (Login ID)</label>
                      <input name="users" defaultValue={editingItem?.users} required className="input" placeholder="Username" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
                      <input name="password" type="password" required={!editingItem} className="input" placeholder={editingItem ? "••••••••" : "Password"} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                      <input name="name" defaultValue={editingItem?.name} required className="input" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ระดับสิทธิ์</label>
                      <select name="role" defaultValue={editingItem?.role || UserRole.Staff} required className="input">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'teachers' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                      <input name="fullName" defaultValue={editingItem?.fullName} required className="input" placeholder="ชื่อครูที่ปรึกษา" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                      <input name="phone" defaultValue={editingItem?.phone} required className="input" placeholder="08X-XXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">แผนก/กลุ่มสาระ</label>
                      <input name="department" defaultValue={editingItem?.department} required className="input" placeholder="เช่น วิทยาศาสตร์" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ระดับชั้น (ม.)</label>
                        <input name="grade" type="number" defaultValue={editingItem?.grade} required className="input" placeholder="4" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ห้อง</label>
                        <input name="classroom" type="number" defaultValue={editingItem?.classroom} required className="input" placeholder="1" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสนักเรียน</label>
                      <input name="student_id" defaultValue={editingItem?.student_id || editingItem?.studentId} required className="input" placeholder="รหัส 5 หลัก" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                      <input name="name" defaultValue={editingItem?.name || editingItem?.fullName} required className="input" placeholder="ชื่อนักเรียน" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ระดับชั้น</label>
                      <input name="grade" type="number" defaultValue={editingItem?.grade} required className="input" placeholder="ม. (1-6)" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ห้อง</label>
                      <input name="room" type="number" defaultValue={editingItem?.room || editingItem?.classroom} required className="input" placeholder="ห้อง" />
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-spk-gray hover:text-spk-blue transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-spk-blue shadow-lg hover:bg-blue-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> บันทึกข้อมูล</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
