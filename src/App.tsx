import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import { 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  UserPlus, 
  Moon, 
  Sun, 
  FileText, 
  AlertCircle, 
  Activity, 
  User, 
  History, 
  ChevronRight, 
  ChevronLeft,
  Download, 
  Edit, 
  Stethoscope, 
  FlaskConical, 
  Scan, 
  Settings, 
  Plus, 
  Trash2, 
  Heart, 
  Thermometer, 
  Pill, 
  Microscope, 
  Syringe, 
  Clipboard, 
  Calendar, 
  Phone, 
  MapPin, 
  LogOut, 
  ArrowUp, 
  ArrowDown, 
  Hash, 
  List, 
  Type, 
  AlignLeft, 
  X,
  QrCode,
  Printer,
  Barcode as BarcodeIcon,
  Upload,
  File,
  Paperclip,
  FileImage,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Types
import { Patient, MedicalRecord, DashboardStats, SystemSettings, QuickAction, Department, Attachment } from './types';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const PrintSlip = ({ patient, settings }: { patient: Patient, settings: SystemSettings }) => {
  const pSettings = settings.printSettings;
  if (!pSettings) return null;

  return (
    <div id="print-slip" className="hidden print:block p-4 bg-white text-black font-sans" dir="rtl">
      {/* Header with Barcode in Center */}
      <div className="flex flex-col items-center justify-center mb-6 border-b-2 border-slate-900 pb-6">
        <div className="mb-4">
          <Barcode 
            value={patient.id.toString()} 
            width={1.5} 
            height={60} 
            fontSize={14}
            background="#ffffff"
            lineColor="#000000"
          />
        </div>
        <h1 className="text-3xl font-black tracking-widest uppercase mb-1">{pSettings.clinicName}</h1>
        <p className="text-base font-bold text-slate-600">بطاقة مراجعة طبية</p>
      </div>
      
      {/* Patient Info Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-3">
          <div className="border-r-4 border-slate-900 pr-3">
            <p className="text-[10px] text-slate-500 font-bold mb-0.5">{settings.basicLabels?.full_name || 'الاسم الكامل'}</p>
            <p className="text-xl font-black">{patient.full_name}</p>
          </div>
          
          {pSettings.showPhone && (
            <div className="border-r-4 border-slate-400 pr-3">
              <p className="text-[10px] text-slate-500 font-bold mb-0.5">{settings.basicLabels?.phone || 'رقم الهاتف'}</p>
              <p className="text-lg font-bold">{patient.phone}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="border-r-4 border-slate-900 pr-3">
            <p className="text-[10px] text-slate-500 font-bold mb-0.5">الرقم التعريفي (ID)</p>
            <p className="text-xl font-black tracking-tighter">{patient.id}</p>
          </div>

          {pSettings.showStatus && (
            <div className="border-r-4 border-slate-400 pr-3">
              <p className="text-[10px] text-slate-500 font-bold mb-0.5">{settings.basicLabels?.status || 'الحالة الصحية'}</p>
              <p className="text-lg font-bold">
                {patient.status === 'Stable' ? 'مستقر' : patient.status === 'Emergency' ? 'طوارئ' : 'متابعة'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Fields Section */}
      {pSettings.showCustomFields && settings.patientFields.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-black border-b border-slate-200 mb-3 pb-1">تفاصيل إضافية</h3>
          <div className="grid grid-cols-2 gap-4">
            {settings.patientFields.map(field => (
              <div key={field.id} className="flex justify-between items-center border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-600 text-xs">{field.name}:</span>
                <span className="font-medium text-xs">{patient.custom_data?.[field.id] || '---'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-0.5 text-[10px]">
            <p className="font-bold">{pSettings.clinicAddress}</p>
            <p className="font-bold">هاتف: {pSettings.clinicPhone}</p>
            {pSettings.showDate && (
              <p className="text-slate-500">تاريخ الإصدار: {new Date(patient.created_at).toLocaleString('ar-EG')}</p>
            )}
          </div>
        </div>
        
        <div className="text-center bg-slate-900 text-white p-3 rounded-lg">
          <p className="text-[10px] font-bold">{pSettings.footerNote}</p>
        </div>
      </div>
    </div>
  );
};

const FileUpload = ({ 
  onUpload, 
  category = 'Other', 
  label = 'إرفاق ملفات',
  multiple = true 
}: { 
  onUpload: (attachment: Attachment) => void, 
  category?: Attachment['category'],
  label?: string,
  multiple?: boolean
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        onUpload(data);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2 text-center",
        dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50",
        uploading && "opacity-50 pointer-events-none"
      )}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
        {uploading ? <Activity className="animate-spin" size={24} /> : <Upload size={24} />}
      </div>
      <div>
        <p className="font-black text-slate-700 dark:text-slate-300 text-sm">{label}</p>
        <p className="text-[10px] text-slate-400 font-bold mt-1">اسحب الملف هنا أو اضغط للاختيار</p>
      </div>
    </div>
  );
};

const AttachmentList = ({ 
  attachments, 
  onRemove 
}: { 
  attachments: Attachment[], 
  onRemove?: (id: number) => void 
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {attachments.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
              {file.file_type.includes('image') ? <FileImage size={20} /> : <FileText size={20} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.file_name}</p>
              <p className="text-[10px] text-slate-400 font-bold">{(file.file_size / 1024).toFixed(1)} KB • {file.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a 
              href={file.file_path} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Eye size={16} />
            </a>
            {onRemove && (
              <button 
                onClick={() => onRemove(file.id)}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const SelectableInput = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder,
  isTextArea = false
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  options: string[], 
  placeholder?: string,
  isTextArea?: boolean
}) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1 dark:text-slate-300">{label}</label>
      <div className="flex gap-1">
        {isTextArea ? (
          <textarea 
            className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <input 
            className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
        <button 
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="px-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
      
      <AnimatePresence>
        {showOptions && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto"
            >
              <div className="p-2 grid grid-cols-1 gap-1">
                {options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setShowOptions(false);
                    }}
                    className="text-right p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm dark:text-slate-200"
                  >
                    {opt}
                  </button>
                ))}
                {options.length === 0 && <p className="text-center text-xs text-slate-500 p-2">لا توجد خيارات مضافة</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const AllPatientsView = ({ settings, onSelectPatient }: { settings: SystemSettings, onSelectPatient: (id: number) => void }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    gender: '',
    department: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/patients?${params.toString()}`);
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [filters]);

  const months = [
    { value: '01', label: 'يناير' }, { value: '02', label: 'فبراير' }, { value: '03', label: 'مارس' },
    { value: '04', label: 'أبريل' }, { value: '05', label: 'مايو' }, { value: '06', label: 'يونيو' },
    { value: '07', label: 'يوليو' }, { value: '08', label: 'أغسطس' }, { value: '09', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' }, { value: '11', label: 'نوفمبر' }, { value: '12', label: 'ديسمبر' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">سجل المرضى العام</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">عرض وتصفية كافة المرضى المسجلين في النظام</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الشهر</label>
          <select 
            className="w-full p-3 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
            value={filters.month}
            onChange={e => setFilters({...filters, month: e.target.value})}
          >
            <option value="">كل الشهور</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">السنة</label>
          <select 
            className="w-full p-3 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
            value={filters.year}
            onChange={e => setFilters({...filters, year: e.target.value})}
          >
            <option value="">كل السنين</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الجنس</label>
          <select 
            className="w-full p-3 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
            value={filters.gender}
            onChange={e => setFilters({...filters, gender: e.target.value})}
          >
            <option value="">الكل</option>
            <option value="Male">ذكر</option>
            <option value="Female">أنثى</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">القسم</label>
          <select 
            className="w-full p-3 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
            value={filters.department}
            onChange={e => setFilters({...filters, department: e.target.value})}
          >
            <option value="">كل الأقسام</option>
            {settings.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-400 animate-pulse font-bold">جاري تحميل البيانات...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">المريض</th>
                  <th className="px-8 py-5">رقم الهاتف</th>
                  <th className="px-8 py-5">الجنس</th>
                  <th className="px-8 py-5">الحالة</th>
                  <th className="px-8 py-5">تاريخ التسجيل</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-black text-lg border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                          {patient.full_name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{patient.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter">ID: {patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">{patient.phone}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {patient.gender === 'Male' ? 'ذكر' : patient.gender === 'Female' ? 'أنثى' : '---'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                        patient.status === 'Stable' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        patient.status === 'Emergency' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {patient.status === 'Stable' ? 'مستقر' : patient.status === 'Emergency' ? 'طوارئ' : 'متابعة'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{format(new Date(patient.created_at), 'yyyy/MM/dd')}</span>
                    </td>
                    <td className="px-8 py-6 text-left">
                      <button 
                        onClick={() => onSelectPatient(patient.id)}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Search size={48} />
                        <p className="font-bold text-slate-500">لا توجد نتائج تطابق الفلاتر المختارة</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ stats, onViewAll }: { stats: DashboardStats, onViewAll: () => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Stats Cards */}
    <button 
      onClick={onViewAll}
      className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden text-right"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">إجمالي المرضى</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">{stats.totalPatients}</h3>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
          <User size={32} strokeWidth={2.5} />
        </div>
      </div>
    </button>
    
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 group hover:shadow-xl hover:shadow-green-500/5 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">زيارات اليوم</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">{stats.visitsToday}</h3>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-inner">
          <Stethoscope size={32} strokeWidth={2.5} />
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 group hover:shadow-xl hover:shadow-red-500/5 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">حالات الطوارئ</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">{stats.emergencyCount}</h3>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-inner">
          <AlertCircle size={32} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  </div>
);

const RecentRegistrations = ({ patients, onSelectPatient }: { patients: Patient[], onSelectPatient: (id: number) => void }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <History size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black dark:text-white">أحدث التسجيلات</h3>
          <p className="text-xs text-slate-500 font-bold mt-0.5">آخر 5 مرضى تم تسجيلهم في النظام</p>
        </div>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            <th className="px-8 py-5">المريض</th>
            <th className="px-8 py-5">رقم الهاتف</th>
            <th className="px-8 py-5">الحالة</th>
            <th className="px-8 py-5">التوقيت</th>
            <th className="px-8 py-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {patients?.map((patient) => (
            <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-black text-lg border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                    {patient.full_name[0]}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{patient.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter">ID: {patient.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 tabular-nums">{patient.phone}</span>
              </td>
              <td className="px-8 py-6">
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                  patient.status === 'Stable' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  patient.status === 'Emergency' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                  {patient.status === 'Stable' ? 'مستقر' : patient.status === 'Emergency' ? 'طوارئ' : 'متابعة'}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{format(new Date(patient.created_at), 'HH:mm')}</span>
                  <span className="text-[10px] font-bold text-slate-400">{format(new Date(patient.created_at), 'yyyy/MM/dd')}</span>
                </div>
              </td>
              <td className="px-8 py-6 text-left">
                <button 
                  onClick={() => onSelectPatient(patient.id)}
                  className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </td>
            </tr>
          ))}
          {(!patients || patients.length === 0) && (
            <tr>
              <td colSpan={5} className="px-8 py-20 text-center">
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <History size={48} />
                  <p className="font-bold text-slate-500">لا يوجد تسجيلات حديثة حتى الآن</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const PatientRegistration = ({ onComplete, settings }: { onComplete: (id: number) => void, settings: SystemSettings }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    status: 'Stable',
    gender: 'Male' as 'Male' | 'Female'
  });
  const [customData, setCustomData] = useState<any>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [includeInitialRecord, setIncludeInitialRecord] = useState(false);
  const [recordData, setRecordData] = useState<any>({
    doctor_name: '',
    department: settings.departments[0]?.id || '',
    custom_data: {},
    attachments: []
  });
  const [error, setError] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (registeredPatient && settings.printSettings?.autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [registeredPatient, settings.printSettings?.autoPrint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          custom_data: customData,
          attachmentIds: attachments.map(a => a.id),
          initial_record: includeInitialRecord ? {
            ...recordData,
            attachmentIds: recordData.attachments.map((a: any) => a.id)
          } : null 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRegisteredPatient(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('حدث خطأ أثناء التسجيل');
    }
  };

  if (registeredPatient) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarcodeIcon size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">تم تسجيل المريض بنجاح!</h2>
          <p className="text-slate-500 dark:text-slate-400">تم إنشاء الملف الطبي والرقم التعريفي للمريض بنجاح. يمكنك الآن طباعة بطاقة المراجعة.</p>
          
          <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <Barcode value={registeredPatient.id.toString()} width={2} height={80} fontSize={16} />
            </div>
            <div className="text-center">
              <p className="font-bold text-xl dark:text-white">{registeredPatient.full_name}</p>
              <p className="text-slate-500">{registeredPatient.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-5 rounded-2xl transition-all shadow-lg"
            >
              <Printer size={20} /> طباعة البطاقة
            </button>
            <button 
              onClick={() => onComplete(registeredPatient.id)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-5 rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20"
            >
              عرض الملف الطبي <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <PrintSlip patient={registeredPatient} settings={settings} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">تسجيل مريض جديد</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">أدخل بيانات المريض الأساسية لفتح ملف طبي جديد</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.full_name || 'الاسم الكامل'}</label>
              <input 
                required
                className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="أدخل الاسم الرباعي..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.phone || 'رقم الهاتف'}</label>
              <input 
                required
                className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الجنس</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, gender: 'Male'})}
                  className={cn(
                    "p-4 rounded-2xl border font-black transition-all",
                    formData.gender === 'Male' 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                  )}
                >ذكر</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, gender: 'Female'})}
                  className={cn(
                    "p-4 rounded-2xl border font-black transition-all",
                    formData.gender === 'Female' 
                      ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                  )}
                >أنثى</button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.status || 'الحالة'}</label>
              <select 
                className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="Stable">مستقر</option>
                <option value="Emergency">طوارئ</option>
                <option value="Follow-up">متابعة</option>
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black mb-6 dark:text-white flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
              الأوراق الطبية والمرفقات
            </h3>
            <FileUpload 
              onUpload={(a) => setAttachments([...attachments, a])} 
              category="Other"
              label="إرفاق أوراق طبية (اختياري)"
            />
            <AttachmentList 
              attachments={attachments} 
              onRemove={(id) => setAttachments(attachments.filter(a => a.id !== id))} 
            />
          </div>

          {settings.patientFields?.length > 0 && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black mb-6 dark:text-white">بيانات إضافية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {settings.patientFields.map(field => (
                  <div key={field.id} className={cn("space-y-3", field.isTextArea && "md:col-span-2")}>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                      {field.name} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select 
                        required={field.required}
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                        value={customData[field.id] || ''}
                        onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                      >
                        <option value="">اختر...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.isTextArea ? (
                      <textarea 
                        required={field.required}
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold min-h-[120px]"
                        value={customData[field.id] || ''}
                        onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                      />
                    ) : (
                      <input 
                        required={field.required}
                        type={field.type || 'text'}
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                        value={customData[field.id] || ''}
                        onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                includeInitialRecord ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              )}>
                <Clipboard size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black dark:text-white">فتح سجل زيارة فوري</h3>
                <p className="text-xs text-slate-500 font-bold">إضافة أول سجل طبي للمريض عند التسجيل</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIncludeInitialRecord(!includeInitialRecord)}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                includeInitialRecord ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                includeInitialRecord ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {includeInitialRecord && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم الطبيب</label>
                  <input 
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                    value={recordData.doctor_name}
                    onChange={e => setRecordData({...recordData, doctor_name: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">القسم</label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                    value={recordData.department}
                    onChange={e => setRecordData({...recordData, department: e.target.value})}
                  >
                    {settings.departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-black mb-4 dark:text-white">المرفقات الطبية</h4>
                <FileUpload 
                  onUpload={(a) => setRecordData({ ...recordData, attachments: [...recordData.attachments, a] })} 
                  category="Other"
                  label="إرفاق تحاليل أو أشعة"
                />
                <AttachmentList 
                  attachments={recordData.attachments} 
                  onRemove={(id) => setRecordData({ ...recordData, attachments: recordData.attachments.filter((a: any) => a.id !== id) })} 
                />
              </div>
            </motion.div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-xl hover:scale-[1.01] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4"
        >
          <UserPlus size={28} />
          إتمام عملية التسجيل
        </button>
      </form>
    </div>
  );
};

const PatientSearch = ({ onSelect, settings }: { onSelect: (id: number) => void, settings: SystemSettings }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      const res = await fetch(`/api/patients/search?query=${query}`);
      const data = await res.json();
      setResults(data);
      setIsSearching(false);
      
      if (data.length === 1 && data[0].id.toString() === query) {
        onSelect(data[0].id);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">البحث عن مريض</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">ابحث بالاسم، رقم الهاتف، أو الرقم التعريفي</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Search size={24} />
        </div>
        <input 
          autoFocus
          className="w-full p-6 pr-16 rounded-3xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-xl shadow-sm"
          placeholder="ابدأ الكتابة للبحث..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {isSearching && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {results.map((patient) => (
            <motion.button
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelect(patient.id)}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-right"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black dark:text-white group-hover:text-blue-600 transition-colors">{patient.full_name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm font-bold text-slate-400 tabular-nums">ID: {patient.id}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-sm font-bold text-slate-400 tabular-nums">{patient.phone}</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronLeft size={24} />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {query.length >= 2 && results.length === 0 && !isSearching && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Search size={40} />
            </div>
            <p className="text-slate-500 font-bold">لم يتم العثور على نتائج لـ "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EditPatientForm = ({ patient, onCancel, onSuccess, settings }: { patient: Patient, onCancel: () => void, onSuccess: () => void, settings: SystemSettings }) => {
  const [formData, setFormData] = useState({ 
    full_name: patient.full_name,
    phone: patient.phone,
    status: patient.status,
    gender: (patient as any).gender || 'Male'
  });
  const [customData, setCustomData] = useState<any>(patient.custom_data || {});
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          custom_data: customData
        })
      });
      if (res.ok) onSuccess();
      else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحديث');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Edit size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">تعديل بيانات المريض</h2>
          <p className="text-xs text-slate-500 font-bold">تحديث المعلومات الأساسية والمخصصة</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.full_name || 'الاسم الكامل'}</label>
            <input 
              required
              className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.phone || 'رقم الهاتف'}</label>
            <input 
              required
              className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الجنس</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, gender: 'Male'})}
                className={cn(
                  "p-4 rounded-2xl border font-black transition-all",
                  formData.gender === 'Male' 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                )}
              >ذكر</button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, gender: 'Female'})}
                className={cn(
                  "p-4 rounded-2xl border font-black transition-all",
                  formData.gender === 'Female' 
                    ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/20" 
                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                )}
              >أنثى</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{settings.basicLabels?.status || 'الحالة'}</label>
            <select 
              className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Stable">مستقر</option>
              <option value="Emergency">طوارئ</option>
              <option value="Follow-up">متابعة</option>
            </select>
          </div>

          {settings.patientFields?.map(field => (
            <div key={field.id} className={cn("space-y-3", field.isTextArea && "md:col-span-2")}>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                {field.name} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select 
                  required={field.required}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                  value={customData[field.id] || ''}
                  onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                >
                  <option value="">اختر...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.isTextArea ? (
                <textarea 
                  required={field.required}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold min-h-[120px]"
                  value={customData[field.id] || ''}
                  onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                />
              ) : (
                <input 
                  required={field.required}
                  type={field.type || 'text'}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                  value={customData[field.id] || ''}
                  onChange={e => setCustomData({...customData, [field.id]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit"
            className="flex-1 bg-blue-600 text-white p-5 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20"
          >
            حفظ التغييرات
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-5 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
          >
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const PatientProfile = ({ id, onBack, settings }: { id: number, onBack: () => void, settings: SystemSettings }) => {
  const [patient, setPatient] = useState<Patient & { records: MedicalRecord[] } | null>(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPatient = async () => {
    const res = await fetch(`/api/patients/${id}`);
    const data = await res.json();
    setPatient(data);
  };

  useEffect(() => { fetchPatient(); }, [id]);

  const exportPDF = (record?: MedicalRecord) => {
    if (!patient) return;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(22);
    doc.text("Hospital Medical Report", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${settings.basicLabels?.full_name || 'Patient Name'}: ${patient.full_name}`, 20, 40);
    doc.text(`${settings.basicLabels?.phone || 'Phone'}: ${patient.phone}`, 20, 50);
    doc.text(`${settings.basicLabels?.status || 'Status'}: ${patient.status}`, 20, 60);
    doc.text(`Patient ID: #${patient.id}`, 20, 47);
    doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, 20, 54);
    
    if (record) {
      doc.text(`Department: ${record.department}`, 20, 63);
      doc.text("Visit Details:", 20, 70);
      
      const body = [['Doctor', record.doctor_name]];
      
      // Add custom data fields
      const dept = settings.departments.find(d => d.id === record.department);
      if (dept) {
        dept.fields.forEach(f => {
          body.push([f.name, record.custom_data[f.id] || 'N/A']);
        });
      }

      body.push(['Notes', record.notes]);
      body.push(['Visit Date', format(new Date(record.visit_date), 'yyyy-MM-dd HH:mm')]);

      (doc as any).autoTable({
        startY: 75,
        head: [['Field', 'Details']],
        body: body,
      });
    } else {
      doc.text("Full History:", 20, 70);
      (doc as any).autoTable({
        startY: 75,
        head: [['Date', 'Dept', 'Doctor', 'Diagnosis']],
        body: patient.records.map(r => [
          format(new Date(r.visit_date), 'yyyy-MM-dd'),
          r.department,
          r.doctor_name,
          r.diagnosis
        ]),
      });
    }
    
    doc.save(`Report_${patient.full_name}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (!patient) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20" />
      <p className="font-black text-slate-400 animate-pulse">جاري تحميل الملف الطبي...</p>
    </div>
  );

  if (isEditing) {
    return <EditPatientForm 
      patient={patient} 
      settings={settings}
      onCancel={() => setIsEditing(false)} 
      onSuccess={() => {
        setIsEditing(false);
        fetchPatient();
      }} 
    />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PrintSlip patient={patient} settings={settings} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
          >
            <ChevronRight size={28} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{patient.full_name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-bold text-slate-400 tabular-nums">ID: {patient.id}</span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <span className="text-sm font-bold text-slate-400 tabular-nums">{patient.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
            title="تعديل البيانات"
          >
            <Edit size={24} />
          </button>
          <button 
            onClick={() => window.print()}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-green-600 hover:border-green-600 transition-all shadow-sm"
            title="طباعة"
          >
            <Printer size={24} />
          </button>
          <button 
            onClick={() => setShowAddRecord(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20"
          >
            <PlusCircle size={24} />
            إضافة زيارة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black mb-6 dark:text-white flex items-center gap-3">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
              المعلومات الأساسية
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-500">الحالة الصحية</span>
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                  patient.status === 'Stable' ? "bg-green-100 text-green-700" :
                  patient.status === 'Emergency' ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {patient.status === 'Stable' ? 'مستقر' : patient.status === 'Emergency' ? 'طوارئ' : 'متابعة'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-500">الجنس</span>
                <span className="font-black dark:text-white">{(patient as any).gender === 'Female' ? 'أنثى' : 'ذكر'}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-500">تاريخ التسجيل</span>
                <span className="font-black dark:text-white tabular-nums">{format(new Date(patient.created_at), 'yyyy/MM/dd')}</span>
              </div>
            </div>
          </div>

          {patient.attachments && patient.attachments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black mb-6 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-5 bg-orange-600 rounded-full" />
                المرفقات العامة
              </h3>
              <AttachmentList attachments={patient.attachments} />
            </div>
          )}

          {patient.custom_data && Object.keys(patient.custom_data).length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black mb-6 dark:text-white flex items-center gap-3">
                <div className="w-1.5 h-5 bg-purple-600 rounded-full" />
                بيانات إضافية
              </h3>
              <div className="space-y-4">
                {settings.patientFields?.map(field => (
                  <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.name}</p>
                    <p className="font-bold dark:text-white">{patient.custom_data[field.id] || '---'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence>
            {showAddRecord && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AddRecordForm 
                  patientId={patient.id} 
                  onCancel={() => setShowAddRecord(false)} 
                  onSuccess={() => {
                    setShowAddRecord(false);
                    fetchPatient();
                  }} 
                  settings={settings}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              السجل الطبي والزيارات
            </h3>
            
            <div className="space-y-6">
              {patient.records.map((record, idx) => (
                <motion.div 
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <Stethoscope size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black dark:text-white">د. {record.doctor_name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded-lg font-black uppercase tracking-wider">
                            {record.department}
                          </span>
                          <span className="text-xs font-bold text-slate-400 tabular-nums">
                            {format(new Date(record.visit_date), 'yyyy/MM/dd • HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => exportPDF(record)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Download size={20} />
                    </button>
                  </div>

                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(() => {
                      const dept = settings.departments.find(d => d.id === record.department);
                      return dept?.fields.map(field => (
                        <div key={field.id} className={cn("p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700", field.isTextArea && "md:col-span-2")}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{field.name}</p>
                          <p className="font-bold dark:text-slate-200 leading-relaxed">
                            {record.custom_data[field.id] || '---'}
                          </p>
                        </div>
                      ));
                    })()}
                    
                    {record.notes && (
                      <div className="md:col-span-2 p-6 bg-orange-50/30 dark:bg-orange-900/10 rounded-2xl border border-orange-100/50 dark:border-orange-900/20">
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">ملاحظات إضافية</p>
                        <p className="font-bold text-slate-600 dark:text-slate-400 italic leading-relaxed">
                          {record.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">المرفقات الطبية للزيارة</p>
                      <AttachmentList attachments={record.attachments} />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {patient.records.length === 0 && (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <History size={40} />
                  </div>
                  <p className="text-slate-500 font-black">لا يوجد سجل زيارات سابق لهذا المريض</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddRecordForm = ({ patientId, onCancel, onSuccess, settings }: { patientId: number, onCancel: () => void, onSuccess: () => void, settings: SystemSettings }) => {
  const [activeTab, setActiveTab] = useState(settings.departments[0]?.id || '');
  const [formData, setFormData] = useState<any>({
    doctor_name: '',
    notes: '',
    custom_data: {}
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formData, 
        patient_id: patientId,
        department: activeTab,
        attachmentIds: attachments.map(a => a.id)
      })
    });
    if (res.ok) onSuccess();
  };

  const selectedDept = settings.departments.find(d => d.id === activeTab);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
        {settings.departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => {
              setActiveTab(dept.id);
              setFormData({ ...formData, custom_data: {} });
            }}
            className={cn(
              "flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all",
              activeTab === dept.id 
                ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {dept.id === 'Clinics' ? <Stethoscope size={18} /> : 
             dept.id === 'Radiology' ? <Scan size={18} /> : 
             dept.id === 'Lab' ? <FlaskConical size={18} /> : <Activity size={18} />}
            {dept.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">
              اسم الطبيب / الأخصائي
            </label>
            <input 
              required
              className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={formData.doctor_name}
              onChange={e => setFormData({...formData, doctor_name: e.target.value})}
            />
          </div>

          {selectedDept?.fields.map(field => (
            <div key={field.id} className={cn(field.isTextArea ? "md:col-span-2" : "")}>
              <SelectableInput 
                label={field.name}
                value={formData.custom_data[field.id] || ''}
                onChange={val => setFormData({
                  ...formData, 
                  custom_data: { ...formData.custom_data, [field.id]: val }
                })}
                options={field.options}
                isTextArea={field.isTextArea}
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-slate-300">ملاحظات إضافية</label>
            <input 
              className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-black mb-3 dark:text-white">المرفقات الطبية (تحاليل، أشعة، روشتات)</h4>
          <FileUpload 
            onUpload={(a) => setAttachments([...attachments, a])} 
            category="Other"
            label="إرفاق ملفات لهذه الزيارة"
          />
          <AttachmentList 
            attachments={attachments} 
            onRemove={(id) => setAttachments(attachments.filter(a => a.id !== id))} 
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            حفظ البيانات
          </button>
          <button type="button" onClick={onCancel} className="bg-slate-200 dark:bg-slate-700 dark:text-white px-6 py-3 rounded-xl transition-all">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

const SettingsView = ({ settings, onUpdate }: { settings: SystemSettings, onUpdate: () => void }) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'patient' | 'depts' | 'print'>('actions');
  const [newAction, setNewAction] = useState<Partial<QuickAction>>({
    label: '',
    icon: 'PlusCircle',
    view: 'register',
    color: 'blue'
  });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  
  const [newDeptName, setNewDeptName] = useState('');
  const [newFieldName, setNewFieldName] = useState<{ [key: string]: string }>({});
  const [newPatientFieldName, setNewPatientFieldName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState<{ [key: string]: string }>({});
  const [newPatientOptionValue, setNewPatientOptionValue] = useState<{ [key: string]: string }>({});

  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingPatientFieldId, setEditingPatientFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const updateSettings = async (key: string, value: any) => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    onUpdate();
  };

  // --- Department Handlers ---
  const handleAddDept = () => {
    if (!newDeptName.trim()) return;
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      name: newDeptName.trim(),
      fields: []
    };
    updateSettings('departments', [...settings.departments, newDept]);
    setNewDeptName('');
  };

  const handleRenameDept = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = settings.departments.map(d => d.id === id ? { ...d, name: newName.trim() } : d);
    updateSettings('departments', updated);
    setEditingDeptId(null);
  };

  const handleRemoveDept = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم بالكامل؟')) return;
    updateSettings('departments', settings.departments.filter(d => d.id !== id));
  };

  // --- Field Handlers ---
  const handleAddField = (deptId: string) => {
    const name = newFieldName[deptId];
    if (!name?.trim()) return;
    
    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          fields: [...d.fields, { id: `field_${Date.now()}`, name: name.trim(), options: [] }]
        };
      }
      return d;
    });
    updateSettings('departments', updated);
    setNewFieldName({ ...newFieldName, [deptId]: '' });
  };

  const handleRenameField = (deptId: string, fieldId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          fields: d.fields.map(f => f.id === fieldId ? { ...f, name: newName.trim() } : f)
        };
      }
      return d;
    });
    updateSettings('departments', updated);
    setEditingFieldId(null);
  };

  const handleRemoveField = (deptId: string, fieldId: string) => {
    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return { ...d, fields: d.fields.filter(f => f.id !== fieldId) };
      }
      return d;
    });
    updateSettings('departments', updated);
  };

  // --- Patient Fields Handlers ---
  const handleAddPatientField = () => {
    if (!newPatientFieldName.trim()) return;
    const newField = {
      id: `pfield_${Date.now()}`,
      name: newPatientFieldName.trim(),
      type: 'text',
      required: false,
      options: []
    };
    updateSettings('patientFields', [...(settings.patientFields || []), newField]);
    setNewPatientFieldName('');
  };

  const handleRenamePatientField = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = settings.patientFields.map(f => f.id === id ? { ...f, name: newName.trim() } : f);
    updateSettings('patientFields', updated);
    setEditingPatientFieldId(null);
  };

  const handleRemovePatientField = (id: string) => {
    updateSettings('patientFields', settings.patientFields.filter(f => f.id !== id));
  };

  const togglePatientFieldRequired = (id: string) => {
    const updated = settings.patientFields.map(f => f.id === id ? { ...f, required: !f.required } : f);
    updateSettings('patientFields', updated);
  };

  const togglePatientFieldType = (id: string) => {
    const updated = settings.patientFields.map(f => {
      if (f.id === id) {
        const nextType = f.type === 'text' ? 'number' : f.type === 'number' ? 'select' : 'text';
        return { ...f, type: nextType, isTextArea: false };
      }
      return f;
    });
    updateSettings('patientFields', updated);
  };

  const togglePatientFieldTextArea = (id: string) => {
    const updated = settings.patientFields.map(f => f.id === id ? { ...f, isTextArea: !f.isTextArea, type: 'text' } : f);
    updateSettings('patientFields', updated);
  };

  const handleAddPatientOption = (fieldId: string) => {
    const value = newPatientOptionValue[fieldId];
    if (!value?.trim()) return;
    const updated = settings.patientFields.map(f => f.id === fieldId ? { ...f, options: [...(f.options || []), value.trim()] } : f);
    updateSettings('patientFields', updated);
    setNewPatientOptionValue({ ...newPatientOptionValue, [fieldId]: '' });
  };

  const handleRemovePatientOption = (fieldId: string, optIndex: number) => {
    const updated = settings.patientFields.map(f => f.id === fieldId ? { ...f, options: f.options.filter((_, i) => i !== optIndex) } : f);
    updateSettings('patientFields', updated);
  };

  const toggleFieldType = (deptId: string, fieldId: string) => {
    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          fields: d.fields.map(f => f.id === fieldId ? { ...f, isTextArea: !f.isTextArea } : f)
        };
      }
      return d;
    });
    updateSettings('departments', updated);
  };

  // --- Option Handlers ---
  const handleAddOption = (deptId: string, fieldId: string) => {
    const key = `${deptId}_${fieldId}`;
    const value = newOptionValue[key];
    if (!value?.trim()) return;

    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          fields: d.fields.map(f => f.id === fieldId ? { ...f, options: [...f.options, value.trim()] } : f)
        };
      }
      return d;
    });
    updateSettings('departments', updated);
    setNewOptionValue({ ...newOptionValue, [key]: '' });
  };

  const handleRemoveOption = (deptId: string, fieldId: string, optIndex: number) => {
    const updated = settings.departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          fields: d.fields.map(f => f.id === fieldId ? { ...f, options: f.options.filter((_, i) => i !== optIndex) } : f)
        };
      }
      return d;
    });
    updateSettings('departments', updated);
  };

  // --- Quick Actions Handlers ---
  const handleSaveAction = async () => {
    if (!newAction.label) return;
    let updated: QuickAction[];
    if (editingActionId) {
      updated = settings.quickActions.map(a => a.id === editingActionId ? { ...a, ...newAction } as QuickAction : a);
    } else {
      const action: QuickAction = { id: Date.now().toString(), label: newAction.label, icon: newAction.icon || 'PlusCircle', view: newAction.view as any || 'register', color: newAction.color || 'blue' };
      updated = [...(settings.quickActions || []), action];
    }
    updateSettings('quickActions', updated);
    setNewAction({ label: '', icon: 'PlusCircle', view: 'register', color: 'blue' });
    setEditingActionId(null);
  };

  const handleRemoveAction = (id: string) => updateSettings('quickActions', settings.quickActions.filter(a => a.id !== id));

  const handleMoveAction = (id: string, direction: 'up' | 'down') => {
    const index = settings.quickActions.findIndex(a => a.id === id);
    if (index === -1 || (direction === 'up' && index === 0) || (direction === 'down' && index === settings.quickActions.length - 1)) return;
    const updated = [...settings.quickActions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    updateSettings('quickActions', updated);
  };

  const iconOptions = [
    { value: 'UserPlus', label: 'مريض جديد', icon: UserPlus },
    { value: 'Search', label: 'بحث', icon: Search },
    { value: 'FileText', label: 'ملف', icon: FileText },
    { value: 'Activity', label: 'نشاط', icon: Activity },
    { value: 'Settings', label: 'إعدادات', icon: Settings },
    { value: 'PlusCircle', label: 'إضافة', icon: PlusCircle },
    { value: 'Heart', label: 'قلب', icon: Heart },
    { value: 'Thermometer', label: 'حرارة', icon: Thermometer },
    { value: 'Pill', label: 'دواء', icon: Pill },
    { value: 'Microscope', label: 'مجهر', icon: Microscope },
    { value: 'Syringe', label: 'حقنة', icon: Syringe },
    { value: 'Clipboard', label: 'ملاحظات', icon: Clipboard },
    { value: 'Calendar', label: 'تقويم', icon: Calendar },
    { value: 'Phone', label: 'هاتف', icon: Phone },
    { value: 'MapPin', label: 'عنوان', icon: MapPin },
  ];

  const colorOptions = [
    { value: 'blue', label: 'أزرق' },
    { value: 'green', label: 'أخضر' },
    { value: 'red', label: 'أحمر' },
    { value: 'purple', label: 'بنفسجي' },
    { value: 'orange', label: 'برتقالي' },
    { value: 'indigo', label: 'نيلي' },
    { value: 'pink', label: 'وردي' },
    { value: 'teal', label: 'فيروزي' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">إعدادات النظام</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">تحكم في كافة جوانب التطبيق وتخصيص الحقول والأقسام</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('actions')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'actions' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <LayoutDashboard size={18} /> الإجراءات السريعة
        </button>
        <button 
          onClick={() => setActiveTab('patient')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'patient' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <User size={18} /> حقول المرضى
        </button>
        <button 
          onClick={() => setActiveTab('depts')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'depts' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Stethoscope size={18} /> الأقسام الطبية
        </button>
        <button 
          onClick={() => setActiveTab('print')}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'print' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Printer size={18} /> إعدادات الطباعة
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'print' && (
          <motion.section 
            key="print"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  تخصيص بطاقة المراجعة المطبوعة
                </h3>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl">
                  <span className="text-sm font-bold dark:text-slate-300">الطباعة التلقائية بعد التسجيل</span>
                  <button 
                    onClick={() => updateSettings('printSettings', { ...settings.printSettings, autoPrint: !settings.printSettings?.autoPrint })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.printSettings?.autoPrint ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      settings.printSettings?.autoPrint ? "right-7" : "right-1"
                    )} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-500 border-b pb-2">بيانات العيادة</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-400">اسم العيادة / المركز</label>
                        <input 
                          className="w-full p-2.5 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm"
                          value={settings.printSettings?.clinicName}
                          onChange={e => updateSettings('printSettings', { ...settings.printSettings, clinicName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-400">العنوان</label>
                        <input 
                          className="w-full p-2.5 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm"
                          value={settings.printSettings?.clinicAddress}
                          onChange={e => updateSettings('printSettings', { ...settings.printSettings, clinicAddress: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-slate-400">رقم الهاتف</label>
                        <input 
                          className="w-full p-2.5 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm"
                          value={settings.printSettings?.clinicPhone}
                          onChange={e => updateSettings('printSettings', { ...settings.printSettings, clinicPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-500 border-b pb-2">تذييل الورقة</h4>
                    <textarea 
                      className="w-full p-2.5 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm min-h-[80px]"
                      value={settings.printSettings?.footerNote}
                      onChange={e => updateSettings('printSettings', { ...settings.printSettings, footerNote: e.target.value })}
                      placeholder="ملاحظة تظهر في أسفل البطاقة..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 border-b pb-2">خيارات العرض في الطباعة</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'showPhone', label: 'إظهار رقم هاتف المريض' },
                      { id: 'showStatus', label: 'إظهار الحالة الصحية' },
                      { id: 'showCustomFields', label: 'إظهار الحقول المخصصة' },
                      { id: 'showDate', label: 'إظهار تاريخ الإصدار' },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 transition-all">
                        <span className="text-sm font-bold dark:text-slate-300">{opt.label}</span>
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-blue-600"
                          checked={(settings.printSettings as any)?.[opt.id]}
                          onChange={e => updateSettings('printSettings', { ...settings.printSettings, [opt.id]: e.target.checked })}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      <AlertCircle size={14} className="inline ml-1" />
                      سيتم وضع الباركود تلقائياً في أعلى منتصف الورقة لضمان سهولة المسح بواسطة الأجهزة المختلفة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
        {activeTab === 'actions' && (
          <motion.section 
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  تخصيص أزرار الوصول السريع
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-500 dark:text-slate-400">اسم الزر</label>
                  <input className="w-full p-2.5 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newAction.label} onChange={e => setNewAction({...newAction, label: e.target.value})} placeholder="مثال: مريض جديد" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-slate-400">الأيقونة</label>
                  <select className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" value={newAction.icon} onChange={e => setNewAction({...newAction, icon: e.target.value})}>
                    {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-slate-400">الوجهة</label>
                  <select className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" value={newAction.view} onChange={e => setNewAction({...newAction, view: e.target.value as any})}>
                    <option value="register">تسجيل مريض</option>
                    <option value="search">بحث عن مريض</option>
                    <option value="dashboard">لوحة التحكم</option>
                    <option value="settings">الإعدادات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-slate-400">اللون</label>
                  <div className="flex gap-2">
                    <select className="flex-1 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" value={newAction.color} onChange={e => setNewAction({...newAction, color: e.target.value})}>
                      {colorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <button onClick={handleSaveAction} className={cn("p-2 text-white rounded-lg transition-colors", editingActionId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")}>
                      {editingActionId ? <Edit size={20} /> : <Plus size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {settings.quickActions.map((action, idx) => (
                  <div key={action.id} className="relative group p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
                    <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemoveAction(action.id)} className="p-1 bg-red-100 text-red-600 rounded-full shadow-sm"><Trash2 size={12} /></button>
                      <button onClick={() => { setNewAction(action); setEditingActionId(action.id); }} className="p-1 bg-blue-100 text-blue-600 rounded-full shadow-sm"><Edit size={12} /></button>
                    </div>
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button disabled={idx === 0} onClick={() => handleMoveAction(action.id, 'up')} className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm disabled:opacity-30"><ArrowUp size={10} /></button>
                      <button disabled={idx === settings.quickActions.length - 1} onClick={() => handleMoveAction(action.id, 'down')} className="p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-sm disabled:opacity-30"><ArrowDown size={10} /></button>
                    </div>
                    <div className={cn("p-2 rounded-lg", { blue: "text-blue-600", green: "text-green-600", red: "text-red-600", purple: "text-purple-600", orange: "text-orange-600", indigo: "text-indigo-600", pink: "text-pink-600", teal: "text-teal-600" }[action.color as string] || "text-slate-600")}>
                      {(() => { const IconComp = iconOptions.find(o => o.value === action.icon)?.icon || PlusCircle; return <IconComp size={24} />; })()}
                    </div>
                    <span className="text-xs font-bold dark:text-white text-center">{action.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === 'patient' && (
          <motion.section 
            key="patient"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="md:col-span-3 mb-2">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Edit size={16} /> تخصيص المسميات الأساسية
                  </h4>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">مسمى الاسم</label>
                  <input 
                    className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                    value={settings.basicLabels?.full_name || 'الاسم الكامل'}
                    onChange={e => updateSettings('basicLabels', { ...settings.basicLabels, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">مسمى الهاتف</label>
                  <input 
                    className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                    value={settings.basicLabels?.phone || 'رقم الهاتف'}
                    onChange={e => updateSettings('basicLabels', { ...settings.basicLabels, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-1 text-slate-500">مسمى الحالة</label>
                  <input 
                    className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                    value={settings.basicLabels?.status || 'الحالة'}
                    onChange={e => updateSettings('basicLabels', { ...settings.basicLabels, status: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  إدارة حقول تسجيل المرضى
                </h3>
                <div className="flex gap-2">
                  <input 
                    className="p-2.5 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    value={newPatientFieldName} 
                    onChange={e => setNewPatientFieldName(e.target.value)} 
                    placeholder="اسم الحقل الجديد..." 
                  />
                  <button onClick={handleAddPatientField} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
                    <Plus size={18} /> إضافة حقل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.patientFields?.map(field => (
                  <div key={field.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {editingPatientFieldId === field.id ? (
                          <div className="flex gap-2 flex-1">
                            <input 
                              autoFocus
                              className="flex-1 p-1.5 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => handleRenamePatientField(field.id, editValue)}
                              onKeyDown={e => e.key === 'Enter' && handleRenamePatientField(field.id, editValue)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold dark:text-white">{field.name}</span>
                            <button 
                              onClick={() => { setEditingPatientFieldId(field.id); setEditValue(field.name); }}
                              className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Edit size={14} />
                            </button>
                            {field.required && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">مطلوب</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => togglePatientFieldRequired(field.id)} 
                          className={cn("p-2 rounded-lg transition-colors", field.required ? "text-red-600 bg-red-100/50" : "text-slate-400 hover:bg-slate-200/50")}
                          title="فرض ملئ الحقل"
                        >
                          <AlertCircle size={16} />
                        </button>
                        <button 
                          onClick={() => togglePatientFieldType(field.id)} 
                          className="p-2 text-blue-600 bg-blue-100/50 rounded-lg hover:bg-blue-200/50 transition-colors"
                          title="تغيير نوع الحقل"
                        >
                          {field.type === 'number' ? <Hash size={16} /> : field.type === 'select' ? <List size={16} /> : <Type size={16} />}
                        </button>
                        <button 
                          onClick={() => togglePatientFieldTextArea(field.id)} 
                          className={cn("p-2 rounded-lg transition-colors", field.isTextArea ? "text-purple-600 bg-purple-100/50" : "text-slate-400 hover:bg-slate-200/50")}
                          title="مربع نص كبير"
                        >
                          <AlignLeft size={16} />
                        </button>
                        <button onClick={() => handleRemovePatientField(field.id)} className="p-2 text-red-500 hover:bg-red-100/50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-xs" 
                            value={newPatientOptionValue[field.id] || ''} 
                            onChange={e => setNewPatientOptionValue({...newPatientOptionValue, [field.id]: e.target.value})} 
                            placeholder="إضافة خيار..." 
                          />
                          <button onClick={() => handleAddPatientOption(field.id)} className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.options?.map((opt, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-medium">
                              {opt}
                              <button onClick={() => handleRemovePatientOption(field.id, idx)} className="hover:text-red-500"><X size={10} /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === 'depts' && (
          <motion.section 
            key="depts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                  إدارة أقسام المستشفى
                </h3>
                <div className="flex gap-2">
                  <input className="p-2.5 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="اسم القسم الجديد..." />
                  <button onClick={handleAddDept} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm">
                    <Plus size={18} /> إضافة قسم
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {settings.departments.map(dept => (
                  <div key={dept.id} className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        {editingDeptId === dept.id ? (
                          <input 
                            autoFocus
                            className="p-1.5 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-lg font-black"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleRenameDept(dept.id, editValue)}
                            onKeyDown={e => e.key === 'Enter' && handleRenameDept(dept.id, editValue)}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black dark:text-white">{dept.name}</h4>
                            <button 
                              onClick={() => { setEditingDeptId(dept.id); setEditValue(dept.name); }}
                              className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleRemoveDept(dept.id)} className="text-red-500 hover:text-red-600 p-2 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="flex gap-2 max-w-md">
                        <input className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newFieldName[dept.id] || ''} onChange={e => setNewFieldName({...newFieldName, [dept.id]: e.target.value})} placeholder="اسم الحقل الجديد (مثال: ضغط الدم)..." />
                        <button onClick={() => handleAddField(dept.id)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
                          <Plus size={18} /> إضافة حقل
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dept.fields.map(field => (
                          <div key={field.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4 group/field">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                {editingFieldId === field.id ? (
                                  <input 
                                    autoFocus
                                    className="flex-1 p-1 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm font-bold"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={() => handleRenameField(dept.id, field.id, editValue)}
                                    onKeyDown={e => e.key === 'Enter' && handleRenameField(dept.id, field.id, editValue)}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold dark:text-white">{field.name}</span>
                                    <button 
                                      onClick={() => { setEditingFieldId(field.id); setEditValue(field.name); }}
                                      className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover/field:opacity-100 transition-all"
                                    >
                                      <Edit size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => toggleFieldType(dept.id, field.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", field.isTextArea ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-600")}>
                                  {field.isTextArea ? 'نص كبير' : 'نص صغير'}
                                </button>
                                <button onClick={() => handleRemoveField(dept.id, field.id)} className="text-red-500 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input className="flex-1 p-2 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newOptionValue[`${dept.id}_${field.id}`] || ''} onChange={e => setNewOptionValue({...newOptionValue, [`${dept.id}_${field.id}`]: e.target.value})} placeholder="إضافة خيار جديد..." />
                                <button onClick={() => handleAddOption(dept.id, field.id)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 transition-colors"><Plus size={16} /></button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((opt, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-medium dark:text-slate-300 shadow-sm">
                                    {opt}
                                    <button onClick={() => handleRemoveOption(dept.id, field.id, i)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'register' | 'search' | 'profile' | 'settings' | 'all-patients'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ totalPatients: 0, visitsToday: 0, emergencyCount: 0, recentPatients: [] });
  const [settings, setSettings] = useState<SystemSettings>({ 
    departments: [],
    quickActions: [],
    patientFields: [],
    basicLabels: {
      full_name: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      status: 'الحالة'
    }
  });

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    // Ensure departments exists for backward compatibility during migration
    if (!data.departments) {
      data.departments = [
        { id: 'Clinics', name: 'العيادات', fields: [] },
        { id: 'Radiology', name: 'الأشعة', fields: [] },
        { id: 'Lab', name: 'المختبر', fields: [] }
      ];
    }
    if (!data.basicLabels) {
      data.basicLabels = {
        full_name: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        status: 'الحالة'
      };
    }
    setSettings(data);
  };

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    };
    fetchStats();
    fetchSettings();
  }, [view]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans" dir="rtl">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 h-20">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Stethoscope size={20} className="sm:w-6 sm:h-6" />
              </div>
              <span className="hidden xs:inline">شفاء</span>
            </h1>
            
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button 
                onClick={() => setView('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all font-bold text-xs sm:text-sm",
                  view === 'dashboard' ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <LayoutDashboard size={18} /> <span className="hidden md:inline">لوحة التحكم</span>
              </button>
              <button 
                onClick={() => setView('search')}
                className={cn(
                  "flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all font-bold text-xs sm:text-sm",
                  view === 'search' || view === 'profile' ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Search size={18} /> <span className="hidden md:inline">بحث</span>
              </button>
              <button 
                onClick={() => setView('register')}
                className={cn(
                  "flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all font-bold text-xs sm:text-sm",
                  view === 'register' ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <UserPlus size={18} /> <span className="hidden md:inline">تسجيل</span>
              </button>
              <button 
                onClick={() => setView('settings')}
                className={cn(
                  "flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all font-bold text-xs sm:text-sm",
                  view === 'settings' ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Settings size={18} /> <span className="hidden md:inline">الإعدادات</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
              title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">لوحة التحكم</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة شاملة على نشاط النظام اليوم</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
                </div>
              </div>
              
              <Dashboard stats={stats} onViewAll={() => setView('all-patients')} />

              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                      الوصول السريع
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {settings.quickActions.map(action => {
                      const Icon = action.icon === 'UserPlus' ? UserPlus : 
                                  action.icon === 'Search' ? Search : 
                                  action.icon === 'FileText' ? FileText : 
                                  action.icon === 'Activity' ? Stethoscope : 
                                  action.icon === 'Settings' ? Settings : 
                                  action.icon === 'Heart' ? Heart :
                                  action.icon === 'Thermometer' ? Thermometer :
                                  action.icon === 'Pill' ? Pill :
                                  PlusCircle;
                      
                      const colorMap: Record<string, string> = {
                        blue: "bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600",
                        green: "bg-green-50/50 border-green-100 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600",
                        red: "bg-red-50/50 border-red-100 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600",
                        purple: "bg-purple-50/50 border-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600",
                        orange: "bg-orange-50/50 border-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600",
                        indigo: "bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600",
                        pink: "bg-pink-50/50 border-pink-100 text-pink-700 hover:bg-pink-600 hover:text-white hover:border-pink-600",
                        teal: "bg-teal-50/50 border-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600",
                      };

                      return (
                        <button 
                          key={action.id}
                          onClick={() => setView(action.view)}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border transition-all text-right group",
                            colorMap[action.color] || "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-sm group-hover:bg-white/20 transition-colors">
                            <Icon size={24} />
                          </div>
                          <span className="font-black text-sm">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <RecentRegistrations patients={stats.recentPatients || []} onSelectPatient={(id) => { setSelectedPatientId(id); setView('profile'); }} />
            </motion.div>
          )}

          {view === 'all-patients' && (
            <motion.div key="all-patients">
              <AllPatientsView 
                settings={settings} 
                onSelectPatient={(id) => {
                  setSelectedPatientId(id);
                  setView('profile');
                }} 
              />
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div key="register">
              <PatientRegistration 
                onComplete={(id) => {
                  setSelectedPatientId(id);
                  setView('profile');
                }} 
                settings={settings}
              />
            </motion.div>
          )}

          {view === 'search' && (
            <motion.div key="search">
              <PatientSearch 
                settings={settings}
                onSelect={(id) => {
                  setSelectedPatientId(id);
                  setView('profile');
                }} 
              />
            </motion.div>
          )}

          {view === 'profile' && selectedPatientId && (
            <motion.div key="profile">
              <PatientProfile 
                id={selectedPatientId} 
                onBack={() => setView('search')} 
                settings={settings}
              />
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div key="settings">
              <SettingsView settings={settings} onUpdate={fetchSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
