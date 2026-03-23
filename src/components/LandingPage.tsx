import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  Info, 
  BookOpen, 
  Phone, 
  Mail, 
  Globe,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
  onAdminLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onAdminLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFooter = () => {
    const footer = document.querySelector('footer');
    footer?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sarabun selection:bg-spk-yellow selection:text-spk-blue">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-spk-yellow rounded-2xl flex items-center justify-center shadow-lg shadow-spk-yellow/20">
              <img src="https://www.spk.ac.th/home/wp-content/uploads/2025/10/spk-logo-png-new-1.png" alt="SPK Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
            </div>
            <div className={isScrolled ? 'text-spk-blue' : 'text-white'}>
              <h1 className="text-xl font-black leading-none tracking-tight">ICT SPK</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Inventory System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAdminLogin}
              className="flex items-center gap-2 bg-spk-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-spk-blue/20 hover:bg-blue-900 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              เข้าสู่ระบบเจ้าหน้าที่
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-spk-blue">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spk-yellow/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-8 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-spk-yellow animate-pulse"></span>
              ICT Center SPK
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tighter">
              ICT <span className="text-spk-yellow">INVENTORY</span> SYSTEM
            </h1>
            <p className="text-lg text-white/70 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              ระบบบริหารจัดการครุภัณฑ์และอุปกรณ์เทคโนโลยีสารสนเทศ โรงเรียนสารคามพิทยาคม
            </p>
            
            {/* Topic Navigation Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { id: 'report', label: 'แจ้งซ่อม/ปัญหา', icon: Wrench },
                { id: 'products', label: 'ข้อมูลครุภัณฑ์', icon: Info },
                { id: 'rules', label: 'ระเบียบการยืม', icon: BookOpen },
                { id: 'contact', label: 'ติดต่อเรา', icon: Phone },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={scrollToFooter}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group text-center cursor-pointer"
                >
                  <div className="w-12 h-12 bg-spk-yellow rounded-2xl flex items-center justify-center text-spk-blue mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-white font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spk-blue py-20 text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-spk-yellow rounded-2xl flex items-center justify-center shadow-lg">
                  <img src="https://www.spk.ac.th/home/wp-content/uploads/2025/10/spk-logo-png-new-1.png" alt="SPK Logo" className="w-8 h-8" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-2xl font-black leading-none">ICT CENTER SPK</h2>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Sarakhampittayakhom School</p>
                </div>
              </div>
              <p className="text-white/60 font-medium max-w-md leading-relaxed">
                มุ่งเน้นการให้บริการด้านเทคโนโลยีสารสนเทศที่มีคุณภาพ เพื่อส่งเสริมการเรียนรู้ในยุคดิจิทัลอย่างยั่งยืน
              </p>
              <div className="mt-8 space-y-2 text-white/60 text-sm font-medium">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-spk-yellow" /> 043-711585 ต่อ 105</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-spk-yellow" /> ict@spk.ac.th</p>
                <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-spk-yellow" /> www.spk.ac.th</p>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-black mb-8 text-spk-yellow">เมนูหลัก</h4>
              <ul className="space-y-4 text-white/60 font-bold">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">หน้าแรก</button></li>
                <li><button onClick={onStart} className="hover:text-white transition-colors">เข้าสู่ระบบยืม-คืน</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-white/40 text-xs font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} ICT CENTER SPK. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-14 h-14 bg-spk-yellow text-spk-blue rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
          >
            <ChevronDown className="w-8 h-8 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
