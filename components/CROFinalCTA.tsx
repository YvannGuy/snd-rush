"use client";

export default function CROFinalCTA() {
  return (
    <section className="bg-black text-white py-16 text-center">
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-2xl sm:text-3xl font-bold">Votre date se remplit vite. Réservez dès maintenant votre sono clé en main.</h3>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openAssistantModal'));
            }}
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#e27431' }}
          >
            Trouver mon pack idéal
          </button>
          <a href="#callback" className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold border border-white text-white">
            Être rappelé
          </a>
        </div>
      </div>
    </section>
  );
}
