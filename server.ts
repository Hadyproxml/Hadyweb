import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'hospital.db');
const db = new Database(dbPath);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    age INTEGER,
    gender TEXT,
    blood_type TEXT,
    address TEXT,
    allergies TEXT,
    status TEXT DEFAULT 'Stable',
    custom_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    doctor_name TEXT,
    department TEXT DEFAULT 'General',
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    test_results TEXT,
    custom_data TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    record_id INTEGER,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (record_id) REFERENCES medical_records(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Ensure custom_data columns exist if table was created before they were added
const addColumnIfNotExists = (table: string, column: string, type: string) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  const columnExists = info.some(col => col.name === column);
  if (!columnExists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`Added column ${column} to table ${table}`);
  }
};

addColumnIfNotExists('patients', 'custom_data', 'TEXT');
addColumnIfNotExists('medical_records', 'custom_data', 'TEXT');

// Initial settings
db.exec(`
  INSERT OR IGNORE INTO settings (key, value) VALUES ('patientFields', '[{"id":"age","name":"العمر","type":"number","required":true},{"id":"gender","name":"الجنس","type":"select","options":["ذكر","أنثى"],"required":true},{"id":"blood_type","name":"فصيلة الدم","type":"select","options":["A+","A-","B+","B-","AB+","AB-","O+","O-"]},{"id":"address","name":"العنوان","type":"text"},{"id":"allergies","name":"الحساسية","type":"text","isTextArea":true}]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('departments', '[{"id":"Clinics","name":"العيادات","fields":[{"id":"symptoms","name":"الأعراض","options":["صداع","حرارة مرتفعة","سعال","ألم مفاصل"],"isTextArea":true},{"id":"diagnosis","name":"التشخيصات","options":["نزلات برد","التهاب لوزتين","فقر دم","ضغط دم مرتفع"]},{"id":"treatment","name":"العلاجات","options":["بندول","مضاد حيوي","فيتامينات","راحة تامة"]}]},{"id":"Radiology","name":"الأشعة","fields":[{"id":"test_type","name":"أنواع الأشعة","options":["أشعة سينية","رنين مغناطيسي","تصوير مقطعي"]},{"id":"recommendations","name":"التوصيات","options":["مراجعة الطبيب المختص","إجراء فحوصات إضافية"]}]},{"id":"Lab","name":"المختبر","fields":[{"id":"test_type","name":"أنواع التحاليل","options":["صورة دم كاملة","تحليل سكر","وظائف كبد","وظائف كلى"]},{"id":"recommendations","name":"التوصيات","options":["إعادة التحليل بعد أسبوع","مراجعة الطبيب المختص"]}]}]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('quickActions', '[{"id":"1","label":"مريض جديد","icon":"UserPlus","view":"register","color":"blue"},{"id":"2","label":"بحث سريع","icon":"Search","view":"search","color":"green"}]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('basicLabels', '{"full_name":"الاسم الكامل","phone":"رقم الهاتف","status":"الحالة"}');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('printSettings', '{"autoPrint":true,"clinicName":"نظام شفاء الطبي","clinicAddress":"العنوان الافتراضي للعيادة","clinicPhone":"0123456789","showPhone":true,"showStatus":true,"showCustomFields":true,"showDate":true,"footerNote":"يرجى إبراز هذه البطاقة عند كل زيارة لتسهيل الوصول لبياناتك"}');
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Multer Setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // API Routes
  
  // File Upload Endpoint
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const { category } = req.body;
    const info = db.prepare(`
      INSERT INTO attachments (file_name, file_path, file_type, file_size, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.file.originalname, `/uploads/${req.file.filename}`, req.file.mimetype, req.file.size, category || 'Other');
    
    res.json({ 
      id: info.lastInsertRowid,
      file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,
      category: category || 'Other'
    });
  });
  app.get('/api/stats', (req, res) => {
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get() as any;
    const visitsToday = db.prepare("SELECT COUNT(*) as count FROM medical_records WHERE date(visit_date) = date('now')").get() as any;
    const emergencyCount = db.prepare("SELECT COUNT(*) as count FROM patients WHERE status = 'Emergency'").get() as any;
    const recentPatients = db.prepare("SELECT * FROM patients ORDER BY created_at DESC LIMIT 5").all();
    
    res.json({
      totalPatients: totalPatients.count,
      visitsToday: visitsToday.count,
      emergencyCount: emergencyCount.count,
      recentPatients: recentPatients.map((p: any) => ({
        ...p,
        custom_data: JSON.parse(p.custom_data || '{}')
      }))
    });
  });

  // Search Patients
  app.get('/api/patients/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    const searchPattern = `%${query}%`;
    const patients = db.prepare(`
      SELECT * FROM patients 
      WHERE full_name LIKE ? OR phone LIKE ? OR id = ?
      ORDER BY full_name ASC
    `).all(searchPattern, searchPattern, query);
    
    res.json(patients);
  });

  // Get All Patients with Filtering
  app.get('/api/patients', (req, res) => {
    const { month, year, gender, department } = req.query;
    
    let query = 'SELECT * FROM patients WHERE 1=1';
    const params: any[] = [];

    if (month) {
      query += " AND strftime('%m', created_at) = ?";
      params.push(month.toString().padStart(2, '0'));
    }
    if (year) {
      query += " AND strftime('%Y', created_at) = ?";
      params.push(year.toString());
    }
    if (gender) {
      query += ' AND gender = ?';
      params.push(gender);
    }
    if (department) {
      // Patients who have records in a specific department
      query += ' AND id IN (SELECT patient_id FROM medical_records WHERE department = ?)';
      params.push(department);
    }

    query += ' ORDER BY created_at DESC';
    
    const patients = db.prepare(query).all(...params).map((p: any) => ({
      ...p,
      custom_data: JSON.parse(p.custom_data || '{}')
    }));
    
    res.json(patients);
  });

  // Get Patient Profile (with records and attachments)
  app.get('/api/patients/:id', (req, res) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id) as any;
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    const records = db.prepare('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY visit_date DESC').all(req.params.id).map((r: any) => {
      const recordAttachments = db.prepare('SELECT * FROM attachments WHERE record_id = ?').all(r.id);
      return {
        ...r,
        custom_data: JSON.parse(r.custom_data || '{}'),
        attachments: recordAttachments
      };
    });

    const patientAttachments = db.prepare('SELECT * FROM attachments WHERE patient_id = ? AND record_id IS NULL').all(req.params.id);

    res.json({ 
      ...patient, 
      custom_data: JSON.parse(patient.custom_data || '{}'),
      records,
      attachments: patientAttachments
    });
  });

  // Register New Patient
  app.post('/api/patients', (req, res) => {
    const { full_name, phone, gender, status, custom_data, initial_record, attachmentIds } = req.body;
    try {
      // Generate a professional 10-digit ID (e.g., 2026000001)
      let patientId: number;
      let exists = true;
      let attempts = 0;
      
      do {
        const year = new Date().getFullYear();
        const random = Math.floor(100000 + Math.random() * 900000);
        patientId = parseInt(`${year}${random}`);
        const check = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
        if (!check) exists = false;
        attempts++;
      } while (exists && attempts < 10);

      const info = db.prepare(`
        INSERT INTO patients (id, full_name, phone, gender, status, custom_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(patientId, full_name, phone, gender || 'Male', status || 'Stable', JSON.stringify(custom_data || {}));
      
      const newId = patientId;

      // Link attachments
      if (attachmentIds && Array.isArray(attachmentIds)) {
        const updateStmt = db.prepare('UPDATE attachments SET patient_id = ? WHERE id = ?');
        attachmentIds.forEach(id => updateStmt.run(newId, id));
      }

      if (initial_record) {
        const { doctor_name, department, symptoms, diagnosis, treatment, notes, test_results, custom_data: recordCustomData, attachmentIds: recordAttachmentIds } = initial_record;
        const recordInfo = db.prepare(`
          INSERT INTO medical_records (patient_id, doctor_name, department, symptoms, diagnosis, treatment, notes, test_results, custom_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(newId, doctor_name, department, symptoms, diagnosis, treatment, notes, test_results, JSON.stringify(recordCustomData || {}));
        
        const recordId = recordInfo.lastInsertRowid;
        if (recordAttachmentIds && Array.isArray(recordAttachmentIds)) {
          const updateStmt = db.prepare('UPDATE attachments SET patient_id = ?, record_id = ? WHERE id = ?');
          recordAttachmentIds.forEach(id => updateStmt.run(newId, recordId, id));
        }
      }

      const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(newId) as any;
      res.json({ ...patient, custom_data: JSON.parse(patient.custom_data || '{}') });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'رقم الهاتف مسجل مسبقاً لمريض آخر' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // Update Patient Data
  app.put('/api/patients/:id', (req, res) => {
    const { full_name, phone, gender, status, custom_data } = req.body;
    try {
      db.prepare(`
        UPDATE patients 
        SET full_name = ?, phone = ?, gender = ?, status = ?, custom_data = ?
        WHERE id = ?
      `).run(full_name, phone, gender || 'Male', status, JSON.stringify(custom_data || {}), req.params.id);
      
      res.json({ success: true });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Phone number already exists' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // Add Medical Record
  app.post('/api/records', (req, res) => {
    const { patient_id, doctor_name, department, symptoms, diagnosis, treatment, notes, test_results, custom_data, attachmentIds } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO medical_records (patient_id, doctor_name, department, symptoms, diagnosis, treatment, notes, test_results, custom_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(patient_id, doctor_name, department || 'General', symptoms, diagnosis, treatment, notes, test_results, JSON.stringify(custom_data || {}));
      
      const recordId = info.lastInsertRowid;

      // Link attachments
      if (attachmentIds && Array.isArray(attachmentIds)) {
        const updateStmt = db.prepare('UPDATE attachments SET patient_id = ?, record_id = ? WHERE id = ?');
        attachmentIds.forEach(id => updateStmt.run(patient_id, recordId, id));
      }
      
      res.json({ id: recordId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const result = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = JSON.parse(curr.value);
      return acc;
    }, {});
    res.json(result);
  });

  app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
