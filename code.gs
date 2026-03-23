/**
 * ICT Inventory System - Google Apps Script Backend
 * Deploy as Web App:
 * 1. Click "Deploy" > "New deployment"
 * 2. Select type: "Web app"
 * 3. Execute as: "Me"
 * 4. Who has access: "Anyone"
 */

const CONFIG = {
  SPREADSHEET_ID: '1_pwgicJEs0Vk_5m-m40F8RYPS672_GSA0kptrz_Ib4c',
  UPLOAD_FOLDER_ID: '1YOccTHgmK8R4QAW89PLtcvMFb8DAMu7t',
};

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, sheetName, data, currentUser } = request;
    
    let result;
    const actionLower = action.toLowerCase();
    
    if (actionLower.startsWith('read')) {
      const { offset, limit, searchTerm } = data || {};
      result = readData(sheetName || action.replace('read', ''), offset, limit, searchTerm);
    } else if (actionLower.startsWith('add') || actionLower.startsWith('append')) {
      result = appendData(sheetName || action.replace('add', '').replace('append', ''), data, currentUser);
    } else if (actionLower.startsWith('update')) {
      result = updateData(sheetName || action.replace('update', ''), data, currentUser);
    } else if (actionLower.startsWith('delete')) {
      result = deleteData(sheetName || action.replace('delete', ''), data, currentUser);
    } else {
      switch (action) {
        case 'login':
          result = login(data);
          break;
        case 'borrowDevice':
          result = borrowDevice(data, currentUser);
          break;
        case 'returnDevice':
          result = returnDevice(data, currentUser);
          break;
        case 'reportService':
          result = reportService(data);
          break;
        case 'verifyStudent':
          result = verifyStudent(data);
          break;
        default:
          throw new Error('Invalid action: ' + action);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readData(sheetName, offset = 0, limit = null, searchTerm = '') {
  const sheet = getOrCreateSheet(sheetName);
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { items: [], total: 0 };
  
  const headers = values[0];
  let rows = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  // Server-side filtering
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    rows = rows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchLower)
      );
    });
  }

  const total = rows.length;

  // Pagination
  if (limit !== null) {
    rows = rows.slice(offset, offset + limit);
  }

  return { items: rows, total: total };
}

function appendData(sheetName, data, currentUser) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => data[header] || '');
  sheet.appendRow(row);
  
  logAction(currentUser ? currentUser.name : 'System', 'Append', sheetName, JSON.stringify(data));
  return { success: true };
}

function updateData(sheetName, data, currentUser) {
  const sheet = getOrCreateSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id') !== -1 ? headers.indexOf('id') : headers.indexOf('serial_number');
  
  if (idIndex === -1) throw new Error('No ID or Serial Number column found');
  
  const idToFind = data.id || data.serial_number;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] == idToFind) {
      const row = headers.map(header => data[header] !== undefined ? data[header] : values[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      logAction(currentUser ? currentUser.name : 'System', 'Update', sheetName, `ID: ${idToFind}`);
      return { success: true };
    }
  }
  throw new Error('Record not found');
}

function deleteData(sheetName, data, currentUser) {
  const sheet = getOrCreateSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id') !== -1 ? headers.indexOf('id') : headers.indexOf('serial_number');
  
  const idToFind = data.id || data.serial_number;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex] == idToFind) {
      sheet.deleteRow(i + 1);
      logAction(currentUser ? currentUser.name : 'System', 'Delete', sheetName, `ID: ${idToFind}`);
      return { success: true };
    }
  }
  throw new Error('Record not found');
}

function login(data) {
  const users = readData('Users');
  const user = users.find(u => u.users === data.users && u.password === data.password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  throw new Error('Invalid username or password');
}

function verifyStudent(data) {
  const sheets = ['StudentsM4', 'StudentsM5', 'StudentsM6'];
  for (const name of sheets) {
    const students = readData(name);
    const student = students.find(s => String(s.studentId || s['รหัสนักเรียน']) === String(data.studentId));
    if (student) return student;
  }
  return null;
}

function borrowDevice(data, currentUser) {
  const devices = readData('Devices');
  const device = devices.find(d => d.serial_number === data.serial_number);
  if (!device) throw new Error('Device not found');
  if (device.status !== 'Available') throw new Error('Device is not available');
  
  device.status = 'Borrowed';
  device.borrowedBy = data.studentId;
  updateData('Devices', device, currentUser);
  
  const transaction = {
    id: Utilities.getUuid(),
    serial_number: data.serial_number,
    studentId: data.studentId,
    borrow_date: new Date().toISOString(),
    status: 'Borrowed'
  };
  appendData('Transactions', transaction, currentUser);
  
  logAction(currentUser ? currentUser.name : 'System', 'Borrow', 'Device', `S/N: ${data.serial_number} to ${data.studentId}`);
  return { success: true };
}

function returnDevice(data, currentUser) {
  const devices = readData('Devices');
  const device = devices.find(d => d.serial_number === data.serial_number);
  if (!device) throw new Error('Device not found');
  
  device.status = 'Available';
  device.borrowedBy = '';
  updateData('Devices', device, currentUser);
  
  const transactions = readData('Transactions');
  const transaction = transactions.find(t => t.serial_number === data.serial_number && t.status === 'Borrowed');
  if (transaction) {
    transaction.status = 'Returned';
    transaction.return_date = new Date().toISOString();
    updateData('Transactions', transaction, currentUser);
  }
  
  logAction(currentUser ? currentUser.name : 'System', 'Return', 'Device', `S/N: ${data.serial_number}`);
  return { success: true };
}

function reportService(data) {
  const report = {
    id: Utilities.getUuid(),
    ...data,
    reportedAt: new Date().toISOString(),
    status: 'Pending'
  };
  appendData('Service', report, null);
  return { success: true };
}

function logAction(user, action, target, details) {
  const sheet = getOrCreateSheet('Logs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'timestamp', 'user_id', 'action', 'details']);
  }
  sheet.appendRow([
    Utilities.getUuid(),
    new Date().toISOString(),
    user,
    action + ' ' + target,
    details
  ]);
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add default headers
    if (name === 'Devices') sheet.appendRow(['serial_number', 'category_id', 'status', 'notes', 'borrowedBy']);
    if (name === 'Categories') sheet.appendRow(['id', 'name', 'description', 'designatedFor', 'imageUrl']);
    if (name === 'Users') {
      sheet.appendRow(['users', 'password', 'name', 'role']);
      // Add default admin
      sheet.appendRow(['admin', 'spkadmin', 'Administrator', 'Admin']);
    }
    if (name === 'Transactions') sheet.appendRow(['id', 'serial_number', 'studentId', 'borrow_date', 'return_date', 'status']);
    if (name === 'Service') sheet.appendRow(['id', 'studentId', 'studentName', 'classroom', 'issue_type', 'details', 'photo_url', 'email', 'reportedAt', 'status']);
    if (name === 'Logs') sheet.appendRow(['id', 'timestamp', 'user_id', 'action', 'details']);
  } else if (name === 'Users' && sheet.getLastRow() <= 1) {
    // If sheet exists but is empty (only headers), add default admin
    sheet.appendRow(['admin', 'spkadmin', 'Administrator', 'Admin']);
  }
  return sheet;
}

