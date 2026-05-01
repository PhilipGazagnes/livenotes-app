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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      artists_v2: {
        Row: {
          bio: string | null
          created_at: string | null
          created_by: string
          external_links: Json | null
          fingerprint: string | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          merge_reason: string | null
          merged_into_id: string | null
          name: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          created_by: string
          external_links?: Json | null
          fingerprint?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          merge_reason?: string | null
          merged_into_id?: string | null
          name: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          created_by?: string
          external_links?: Json | null
          fingerprint?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          merge_reason?: string | null
          merged_into_id?: string | null
          name?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_v2_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "artists_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      library_song_tags: {
        Row: {
          created_at: string | null
          id: string
          library_song_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          library_song_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          library_song_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_song_tags_library_song_id_fkey"
            columns: ["library_song_id"]
            isOneToOne: false
            referencedRelation: "library_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_song_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      library_songs: {
        Row: {
          added_at: string | null
          added_by: string
          custom_notes: string | null
          custom_title: string | null
          id: string
          project_id: string
          song_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          custom_notes?: string | null
          custom_title?: string | null
          id?: string
          project_id: string
          song_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          custom_notes?: string | null
          custom_title?: string | null
          id?: string
          project_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_songs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          added_at: string | null
          id: string
          library_song_id: string | null
          list_annotations: string | null
          list_id: string
          note_id: string | null
          position: number
          song_id: string | null
          title: string | null
          type: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          library_song_id?: string | null
          list_annotations?: string | null
          list_id: string
          note_id?: string | null
          position: number
          song_id?: string | null
          title?: string | null
          type?: string
        }
        Update: {
          added_at?: string | null
          id?: string
          library_song_id?: string | null
          list_annotations?: string | null
          list_id?: string
          note_id?: string | null
          position?: number
          song_id?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_library_song_id_fkey"
            columns: ["library_song_id"]
            isOneToOne: false
            referencedRelation: "library_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string
          data: Json | null
          display_order: number | null
          id: string
          is_public: boolean | null
          is_shareable: boolean | null
          library_song_id: string
          share_token: string | null
          title: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by: string
          data?: Json | null
          display_order?: number | null
          id?: string
          is_public?: boolean | null
          is_shareable?: boolean | null
          library_song_id: string
          share_token?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string
          data?: Json | null
          display_order?: number | null
          id?: string
          is_public?: boolean | null
          is_shareable?: boolean | null
          library_song_id?: string
          share_token?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_library_song_id_fkey"
            columns: ["library_song_id"]
            isOneToOne: false
            referencedRelation: "library_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes_field_enabled: boolean | null
          notes_field_label: string | null
          owner_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes_field_enabled?: boolean | null
          notes_field_label?: string | null
          owner_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes_field_enabled?: boolean | null
          notes_field_label?: string | null
          owner_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      song_artists: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          position: number
          song_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          position: number
          song_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          position?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_artists_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_artists_v2: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          position: number
          song_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          position: number
          song_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          position?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_artists_v2_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_artists_v2_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      song_tags: {
        Row: {
          created_at: string | null
          id: string
          song_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          song_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          song_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tags_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      songcode: {
        Row: {
          created_at: string | null
          livenotes_json: Json | null
          livenotes_json_updated_at: string | null
          livenotes_json_updated_by: string | null
          song_id: string
          songcode: string | null
          songcode_updated_at: string | null
          songcode_updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          livenotes_json?: Json | null
          livenotes_json_updated_at?: string | null
          livenotes_json_updated_by?: string | null
          song_id: string
          songcode?: string | null
          songcode_updated_at?: string | null
          songcode_updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          livenotes_json?: Json | null
          livenotes_json_updated_at?: string | null
          livenotes_json_updated_by?: string | null
          song_id?: string
          songcode?: string | null
          songcode_updated_at?: string | null
          songcode_updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songcode_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: true
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string | null
          created_at: string | null
          created_by: string | null
          id: string
          livenotes_poc_id: string | null
          notes: string | null
          project_id: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          livenotes_poc_id?: string | null
          notes?: string | null
          project_id: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          livenotes_poc_id?: string | null
          notes?: string | null
          project_id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      songs_v2: {
        Row: {
          created_at: string | null
          created_by: string
          fingerprint: string | null
          id: string
          is_verified: boolean | null
          merge_reason: string | null
          merged_into_id: string | null
          popularity_score: number | null
          title: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          fingerprint?: string | null
          id?: string
          is_verified?: boolean | null
          merge_reason?: string | null
          merged_into_id?: string | null
          popularity_score?: number | null
          title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          fingerprint?: string | null
          id?: string
          is_verified?: boolean | null
          merge_reason?: string | null
          merged_into_id?: string | null
          popularity_score?: number | null
          title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_v2_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "songs_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      immutable_unaccent: { Args: { "": string }; Returns: string }
      increment_song_popularity: {
        Args: { song_id: string }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_list_item_positions: {
        Args: { item_positions: Json }
        Returns: undefined
      }
    }
    Enums: {
      note_type:
        | "songcode"
        | "plain_text"
        | "youtube"
        | "image"
        | "video"
        | "audio"
        | "tablature"
        | "looper_notes"
        | "lyrics"
        | "chords"
        | "looper"
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
      note_type: [
        "songcode",
        "plain_text",
        "youtube",
        "image",
        "video",
        "audio",
        "tablature",
        "looper_notes",
        "lyrics",
        "chords",
        "looper",
      ],
    },
  },
} as const
