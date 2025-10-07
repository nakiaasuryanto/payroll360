'use client'

import { useState } from 'react'
import Papa from 'papaparse'

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

// Manager-staff mapping
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
  'Titin': 'Widia Novitasari',
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
  'Solikatin': 'Widia Novitasari',
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
  const [step, setStep] = useState<'upload' | 'confirmation' | 'overtime-confirmation' | 'next'>('upload')
  const [overtimeConfirmations, setOvertimeConfirmations] = useState<ConfirmationItem[]>([])

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
          setLemburData(results.data as LemburRow[])
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

      // Check for confirmations needed
      // 1. If terlambat is not "00:00"
      if (data.Terlambat !== '00:00') {
        groups[manager].confirmations.push({
          Nama: data.Nama,
          Tanggal: data.Tanggal,
          Reason: `Terlambat: ${data.Terlambat}`,
          Status: 'pending',
          Type: 'late',
          Data: data
        })
      }

      // 2. If no masuk or pulang but no izin
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
    setStep('confirmation')
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

  const proceedToOvertimeConfirmation = () => {
    // Group lembur data by name
    const groupedByName: { [key: string]: LemburRow[] } = {}

    lemburData.forEach((lembur) => {
      if (!groupedByName[lembur.Nama]) {
        groupedByName[lembur.Nama] = []
      }
      groupedByName[lembur.Nama].push(lembur)
    })

    // Create merged overtime confirmations
    const overtimeConfs: ConfirmationItem[] = []

    Object.keys(groupedByName).forEach((nama) => {
      const records = groupedByName[nama]
      overtimeConfs.push({
        Nama: nama,
        Tanggal: '', // Will show multiple dates
        Reason: '', // Not needed for merged view
        Status: 'pending',
        Type: 'overtime',
        Data: records // Store all records for this person
      })
    })

    setOvertimeConfirmations(overtimeConfs)
    setStep('overtime-confirmation')
  }

  const handleOvertimeConfirmation = (index: number, status: 'approved' | 'rejected') => {
    const updated = [...overtimeConfirmations]
    updated[index].Status = status
    setOvertimeConfirmations(updated)
  }

  const allOvertimeConfirmationsProcessed = () => {
    return overtimeConfirmations.every((conf) => conf.Status !== 'pending')
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${step === 'upload' ? 'flex flex-col items-center justify-center' : ''}`}>
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Payroll360 Automation</h1>

        {step === 'upload' && (
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
                          <h3 className="font-bold text-lg mb-2 text-gray-800">{group.manager}</h3>
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
              onClick={proceedToOvertimeConfirmation}
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

        {step === 'overtime-confirmation' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Overtime Confirmation</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Crosscheck Overtime (Lembur) Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Nama</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Tanggal</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Jam Lembur</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Durasi Lembur</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-bold text-sm">Total Diterima</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-bold text-sm w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overtimeConfirmations.map((conf, index) => {
                      const records = conf.Data as LemburRow[]
                      const totalHours = records.reduce((sum, r) => sum + parseFloat(r['Jam Lembur'].toString().replace(',', '.')), 0)
                      const totalAmount = records.reduce((sum, r) => {
                        const amount = r['Total Diterima'] ? parseFloat(r['Total Diterima'].toString().replace(/\./g, '').replace(',', '.')) : 0
                        return sum + amount
                      }, 0)

                      return (
                        <tr key={index} className={
                          conf.Status === 'approved' ? 'bg-green-50' :
                          conf.Status === 'rejected' ? 'bg-red-50' : 'bg-white'
                        }>
                          <td className="border border-gray-200 px-3 py-2 text-xs font-semibold">{conf.Nama}</td>
                          <td className="border border-gray-200 px-3 py-2 text-xs">
                            {records.map((r, i) => (
                              <div key={i}>{r.Tanggal}</div>
                            ))}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-xs">
                            {records.map((r, i) => (
                              <div key={i}>{r['Jam Mulai']} - {r['Jam Selesai']}</div>
                            ))}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-xs">
                            {records.map((r, i) => (
                              <div key={i}>{r['Jam Lembur']} jam</div>
                            ))}
                            <div className="font-bold mt-1 pt-1 border-t border-gray-300">Total: {totalHours.toFixed(2)} jam</div>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-xs">
                            {records.map((r, i) => (
                              <div key={i}>Rp {parseFloat(r['Total Diterima']?.toString().replace(/\./g, '').replace(',', '.') || '0').toLocaleString('id-ID')}</div>
                            ))}
                            <div className="font-bold mt-1 pt-1 border-t border-gray-300">Rp {totalAmount.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOvertimeConfirmation(index, 'approved')}
                                disabled={conf.Status !== 'pending'}
                                className="text-green-600 hover:text-green-800 disabled:text-gray-400 text-lg font-bold"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleOvertimeConfirmation(index, 'rejected')}
                                disabled={conf.Status !== 'pending'}
                                className="text-red-600 hover:text-red-800 disabled:text-gray-400 text-lg font-bold"
                              >
                                ✗
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setStep('next')}
                disabled={!allOvertimeConfirmationsProcessed()}
                style={{
                  backgroundColor: !allOvertimeConfirmationsProcessed() ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  padding: '1rem 3rem',
                  borderRadius: '0.75rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  cursor: !allOvertimeConfirmationsProcessed() ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  marginTop: '1.5rem'
                }}
              >
                Complete Processing
              </button>
            </div>
          </div>
        )}

        {step === 'next' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">All Confirmations Processed!</h2>
            <p className="text-gray-600">You can now proceed to the next step of payroll processing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
