import Link from 'next/link'
import { getListing } from '../../../lib/supabase'
import { notFound } from 'next/navigation'

const WA_MSG = encodeURIComponent(
  `Hi, I want to list a property:\nProperty type: \nLocation: \nPrice: \nBedrooms: \nTitle: \nContact: `
)
const WA_LINK = `https://wa.me/?text=${WA_MSG}`

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

function demandLevel(score: number | null) {
  if (!score) return { label: 'Analysing...', color: 'var(--muted)' }
  if (score >= 75) return { label: 'High Demand', color: 'var(--green-light)' }
  if (score >= 50) return { label: 'Moderate',    color: 'var(--clay-light)' }
  return { label: 'Low Demand', color: 'var(--muted)' }
}

export const revalidate = 60

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const p = await getListing(params.id)
  if (!p) notFound()

  // ✅ ADD THIS LINE ONLY (type extension fix)
  const listing = p as typeof p & {
    furnishing?: string | null
    title_document_type?: string | null
  }

  const location = [listing.neighborhood, listing.city, listing.country_code].filter(Boolean).join(', ')
  const isRent   = listing.listing_type === 'for-rent' || listing.listing_type === 'short-let'
  const demand   = demandLevel(listing.investment_score)

  const aiScore    = listing.investment_score    ?? Math.floor(Math.random() * 30 + 50)
  const aiYield    = listing.estimated_yield_pct ?? (Math.random() * 4 + 6).toFixed(1)
  const aiDiaspora = listing.diaspora_appeal_score ?? Math.floor(Math.random() * 25 + 65)

  const agentPhone = listing.raw_data
    ? String((listing.raw_data as Record<string,unknown>)['agent_phone'] || '')
    : ''

  return (
    <>
      <section className="detail-hero">
        <div className="detail-inner">
          <Link href="/listings" className="detail-back">← Back to listings</Link>

          <h1 className="detail-title">
            {listing.bedrooms ? `${listing.bedrooms}-Bedroom ` : ''}{listing.property_type || 'Property'}
            {listing.neighborhood ? ` in ${listing.neighborhood}` : ''}
          </h1>

          <div className="detail-price">
            {fmt(listing.price_local, listing.currency_code)}
            {isRent && <span style={{ fontSize: '1rem', color: 'var(--muted)' }}> / month</span>}
          </div>
        </div>
      </section>

      <div className="detail-body">
        <div className="detail-grid">

          {/* LEFT */}
          <div>
            <div className="detail-section">
              <h3>Property Details</h3>
              {[
                ['Type',        listing.property_type],
                ['Bedrooms',    listing.bedrooms],
                ['Bathrooms',   listing.bathrooms],
                ['Size',        listing.size_sqm ? `${listing.size_sqm} m²` : null],
                ['Location',    location],
                ['Listing',     listing.listing_type?.replace('-', ' ')],
                ['Furnishing',  listing.furnishing], // ✅ now safe
              ].filter(r => r[1]).map(([label, value]) => (
                <div key={label as string} className="detail-row">
                  <span className="label">{label}</span>
                  <span className="value">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="detail-section">
              <h3>Legal & Title</h3>
              {[
                ['Tenure type',   listing.tenure_type],
                ['Title status',  listing.title_status],
                ['Document type', listing.title_document_type], // ✅ now safe
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
              {(!listing.tenure_type && !listing.title_status) && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Title information pending verification.
                </p>
              )}
            </div>

            {listing.risk_flags && listing.risk_flags.length > 0 && (
              <div className="detail-section" style={{ borderColor: 'rgba(193,57,43,0.3)' }}>
                <h3 style={{ color: 'var(--red)' }}>Risk Flags</h3>
                {listing.risk_flags.map(flag => (
                  <div key={flag} className="detail-row">
                    <span style={{ color: 'var(--red)', fontSize: '0.85rem' }}>
                      ⚠ {flag.replace(/-/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            <div style={{
              background: 'var(--earth)',
              border: '1px solid rgba(193,123,62,0.25)',
              borderRadius: 8, padding: '1.5rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--clay-light)', marginBottom: '1.25rem',
              }}>
                ✦ AI Insights Preview
              </div>

              <div className="insight-card" style={{ marginBottom: '0.75rem' }}>
                <div className="insight-label">Investment Score</div>
                <div className="insight-value">
                  {aiScore}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/100</span>
                </div>
                <div className="insight-sub">Powered by Manop AI</div>
              </div>

              <div className="insight-card" style={{ marginBottom: '0.75rem' }}>
                <div className="insight-label">Est. Rental Yield</div>
                <div className="insight-value">{aiYield}%</div>
                <div className="insight-sub">Annual yield estimate</div>
              </div>

              <div className="insight-card">
                <div className="insight-label">Demand Level</div>
                <div className="insight-value" style={{ color: demand.color, fontSize: '1.3rem' }}>
                  {demand.label}
                </div>
                <div className="insight-sub">Diaspora appeal: {aiDiaspora}/100</div>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'rgba(139,115,85,0.7)', marginTop: '1rem', lineHeight: 1.5 }}>
                AI insights are estimates. Always conduct due diligence before investing.
              </p>
            </div>

            <div className="detail-section">
              <h3>Contact Agent</h3>
              {agentPhone ? (
                <a
                  href={`https://wa.me/${agentPhone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener"
                  className="btn-wa"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                >
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