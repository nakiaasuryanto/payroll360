'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'

interface AbsensiRow {
  Nama: string
  Tanggal: string
  Masuk: string
  Pulang: string
  Terlambat: string
  'Jam Kerja': string
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
}

const DEFAULT_STAFF_SALARIES: StaffSalary[] = [
  { name: 'Budi Suryanto', dailyRate: 150000, manager: 'Top M', jabatan: 'CEO', tunjanganJabatan: 1000000 },
  { name: 'Mucharom Rusdiana', dailyRate: 362800, manager: 'Top M', jabatan: 'Bussiness Development Manager', tunjanganJabatan: 1000000 },
  { name: 'Eko Prastio', dailyRate: 180500, manager: 'Widia Novitasari', jabatan: 'Production Jersey', tunjanganJabatan: 0 },
  { name: 'Widia Novitasari', dailyRate: 196800, manager: 'Top M', jabatan: 'Manager Production', tunjanganJabatan: 800000 },
  { name: 'Diah Ayu Fajar Cahyaningrum', dailyRate: 146000, manager: 'Top M', jabatan: 'Sales & Client Relations Manager', tunjanganJabatan: 400000 },
  { name: 'Tri Hariyono', dailyRate: 129600, manager: 'Widia Novitasari', jabatan: 'SPV Production & QC', tunjanganJabatan: 500000 },
  { name: 'Tata Wibowo', dailyRate: 107200, manager: 'Widia Novitasari', jabatan: 'Embordiery', tunjanganJabatan: 0 },
  { name: 'Syaiful Anam', dailyRate: 204800, manager: 'Top M', jabatan: 'Information Systems Manager', tunjanganJabatan: 0 },
  { name: 'M. Bagus Suryo Laksono', dailyRate: 158400, manager: 'Mucharom Rusdiana', jabatan: 'Logistic & Supply Chain Manager', tunjanganJabatan: 200000 },
  { name: 'Achmad Baidowi', dailyRate: 115200, manager: 'Widia Novitasari', jabatan: 'Cutting Spesialist', tunjanganJabatan: 500000 },
  { name: 'Rahmat Ragil Hidayat', dailyRate: 86400, manager: 'Mucharom Rusdiana', jabatan: 'Office General Admin', tunjanganJabatan: 250000 },
  { name: 'Nadira Maysa Suryanto', dailyRate: 132000, manager: 'Top M', jabatan: 'Marketing & Partnerships Manager', tunjanganJabatan: 500000 },
  { name: 'Solikatin', dailyRate: 98000, manager: 'Widia Novitasari', jabatan: 'Embordiery', tunjanganJabatan: 0 },
  { name: 'Mita Nur Fitriani', dailyRate: 91600, manager: 'Widia Novitasari', jabatan: 'Workshop General Admin', tunjanganJabatan: 0 },
  { name: 'Kasianto', dailyRate: 82000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'Rizka Maulidah', dailyRate: 100000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0 },
  { name: 'Nurva Dina Amalianti', dailyRate: 60000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'Nadya Ambarwati Hariyanto', dailyRate: 100000, manager: 'Nadira Maysa Suryanto', jabatan: 'Digital Content Spesialist', tunjanganJabatan: 0 },
  { name: 'Laili Nisaatus Sholihah', dailyRate: 80000, manager: 'Mucharom Rusdiana', jabatan: 'General Admin MO', tunjanganJabatan: 0 },
  { name: 'Nabila Maulidya Putri', dailyRate: 80000, manager: 'Widia Novitasari', jabatan: 'Operator Jersey', tunjanganJabatan: 0 },
  { name: 'Fitri Nurcomariah', dailyRate: 80000, manager: 'Mucharom Rusdiana', jabatan: 'Designer Product', tunjanganJabatan: 0 },
  { name: 'Widodo Saputra', dailyRate: 56000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'Fifien Ayu Ramadhani', dailyRate: 80000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0 },
  { name: 'Galuh Anjali Puspitasari', dailyRate: 80000, manager: 'Nadira Maysa Suryanto', jabatan: 'Content Creator', tunjanganJabatan: 0 },
  { name: 'Natasha Dwi Aprilia', dailyRate: 48000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'Atika Permatasari', dailyRate: 68000, manager: 'Diah Ayu Fajar Cahyaningrum', jabatan: 'Sales & CS', tunjanganJabatan: 0 },
  { name: 'Anis Munawaroh', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'Azmil Qurrota A\'yun', dailyRate: 40000, manager: 'Widia Novitasari', jabatan: 'Production Helper', tunjanganJabatan: 0 },
  { name: 'M Sadiq Djafaar Noeh', dailyRate: 60000, manager: 'Widia Novitasari', jabatan: 'Operator Jersey', tunjanganJabatan: 0 },
  { name: 'Bahriyah Nurjannah', dailyRate: 150000, manager: 'Widia Novitasari', jabatan: 'Staff', tunjanganJabatan: 0 },
  { name: 'Ade Andreans S', dailyRate: 150000, manager: 'Widia Novitasari', jabatan: 'Staff', tunjanganJabatan: 0 },
  { name: 'Alek Sugianto', dailyRate: 150000, manager: 'Widia Novitasari', jabatan: 'Staff', tunjanganJabatan: 0 }
]

