"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { fmtIDR } from "@/lib/fmt"

export interface ChartBar {
  key: string
  label: string
  full: string
  inc: number
  exp: number
}

function fmtShort(v: number) {
  if (v === 0) return "0"
  if (v < 1000) return String(v)
  if (v < 1_000_000) return `${(v / 1000).toFixed(0)}rb`
  const jt = v / 1_000_000
  const s = jt >= 100 ? jt.toFixed(0) : jt.toFixed(1).replace(/\.0$/, "")
  return `${s.replace(".", ",")}jt`
}

const chartConfig = {
  inc: {
    label: "Pemasukan",
    color: "#22c55e",
  },
  exp: {
    label: "Pengeluaran",
    color: "#ef4444",
  },
} satisfies ChartConfig

interface FinanceChartProps {
  bars: ChartBar[]
  title?: string
  control?: React.ReactNode
}

export function FinanceChart({ bars, title = "Total Keuangan", control }: FinanceChartProps) {
  const totalInc = bars.reduce((s, b) => s + b.inc, 0)
  const totalExp = bars.reduce((s, b) => s + b.exp, 0)
  const balance = totalInc - totalExp
  const data = bars.map((b) => ({
    ...b,
    inc: b.inc > 0 ? b.inc : undefined,
    exp: b.exp > 0 ? b.exp : undefined,
  }))

  if (bars.length === 0) {
    return (
      <Card className="border-line">
        <CardContent className="flex min-h-48 items-center justify-center py-10 text-sm text-muted-foreground">
          Belum ada data keuangan pada periode ini.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-line">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="font-display">{title}</CardTitle>
          <CardDescription>Pemasukan vs Pengeluaran</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {control}
          <div className="hidden items-center gap-4 rounded-xl border border-line bg-soft px-4 py-2 md:flex">
          <div>
            <p className="text-[10px] text-muted-foreground">Selisih</p>
            <p className={`font-display text-lg font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              {balance >= 0 ? "+" : "-"}
              {fmtIDR(Math.abs(balance))}
            </p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <p className="text-[10px] text-muted-foreground">Total Masuk</p>
            <p className="font-display text-sm font-bold text-green-500">{fmtIDR(totalInc)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total Keluar</p>
            <p className="font-display text-sm font-bold text-red-500">{fmtIDR(totalExp)}</p>
          </div>
        </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mt-2 min-h-[240px] w-full">
          <BarChart accessibilityLayer data={data} barGap={6}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
              className="text-xs"
            />
            <YAxis
              width={46}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => fmtShort(v)}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => {
                    const v = Number(value)
                    if (v === 0) return null
                    const isInc = name === "inc"
                    return (
                      <div className="flex w-full flex-1 items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: isInc ? "#22c55e" : "#ef4444" }}
                          />
                          {isInc ? "Pemasukan" : "Pengeluaran"}
                        </span>
                        <span className="font-semibold tabular-nums">{fmtIDR(v)}</span>
                      </div>
                    )
                  }}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as ChartBar | undefined)?.full || ""
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="inc" fill="var(--color-inc)" radius={[8, 8, 0, 0]} barSize={20} />
            <Bar dataKey="exp" fill="var(--color-exp)" radius={[8, 8, 0, 0]} barSize={20} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
