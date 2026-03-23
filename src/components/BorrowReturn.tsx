import React, { useState, useMemo } from 'react';
import { Device, Student, DeviceStatus, TranslationKey } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Search, User, Package, Calendar, CheckCircle, AlertCircle, RefreshCw, ArrowRight, ArrowLeft, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BorrowReturnProps {
  devices: Device[];
  students: Student[];
  onRefresh: () => void;
  t: (key: TranslationKey) => string;
}

const BorrowReturn: React.FC<BorrowReturnProps> = ({ devices, students, onRefresh, t }) => {
  const [activeMode, setActiveMode] = useState<'borrow' | 'return'>('borrow');
  const [step, setStep] = useState(1);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchDevice, setSearchDevice] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const filteredStudents = useMemo(() => {
    if (searchStudent.length < 2) return [];
    return students.filter(s => 
      s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.studentId.includes(searchStudent)
    ).slice(0, 5);
  }, [students, searchStudent]);

  const filteredDevices = useMemo(() => {
    if (searchDevice.length < 2) return [];
    const availableDevices = devices.filter(d => 
      activeMode === 'borrow' ? d.status === DeviceStatus.Available : d.status === DeviceStatus.Borrowed
    );
    return availableDevices.filter(d => 
      (d.name || '').toLowerCase().includes(searchDevice.toLowerCase()) ||
      d.serial_number.toLowerCase().includes(searchDevice.toLowerCase())
    ).slice(0, 5);
  }, [devices, searchDevice, activeMode]);

  const handleAction = async () => {
    if (!selectedStudent || !selectedDevice) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const result = activeMode === 'borrow' 
        ? await supabaseService.borrowDevice(selectedStudent.studentId, selectedDevice.serial_number)
        : await supabaseService.returnDevice(selectedStudent.studentId, selectedDevice.serial_number);

      if (result.success) {
        setMessage({ type: 'success', text: activeMode === 'borrow' ? 'ยืมอุปกรณ์สำเร็จ' : 'คืนอุปกรณ์สำเร็จ' });
        setSelectedStudent(null);
        setSelectedDevice(null);
        setSearchStudent('');
        setSearchDevice('');
        setStep(1);
        onRefresh();
      } else {
        setMessage({ type: 'error', text: result.message || 'เกิดข้อผิดพลาด' });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-spk-blue">{t('borrow_return')}</h2>
        <p className="text-gray-500 mt-2">ระบบยืม-คืนอุปกรณ์ ICT สำหรับนักเรียน</p>
      </header>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-spk-gray rounded-2xl shadow-inner max-w-sm mx-auto">
        <button
          onClick={() => { setActiveMode('borrow'); setStep(1); setMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeMode === 'borrow' ? "bg-white text-spk-blue shadow-md" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          {t('borrow')}
        </button>
        <button
          onClick={() => { setActiveMode('return'); setStep(1); setMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeMode === 'return' ? "bg-white text-spk-blue shadow-md" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('return')}
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 font-bold ${
            message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </motion.div>
      )}

      <div className="card p-8 md:p-12 relative overflow-hidden">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-spk-blue text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
          <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-spk-blue' : 'bg-gray-100'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-spk-blue text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
          <div className={`h-1 w-12 rounded-full ${step >= 3 ? 'bg-spk-blue' : 'bg-gray-100'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 3 ? 'bg-spk-blue text-white' : 'bg-gray-100 text-gray-400'}`}>3</div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-spk-blue">ระบุข้อมูลนักเรียน</h3>
                <p className="text-gray-400 text-sm">ค้นหาด้วยชื่อหรือรหัสนักเรียน</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหานักเรียน..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="input pl-12 py-4 text-lg"
                />
              </div>
              <div className="space-y-2">
                {filteredStudents.map(student => (
                  <button
                    key={student.studentId}
                    onClick={() => { setSelectedStudent(student); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-spk-gray hover:bg-spk-yellow/10 hover:border-spk-yellow border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-spk-blue font-bold shadow-sm">
                        {student.fullName.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 group-hover:text-spk-blue">{student.fullName}</p>
                        <p className="text-xs text-gray-400">รหัส: {student.studentId} | ชั้น: {student.grade}/{student.classroom}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-spk-blue group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-spk-blue">เลือกอุปกรณ์</h3>
                <p className="text-gray-400 text-sm">ค้นหาด้วยชื่อหรือเลขครุภัณฑ์</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาอุปกรณ์..."
                  value={searchDevice}
                  onChange={(e) => setSearchDevice(e.target.value)}
                  className="input pl-12 py-4 text-lg"
                />
              </div>
              <div className="space-y-2">
                {filteredDevices.map(device => (
                  <button
                    key={device.serial_number}
                    onClick={() => { setSelectedDevice(device); setStep(3); }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-spk-gray hover:bg-spk-yellow/10 hover:border-spk-yellow border border-transparent transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-spk-blue shadow-sm">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 group-hover:text-spk-blue">{device.name}</p>
                        <p className="text-xs text-gray-400">S/N: {device.serial_number}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-spk-blue group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full py-3 text-gray-400 font-bold hover:text-spk-blue transition-colors cursor-pointer">ย้อนกลับ</button>
            </motion.div>
          )}

          {step === 3 && selectedStudent && selectedDevice && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-spk-blue">ยืนยันการทำรายการ</h3>
                <p className="text-gray-400 text-sm">ตรวจสอบความถูกต้องก่อนยืนยัน</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-spk-gray border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-spk-blue">
                    <User className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-xs">ข้อมูลนักเรียน</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{selectedStudent.fullName}</p>
                  <p className="text-sm text-gray-500">รหัส: {selectedStudent.studentId}</p>
                  <p className="text-sm text-gray-500">ชั้น: {selectedStudent.grade}/{selectedStudent.classroom}</p>
                </div>

                <div className="p-6 rounded-2xl bg-spk-gray border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-spk-blue">
                    <Package className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-xs">ข้อมูลอุปกรณ์</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{selectedDevice.name}</p>
                  <p className="text-sm text-gray-500">S/N: {selectedDevice.serial_number}</p>
                  <p className="text-sm text-gray-500">เลขครุภัณฑ์: {selectedDevice.asset_number}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAction}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeMode === 'borrow' ? 'bg-spk-blue hover:bg-blue-900' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {activeMode === 'borrow' ? <ArrowRight className="w-5 h-5" /> : <History className="w-5 h-5" />}
                      ยืนยัน{activeMode === 'borrow' ? 'การยืม' : 'การคืน'}
                    </>
                  )}
                </button>
                <button onClick={() => setStep(2)} className="w-full py-3 text-gray-400 font-bold hover:text-spk-blue transition-colors cursor-pointer">ย้อนกลับ</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BorrowReturn;
