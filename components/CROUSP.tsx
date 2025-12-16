export default function CROUSP() {
  const items = [
    {
      title: 'Clé en main',
      text: 'Livraison incluse, installation disponible',
      icon: '✅',
    },
    {
      title: 'Qualité',
      text: 'Matériel pro haut de gamme testé avant chaque sortie',
      icon: '✅',
    },
    {
      title: 'Réactivité',
      text: 'Disponible 24/24, devis immédiat',
      icon: '✅',
    },
  ];
  return (
    <section id="usp" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">Pourquoi SND Rush ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <div className="text-3xl">{item.icon}</div>
              <div className="mt-3 text-lg font-semibold text-gray-900">{item.title}</div>
              <div className="mt-1 text-gray-700">{item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
