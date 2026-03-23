import { supabase } from './supabaseClient';
import { User, Device, Category, Student, Teacher, ServiceLog, ServiceReport, ActivityLog, Transaction } from '../types';

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour
const CACHEABLE_TABLES = ['categories', 'app_users', 'teachers'];

export const supabaseService = {
  // Generic read function to mimic gasHelper
  async read(tableName: string, options: any = {}): Promise<any> {
    const tableMap: Record<string, string> = {
      'Devices': 'devices',
      'Categories': 'categories',
      'Users': 'app_users',
      'StudentsM4': 'students',
      'StudentsM5': 'students',
      'StudentsM6': 'students',
      'Teachers': 'teachers',
      'serviceLogs': 'service_logs',
      'Service': 'service_reports',
      'Logs': 'activity_logs',
      'Transactions': 'transactions'
    };

    const targetTable = tableMap[tableName] || tableName.toLowerCase();
    
    // Caching logic
    const cacheKey = `spk_cache_read_${targetTable}`;
    if (CACHEABLE_TABLES.includes(targetTable) && !options.searchTerm) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return { success: true, items: cachedData, fromCache: true };
        }
      }
    }

    try {
      let query = supabase.from(targetTable).select('*');

      // Handle pagination
      if (options.limit) {
        const from = options.offset || 0;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      // Handle search (simple implementation)
      if (options.searchTerm) {
        // This is a bit complex in Supabase for generic search across all fields
        // For now, we'll just search in common fields or return all and filter client-side if needed
        // But let's try a basic text search if it's a known table
        if (targetTable === 'devices') {
          query = query.or(`serial_number.ilike.%${options.searchTerm}%,id.ilike.%${options.searchTerm}%`);
        } else if (targetTable === 'students') {
          query = query.or(`full_name.ilike.%${options.searchTerm}%,student_id.ilike.%${options.searchTerm}%`);
        }
      }

      // Handle specific filters for students
      if (tableName === 'StudentsM4') query = query.eq('grade', '4');
      if (tableName === 'StudentsM5') query = query.eq('grade', '5');
      if (tableName === 'StudentsM6') query = query.eq('grade', '6');

      const { data, error, count } = await query;

      if (error) throw error;

      // Map snake_case to camelCase for the app
      const items = data.map((item: any) => this.mapFromDb(targetTable, item));

      // Cache result
      if (CACHEABLE_TABLES.includes(targetTable) && !options.searchTerm) {
        localStorage.setItem(cacheKey, JSON.stringify({ data: items, timestamp: Date.now() }));
      }

      return { success: true, items, total: count || items.length };
    } catch (error: any) {
      console.error(`Supabase Read Error (${targetTable}):`, error.message);
      return { success: false, error: error.message };
    }
  },

  // Helper to map DB fields to App fields
  mapFromDb(table: string, data: any) {
    if (table === 'categories') {
      return {
        category: data.category,
        name: data.name,
        description: data.description,
        designatedFor: data.designated_for,
        imageUrl: data.image_url
      };
    }
    if (table === 'devices') {
      return {
        id: data.id,
        category_id: data.category_id,
        serial_number: data.serial_number,
        defaultAccessories: data.default_accessories,
        is_featured: data.is_featured,
        status: data.status
      };
    }
    if (table === 'teachers') {
      return {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        department: data.department,
        grade: data.grade,
        classroom: data.classroom
      };
    }
    if (table === 'students') {
      return {
        studentId: data.student_id,
        fullName: data.full_name,
        grade: data.grade,
        classroom: data.classroom,
        email: data.email
      };
    }
    if (table === 'app_users') {
      return {
        users: data.username,
        name: data.name,
        role: data.role
      };
    }
    if (table === 'service_reports') {
      return {
        id: data.id,
        deviceId: data.device_id,
        issue_type: data.issue_type,
        details: data.details,
        email: data.email,
        studentName: data.student_name,
        classroom: data.classroom,
        photo_url: data.photo_url,
        reportedAt: data.reported_at,
        status: data.status
      };
    }
    return data;
  },

  // Helper to map App fields to DB fields
  mapToDb(table: string, data: any) {
    if (table === 'categories') {
      return {
        category: data.category,
        name: data.name,
        description: data.description,
        designated_for: data.designatedFor,
        image_url: data.imageUrl
      };
    }
    if (table === 'devices') {
      return {
        id: data.id,
        category_id: data.category_id,
        serial_number: data.serial_number,
        default_accessories: data.defaultAccessories,
        is_featured: data.is_featured,
        status: data.status
      };
    }
    if (table === 'teachers') {
      return {
        id: data.id,
        full_name: data.fullName,
        phone: data.phone,
        department: data.department,
        grade: parseInt(data.grade),
        classroom: parseInt(data.classroom)
      };
    }
    if (table === 'students') {
      return {
        student_id: data.studentId,
        full_name: data.fullName,
        grade: data.grade,
        classroom: data.classroom,
        email: data.email
      };
    }
    if (table === 'app_users') {
      return {
        username: data.users,
        password: data.password,
        name: data.name,
        role: data.role
      };
    }
    return data;
  },

  async login(username: string, password: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };

      return { 
        success: true, 
        data: {
          users: data.username,
          name: data.name,
          role: data.role
        }
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async logActivity(action: string, details: string): Promise<void> {
    try {
      const user = JSON.parse(localStorage.getItem('spk_user') || '{}');
      await supabase.from('activity_logs').insert({
        user_id: user.users || 'System',
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity', error);
    }
  },

  async create(tableName: string, data: any): Promise<any> {
    const tableMap: Record<string, string> = {
      'Devices': 'devices',
      'Categories': 'categories',
      'Users': 'app_users',
      'Students': 'students',
      'Service': 'service_reports'
    };
    const targetTable = tableMap[tableName] || tableName.toLowerCase();
    const dbData = this.mapToDb(targetTable, data);

    try {
      const { data: result, error } = await supabase
        .from(targetTable)
        .insert([dbData])
        .select();

      if (error) throw error;
      
      // Clear cache
      localStorage.removeItem(`spk_cache_read_${targetTable}`);
      
      await this.logActivity(`Add ${tableName}`, `Added new ${tableName}: ${data.name || data.users || data.student_id || 'ID ' + (result?.[0]?.id || '')}`);
      
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async update(tableName: string, id: string, data: any): Promise<any> {
    const tableMap: Record<string, string> = {
      'Devices': 'devices',
      'Categories': 'categories',
      'Users': 'app_users',
      'Students': 'students',
      'Service': 'service_reports'
    };
    const targetTable = tableMap[tableName] || tableName.toLowerCase();
    const dbData = this.mapToDb(targetTable, data);
    
    const idField = targetTable === 'app_users' ? 'username' : 
                    (targetTable === 'students' ? 'student_id' : 
                    (targetTable === 'categories' ? 'category' : 'id'));

    try {
      const { data: result, error } = await supabase
        .from(targetTable)
        .update(dbData)
        .eq(idField, id)
        .select();

      if (error) throw error;
      
      // Clear cache
      localStorage.removeItem(`spk_cache_read_${targetTable}`);
      
      await this.logActivity(`Update ${tableName}`, `Updated ${tableName}: ${data.name || data.users || data.student_id || 'ID ' + id}`);
      
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async delete(tableName: string, id: string): Promise<any> {
    const tableMap: Record<string, string> = {
      'Devices': 'devices',
      'Categories': 'categories',
      'Users': 'app_users',
      'Students': 'students',
      'Service': 'service_reports'
    };
    const targetTable = tableMap[tableName] || tableName.toLowerCase();
    const idField = targetTable === 'app_users' ? 'username' : 
                    (targetTable === 'students' ? 'student_id' : 
                    (targetTable === 'categories' ? 'category' : 'id'));

    try {
      const { error } = await supabase
        .from(targetTable)
        .delete()
        .eq(idField, id);

      if (error) throw error;
      
      // Clear cache
      localStorage.removeItem(`spk_cache_read_${targetTable}`);
      
      await this.logActivity(`Delete ${tableName}`, `Deleted ${tableName} with ID: ${id}`);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // Legacy action handler to support existing code
  async handleAction(action: string, sheetName: string | null, data?: any): Promise<any> {
    if (action === 'read') return this.read(sheetName || '', data);
    if (action === 'login') return this.login(data.users, data.password);
    
    if (action.startsWith('delete')) {
      const entity = action.replace('delete', '');
      return this.delete(entity, data.id);
    }
    
    if (action.startsWith('add')) {
      const entity = action.replace('add', '');
      return this.create(entity, data);
    }
    
    if (action.startsWith('update')) {
      const entity = action.replace('update', '');
      return this.update(entity, data.id, data);
    }

    return { success: false, message: `Unknown action: ${action}` };
  },

  async reportService(data: any): Promise<any> {
    try {
      // 1. Get device ID
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('serial_number', data.serial_number)
        .single();

      if (deviceError || !device) throw new Error('Device not found');

      // 2. Create service report
      const { error: reportError } = await supabase
        .from('service_reports')
        .insert({
          device_id: device.id,
          issue_type: data.issue_type,
          details: data.details,
          email: data.email,
          photo_url: data.photo, // In a real app, you'd upload to Storage first
          status: 'Pending',
          created_at: new Date().toISOString()
        });

      if (reportError) throw reportError;

      await this.logActivity('Service Report', `Reported issue for device S/N: ${data.serial_number}`);

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async borrowDevice(studentId: string, serialNumber: string): Promise<any> {
    try {
      // 1. Get device ID
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id, status')
        .eq('serial_number', serialNumber)
        .single();

      if (deviceError || !device) throw new Error('Device not found');
      if (device.status !== 'Available') throw new Error('Device is not available');

      // 2. Create transaction
      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          device_id: device.id,
          student_id: studentId,
          borrow_date: new Date().toISOString(),
          status: 'Borrowed'
        });

      if (transError) throw transError;

      // 3. Update device status
      const { error: updateError } = await supabase
        .from('devices')
        .update({ status: 'Borrowed' })
        .eq('id', device.id);

      if (updateError) throw updateError;

      await this.logActivity('Borrow Device', `Student ${studentId} borrowed device S/N: ${serialNumber}`);

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  async returnDevice(studentId: string, serialNumber: string): Promise<any> {
    try {
      // 1. Get device ID
      const { data: device, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('serial_number', serialNumber)
        .single();

      if (deviceError || !device) throw new Error('Device not found');

      // 2. Update transaction
      const { error: transError } = await supabase
        .from('transactions')
        .update({
          return_date: new Date().toISOString(),
          status: 'Returned'
        })
        .eq('device_id', device.id)
        .eq('student_id', studentId)
        .eq('status', 'Borrowed');

      if (transError) throw transError;

      // 3. Update device status
      const { error: updateError } = await supabase
        .from('devices')
        .update({ status: 'Available' })
        .eq('id', device.id);

      if (updateError) throw updateError;

      await this.logActivity('Return Device', `Student ${studentId} returned device S/N: ${serialNumber}`);

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};
