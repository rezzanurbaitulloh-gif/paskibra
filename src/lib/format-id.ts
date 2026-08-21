const BULAN: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, agu: 8, sep: 9, okt: 10, nov: 11, des: 12,
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Normalisasi tanggal berbagai format (ID/EN) menjadi YYYY-MM-DD; "" bila tidak dikenali */
export function normalizeDateId(input: unknown): string {
  const s = String(input ?? "").trim()
  if (!s) return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const mTxt = s.match(/(\d{1,2})\s+([a-zA-Z]+)\s*(\d{4})?/)
  if (mTxt) {
    const bulan = BULAN[mTxt[2].toLowerCase()]
    if (bulan) {
      const y = mTxt[3] ? Number(mTxt[3]) : new Date().getFullYear()
      return `${y}-${pad(bulan)}-${pad(Number(mTxt[1]))}`
    }
  }
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (m) {
    let d = Number(m[1])
    let mo = Number(m[2])
    let y = Number(m[3])
    if (y < 100) y += 2000
    if (mo > 12 && d <= 12) [d, mo] = [mo, d]
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${pad(mo)}-${pad(d)}`
  }
  const iso = new Date(s)
  if (!Number.isNaN(iso.getTime())) return iso.toISOString().slice(0, 10)
  return ""
}

/** Parse nominal Rupiah dari berbagai format ("Rp 1.500.000", "1,5jt", angka) → integer aman */
export function parseAmountId(input: unknown): number {
  if (typeof input === "number") return Math.round(input)
  const s = String(input ?? "").trim().toLowerCase()
  if (!s) return 0
  const digits = s.replace(/[^\d]/g, "")
  const base = digits ? Number(digits) : 0
  if (/jt|juta/.test(s) && base < 1000) return base * 1_000_000
  if (/rb|ribu|k\b/.test(s) && base < 100_000) return base * 1_000
  return base
}
