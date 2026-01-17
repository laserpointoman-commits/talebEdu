export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      allowance_settings: {
        Row: {
          allowed_categories: string[] | null
          auto_deduct_on_entry: boolean | null
          blocked_categories: string[] | null
          created_at: string | null
          daily_limit: number | null
          entry_allowance_amount: number | null
          id: string
          is_active: boolean | null
          parent_id: string
          student_id: string
          updated_at: string | null
          weekly_limit: number | null
        }
        Insert: {
          allowed_categories?: string[] | null
          auto_deduct_on_entry?: boolean | null
          blocked_categories?: string[] | null
          created_at?: string | null
          daily_limit?: number | null
          entry_allowance_amount?: number | null
          id?: string
          is_active?: boolean | null
          parent_id: string
          student_id: string
          updated_at?: string | null
          weekly_limit?: number | null
        }
        Update: {
          allowed_categories?: string[] | null
          auto_deduct_on_entry?: boolean | null
          blocked_categories?: string[] | null
          created_at?: string | null
          daily_limit?: number | null
          entry_allowance_amount?: number | null
          id?: string
          is_active?: boolean | null
          parent_id?: string
          student_id?: string
          updated_at?: string | null
          weekly_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "allowance_settings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowance_settings_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowance_settings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_chats: {
        Row: {
          contact_id: string | null
          created_at: string
          group_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_chats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          idempotency_key: string | null
          location: string | null
          manual_entry: boolean | null
          manual_entry_by: string | null
          method: string
          nfc_verified: boolean | null
          recorded_by: string | null
          status: string
          student_id: string | null
          time: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          idempotency_key?: string | null
          location?: string | null
          manual_entry?: boolean | null
          manual_entry_by?: string | null
          method: string
          nfc_verified?: boolean | null
          recorded_by?: string | null
          status: string
          student_id?: string | null
          time: string
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          idempotency_key?: string | null
          location?: string | null
          manual_entry?: boolean | null
          manual_entry_by?: string | null
          method?: string
          nfc_verified?: boolean | null
          recorded_by?: string | null
          status?: string
          student_id?: string | null
          time?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          currency: string
          description: string | null
          id: string
          payment_date: string
          payment_method: string | null
          status: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          subscription_id: string
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          currency: string
          id: string
          next_billing_date: string | null
          semester_end: string
          semester_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          next_billing_date?: string | null
          semester_end: string
          semester_start: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          next_billing_date?: string | null
          semester_end?: string
          semester_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bus_boarding_logs: {
        Row: {
          action: string
          bus_id: string | null
          created_at: string | null
          id: string
          idempotency_key: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          manual_entry: boolean | null
          manual_entry_by: string | null
          nfc_verified: boolean | null
          student_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          bus_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          manual_entry?: boolean | null
          manual_entry_by?: string | null
          nfc_verified?: boolean | null
          student_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          bus_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          manual_entry?: boolean | null
          manual_entry_by?: string | null
          nfc_verified?: boolean | null
          student_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_boarding_logs_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_boarding_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_locations: {
        Row: {
          bus_id: string | null
          current_stop: string | null
          eta_minutes: number | null
          heading: number | null
          id: string
          last_updated: string | null
          latitude: number
          longitude: number
          next_stop: string | null
          speed: number | null
          timestamp: string | null
        }
        Insert: {
          bus_id?: string | null
          current_stop?: string | null
          eta_minutes?: number | null
          heading?: number | null
          id?: string
          last_updated?: string | null
          latitude: number
          longitude: number
          next_stop?: string | null
          speed?: number | null
          timestamp?: string | null
        }
        Update: {
          bus_id?: string | null
          current_stop?: string | null
          eta_minutes?: number | null
          heading?: number | null
          id?: string
          last_updated?: string | null
          latitude?: number
          longitude?: number
          next_stop?: string | null
          speed?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_routes: {
        Row: {
          afternoon_schedule: Json | null
          bus_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          morning_schedule: Json | null
          route_name: string
          route_name_ar: string | null
          stops: Json
          updated_at: string | null
        }
        Insert: {
          afternoon_schedule?: Json | null
          bus_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          morning_schedule?: Json | null
          route_name: string
          route_name_ar?: string | null
          stops?: Json
          updated_at?: string | null
        }
        Update: {
          afternoon_schedule?: Json | null
          bus_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          morning_schedule?: Json | null
          route_name?: string
          route_name_ar?: string | null
          stops?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_routes_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_trips: {
        Row: {
          bus_id: string
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          current_stop: string | null
          driver_id: string | null
          ended_at: string | null
          id: string
          next_stop: string | null
          started_at: string | null
          status: string
          supervisor_id: string | null
          trip_type: string
          updated_at: string | null
        }
        Insert: {
          bus_id: string
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_stop?: string | null
          driver_id?: string | null
          ended_at?: string | null
          id?: string
          next_stop?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          trip_type?: string
          updated_at?: string | null
        }
        Update: {
          bus_id?: string
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          current_stop?: string | null
          driver_id?: string | null
          ended_at?: string | null
          id?: string
          next_stop?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          trip_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_trips_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_trips_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          bus_number: string
          capacity: number
          created_at: string | null
          driver_id: string | null
          id: string
          model: string | null
          status: string | null
          supervisor_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          bus_number: string
          capacity: number
          created_at?: string | null
          driver_id?: string | null
          id?: string
          model?: string | null
          status?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          bus_number?: string
          capacity?: number
          created_at?: string | null
          driver_id?: string | null
          id?: string
          model?: string | null
          status?: string | null
          supervisor_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buses_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buses_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_type: string
          caller_id: string
          duration: number | null
          ended_at: string | null
          group_id: string | null
          id: string
          recipient_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          call_type: string
          caller_id: string
          duration?: number | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          recipient_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          duration?: number | null
          ended_at?: string | null
          group_id?: string | null
          id?: string
          recipient_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      canteen_categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      canteen_items: {
        Row: {
          available: boolean | null
          barcode: string | null
          category: string
          cost_price: number | null
          created_at: string | null
          icon: string | null
          id: string
          low_stock_alert: number | null
          name: string
          name_ar: string | null
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          barcode?: string | null
          category: string
          cost_price?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          low_stock_alert?: number | null
          name: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          barcode?: string | null
          category?: string
          cost_price?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          low_stock_alert?: number | null
          name?: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      canteen_orders: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string
          served_by: string | null
          student_id: string | null
          total_amount: number
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          notes?: string | null
          payment_method: string
          served_by?: string | null
          student_id?: string | null
          total_amount: number
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string
          served_by?: string | null
          student_id?: string | null
          total_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canteen_orders_served_by_fkey"
            columns: ["served_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_orders_served_by_fkey"
            columns: ["served_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      canteen_restrictions: {
        Row: {
          allowed_items: string[] | null
          created_at: string | null
          daily_limit: number | null
          id: string
          parent_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          allowed_items?: string[] | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          parent_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          allowed_items?: string[] | null
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          parent_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canteen_restrictions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_restrictions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_restrictions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_logs: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          location: string
          nfc_id: string | null
          student_id: string | null
          student_name: string | null
          synced: boolean | null
          timestamp: string
          type: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          location: string
          nfc_id?: string | null
          student_id?: string | null
          student_name?: string | null
          synced?: boolean | null
          timestamp: string
          type: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          location?: string
          nfc_id?: string | null
          student_id?: string | null
          student_name?: string | null
          synced?: boolean | null
          timestamp?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_configs"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "checkpoint_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string | null
          created_at: string | null
          day: string
          id: string
          room: string | null
          subject: string
          teacher_id: string | null
          time: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          day: string
          id?: string
          room?: string | null
          subject: string
          teacher_id?: string | null
          time: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          day?: string
          id?: string
          room?: string | null
          subject?: string
          teacher_id?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          class_teacher_id: string | null
          created_at: string | null
          description: string | null
          grade: string
          id: string
          name: string
          room: string | null
          section: string
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          description?: string | null
          grade: string
          id?: string
          name: string
          room?: string | null
          section: string
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          description?: string | null
          grade?: string
          id?: string
          name?: string
          room?: string | null
          section?: string
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          student_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          student_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_configs: {
        Row: {
          created_at: string | null
          device_id: string
          device_type: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          linked_bus_id: string | null
          linked_user_id: string | null
          location: string
          mode: string | null
          nfc_id: string | null
          session_nfc_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_type: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          linked_bus_id?: string | null
          linked_user_id?: string | null
          location: string
          mode?: string | null
          nfc_id?: string | null
          session_nfc_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          linked_bus_id?: string | null
          linked_user_id?: string | null
          location?: string
          mode?: string | null
          nfc_id?: string | null
          session_nfc_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_configs_linked_bus_id_fkey"
            columns: ["linked_bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sessions: {
        Row: {
          device_id: string
          ended_at: string | null
          id: string
          nfc_id: string
          session_type: string
          started_at: string
          status: string
        }
        Insert: {
          device_id: string
          ended_at?: string | null
          id?: string
          nfc_id: string
          session_type: string
          started_at?: string
          status?: string
        }
        Update: {
          device_id?: string
          ended_at?: string | null
          id?: string
          nfc_id?: string
          session_type?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_configs"
            referencedColumns: ["device_id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean | null
          delivered_at: string | null
          forwarded_from_id: string | null
          id: string
          is_deleted_for_recipient: boolean | null
          is_deleted_for_sender: boolean | null
          is_delivered: boolean | null
          is_read: boolean | null
          message_type: string | null
          read_at: string | null
          recipient_id: string
          reply_to_id: string | null
          sender_id: string
          subject: string | null
          updated_at: string
          voice_duration: number | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          forwarded_from_id?: string | null
          id?: string
          is_deleted_for_recipient?: boolean | null
          is_deleted_for_sender?: boolean | null
          is_delivered?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          recipient_id: string
          reply_to_id?: string | null
          sender_id: string
          subject?: string | null
          updated_at?: string
          voice_duration?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          forwarded_from_id?: string | null
          id?: string
          is_deleted_for_recipient?: boolean | null
          is_deleted_for_sender?: boolean | null
          is_delivered?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string
          reply_to_id?: string | null
          sender_id?: string
          subject?: string | null
          updated_at?: string
          voice_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_forwarded_from_id_fkey"
            columns: ["forwarded_from_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          bus_id: string | null
          created_at: string | null
          employee_id: string
          experience_years: number | null
          id: string
          join_date: string | null
          license_expiry: string | null
          license_number: string
          profile_id: string | null
          status: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          employee_id: string
          experience_years?: number | null
          id?: string
          join_date?: string | null
          license_expiry?: string | null
          license_number: string
          profile_id?: string | null
          status?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          employee_id?: string
          experience_years?: number | null
          id?: string
          join_date?: string | null
          license_expiry?: string | null
          license_number?: string
          profile_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          contract_type: string | null
          created_at: string | null
          custom_position: string | null
          department: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_id: string
          employment_status: string | null
          iban: string | null
          id: string
          insurance_number: string | null
          join_date: string | null
          national_id: string | null
          nfc_id: string | null
          passport_number: string | null
          position: Database["public"]["Enums"]["employee_position"]
          profile_id: string | null
          updated_at: string | null
          visa_expiry: string | null
          visa_number: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          contract_type?: string | null
          created_at?: string | null
          custom_position?: string | null
          department?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id: string
          employment_status?: string | null
          iban?: string | null
          id?: string
          insurance_number?: string | null
          join_date?: string | null
          national_id?: string | null
          nfc_id?: string | null
          passport_number?: string | null
          position: Database["public"]["Enums"]["employee_position"]
          profile_id?: string | null
          updated_at?: string | null
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          contract_type?: string | null
          created_at?: string | null
          custom_position?: string | null
          department?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id?: string
          employment_status?: string | null
          iban?: string | null
          id?: string
          insurance_number?: string | null
          join_date?: string | null
          national_id?: string | null
          nfc_id?: string | null
          passport_number?: string | null
          position?: Database["public"]["Enums"]["employee_position"]
          profile_id?: string | null
          updated_at?: string | null
          visa_expiry?: string | null
          visa_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string | null
          date: string
          duration: string
          exam_type: string
          id: string
          room: string | null
          subject: string
          time: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date: string
          duration: string
          exam_type: string
          id?: string
          room?: string | null
          subject: string
          time: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          duration?: string
          exam_type?: string
          id?: string
          room?: string | null
          subject?: string
          time?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string | null
          fee_id: string | null
          id: string
          parent_id: string | null
          payment_date: string | null
          payment_method: string
          receipt_number: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          fee_id?: string | null
          id?: string
          parent_id?: string | null
          payment_date?: string | null
          payment_method: string
          receipt_number?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          fee_id?: string | null
          id?: string
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          receipt_number?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure: {
        Row: {
          academic_year: string
          amount: number
          created_at: string | null
          description: string | null
          fee_type: string
          grade: string
          id: string
          payment_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          amount: number
          created_at?: string | null
          description?: string | null
          fee_type: string
          grade: string
          id?: string
          payment_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          fee_type?: string
          grade?: string
          id?: string
          payment_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_type: string
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          name: string
          name_ar: string | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_reports_cache: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          report_date: string
          report_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          report_date: string
          report_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          report_date?: string
          report_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          description: string | null
          description_ar: string | null
          documents: Json | null
          id: string
          payment_method: string | null
          reference_number: string | null
          status: string | null
          transaction_date: string | null
          transaction_number: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          documents?: Json | null
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_number?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          documents?: Json | null
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_number?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          student1_id: string
          student2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          student1_id: string
          student2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          student1_id?: string
          student2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_student1_id_fkey"
            columns: ["student1_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_student2_id_fkey"
            columns: ["student2_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string | null
          exam_id: string | null
          grade: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          grade?: string | null
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_read_status: {
        Row: {
          delivered_at: string | null
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_read_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean | null
          forwarded_from_id: string | null
          group_id: string
          id: string
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          voice_duration: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          forwarded_from_id?: string | null
          group_id: string
          id?: string
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          voice_duration?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          forwarded_from_id?: string | null
          group_id?: string
          id?: string
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          voice_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_by: string | null
          class_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          created_at: string | null
          feedback: string | null
          grade: string | null
          homework_id: string | null
          id: string
          status: string
          student_id: string | null
          submission_date: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          grade?: string | null
          homework_id?: string | null
          id?: string
          status: string
          student_id?: string | null
          submission_date?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          grade?: string | null
          homework_id?: string | null
          id?: string
          status?: string
          student_id?: string | null
          submission_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          created_at: string | null
          fee_id: string | null
          frequency: string | null
          id: string
          installment_amount: number
          status: string | null
          total_installments: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fee_id?: string | null
          frequency?: string | null
          id?: string
          installment_amount: number
          status?: string | null
          total_installments: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fee_id?: string | null
          frequency?: string | null
          id?: string
          installment_amount?: number
          status?: string | null
          total_installments?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_schedule: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          paid_amount: number | null
          payment_date: string | null
          plan_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          paid_amount?: number | null
          payment_date?: string | null
          plan_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          paid_amount?: number | null
          payment_date?: string | null
          plan_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_schedule_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      late_fee_config: {
        Row: {
          created_at: string | null
          fee_type: string
          grace_days: number
          id: string
          is_active: boolean | null
          late_fee_amount: number | null
          late_fee_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fee_type: string
          grace_days?: number
          id?: string
          is_active?: boolean | null
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fee_type?: string
          grace_days?: number
          id?: string
          is_active?: boolean | null
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_orders: {
        Row: {
          created_at: string | null
          id: string
          meal_id: string | null
          order_date: string
          parent_id: string | null
          quantity: number | null
          serving_time: string
          special_instructions: string | null
          status: string | null
          student_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_id?: string | null
          order_date: string
          parent_id?: string | null
          quantity?: number | null
          serving_time: string
          special_instructions?: string | null
          status?: string | null
          student_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_id?: string | null
          order_date?: string
          parent_id?: string | null
          quantity?: number | null
          serving_time?: string
          special_instructions?: string | null
          status?: string | null
          student_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_orders_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          allergens: string[] | null
          available_days: string[] | null
          calories: number | null
          category: string
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          ingredients: string[] | null
          is_dairy_free: boolean | null
          is_gluten_free: boolean | null
          is_vegetarian: boolean | null
          max_orders: number | null
          name: string
          name_ar: string | null
          price: number
          serving_time: string
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          available_days?: string[] | null
          calories?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          ingredients?: string[] | null
          is_dairy_free?: boolean | null
          is_gluten_free?: boolean | null
          is_vegetarian?: boolean | null
          max_orders?: number | null
          name: string
          name_ar?: string | null
          price?: number
          serving_time: string
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          available_days?: string[] | null
          calories?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          ingredients?: string[] | null
          is_dairy_free?: boolean | null
          is_gluten_free?: boolean | null
          is_vegetarian?: boolean | null
          max_orders?: number | null
          name?: string
          name_ar?: string | null
          price?: number
          serving_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          enabled: boolean | null
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          enabled?: boolean | null
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          enabled?: boolean | null
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          last_attempt_at: string | null
          max_attempts: number | null
          message: string
          notification_type: string
          parent_id: string
          processed_at: string | null
          processing_started_at: string | null
          status: string | null
          student_id: string | null
          title: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          max_attempts?: number | null
          message: string
          notification_type: string
          parent_id: string
          processed_at?: string | null
          processing_started_at?: string | null
          status?: string | null
          student_id?: string | null
          title: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          max_attempts?: number | null
          message?: string
          notification_type?: string
          parent_id?: string
          processed_at?: string | null
          processing_started_at?: string | null
          status?: string | null
          student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_scans: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          scan_data: Json
          synced: boolean | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          scan_data: Json
          synced?: boolean | null
          timestamp: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          scan_data?: Json
          synced?: boolean | null
          timestamp?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          payment_method: string
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          payment_method: string
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      parent_invitation_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          method: string | null
          token_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          token_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method?: string | null
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_invitation_logs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "parent_registration_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_registration_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          invitation_method: string | null
          last_used_at: string | null
          notes: string | null
          parent_id: string
          remaining_uses: number | null
          student_registered_id: string | null
          students_registered: number | null
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_method?: string | null
          last_used_at?: string | null
          notes?: string | null
          parent_id: string
          remaining_uses?: number | null
          student_registered_id?: string | null
          students_registered?: number | null
          token?: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_method?: string | null
          last_used_at?: string | null
          notes?: string | null
          parent_id?: string
          remaining_uses?: number | null
          student_registered_id?: string | null
          students_registered?: number | null
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_registration_tokens_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_registration_tokens_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_registration_tokens_student_registered_id_fkey"
            columns: ["student_registered_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parental_controls: {
        Row: {
          allowed_items: Json | null
          app_restrictions: Json | null
          bedtime: string | null
          blocked_items: Json | null
          category_restrictions: Json | null
          content_filter_level: string | null
          created_at: string | null
          daily_spending_limit: number | null
          id: string
          location_tracking: boolean | null
          parent_id: string | null
          purchase_approval_required: boolean | null
          screen_time_limit: number | null
          student_id: string | null
          time_restrictions: Json | null
          updated_at: string | null
          weekly_spending_limit: number | null
        }
        Insert: {
          allowed_items?: Json | null
          app_restrictions?: Json | null
          bedtime?: string | null
          blocked_items?: Json | null
          category_restrictions?: Json | null
          content_filter_level?: string | null
          created_at?: string | null
          daily_spending_limit?: number | null
          id?: string
          location_tracking?: boolean | null
          parent_id?: string | null
          purchase_approval_required?: boolean | null
          screen_time_limit?: number | null
          student_id?: string | null
          time_restrictions?: Json | null
          updated_at?: string | null
          weekly_spending_limit?: number | null
        }
        Update: {
          allowed_items?: Json | null
          app_restrictions?: Json | null
          bedtime?: string | null
          blocked_items?: Json | null
          category_restrictions?: Json | null
          content_filter_level?: string | null
          created_at?: string | null
          daily_spending_limit?: number | null
          id?: string
          location_tracking?: boolean | null
          parent_id?: string | null
          purchase_approval_required?: boolean | null
          screen_time_limit?: number | null
          student_id?: string | null
          time_restrictions?: Json | null
          updated_at?: string | null
          weekly_spending_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_controls_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_controls_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_ar: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          type?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          created_at: string | null
          fee_id: string
          id: string
          notification_method: string | null
          parent_notified: boolean | null
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string | null
          fee_id: string
          id?: string
          notification_method?: string | null
          parent_notified?: boolean | null
          reminder_type: string
          sent_at?: string
        }
        Update: {
          created_at?: string | null
          fee_id?: string
          id?: string
          notification_method?: string | null
          parent_notified?: boolean | null
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          fee_id: string | null
          id: string
          notes: string | null
          parent_id: string | null
          payment_date: string | null
          payment_method: string
          receipt_number: string | null
          receipt_url: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fee_id?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method: string
          receipt_number?: string | null
          receipt_url?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fee_id?: string | null
          id?: string
          notes?: string | null
          parent_id?: string | null
          payment_date?: string | null
          payment_method?: string
          receipt_number?: string | null
          receipt_url?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_config: {
        Row: {
          bank_account: string | null
          base_salary: number
          created_at: string
          employee_id: string | null
          hourly_rate: number | null
          id: string
          payment_frequency: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          base_salary: number
          created_at?: string
          employee_id?: string | null
          hourly_rate?: number | null
          id?: string
          payment_frequency?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          base_salary?: number
          created_at?: string
          employee_id?: string | null
          hourly_rate?: number | null
          id?: string
          payment_frequency?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_config_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_config_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          teacher_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          teacher_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          teacher_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_notifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          absent_days: number
          base_salary: number
          bonuses: number | null
          created_at: string
          created_by: string | null
          deductions: number | null
          id: string
          leave_days: number
          net_salary: number
          notes: string | null
          overtime_hours: number | null
          payment_date: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string
          period_end: string
          period_start: string
          present_days: number
          teacher_id: string
          total_hours: number | null
          transaction_id: string | null
          updated_at: string
          working_days: number
        }
        Insert: {
          absent_days?: number
          base_salary: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          leave_days?: number
          net_salary: number
          notes?: string | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string
          period_end: string
          period_start: string
          present_days?: number
          teacher_id: string
          total_hours?: number | null
          transaction_id?: string | null
          updated_at?: string
          working_days?: number
        }
        Update: {
          absent_days?: number
          base_salary?: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          leave_days?: number
          net_salary?: number
          notes?: string | null
          overtime_hours?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string
          period_end?: string
          period_start?: string
          present_days?: number
          teacher_id?: string
          total_hours?: number | null
          transaction_id?: string | null
          updated_at?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          from_wallet_type: string
          id: string
          payroll_record_id: string
          processed_at: string | null
          status: string
          to_wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          from_wallet_type: string
          id?: string
          payroll_record_id: string
          processed_at?: string | null
          status?: string
          to_wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          from_wallet_type?: string
          id?: string
          payroll_record_id?: string
          processed_at?: string | null
          status?: string
          to_wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_transactions_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_parent_registrations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          max_students: number
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_students?: number
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          max_students?: number
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_parent_registrations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_parent_registrations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_student_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          parent_id: string
          rejection_reason: string | null
          status: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          parent_id: string
          rejection_reason?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string
          rejection_reason?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_student_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_student_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_student_approvals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_student_approvals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_student_approvals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_chats: {
        Row: {
          contact_id: string | null
          created_at: string
          group_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_chats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          student_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          student_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          student_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          image: string | null
          in_stock: boolean
          name: string
          name_ar: string | null
          price: number
          sizes: Json | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean
          name: string
          name_ar?: string | null
          price: number
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image?: string | null
          in_stock?: boolean
          name?: string
          name_ar?: string | null
          price?: number
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          email_confirmed: boolean | null
          expected_students_count: number | null
          full_name: string
          full_name_ar: string | null
          id: string
          is_active: boolean | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          nfc_pin_hash: string | null
          parent_user_id: string | null
          phone: string | null
          profile_image: string | null
          registered_students_count: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_confirmed?: boolean | null
          expected_students_count?: number | null
          full_name: string
          full_name_ar?: string | null
          id: string
          is_active?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          nfc_pin_hash?: string | null
          parent_user_id?: string | null
          phone?: string | null
          profile_image?: string | null
          registered_students_count?: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_confirmed?: boolean | null
          expected_students_count?: number | null
          full_name?: string
          full_name_ar?: string | null
          id?: string
          is_active?: boolean | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          nfc_pin_hash?: string | null
          parent_user_id?: string | null
          phone?: string | null
          profile_image?: string | null
          registered_students_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean
          platform: string
          token: string
          token_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform: string
          token: string
          token_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          token_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_actions: {
        Row: {
          created_at: string
          display_order: number
          href: string
          icon: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          href: string
          icon: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          href?: string
          icon?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          action_type: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          action_type?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      role_feature_visibility: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_visible: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_visible?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_visible?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          bus_id: string | null
          created_at: string | null
          end_time: string
          id: string
          route_name: string
          start_time: string
          status: string | null
          stops: Json | null
          updated_at: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          route_name: string
          start_time: string
          status?: string | null
          stops?: Json | null
          updated_at?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          route_name?: string
          start_time?: string
          status?: string | null
          stops?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          available: boolean | null
          category: string
          cost_price: number | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          image_url: string | null
          low_stock_alert: number | null
          name: string
          name_ar: string | null
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category: string
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          low_stock_alert?: number | null
          name: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category?: string
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          low_stock_alert?: number | null
          name?: string
          name_ar?: string | null
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          notes: string | null
          parent_id: string | null
          payment_method: string | null
          status: string | null
          student_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          notes?: string | null
          parent_id?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          parent_id?: string | null
          payment_method?: string | null
          status?: string | null
          student_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bus_assignments: {
        Row: {
          bus_id: string | null
          created_at: string | null
          dropoff_stop: string
          dropoff_time: string | null
          id: string
          is_active: boolean | null
          pickup_stop: string
          pickup_time: string | null
          route_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          dropoff_stop: string
          dropoff_time?: string | null
          id?: string
          is_active?: boolean | null
          pickup_stop: string
          pickup_time?: string | null
          route_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          dropoff_stop?: string
          dropoff_time?: string | null
          id?: string
          is_active?: boolean | null
          pickup_stop?: string
          pickup_time?: string | null
          route_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bus_assignments_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_bus_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_history: {
        Row: {
          action_type: string
          amount: number | null
          changed_at: string | null
          changed_by: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          payment_method: string | null
          student_fee_id: string | null
          student_id: string | null
          transaction_reference: string | null
        }
        Insert: {
          action_type: string
          amount?: number | null
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          payment_method?: string | null
          student_fee_id?: string | null
          student_id?: string | null
          transaction_reference?: string | null
        }
        Update: {
          action_type?: string
          amount?: number | null
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          payment_method?: string | null
          student_fee_id?: string | null
          student_id?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_history_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_year: string
          amount: number
          created_at: string | null
          discount_amount: number | null
          discount_reason: string | null
          due_date: string
          fee_type: string
          id: string
          installment_plan_id: string | null
          last_reminder_date: string | null
          late_fee_amount: number | null
          paid_amount: number | null
          reminder_sent_at: string | null
          status: string | null
          student_id: string | null
          term: string
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          amount: number
          created_at?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          due_date: string
          fee_type: string
          id?: string
          installment_plan_id?: string | null
          last_reminder_date?: string | null
          late_fee_amount?: number | null
          paid_amount?: number | null
          reminder_sent_at?: string | null
          status?: string | null
          student_id?: string | null
          term: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          amount?: number
          created_at?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          due_date?: string
          fee_type?: string
          id?: string
          installment_plan_id?: string | null
          last_reminder_date?: string | null
          late_fee_amount?: number | null
          paid_amount?: number | null
          reminder_sent_at?: string | null
          status?: string | null
          student_id?: string | null
          term?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year: string | null
          address: string | null
          allergies: string | null
          approval_status: string | null
          barcode: string | null
          blood_group: string | null
          bus_id: string | null
          canteen_agreement: boolean | null
          civil_id: string | null
          class: string | null
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_contact_name: string | null
          enrollment_date: string | null
          first_name: string | null
          first_name_ar: string | null
          gender: string | null
          grade: string | null
          home_area: string | null
          home_area_ar: string | null
          home_latitude: number | null
          home_longitude: number | null
          id: string
          last_name: string | null
          last_name_ar: string | null
          medical_agreement: boolean | null
          medical_conditions: string | null
          medical_info: string | null
          medications: string | null
          nationality: string | null
          nfc_id: string | null
          parent_email: string | null
          parent_id: string | null
          parent_name: string | null
          parent_name_ar: string | null
          parent_occupation: string | null
          parent_phone: string | null
          phone: string | null
          photo_agreement: boolean | null
          previous_school: string | null
          profile_id: string | null
          profile_image: string | null
          relationship: string | null
          status: string | null
          student_id: string
          submitted_at: string | null
          terms_agreement: boolean | null
          transportation_agreement: boolean | null
          uniform_agreement: boolean | null
          visible_to_parent: boolean | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          allergies?: string | null
          approval_status?: string | null
          barcode?: string | null
          blood_group?: string | null
          bus_id?: string | null
          canteen_agreement?: boolean | null
          civil_id?: string | null
          class?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          first_name_ar?: string | null
          gender?: string | null
          grade?: string | null
          home_area?: string | null
          home_area_ar?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id?: string
          last_name?: string | null
          last_name_ar?: string | null
          medical_agreement?: boolean | null
          medical_conditions?: string | null
          medical_info?: string | null
          medications?: string | null
          nationality?: string | null
          nfc_id?: string | null
          parent_email?: string | null
          parent_id?: string | null
          parent_name?: string | null
          parent_name_ar?: string | null
          parent_occupation?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_agreement?: boolean | null
          previous_school?: string | null
          profile_id?: string | null
          profile_image?: string | null
          relationship?: string | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
          terms_agreement?: boolean | null
          transportation_agreement?: boolean | null
          uniform_agreement?: boolean | null
          visible_to_parent?: boolean | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          allergies?: string | null
          approval_status?: string | null
          barcode?: string | null
          blood_group?: string | null
          bus_id?: string | null
          canteen_agreement?: boolean | null
          civil_id?: string | null
          class?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          first_name_ar?: string | null
          gender?: string | null
          grade?: string | null
          home_area?: string | null
          home_area_ar?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id?: string
          last_name?: string | null
          last_name_ar?: string | null
          medical_agreement?: boolean | null
          medical_conditions?: string | null
          medical_info?: string | null
          medications?: string | null
          nationality?: string | null
          nfc_id?: string | null
          parent_email?: string | null
          parent_id?: string | null
          parent_name?: string | null
          parent_name_ar?: string | null
          parent_occupation?: string | null
          parent_phone?: string | null
          phone?: string | null
          photo_agreement?: boolean | null
          previous_school?: string | null
          profile_id?: string | null
          profile_image?: string | null
          relationship?: string | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          terms_agreement?: boolean | null
          transportation_agreement?: boolean | null
          uniform_agreement?: boolean | null
          visible_to_parent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          bus_id: string | null
          created_at: string | null
          emergency_contact: string | null
          employee_id: string
          id: string
          phone: string | null
          profile_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          employee_id: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          employee_id?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendance: {
        Row: {
          check_in_method: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          location: string | null
          notes: string | null
          status: string
          teacher_id: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          status: string
          teacher_id: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          teacher_id?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          classes: string[] | null
          created_at: string | null
          employee_id: string
          experience_years: number | null
          id: string
          join_date: string | null
          nfc_id: string | null
          profile_id: string | null
          qualification: string | null
          subjects: string[] | null
        }
        Insert: {
          classes?: string[] | null
          created_at?: string | null
          employee_id: string
          experience_years?: number | null
          id?: string
          join_date?: string | null
          nfc_id?: string | null
          profile_id?: string | null
          qualification?: string | null
          subjects?: string[] | null
        }
        Update: {
          classes?: string[] | null
          created_at?: string | null
          employee_id?: string
          experience_years?: number | null
          id?: string
          join_date?: string | null
          nfc_id?: string | null
          profile_id?: string | null
          qualification?: string | null
          subjects?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_accounts: {
        Row: {
          created_at: string | null
          email: string
        }
        Insert: {
          created_at?: string | null
          email: string
        }
        Update: {
          created_at?: string | null
          email?: string
        }
        Relationships: []
      }
      transport_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          parent_id: string
          reason: string | null
          request_date: string
          request_type: string
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          parent_id: string
          reason?: string | null
          request_date: string
          request_type: string
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string
          reason?: string | null
          request_date?: string
          request_type?: string
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transport_routes: {
        Row: {
          bus_id: string | null
          created_at: string | null
          driver_id: string | null
          end_time: string
          id: string
          route_name: string
          start_time: string
          status: string | null
          stops: Json | null
          supervisor_id: string | null
          updated_at: string | null
        }
        Insert: {
          bus_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_time: string
          id?: string
          route_name: string
          start_time: string
          status?: string | null
          stops?: Json | null
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bus_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_time?: string
          id?: string
          route_name?: string
          start_time?: string
          status?: string | null
          stops?: Json | null
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          is_online: boolean | null
          last_seen: string | null
          typing_started_at: string | null
          typing_to: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_online?: boolean | null
          last_seen?: string | null
          typing_started_at?: string | null
          typing_to?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_online?: boolean | null
          last_seen?: string | null
          typing_started_at?: string | null
          typing_to?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quick_action_preferences: {
        Row: {
          created_at: string
          custom_order: number | null
          id: string
          is_visible: boolean
          quick_action_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_order?: number | null
          id?: string
          is_visible?: boolean
          quick_action_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_order?: number | null
          id?: string
          is_visible?: boolean
          quick_action_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quick_action_preferences_quick_action_id_fkey"
            columns: ["quick_action_id"]
            isOneToOne: false
            referencedRelation: "quick_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance: number
          currency: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          from_user_id: string
          id: string
          notes: string | null
          reference_number: string | null
          status: string
          to_user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          from_user_id: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          from_user_id?: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "available_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_contacts: {
        Row: {
          email: string | null
          full_name: string | null
          full_name_ar: string | null
          id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          student_class: string | null
          teacher_id: string | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          failed_notifications: number | null
          pending_notifications: number | null
          today_attendance: number | null
          today_bus_activity: number | null
          total_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_friend_request: { Args: { request_id: string }; Returns: boolean }
      calculate_employee_salary: {
        Args: {
          p_employee_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          absent_days: number
          base_salary: number
          bonuses: number
          deductions: number
          leave_days: number
          net_salary: number
          overtime_hours: number
          present_days: number
          total_hours: number
          working_days: number
        }[]
      }
      calculate_teacher_salary: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_teacher_id: string
        }
        Returns: {
          absent_days: number
          base_salary: number
          bonuses: number
          deductions: number
          leave_days: number
          net_salary: number
          overtime_hours: number
          present_days: number
          total_hours: number
          working_days: number
        }[]
      }
      calculate_total_billing: {
        Args: never
        Returns: {
          next_billing_date: string
          total_active_users: number
          total_amount: number
        }[]
      }
      can_message: {
        Args: { recipient_id: string; sender_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_requests?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      create_auth_user: {
        Args: { p_email: string; p_metadata?: Json; p_password: string }
        Returns: string
      }
      generate_employee_id: {
        Args: { p_position: Database["public"]["Enums"]["employee_position"] }
        Returns: string
      }
      generate_nfc_id: {
        Args: { p_position: Database["public"]["Enums"]["employee_position"] }
        Returns: string
      }
      generate_transaction_number: { Args: never; Returns: string }
      get_default_notifications_by_role: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: Database["public"]["Enums"]["notification_type"][]
      }
      get_notification_queue_stats: {
        Args: never
        Returns: {
          failed_count: number
          pending_count: number
          processing_count: number
          sent_today: number
        }[]
      }
      get_or_create_conversation: {
        Args: { other_student_id: string }
        Returns: string
      }
      get_student_by_nfc: {
        Args: { p_nfc_id: string }
        Returns: {
          class: string
          first_name: string
          first_name_ar: string
          id: string
          last_name: string
          last_name_ar: string
          nfc_id: string
          parent_id: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      has_any_role: {
        Args: { required_roles: string[]; user_id: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      insert_profile_with_parent: {
        Args: {
          p_email: string
          p_full_name: string
          p_id: string
          p_linked_entity_id?: string
          p_linked_entity_type?: string
          p_parent_user_id?: string
          p_phone?: string
          p_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      is_group_admin: {
        Args: { p_group_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_test_account: { Args: { user_email: string }; Returns: boolean }
      process_fee_payment: {
        Args: {
          p_amount: number
          p_fee_id: string
          p_payment_method: string
          p_transaction_reference?: string
        }
        Returns: {
          amount: number
          created_at: string | null
          created_by: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          fee_id: string | null
          id: string
          notes: string | null
          parent_id: string | null
          payment_date: string | null
          payment_method: string
          receipt_number: string | null
          receipt_url: string | null
          transaction_reference: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payment_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_fee_payment_from_wallet: {
        Args: { p_amount: number; p_fee_id: string }
        Returns: Json
      }
      process_salary_payment: {
        Args: { p_payroll_record_id: string }
        Returns: boolean
      }
      process_wallet_transfer: {
        Args: { p_amount: number; p_notes?: string; p_to_user_id: string }
        Returns: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          from_user_id: string
          id: string
          notes: string | null
          reference_number: string | null
          status: string
          to_user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      queue_parent_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_parent_id: string
          p_student_id: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      record_attendance_atomic: {
        Args: {
          p_date: string
          p_device_id: string
          p_location: string
          p_manual_entry?: boolean
          p_nfc_verified?: boolean
          p_student_id: string
          p_time: string
          p_type: string
        }
        Returns: {
          already_exists: boolean
          attendance_id: string
          error_message: string
          success: boolean
        }[]
      }
      record_bus_boarding_atomic: {
        Args: {
          p_action: string
          p_bus_id: string
          p_latitude?: number
          p_location: string
          p_longitude?: number
          p_manual_entry?: boolean
          p_manual_entry_by?: string
          p_nfc_verified?: boolean
          p_student_id: string
        }
        Returns: {
          already_exists: boolean
          boarding_id: string
          error_message: string
          success: boolean
        }[]
      }
      reset_test_account_data: {
        Args: { test_user_id: string }
        Returns: undefined
      }
      unstick_notifications: { Args: never; Returns: number }
      update_profile_parent: {
        Args: { p_parent_user_id: string; p_profile_id: string }
        Returns: undefined
      }
      user_can_access_conversation: {
        Args: { conv_id: string }
        Returns: boolean
      }
    }
    Enums: {
      employee_position:
        | "teacher"
        | "bus_driver"
        | "manager"
        | "cleaner"
        | "secretary"
        | "accountant"
        | "nurse"
        | "security"
        | "cafeteria_staff"
        | "maintenance"
        | "other"
      notification_type:
        | "system_announcements"
        | "maintenance_alerts"
        | "grade_updates"
        | "homework_assigned"
        | "exam_schedule"
        | "attendance_alerts"
        | "bus_arrival"
        | "canteen_orders"
        | "wallet_transactions"
        | "child_attendance"
        | "child_grades"
        | "child_homework"
        | "child_bus_location"
        | "payment_reminders"
        | "school_announcements"
        | "class_assignments"
        | "student_submissions"
        | "parent_messages"
        | "schedule_changes"
        | "leave_approvals"
        | "payroll_updates"
        | "user_registrations"
        | "system_errors"
        | "payment_received"
        | "leave_requests"
        | "bus_issues"
        | "security_alerts"
        | "route_changes"
        | "student_pickup"
        | "emergency_alerts"
        | "vehicle_maintenance"
        | "bus_boarding"
        | "bus_exit"
      user_role:
        | "admin"
        | "teacher"
        | "parent"
        | "student"
        | "driver"
        | "developer"
        | "finance"
        | "canteen"
        | "school_attendance"
        | "bus_attendance"
        | "supervisor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      employee_position: [
        "teacher",
        "bus_driver",
        "manager",
        "cleaner",
        "secretary",
        "accountant",
        "nurse",
        "security",
        "cafeteria_staff",
        "maintenance",
        "other",
      ],
      notification_type: [
        "system_announcements",
        "maintenance_alerts",
        "grade_updates",
        "homework_assigned",
        "exam_schedule",
        "attendance_alerts",
        "bus_arrival",
        "canteen_orders",
        "wallet_transactions",
        "child_attendance",
        "child_grades",
        "child_homework",
        "child_bus_location",
        "payment_reminders",
        "school_announcements",
        "class_assignments",
        "student_submissions",
        "parent_messages",
        "schedule_changes",
        "leave_approvals",
        "payroll_updates",
        "user_registrations",
        "system_errors",
        "payment_received",
        "leave_requests",
        "bus_issues",
        "security_alerts",
        "route_changes",
        "student_pickup",
        "emergency_alerts",
        "vehicle_maintenance",
        "bus_boarding",
        "bus_exit",
      ],
      user_role: [
        "admin",
        "teacher",
        "parent",
        "student",
        "driver",
        "developer",
        "finance",
        "canteen",
        "school_attendance",
        "bus_attendance",
        "supervisor",
      ],
    },
  },
} as const
