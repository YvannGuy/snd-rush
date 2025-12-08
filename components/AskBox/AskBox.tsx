'use client';
import { useState } from 'react';

const SUGGESTIONS = [
  'Mariage 80 personnes à Saint-Ouen, intérieur, samedi soir',
  'Anniversaire 30 invités, Montreuil, besoin d\'un micro',
  'Corporate 120 pers, extérieur, Paris 15e, demain matin',
];

export default function AskBox() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true); setErr(null); setRes(null);
    try {
      const r = await fetch('/api/recommend', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: text })});
      const data = await r.json();
      setRes(data);
    } catch(e:any){ setErr('Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 ease-in-out relative mx-4 mb-8 rounded-3xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 transform transition-all duration-1000 ease-in-out">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-8 transition-all duration-1000 ease-in-out">
            Trouvez votre
            <span className="text-[#F2431E]"> pack idéal</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-in-out mb-8">
            Décrivez votre événement et obtenez une recommandation personnalisée en quelques secondes.
          </p>
        </div>

        {/* AI Box */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-12 transition-all duration-500 ease-in-out hover:shadow-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center">
                  <i className="ri-robot-line text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Assistant SND Rush</h3>
                  <p className="text-gray-600">Décrivez votre événement en quelques mots</p>
                </div>
              </div>
              
              <textarea
                value={text}
                onChange={(e)=>setText(e.target.value)}
                placeholder="Ex. : Mariage 90 pers à 75011, intérieur, samedi soir, besoin 1 micro sans fil"
                rows={4}
                className="w-full rounded-2xl border-2 border-gray-200 p-6 text-lg outline-none focus:ring-2 focus:ring-[#F2431E] focus:border-[#F2431E] transition-all duration-300 resize-none"
              />
              
              <div className="mt-4 flex flex-wrap gap-3">
                {SUGGESTIONS.map((s)=>
                  <button key={s} type="button" onClick={()=>setText(s)}
                    className="rounded-full border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:border-[#F2431E] hover:bg-[#F2431E]/5 transition-all duration-300">
                    {s}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={submit} disabled={loading}
                className="flex-1 bg-[#F2431E] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#E63A1A] transition-all duration-300 disabled:opacity-60 shadow-lg hover:shadow-xl">
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyse en cours…
                  </div>
                ) : (
                  <>
                    <i className="ri-magic-line mr-2 text-xl"></i>
                    Obtenir ma recommandation
                  </>
                )}
              </button>
              <button onClick={()=>setText('')} 
                className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300">
                <i className="ri-refresh-line text-lg"></i>
              </button>
            </div>

            {err && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <i className="ri-error-warning-line text-red-500 text-xl"></i>
                  <span className="text-red-700 font-medium">{err}</span>
                </div>
              </div>
            )}
          </div>

          {/* Résultat */}
          {res && (
            <div className="mt-8 space-y-6">
              {/* Carte de recommandation */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-12 transition-all duration-500 ease-in-out">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#F2431E] rounded-2xl flex items-center justify-center">
                    <i className="ri-check-line text-white text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-black mb-2">Recommandation personnalisée</h3>
                    <p className="text-gray-600 text-lg">{res.plan.abstractCopy}</p>
                  </div>
                </div>

                {res.plan.warnings?.length > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <i className="ri-alert-line text-amber-600 text-xl mt-1"></i>
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-2">Points d'attention</h4>
                        {res.plan.warnings.map((w:string,i:number)=><div key={i} className="text-amber-700 text-sm">• {w}</div>)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Composition matériel */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-bold text-black text-lg mb-4 flex items-center gap-2">
                    <i className="ri-sound-module-line text-[#F2431E]"></i>
                    Composition du pack
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {res.plan.composition.map((c:string,i:number)=>
                      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <div className="w-2 h-2 bg-[#F2431E] rounded-full"></div>
                        <span className="text-gray-700 font-medium">{c}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-gradient-to-r from-[#F2431E]/10 to-[#F2431E]/5 rounded-2xl p-6 border border-[#F2431E]/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-black text-lg">Estimation TTC</h4>
                    <div className="text-3xl font-extrabold text-[#F2431E]">{res.quote.totalTTC} €</div>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-pre-line bg-white/50 rounded-xl p-4">
                    {res.quote.breakdown}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openAssistantModal'));
                    }}
                    className="flex-1 bg-[#F2431E] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#E63A1A] transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                  >
                    <i className="ri-robot-line mr-2"></i>
                    Utiliser l'assistant SoundRush Paris
                  </button>
                  <a href="tel:+33651084994" className="flex-1 border-2 border-[#F2431E] text-[#F2431E] px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#F2431E] hover:text-white transition-all duration-300 text-center">
                    <i className="ri-phone-line mr-2"></i>
                    C'est urgent ? Appelez-nous
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}