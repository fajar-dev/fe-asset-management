# Refactor Plan: Clean Architecture & Code Quality

## Ringkasan Masalah Utama

Codebase saat ini sudah memiliki struktur yang cukup baik (service layer, composable, type separation), namun mengandung banyak duplikasi sistemik yang membuat perubahan kecil harus direplikasi di banyak tempat. Masalah utama:

| Masalah | Jumlah Duplikasi |
|---|---|
| Error handling pattern identik di setiap composable | 69+ instance |
| Toast notification inline | 93+ instance |
| `getAuthHeader()` di setiap service class | 17 method |
| `Pagination` interface didefinisikan ulang | 10+ file type |
| Date formatting (`formatDateDisplay`) | 8+ komponen |
| Currency formatting (`IDRFormat`, `formatCurrency`) | 2+ implementasi berbeda |
| Pagination + search boilerplate di composable | 18 composable |
| Response wrapper interface (`success, statusCode, message, data`) | 18+ file type |

Selain duplikasi, ada beberapa pola yang tidak konsisten:
- Beberapa composable menggunakan `function useX()`, sebagian `export const useX = () =>`
- Beberapa composable menggunakan `useState` (Nuxt), sebagian `ref` biasa, tanpa alasan yang jelas
- Service method seperti `getAssets()` memiliki 17 parameter — bukan object
- Folder `utils/` hampir tidak digunakan (hanya 2 helper tak terpakai)

---

## Tujuan Refactor

1. **Eliminasi duplikasi** tanpa membuat abstraksi berlebihan
2. **Pisahkan tanggung jawab** — setiap file punya satu peran yang jelas
3. **Meningkatkan reusability** pada bagian yang memang perlu: formatter, error handling, base service
4. **Konsistensi pola** di seluruh codebase agar mudah dibaca dan dikembangkan siapapun
5. **Tidak mengubah behavior** — refactor murni, bukan rewrite fitur

---

## Prinsip Refactor

### Kapan dijadikan `composable`
Gunakan composable **hanya jika**:
- Butuh state reaktif (`ref`, `computed`) yang di-share antar komponen
- Ada lifecycle logic (`onMounted`, `watch`) yang perlu dikelola
- Logic tersebut dipakai di lebih dari satu tempat

Jangan dijadikan composable jika hanya untuk mengekstrak fungsi biasa — itu adalah `utils`.

### Kapan dijadikan `component`
Pecah menjadi komponen **hanya jika**:
- Pola UI yang sama muncul di 2+ tempat
- Komponen memiliki state/behavior sendiri yang logis
- Ukuran file sudah > 300 baris dan bisa dibagi dengan batas tanggung jawab yang jelas

### Kapan dijadikan `utils`
Pindahkan ke `utils/` jika:
- Fungsi pure (tidak bergantung reaktivitas atau lifecycle)
- Bersifat utilitas: format tanggal, format angka, transform data, mapping label
- Bisa dipakai dari mana saja tanpa konteks Vue/Nuxt

### Kapan tetap inline
Biarkan tetap di tempat jika:
- Hanya dipakai satu kali di satu file
- Mengekstraknya justru memaksa pembaca lompat ke banyak file untuk memahami satu alur

---

## Area yang Perlu Direfactor

### 1. `app/types/` — Tipe yang Terduplikasi

**Masalah:**
- Interface `Pagination` didefinisikan ulang di setiap file type
- Response wrapper `{ success, statusCode, message, data, meta }` direplikasi 18x
- Tidak ada generic response wrapper

**Target:**
- Buat `app/types/api.ts` sebagai single source of truth untuk shared types
- Gunakan generic: `ApiListResponse<T>`, `ApiDetailResponse<T>`

---

### 2. `app/utils/` — Hampir Kosong

**Masalah:**
- Folder hanya berisi 2 fungsi random yang tidak terpakai
- Formatter tersebar di komponen, composable, bahkan pages

**Target:**
- `app/utils/formatters.ts` — semua formatter (tanggal, currency, label)
- `app/utils/date.ts` — semua manipulasi tanggal (konversi, timezone GMT+7, toISO)
- `app/utils/errorHandler.ts` — ekstraksi pesan error dari `FetchError`

---

