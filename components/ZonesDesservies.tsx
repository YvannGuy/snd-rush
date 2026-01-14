'use client'

interface ZonesDesserviesProps {
  title?: string
}

export default function ZonesDesservies({ title = 'Zones desservies à Paris et Île-de-France' }: ZonesDesserviesProps) {
  const zones = [
    'Paris 75',
    'Hauts-de-Seine 92',
    'Seine-Saint-Denis 93',
    'Val-de-Marne 94',
    'Seine-et-Marne 77',
    'Yvelines 78',
    'Essonne 91',
    'Val-d\'Oise 95',
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {zones.map((zone) => (
            <div key={zone} className="bg-white p-4 rounded-lg shadow text-center">
              <p className="font-semibold text-gray-900">{zone}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

