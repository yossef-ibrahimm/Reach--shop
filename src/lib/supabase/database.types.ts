
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "brands": {
                  Row: {
                    "id": string,"logo_url": string | null,"name_ar": string,"name_en": string,"slug": string,"sort_order": number
                  }
                  Insert: {
                    "id"?: string,"logo_url"?: string | null,"name_ar": string,"name_en": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: string,"logo_url"?: string | null,"name_ar"?: string,"name_en"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "id": string,"name_ar": string,"name_en": string,"slug": string,"sort_order": number
                  }
                  Insert: {
                    "id"?: string,"name_ar": string,"name_en": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: string,"name_ar"?: string,"name_en"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"certificates": {
                  Row: {
                    "id": string,"image_url": string,"is_active": boolean,"issued_at": string | null,"issuer_ar": string | null,"issuer_en": string | null,"sort_order": number,"storage_path": string,"title_ar": string,"title_en": string
                  }
                  Insert: {
                    "id"?: string,"image_url": string,"is_active"?: boolean,"issued_at"?: string | null,"issuer_ar"?: string | null,"issuer_en"?: string | null,"sort_order"?: number,"storage_path": string,"title_ar": string,"title_en": string
                  }
                  Update: {
                    "id"?: string,"image_url"?: string,"is_active"?: boolean,"issued_at"?: string | null,"issuer_ar"?: string | null,"issuer_en"?: string | null,"sort_order"?: number,"storage_path"?: string,"title_ar"?: string,"title_en"?: string
                  }
                  Relationships: [
                    
                  ]
                },"contact_numbers": {
                  Row: {
                    "id": string,"is_active": boolean,"is_whatsapp": boolean,"label_ar": string,"label_en": string,"number": string,"sort_order": number
                  }
                  Insert: {
                    "id"?: string,"is_active"?: boolean,"is_whatsapp"?: boolean,"label_ar": string,"label_en": string,"number": string,"sort_order"?: number
                  }
                  Update: {
                    "id"?: string,"is_active"?: boolean,"is_whatsapp"?: boolean,"label_ar"?: string,"label_en"?: string,"number"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"product_images": {
                  Row: {
                    "alt_ar": string | null,"alt_en": string | null,"id": string,"product_id": string,"sort_order": number,"storage_path": string,"thumb_url": string | null,"url": string
                  }
                  Insert: {
                    "alt_ar"?: string | null,"alt_en"?: string | null,"id"?: string,"product_id": string,"sort_order"?: number,"storage_path": string,"thumb_url"?: string | null,"url": string
                  }
                  Update: {
                    "alt_ar"?: string | null,"alt_en"?: string | null,"id"?: string,"product_id"?: string,"sort_order"?: number,"storage_path"?: string,"thumb_url"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "availability": string,"brand_id": string | null,"catalog_ar_url": string | null,"catalog_en_url": string | null,"category_id": string,"created_at": string,"description_ar": string | null,"description_en": string | null,"id": string,"is_featured": boolean,"is_published": boolean,"name_ar": string,"name_en": string,"search_keywords": string | null,"series_id": string | null,"slug": string,"sort_order": number,"specs": NonNullable<Json>,"system_type": string | null,"updated_at": string
                  }
                  Insert: {
                    "availability"?: string,"brand_id"?: string | null,"catalog_ar_url"?: string | null,"catalog_en_url"?: string | null,"category_id": string,"created_at"?: string,"description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"name_ar": string,"name_en": string,"search_keywords"?: string | null,"series_id"?: string | null,"slug": string,"sort_order"?: number,"specs"?: NonNullable<Json>,"system_type"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "availability"?: string,"brand_id"?: string | null,"catalog_ar_url"?: string | null,"catalog_en_url"?: string | null,"category_id"?: string,"created_at"?: string,"description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"name_ar"?: string,"name_en"?: string,"search_keywords"?: string | null,"series_id"?: string | null,"slug"?: string,"sort_order"?: number,"specs"?: NonNullable<Json>,"system_type"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_series_id_fkey"
      columns: ["series_id"]
isOneToOne: false
      referencedRelation: "series"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "description_ar": string | null,"description_en": string | null,"id": string,"image_url": string | null,"is_active": boolean,"sort_order": number,"storage_path": string | null,"title_ar": string,"title_en": string
                  }
                  Insert: {
                    "description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"sort_order"?: number,"storage_path"?: string | null,"title_ar": string,"title_en": string
                  }
                  Update: {
                    "description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"sort_order"?: number,"storage_path"?: string | null,"title_ar"?: string,"title_en"?: string
                  }
                  Relationships: [
                    
                  ]
                },"series": {
                  Row: {
                    "id": string,"name_ar": string,"name_en": string,"slug": string
                  }
                  Insert: {
                    "id"?: string,"name_ar": string,"name_en": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name_ar"?: string,"name_en"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "key": string,"value_ar": string | null,"value_en": string | null
                  }
                  Insert: {
                    "key": string,"value_ar"?: string | null,"value_en"?: string | null
                  }
                  Update: {
                    "key"?: string,"value_ar"?: string | null,"value_en"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"social_links": {
                  Row: {
                    "id": string,"is_active": boolean,"platform": string,"sort_order": number,"url": string
                  }
                  Insert: {
                    "id"?: string,"is_active"?: boolean,"platform": string,"sort_order"?: number,"url": string
                  }
                  Update: {
                    "id"?: string,"is_active"?: boolean,"platform"?: string,"sort_order"?: number,"url"?: string
                  }
                  Relationships: [
                    
                  ]
                },"spec_definitions": {
                  Row: {
                    "category_id": string,"id": string,"is_filterable": boolean,"key": string,"label_ar": string,"label_en": string,"options": Json | null,"sort_order": number,"unit": string | null,"value_type": string
                  }
                  Insert: {
                    "category_id": string,"id"?: string,"is_filterable"?: boolean,"key": string,"label_ar": string,"label_en": string,"options"?: Json | null,"sort_order"?: number,"unit"?: string | null,"value_type": string
                  }
                  Update: {
                    "category_id"?: string,"id"?: string,"is_filterable"?: boolean,"key"?: string,"label_ar"?: string,"label_en"?: string,"options"?: Json | null,"sort_order"?: number,"unit"?: string | null,"value_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spec_definitions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
