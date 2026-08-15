export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          platform: string
          url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: string
          url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: string
          url?: string
          created_at?: string
          updated_at?: string
        }
      }
      structure_members: {
        Row: {
          id: string
          name: string
          position: string
          division: string
          generation: string
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position: string
          division: string
          generation: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: string
          division?: string
          generation?: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gallery: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      rentals: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          available: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          available?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          available?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      financial_records: {
        Row: {
          id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          name: string
          description: string | null
          quantity: number
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          quantity: number
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          quantity?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      feedbacks: {
        Row: {
          id: string
          sender_name: string | null
          message: string
          admin_reply: string | null
          replied_at: string | null
          replied_by: string | null
          likes: number
          dislikes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_name?: string | null
          message: string
          admin_reply?: string | null
          replied_at?: string | null
          replied_by?: string | null
          likes?: number
          dislikes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_name?: string | null
          message?: string
          admin_reply?: string | null
          replied_at?: string | null
          replied_by?: string | null
          likes?: number
          dislikes?: number
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          content: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}