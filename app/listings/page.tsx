'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import type { Property } from '../../lib/supabase'
import PropertyCard from '../../components/PropertyCard'

const CITIES = ['All', 'Lagos', 'Abuja', 'Accra', 'Nairobi']

export default function ListingsPage() {
  const [listings, setListings]   = useState<Property[]>([])
  const [city,     setCity]       = useState('All')
  const [loading,  setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (city !== 'All') {
        query = query.ilike('city', `%${city}%`)
      }

      const { data, error } = await query
      if (!error) setListings((data as Property[]) || [])
      setLoading(false)
    }
    load()
  }, [city])

  return (
    <>
      <div style={{ background: 'var(--earth)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800, color: 'var(--sand)',
            letterSpacing: '-0.03em', marginBottom: '0.5rem',
          }}>
            Property Listings
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {listings.length} listings · updated in real-time
          </p>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          {CITIES.map(c => (
            <button
              key={c}
              className={`filter-btn ${city === c ? 'active' : ''}`}
              onClick={() => setCity(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">
            <p>Loading listings...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map(p => (
              <Link key={p.id} href={`/listing/${p.id}`} style={{ textDecoration: 'none' }}>
                <PropertyCard p={p} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No listings yet in {city}</h3>
            <p>Be the first agent to list here.</p>
          </div>
        )}
      </div>
    </>
  )
}
