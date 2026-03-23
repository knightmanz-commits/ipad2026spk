import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Device, Category, DeviceStatus, TranslationKey } from '../types';
import { Search, Filter, Package, Info, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '../services/supabaseService';
import { formatValue } from '../utils/format';

interface InventoryProps {
  categories: Category[];
  t: (key: TranslationKey) => string;
}

const Inventory: React.FC<InventoryProps> = ({ categories, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [items, setItems] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + limit);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDevices = useCallback(async (isNewSearch = false) => {
    setIsLoading(true);
    try {
      const currentOffset = isNewSearch ? 0 : offset;
      const res = await supabaseService.read('Devices', {
        offset: currentOffset,
        limit: limit,
        searchTerm: debouncedSearch
      });

      if (res.success) {
        const newItems = (res.items as Device[]).map(d => {
          const cat = categories.find(c => c.category === d.category_id);
          return {
            ...d,
            name: cat?.name || 'Unknown Device',
            categoryName: cat?.name,
            imageUrl: cat?.imageUrl,
            designatedFor: cat?.designatedFor
          };
        });

        if (isNewSearch) {
          setItems(newItems);
        } else {
          setItems(prev => [...prev, ...newItems]);
        }
        
        setTotal(res.total);
        setHasMore(items.length + newItems.length < res.total);
      }
    } catch (error) {
      console.error('Failed to fetch devices', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, offset, categories, items.length]);

  // Reset and fetch on search/filter change
  useEffect(() => {
    setOffset(0);
    fetchDevices(true);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  // Fetch more on offset change
  useEffect(() => {
    if (offset > 0) {
      fetchDevices(false);
    }
  }, [offset]);

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.Available:
        return <span className="badge bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3" /> {t('available')}</span>;
      case DeviceStatus.Borrowed:
        return <span className="badge bg-blue-100 text-blue-700 border-blue-200"><RefreshCw className="w-3 h-3" /> {t('borrowed')}</span>;
      case DeviceStatus.Maintenance:
        return <span className="badge bg-orange-100 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3" /> {t('maintenance')}</span>;
      case DeviceStatus.Lost:
        return <span className="badge bg-red-100 text-red-700 border-red-200"><AlertCircle className="w-3 h-3" /> {t('lost')}</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-700 border-gray-200">{status}</span>;
    }
  };

  // Client-side filtering for category and status (since server only does text search for now)
  const filteredItems = useMemo(() => {
    return items.filter(device => {
      const matchesCategory = selectedCategory === 'all' || device.category_id === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [items, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('inventory')}</h2>
          <p className="text-gray-500">รายการอุปกรณ์ทั้งหมด ({total} รายการ)</p>
        </div>
        {isLoading && <Loader2 className="w-6 h-6 animate-spin text-spk-blue mb-2" />}
      </header>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, S/N, หรือเลขครุภัณฑ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input pl-12 appearance-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.category} value={cat.category}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input pl-12 appearance-none"
            >
              <option value="all">ทุกสถานะ</option>
              {Object.values(DeviceStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((device, index) => (
            <motion.div
              key={device.serial_number + '-' + index}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              ref={index === filteredItems.length - 1 ? lastElementRef : null}
              className="card group hover:shadow-xl transition-all border-transparent hover:border-spk-yellow/30"
            >
              <div className="relative aspect-square mb-4 bg-spk-gray rounded-xl overflow-hidden flex items-center justify-center">
                {device.image_url ? (
                  <img 
                    src={device.image_url} 
                    alt={device.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(device.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-spk-blue truncate" title={device.name}>{formatValue(device.name)}</h3>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Serial Number</p>
                  <p className="text-sm font-medium text-gray-700 font-mono">{formatValue(device.serial_number)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {categories.find(c => c.category === device.category_id)?.name || 'ไม่ระบุหมวดหมู่'}
                </span>
                <button className="p-2 hover:bg-spk-gray rounded-lg transition-colors text-spk-blue cursor-pointer">
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {isLoading && filteredItems.length > 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-spk-blue" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="card py-20 text-center">
          <Package className="w-20 h-20 mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-400">ไม่พบอุปกรณ์ที่ค้นหา</h3>
          <p className="text-gray-400 mt-2">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;