### 3. `app/services/` — Duplikasi Auth & Parameter Explosion

**Masalah:**
- `getAuthHeader()` copy-paste di 17 service class
- `getAssets()` punya 17 parameter posisional
- Tidak ada base class/helper bersama

**Target:**
- Buat `app/services/base.ts` — `BaseService` class dengan `getAuthHeader()` dan helper umum
- Semua service extend `BaseService`
- Ganti parameter explosion dengan filter object (`AssetFilterOptions`, dst.)

---

### 4. `app/composables/` — Boilerplate CRUD Berulang

**Masalah:**
- 18 composable mengulang pola yang hampir identik: state refs, error handling, toast, pagination/search watcher, refresh logic
- Tidak ada standardisasi struktur return value

**Target:**
- Buat `app/composables/useCrudState.ts` — factory untuk state CRUD + pagination + search
- Refactor composable yang punya pola identik untuk pakai factory ini
- Standardisasi naming dan struktur return value

---

### 5. `app/components/` — Modal yang Terlalu Besar

**Masalah:**
- Modal `AddModal.vue` dan `UpdateModal.vue` rata-rata 200-400 baris
- Logika validasi Zod schema inline di dalam komponen
- `formatDateDisplay` diulang di 8+ modal komponen

**Target:**
- Ekstrak Zod validation schema ke file terpisah per domain: `app/schemas/assetSchema.ts`, dst.
- Pindahkan `formatDateDisplay` ke `utils/date.ts`
- Evaluasi apakah ada pola modal yang cukup sama untuk dijadikan base component

---

### 6. Pola Tidak Konsisten

**Masalah:**
- Campuran `function useX()` vs `export const useX = () =>`
- Campuran `useState` vs `ref` tanpa aturan jelas

**Target:**
- Standardisasi: gunakan `export function useX()` di semua composable
- Aturan: `useState` hanya untuk state yang butuh SSR-safe / persisten antar navigasi, selainnya `ref`

---

## Prioritas Pengerjaan

| Prioritas | Area | Alasan |
|---|---|---|
| 🔴 Tinggi | Shared types (`api.ts`) | Fondasi untuk semua refactor lain |
| 🔴 Tinggi | `utils/formatters.ts` + `utils/date.ts` | Paling banyak duplikasi, paling mudah diekstrak |
| 🔴 Tinggi | `services/base.ts` | Eliminasi 17 copy-paste `getAuthHeader()` |
| 🟡 Sedang | `utils/errorHandler.ts` | Konsistensi error handling di semua composable |
| 🟡 Sedang | Filter object untuk service params | Mengurangi parameter explosion |
| 🟡 Sedang | Ekstrak Zod schema dari modal | Mengurangi ukuran komponen |
| 🟢 Rendah | `useCrudState` factory | High impact tapi butuh kehati-hatian agar tidak over-abstraksi |
| 🟢 Rendah | Standardisasi pola composable | Low risk, bisa dilakukan bertahap |

---

## Pembagian Task Per Tahap

### Tahap 1 — Shared Foundation (tanpa ubah behavior)

- [ ] **T1.1** Buat `app/types/api.ts` — definisikan `Pagination`, `ApiListResponse<T>`, `ApiDetailResponse<T>`, `ApiError`
- [ ] **T1.2** Update semua file di `app/types/` — hapus definisi `Pagination` lokal, import dari `api.ts`
- [ ] **T1.3** Update semua file di `app/types/` — ganti response wrapper lokal dengan generic dari `api.ts`
- [ ] **T1.4** Pastikan tidak ada breaking change di composable dan service setelah perubahan type

---

### Tahap 2 — Utilities (pure extraction)

- [ ] **T2.1** Buat `app/utils/date.ts`:
  - `formatDate(date: string | Date): string` — format display standar
  - `toISOLocal(date: Date): string` — konversi ke format backend
  - `toGMT7(date: Date): Date` — konversi timezone
- [ ] **T2.2** Buat `app/utils/formatters.ts`:
  - `formatCurrency(value: number): string` — IDR formatting
  - `formatStatusLabel(status: string): string` — mapping status ke label display
  - Fungsi mapping label lain yang ditemukan inline di komponen
