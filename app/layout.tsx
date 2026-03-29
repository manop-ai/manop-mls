import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Africa Property Listings — Live',
  description: 'Verified property listings from Lagos, Accra & beyond. Powered by Manop AI.',
  openGraph: {
    title: 'Africa Property Listings — Live',
    description: 'The first AI-powered property listing infrastructure for Africa.',
  }
}

const WA_MSG = encodeURIComponent(
  `Hi, I want to list a property:\nProperty type: \nLocation: \nPrice: \nBedrooms: \nTitle: \nContact: `
)
const WA_LINK = `https://wa.me/?text=${WA_MSG}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-logo">Africa<span>Listings</span></div>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/listings">Listings</a></li>
            <li>
              <a href={WA_LINK} target="_blank" rel="noopener" className="nav-cta">
                List Property
              </a>
            </li>
          </ul>
        </nav>
        {children}
        <footer>
          <div className="footer-inner">
            <div className="footer-brand">AfricaListings</div>
            <div className="footer-text">Lagos · Accra · Nairobi · Cape Town</div>
            <div className="footer-powered">Powered by <span>Manop AI</span></div>
          </div>
        </footer>
      </body>
    </html>
  )
}
