import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type Property = {
  id:             string
  property_type:  string | null
  bedrooms:       number | null
  bathrooms:      number | null
  neighborhood:   string | null
  city:           string | null
  price_local:    number | null
  currency_code:  string | null
  listing_type:   string | null
  title_status:   string | null
  agent_phone:    string | null
  investment_score:    number | null
  estimated_yield_pct: number | null
  created_at:     string | null
  raw_data:       Record<string, unknown> | null
}

function fmt(price: number | null, currency: string | null) {
  if (!price) return 'Price on request'
  const c = currency || 'NGN'
  if (c === 'NGN') {
    if (price >= 1_000_000) return '\u20A6' + (price / 1_000_000).toFixed(1) + 'M'
    return '\u20A6' + (price / 1_000).toFixed(0) + 'K'
  }
  if (c === 'GHS') return 'GH\u20B5' + (price / 1_000).toFixed(0) + 'K'
  if (c === 'KES') return 'KSh' + (price / 1_000_000).toFixed(1) + 'M'
  return '$' + (price / 1_000).toFixed(0) + 'K'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return days + ' days ago'
  if (days < 30) return Math.floor(days / 7) + ' weeks ago'
  return Math.floor(days / 30) + ' months ago'
}

function listingLabel(type: string | null): string {
  if (!type) return 'For Sale'
  const map: Record<string, string> = {
    'for-sale':  'For Sale',
    'for-rent':  'For Rent',
    'short-let': 'Short Let',
    'off-plan':  'Off Plan',
  }
  return map[type] || type
}

async function getAgentListings(phone: string): Promise<Property[]> {
  const cleaned = decodeURIComponent(phone)

  const formats = [
    cleaned,
    '+' + cleaned,
    '0' + cleaned.slice(-10),
    cleaned.replace(/^234/, '0'),
    '234' + cleaned.slice(-10),
  ].filter(Boolean)

  const orFilter = formats.map(f => 'agent_phone.eq.' + f).join(',')

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('getAgentListings error:', error)
    return []
  }
  return (data as Property[]) || []
}

export default async function AgentPage({ params }: { params: { phone: string } }) {
  const phone    = decodeURIComponent(params.phone)
  const listings = await getAgentListings(phone)

  const displayPhone = phone.startsWith('+') ? phone : '+' + phone

  if (listings.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏠</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--earth)', marginBottom: '0.75rem' }}>
          No listings yet
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 360, lineHeight: 1.6 }}>
          Send a property listing to our WhatsApp number to get your portfolio page.
        </p>
        <Link href="/listings" style={{
          marginTop: '1.5rem', padding: '0.6rem 1.4rem',
          background: 'var(--clay)', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem',
        }}>
          Browse all listings
        </Link>
      </div>
    )
  }

  const forSale = listings.filter(l => l.listing_type === 'for-sale')
  const forRent = listings.filter(l => l.listing_type === 'for-rent' || l.listing_type === 'short-let')
  const areas   = Array.from(new Set(listings.map(l => l.neighborhood).filter(Boolean))) as string[]
  const lastSeen = timeAgo(listings[0]?.created_at || null)

  return (
    <div style={{ minHeight: '100vh' }}>
      <section style={{
        background: 'var(--earth)',
        padding: '3rem 1.5rem 2rem', color: '#fff',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/listings" style={{
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            fontSize: '0.85rem', display: 'inline-block', marginBottom: '1.5rem',
          }}>
            Back to listings
          </Link>

          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', marginBottom: '1rem',
          }}>
            🏡
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Lagos Agent
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
            {displayPhone} · Last active {lastSeen}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total listings', value: listings.length },
              { label: 'For sale',       value: forSale.length  },
              { label: 'For rent',       value: forRent.length  },
              { label: 'Areas covered',  value: areas.length    },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '0.75rem 1.25rem', minWidth: 100,
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.25rem' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {areas.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {areas.slice(0, 8).map(area => (
                <span key={area} style={{
                  background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                  padding: '0.25rem 0.75rem', fontSize: '0.8rem',
                }}>
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--earth)' }}>
            All Listings ({listings.length})
          </h2>
          <a
            href={'https://wa.me/' + displayPhone.replace('+', '')}
            target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#25D366', color: '#fff',
              padding: '0.5rem 1rem', borderRadius: 8,
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            Contact agent
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {listings.map(p => {
            const location = [p.neighborhood, p.city].filter(Boolean).join(', ')
            return (
              <Link key={p.id} href={'/listing/' + p.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '1.25rem', cursor: 'pointer',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      background: p.listing_type === 'for-rent' || p.listing_type === 'short-let'
                        ? '#E8F5E9' : '#FFF8E1',
                      color: p.listing_type === 'for-rent' || p.listing_type === 'short-let'
                        ? '#2E7D32' : '#F57F17',
                      fontSize: '0.72rem', fontWeight: 600,
                      padding: '0.2rem 0.6rem', borderRadius: 20,
                    }}>
                      {listingLabel(p.listing_type)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      {timeAgo(p.created_at)}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1rem', fontWeight: 600,
                    color: 'var(--earth)', marginBottom: '0.35rem', lineHeight: 1.3,
                  }}>
                    {p.bedrooms ? p.bedrooms + '-Bed ' : ''}
                    {p.property_type || 'Property'}
                  </h3>

                  {location && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                      {location}
                    </p>
                  )}

                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--earth)' }}>
                    {fmt(p.price_local, p.currency_code)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{
          marginTop: '2.5rem', padding: '1.5rem',
          background: '#faf6f0', borderRadius: 12,
          border: '1px solid var(--border)', textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--earth)', marginBottom: '0.5rem' }}>
            Are you this agent?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Share this page as your personal property portfolio.
            Send more listings via WhatsApp to add them here automatically.
          </p>
          <button
            id="copy-btn"
            style={{
              background: 'var(--clay)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.6rem 1.4rem',
              fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Copy your portfolio link
          </button>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `
        var btn = document.getElementById('copy-btn');
        if (btn) {
          btn.addEventListener('click', function() {
            navigator.clipboard.writeText(window.location.href).then(function() {
              btn.textContent = 'Link copied!';
              setTimeout(function() { btn.textContent = 'Copy your portfolio link'; }, 2000);
            });
          });
        }
      `}} />
    </div>
  )
}

export async function generateMetadata({ params }: { params: { phone: string } }) {
  return {
    title: 'Agent Listings — Manop MLS',
    description: 'View all property listings from this Lagos agent on Manop MLS.',
  }
}
