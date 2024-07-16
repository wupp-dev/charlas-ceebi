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
      attendance: {
        Row: {
          attendant_id: string
          created_by: string
          date: string | null
          event: string | null
          id: number
          session: string
        }
        Insert: {
          attendant_id: string
          created_by: string
          date?: string | null
          event?: string | null
          id?: number
          session: string
        }
        Update: {
          attendant_id?: string
          created_by?: string
          date?: string | null
          event?: string | null
          id?: number
          session?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_users: {
        Row: {
          created_at: string
          id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: number
        }
        Relationships: []
      }
      question_likes: {
        Row: {
          created_at: string
          id: number
          question_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          question_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          question_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sessions: {
        Row: {
          created_at: string
          event_id: number
          id: number
          is_open: boolean
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          is_open?: boolean
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          is_open?: boolean
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          hidden: boolean
          id: number
          question: string | null
          session_id: number
          user_id: number | null
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          id?: number
          question?: string | null
          session_id: number
          user_id?: number | null
        }
        Update: {
          created_at?: string
          hidden?: boolean
          id?: number
          question?: string | null
          session_id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "question_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_likes_given: {
        Row: {
          id: number
          like_count: number
          session_id: number
          user_id: number
        }
        Insert: {
          id?: number
          like_count?: number
          session_id: number
          user_id: number
        }
        Update: {
          id?: number
          like_count?: number
          session_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_likes_given_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "question_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          allow_admins: boolean | null
          allow_attendance: boolean | null
          allow_notifications: boolean | null
          allow_schedule: boolean | null
          allow_users: boolean | null
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
        }
        Insert: {
          allow_admins?: boolean | null
          allow_attendance?: boolean | null
          allow_notifications?: boolean | null
          allow_schedule?: boolean | null
          allow_users?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
        }
        Update: {
          allow_admins?: boolean | null
          allow_attendance?: boolean | null
          allow_notifications?: boolean | null
          allow_schedule?: boolean | null
          allow_users?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_question_likes: {
        Args: {
          idx: number
        }
        Returns: undefined
      }
      increment_question_likes: {
        Args: {
          idx: number
        }
        Returns: undefined
      }
      increment_user_likes: {
        Args: {
          req_user_id: number
          req_session_id: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
