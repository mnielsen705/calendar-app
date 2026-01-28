export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      calendars: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          calendar_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          all_day: boolean;
          location: string | null;
          is_recurring: boolean;
          rrule: string | null;
          recurring_event_id: string | null;
          is_exception: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          location?: string | null;
          is_recurring?: boolean;
          rrule?: string | null;
          recurring_event_id?: string | null;
          is_exception?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          calendar_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          all_day?: boolean;
          location?: string | null;
          is_recurring?: boolean;
          rrule?: string | null;
          recurring_event_id?: string | null;
          is_exception?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_shares: {
        Row: {
          id: string;
          calendar_id: string;
          shared_with_user_id: string;
          permission: 'view' | 'edit';
          created_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          shared_with_user_id: string;
          permission: 'view' | 'edit';
          created_at?: string;
        };
        Update: {
          id?: string;
          calendar_id?: string;
          shared_with_user_id?: string;
          permission?: 'view' | 'edit';
          created_at?: string;
        };
      };
      share_invitations: {
        Row: {
          id: string;
          calendar_id: string;
          invited_email: string;
          permission: 'view' | 'edit';
          invited_by: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          invited_email: string;
          permission: 'view' | 'edit';
          invited_by: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          calendar_id?: string;
          invited_email?: string;
          permission?: 'view' | 'edit';
          invited_by?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type Calendar = Database['public']['Tables']['calendars']['Row'];
export type CalendarInsert = Database['public']['Tables']['calendars']['Insert'];
export type CalendarUpdate = Database['public']['Tables']['calendars']['Update'];

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type CalendarShare = Database['public']['Tables']['calendar_shares']['Row'];
export type CalendarShareInsert = Database['public']['Tables']['calendar_shares']['Insert'];

export type ShareInvitation = Database['public']['Tables']['share_invitations']['Row'];
export type ShareInvitationInsert = Database['public']['Tables']['share_invitations']['Insert'];

// Extended types for UI
export interface CalendarWithPermission extends Calendar {
  permission?: 'owner' | 'view' | 'edit';
}

export interface EventWithCalendar extends Event {
  calendar?: Calendar;
}
