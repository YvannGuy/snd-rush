import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page non trouvée - 404 | SoundRush Paris',
  description: 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil ou découvrez nos packs de sonorisation à Paris.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-white">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800">
        Page non trouvée
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-[#F2431E] text-white rounded-lg hover:bg-[#E63A1A] transition-colors font-medium"
        >
          Retour à l'accueil
        </Link>
        <Link
          href="/catalogue"
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Voir le catalogue
        </Link>
        <Link
          href="/location"
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Location matériel
        </Link>
      </div>
    </div>
  )
}