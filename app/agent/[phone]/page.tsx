import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  investment_score:      number | null
  estimated_yield_pct:   number | null
  created_at:     string | null
  raw_data:       Record<string, unknown> | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: number | null, currency: string | null) {
  if (!price) return 'Price on request'
  const c = currency || 'NGN'
  if (c === 'NGN') {
    if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(1)}M`
    return `₦${(price / 1_000).toFixed(0)}K`
  }
  if (c === 'GHS') return `GH₵${(price / 1_000).toFixed(0)}K`
  if (c === 'KES') return `KSh${(price / 1_000_000).toFixed(1)}M`
  if (c === 'ZAR') return `R${(price / 1_000_000).toFixed(1)}M`
  return `$${(price / 1_000).toFixed(0)}K`
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
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

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getAgentListings(phone: string): Promise<Property[]> {
  // Normalise phone — strip leading zeros, add country code patterns
  const cleaned = decodeURIComponent(phone)

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .or(
      `raw_data->>agent_phone.eq.${cleaned},` +
      `raw_data->>agent_phone.eq.+${cleaned},` +
      `raw_data->>agent_phone.eq.0${cleaned.slice(-10)}`
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('getAgentListings error:', error)
    return []
  }
  return (data as Property[]) || []
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgentPage({
  params,
}: {
  params: { phone: string }
}) {
  const phone    = decodeURIComponent(params.phone)
  const listings = await getAgentListings(phone)

  if (listings.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏠</div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--earth)',
          marginBottom: '0.75rem',
        }}>
          No listings yet
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 360, lineHeight: 1.6 }}>
          This agent hasn&apos;t sent any listings to Manop yet.
          Agents can send listings directly via WhatsApp to get
          a live page like this one.
        </p>
        <Link href="/listings" style={{
          marginTop: '1.5rem',
          padding: '0.6rem 1.4rem',
          background: 'var(--earth)',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}>
          Browse all listings
        </Link>
      </div>
    )
  }

  // Stats
  const forSale   = listings.filter(l => l.listing_type === 'for-sale')
  const forRent   = listings.filter(l => l.listing_type === 'for-rent' || l.listing_type === 'short-let')
  const cities = Array.from(new Set(listings.map(l => l.city).filter(Boolean))) as string[]
  const areas  = Array.from(new Set(listings.map(l => l.neighborhood).filter(Boolean))) as string[]
  const lastSeen  = timeAgo(listings[0]?.created_at || null)

  // Format display phone
  const displayPhone = phone.startsWith('+') ? phone : `+${phone}`

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--earth-dark) 0%, var(--earth) 100%)',
        padding: '3rem 1.5rem 2rem',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/listings" style={{
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            display: 'inline-block',
            marginBottom: '1.5rem',
          }}>
            ← Back to listings
          </Link>

          {/* Avatar */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '1rem',
          }}>
            🏡
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}>
            Lagos Agent
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
            {displayPhone} · Last active {lastSeen}
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total listings', value: listings.length },
              { label: 'For sale',       value: forSale.length  },
              { label: 'For rent',       value: forRent.length  },
              { label: 'Areas covered',  value: areas.length    },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '0.75rem 1.25rem',
                minWidth: 100,
              }}>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.65)',
                  marginTop: '0.25rem',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Areas */}
          {areas.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {areas.slice(0, 8).map(area => (
                <span key={area} style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                }}>
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── LISTINGS GRID ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--earth)' }}>
            All Listings ({listings.length})
          </h2>
          <a
            href={`https://wa.me/${displayPhone.replace('+', '')}`}
            target="_blank"
            rel="noopener"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#25D366',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
            </svg>
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
              <Link
                key={p.id}
                href={`/listing/${p.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border, #e8e0d4)',
                  borderRadius: 12,
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Type badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      background: p.listing_type === 'for-rent' || p.listing_type === 'short-let'
                        ? '#E8F5E9' : '#FFF8E1',
                      color: p.listing_type === 'for-rent' || p.listing_type === 'short-let'
                        ? '#2E7D32' : '#F57F17',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {listingLabel(p.listing_type)}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                    }}>
                      {timeAgo(p.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--earth)',
                    marginBottom: '0.35rem',
                    lineHeight: 1.3,
                  }}>
                    {p.bedrooms ? `${p.bedrooms}-Bed ` : ''}
                    {p.property_type || 'Property'}
                  </h3>

                  {/* Location */}
                  {location && (
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      marginBottom: '0.75rem',
                    }}>
                      {location}
                    </p>
                  )}

                  {/* Price */}
                  <div style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--earth)',
                  }}>
                    {fmt(p.price_local, p.currency_code)}
                  </div>

                  {/* Title status */}
                  {p.title_status && (
                    <div style={{
                      marginTop: '0.6rem',
                      fontSize: '0.75rem',
                      color: p.title_status === 'verified'
                        ? '#2E7D32' : 'var(--muted)',
                    }}>
                      {p.title_status === 'verified' ? '✓ Title verified' : `Title: ${p.title_status}`}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── SHARE SECTION ── */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          background: 'var(--earth-lightest, #faf6f0)',
          borderRadius: 12,
          border: '1px solid var(--border, #e8e0d4)',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--earth)',
            marginBottom: '0.5rem',
          }}>
            Are you this agent?
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            marginBottom: '1rem',
            lineHeight: 1.6,
          }}>
            Share this page with buyers as your personal property portfolio.
            Send more listings via WhatsApp to add them here automatically.
          </p>
          <button
            onClick={undefined}
            style={{
              background: 'var(--earth)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.6rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            id="copy-btn"
          >
            Copy your portfolio link
          </button>
        </div>

      </section>

      {/* ── COPY LINK SCRIPT ── */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('copy-btn').addEventListener('click', function() {
          navigator.clipboard.writeText(window.location.href).then(function() {
            document.getElementById('copy-btn').textContent = 'Link copied!';
            setTimeout(function() {
              document.getElementById('copy-btn').textContent = 'Copy your portfolio link';
            }, 2000);
          });
        });
      `}} />

    </div>
  )
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { phone: string }
}) {
  return {
    title: 'Agent Listings — Manop MLS',
    description: 'View all property listings from this Lagos agent on Manop MLS.',
    openGraph: {
      title: 'Agent Property Portfolio — Manop MLS',
      description: 'Browse verified Lagos property listings. Powered by Manop Intelligence.',
    },
  }
}
