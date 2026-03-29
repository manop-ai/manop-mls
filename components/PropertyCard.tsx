'use client'
import Link from 'next/link'
import type { Property } from '../lib/supabase'

function fmt(price: number | null, currency: string | null) {
  if (!price) return 'Price on request'
  const c = currency || 'USD'
  if (c === 'NGN') return `₦${(price / 1_000_000).toFixed(1)}M`
  if (c === 'GHS') return `GH₵${(price / 1_000).toFixed(0)}K`
  if (c === 'KES') return `KSh${(price / 1_000_000).toFixed(1)}M`
  if (c === 'ZAR') return `R${(price / 1_000_000).toFixed(1)}M`
  return `$${(price / 1_000).toFixed(0)}K`
}

function titleClass(status: string | null) {
  if (status === 'verified')   return 'card-title-status title-verified'
  if (status === 'unverified') return 'card-title-status title-unverified'
  return 'card-title-status title-unknown'
}

export default function PropertyCard({ p }: { p: Property }) {
  const location = [p.neighborhood, p.city].filter(Boolean).join(', ')
  const isRent   = p.listing_type === 'for-rent' || p.listing_type === 'short-let'
  const score    = p.investment_score

  return (
    <div className="property-card">
      <div className="card-header">
        <div className="card-type">
          {p.bedrooms ? `${p.bedrooms} Bed ` : ''}{p.property_type || 'Property'}
        </div>
        <span className={`card-badge ${isRent ? 'badge-rent' : 'badge-sale'}`}>
          {isRent ? 'Rent' : 'Sale'}
        </span>
      </div>

      <div className="card-body">
        <div className="card-price">
          {fmt(p.price_local, p.currency_code)}
          {isRent && <span> /mo</span>}
        </div>

        {location && (
          <div className="card-location">
            <span>📍</span> {location}
          </div>
        )}

        <div className="card-details">
          {p.bedrooms   && <span className="card-detail">🛏 {p.bedrooms} bed</span>}
          {p.bathrooms  && <span className="card-detail">🚿 {p.bathrooms} bath</span>}
          {p.size_sqm   && <span className="card-detail">📐 {p.size_sqm}m²</span>}
        </div>

        {p.tenure_type && (
          <span className={titleClass(p.title_status)}>
            {p.title_status === 'verified' ? '✓' : '?'} {p.tenure_type.toUpperCase()}
          </span>
        )}
      </div>

      <div className="card-footer">
        {score != null
          ? <div className="card-score">AI Score: <strong>{score.toFixed(0)}/100</strong></div>
          : <div />
        }
        <Link href={`/listing/${p.id}`} className="btn-ghost" style={{ padding: '0.45rem 0.875rem', fontSize: '0.8rem' }}>
          View →
        </Link>
      </div>
    </div>
  )
}
