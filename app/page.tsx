'use client'

import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'

interface AbsensiRow {
  Nama: string
  Tanggal: string
  Masuk: string
  Pulang: string
  Terlambat: string
  'Total Jam Kerja'?: string // New format
  'Jam Kerja'?: string // Old format
  'Total Lembur (Jam)'?: string
  '✅ Lembur'?: string
  '❌ Lembur'?: string
  'Status Karyawan'?: string
}

interface LemburRow {
  Nama: string
  Tanggal: string
  'Jam Mulai': string
  'Jam Selesai': string
  'Jam Lembur': string
  'Total Diterima'?: string
}

interface IzinRow {
  Nama: string
  Tanggal: string
  Alasan: string
}

interface MergedData {
  Nama: string
  Tanggal: string
  Masuk: string
  Pulang: string
  Terlambat: string
  'Jam Kerja': string
  Izin: string
}

interface ConfirmationItem {
  Nama: string
  Tanggal: string
  Reason: string
  Status: 'pending' | 'approved' | 'rejected'
  Type: 'late' | 'missing' | 'overtime'
  Data?: any // Store original data for reference
}

interface ManagerGroup {
  manager: string
  staffs: {
    name: string
    data: MergedData[]
  }[]
  confirmations: ConfirmationItem[]
}

interface SalarySlip {
  nama: string
  manager: string
  totalHariKerja: number
  gajiPokok: number
  uangMakan: number
  potonganTerlambat: number
  totalLembur: number
  totalGaji: number
  absensi: MergedData[]
  izin: IzinRow[]
  lembur: LemburRow[]
}

// Staff salary configuration
interface StaffSalary {
  name: string
  dailyRate: number
  manager: string
  jabatan: string
  tunjanganJabatan: number
  lembur?: number
  insentif: number
  sumberDana?: string
  vgiAmount?: number
  rekening?: string
  atasNamaRekening?: string
  bank?: string
  joinDate?: string
  status?: string
  pinjaman?: number
}

// Payroll rules settings
interface PayrollSettings {
  potongUangMakan: {
    lateMoreThan1Hour: boolean
    checkoutAt17: boolean
    checkoutBefore17: boolean
    absenManager: boolean
    absenNonManager: boolean
  }
  potongGajiHarian: {
    absenNonManager: boolean
  }
}

const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  potongUangMakan: {
    lateMoreThan1Hour: true,
    checkoutAt17: true,
    checkoutBefore17: true,
    absenManager: false,
    absenNonManager: true
  },
  potongGajiHarian: {
    absenNonManager: true
  }
}

