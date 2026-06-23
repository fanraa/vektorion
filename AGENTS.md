# Vektorion Project Guidelines & Design System

> [!IMPORTANT]
> **ATURAN WAJIB**: AI harus secara proaktif memperbarui file `AGENTS.md` ini setiap kali ada instruksi baru, perubahan aturan desain, atau penambahan struktur fitur penting dari user agar memori proyek tetap terjaga di sesi berikutnya.

File ini berisi aturan desain dan struktur permanen untuk Vektorion. AI harus membaca file ini sebelum melakukan perubahan kode.

## 0. Struktur Web Vektorion
- **/home**: Dashboard utama dengan ringkasan Info, Agenda, dan Kas.
- **/login**: Pintu masuk sistem dengan validasi Nama/NIM dan Password.
- **/galeri**: Galeri momen angkatan dengan fitur AI Generatif untuk caption.
- **/kas**: Sistem manajemen keuangan (Kas, Transaksi, Laporan PDF).
- **/agenda**: Jadwal kegiatan dan acara angkatan.
- **/struktur**: Tampilan struktur organisasi interaktif yang bisa dikustomisasi secara dinamis (tambah devisi, ubah peran) oleh Admin.
- **/profile**: Pengaturan akun dan kustomisasi tampilan user.

## 1. Bahasa Komunikasi
- Selalu gunakan **Bahasa Indonesia** dalam berkomunikasi dengan user.

## 2. Prinsip Desain (UI/UX)
- **Shape/Bentuk**: Jangan gunakan bentuk yang terlalu bulat (rounded-full/rounded-3xl). Gunakan gaya "agak kotak" dengan radius kecil (contoh: `rounded-sm` atau `rounded-md`). Hindari sudut tajam (lancip), tapi tetap terlihat simetris dan kotak.
- **Gambar**: **JANGAN** pernah memberikan efek perbesar (scale-up) atau zoom pada gambar saat kursor diarahkan ke sana (hover).
- **Layout Mobile**: Pada device HP, elemen dekoratif atau foto di samping box (seperti pada section Contact) harus disembunyikan. Fokuskan pada isi konten (box) di tengah.
- **Loading State**: Gunakan skeleton loading saat pertama kali masuk ke menu utama untuk memberikan feedback visual yang lebih baik sebelum konten dimuat sepenuhnya. Pastikan skeleton memiliki efek shimmer dan bentuk yang menyerupai layout asli halaman.

## 3. Tipografi
- **Teks Kecil**: Untuk keterangan kecil atau label di bawah input, **JANGAN** gunakan huruf kapital semua (UPPERCASE) dan **JANGAN** di-bold. Gunakan format kalimat biasa agar terlihat bersih.
- **Header**: Gunakan font sans-serif (Inter/Outfit) yang tegas tapi tidak kaku.

## 4. Validasi & Form
- **Email**: Harus divalidasi dengan format `@` yang benar.
- **Interaksi Validasi**: Error (seperti border merah) hanya boleh muncul setelah user berinteraksi dan keluar dari input (on focus lost/blur), bukan saat sedang mengetik pertama kali.
- **Input Manual**: Nama diganti dengan Email. Input harus selalu manual, tidak otomatis mengambil dari data login untuk field kontak.

## 5. Notifikasi & Feedback
- Masukkan notifikasi di tengah bawah halaman.
- Gunakan gaya `backdrop-blur` dengan border tipis dan ikon yang sesuai (Loader, Check, atau Alert).
- Gaya notifikasi harus konsisten di seluruh aplikasi (Home, Gallery, dll).

## 6. Firebase & Keamanan
- File `firestore.rules` harus dijaga. Jangan menghapus rule yang sudah ada kecuali diminta.
- Data pesan dikirim ke koleksi `messages` dengan field `targetRecipient: "irfanrizkiaditricreator@gmail.com"`.
- Gunakan `serverTimestamp()` untuk waktu pembuatan di Firestore.
- Struktur Organisasi kini bersifat dinamis dan disimpan dalam root dokumen `struktur_organisasi/main`. Admin memiliki wewenang untuk mengatur posisi pada koleksi ini.

