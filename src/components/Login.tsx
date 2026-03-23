import React, { useState } from 'react';
import { User, TranslationKey } from '../types';
import { gasHelper } from '../services/gasService';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
  t: (key: TranslationKey) => string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, t }) => {
  const [users, setUsers] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await gasHelper('login', null, { users, password });
      if (result.success) {
        onLogin(result.data as User);
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-spk-blue relative overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255, 204, 0, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 40%)'
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-spk-yellow/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-t-8 border-spk-yellow">
          <div className="p-8 md:p-12 relative">
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute top-6 left-6 p-2 hover:bg-spk-gray rounded-xl transition-colors text-gray-400 hover:text-spk-blue group cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-spk-gray rounded-2xl mb-6 shadow-inner">
                <img src="https://www.spk.ac.th/home/wp-content/uploads/2025/10/spk-logo-png-new-1.png" alt="SPK Logo" className="w-14 h-14" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-3xl font-extrabold text-spk-blue tracking-tight">ICT Inventory</h1>
              <p className="text-gray-400 mt-2 font-medium">ระบบบริหารจัดการครุภัณฑ์ ICT</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ไอดีผู้ใช้งาน</label>
                <div className="relative">
                  <input
                    type="text"
                    value={users}
                    onChange={(e) => setUsers(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-spk-gray border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-spk-blue outline-none transition-all font-medium"
                    placeholder="Login ID"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-spk-gray border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-spk-blue outline-none transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-spk-blue text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-900 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {t('login')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-300">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Authentication System</span>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-white/40 text-xs font-medium">
          Developed by ศูนย์ ไอซีที โรงเรียนสารคามพิทยาคม
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
