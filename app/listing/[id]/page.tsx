import Link from 'next/link'
import { getListing } from '../../../lib/supabase'
import { notFound } from 'next/navigation'

const WA_MSG = encodeURIComponent(
  `Hi, I want to list a property:\nProperty type: \nLocation: \nPrice: \nBedrooms: \nTitle: \nContact: `
)
const WA_LINK = `https://wa.me/14155238886?text=${WA_MSG}`

function fmt(price: number | null, currency: string | null) {
  if (!price) return 'Price on request'
  const c = currency || 'NGN'
  if (c === 'NGN') {
    if (price >= 1_000_000) return `\u20A6${(price / 1_000_000).toFixed(1)}M`
    return `\u20A6${(price / 1_000).toFixed(0)}K`
  }
  if (c === 'GHS') return `GH\u20B5${(price / 1_000).toFixed(0)}K`
  if (c === 'KES') return `KSh${(price / 1_000_000).toFixed(1)}M`
  if (c === 'ZAR') return `R${(price / 1_000_000).toFixed(1)}M`
  return `$${(price / 1_000).toFixed(0)}K`
}

export const revalidate = 60

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const p = await getListing(params.id)
  if (!p) notFound()

  const ext = p as typeof p & {
    furnishing?: string | null
    title_document_type?: string | null
    agent_phone?: string | null
  }

  const location = [ext.neighborhood, ext.city, ext.country_code].filter(Boolean).join(', ')
  const isRent   = ext.listing_type === 'for-rent' || ext.listing_type === 'short-let'

  // Agent phone — check direct column first, then raw_data
  const agentPhone = (
    ext.agent_phone ||
    (ext.raw_data ? String((ext.raw_data as Record<string,unknown>)['agent_phone'] || '') : '')
  ).replace(/\D/g, '')

  // Images — pulled from raw_data.media_urls
  const mediaUrls: string[] = (() => {
    if (!ext.raw_data) return []
    const urls = (ext.raw_data as Record<string,unknown>)['media_urls']
    if (Array.isArray(urls)) return urls.filter(Boolean) as string[]
    return []
  })()

  // Investment scores — only show if real data exists, never fake
  const hasScores = ext.investment_score != null || ext.estimated_yield_pct != null

  return (
    <>
      {/* ── HERO ── */}
      <section className="detail-hero">
        <div className="detail-inner">
          <Link href="/listings" className="detail-back">← Back to listings</Link>

          <h1 className="detail-title">
            {ext.bedrooms ? `${ext.bedrooms}-Bedroom ` : ''}{ext.property_type || 'Property'}
            {ext.neighborhood ? ` in ${ext.neighborhood}` : ''}
          </h1>

          <div className="detail-price">
            {fmt(ext.price_local, ext.currency_code)}
            {isRent && <span style={{ fontSize: '1rem', color: 'var(--muted)' }}> / month</span>}
          </div>
        </div>
      </section>

      {/* ── IMAGES ── */}
      {mediaUrls.length > 0 && (
        <div style={{
          maxWidth: 860, margin: '0 auto',
          padding: '1.5rem 1.5rem 0',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: mediaUrls.length === 1
              ? '1fr'
              : mediaUrls.length === 2
              ? '1fr 1fr'
              : 'repeat(3, 1fr)',
            gap: '0.75rem',
          }}>
            {mediaUrls.slice(0, 6).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener"
                style={{ display: 'block', borderRadius: 8, overflow: 'hidden' }}>
                <img
                  src={url}
                  alt={`Property image ${i + 1}`}
                  style={{
                    width: '100%',
                    height: i === 0 && mediaUrls.length > 1 ? 280 : 200,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </a>
            ))}
          </div>
          {mediaUrls.length > 6 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              +{mediaUrls.length - 6} more photos
            </p>
          )}
        </div>
      )}

      {/* ── BODY ── */}
      <div className="detail-body">
        <div className="detail-grid">

          {/* LEFT — property details */}
          <div>
            <div className="detail-section">
              <h3>Property Details</h3>
              {[
                ['Type',        ext.property_type],
                ['Bedrooms',    ext.bedrooms],
                ['Bathrooms',   ext.bathrooms],
                ['Size',        ext.size_sqm ? `${ext.size_sqm} m\u00B2` : null],
                ['Location',    location],
                ['Listing',     ext.listing_type?.replace(/-/g, ' ')],
                ['Furnishing',  ext.furnishing],
              ].filter(r => r[1] != null && r[1] !== '').map(([label, value]) => (
                <div key={label as string} className="detail-row">
                  <span className="label">{label}</span>
                  <span className="value">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="detail-section">
              <h3>Legal & Title</h3>
              {[
                ['Tenure type',   ext.tenure_type],
                ['Title status',  ext.title_status],
                ['Document type', ext.title_document_type],
              ].filter(r => r[1]).map(([label, value]) => (
                <div key={label as string} className="detail-row">
                  <span className="label">{label}</span>
                  <span className="value" style={{
                    color: value === 'verified'   ? 'var(--green-light)'
                         : value === 'unverified' ? 'var(--red)'
                         : 'var(--earth)'
                  }}>
                    {String(value)}
                  </span>
                </div>
              ))}
              {(!ext.tenure_type && !ext.title_status) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Title information pending verification.
                </p>
              )}
            </div>

            {ext.risk_flags && ext.risk_flags.length > 0 && (
              <div className="detail-section" style={{ borderColor: 'rgba(193,57,43,0.3)' }}>
                <h3 style={{ color: 'var(--red)' }}>Risk Flags</h3>
                {ext.risk_flags.map(flag => (
                  <div key={flag} className="detail-row">
                    <span style={{ color: 'var(--red)', fontSize: '0.85rem' }}>
                      &#9888; {flag.replace(/-/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — insights + contact */}
          <div>
            {/* Market Intelligence Panel */}
            <div style={{
              background: 'var(--earth)',
              border: '1px solid rgba(193,123,62,0.25)',
              borderRadius: 8, padding: '1.5rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--clay-light)', marginBottom: '1rem',
              }}>
                &#10022; Market Intelligence
              </div>

              {hasScores ? (
                <>
                  {ext.investment_score != null && (
                    <div className="insight-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="insight-label">Investment Score</div>
                      <div className="insight-value">
                        {ext.investment_score}
                        <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/100</span>
                      </div>
                      <div className="insight-sub">Powered by Manop AI</div>
                    </div>
                  )}
                  {ext.estimated_yield_pct != null && (
                    <div className="insight-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="insight-label">Est. Rental Yield</div>
                      <div className="insight-value">{ext.estimated_yield_pct}%</div>
                      <div className="insight-sub">Annual yield estimate</div>
                    </div>
                  )}
                  {ext.diaspora_appeal_score != null && (
                    <div className="insight-card">
                      <div className="insight-label">Diaspora Appeal</div>
                      <div className="insight-value">
                        {ext.diaspora_appeal_score}
                        <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/100</span>
                      </div>
                      <div className="insight-sub">Based on market data</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    marginBottom: '0.5rem',
                    opacity: 0.5,
                  }}>
                    &#9685;
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--sand)',
                    marginBottom: '0.4rem',
                  }}>
                    Intelligence Building
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                  }}>
                    Investment scores, rental yields, and demand signals will appear here as Manop collects more Lagos market data.
                  </div>
                </div>
              )}

              <p style={{
                fontSize: '0.72rem',
                color: 'rgba(139,115,85,0.6)',
                marginTop: '1rem',
                lineHeight: 1.5,
              }}>
                Data-driven insights powered by verified listings across Lagos.
              </p>
            </div>

            {/* Contact Agent */}
            <div className="detail-section">
              <h3>Contact Agent</h3>
              {agentPhone ? (
                <a
                  href={`https://wa.me/${agentPhone}`}
                  target="_blank" rel="noopener"
                  className="btn-wa"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.823L0 24l6.335-1.662A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.52-5.166-1.426l-.371-.22-3.762.987 1.005-3.668-.242-.378A9.946 9.946 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp Agent
                </a>
              ) : (
                <a href={WA_LINK} target="_blank" rel="noopener" className="btn-wa"
                  style={{ width: '100%', justifyContent: 'center' }}>
                  Enquire via WhatsApp
                </a>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await getListing(params.id)
  if (!p) return { title: 'Listing not found' }
  const loc  = (p as any).neighborhood || p.city || 'Africa'
  const type = p.property_type || 'Property'
  const beds = p.bedrooms ? `${p.bedrooms}-Bed ` : ''
  return {
    title: `${beds}${type} in ${loc} — Manop MLS`,
    description: `${p.listing_type === 'for-rent' ? 'For rent' : 'For sale'} in ${loc}. Listed on Manop Intelligence.`,
    openGraph: {
      title: `${beds}${type} in ${loc}`,
      description: `View listing details, title status, and contact agent directly on Manop MLS.`,
    },
  }
}
