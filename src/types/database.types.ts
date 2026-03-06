export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.4"
    }
    public: {
        Tables: {
            addresses: {
                Row: {
                    city: string
                    complement: string | null
                    created_at: string
                    id: string
                    is_default: boolean
                    name: string
                    neighborhood: string | null
                    number: string
                    phone: string | null
                    state: string
                    street: string
                    user_id: string | null
                    zip_code: string
                }
                Insert: {
                    city: string
                    complement?: string | null
                    created_at?: string
                    id?: string
                    is_default?: boolean
                    name: string
                    neighborhood?: string | null
                    number: string
                    phone?: string | null
                    state: string
                    street: string
                    user_id?: string | null
                    zip_code: string
                }
                Update: {
                    city?: string
                    complement?: string | null
                    created_at?: string
                    id?: string
                    is_default?: boolean
                    name?: string
                    neighborhood?: string | null
                    number?: string
                    phone?: string | null
                    state?: string
                    street?: string
                    user_id?: string | null
                    zip_code?: string
                }
                Relationships: []
            }
            brands: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    is_active: boolean
                    logo_url: string | null
                    name: string
                    slug: string
                    sort_order: number
                    updated_at: string
                    website: string | null
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    logo_url?: string | null
                    name: string
                    slug: string
                    sort_order?: number
                    updated_at?: string
                    website?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    sort_order?: number
                    updated_at?: string
                    website?: string | null
                }
                Relationships: []
            }
            categories: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    image_url: string | null
                    is_active: boolean
                    name: string
                    slug: string
                    sort_order: number
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean
                    name: string
                    slug: string
                    sort_order?: number
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean
                    name?: string
                    slug?: string
                    sort_order?: number
                    updated_at?: string
                }
                Relationships: []
            }
            collections: {
                Row: {
                    banner_url: string | null
                    created_at: string
                    description: string | null
                    id: string
                    is_active: boolean
                    name: string
                    slug: string
                    sort_order: number
                    updated_at: string
                }
                Insert: {
                    banner_url?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    name: string
                    slug: string
                    sort_order?: number
                    updated_at?: string
                }
                Update: {
                    banner_url?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    name?: string
                    slug?: string
                    sort_order?: number
                    updated_at?: string
                }
                Relationships: []
            }
            coupons: {
                Row: {
                    code: string
                    created_at: string
                    description: string | null
                    discount_type: string
                    discount_value: number
                    expires_at: string | null
                    id: string
                    is_active: boolean
                    max_uses: number | null
                    min_order_value: number | null
                    uses_count: number
                }
                Insert: {
                    code: string
                    created_at?: string
                    description?: string | null
                    discount_type?: string
                    discount_value: number
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    max_uses?: number | null
                    min_order_value?: number | null
                    uses_count?: number
                }
                Update: {
                    code?: string
                    created_at?: string
                    description?: string | null
                    discount_type?: string
                    discount_value?: number
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    max_uses?: number | null
                    min_order_value?: number | null
                    uses_count?: number
                }
                Relationships: []
            }
            order_items: {
                Row: {
                    created_at: string
                    id: string
                    order_id: string
                    quantity: number
                    total_price: number
                    unit_price: number
                    variant_id: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    order_id: string
                    quantity?: number
                    total_price: number
                    unit_price: number
                    variant_id?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    order_id?: string
                    quantity?: number
                    total_price?: number
                    unit_price?: number
                    variant_id?: string | null
                }
                Relationships: [
                    { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
                    { foreignKeyName: "order_items_variant_id_fkey"; columns: ["variant_id"]; isOneToOne: false; referencedRelation: "product_variants"; referencedColumns: ["id"] },
                ]
            }
            orders: {
                Row: {
                    address_id: string | null
                    created_at: string
                    discount: number
                    id: string
                    mp_payment_id: string | null
                    mp_preference_id: string | null
                    notes: string | null
                    shipping_cost: number
                    status: string
                    subtotal: number
                    total: number
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    address_id?: string | null
                    created_at?: string
                    discount?: number
                    id?: string
                    mp_payment_id?: string | null
                    mp_preference_id?: string | null
                    notes?: string | null
                    shipping_cost?: number
                    status?: string
                    subtotal?: number
                    total?: number
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    address_id?: string | null
                    created_at?: string
                    discount?: number
                    id?: string
                    mp_payment_id?: string | null
                    mp_preference_id?: string | null
                    notes?: string | null
                    shipping_cost?: number
                    status?: string
                    subtotal?: number
                    total?: number
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: [
                    { foreignKeyName: "orders_address_id_fkey"; columns: ["address_id"]; isOneToOne: false; referencedRelation: "addresses"; referencedColumns: ["id"] },
                ]
            }
            payment_transactions: {
                Row: {
                    amount: number
                    created_at: string
                    id: string
                    method: string | null
                    mp_payment_id: string | null
                    order_id: string
                    raw_data: Json | null
                    status: string
                }
                Insert: {
                    amount: number
                    created_at?: string
                    id?: string
                    method?: string | null
                    mp_payment_id?: string | null
                    order_id: string
                    raw_data?: Json | null
                    status?: string
                }
                Update: {
                    amount?: number
                    created_at?: string
                    id?: string
                    method?: string | null
                    mp_payment_id?: string | null
                    order_id?: string
                    raw_data?: Json | null
                    status?: string
                }
                Relationships: [
                    { foreignKeyName: "payment_transactions_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
                ]
            }
            product_images: {
                Row: {
                    alt: string | null
                    created_at: string
                    id: string
                    is_primary: boolean
                    product_id: string
                    sort_order: number
                    url: string
                }
                Insert: {
                    alt?: string | null
                    created_at?: string
                    id?: string
                    is_primary?: boolean
                    product_id: string
                    sort_order?: number
                    url: string
                }
                Update: {
                    alt?: string | null
                    created_at?: string
                    id?: string
                    is_primary?: boolean
                    product_id?: string
                    sort_order?: number
                    url?: string
                }
                Relationships: [
                    { foreignKeyName: "product_images_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
                ]
            }
            product_variants: {
                Row: {
                    color_hex: string | null
                    color_name: string | null
                    created_at: string
                    id: string
                    is_active: boolean
                    price: number | null
                    product_id: string
                    size: string | null
                    sku: string | null
                    stock: number
                }
                Insert: {
                    color_hex?: string | null
                    color_name?: string | null
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    price?: number | null
                    product_id: string
                    size?: string | null
                    sku?: string | null
                    stock?: number
                }
                Update: {
                    color_hex?: string | null
                    color_name?: string | null
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    price?: number | null
                    product_id?: string
                    size?: string | null
                    sku?: string | null
                    stock?: number
                }
                Relationships: [
                    { foreignKeyName: "product_variants_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
                ]
            }
            products: {
                Row: {
                    brand_id: string | null
                    category_id: string | null
                    collection: string | null
                    compare_price: number | null
                    created_at: string
                    description: string | null
                    id: string
                    is_active: boolean
                    is_featured: boolean
                    meta_description: string | null
                    meta_title: string | null
                    name: string
                    price: number
                    sku: string | null
                    slug: string
                    tags: string[] | null
                    updated_at: string
                }
                Insert: {
                    brand_id?: string | null
                    category_id?: string | null
                    collection?: string | null
                    compare_price?: number | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    is_featured?: boolean
                    meta_description?: string | null
                    meta_title?: string | null
                    name: string
                    price: number
                    sku?: string | null
                    slug: string
                    tags?: string[] | null
                    updated_at?: string
                }
                Update: {
                    brand_id?: string | null
                    category_id?: string | null
                    collection?: string | null
                    compare_price?: number | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_active?: boolean
                    is_featured?: boolean
                    meta_description?: string | null
                    meta_title?: string | null
                    name?: string
                    price?: number
                    sku?: string | null
                    slug?: string
                    tags?: string[] | null
                    updated_at?: string
                }
                Relationships: [
                    { foreignKeyName: "products_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
                    { foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
                ]
            }
            profiles: {
                Row: {
                    cpf: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    phone: string | null
                    role: string
                    updated_at: string
                }
                Insert: {
                    cpf?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    phone?: string | null
                    role?: string
                    updated_at?: string
                }
                Update: {
                    cpf?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    role?: string
                    updated_at?: string
                }
                Relationships: []
            }
            shipments: {
                Row: {
                    carrier: string | null
                    created_at: string
                    delivered_at: string | null
                    id: string
                    order_id: string
                    shipped_at: string | null
                    status: string
                    tracking_code: string | null
                }
                Insert: {
                    carrier?: string | null
                    created_at?: string
                    delivered_at?: string | null
                    id?: string
                    order_id: string
                    shipped_at?: string | null
                    status?: string
                    tracking_code?: string | null
                }
                Update: {
                    carrier?: string | null
                    created_at?: string
                    delivered_at?: string | null
                    id?: string
                    order_id?: string
                    shipped_at?: string | null
                    status?: string
                    tracking_code?: string | null
                }
                Relationships: [
                    { foreignKeyName: "shipments_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
                ]
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { [_ in never]: never }
        CompositeTypes: { [_ in never]: never }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
    ? U
    : never
    : never

export const Constants = {
    public: { Enums: {} },
} as const