- [ ] **T2.3** Hapus semua duplikasi `formatDateDisplay`, `IDRFormat`, `formatCurrency` dari komponen
- [ ] **T2.4** Buat `app/utils/errorHandler.ts`:
  - `extractErrorMessage(err: unknown, fallback?: string): string`

---

### Tahap 3 — Service Layer

- [ ] **T3.1** Buat `app/services/base.ts` — `BaseService` dengan `getAuthHeader()`
- [ ] **T3.2** Refactor semua service class untuk extend `BaseService`, hapus `getAuthHeader()` lokal
- [ ] **T3.3** Definisikan filter object types untuk service dengan banyak parameter:
  - `AssetFilterOptions` untuk `AssetService.getAssets()`
  - Lakukan serupa untuk service lain yang memiliki > 4 parameter
- [ ] **T3.4** Update service method signature, pastikan composable yang memanggil service tidak rusak

---

### Tahap 4 — Composable Cleanup

- [ ] **T4.1** Gunakan `extractErrorMessage` dari `errorHandler.ts` di semua composable — hapus inline error extraction
- [ ] **T4.2** Standardisasi pola toast: buat 2-3 helper lokal atau gunakan pola yang konsisten
- [ ] **T4.3** Standardisasi deklarasi composable: semua pakai `export function useX()`
- [ ] **T4.4** Audit penggunaan `useState` vs `ref` — konversi ke `ref` di mana tidak butuh SSR-state
- [ ] **T4.5** Evaluasi composable mana yang bisa sederhanakan pagination/search boilerplate-nya (lakukan hanya jika hasilnya lebih readable, bukan lebih abstrak)

---

### Tahap 5 — Component Cleanup

- [ ] **T5.1** Ekstrak semua Zod schema dari modal ke `app/schemas/`:
  - `assetSchema.ts`, `holderSchema.ts`, `maintenanceSchema.ts`, dst.
- [ ] **T5.2** Identifikasi dan ekstrak shared modal pattern jika ada 2+ modal dengan struktur identik
- [ ] **T5.3** Review semua modal > 300 baris — pecah jika ada batas tanggung jawab yang natural

---

## Checklist Implementasi

### Sebelum mulai
- [ ] Pastikan semua halaman bisa dibuka tanpa error (baseline)
- [ ] Catat halaman dan fitur yang akan diuji ulang setelah refactor

### Per task
- [ ] Tidak ada perubahan behavior — hanya structural
- [ ] Setiap type yang diubah tidak memunculkan TypeScript error baru
- [ ] Import path semua file yang terpengaruh diupdate
- [ ] Tidak ada dead import yang tertinggal

### Setelah selesai per tahap
- [ ] Semua halaman utama dapat dibuka normal
- [ ] Tidak ada TypeScript error (`nuxt typecheck` atau `vue-tsc`)
- [ ] Tidak ada console error saat runtime
- [ ] Fungsionalitas CRUD (tambah, edit, hapus, list) di semua domain berjalan normal

---

## Expected Outcome

Setelah refactor selesai:

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Duplikasi `Pagination` type | 10+ definisi terpisah | 1 definisi di `api.ts` |
| Response wrapper interface | Direplikasi 18x | Generic `ApiListResponse<T>` / `ApiDetailResponse<T>` |
| `getAuthHeader()` | 17 method identik | 1 method di `BaseService` |
| Date formatter | 8+ implementasi berbeda | 1 fungsi di `utils/date.ts` |
| Currency formatter | 2 implementasi berbeda | 1 fungsi di `utils/formatters.ts` |
| Error handling | 69+ pattern inline | 1 `extractErrorMessage()` di `utils/errorHandler.ts` |
| Zod schema | Inline di dalam komponen besar | File terpisah per domain di `app/schemas/` |
| Service parameter | Method dengan 17 parameter | Object filter `AssetFilterOptions` |

**Estimasi pengurangan baris kode duplikat: 30–40%** dari total codebase saat ini, tanpa mengorbankan keterbacaan atau menambah kompleksitas arsitektur yang tidak perlu.

---

> Refactor ini bersifat incremental dan aman untuk project yang sedang berjalan. Setiap tahap dapat di-PR secara mandiri dan tidak memblokir pengembangan fitur baru.