## 7. Sinkronisasi Spreadsheet / Kas
- **Endpoint**: API sinkronisasi berada di `/api/sync/spreadsheet` (di server-side proxy).
- **Protokol URL**: Karena container backend berjalan dinamis pada Port 3000, proses sinkronisasi dari Google Sheets Apps Script wajib menggunakan **Development App URL** (`https://ais-dev-...`) sewaktu memprogram agar koneksi HTTP POST dan pengujian koneksi tersambung langsung ke server Express secara realtime. Gunakan **Production App URL** (`https://ais-pre-...`) hanya saat aplikasi dibagikan sebagai tautan rilis final.

## 8. Daftar Aset Ikon
- **Logo Utama**: `https://res.cloudinary.com/dew39kqhy/image/upload/v1778155257/BackgroundEraser_20260507_190027268_bc5p07.png` (Warna: Asli)
- **Kas Keuangan**: `https://cdn-icons-png.flaticon.com/128/10692/10692615.png` (Warna: Amber)
- **Gallery Momen**: `https://cdn-icons-png.flaticon.com/128/13051/13051386.png` (Warna: Amber)
- **Info Terkini**: `https://cdn-icons-png.flaticon.com/128/9479/9479228.png` (Warna: Amber)
- **Agenda**: `https://cdn-icons-png.flaticon.com/128/14490/14490440.png` (Warna: Amber)
- **Ikon PWA (Aplikasi Layar Utama)**: `https://cdn-icons-png.flaticon.com/128/2609/2609178.png` (Warna: Amber, diubah dengan CSS filter)

*Catatan: Ikon PNG hitam diubah warnanya menggunakan CSS filter agar sesuai dengan tema amber.*

## 9. Progressive Web App (PWA) & Notifikasi Badging
- **Ikon Aplikasi**: Ikon PWA yang digunakan berukuran proporsional dan mengikuti pedoman outline amber (`https://cdn-icons-png.flaticon.com/128/2609/2609178.png`).
- **PWA Auto-Prompt Dihapus**: Jangan pernah menampilkan banner/pop-up instalasi PWA pada saat pertama kali web dibuka agar tampilan homepage bersih (Clean UI). Promosi instalasi hanya dilakukan via halaman Profil.
- **Notifikasi Badging (Saran 2)**: Menggunakan API standar `navigator.setAppBadge` dan `navigator.clearAppBadge`. Jumlah notifikasi dicache di `localStorage` (`vektorion_unread_count`), otomatis di-reset saat perpindahan menu.
- **Izin Notifikasi Kustom**: Penayangan izin notifikasi tidak langsung memicu dialog browser yang kaku, melainkan menggunakan modal kustom Vektorion yang elegan di tengah layar (pemberitahuan mengapa Vektorion membutuhkan izin tersebut). Pemicuan API asli `Notification.requestPermission` baru dipanggil jika pengguna mengetuk tombol "Izinkan Notif".
- **Edukasi Instalasi**: Menu instruksi manual disematkan dengan rapi di halaman profil (`Profile.tsx`) dengan langkah lengkap Chrome dan Safari.

## 10. Strategi Stabilitas React & Error-Handling (Pencegahan Bug "Invalid Hook Call")
- **Isolasi Halaman (Error Boundary)**: Tiap rute halaman (/kas, /galeri, dll) dilindungi secara terpisah dengan struktur `<Route element={<ErrorBoundary><PageTransition><Halaman /></PageTransition></ErrorBoundary>} />`. Hal ini memastikan jika satu menu mengalami kendala internal, pengguna tetap dapat menjelajahi menu lainnya secara lancar dan kembali ke beranda, daripada merusak seluruh aplikasi secara bersamaan.
- **Konsistensi Siklus Render (No Unmount-TearDown)**: Saat terjadi transisi loading, hindari unmounting dini pada container yang memiliki hooks seperti `<MaintenanceGuard>`. Pola yang direkomendasikan adalah membungkus seluruh elemen kembalian (termasuk skeleton/loading state) di dalam pelindung tersebut agar bagan dependensi React (`useContext`, `useState` internal) tetap terdaftar secara lestari.
- **Pre-Bundling Dependensi Inti**: Gunakan konfigurasi `optimizeDeps.include` di `vite.config.ts` untuk mem-bundle library inti seperti `react`, `react-dom`, dan `motion/react` ke dalam format ESM tunggal yang konsisten agar menghindari masalah runtime dual-module loader.

