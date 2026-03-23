export const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'ยังไม่ระบุ';
  }
  return value.toString();
};

export const formatDate = (dateStr: string | Date | undefined, includeTime: boolean = false): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr.toString();

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  let result = `${day}-${month}-${year}`;
  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }
  return result;
};
