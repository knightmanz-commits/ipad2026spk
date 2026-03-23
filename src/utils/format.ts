export const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'ยังไม่ระบุ';
  }
  return value.toString();
};
