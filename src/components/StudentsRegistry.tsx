import React, { useState, useMemo } from 'react';
import { Student, Teacher, TranslationKey } from '../types';
import { Search, Users, Filter, ChevronLeft, ChevronRight, GraduationCap, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentsRegistryProps {
  students: Student[];
  teachers: Teacher[];
  t: (key: TranslationKey) => string;
}

const StudentsRegistry: React.FC<StudentsRegistryProps> = ({ students, teachers, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.includes(searchTerm);
      
      const matchesGrade = selectedGrade === 'all' || student.grade.toString() === selectedGrade;

      return matchesSearch && matchesGrade;
    });
  }, [students, searchTerm, selectedGrade]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTeacherForClass = (grade: number, room: number) => {
    return teachers.find(t => t.grade === grade && t.room === room);
  };

  const grades = Array.from(new Set(students.map(s => Number(s.grade)))).sort((a, b) => (a as number) - (b as number));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('studentsRegistry')}</h2>
          <p className="text-gray-500">ทะเบียนรายชื่อนักเรียนและครูที่ปรึกษา</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัส..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input pl-12"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setCurrentPage(1); }}
              className="input pl-12 appearance-none"
            >
              <option value="all">ทุกระดับชั้น</option>
              {grades.map(grade => (
                <option key={grade} value={grade.toString()}>มัธยมศึกษาปีที่ {grade}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {currentStudents.map((student, index) => {
            const teacher = getTeacherForClass(student.grade, student.room);
            return (
              <motion.div
                key={student.student_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="card group hover:shadow-xl transition-all border-transparent hover:border-spk-yellow/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-spk-gray flex items-center justify-center text-spk-blue font-bold text-xl shadow-inner group-hover:bg-spk-yellow/20 transition-colors">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-bold text-gray-800 truncate group-hover:text-spk-blue transition-colors">{student.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">รหัส: {student.student_id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <GraduationCap className="w-3 h-3 text-spk-blue" />
                      <span className="text-xs font-bold text-spk-blue">ชั้น ม.{student.grade}/{student.room}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <User className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ครูที่ปรึกษา</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {teacher ? teacher.name : 'ไม่พบข้อมูลครูที่ปรึกษา'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredStudents.length === 0 && (
        <div className="card py-20 text-center">
          <Users className="w-20 h-20 mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-400">ไม่พบรายชื่อนักเรียน</h3>
          <p className="text-gray-400 mt-2">ลองเปลี่ยนคำค้นหาหรือระดับชั้น</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:bg-spk-gray transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-bold transition-all cursor-pointer ${
                  currentPage === page 
                    ? "bg-spk-blue text-white shadow-lg" 
                    : "bg-white text-gray-400 border border-gray-200 hover:bg-spk-gray"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-30 hover:bg-spk-gray transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentsRegistry;
