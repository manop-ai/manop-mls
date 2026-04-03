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
  created_at:     string | null
  raw_data:       Record<string, unknown> | null
}

type AgentProfile = {
  name:          string | null
  agency:        string | null
  bio:           string | null
  city:          string | null
  listing_count: number
  joined_at:     string | null
  onboarded:     boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: number | null, currency: string | null) {
  if (!price) return 'Price on request'
  const c = currency || 'NGN'
  if (c === 'NGN') {
    if (price >= 1_000_000) return `\u20A6${(price / 1_000_000).toFixed(1)}M`
    return `\u20A6${(price / 1_000).toFixed(0)}K`
  }
  if (c === 'GHS') return `GH\u20B5${(price / 1_000).toFixed(0)}K`
  if (c === 'KES') return `KSh${(price / 1_000_000).toFixed(1)}M`
  return `$${(price / 1_000).toFixed(0)}K`
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

function listingLabel(type: string | null): string {
  const map: Record<string, string> = {
    'for-sale':  'For Sale',
    'for-rent':  'For Rent',
    'short-let': 'Short Let',
    'off-plan':  'Off Plan',
  }
  return (type && map[type]) ? map[type] : 'For Sale'
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getAgentProfile(phone: string): Promise<AgentProfile | null> {
  const cleaned = decodeURIComponent(phone)

  // Try all phone formats
  const formats = [
    cleaned,
    `+${cleaned}`,
    `0${cleaned.slice(-10)}`,
    cleaned.replace(/^234/, '0'),
    `234${cleaned.slice(-10)}`,
  ].filter(Boolean)

  for (const fmt of formats) {
    const { data } = await supabase
      .from('agent_profiles')
      .select('name, agency, bio, city, listing_count, joined_at, onboarded')
      .eq('phone', fmt)
      .limit(1)

    if (data && data.length > 0) {
      return data[0] as AgentProfile
    }
  }
  return null
}

async function getAgentListings(phone: string): Promise<Property[]> {
  const cleaned = decodeURIComponent(phone)

  const formats = [
    cleaned,
    `+${cleaned}`,
    `0${cleaned.slice(-10)}`,
    cleaned.replace(/^234/, '0'),
    `234${cleaned.slice(-10)}`,
  ].filter(Boolean)

  const orFilter = formats.map(f => `agent_phone.eq.${f}`).join(',')

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

// ─── Build agent display info ─────────────────────────────────────────────────

function buildDisplayInfo(profile: AgentProfile | null, phone: string) {
  const displayPhone = phone.startsWith('+') ? phone : `+${phone}`

  if (!profile || !profile.name) {
    return {
      displayName: 'Property Agent',
      agencyLine:  null,
      bio:         'Real estate agent on Manop MLS.',
      avatarLetter: 'A',
      displayPhone,
    }
  }

  const name        = profile.name
  const firstName   = name.split(' ')[0]
  const agency      = profile.agency
  const city        = profile.city || 'Lagos'
  const count       = profile.listing_count || 0
  const agencyLine  = agency && agency.toLowerCase() !== 'independent' ? agency : null

  // Auto-generate bio if none stored
  const bio = profile.bio || [
    `Real estate agent based in ${city}.`,
    agencyLine ? `With ${agencyLine}.` : null,
    count > 0 ? `${count} verified listing${count !== 1 ? 's' : ''} on Manop MLS.` : null,
  ].filter(Boolean).join(' ')

  return {
    displayName:  name,
    agencyLine,
    bio,
    avatarLetter: firstName[0].toUpperCase(),
    displayPhone,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgentPage({
  params,
}: {
  params: { phone: string }
}) {
  const phone    = decodeURIComponent(params.phone)
  const [profile, listings] = await Promise.all([
    getAgentProfile(phone),
    getAgentListings(phone),
  ])

  const {
    displayName,
    agencyLine,
    bio,
    avatarLetter,
    displayPhone,
  } = buildDisplayInfo(profile, phone)

  const forSale  = listings.filter(l => l.listing_type === 'for-sale')
  const forRent  = listings.filter(l =>
    l.listing_type === 'for-rent' || l.listing_type === 'short-let'
  )
  const areas    = Array.from(
    new Set(listings.map(l => l.neighborhood).filter(Boolean))
  ) as string[]
  const lastSeen = timeAgo(listings[0]?.created_at || profile?.joined_at || null)

  if (listings.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--clay)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem',
          fontFamily: 'var(--font-display)',
        }}>
          {avatarLetter}
        </div>
        <h1 style={{
          fontSize: '1.4rem', fontWeight: 700,
          color: 'var(--earth)', marginBottom: '0.5rem',
        }}>
          {displayName}
        </h1>
        {agencyLine && (
          <p style={{ color: 'var(--clay)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            {agencyLine}
          </p>
        )}
        <p style={{ color: 'var(--muted)', maxWidth: 340, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          No listings yet. Send a property via WhatsApp to get your portfolio page.
        </p>
        <Link href="/listings" style={{
          padding: '0.6rem 1.4rem', background: 'var(--clay)',
          color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem',
        }}>
          Browse all listings
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'var(--earth)',
        padding: '3rem 1.5rem 2.5rem',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/listings" style={{
            color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
            fontSize: '0.85rem', display: 'inline-block', marginBottom: '2rem',
          }}>
            \u2190 Back to listings
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--clay)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              fontFamily: 'var(--font-display)',
            }}>
              {avatarLetter}
            </div>

            {/* Name + bio */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{
                fontSize: '1.7rem', fontWeight: 700,
                color: 'var(--sand)', marginBottom: '0.25rem',
                fontFamily: 'var(--font-display)',
              }}>
                {displayName}
              </h1>

              {agencyLine && (
                <p style={{
                  color: 'var(--clay-light)', fontSize: '0.95rem',
                  fontWeight: 500, marginBottom: '0.5rem',
                }}>
                  {agencyLine}
                </p>
              )}

              <p style={{
                color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem',
                marginBottom: '0.75rem', lineHeight: 1.5, maxWidth: 480,
              }}>
                {bio}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                {displayPhone} &middot; Last active {lastSeen}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total listings', value: listings.length },
              { label: 'For sale',       value: forSale.length  },
              { label: 'For rent',       value: forRent.length  },
              { label: 'Areas covered',  value: areas.length    },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '0.75rem 1.25rem', minWidth: 100,
              }}>
                <div style={{
                  fontSize: '1.6rem', fontWeight: 800,
                  color: 'var(--clay-light)', lineHeight: 1,
                  fontFamily: 'var(--font-display)',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)',
                  marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Area tags */}
          {areas.length > 0 && (
            <div style={{
              marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
            }}>
              {areas.slice(0, 8).map(area => (
                <span key={area} style={{
                  background: 'rgba(193,123,62,0.2)',
                  border: '1px solid rgba(193,123,62,0.3)',
                  color: 'var(--clay-light)',
                  borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.78rem',
                }}>
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem',
        }}>
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--earth)', fontFamily: 'var(--font-display)',
          }}>
            All Listings ({listings.length})
          </h2>
          <a
            href={`https://wa.me/${displayPhone.replace('+', '')}`}
            target="_blank" rel="noopener"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#25D366', color: '#fff',
              padding: '0.5rem 1rem', borderRadius: 8,
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.823L0 24l6.335-1.662A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.52-5.166-1.426l-.371-.22-3.762.987 1.005-3.668-.242-.378A9.946 9.946 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Contact {displayName.split(' ')[0]}
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {listings.map(p => {
            const location = [p.neighborhood, p.city].filter(Boolean).join(', ')
            const isRent   = p.listing_type === 'for-rent' || p.listing_type === 'short-let'
            return (
              <Link
                key={p.id}
                href={`/listing/${p.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      background: isRent ? '#E8F5E9' : '#FFF8E1',
                      color:      isRent ? '#2E7D32' : '#F57F17',
                      fontSize: '0.72rem', fontWeight: 700,
                      padding: '0.2rem 0.6rem', borderRadius: 20,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {listingLabel(p.listing_type)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      {timeAgo(p.created_at)}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1rem', fontWeight: 700,
                    color: 'var(--earth)', marginBottom: '0.3rem', lineHeight: 1.3,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {p.bedrooms ? `${p.bedrooms}-Bed ` : ''}
                    {p.property_type || 'Property'}
                  </h3>

                  {location && (
                    <p style={{
                      fontSize: '0.82rem', color: 'var(--muted)',
                      marginBottom: '0.75rem',
                    }}>
                      \ud83d\udccd {location}
                    </p>
                  )}

                  <div style={{
                    fontSize: '1.2rem', fontWeight: 800,
                    color: 'var(--clay)', fontFamily: 'var(--font-display)',
                  }}>
                    {fmt(p.price_local, p.currency_code)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Share section */}
        <div style={{
          marginTop: '2.5rem', padding: '1.5rem',
          background: 'var(--earth)',
          borderRadius: 12, textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: '1rem', fontWeight: 700,
            color: 'var(--sand)', marginBottom: '0.5rem',
            fontFamily: 'var(--font-display)',
          }}>
            Are you {displayName.split(' ')[0]}?
          </h3>
          <p style={{
            fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)',
            marginBottom: '1.25rem', lineHeight: 1.6,
          }}>
            Share this page with buyers as your personal property portfolio.
            Send more listings via WhatsApp to add them automatically.
          </p>
          <button
            id="copy-btn"
            style={{
              background: 'var(--clay)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.65rem 1.5rem',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Copy portfolio link
          </button>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `
        var btn = document.getElementById('copy-btn');
        if (btn) {
          btn.addEventListener('click', function() {
            navigator.clipboard.writeText(window.location.href).then(function() {
              btn.textContent = 'Copied!';
              setTimeout(function() { btn.textContent = 'Copy portfolio link'; }, 2000);
            });
          });
        }
      `}} />

    </div>
  )
}

export async function generateMetadata({ params }: { params: { phone: string } }) {
  const phone   = decodeURIComponent(params.phone)
  const profile = await getAgentProfile(phone)
  const name    = profile?.name || 'Property Agent'
  const agency  = profile?.agency && profile.agency.toLowerCase() !== 'independent'
    ? ` · ${profile.agency}` : ''
  return {
    title: `${name}${agency} — Manop MLS`,
    description: `Browse verified property listings from ${name} on Manop MLS.`,
  }
}
