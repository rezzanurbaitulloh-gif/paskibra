"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { Plus, Trash2, FileDown, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"

interface FinancialRecord {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

export default function FinancialManagement() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    category: "",
    date: new Date().toISOString().split('T')[0]
  })

  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<Array<{ description: string; amount: number; type: string; category: string; date: string }>>([])
  const [aiError, setAiError] = useState("")
  const [aiSaved, setAiSaved] = useState(false)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const { data } = await supabase.from("financial_records").select("*").order('date', { ascending: false })
    setRecords(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from("financial_records").insert(formData)
    fetchRecords()
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("financial_records").delete().eq("id", id)
    fetchRecords()
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(records)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Keuangan")
    XLSX.writeFile(workbook, "Laporan_Keuangan_Satria_Cengkara.xlsx")
  }

  const handleAiParse = async () => {
    if (!aiText.trim() || aiLoading) return
    setAiLoading(true)
    setAiError("")
    setAiResult([])
    setAiSaved(false)

    try {
      const response = await fetch("/api/financial/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      })
      const data = await response.json()

      if (!response.ok) {
        setAiError(data.error || "Gagal memproses")
        return
      }
      setAiResult(data.records || [])
    } catch {
      setAiError("Terjadi kesalahan jaringan")
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiSave = async () => {
    if (aiResult.length === 0) return
    const { error } = await supabase.from("financial_records").insert(aiResult)
    if (error) {
      setAiError(error.message)
      return
    }
    setAiSaved(true)
    setAiText("")
    setAiResult([])
    fetchRecords()
    setTimeout(() => setAiSaved(false), 3000)
  }

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Manajemen Keuangan</h1>
        <div className="flex gap-2">
          <Button className="gradient-primary" onClick={exportToExcel}>
            <FileDown className="w-4 h-4 mr-2" /> Ekspor Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" /> Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/20">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Transaksi</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Contoh: Beli pita 25rb dan air minum 20rb"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (IDR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipe</Label>
                  <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <Button type="submit" className="gradient-primary w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-border/20 p-6">
          <h3 className="text-muted-foreground text-sm">Total Pemasukan</h3>
          <p className="font-display text-2xl font-bold text-green-400">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome)}
          </p>
        </Card>
        <Card className="glass border-border/20 p-6">
          <h3 className="text-muted-foreground text-sm">Total Pengeluaran</h3>
          <p className="font-display text-2xl font-bold text-red-400">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpense)}
          </p>
        </Card>
        <Card className="glass border-border/20 p-6">
          <h3 className="text-muted-foreground text-sm">Saldo</h3>
          <p className={`font-display text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(balance)}
          </p>
        </Card>
      </div>

      {/* AI Smart Financial Entry */}
      <Card className="glass border-border/20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-display text-xl font-bold">AI Smart Financial Entry</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ketik kalimat bebas, AI akan mendeteksi transaksi secara otomatis.
          </p>
          <div className="space-y-3">
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder='Contoh: "Beli pita 25rb dan air minum 20rb pakai sisa proposal" atau "Terima donasi dari alumni 500rb"'
              rows={3}
              className="glass border-border/20 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleAiParse} disabled={aiLoading || !aiText.trim()} className="gradient-primary">
                {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {aiLoading ? "Menganalisis..." : "Deteksi Transaksi"}
              </Button>
              {aiResult.length > 0 && (
                <Button onClick={handleAiSave} className="bg-green-600 hover:bg-green-700">
                  {aiSaved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                  {aiSaved ? "Tersimpan!" : `Simpan ${aiResult.length} Transaksi`}
                </Button>
              )}
            </div>
            {aiError && <p className="text-sm text-red-400">{aiError}</p>}
            {aiResult.length > 0 && (
              <div className="rounded-lg border border-border/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Kategori</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiResult.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.description}</TableCell>
                        <TableCell className={r.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(r.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${r.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {r.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </TableCell>
                        <TableCell>{r.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="glass border-border/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell>{record.description}</TableCell>
                <TableCell className={record.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(record.amount)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${record.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {record.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </TableCell>
                <TableCell>{record.category}</TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}