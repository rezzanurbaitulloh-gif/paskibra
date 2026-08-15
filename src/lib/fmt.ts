export const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

export const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID")
