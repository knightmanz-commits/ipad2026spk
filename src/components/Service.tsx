import React, { useState, useMemo } from 'react';
import { Device, TranslationKey } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Wrench, Search, Package, AlertCircle, CheckCircle, Camera, Send, RefreshCw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceProps {
  devices: Device[];
  t: (key: TranslationKey) => string;
}

const Service: React.FC<ServiceProps> = ({ devices, t }) => {
  const [searchDevice, setSearchDevice] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [issueType, setIssueType] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const filteredDevices = useMemo(() => {
    if (searchDevice.length < 2) return [];
    return devices.filter(d => 
      d.name.toLowerCase().includes(searchDevice.toLowerCase()) ||
      d.serial_number.toLowerCase().includes(searchDevice.toLowerCase())
    ).slice(0, 5);
  }, [devices, searchDevice]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await supabaseService.reportService({
        serial_number: selectedDevice.serial_number,
        issue_type: issueType,
        details,
        email,
        photo
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'ส่งรายงานการแจ้งซ่อมสำเร็จ เจ้าหน้าที่จะดำเนินการตรวจสอบโดยเร็วที่สุด' });
        setSelectedDevice(null);
        setIssueType('');
        setDetails('');
        setEmail('');
        setPhoto(null);
        setSearchDevice('');
      } else {
        setMessage({ type: 'error', text: result.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
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
        <h2 className="text-3xl font-bold text-spk-blue">{t('service')}</h2>
        <p className="text-gray-500 mt-2">แจ้งซ่อมหรือรายงานปัญหาการใช้งานอุปกรณ์ ICT</p>
      </header>

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Device Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-spk-blue mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              เลือกอุปกรณ์ที่พบปัญหา
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์..."
                value={searchDevice}
                onChange={(e) => setSearchDevice(e.target.value)}
                className="input pl-12"
              />
            </div>
            <div className="space-y-2">
              {filteredDevices.map(device => (
                <button
                  key={device.serial_number}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    selectedDevice?.serial_number === device.serial_number 
                      ? "bg-spk-yellow/10 border-spk-yellow shadow-sm" 
                      : "bg-spk-gray border-transparent hover:bg-gray-200"
                  }`}
                >
                  <div>
                    <p className="font-bold text-gray-800">{device.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">S/N: {device.serial_number}</p>
                  </div>
                  {selectedDevice?.serial_number === device.serial_number && <CheckCircle className="w-5 h-5 text-spk-blue" />}
                </button>
              ))}
            </div>
            {selectedDevice && (
              <div className="mt-6 p-4 rounded-xl bg-spk-blue text-white shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">อุปกรณ์ที่เลือก</p>
                <p className="font-bold text-lg">{selectedDevice.name}</p>
                <p className="text-xs opacity-80">S/N: {selectedDevice.serial_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="card p-6 space-y-6">
            <h3 className="text-lg font-bold text-spk-blue mb-2 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              รายละเอียดปัญหา
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ประเภทปัญหา</label>
              <select
                required
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="input appearance-none"
              >
                <option value="">เลือกประเภทปัญหา...</option>
                <option value="hardware">ฮาร์ดแวร์ (หน้าจอแตก, ปุ่มเสีย, แบตเสื่อม)</option>
                <option value="software">ซอฟต์แวร์ (เครื่องค้าง, แอปเด้ง, อัปเดตไม่ได้)</option>
                <option value="network">เครือข่าย (ต่อ Wi-Fi ไม่ได้, อินเทอร์เน็ตช้า)</option>
                <option value="accessory">อุปกรณ์เสริม (สายชาร์จเสีย, เคสชำรุด)</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รายละเอียดเพิ่มเติม</label>
              <textarea
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="input min-h-[120px] py-4"
                placeholder="อธิบายอาการเสียหรือปัญหาที่พบอย่างละเอียด..."
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">อีเมลติดต่อกลับ</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-12"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รูปภาพประกอบ (ถ้ามี)</label>
              <div className="flex items-center gap-4">
                <label className="flex-grow flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-spk-blue hover:bg-spk-blue/5 transition-all cursor-pointer group">
                  <Camera className="w-5 h-5 text-gray-400 group-hover:text-spk-blue" />
                  <span className="text-sm font-bold text-gray-400 group-hover:text-spk-blue">อัปโหลดรูปภาพ</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                {photo && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedDevice}
              className="w-full bg-spk-blue text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-900 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ส่งรายงานการแจ้งซ่อม
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Service;