const DEFAULT_STAFF_SALARIES: StaffSalary[] = [
  // SKG + VGI
  { name: 'Budi Suryanto', dailyRate: 150000, manager: 'Top M', jabatan: 'CEO', tunjanganJabatan: 1000000, insentif: 0, sumberDana: 'SKG', vgiAmount: 13500000, rekening: '3250494563', atasNamaRekening: 'Budi Suryanto', bank: 'BCA', joinDate: '18 Sep 2018', status: 'permanen' },
  { name: 'Mucharom Rusdiana', dailyRate: 362800, manager: 'Top M', jabatan: 'Bussiness Development Manager', tunjanganJabatan: 1000000, insentif: 0, sumberDana: 'SKG', vgiAmount: 2700000, rekening: '0891062124', atasNamaRekening: 'Mucharom Rusdiana', bank: 'BCA', joinDate: '08 Dec 2016', status: 'permanen' },
  { name: 'M. Bagus Suryo Laksono', dailyRate: 158400, manager: 'Mucharom Rusdiana', jabatan: 'Logistic & Supply Chain Manager', tunjanganJabatan: 200000, insentif: 0, sumberDana: 'SKG', vgiAmount: 2500000, rekening: '0500319950', atasNamaRekening: 'M Bagus Suryo Laksono', bank: 'BCA', joinDate: '04 Jan 2021', status: 'permanen' },
  { name: 'Rahmat Ragil Hidayat', dailyRate: 86400, manager: 'Mucharom Rusdiana', jabatan: 'Office General Admin', tunjanganJabatan: 250000, insentif: 0, sumberDana: 'SKG', rekening: '8945355677', atasNamaRekening: 'Rahmat Ragil Hidayat', bank: 'BCA', joinDate: '21 Feb 2024', status: 'permanen' },
  { name: 'Rizka Maulidah', dailyRate: 100000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0, insentif: 0, sumberDana: 'SKG', rekening: '3251876655', atasNamaRekening: 'Rizka Maulidah', bank: 'BCA', joinDate: '15 Nov 2023', status: 'permanen' },
  { name: 'Laili Nisaatus Sholihah', dailyRate: 80000, manager: 'Mucharom Rusdiana', jabatan: 'General Admin MO', tunjanganJabatan: 0, insentif: 0, sumberDana: 'SKG', rekening: '4720445609', atasNamaRekening: 'Laili Nisaatus Sholihah', bank: 'BCA', joinDate: '12 Sep 24', status: 'permanen' },
  { name: 'Fitri Nurcomariah', dailyRate: 80000, manager: 'Mucharom Rusdiana', jabatan: 'Designer Product', tunjanganJabatan: 0, insentif: 0, sumberDana: 'SKG', rekening: '8221549180', atasNamaRekening: 'Fitri Nurcomariah', bank: 'BCA', joinDate: '25 Nov 2024', status: 'permanen' },
  { name: 'Fifien Ayu Ramadhani', dailyRate: 80000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0, insentif: 0, sumberDana: 'SKG', rekening: '5120561091', atasNamaRekening: 'Fifien Ayu Ramadhani', bank: 'BCA', joinDate: '28 Apr 2025', status: 'permanen' },
  { name: 'Atika Permatasari', dailyRate: 68000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0, insentif: 0, sumberDana: 'SKG', rekening: '6265073232', atasNamaRekening: 'Atika Permata Sar', bank: 'BCA', joinDate: '25 Aug 2025', status: 'permanen' },

  // RCP + VGI
  { name: 'Eko Prastio', dailyRate: 180500, manager: 'Widia Novitasari', jabatan: 'Production Jersey', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', vgiAmount: 2600000, rekening: '0882343331', atasNamaRekening: 'Eko Prastio', bank: 'BCA', joinDate: '26 Nov 2018', status: 'permanen' },
  { name: 'Tri Hariyono', dailyRate: 129600, manager: 'Widia Novitasari', jabatan: 'SPV Production & QC', tunjanganJabatan: 500000, insentif: 200000, sumberDana: 'RCP', rekening: '0881849126', atasNamaRekening: 'Tri Hariyono', bank: 'BCA', joinDate: '04 Feb 2020', status: 'permanen' },
  { name: 'Tata Wibowo', dailyRate: 107200, manager: 'Widia Novitasari', jabatan: 'Embordiery', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '4610545365', atasNamaRekening: 'Tata Wibowo', bank: 'BCA', joinDate: '29 Jan 2020', status: 'permanen' },
  { name: 'In Amullah An Nafi', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3250470877', atasNamaRekening: 'Eko Yulianto', bank: 'BCA', joinDate: '13 Okt 2025', status: 'training' },
  { name: 'Muhammad Bintang Ageng', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Operator Jersey', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3252052353', atasNamaRekening: 'Muhammad Bintang Ageng Wibowo', bank: 'BCA', joinDate: '20 Okt 2025', status: 'training' },
  { name: 'Achmad Baidowi', dailyRate: 115200, manager: 'Widia Novitasari', jabatan: 'Cutting Spesialist', tunjanganJabatan: 500000, insentif: 0, sumberDana: 'RCP', vgiAmount: 1350000, rekening: '4610484561', atasNamaRekening: 'Achmad Baidowi', bank: 'BCA', joinDate: '13 Sep 2021', status: 'permanen' },
  { name: 'Solikatin', dailyRate: 98000, manager: 'Widia Novitasari', jabatan: 'Embordiery', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3251805529', atasNamaRekening: 'Solikatin', bank: 'BCA', joinDate: '18 Aug 2022', status: 'permanen' },
  { name: 'Mita Nur Fitriani', dailyRate: 91600, manager: 'Widia Novitasari', jabatan: 'Workshop General Admin', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '5060409899', atasNamaRekening: 'Mita NurFitriani', bank: 'BCA', joinDate: '02 Feb 2023', status: 'permanen' },
  { name: 'Kasianto', dailyRate: 82000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3251904764', atasNamaRekening: 'Kasianto', bank: 'BCA', joinDate: '24 Jul 2023', status: 'permanen' },
  { name: 'Nurva Dina Amalianti', dailyRate: 60000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3251938642', atasNamaRekening: 'Nurva Dina Amalianti', bank: 'BCA', joinDate: '21 May 2024', status: 'permanen' },
  { name: 'Nabila Maulidya Putri', dailyRate: 80000, manager: 'Widia Novitasari', jabatan: 'Operator Jersey', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '1841653284', atasNamaRekening: 'Nabila Maulidya Putri', bank: 'BCA', joinDate: '06 Nov 2024', status: 'permanen' },
  { name: 'Widodo Saputra', dailyRate: 56000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '3252045047', atasNamaRekening: 'Hesti Dwi Anggraeni', bank: 'BCA', joinDate: '07 Jan 2025', status: 'permanen' },
  { name: 'Natasha Dwi Aprilia', dailyRate: 48000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', rekening: '6670880387', atasNamaRekening: 'Natasha Dwi aprilia', bank: 'BCA', joinDate: '06 Aug 2025', status: 'permanen' },
  { name: 'Anis Munawaroh', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', status: 'permanen' },
  { name: 'Azmil Qurrota A\'yun', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0, insentif: 0, sumberDana: 'RCP', status: 'permanen' },
  { name: 'Alek Sugianto', dailyRate: 0, manager: 'Widia Novitasari', jabatan: 'Staff', tunjanganJabatan: 0, insentif: 0, status: 'permanen' },

  // KSP + VGI
  { name: 'Widia Novitasari', dailyRate: 196800, manager: 'Top M', jabatan: 'Manager Production', tunjanganJabatan: 800000, insentif: 0, sumberDana: 'KSP', rekening: '0882211043', atasNamaRekening: 'Widia Novitasari', bank: 'BCA', joinDate: '07 Feb 2019', status: 'permanen' },
  { name: 'Diah Ayu Fajar Cahyaningrum', dailyRate: 146000, manager: 'Top M', jabatan: 'Sales & Client Relations Manager', tunjanganJabatan: 400000, insentif: 0, sumberDana: 'KSP', vgiAmount: 2500000, rekening: '0882211060', atasNamaRekening: 'Diah Ayu Cahyaningrum', bank: 'BCA', joinDate: '26 Aug 2019', status: 'permanen' },
  { name: 'Nadira Maysa Suryanto', dailyRate: 132000, manager: 'Top M', jabatan: 'Marketing & Partnerships Manager', tunjanganJabatan: 500000, insentif: 0, sumberDana: 'KSP', rekening: '0640674296', atasNamaRekening: 'Nadira Maysa Suryanto', bank: 'BCA', joinDate: '08 Sep 2023', status: 'permanen' },

  // D360
  { name: 'Syaiful Anam', dailyRate: 204800, manager: 'Top M', jabatan: 'Information Systems Manager', tunjanganJabatan: 0, insentif: 0, sumberDana: 'D360', rekening: '3630056372', atasNamaRekening: 'Syaiful Anam', bank: 'BCA', joinDate: '13 Oct 2020', status: 'permanen' },
  { name: 'Nadya Ambarwati Hariyanto', dailyRate: 100000, manager: 'Nadira Maysa Suryanto', jabatan: 'Digital Content Spesialist', tunjanganJabatan: 0, insentif: 0, sumberDana: 'D360', rekening: '7205253441', atasNamaRekening: 'Nadya Ambarwati Hariyanto', bank: 'BCA', joinDate: '12 Aug 2024', status: 'permanen' },
  { name: 'Galuh Anjali Puspitasari', dailyRate: 80000, manager: 'Nadira Maysa Suryanto', jabatan: 'Content Creator', tunjanganJabatan: 0, insentif: 0, sumberDana: 'D360', rekening: '1710010616954', atasNamaRekening: 'Galuh Anjali Puspitasari', bank: 'mandiri', joinDate: '05 May 2025', status: 'permanen' },
  ]

const UANG_MAKAN_PER_HARI = 12000
const POTONGAN_TERLAMBAT = 6000
const EDIT_PASSWORD = 'payroll360'
const OVERTIME_RATE_PER_HOUR = 12500

// Function to get overtime rate for a specific staff
const getOvertimeRate = (nama: string): number => {
  if (nama === 'Achmad Baidowi') {
    // Cutting Specialist has different rate
    return 13500
  }
  return OVERTIME_RATE_PER_HOUR
}

// Function to check if staff is a manager
const isManager = (jabatan: string): boolean => {
  const managerKeywords = ['Manager', 'CEO', 'SPV']
  return managerKeywords.some(keyword => jabatan.includes(keyword))
}

// Function to check if checkout time is at 17:00 or earlier (cut uang makan)
const isEarlyCheckout = (pulangTime: string, hasIzin: boolean = false): boolean => {
  if (!pulangTime || pulangTime === '00:00') return false
  const [hour, minute] = pulangTime.split(':').map(Number)

  // Exactly 17:00 always cuts uang makan regardless of izin status
  if (hour === 17 && minute === 0) return true

  // Before 17:00 - check izin first
  if (hour < 17) {
    return !hasIzin // Cut uang makan if no izin, don't cut if has izin
  }

  return false // 17:01 or later is OK
}

// Function to check if late 1 hour or more
const isLateOneHourOrMore = (terlambatTime: string): boolean => {
  if (!terlambatTime || terlambatTime === '00:00') return false
  const [hour, minute] = terlambatTime.split(':').map(Number)
  return hour >= 1 || (hour === 0 && minute >= 60)
}

// Function to convert comma decimal to point decimal
const convertCommaDecimal = (value: string | number): number => {
  if (typeof value === 'number') return value
  if (!value || value === '') return 0
  return parseFloat(value.toString().replace(',', '.'))
}

// Function to get day name from date string (DD/MM/YYYY)
const getDayName = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const [day, month, year] = dateStr.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return days[date.getDay()]
  } catch {
    return ''
  }
}

// Function to check if date is Sunday (auto libur)
const isSunday = (dateStr: string): boolean => {
  if (!dateStr) return false
  try {
    const [day, month, year] = dateStr.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    return date.getDay() === 0 // 0 = Sunday
  } catch {
    return false
  }
}

// Function to parse izin information from tanggal column
const parseIzinFromTanggal = (tanggal: string): { isIzin: boolean, jenisIzin: string, alasan: string } => {
  if (!tanggal) return { isIzin: false, jenisIzin: '', alasan: '' }

  const lowerTanggal = tanggal.toLowerCase()

  // Check for various izin patterns
  if (lowerTanggal.includes('izin')) {
    // Extract jenis izin and alasan
    const parts = lowerTanggal.split('izin')
    const jenisIzin = parts[0].trim()
    const alasan = parts[1]?.trim() || ''

    return {
      isIzin: true,
      jenisIzin,
      alasan
    }
  }

  return { isIzin: false, jenisIzin: '', alasan: '' }
}

// Function to check if izin should allow uang makan
const shouldGetUangMakanForIzin = (jenisIzin: string, alasan: string, isStaffManager: boolean): boolean => {
  // "Izin datang terlambat" - should get uang makan
  if (jenisIzin.includes('datang') && alasan.includes('terlambat')) {
    return true
  }

  // Sick with doctor's letter
  if (alasan.includes('dokter') || alasan.includes('surat') || alasan.includes('sakit')) {
    if (isStaffManager) {
      return true // Managers get uang makan even when sick
    }
    return false // Non-managers don't get uang makan when sick
  }

  // Regular izin - managers get uang makan
  if (isStaffManager) {
    return true
  }

  return false // Non-managers don't get uang makan for regular izin
}

// Manager-staff mapping (will be built from staff salaries)
const MANAGER_STAFF_MAP: { [key: string]: string } = {
  // Top M's team (managers)
  'Budi Suryanto': 'Top M',
  'Mucharom Rusdiana': 'Top M',
  'Syaiful Anam': 'Top M',
  'Widia Novitasari': 'Top M',
  'Nadira Maysa Suryanto': 'Top M',
  'Diah Ayu Fajar Cahyaningrum': 'Top M',

  // Mucharom Rusdiana's team
  'M. Bagus Suryo Laksono': 'Mucharom Rusdiana',
  'Laili Nisaatus Sholihah': 'Mucharom Rusdiana',
  'Fitri Nurcomariah': 'Mucharom Rusdiana',
  'Rahmat Ragil Hidayat': 'Mucharom Rusdiana',

  // Nadira Maysa Suryanto's team
  'Galuh Anjali Puspitasari': 'Nadira Maysa Suryanto',
  'Nadya Ambarwati Hariyanto': 'Nadira Maysa Suryanto',

  // Diah Ayu Fajar Cahyaningrum's team
  'Atika Permatasari': 'Diah Ayu Fajar Cahyaningrum',
  'Rizka Maulidah': 'Diah Ayu Fajar Cahyaningrum',
  'Fifien Ayu Ramadhani': 'Diah Ayu Fajar Cahyaningrum',

  // Widia Novitasari's team
  'Eko Prastio': 'Widia Novitasari',
  'In Amullah An Nafi': 'Widia Novitasari',
  'Muhammad Bintang Ageng': 'Widia Novitasari',
  'Tri Hariyono': 'Widia Novitasari',
  'Tata Wibowo': 'Widia Novitasari',
  'Achmad Baidowi': 'Widia Novitasari',
  'Solikatin': 'Widia Novitasari',
  'Nabila Maulidya Putri': 'Widia Novitasari',
  'Mita Nur Fitriani': 'Widia Novitasari',
  'Kasianto': 'Widia Novitasari',
  'Anis Munawaroh': 'Widia Novitasari',
  'Azmil Qurrota A\'yun': 'Widia Novitasari',
  'M Sadiq Djafaar Noeh': 'Widia Novitasari',
  'Nurva Dina Amalianti': 'Widia Novitasari',
  'Widodo Saputra': 'Widia Novitasari',
  'Natasha Dwi Aprilia': 'Widia Novitasari',
  'Ade Andreans S': 'Widia Novitasari',
  'Alek Sugianto': 'Widia Novitasari',
  'Bahriyah Nurjannah': 'Widia Novitasari',
  'Dedy Rosiyanto': 'Widia Novitasari',
  'Dewi Maryani': 'Widia Novitasari',
  'Imam Ghozali': 'Widia Novitasari',
  'Iva Andayani': 'Widia Novitasari',
  'Lutfiana Gilda Cahyawati': 'Widia Novitasari',
  'M Maarif': 'Widia Novitasari',
  'Miftachul Jannah': 'Widia Novitasari',
  'Mussarokah': 'Widia Novitasari',
  'Nenny Sofiana': 'Widia Novitasari',
  'Ratih': 'Widia Novitasari',
  'Rizqi Pramudya Lazuardi': 'Widia Novitasari',
  'Siti Fatimah': 'Widia Novitasari',
  'Suep': 'Widia Novitasari',
  'Sulastri': 'Widia Novitasari',
  'Sulistyorini': 'Widia Novitasari',
  'Supriadi': 'Widia Novitasari',
  'Suratno': 'Widia Novitasari',
  'Umi Suncani': 'Widia Novitasari',
}

export default function Home() {
  const [absensiData, setAbsensiData] = useState<AbsensiRow[]>([])
  const [lemburData, setLemburData] = useState<LemburRow[]>([])
  const [izinData, setIzinData] = useState<IzinRow[]>([])
  const [mergedData, setMergedData] = useState<MergedData[]>([])
  const [managerGroups, setManagerGroups] = useState<ManagerGroup[]>([])
  const [activeTab, setActiveTab] = useState<string>('confirmation')
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'lembur' | 'slip'>('upload')
  const [newStaffDetected, setNewStaffDetected] = useState<string[]>([])
  const [currentNewStaffIndex, setCurrentNewStaffIndex] = useState<number>(0)
  const [isProcessingNewStaff, setIsProcessingNewStaff] = useState<boolean>(false)
  const [overtimeConfirmations, setOvertimeConfirmations] = useState<ConfirmationItem[]>([])
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const slipRef = useRef<HTMLDivElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>(DEFAULT_STAFF_SALARIES)
  const [editingStaff, setEditingStaff] = useState<StaffSalary | null>(null)
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)

  // Load staff salaries from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('payroll360_staff_salaries')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if the cached data has the new fields (joinDate and status)
          const hasNewFields = parsed.some(staff => staff.joinDate !== undefined || staff.status !== undefined)
          if (!hasNewFields) {
            // If cached data is missing new fields, use defaults instead
            console.log('Cached staff data is outdated, using updated defaults')
            setStaffSalaries(DEFAULT_STAFF_SALARIES)
            // Save the updated data to localStorage
            localStorage.setItem('payroll360_staff_salaries', JSON.stringify(DEFAULT_STAFF_SALARIES))
          } else {
            setStaffSalaries(parsed)
          }
        }
      }
    } catch (error) {
      console.error('Error loading staff salaries from localStorage:', error)
    }
  }, [])

  // Save staff salaries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('payroll360_staff_salaries', JSON.stringify(staffSalaries))
    } catch (error) {
      console.error('Error saving staff salaries to localStorage:', error)
    }
  }, [staffSalaries])

  // Load payroll settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('payroll360_settings')
      if (saved) {
        setPayrollSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading payroll settings from localStorage:', error)
    }
  }, [])

  // Save payroll settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('payroll360_settings', JSON.stringify(payrollSettings))
    } catch (error) {
      console.error('Error saving payroll settings to localStorage:', error)
    }
  }, [payrollSettings])

  const handleFileUpload = (
    file: File,
    type: 'absensi' | 'lembur' | 'izin'
  ) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (type === 'absensi') {
          setAbsensiData(results.data as AbsensiRow[])
        } else if (type === 'lembur') {
          // Recalculate Total Diterima based on overtime rate
          const recalculatedLembur = (results.data as LemburRow[]).map(row => {
            const jamLembur = convertCommaDecimal(row['Jam Lembur'] || '0')
            const rate = getOvertimeRate(row.Nama)

            if (rate === 0) {
              // Use original value from CSV (for Achmad Baidowi)
              return row
            } else {
              // Recalculate with standard rate
              const totalDiterima = jamLembur * rate
              return {
                ...row,
                'Total Diterima': totalDiterima.toString()
              }
            }
          })
          setLemburData(recalculatedLembur)
        } else {
          // Parse izin data - handle date range format
          const parsedIzin: IzinRow[] = []
          results.data.forEach((row: any) => {
            const dateRange = row.Tanggal
            if (dateRange && dateRange.includes(' - ')) {
              // Handle date ranges (e.g., "08 September 2025 - 09 September 2025")
              const dates = dateRange.split(' - ')
              const startDate = parseDateFromString(dates[0])
              const endDate = parseDateFromString(dates[1])

              // Create entry for each date in range
              let currentDate = new Date(startDate)
              while (currentDate <= endDate) {
                parsedIzin.push({
                  Nama: row.Nama,
                  Tanggal: formatDate(currentDate),
                  Alasan: row.Alasan
                })
                currentDate.setDate(currentDate.getDate() + 1)
              }
            } else if (dateRange) {
              parsedIzin.push({
                Nama: row.Nama,
                Tanggal: parseDateFromString(dateRange).toLocaleDateString('id-ID'),
                Alasan: row.Alasan
              })
            }
          })
          setIzinData(parsedIzin)
        }
      },
    })
  }

  const parseDateFromString = (dateStr: string): Date => {
    const months: { [key: string]: number } = {
      'January': 0, 'February': 1, 'March': 2, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'October': 9, 'December': 11,
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    }

    const parts = dateStr.trim().split(' ')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = months[parts[1]]
      const year = parseInt(parts[2])
      return new Date(year, month, day)
    }
    return new Date(dateStr)
  }

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const processData = () => {
    // Merge data
    const merged: MergedData[] = []

    absensiData.forEach((absen) => {
      // Filter by Status Karyawan - only process 'permanen' and 'training', ignore others
      const statusKaryawan = absen['Status Karyawan']?.toLowerCase()
      if (statusKaryawan && (statusKaryawan === 'borongan' || statusKaryawan === 'magang' || statusKaryawan === 'kontrak')) {
        return // Skip non-permanen and non-training staff
      }

      const izin = izinData.find(
        (i) => i.Nama === absen.Nama && i.Tanggal === absen.Tanggal
      )

      merged.push({
        Nama: absen.Nama,
        Tanggal: absen.Tanggal,
        Masuk: absen.Masuk || '',
        Pulang: absen.Pulang || '',
        Terlambat: absen.Terlambat || '00:00',
        'Jam Kerja': absen['Jam Kerja'] || '',
        Izin: izin?.Alasan || '',
      })
    })

    setMergedData(merged)

    // Group by manager
    const groups: { [key: string]: ManagerGroup } = {}

    merged.forEach((data) => {
      const manager = MANAGER_STAFF_MAP[data.Nama]

      // Skip if staff is not mapped to any manager
      if (!manager) return

      if (!groups[manager]) {
        groups[manager] = {
          manager,
          staffs: [],
          confirmations: []
        }
      }

      let staff = groups[manager].staffs.find((s) => s.name === data.Nama)
      if (!staff) {
        staff = { name: data.Nama, data: [] }
        groups[manager].staffs.push(staff)
      }
      staff.data.push(data)

      // No need for late confirmations anymore
      // Only track missing attendance without izin for reference
      if ((!data.Masuk || !data.Pulang) && !data.Izin) {
        groups[manager].confirmations.push({
          Nama: data.Nama,
          Tanggal: data.Tanggal,
          Reason: `Missing ${!data.Masuk ? 'Masuk' : 'Pulang'} - No Izin`,
          Status: 'pending',
          Type: 'missing',
          Data: data
        })
      }
    })

    // Sort manager groups by specified order
    const managerOrder = ['Top M', 'Diah Ayu Fajar Cahyaningrum', 'Mucharom Rusdiana', 'Nadira Maysa Suryanto', 'Widia Novitasari']
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const indexA = managerOrder.indexOf(a.manager)
      const indexB = managerOrder.indexOf(b.manager)
      if (indexA === -1 && indexB === -1) return a.manager.localeCompare(b.manager)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    // Sort staff names alphabetically within each manager group
    sortedGroups.forEach(group => {
      group.staffs.sort((a, b) => a.name.localeCompare(b.name))
    })

    setManagerGroups(sortedGroups)

    // Detect new staff names not in DEFAULT_STAFF_SALARIES
    const allStaffNames = new Set<string>()
    merged.forEach(row => allStaffNames.add(row.Nama))

    const existingStaffNames = new Set(staffSalaries.map(s => s.name))
    const newStaff = Array.from(allStaffNames).filter(name => !existingStaffNames.has(name))
    setNewStaffDetected(newStaff)

    // Reset current index when new staff are detected
    if (newStaff.length > 0) {
      setCurrentNewStaffIndex(0)
      setIsProcessingNewStaff(true)
    } else {
      setIsProcessingNewStaff(false)
    }

    // Set first manager tab as active
    if (sortedGroups.length > 0) {
      setActiveTab(sortedGroups[0].manager)
    }

    // Check if there are new staff members
    if (newStaff.length > 0) {
      // Stay on upload step and show new staff modal
      // Modal will show automatically due to newStaffDetected state change
    } else {
      // No new staff, go directly to lembur step
      setStep('lembur')
    }
  }

  const handleConfirmation = (
    managerIndex: number,
    confirmationIndex: number,
    status: 'approved' | 'rejected'
  ) => {
    const updated = [...managerGroups]
    updated[managerIndex].confirmations[confirmationIndex].Status = status
    setManagerGroups(updated)
  }

  const allConfirmationsProcessed = () => {
    return managerGroups.every((group) =>
      group.confirmations.every((conf) => conf.Status !== 'pending')
    )
  }

  const calculateSalarySlips = () => {
    const slips: SalarySlip[] = []

    // Get all unique staff names
    const allStaffNames = new Set<string>()
    absensiData.forEach(row => allStaffNames.add(row.Nama))
    izinData.forEach(row => allStaffNames.add(row.Nama))
    lemburData.forEach(row => allStaffNames.add(row.Nama))

    allStaffNames.forEach(nama => {
      // Get staff data
      const staffAbsensi = mergedData.filter(row => row.Nama === nama)
      const staffIzin = izinData.filter(row => row.Nama === nama)
      const staffLembur = lemburData.filter(row => row.Nama === nama)

      // Get staff salary config
      const staffConfig = staffSalaries.find(s => s.name === nama)
      const gajiPerHari = staffConfig?.dailyRate || 150000
      const manager = staffConfig?.manager || MANAGER_STAFF_MAP[nama] || 'Unknown Manager'

      // Count working days (days with attendance record)
      let totalHariKerja = 0
      let hariMakan = 0 // Days eligible for meal allowance
      let potonganTerlambat = 0

      const isStaffManager = isManager(staffConfig?.jabatan || '')

      // Special case: Budi Suryanto always gets 25 working days
      const isBudiSuryanto = nama.toLowerCase().includes('budi suryanto')
      const isAlek = nama.toLowerCase().includes('alek')

      if (isBudiSuryanto) {
        totalHariKerja = 25 // Fixed 25 working days for Budi Suryanto
      } else if (isAlek) {
        totalHariKerja = 0 // Alek gets no working days (insentif only)
      }

      // Skip absensi calculation for Budi Suryanto and Alek - they get special treatment
      if (!isBudiSuryanto && !isAlek) {
        staffAbsensi.forEach(row => {
        // Skip Libur and Sunday entries - these don't count for anything
        if (row.Masuk === 'Libur' || isSunday(row.Tanggal)) {
          return // Skip this row completely
        }

        // Handle Absen based on settings
        if (row.Masuk === 'Absen') {
          // Check if should count as working day for salary (only non-manager loses gaji harian)
          const shouldCutGaji = !isStaffManager && payrollSettings.potongGajiHarian.absenNonManager
          if (!shouldCutGaji) {
            totalHariKerja++ // Manager keeps the working day payment even when absent
          }

          // Check if should get uang makan when absent
          const shouldCutUangMakan = isStaffManager
            ? payrollSettings.potongUangMakan.absenManager
            : payrollSettings.potongUangMakan.absenNonManager

          if (!shouldCutUangMakan) {
            hariMakan++ // Gets uang makan even when absent
          }

          return // Done processing this absen row
        }

        // Parse izin information from the tanggal column
        const izinInfo = parseIzinFromTanggal(row.Tanggal)
        const dayName = getDayName(row.Tanggal)
        const isSaturday = dayName === 'Sab'

        if (!izinInfo.isIzin && !row.Izin) {
          // No izin = working day
          totalHariKerja++

          // Check uang makan eligibility based on settings
          let eligibleForMakan = true

          // Check late more than 1 hour
          if (payrollSettings.potongUangMakan.lateMoreThan1Hour && isLateOneHourOrMore(row.Terlambat)) {
            eligibleForMakan = false
          }

          // Check checkout at exactly 17:00 (but not on Saturday - Saturday normal end is 15:00)
          if (payrollSettings.potongUangMakan.checkoutAt17 && row.Pulang === '17:00' && !isSaturday) {
            eligibleForMakan = false
          }

          // Check checkout before 17:00 (but not on Saturday - Saturday normal end is 15:00)
          if (payrollSettings.potongUangMakan.checkoutBefore17 && isEarlyCheckout(row.Pulang, false) && row.Pulang !== '17:00' && !isSaturday) {
            eligibleForMakan = false
          }

          if (eligibleForMakan) {
            hariMakan++
          }
        } else {
          // Has izin (either in izin file or in tanggal column)
          const jenisIzin = izinInfo.isIzin ? izinInfo.jenisIzin : row.Izin?.toLowerCase() || ''
          const alasan = izinInfo.isIzin ? izinInfo.alasan : ''

          // Check if should get uang makan for this izin
          let eligibleForMakan = shouldGetUangMakanForIzin(jenisIzin, alasan, isStaffManager)

          // Even with izin, cut uang makan if pulang is exactly 17:00 (but not on Saturday)
          if (eligibleForMakan && isEarlyCheckout(row.Pulang, true) && !isSaturday) {
            eligibleForMakan = false
          }

          if (eligibleForMakan) {
            // Gets uang makan
            // If sick with doctor's letter, count as working day for gaji
            if (alasan.includes('dokter') || alasan.includes('surat') || alasan.includes('sakit')) {
              totalHariKerja++
            }
            hariMakan++
          } else {
            // No uang makan for this izin
            // If sick with doctor's letter, count as working day for gaji
            if (alasan.includes('dokter') || alasan.includes('surat') || alasan.includes('sakit')) {
              totalHariKerja++
            }
            // Regular izin: no working day and no uang makan
          }
        }
      })
      } else {
        // Special cases
        if (isBudiSuryanto) {
          // Budi Suryanto gets full uang makan (25 days)
          hariMakan = 25
        } else if (isAlek) {
          // Alek gets no uang makan (insentif only)
          hariMakan = 0
        }
      }

      // Calculate lembur total
      const totalLembur = staffLembur.reduce((sum, row) => {
        const amount = row['Total Diterima'] ? parseFloat(row['Total Diterima'].toString().replace(/\./g, '').replace(',', '.')) : 0
        return sum + amount
      }, 0)

      const gajiPokok = totalHariKerja * gajiPerHari
      const uangMakan = hariMakan * UANG_MAKAN_PER_HARI
      const tunjanganJabatan = staffConfig?.tunjanganJabatan || 0
      const insentif = staffConfig?.insentif || 0
      const pinjaman = staffConfig?.pinjaman || 0
      const totalGaji = gajiPokok + uangMakan - potonganTerlambat + totalLembur + tunjanganJabatan + insentif - pinjaman

      slips.push({
        nama,
        manager,
        totalHariKerja,
        gajiPokok,
        uangMakan,
        potonganTerlambat,
        totalLembur,
        totalGaji,
        absensi: staffAbsensi,
        izin: staffIzin,
        lembur: staffLembur
      })
    })

    setSalarySlips(slips)

    // Set initial active tab to VGI if exists, otherwise first sumber dana
    const hasVGI = slips.some(slip => {
      const staffConfig = staffSalaries.find(s => s.name === slip.nama)
      return staffConfig?.vgiAmount
    })

    if (hasVGI) {
      setActiveTab('VGI')
    } else {
      const sumberDanaGroups = new Set<string>()
      slips.forEach(slip => {
        const staffConfig = staffSalaries.find(s => s.name === slip.nama)
        if (staffConfig?.sumberDana) {
          sumberDanaGroups.add(staffConfig.sumberDana)
        }
      })
      const firstSumberDana = Array.from(sumberDanaGroups).sort()[0]
      if (firstSumberDana) {
        setActiveTab(firstSumberDana)
      }
    }

    setStep('slip')
  }

  
  const handleOvertimeConfirmation = (index: number, status: 'approved' | 'rejected') => {
    const updated = [...overtimeConfirmations]
    updated[index].Status = status
    setOvertimeConfirmations(updated)
  }

  const allOvertimeConfirmationsProcessed = () => {
    return overtimeConfirmations.every((conf) => conf.Status !== 'pending')
  }

  const handleBulkAction = (managerName: string, action: 'approved' | 'rejected') => {
    const updatedGroups = managerGroups.map(group => {
      if (group.manager === managerName) {
        return {
          ...group,
          confirmations: group.confirmations.map(conf => ({
            ...conf,
            Status: conf.Status === 'pending' ? action : conf.Status
          }))
        }
      }
      return group
    })
    setManagerGroups(updatedGroups)
  }

  const copySlipAsImage = async (staffName: string) => {
    if (!slipRef.current) {
      alert('Slip not found. Please try again.')
      return
    }

    try {
      alert('Generating image... Please wait.')

      // Capture the slip directly without modifications first
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Fix only color issues, keep layout
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement

            // Check computed styles for problematic colors
            const computedStyle = clonedDoc.defaultView?.getComputedStyle(el)
            if (computedStyle) {
              // Fix only problematic oklch colors
              if (computedStyle.color?.includes('oklch') || computedStyle.color?.includes('color-mix')) {
                htmlEl.style.color = 'black'
              }
              if (computedStyle.backgroundColor?.includes('oklch') || computedStyle.backgroundColor?.includes('color-mix')) {
                htmlEl.style.backgroundColor = 'white'
              }
              if (computedStyle.borderTopColor?.includes('oklch') || computedStyle.borderTopColor?.includes('color-mix')) {
                htmlEl.style.borderTopColor = 'black'
              }
              if (computedStyle.borderBottomColor?.includes('oklch') || computedStyle.borderBottomColor?.includes('color-mix')) {
                htmlEl.style.borderBottomColor = 'black'
              }
              if (computedStyle.borderLeftColor?.includes('oklch') || computedStyle.borderLeftColor?.includes('color-mix')) {
                htmlEl.style.borderLeftColor = 'black'
              }
              if (computedStyle.borderRightColor?.includes('oklch') || computedStyle.borderRightColor?.includes('color-mix')) {
                htmlEl.style.borderRightColor = 'black'
              }
            }
          })
        }
      })

      // Convert to blob and copy to clipboard
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to generate image')
          return
        }

        try {
          // Copy to clipboard
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ])
          alert(`✅ Slip image for ${staffName} copied to clipboard!`)
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError)

          // Try alternative method - create a new canvas from the first one
          try {
            const dataUrl = canvas.toDataURL('image/png')
            const img = new Image()
            img.src = dataUrl

            img.onload = async () => {
              // Create a fresh canvas
              const freshCanvas = document.createElement('canvas')
              freshCanvas.width = canvas.width
              freshCanvas.height = canvas.height
              const ctx = freshCanvas.getContext('2d')!

              // Draw white background
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, freshCanvas.width, freshCanvas.height)

              // Draw the image
              ctx.drawImage(img, 0, 0)

              const freshBlob = await new Promise<Blob>((resolve) => {
                freshCanvas.toBlob((blob) => resolve(blob!), 'image/png')
              })

              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': freshBlob
                })
              ])
              alert(`✅ Slip image for ${staffName} copied to clipboard!`)
            }
          } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError)

            // Final fallback - download the image
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `slip-gaji-${staffName.replace(/\s+/g, '-').toLowerCase()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            alert('⬇️ Image downloaded instead')
          }
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error generating image:', error)

      // If html2canvas still fails, try a completely different approach
      try {
        // Simple approach - just try to capture the element with minimal config
        const simpleCanvas = await html2canvas(slipRef.current, {
          backgroundColor: '#ffffff'
        })

        const blob = await new Promise<Blob>((resolve) => {
          simpleCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        })

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        alert(`✅ Slip image for ${staffName} copied to clipboard!`)
      } catch (simpleError) {
        alert('❌ Copy failed. Please take a screenshot manually.')
      }
    }
  }

  const copyAllSlips = async () => {
    for (const slip of salarySlips) {
      setSelectedStaff(slip.nama)
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500))
      await copySlipAsImage(slip.nama)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    setSelectedStaff(null)
  }

  const handlePasswordSubmit = () => {
    if (passwordInput === EDIT_PASSWORD) {
      setIsEditMode(true)
      setPasswordInput('')
    } else {
      alert('Password salah!')
      setPasswordInput('')
    }
  }

  const handleSaveStaff = () => {
    if (!editingStaff) return

    const exists = staffSalaries.find(s => s.name === editingStaff.name)
    if (exists) {
      // Update existing
      setStaffSalaries(staffSalaries.map(s =>
        s.name === editingStaff.name ? editingStaff : s
      ))
    } else {
      // Add new
      setStaffSalaries([...staffSalaries, editingStaff])
    }

    // Check if this was a new staff member
    const isNewStaff = newStaffDetected.includes(editingStaff.name)
    if (isNewStaff) {
      if (currentNewStaffIndex < newStaffDetected.length - 1) {
        // Move to next staff
        setCurrentNewStaffIndex(currentNewStaffIndex + 1)
      } else {
        // Last staff, clear and go to lembur
        setNewStaffDetected([])
        setIsProcessingNewStaff(false)
        setStep('lembur')
      }
    }

    setEditingStaff(null)
  }

  const handleDeleteStaff = (name: string) => {
    if (confirm(`Yakin mau hapus ${name}?`)) {
      setStaffSalaries(staffSalaries.filter(s => s.name !== name))
    }
  }

  const getSelectedSlip = () => {
    return salarySlips.find(s => s.nama === selectedStaff)
  }

  const renderSalarySlip = () => {
    const slip = getSelectedSlip()
    if (!slip) return null

    const hariMakan = slip.uangMakan / UANG_MAKAN_PER_HARI
    const staffConfig = staffSalaries.find(s => s.name === slip.nama)
    const gajiPerHari = staffConfig?.dailyRate || 150000
    const isAlek = slip.nama.toLowerCase().includes('alek')

    return (
      <div className="space-y-0">
        {/* Salary Slip Container - this is what gets copied */}
        <div ref={slipRef} className="bg-white space-y-0 max-w-[900px] mx-auto border-4 border-black" style={{fontFamily: 'Arial, sans-serif'}}>
          {/* SECTION 1: Salary Slip Summary */}
          <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-lg font-bold">VIDO GARMENT</h1>
              <p className="text-[10px]">Jl. Sidosermo IV Gg. No.37, Surabaya</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold" style={{color: '#999'}}>FABRIK GROUP</h2>
            </div>
          </div>

          <h2 className="text-center text-xl font-bold mb-3">{isAlek ? 'SLIP INSENTIF' : 'SLIP GAJI KARYAWAN'}</h2>

          {isAlek ? (
            /* Special Alek Layout - Only Insentif and Rekening */
            <>
              {/* Employee Info - Minimal */}
              <div className="space-y-0.5 mb-3 text-[11px]">
                <div className="flex">
                  <span className="w-28">Bulan</span>
                  <span className="mr-2">:</span>
                  <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Nama</span>
                  <span className="mr-2">:</span>
                  <span>{slip.nama}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Jabatan</span>
                  <span className="mr-2">:</span>
                  <span>{staffConfig?.jabatan || '-'}</span>
                </div>
              </div>

              {/* Insentif Box */}
              <div className="border-2 border-black p-3 mb-3">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-bold">Insentif</span>
                  <div className="flex items-center gap-1">
                    <span>Rp</span>
                    <span className="font-bold text-lg">{(staffConfig?.insentif || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

  
              {/* Signature */}
              <div className="text-right mt-6 text-[10px]">
                <p>Surabaya, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="mt-1">Direktur</p>
                <p className="mt-1 font-bold">Budi Suryanto</p>
              </div>
            </>
          ) : (
            /* Normal Slip Layout */
            <>
              {/* Employee Info */}
              <div className="space-y-0.5 mb-3 text-[11px]">
                <div className="flex">
                  <span className="w-28">Bulan</span>
                  <span className="mr-2">:</span>
                  <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Nama</span>
                  <span className="mr-2">:</span>
                  <span>{slip.nama}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Jabatan</span>
                  <span className="mr-2">:</span>
                  <span>{staffConfig?.jabatan || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Join</span>
                  <span className="mr-2">:</span>
                  <span>{staffConfig?.joinDate || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Status</span>
                  <span className="mr-2">:</span>
                  <span>{staffConfig?.status || 'permanen'}</span>
                </div>
                <div className="flex">
                  <span className="w-28">Hari Masuk</span>
                  <span className="mr-2">:</span>
                  <span>{slip.totalHariKerja} hari</span>
                </div>
                <div className="flex">
                  <span className="w-28">Gaji + UM / hari</span>
                  <span className="mr-2">:</span>
                  <span>Rp {(gajiPerHari + UANG_MAKAN_PER_HARI).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Penghasilan & Potongan in Boxes Side by Side */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Penghasilan Box */}
                <div className="border-2 border-black p-2">
                  <h3 className="font-bold mb-1.5 text-[11px] underline">Penghasilan</h3>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Gaji</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium">{slip.gajiPokok.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Lembur</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium bg-yellow-200 px-1">{slip.totalLembur.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Tunjangan Jabatan</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium bg-yellow-200 px-1">{(staffConfig?.tunjanganJabatan || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Insentif</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium bg-yellow-200 px-1">{(staffConfig?.insentif || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                      </div>
                </div>

                {/* Potongan Box */}
                <div className="border-2 border-black p-2">
                  <h3 className="font-bold mb-1.5 text-[11px] underline">Potongan</h3>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Pinjaman</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium bg-red-200 px-1">{(staffConfig?.pinjaman || 0) > 0 ? (staffConfig?.pinjaman || 0).toLocaleString('id-ID') : '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Keterlambatan</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px]">Rp</span>
                        <span className="font-medium">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uang Makan Box with Green Highlight */}
              <div className="border border-black p-1 mb-3 inline-block bg-lime-300">
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span>Uang Makan = {hariMakan} x Rp 12.000 = {slip.uangMakan.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-3 text-[11px]">
                <span className="font-bold">Total</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold bg-yellow-200 px-2">Rp {(slip.gajiPokok + slip.totalLembur + slip.uangMakan + (staffConfig?.tunjanganJabatan || 0) + (staffConfig?.insentif || 0) - (staffConfig?.pinjaman || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Penerimaan Boxes */}
              <div className="space-y-2 mt-4 mb-4">
                <div className="border-2 border-black p-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold">Penerimaan Bersih =</span>
                    <div className="flex items-center gap-1">
                      <span>Rp</span>
                      <span className="font-bold">{(slip.gajiPokok + slip.totalLembur + slip.uangMakan + (staffConfig?.tunjanganJabatan || 0) + (staffConfig?.insentif || 0) - (staffConfig?.pinjaman || 0)).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Check if person has VGI amount - show split transfer */}
                {staffConfig?.vgiAmount ? (
                  <>
                    <div className="border-2 border-black p-1.5 bg-blue-50">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold">Transfer VGI =</span>
                        <div className="flex items-center gap-1">
                          <span>Rp</span>
                          <span className="font-bold">{staffConfig.vgiAmount.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-2 border-black p-1.5 bg-green-50">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold">Transfer {staffConfig.sumberDana} =</span>
                        <div className="flex items-center gap-1">
                          <span>Rp</span>
                          <span className="font-bold">{((slip.gajiPokok + slip.totalLembur + slip.uangMakan + (staffConfig?.tunjanganJabatan || 0) + (staffConfig?.insentif || 0) - (staffConfig?.pinjaman || 0)) - staffConfig.vgiAmount).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border-2 border-black p-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold">Penerimaan Transfer =</span>
                      <div className="flex items-center gap-1">
                        <span>Rp</span>
                        <span className="font-bold">{(slip.gajiPokok + slip.totalLembur + slip.uangMakan + (staffConfig?.tunjanganJabatan || 0) + (staffConfig?.insentif || 0) - (staffConfig?.pinjaman || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

  
              {/* Signature */}
              <div className="text-right mt-6 text-[10px]">
                <p>Surabaya, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="mt-1">Direktur</p>
                <p className="mt-1 font-bold">Budi Suryanto</p>
              </div>
            </>
          )}
        </div>

        {/* Lembur & Absensi Tables - Frame outline */}
        {(!isAlek || slip.nama.toLowerCase().includes('budi suryanto')) && (
          <div className="px-4 pb-4 border-t-4 border-black">
            <div className="grid grid-cols-2 gap-4">
              {/* Left - Lembur Table */}
              <div>
                <h3 className="font-bold text-[12px] mb-1">DAFTAR LEMBUR {slip.nama.split(' ')[0].toUpperCase()}</h3>
                <p className="text-[10px] mb-1">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                {slip.lembur.length > 0 ? (
                  <div className="border border-black">
                    <table className="w-full border-collapse text-[9px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-1 py-1">Tanggal</th>
                          <th className="border border-black px-1 py-1">Mulai</th>
                          <th className="border border-black px-1 py-1">Jam</th>
                          <th className="border border-black px-1 py-1">Rp/Jam</th>
                          <th className="border border-black px-1 py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slip.lembur.map((l, i) => {
                          const totalDiterimaStr = l['Total Diterima']?.toString() || '0'
                          const totalDiterima = parseFloat(totalDiterimaStr.replace(/\./g, '').replace(',', '.'))
                          const jamLembur = convertCommaDecimal(l['Jam Lembur'] || '0')
                          const rpPerJam = jamLembur > 0 ? Math.round(totalDiterima / jamLembur) : 0
                          return (
                            <tr key={i}>
                              <td className="border border-black px-1 py-1">{l.Tanggal}</td>
                              <td className="border border-black px-1 py-1 text-center">{l['Jam Mulai']}</td>
                              <td className="border border-black px-1 py-1 text-center">{jamLembur}</td>
                              <td className="border border-black px-1 py-1 text-right">{rpPerJam.toLocaleString('id-ID')}</td>
                              <td className="border border-black px-1 py-1 text-right">{Math.round(totalDiterima).toLocaleString('id-ID')}</td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan={2} className="border border-black px-1 py-1">Total</td>
                          <td className="border border-black px-1 py-1 text-center">
                            {slip.lembur.reduce((sum, l) => sum + convertCommaDecimal(l['Jam Lembur'] || '0'), 0).toFixed(2)}
                          </td>
                          <td className="border border-black px-1 py-1"></td>
                          <td className="border border-black px-1 py-1 text-right">{slip.totalLembur.toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">Tidak ada data lembur</p>
                )}
              </div>

              {/* Right - Absensi Table */}
              <div>
                <h3 className="font-bold text-[12px] mb-1">ABSENSI {slip.nama.split(' ')[0].toUpperCase()}</h3>
                <p className="text-[10px] mb-1">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <div className="border border-black">
                  <table className="w-full border-collapse text-[9px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black px-1 py-1">No</th>
                        <th className="border border-black px-1 py-1">Hari</th>
                        <th className="border border-black px-1 py-1">Tanggal</th>
                        <th className="border border-black px-1 py-1">Masuk</th>
                        <th className="border border-black px-1 py-1">Pulang</th>
                        <th className="border border-black px-1 py-1">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let workingDayNumber = 0
                        return slip.absensi.map((row, i) => {
                          // Parse izin information from tanggal column
                          const izinInfo = parseIzinFromTanggal(row.Tanggal)
                          const hasIzin = izinInfo.isIzin || (row.Izin && row.Izin.trim() !== '')
                          const dayName = getDayName(row.Tanggal)
                          const isLibur = row.Masuk === 'Libur' || isSunday(row.Tanggal)
                          const isAbsen = row.Masuk === 'Absen'

                          // Only increment number if not libur/absen
                          const displayNumber = (isLibur || isAbsen) ? '-' : ++workingDayNumber

                          let bgColor = ''
                          let keterangan = ''

                          if (isLibur) {
                            bgColor = 'bg-red-200' // Libur (red background)
                            keterangan = 'Libur'
                          } else if (isAbsen) {
                            bgColor = 'bg-yellow-200' // Absen (yellow background)
                            keterangan = 'Absen'
                          } else if (hasIzin) {
                            // Check if uang makan is cut for this izin
                            const jenisIzin = izinInfo.isIzin ? izinInfo.jenisIzin : row.Izin?.toLowerCase() || ''
                            const alasan = izinInfo.isIzin ? izinInfo.alasan : ''
                            let getsUangMakan = shouldGetUangMakanForIzin(jenisIzin, alasan, isManager(staffSalaries.find(s => s.name === slip.nama)?.jabatan || ''))

                            // Even with izin, cut uang makan if pulang is exactly 17:00 (but not on Saturday)
                            if (getsUangMakan && isEarlyCheckout(row.Pulang, true) && dayName !== 'Sab') {
                              getsUangMakan = false
                            }

                            if (!getsUangMakan) {
                              bgColor = 'bg-yellow-200' // Uang makan cut
                            } else {
                              bgColor = 'bg-gray-100' // Uang makan not cut
                            }

                            keterangan = row.Izin || jenisIzin || alasan || 'Izin'
                          } else if (isLateOneHourOrMore(row.Terlambat) || (isEarlyCheckout(row.Pulang, false) && dayName !== 'Sab')) {
                            bgColor = 'bg-yellow-200' // Uang makan cut (late/early)
                            if (row.Terlambat !== '00:00') {
                              keterangan = `Terlambat ${row.Terlambat}`
                            } else {
                              // Check if pulang is exactly 17:00 (but not on Saturday - Saturday normal end is 15:00)
                              if (row.Pulang === '17:00' && dayName !== 'Sab') {
                                keterangan = 'tidak check out'
                              } else if (dayName !== 'Sab') {
                                keterangan = 'Pulang Awal'
                              }
                            }
                          } else if (row.Masuk === '00:00' && row.Pulang === '00:00') {
                            bgColor = 'bg-red-200' // Not masuk (libur)
                            keterangan = 'Tidak Masuk'
                          }

                          return (
                            <tr key={i} className={bgColor}>
                              <td className="border border-black px-1 py-1 text-center">{displayNumber}</td>
                            <td className="border border-black px-1 py-1 text-center font-bold">{dayName}</td>
                            <td className="border border-black px-1 py-1 text-center">{row.Tanggal}</td>
                            <td className="border border-black px-1 py-1 text-center">{isLibur || isAbsen ? row.Masuk : row.Masuk}</td>
                            <td className="border border-black px-1 py-1 text-center">{isLibur || isAbsen ? '-' : row.Pulang}</td>
                            <td className="border border-black px-1 py-1 text-center text-[8px]">{keterangan}</td>
                          </tr>
                        )
                      })
                    })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bank Account Information - Outside copy container */}
      {(staffConfig?.rekening || staffConfig?.atasNamaRekening || staffConfig?.bank || true) && (
        <div className="max-w-[900px] mx-auto mt-2 bg-white p-4 border-2 border-black" style={{fontFamily: 'Arial, sans-serif'}}>
          <h3 className="font-bold mb-2 text-[11px] underline">Informasi Rekening</h3>
          <div className="space-y-1 text-[10px]">
            {staffConfig?.bank && (
              <div className="flex">
                <span className="w-24 font-medium">Bank</span>
                <span className="mr-2">:</span>
                <span className="font-bold">{staffConfig.bank}</span>
              </div>
            )}
            {staffConfig?.rekening && (
              <div className="flex">
                <span className="w-24 font-medium">No. Rekening</span>
                <span className="mr-2">:</span>
                <span className="font-mono font-bold">{staffConfig.rekening}</span>
              </div>
            )}
            {staffConfig?.atasNamaRekening && (
              <div className="flex">
                <span className="w-24 font-medium">Atas Nama</span>
                <span className="mr-2">:</span>
                <span className="font-bold">{staffConfig.atasNamaRekening}</span>
              </div>
            )}
            <div className="flex items-center mt-3 pt-3 border-t border-gray-300">
              <span className="w-24 font-medium">💸 Pinjaman</span>
              <span className="mr-2">:</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">Rp</span>
                <input
                  type="number"
                  value={staffConfig?.pinjaman || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    const updatedStaff = staffSalaries.map(s =>
                      s.name === slip.nama ? {...s, pinjaman: value} : s
                    )
                    setStaffSalaries(updatedStaff)
                  }}
                  className="w-32 px-2 py-1 border-2 border-red-300 rounded focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none font-mono text-[10px]"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">(akan dipotong dari gaji)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${step === 'upload' ? 'flex flex-col items-center justify-center' : ''}`}>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl shadow-md">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            💼 Payroll360 Automation
          </h1>
          <div className="flex gap-3">
            {step === 'upload' && !isEditMode && (
              <>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  ⚙️ Rules Settings
                </button>
                <button
                  onClick={() => {
                    const password = prompt('Masukkan password:')
                    if (password === EDIT_PASSWORD) {
                      setIsEditMode(true)
                    } else if (password) {
                      alert('Password salah!')
                    }
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  👥 Edit Staff Salaries
                </button>
              </>
            )}
            {isEditMode && (
              <button
                onClick={() => setIsEditMode(false)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                🔒 Lock Edit Mode
              </button>
            )}
          </div>
        </div>

        {step === 'upload' && !isEditMode && (
          <div className="space-y-8">
            <div className="bg-white p-12 rounded-2xl shadow-lg mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-gray-800 mb-4">Upload CSV Files</h2>
              </div>

              <div className="grid grid-cols-3 gap-8 my-12">
                {/* Absensi Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'absensi')
                      }}
                      className="hidden"
                    />
                    <div className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-6 rounded-xl font-bold text-lg text-center cursor-pointer shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1 relative">
                      {absensiData.length > 0 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                      <div className="text-2xl mb-2">📋</div>
                      <div>Select Absensi</div>
                    </div>
                  </label>
                  {absensiData.length > 0 && (
                    <div className="mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ {absensiData.length} records loaded
                      </p>
                    </div>
                  )}
                </div>

                {/* Lembur Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'lembur')
                      }}
                      className="hidden"
                    />
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 rounded-xl font-bold text-lg text-center cursor-pointer shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1 relative">
                      {lemburData.length > 0 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                      <div className="text-2xl mb-2">⏰</div>
                      <div>Select Lembur</div>
                    </div>
                  </label>
                  {lemburData.length > 0 && (
                    <div className="mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ {lemburData.length} records loaded
                      </p>
                    </div>
                  )}
                </div>

                {/* Izin Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'izin')
                      }}
                      className="hidden"
                    />
                    <div className="bg-gradient-to-br from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white px-8 py-6 rounded-xl font-bold text-lg text-center cursor-pointer shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1 relative">
                      {izinData.length > 0 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                      <div className="text-2xl mb-2">📝</div>
                      <div>Select Izin</div>
                    </div>
                  </label>
                  {izinData.length > 0 && (
                    <div className="mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ {izinData.length} records loaded
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-16">
                <button
                  onClick={processData}
                  disabled={!absensiData.length || !lemburData.length || !izinData.length}
                  className={`${
                    (!absensiData.length || !lemburData.length || !izinData.length)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer transform hover:scale-105'
                  } text-white px-12 py-4 rounded-xl font-bold text-xl shadow-xl transition-all duration-200`}
                >
                  📋 Preview Absensi
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && isEditMode && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold">Edit Staff Salaries</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Reset semua data ke default? Perubahan akan hilang!')) {
                      setStaffSalaries(DEFAULT_STAFF_SALARIES)
                      localStorage.removeItem('payroll360_staff_salaries')
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  🔄 Reset to Default
                </button>
                <button
                  onClick={() => setEditingStaff({ name: '', dailyRate: 0, manager: 'Top M', jabatan: '', tunjanganJabatan: 0, lembur: 0, insentif: 0, sumberDana: '', vgiAmount: 0, rekening: '', atasNamaRekening: '', bank: '' })}
                  style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                + Add New Staff
              </button>
              </div>
            </div>

            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                    <th className="border border-gray-300 px-3 py-3 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap w-48">Nama</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap w-52">Jabatan</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap w-32">Gaji Harian</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap w-36">Tunjangan</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap w-28">Lembur</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap w-28">Insentif</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold text-xs uppercase tracking-wider whitespace-nowrap w-20">Dana</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-bold text-xs uppercase tracking-wider whitespace-nowrap w-32">VGI</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-bold text-xs uppercase tracking-wider whitespace-nowrap w-44">Manager</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-bold text-xs uppercase tracking-wider whitespace-nowrap w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSalaries.sort((a, b) => a.name.localeCompare(b.name)).map((staff, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors duration-150 even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2.5 text-gray-800 font-medium">{staff.name}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-gray-700 text-xs">{staff.jabatan}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-right text-gray-800 font-mono text-xs">{staff.dailyRate.toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-right text-gray-800 font-mono text-xs">{staff.tunjanganJabatan.toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-right text-gray-600 font-mono text-xs">{(staff.lembur || 0).toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-right text-gray-600 font-mono text-xs">{(staff.insentif || 0).toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          staff.sumberDana === 'D360' ? 'bg-purple-100 text-purple-700' :
                          staff.sumberDana === 'SKG' ? 'bg-blue-100 text-blue-700' :
                          staff.sumberDana === 'RCP' ? 'bg-green-100 text-green-700' :
                          staff.sumberDana === 'KSP' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {staff.sumberDana || '-'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2.5 text-right font-mono text-xs">
                        {staff.vgiAmount ? (
                          <span className="text-blue-700 font-semibold">{staff.vgiAmount.toLocaleString('id-ID')}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2.5 text-gray-700 text-xs">{staff.manager}</td>
                      <td className="border border-gray-200 px-3 py-2.5 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => setEditingStaff(staff)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors duration-150 shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors duration-150 shadow-sm"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Modal */}
            {editingStaff && (
              <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-slideUp">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {editingStaff.name ? '✏️ Edit Staff' : '➕ Add New Staff'}
                    </h3>
                    <button
                      onClick={() => setEditingStaff(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Nama */}
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">👤 Nama Lengkap</label>
                      <input
                        type="text"
                        value={editingStaff.name}
                        onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        placeholder="e.g. Budi Suryanto"
                      />
                    </div>

                    {/* Jabatan */}
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">💼 Jabatan</label>
                      <input
                        type="text"
                        value={editingStaff.jabatan}
                        onChange={(e) => setEditingStaff({...editingStaff, jabatan: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        placeholder="e.g. Production Helper"
                      />
                    </div>

                    {/* Gaji Harian */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">💰 Gaji Harian</label>
                      <input
                        type="number"
                        value={editingStaff.dailyRate}
                        onChange={(e) => setEditingStaff({...editingStaff, dailyRate: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-mono"
                        placeholder="150000"
                      />
                    </div>

                    {/* Tunjangan */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">💵 Tunjangan Jabatan</label>
                      <input
                        type="number"
                        value={editingStaff.tunjanganJabatan}
                        onChange={(e) => setEditingStaff({...editingStaff, tunjanganJabatan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-mono"
                        placeholder="0"
                      />
                    </div>

                    {/* Lembur */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">⏰ Lembur</label>
                      <input
                        type="number"
                        value={editingStaff.lembur || 0}
                        onChange={(e) => setEditingStaff({...editingStaff, lembur: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none font-mono"
                        placeholder="0"
                      />
                    </div>

                    {/* Insentif */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">💵 Insentif</label>
                      <input
                        type="number"
                        value={editingStaff.insentif || 0}
                        onChange={(e) => setEditingStaff({...editingStaff, insentif: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-mono"
                        placeholder="0"
                      />
                    </div>

                    {/* Sumber Dana */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">🏦 Sumber Dana</label>
                      <select
                        value={editingStaff.sumberDana || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, sumberDana: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-semibold"
                      >
                        <option value="">-- Pilih --</option>
                        <option value="D360">🟣 D360</option>
                        <option value="SKG">🔵 SKG</option>
                        <option value="RCP">🟢 RCP</option>
                        <option value="KSP">🟠 KSP</option>
                      </select>
                    </div>

                    {/* VGI Amount */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">💎 VGI Amount</label>
                      <input
                        type="number"
                        value={editingStaff.vgiAmount || 0}
                        onChange={(e) => setEditingStaff({...editingStaff, vgiAmount: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono"
                        placeholder="0 (optional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave 0 if no VGI</p>
                    </div>

                    {/* Rekening */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">🏦 No. Rekening</label>
                      <input
                        type="text"
                        value={editingStaff.rekening || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, rekening: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono"
                        placeholder="e.g. 3250494563"
                      />
                    </div>

                    {/* Atas Nama Rekening */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">📝 Atas Nama</label>
                      <input
                        type="text"
                        value={editingStaff.atasNamaRekening || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, atasNamaRekening: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                        placeholder="e.g. Budi Suryanto"
                      />
                    </div>

                    {/* Bank */}
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">🏧 Bank</label>
                      <input
                        type="text"
                        value={editingStaff.bank || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, bank: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                        placeholder="e.g. BCA, mandiri"
                      />
                    </div>

                    {/* Manager */}
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">👔 Manager</label>
                      <select
                        value={editingStaff.manager}
                        onChange={(e) => setEditingStaff({...editingStaff, manager: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                      >
                        <option value="Top M">Top M</option>
                        <option value="Mucharom Rusdiana">Mucharom Rusdiana</option>
                        <option value="Nadira Maysa Suryanto">Nadira Maysa Suryanto</option>
                        <option value="Diah Ayu Fajar Cahyaningrum">Diah Ayu Fajar Cahyaningrum</option>
                        <option value="Widia Novitasari">Widia Novitasari</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                    <button
                      onClick={handleSaveStaff}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      ✅ Save Staff
                    </button>
                    <button
                      onClick={() => setEditingStaff(null)}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

  
        {step === 'lembur' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Overtime (Lembur) Data</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Review Overtime Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Nama</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Tanggal</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Jam Mulai</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Jam Selesai</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Jam Lembur</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Total Diterima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lemburData.map((row, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 text-xs font-semibold">{row.Nama}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs">{row.Tanggal}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs">{row['Jam Mulai']}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs">{row['Jam Selesai']}</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs">{row['Jam Lembur']} jam</td>
                        <td className="border border-gray-200 px-3 py-2 text-xs">
                          Rp {parseFloat(row['Total Diterima']?.toString().replace(/\./g, '').replace(',', '.') || '0').toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={calculateSalarySlips}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '1rem 3rem',
                  borderRadius: '0.75rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  marginTop: '1.5rem'
                }}
              >
                Process Salary Slips
              </button>
            </div>
          </div>
        )}

        {step === 'slip' && !selectedStaff && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold">Salary Slips</h2>
              <button
                onClick={copyAllSlips}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                📋 Copy All Slips
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-300 pb-0 overflow-x-auto bg-gray-50 rounded-t-lg">
              {(() => {
                const tabs = []

                // VGI Tab - for all people with VGI amounts
                const hasVGI = salarySlips.some(slip => {
                  const staffConfig = staffSalaries.find(s => s.name === slip.nama)
                  return staffConfig?.vgiAmount
                })

                if (hasVGI) {
                  tabs.push(
                    <button
                      key="VGI"
                      onClick={() => setActiveTab('VGI')}
                      className={`px-8 py-3 font-bold text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                        activeTab === 'VGI'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      💎 VGI
                    </button>
                  )
                }

                // Sumber Dana Tabs - for all staff with sumber dana
                const sumberDanaGroups = new Set<string>()
                salarySlips.forEach(slip => {
                  const staffConfig = staffSalaries.find(s => s.name === slip.nama)
                  if (staffConfig?.sumberDana) {
                    sumberDanaGroups.add(staffConfig.sumberDana)
                  }
                })

                Array.from(sumberDanaGroups).sort().forEach(sumberDana => {
                  const bgColor =
                    sumberDana === 'D360' ? 'from-purple-500 to-purple-600' :
                    sumberDana === 'SKG' ? 'from-blue-500 to-blue-600' :
                    sumberDana === 'RCP' ? 'from-green-500 to-green-600' :
                    'from-orange-500 to-orange-600'

                  tabs.push(
                    <button
                      key={sumberDana}
                      onClick={() => setActiveTab(sumberDana)}
                      className={`px-8 py-3 font-bold text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                        activeTab === sumberDana
                          ? `bg-gradient-to-r ${bgColor} text-white shadow-lg transform scale-105`
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {sumberDana}
                    </button>
                  )
                })

                return tabs
              })()}
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-5 gap-4 mt-6">
              {salarySlips
                .filter(slip => {
                  const staffConfig = staffSalaries.find(s => s.name === slip.nama)

                  if (activeTab === 'VGI') {
                    // VGI tab: show only people with VGI amounts
                    return staffConfig?.vgiAmount
                  } else {
                    // Sumber Dana tabs: show all staff with that sumber dana (including managers)
                    return staffConfig?.sumberDana === activeTab
                  }
                })
                .sort((a, b) => a.nama.localeCompare(b.nama))
                .map((slip) => {
                  const staffConfig = staffSalaries.find(s => s.name === slip.nama)
                  return (
                    <div
                      key={slip.nama}
                      onClick={() => setSelectedStaff(slip.nama)}
                      className="group bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-md hover:shadow-2xl cursor-pointer transition-all duration-300 border border-gray-200 hover:border-blue-400 transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{slip.nama}</h3>
                        {staffConfig?.vgiAmount && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">VGI</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Total Gaji:</span>
                          <span className="font-bold text-sm text-green-600">Rp {slip.totalGaji.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-xs text-center mt-3 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view →
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {step === 'slip' && selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Slip Gaji - <span className="text-blue-600">{selectedStaff}</span></h2>
              </div>
              <button
                onClick={() => copySlipAsImage(selectedStaff)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105"
              >
                📋 Copy Image
              </button>
            </div>

            {renderSalarySlip()}
          </div>
        )}

        {/* New Staff Detection Modal - Global */}
        {newStaffDetected.length > 0 && isProcessingNewStaff && !editingStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-slideUp border-4 border-orange-400 pointer-events-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-300">
                <h3 className="text-3xl font-bold text-orange-800">
                  ⚠️ Add New Staff ({currentNewStaffIndex + 1}/{newStaffDetected.length})
                </h3>
              </div>

              {newStaffDetected.length > 1 && (
                <div className="mb-4">
                  <div className="flex gap-2 justify-center">
                    {newStaffDetected.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          idx === currentNewStaffIndex ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-lg mb-6 text-gray-700">
                New staff detected: <strong className="text-orange-700">{newStaffDetected[currentNewStaffIndex]}</strong>
              </p>

              <p className="text-md mb-6 text-gray-600">
                Please add details for this staff member or skip to continue without adding.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-6">
                <button
                  onClick={() => {
                    setEditingStaff({
                      name: newStaffDetected[currentNewStaffIndex],
                      dailyRate: 0,
                      manager: 'Top M',
                      jabatan: '',
                      tunjanganJabatan: 0,
                      lembur: 0,
                      insentif: 0,
                      sumberDana: '',
                      vgiAmount: 0,
                      rekening: '',
                      atasNamaRekening: '',
                      bank: ''
                    })
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 pointer-events-auto relative z-[70]"
                >
                  ➕ Add Details for {newStaffDetected[currentNewStaffIndex]}
                </button>
              </div>

              <div className="flex gap-4 pt-6 border-t-2 border-orange-300">
                <button
                  onClick={() => {
                    if (currentNewStaffIndex < newStaffDetected.length - 1) {
                      // Move to next staff
                      setCurrentNewStaffIndex(currentNewStaffIndex + 1)
                    } else {
                      // Last staff, go to lembur
                      setNewStaffDetected([])
                      setIsProcessingNewStaff(false)
                      setStep('lembur')
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {currentNewStaffIndex < newStaffDetected.length - 1 ? '⏭️ Skip This Staff' : '⏭️ Skip All & Continue to Lembur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Payroll Rules Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Potong Uang Makan Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                  <span className="mr-2">🍽️</span>
                  Potong Uang Makan
                </h3>
                <div className="space-y-3 pl-6">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Terlambat lebih dari 1 jam</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongUangMakan.lateMoreThan1Hour}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongUangMakan: {
                          ...payrollSettings.potongUangMakan,
                          lateMoreThan1Hour: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Check out tepat jam 17:00</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongUangMakan.checkoutAt17}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongUangMakan: {
                          ...payrollSettings.potongUangMakan,
                          checkoutAt17: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Check out sebelum 17:00</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongUangMakan.checkoutBefore17}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongUangMakan: {
                          ...payrollSettings.potongUangMakan,
                          checkoutBefore17: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Absen (tidak masuk) - Manager</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongUangMakan.absenManager}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongUangMakan: {
                          ...payrollSettings.potongUangMakan,
                          absenManager: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Absen (tidak masuk) - Non-Manager</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongUangMakan.absenNonManager}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongUangMakan: {
                          ...payrollSettings.potongUangMakan,
                          absenNonManager: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Potong Gaji Harian Section */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                  <span className="mr-2">💰</span>
                  Potong Gaji Harian
                </h3>
                <div className="space-y-3 pl-6">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <span className="text-gray-700">Absen (tidak masuk) - Non-Manager</span>
                    <input
                      type="checkbox"
                      checked={payrollSettings.potongGajiHarian.absenNonManager}
                      onChange={(e) => setPayrollSettings({
                        ...payrollSettings,
                        potongGajiHarian: {
                          ...payrollSettings.potongGajiHarian,
                          absenNonManager: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-red-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setPayrollSettings(DEFAULT_PAYROLL_SETTINGS)
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
