# Payroll360 - Payroll Automation Web Application

A web-based payroll automation system that processes attendance (absensi), overtime (lembur), and leave (izin) data from CSV files.

## Features

### 1. CSV Upload
- Upload 3 CSV files:
  - **Absensi** (Attendance): Contains Nama, Tanggal, Masuk, Pulang, Terlambat, Jam Kerja
  - **Lembur** (Overtime): Contains Nama, Tanggal, Jam Mulai, Jam Selesai, Jam Lembur
  - **Izin** (Leave): Contains Nama, Tanggal, Alasan

### 2. Data Processing
- Automatically merges data from all 3 files using **Nama** (Name) and **Tanggal** (Date) as primary keys
- Creates unified tables with columns: Tanggal, Masuk, Pulang, Terlambat, Jam Kerja, Mulai Lembur, Selesai Lembur, Jam Lembur, Izin

### 3. Manager Grouping
- Groups staff by their managers
- Click on manager name to expand/collapse their staff list
- Each staff has their own detailed table

### 4. Confirmation System
The system automatically identifies records requiring confirmation:

**Late Arrival Confirmation**:
- When "Terlambat" is not "00:00", it appears in the confirmation table
- Manager must approve or reject

**Missing Data Confirmation**:
- When there's no "Masuk" or "Pulang" AND no "Izin" record
- Appears in confirmation table for validation

### 5. Validation UI
- ✓ (Check) button: Approve the record
- ✗ (Cross) button: Reject the record
- Color coding:
  - Green background: Approved
  - Red background: Rejected
  - White background: Pending

### 6. Next Step Button
- Only enabled when ALL confirmations are processed
- No pending confirmations remain
- Proceeds to next payroll processing step

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload CSV Files**: Click on each upload area and select your CSV files
2. **Process Data**: Once all 3 files are uploaded, click "Process Data"
3. **Review Confirmations**:
   - Click on manager names to expand their sections
   - Review the confirmation tables
   - Click ✓ to approve or ✗ to reject each record
4. **Proceed**: Once all confirmations are processed, click "Proceed to Next Step"

## CSV Format Examples

### Absensi (Attendance)
```csv
Nama,Tanggal,Masuk,Pulang,Terlambat,Jam Kerja
Achmad Baidowi,27/08/2025,07:20,17:18,00:00,09:57
```

### Lembur (Overtime)
```csv
Nama,Tanggal,Jam Mulai,Jam Selesai,Jam Lembur
Achmad Baidowi,25/09/2025,19:00,22:00,3
```

### Izin (Leave)
```csv
Nama,Alasan,Tanggal,Total Hari
Dedy Rosiyanto,Pulang desa,08 September 2025 - 09 September 2025,2 Hari
```

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **PapaParse** - CSV parsing

## Manager-Staff Mapping

The system uses a predefined mapping to assign staff to managers. Update the `MANAGER_STAFF_MAP` in `app/page.tsx` to match your organization structure.

## License

ISC
