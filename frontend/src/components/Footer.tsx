import { Link } from 'react-router-dom'
import { Film, Mail, Phone, MapPin, Twitter, Instagram, Facebook, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark-800 border-t border-dark-700 mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow">
                <Film size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-white">Cine</span>
                <span className="gradient-text">Maa</span>
              </span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed mb-4">
              India's best movie ticket booking platform. Enjoy seamless booking for movies, events, and live shows.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-dark-400 hover:text-white hover:bg-dark-600 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-dark-100 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Now Showing', '/?status=NOW_PLAYING'], ['Coming Soon', '/?status=UPCOMING'], ['My Bookings', '/profile?tab=bookings'], ['Offers & Coupons', '/offers']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-dark-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Movies */}
          <div>
            <h4 className="text-dark-100 font-semibold mb-4">Browse</h4>
            <ul className="space-y-2.5 text-sm">
              {['Action', 'Romance', 'Comedy', 'Horror', 'Thriller', 'Drama'].map(genre => (
                <li key={genre}>
                  <Link to={`/?genre=${genre}`} className="text-dark-400 hover:text-white transition-colors">{genre}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-dark-100 font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-dark-400">
                <Mail size={14} className="text-brand-500" />
                support@cinemaa.in
              </li>
              <li className="flex items-center gap-2 text-dark-400">
                <Phone size={14} className="text-brand-500" />
                +91 1800-XXX-XXXX
              </li>
              <li className="flex items-start gap-2 text-dark-400">
                <MapPin size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                BKC, Mumbai, Maharashtra 400051
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-500">
          <p>© 2024 CineMaa. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-dark-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-dark-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-dark-300 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
