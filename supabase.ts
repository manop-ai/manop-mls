import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Property = {
  id:            string
  property_type: string | null
  bedrooms:      number | null
  bathrooms:     number | null
  city:          string | null
  neighborhood:  string | null
  country_code:  string | null
  address_local: string | null
  price_local:   number | null
  price_usd:     number | null
  currency_code: string | null
  listing_type:  string | null
  tenure_type:   string | null
  title_status:  string | null
  size_sqm:      number | null
  investment_score:       number | null
  estimated_yield_pct:    number | null
  diaspora_appeal_score:  number | null
  risk_flags:    string[] | null
  created_at:    string | null
  raw_data:      Record<string, unknown> | null
}

export async function getListings(city?: string, limit = 20): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (city && city !== 'all') {
    query = query.ilike('city', `%${city}%`)
  }

  const { data, error } = await query
  if (error) { console.error('getListings error:', error); return [] }
  return (data as Property[]) || []
}

export async function getListing(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('getListing error:', error); return null }
  return data as Property
}

export async function getStats() {
  const { count: totalListings } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })

  const { data: cities } = await supabase
    .from('properties')
    .select('city')

  const { data: agents } = await supabase
    .from('agent_leads')
    .select('id', { count: 'exact', head: true })

  const uniqueCities = new Set((cities || []).map((r: {city: string | null}) => r.city).filter(Boolean)).size

  return {
    totalListings: totalListings || 0,
    uniqueCities,
    totalAgents: agents || 0,
  }
}
