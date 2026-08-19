import { redirect } from "next/navigation"

/** Halaman prestasi digabung dengan /galeri (sumber data sama: tabel gallery). Rute dipertahankan agar link lama tetap berfungsi. */
export default function PrestasiPage() {
  redirect("/galeri")
}