export interface Patient {
  id: number;
  full_name: string;
  phone: string;
  gender?: 'Male' | 'Female';
  status: 'Stable' | 'Emergency' | 'Follow-up';
  custom_data: Record<string, string>;
  created_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  patient_id: number;
  record_id?: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: 'Lab' | 'Radiology' | 'Prescription' | 'Other';
  created_at: string;
}

export interface PatientField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options: string[];
  isTextArea?: boolean;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  visit_date: string;
  doctor_name: string;
  department: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  test_results?: string;
  custom_data: Record<string, string>;
  attachments?: Attachment[];
}

export interface DashboardStats {
  totalPatients: number;
  visitsToday: number;
  emergencyCount: number;
  recentPatients?: Patient[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  view: 'dashboard' | 'register' | 'search' | 'profile' | 'settings' | 'all-patients';
  color: string;
}

export interface DepartmentField {
  id: string;
  name: string;
  options: string[];
  isTextArea?: boolean;
}

export interface Department {
  id: string;
  name: string;
  fields: DepartmentField[];
}

export interface SystemSettings {
  departments: Department[];
  quickActions: QuickAction[];
  patientFields: PatientField[];
  basicLabels?: {
    full_name: string;
    phone: string;
    status: string;
  };
  printSettings?: {
    autoPrint: boolean;
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    showPhone: boolean;
    showStatus: boolean;
    showCustomFields: boolean;
    showDate: boolean;
    footerNote: string;
  };
}
