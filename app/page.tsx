import Link from 'next/link'
import { getListings, getStats } from '../lib/supabase'
import PropertyCard from '../components/PropertyCard'

const PHONE = "+2348103971657";
const WA_MSG = encodeURIComponent(
  `Hi, I want to list a property on Manop.

  📍 Location:
  💰 Price:
  🏠 Property Type:
  🛏 Bedrooms:
  📝 Description:
  📞 Contact:
  📸 Images:`
)
const WA_LINK = `https://wa.me/${PHONE}?text=${WA_MSG}`

export const revalidate = 60  // ISR — refresh every 60s

export default async function Home() {
  // const [listings, stats] = await Promise.all([
  //   getListings(undefined, 9),
  //   getStats(),
  // ])
  const listings = []
  const stats = { totalListings: 0, uniqueCities: 0 }
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">
            <span className="dot" />
            Live listings — updated daily
          </div>

          <h1>
            African property<br />
            <em>made investable.</em>
          </h1>

          <p className="hero-sub">
            Verified listings from Lagos, Accra, Nairobi and beyond.
            Built for diaspora investors who want real data — not guesswork.
          </p>

          <div className="hero-actions">
            <Link href="/listings" className="btn-primary">
              Browse Listings →
            </Link>
            <a href={WA_LINK} target="_blank" rel="noopener" className="btn-wa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.823L0 24l6.335-1.662A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.52-5.166-1.426l-.371-.22-3.762.987 1.005-3.668-.242-.378A9.946 9.946 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Submit via WhatsApp
            </a>
          </div>

          <div className="hero-markets">
            <span className="market-pill"><span className="flag">🇳🇬</span> Nigeria</span>
            <span className="market-pill"><span className="flag">🇬🇭</span> Ghana</span>
            <span className="market-pill"><span className="flag">🇰🇪</span> Kenya</span>
            <span className="market-pill"><span className="flag">🇿🇦</span> South Africa</span>
            <span className="market-pill"><span className="flag">🇪🇬</span> Egypt</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat">
            <span className="stat-num">{stats.totalListings.toLocaleString()}</span>
            <span className="stat-label">Total Listings</span>
          </div>
          <div className="stat">
            <span className="stat-num">{stats.uniqueCities}</span>
            <span className="stat-label">Cities Covered</span>
          </div>
          <div className="stat">
            <span className="stat-num">5</span>
            <span className="stat-label">Countries</span>
          </div>
          <div className="stat">
            <span className="stat-num">AI</span>
            <span className="stat-label">Powered by Manop</span>
          </div>
        </div>
      </div>

      {/* ── LIVE FEED ── */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Latest Listings</h2>
          <Link href="/listings" className="section-link">View all →</Link>
        </div>

        {listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="empty">
            <h3>No listings yet</h3>
            <p>Be the first agent to list a property.</p>
          </div>
        )}
      </div>

      {/* ── WA BANNER ── */}
      <section className="wa-banner">
        <h2>Are you an agent in Africa?</h2>
        <p>
          List your properties for free. Send us a WhatsApp message
          with your listing details and we'll publish it instantly.
        </p>
        <a href={WA_LINK} target="_blank" rel="noopener" className="btn-wa">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.099 1.51 5.823L0 24l6.335-1.662A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.52-5.166-1.426l-.371-.22-3.762.987 1.005-3.668-.242-.378A9.946 9.946 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Submit a Listing on WhatsApp
        </a>
      </section>
    </>
  )
}
