"use client";

export default function CROHero() {
  return (
    <section className="relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Donnez de la voix à votre événement 🔊
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-700">
            Sono clé en main avec livraison & installation 24/24 en Île-de-France.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openAssistantModal'));
              }}
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#e27431" }}
            >
              Trouver mon pack idéal
            </button>
            <a href="#callback" className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold border border-gray-300 text-gray-900">
              Être rappelé
            </a>
          </div>

          <div className="mt-6 text-sm text-gray-600 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">Réponse &lt; 30 min</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">Matériel pro</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-2">
              <span className="font-semibold">4.9 ★ Avis clients</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