const UANG_MAKAN_PER_HARI = 12000
const POTONGAN_TERLAMBAT = 6000
const EDIT_PASSWORD = 'BismillahRezekiLancar99'
const OVERTIME_RATE_PER_HOUR = 12500

// Function to get overtime rate for a specific staff
const getOvertimeRate = (nama: string): number => {
  if (nama === 'Achmad Baidowi') {
    // Cutting Specialist has different rate (use from CSV)
    return 0 // Will use the CSV value
  }
  return OVERTIME_RATE_PER_HOUR
}

// Function to check if staff is a manager
const isManager = (jabatan: string): boolean => {
  const managerKeywords = ['Manager', 'CEO', 'SPV']
  return managerKeywords.some(keyword => jabatan.includes(keyword))
}

// Function to check if checkout time is 17:00 or earlier
const isEarlyCheckout = (pulangTime: string): boolean => {
  if (!pulangTime || pulangTime === '00:00') return false
  const [hour] = pulangTime.split(':').map(Number)
  return hour <= 17
}

// Function to check if late 1 hour or more
const isLateOneHourOrMore = (terlambatTime: string): boolean => {
  if (!terlambatTime || terlambatTime === '00:00') return false
  const [hour, minute] = terlambatTime.split(':').map(Number)
  return hour >= 1 || (hour === 0 && minute >= 60)
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
  const [step, setStep] = useState<'upload' | 'confirmation' | 'lembur' | 'slip'>('upload')
  const [overtimeConfirmations, setOvertimeConfirmations] = useState<ConfirmationItem[]>([])
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const slipRef = useRef<HTMLDivElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>(DEFAULT_STAFF_SALARIES)
  const [editingStaff, setEditingStaff] = useState<StaffSalary | null>(null)

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
            const jamLembur = parseFloat(row['Jam Lembur']?.toString() || '0')
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

    // Check if there are any confirmations needed
    const hasConfirmations = sortedGroups.some(group => group.confirmations.length > 0)

    // Skip confirmation step if no confirmations needed (no late confirmations anymore)
    if (!hasConfirmations) {
      setStep('lembur')
    } else {
      setStep('confirmation')
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

      staffAbsensi.forEach(row => {
        // Check if this day has izin
        const izinOnThisDay = staffIzin.find(izin => izin.Tanggal === row.Tanggal)

        if (!izinOnThisDay) {
          // No izin = working day
          totalHariKerja++

          // Check uang makan eligibility
          let eligibleForMakan = true

          // Automatic uang makan cut: late >= 1 hour OR checkout <= 17:00
          if (isLateOneHourOrMore(row.Terlambat) || isEarlyCheckout(row.Pulang)) {
            eligibleForMakan = false
          }

          if (eligibleForMakan) {
            hariMakan++
          }
        } else {
          // Has izin
          // Check if it's sick with doctor's letter (Alasan contains "dokter" or "sakit" with letter)
          const hasDoctorLetter = izinOnThisDay.Alasan.toLowerCase().includes('dokter') ||
                                   izinOnThisDay.Alasan.toLowerCase().includes('surat')

          if (hasDoctorLetter) {
            // Sick with letter: gaji paid, uang makan cut
            totalHariKerja++
            // Managers still get uang makan even with doctor's letter
            if (isStaffManager) {
              hariMakan++
            }
            // hariMakan not incremented for non-managers
          }
          // else: regular izin, both gaji and uang makan cut (including managers)
        }
      })

      // Calculate lembur total
      const totalLembur = staffLembur.reduce((sum, row) => {
        const amount = row['Total Diterima'] ? parseFloat(row['Total Diterima'].toString().replace(/\./g, '').replace(',', '.')) : 0
        return sum + amount
      }, 0)

      const gajiPokok = totalHariKerja * gajiPerHari
      const uangMakan = hariMakan * UANG_MAKAN_PER_HARI
      const tunjanganJabatan = staffConfig?.tunjanganJabatan || 0
      const totalGaji = gajiPokok + uangMakan - potonganTerlambat + totalLembur + tunjanganJabatan

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
    setStep('slip')
  }

  const proceedToLembur = () => {
    setStep('lembur')
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

  const downloadSlipAsImage = async (staffName: string) => {
    if (!slipRef.current) return

    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })

      const link = document.createElement('a')
      link.download = `Slip_Gaji_${staffName.replace(/\s/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to download slip image')
    }
  }

  const downloadAllSlips = async () => {
    for (const slip of salarySlips) {
      setSelectedStaff(slip.nama)
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500))
      await downloadSlipAsImage(slip.nama)
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
    setEditingStaff(null)
  }

  const handleDeleteStaff = (name: string) => {
    if (confirm(`Yakin mau hapus ${name}?`)) {
      setStaffSalaries(staffSalaries.filter(s => s.name !== name))
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${step === 'upload' ? 'flex flex-col items-center justify-center' : ''}`}>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Payroll360 Automation</h1>
          {step === 'upload' && !isEditMode && (
            <button
              onClick={() => {
                const password = prompt('Masukkan password:')
                if (password === EDIT_PASSWORD) {
                  setIsEditMode(true)
                } else if (password) {
                  alert('Password salah!')
                }
              }}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              ⚙️ Edit Staff Salaries
            </button>
          )}
          {isEditMode && (
            <button
              onClick={() => setIsEditMode(false)}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              🔒 Lock Edit Mode
            </button>
          )}
        </div>

        {step === 'upload' && !isEditMode && (
          <div className="space-y-8">
            <div className="bg-white p-12 rounded-2xl shadow-lg mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-gray-800 mb-4">Upload CSV Files</h2>
              </div>

              <div className="grid grid-cols-3 my-16" style={{ gap: '3rem' }}>
                {/* Absensi Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'absensi')
                      }}
                      className="hidden"
                    />
                    <div style={{
                      backgroundColor: absensiData.length > 0 ? '#22c55e' : '#dc2626',
                      color: 'white',
                      padding: '1.25rem 2rem',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}>
                      Select Absensi
                    </div>
                  </label>
                  {absensiData.length > 0 && (
                    <p className="mt-3 text-sm text-gray-600 font-medium">
                      ✓ {absensiData.length} records loaded
                    </p>
                  )}
                </div>

                {/* Lembur Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'lembur')
                      }}
                      className="hidden"
                    />
                    <div style={{
                      backgroundColor: lemburData.length > 0 ? '#22c55e' : '#f97316',
                      color: 'white',
                      padding: '1.25rem 2rem',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}>
                      Select Lembur
                    </div>
                  </label>
                  {lemburData.length > 0 && (
                    <p className="mt-3 text-sm text-gray-600 font-medium">
                      ✓ {lemburData.length} records loaded
                    </p>
                  )}
                </div>

                {/* Izin Upload */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer block w-full">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'izin')
                      }}
                      className="hidden"
                    />
                    <div style={{
                      backgroundColor: izinData.length > 0 ? '#22c55e' : '#a78bfa',
                      color: 'white',
                      padding: '1.25rem 2rem',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}>
                      Select Izin
                    </div>
                  </label>
                  {izinData.length > 0 && (
                    <p className="mt-3 text-sm text-gray-600 font-medium">
                      ✓ {izinData.length} records loaded
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center" style={{ marginTop: '5rem' }}>
                <button
                  onClick={processData}
                  disabled={!absensiData.length || !lemburData.length || !izinData.length}
                  style={{
                    backgroundColor: (!absensiData.length || !lemburData.length || !izinData.length) ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    padding: '1.25rem 4rem',
                    borderRadius: '1rem',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    cursor: (!absensiData.length || !lemburData.length || !izinData.length) ? 'not-allowed' : 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  Process Data
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && isEditMode && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold">Edit Staff Salaries</h2>
              <button
                onClick={() => setEditingStaff({ name: '', dailyRate: 0, manager: 'Top M', jabatan: '', tunjanganJabatan: 0 })}
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

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="border border-gray-200 px-4 py-3 text-left font-bold">Nama</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-bold">Jabatan</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-bold">Gaji Harian</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-bold">Tunjangan Jabatan</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-bold">Manager</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSalaries.sort((a, b) => a.name.localeCompare(b.name)).map((staff, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">{staff.name}</td>
                      <td className="border border-gray-200 px-4 py-2">{staff.jabatan}</td>
                      <td className="border border-gray-200 px-4 py-2">Rp {staff.dailyRate.toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-4 py-2">Rp {staff.tunjanganJabatan.toLocaleString('id-ID')}</td>
                      <td className="border border-gray-200 px-4 py-2">{staff.manager}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setEditingStaff(staff)}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '0.25rem',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              border: 'none'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.name)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '0.25rem',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              border: 'none'
                            }}
                          >
                            Delete
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
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50
              }}>
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-2xl font-bold mb-6">{editingStaff.name ? 'Edit' : 'Add'} Staff</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-2">Nama:</label>
                      <input
                        type="text"
                        value={editingStaff.name}
                        onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        placeholder="Nama staff"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">Jabatan:</label>
                      <input
                        type="text"
                        value={editingStaff.jabatan}
                        onChange={(e) => setEditingStaff({...editingStaff, jabatan: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        placeholder="e.g. Production Helper"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">Gaji Harian:</label>
                      <input
                        type="number"
                        value={editingStaff.dailyRate}
                        onChange={(e) => setEditingStaff({...editingStaff, dailyRate: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        placeholder="150000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">Tunjangan Jabatan:</label>
                      <input
                        type="number"
                        value={editingStaff.tunjanganJabatan}
                        onChange={(e) => setEditingStaff({...editingStaff, tunjanganJabatan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">Manager:</label>
                      <select
                        value={editingStaff.manager}
                        onChange={(e) => setEditingStaff({...editingStaff, manager: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      >
                        <option value="Top M">Top M</option>
                        <option value="Mucharom Rusdiana">Mucharom Rusdiana</option>
                        <option value="Nadira Maysa Suryanto">Nadira Maysa Suryanto</option>
                        <option value="Diah Ayu Fajar Cahyaningrum">Diah Ayu Fajar Cahyaningrum</option>
                        <option value="Widia Novitasari">Widia Novitasari</option>
                      </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSaveStaff}
                        style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: 'none',
                          flex: 1
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStaff(null)}
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: 'none',
                          flex: 1
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'confirmation' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Review & Confirm</h2>

            {/* Excel-like Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex border-b border-gray-300 overflow-x-auto">
                {/* Confirmation Tab */}
                <button
                  onClick={() => setActiveTab('confirmation')}
                  className={`px-8 py-4 font-bold text-base border-r border-gray-300 transition-colors whitespace-nowrap ${
                    activeTab === 'confirmation'
                      ? 'bg-white border-b-4 border-b-blue-500 text-blue-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Confirmation
                </button>

                {/* Manager Tabs */}
                {managerGroups.map((group, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(group.manager)}
                    className={`px-8 py-4 font-bold text-base border-r border-gray-300 transition-colors whitespace-nowrap ${
                      activeTab === group.manager
                        ? 'bg-white border-b-4 border-b-blue-500 text-blue-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {group.manager}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* Confirmation Tab Content */}
                {activeTab === 'confirmation' && (
                  <div className="space-y-4">
                    {managerGroups.map((group, groupIndex) => (
                      group.confirmations.length > 0 && (
                        <div key={groupIndex}>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{group.manager}</h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBulkAction(group.manager, 'approved')}
                                style={{
                                  backgroundColor: '#22c55e',
                                  color: 'white',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '0.5rem',
                                  fontWeight: 'bold',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer',
                                  border: 'none'
                                }}
                              >
                                ✓ Approve All
                              </button>
                              <button
                                onClick={() => handleBulkAction(group.manager, 'rejected')}
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '0.5rem',
                                  fontWeight: 'bold',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer',
                                  border: 'none'
                                }}
                              >
                                ✗ Reject All
                              </button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Nama</th>
                                  <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Tanggal</th>
                                  <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Reason</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-bold text-sm w-24">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.confirmations.map((conf, confIndex) => (
                                  <tr key={confIndex} className={
                                    conf.Status === 'approved' ? 'bg-green-50' :
                                    conf.Status === 'rejected' ? 'bg-red-50' : 'bg-white'
                                  }>
                                    <td className="border border-gray-200 px-3 py-2 text-xs">{conf.Nama}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-xs">{conf.Tanggal}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-xs">{conf.Reason}</td>
                                    <td className="border border-gray-200 px-3 py-2">
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={() => handleConfirmation(groupIndex, confIndex, 'approved')}
                                          disabled={conf.Status !== 'pending'}
                                          className="text-green-600 hover:text-green-800 disabled:text-gray-400 text-lg font-bold"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={() => handleConfirmation(groupIndex, confIndex, 'rejected')}
                                          disabled={conf.Status !== 'pending'}
                                          className="text-red-600 hover:text-red-800 disabled:text-gray-400 text-lg font-bold"
                                        >
                                          ✗
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Manager Tab Content */}
                {managerGroups.map((group, groupIndex) => (
                  activeTab === group.manager && (
                    <div key={groupIndex} className="grid grid-cols-4 gap-3">
                      {group.staffs.map((staff, staffIndex) => (
                        <div key={staffIndex} className="border border-gray-200 rounded overflow-hidden">
                          {/* Staff Name Dropdown Header */}
                          <button
                            onClick={() => setExpandedStaff(expandedStaff === staff.name ? null : staff.name)}
                            className="w-full bg-gray-50 px-3 py-3 text-left text-base font-bold flex justify-between items-center hover:bg-gray-100 transition-colors border-b border-gray-200"
                          >
                            <span className="truncate">{staff.name}</span>
                            <span className="text-lg ml-1">{expandedStaff === staff.name ? '▼' : '▶'}</span>
                          </button>

                          {/* Staff Table (shown when expanded) */}
                          {expandedStaff === staff.name && (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Tanggal</th>
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Masuk</th>
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Pulang</th>
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Terlambat</th>
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Jam</th>
                                    <th className="border-b border-gray-200 px-2 py-2 text-left text-xs font-bold">Izin</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {staff.data.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="bg-white hover:bg-gray-50">
                                      <td className="border-b border-gray-100 px-2 py-1.5 text-[11px]">{row.Tanggal}</td>
                                      <td className="border-b border-gray-100 px-2 py-1.5 text-[11px]">{row.Masuk}</td>
                                      <td className="border-b border-gray-100 px-2 py-1.5 text-[11px]">{row.Pulang}</td>
                                      <td className={`border-b border-gray-100 px-2 py-1.5 text-[11px] ${row.Terlambat !== '00:00' ? 'text-red-600 font-semibold' : ''}`}>
                                        {row.Terlambat}
                                      </td>
                                      <td className="border-b border-gray-100 px-2 py-1.5 text-[11px]">{row['Jam Kerja']}</td>
                                      <td className="border-b border-gray-100 px-2 py-1.5 text-[11px] truncate" title={row.Izin}>{row.Izin}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>

            <button
              onClick={proceedToLembur}
              disabled={!allConfirmationsProcessed()}
              style={{
                backgroundColor: !allConfirmationsProcessed() ? '#9ca3af' : '#16a34a',
                color: 'white',
                padding: '1rem 3rem',
                borderRadius: '0.75rem',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                cursor: !allConfirmationsProcessed() ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
            >
              Proceed to Overtime Confirmation
            </button>
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
                onClick={downloadAllSlips}
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
                📥 Download All Slips
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 border-b-2 border-gray-200 pb-2 overflow-x-auto">
              {['Top M', 'Diah Ayu Fajar Cahyaningrum', 'Mucharom Rusdiana', 'Nadira Maysa Suryanto', 'Widia Novitasari'].map(manager => {
                const staffCount = salarySlips.filter(s => s.manager === manager).length
                if (staffCount === 0) return null
                return (
                  <button
                    key={manager}
                    onClick={() => setActiveTab(manager)}
                    className={`px-6 py-3 font-bold text-lg whitespace-nowrap transition-colors ${
                      activeTab === manager
                        ? 'border-b-4 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-blue-500'
                    }`}
                  >
                    {manager}
                  </button>
                )
              })}
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
              {salarySlips
                .filter(slip => slip.manager === activeTab)
                .sort((a, b) => a.nama.localeCompare(b.nama))
                .map((slip) => (
                  <div
                    key={slip.nama}
                    onClick={() => setSelectedStaff(slip.nama)}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition-shadow border-2 border-gray-100 hover:border-blue-300"
                  >
                    <h3 className="font-bold text-base text-gray-800 mb-2">{slip.nama}</h3>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">Total: <span className="font-bold text-green-600">Rp {slip.totalGaji.toLocaleString('id-ID')}</span></p>
                      <p className="text-xs text-gray-500">Click to view details</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {step === 'slip' && selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedStaff(null)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-semibold">Slip Gaji - {selectedStaff}</h2>
              </div>
              <button
                onClick={() => downloadSlipAsImage(selectedStaff)}
                style={{
                  backgroundColor: '#22c55e',
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
                📥 Download Slip
              </button>
            </div>

            {(() => {
              const slip = salarySlips.find(s => s.nama === selectedStaff)
              if (!slip) return null

              const hariMakan = slip.uangMakan / UANG_MAKAN_PER_HARI
              const staffConfig = staffSalaries.find(s => s.name === slip.nama)

              return (
                <div className="space-y-6">
                  {/* Salary Slip */}
                  <div ref={slipRef} className="bg-white p-8 rounded-lg shadow-lg border-4 border-black max-w-[1200px] mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 pb-4 border-b-4 border-black">
                      <div>
                        <h1 className="text-2xl font-bold mb-1">VIDO GARMENT</h1>
                        <p className="text-xs">Jl. Sidosermo IV Gg. No.37, Surabaya</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-700">FABRRIK GROUP</h2>
                      </div>
                    </div>

                    <h2 className="text-center text-2xl font-bold mb-6">SLIP GAJI KARYAWAN</h2>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                      {/* Left Column - Basic Info & Salary Breakdown */}
                      <div>
                        {/* Employee Info */}
                        <div className="space-y-1 mb-6 text-sm">
                          <div className="flex">
                            <span className="w-32 font-semibold">Bulan</span>
                            <span>: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 font-semibold">Nama</span>
                            <span>: {slip.nama}</span>
                          </div>
                          <div className="flex">
                            <span className="w-32 font-semibold">Jabatan</span>
                            <span>: {staffConfig?.jabatan || '-'}</span>
                          </div>
                        </div>

                        {/* Penghasilan & Potongan */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Penghasilan */}
                          <div>
                            <h3 className="font-bold mb-2 text-sm">Penghasilan</h3>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Gaji</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">Rp</span>
                                  <span className="font-semibold">{slip.gajiPokok.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span>Lembur</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">Rp</span>
                                  <span className="font-semibold">{slip.totalLembur.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span>Tunjangan Jabatan</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">Rp</span>
                                  <span className="font-semibold">{(staffConfig?.tunjanganJabatan || 0).toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Potongan */}
                          <div>
                            <h3 className="font-bold mb-2 text-sm">Potongan</h3>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Pinjaman</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">Rp</span>
                                  <span className="font-semibold">-</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span>Keterlambatan</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px]">Rp</span>
                                  <span className="font-semibold">{slip.potonganTerlambat.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Uang Makan Box */}
                        <div className="border-2 border-black p-2 mb-4 inline-block">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-yellow-200 px-2 py-1 font-bold">Uang Makan</span>
                            <span className="font-bold">= {hariMakan} x Rp 12.000 =</span>
                            <span className="font-bold">{slip.uangMakan.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-1 text-sm mb-2">
                          <div className="flex justify-between">
                            <span className="font-bold">Total</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px]">Rp</span>
                              <span className="font-bold">{(slip.gajiPokok + slip.totalLembur + slip.uangMakan + (staffConfig?.tunjanganJabatan || 0)).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Penerimaan Boxes */}
                        <div className="space-y-2 mt-4">
                          <div className="border-2 border-black p-2 text-center">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm">Penerimaan Bersih =</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs">Rp</span>
                                <span className="font-bold text-lg">{slip.totalGaji.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-2 border-black p-2 text-center">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm">Penerimaan Transfer =</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs">Rp</span>
                                <span className="font-bold text-lg">{slip.totalGaji.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right mt-6 text-xs">
                          <p>Surabaya, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          <p className="mt-1">Direktur</p>
                          <p className="mt-8 font-bold">Budi Suryanto</p>
                        </div>
                      </div>

                      {/* Right Column - Tables */}
                      <div className="space-y-4">
                        {/* Lembur Table */}
                        <div>
                          <div className="border-2 border-black p-1 mb-1 inline-block bg-yellow-200">
                            <span className="font-bold text-xs">Uang Makan = {hariMakan} x Rp 12.000 = {slip.uangMakan.toLocaleString('id-ID')}</span>
                          </div>
                          <h3 className="font-bold text-sm mb-2">DAFTAR LEMBUR {slip.nama.toUpperCase()}</h3>
                          <p className="text-xs mb-2">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                          <div className="overflow-auto max-h-[300px] border border-black">
                            <table className="w-full border-collapse text-[10px]">
                              <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                  <th className="border border-black px-1 py-1">Tanggal<br/>Rincian<br/>Lembur</th>
                                  <th className="border border-black px-1 py-1">Masuk<br/>Mulai</th>
                                  <th className="border border-black px-1 py-1">Total<br/>Jam</th>
                                  <th className="border border-black px-1 py-1">Rp / Jam</th>
                                  <th className="border border-black px-1 py-1">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {slip.lembur.map((l, i) => {
                                  const totalDiterimaStr = l['Total Diterima']?.toString() || '0'
                                  const totalDiterima = parseFloat(totalDiterimaStr.replace(/\./g, '').replace(',', '.'))
                                  const jamLembur = parseFloat(l['Jam Lembur']?.toString() || '0')
                                  const rpPerJam = jamLembur > 0 ? Math.round(totalDiterima / jamLembur) : 0
                                  return (
                                    <tr key={i} className="hover:bg-gray-50">
                                      <td className="border border-black px-1 py-1">{l.Tanggal}</td>
                                      <td className="border border-black px-1 py-1 text-center">{l['Jam Mulai']}</td>
                                      <td className="border border-black px-1 py-1 text-center">{jamLembur}</td>
                                      <td className="border border-black px-1 py-1 text-right">{rpPerJam.toLocaleString('id-ID')}</td>
                                      <td className="border border-black px-1 py-1 text-right">{Math.round(totalDiterima).toLocaleString('id-ID')}</td>
                                    </tr>
                                  )
                                })}
                                {slip.lembur.length > 0 && (
                                  <tr className="bg-gray-200 font-bold">
                                    <td colSpan={2} className="border border-black px-1 py-1">Total</td>
                                    <td className="border border-black px-1 py-1 text-center">
                                      {slip.lembur.reduce((sum, l) => sum + parseFloat(l['Jam Lembur'].toString()), 0).toFixed(2)}
                                    </td>
                                    <td className="border border-black px-1 py-1"></td>
                                    <td className="border border-black px-1 py-1 text-right">{slip.totalLembur.toLocaleString('id-ID')}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Absensi Table */}
                        <div>
                          <h3 className="font-bold text-sm mb-2">ABSENSI {slip.nama.toUpperCase()}</h3>
                          <p className="text-xs mb-2">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          <div className="overflow-auto max-h-[300px] border border-black">
                            <table className="w-full border-collapse text-[10px]">
                              <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                  <th className="border border-black px-1 py-1">Nama</th>
                                  <th className="border border-black px-1 py-1">Shift</th>
                                  <th className="border border-black px-1 py-1">Masuk</th>
                                  <th className="border border-black px-1 py-1">Pulang</th>
                                  <th className="border border-black px-1 py-1">Rincian</th>
                                </tr>
                              </thead>
                              <tbody>
                                {slip.absensi.map((row, i) => (
                                  <tr key={i} className={`hover:bg-gray-50 ${row.Izin.toLowerCase().includes('libur') ? 'bg-red-100' : row.Terlambat !== '00:00' ? 'bg-yellow-100' : ''}`}>
                                    <td className="border border-black px-1 py-1 font-semibold">{slip.nama.split(' ')[0]}</td>
                                    <td className="border border-black px-1 py-1 text-center">{row.Tanggal}</td>
                                    <td className="border border-black px-1 py-1 text-center">{row.Masuk}</td>
                                    <td className="border border-black px-1 py-1 text-center">{row.Pulang}</td>
                                    <td className="border border-black px-1 py-1 text-center">{row.Izin || (row.Terlambat !== '00:00' ? row.Terlambat : '')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Tables Side by Side */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Absensi Table */}
                    {slip.absensi.length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Data Absensi</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200 text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Tanggal</th>
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Masuk</th>
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Pulang</th>
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Terlambat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slip.absensi.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Tanggal}</td>
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Masuk}</td>
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Pulang}</td>
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Terlambat}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Izin Table */}
                    {slip.izin.length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Data Izin</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200 text-sm">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Tanggal</th>
                                <th className="border border-gray-200 px-2 py-2 text-left font-bold text-xs">Alasan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slip.izin.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Tanggal}</td>
                                  <td className="border border-gray-200 px-2 py-1 text-xs">{row.Alasan}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lembur Table Full Width */}
                  {slip.lembur.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="font-bold text-xl mb-4 text-gray-800">Data Lembur</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-200 px-3 py-2 text-left font-bold">Tanggal</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-bold">Jam Mulai</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-bold">Jam Selesai</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-bold">Jam Lembur</th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-bold">Total Diterima</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slip.lembur.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-3 py-2">{row.Tanggal}</td>
                                <td className="border border-gray-200 px-3 py-2">{row['Jam Mulai']}</td>
                                <td className="border border-gray-200 px-3 py-2">{row['Jam Selesai']}</td>
                                <td className="border border-gray-200 px-3 py-2">{row['Jam Lembur']} jam</td>
                                <td className="border border-gray-200 px-3 py-2">
                                  Rp {parseFloat(row['Total Diterima']?.toString().replace(/\./g, '').replace(',', '.') || '0').toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
