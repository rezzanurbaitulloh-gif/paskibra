"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/image-upload"
import { Plus, Trash2 } from "lucide-react"

export interface ListField {
  key: string
  label: string
  placeholder?: string
  type?: "text" | "textarea" | "image"
}

interface ListEditorProps<T extends Record<string, unknown>> {
  fields: ListField[]
  items: T[]
  onChange: (items: T[]) => void
  itemLabel?: string
  addText?: string
  max?: number
}

export function ListEditor<T extends Record<string, unknown>>({
  fields,
  items,
  onChange,
  itemLabel = "Item",
  addText = "Tambah",
  max,
}: ListEditorProps<T>) {
  const update = (index: number, key: string, value: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const add = () => {
    if (max && items.length >= max) return
    const empty = {} as T
    for (const f of fields) {
      ;(empty as Record<string, unknown>)[f.key] = ""
    }
    onChange([...items, empty])
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-line bg-soft/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {itemLabel} #{index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
              className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              aria-label={`Hapus ${itemLabel.toLowerCase()} ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                {field.type === "textarea" ? (
                  <Textarea
                    value={String(item[field.key] || "")}
                    onChange={(e) => update(index, field.key, e.target.value)}
                    rows={2}
                    placeholder={field.placeholder}
                    className="resize-none border-line bg-card"
                  />
                ) : field.type === "image" ? (
                  <ImageUpload
                    value={String(item[field.key] || "")}
                    onChange={(url) => update(index, field.key, url)}
                  />
                ) : (
                  <Input
                    value={String(item[field.key] || "")}
                    onChange={(e) => update(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-9 border-line bg-card"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={!!max && items.length >= max}
        className="w-full border-dashed text-muted-foreground"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> {addText}
      </Button>
    </div>
  )
}
