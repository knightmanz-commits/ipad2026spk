export const translations = {
  th: {
    dashboard: 'แผงควบคุม',
    inventory: 'คลังอุปกรณ์',
    borrow: 'ยืม-คืน',
    admin: 'ผู้ดูแลระบบ',
    logout: 'ออกจากระบบ',
    welcome: 'ยินดีต้อนรับ',
    total_devices: 'อุปกรณ์ทั้งหมด',
    available: 'ว่าง',
    borrowed: 'ถูกยืม',
    maintenance: 'ซ่อมบำรุง',
    loading: 'กำลังโหลด...',
    login: 'เข้าสู่ระบบ',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    back: 'กลับ',
    start: 'เริ่มต้นใช้งาน',
    admin_login: 'เข้าสู่ระบบผู้ดูแล',
    db_connected: 'เชื่อมต่อฐานข้อมูลแล้ว',
    db_disconnected: 'ไม่ได้เชื่อมต่อฐานข้อมูล',
    service: 'แจ้งซ่อม',
    logs: 'ประวัติการใช้งาน',
    studentsRegistry: 'ทะเบียนรายชื่อ',
  },
  en: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    borrow: 'Borrow-Return',
    admin: 'Admin Panel',
    logout: 'Logout',
    welcome: 'Welcome',
    total_devices: 'Total Devices',
    available: 'Available',
    borrowed: 'Borrowed',
    maintenance: 'Maintenance',
    loading: 'Loading...',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    back: 'Back',
    start: 'Get Started',
    admin_login: 'Admin Login',
    db_connected: 'Database Connected',
    db_disconnected: 'Database Disconnected',
    service: 'Repair Service',
    logs: 'Activity Logs',
    studentsRegistry: 'Students Registry',
  }
};

export const formatThaiDate = (dateStr: string | undefined, includeTime: boolean = false) => {
  if (!dateStr) return '-';
  // Handle yyyy-MM-dd or ISO strings
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let result = `${day} ${month} ${year}`;
  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }
  return result;
};
