import React, { useMemo, useState } from 'react';

type Zone = 'PARIS' | 'PETITE_COURONNE' | 'GRANDE_COURONNE' | 'RETRAIT';

type Source = 
  | 'Smartphone (Bluetooth)'
  | 'Smartphone (câble)'
  | 'PC / Tablette'
  | 'DJ Controller / Platines'
  | 'Instrument (jack)'
  | 'Autre';

// type SpeakerModel = 'AS108' | 'AS115' | 'FBT115'; // Utilisé dans Recommendation

type Answers = {
  type: 'Mariage' | 'Anniversaire' | 'Association' | 'Corporate' | 'Église' | 'Concert' | 'Autre' | '';
  guests: '0-40' | '40-80' | '80-150' | '150+' | '';
  venue: 'Intérieur' | 'Extérieur' | '';
  source: Source | '';
  needs: { music:boolean; speeches:boolean; dj:boolean };
  mics: { wired:number; wireless:number };
  date: string;
  postal: string;
  budget: '<=300' | '300-600' | '600-1000' | '1000+' | '';
};

type Recommendation = {
  speakers: number;
  subwoofers: number;
  console: 'NONE' | 'PROMIX8' | 'PROMIX16';
  micWired: number;
  micWireless: number;
  speakerModel: 'AS108' | 'AS115' | 'FBT115';
  reasons: string[];
};

function parseZoneFromPostal(cp: string): Zone {
  const clean = (cp || '').trim();
  if (/^75\d{3}$/.test(clean)) return 'PARIS';
  if (/^(92|93|94)\d{3}$/.test(clean)) return 'PETITE_COURONNE';
  if (/^(77|78|91|95)\d{3}$/.test(clean)) return 'GRANDE_COURONNE';
  return 'RETRAIT';
}

function isUrgent(dateStr: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const target = new Date(dateStr);
  const diffH = (target.getTime() - now.getTime()) / 36e5;
  return diffH > 0 && diffH <= 48;
}

function recommend(ans: Answers): Recommendation {
  // Base
  let speakers = 1;
  let subs = 0;
  let console: Recommendation['console'] = 'NONE';
  let micWired = 0;
  let micWireless = 0;
  let speakerModel: Recommendation['speakerModel'] = 'AS108';
  const R: string[] = [];

  // Guests
  switch (ans.guests) {
    case '0-40': speakers = 1; R.push('30-40 pers → 1 enceinte suffit.'); break;
    case '40-80': speakers = 2; R.push('40-80 pers → 2 enceintes pour couverture homogène.'); break;
    case '80-150': speakers = 2; subs = 1; R.push('>80 pers → +1 caisson pour l\'assise.'); break;
    case '150+': speakers = 2; subs = 2; R.push('150+ pers → 2 enceintes + 2 caissons recommandé.'); break;
  }

  // Venue
  if (ans.venue === 'Extérieur') {
    speakerModel = 'FBT115';
    R.push('Extérieur → modèle plus puissant (FBT 115A).');
    if ((ans.guests === '40-80' || ans.guests === '80-150' || ans.guests === '150+') && subs === 0) {
      subs = Math.max(subs, 1); R.push('Extérieur → +1 caisson conseillé dès 80 pers.');
    }
  } else {
    // Intérieur : modèle selon taille et type d'événement
    if (ans.guests === '0-40') {
      speakerModel = 'AS108';
    } else if (ans.guests === '40-80' || ans.guests === '80-150') {
      speakerModel = 'AS115';
    } else if (ans.type === 'Mariage' || ans.type === 'Corporate') {
      speakerModel = 'FBT115';
    }
  }

  // Source & Console
  const totalMics = ans.mics.wired + ans.mics.wireless;
  
  if (ans.source === 'Smartphone (Bluetooth)' && speakerModel === 'AS108' && totalMics <= 1) {
    console = 'NONE';
    R.push('Smartphone en Bluetooth + AS108 → console non nécessaire.');
  } else {
    if (['Smartphone (câble)', 'PC / Tablette', 'Instrument (jack)'].includes(ans.source)) {
      console = 'PROMIX8';
    } else if (ans.source === 'DJ Controller / Platines') {
      console = 'PROMIX16';
    }
    
    if (totalMics >= 3) {
      console = 'PROMIX16';
      R.push('Plusieurs sources/micros → Promix 16 préférable.');
    }
  }

  // Mics
  micWired = ans.mics.wired;
  micWireless = ans.mics.wireless;

  // Budget note
  if (ans.budget === '<=300' && (subs > 0 || console !== 'NONE')) {
    R.push('Budget serré : proposer version sans caisson / 1 enceinte, à confirmer.');
  }

  return { speakers, subwoofers: subs, console, micWired, micWireless, speakerModel, reasons: R };
}

export default function AssistantConseil({
  onApplyToQuote,
}: {
  onApplyToQuote: (rec: Recommendation, zone: Zone, urgent: boolean, dateStr: string, postal: string, source: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [a, setA] = useState<Answers>({
    type: '', guests: '', venue: '', source: '',
    needs: { music:true, speeches:false, dj:false },
    mics: { wired:0, wireless:0 },
    date: '', postal: '', budget: '',
  });

  // const zone = useMemo(() => parseZoneFromPostal(a.postal), [a.postal]);
  // const urgent = useMemo(() => isUrgent(a.date), [a.date]);
  const rec = useMemo(() => (a.type && a.guests && a.venue ? recommend(a) : null), [a]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: return !!a.type;
      case 1: return !!a.guests;
      case 2: return !!a.venue;
      case 3: return !!a.source;
      case 4: return true; // Besoins - toujours valide
      case 5: return !!a.postal;
      default: return true;
    }
  };

  const next = () => {
    if (validateStep(step)) {
      setError('');
      setStep((s) => Math.min(6, s + 1));
    } else {
      setError('Veuillez répondre à cette question avant de continuer.');
    }
  };
  
  const prev = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const styles = {
    container: { border:'1px solid #eee', borderRadius:12, padding:16, background:'#fff', marginBottom: 16 },
    h3: { marginTop:0, fontSize: 18, fontWeight: 600 },
    p: { marginTop:4, color:'#666', fontSize: 14 },
    label: { display: 'block', fontWeight: 500, marginBottom: 8 },
    buttonGroup: { display:'flex', gap:8, flexWrap:'wrap' as const, margin:'8px 0' },
    button: { padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', background:'#fff', color:'#111', cursor: 'pointer', fontSize: 14 },
    buttonActive: { padding:'8px 12px', borderRadius:8, border:'1px solid #111', background:'#111', color:'#fff', cursor: 'pointer', fontSize: 14 },
    buttonNav: { padding:'8px 16px', borderRadius:8, border:'1px solid #e27431', background:'#e27431', color:'#fff', cursor: 'pointer', fontSize: 14 },
    buttonNavDisabled: { padding:'8px 16px', borderRadius:8, border:'1px solid #ddd', background:'#f5f5f5', color:'#999', cursor: 'not-allowed', fontSize: 14 },
    nav: { display:'flex', justifyContent:'space-between', marginTop: 16 },
    grid: { display:'grid', gap:8, margin:'8px 0' },
    grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
    input: { width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:8, fontSize: 14 },
    select: { width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:8, fontSize: 14 },
    checkbox: { marginRight: 8 },
    rec: { marginTop: 16 },
    recList: { marginTop:8, paddingLeft: 16 },
    recItem: { marginBottom: 4 },
    reasons: { fontSize:12, color:'#666', marginTop:8, padding: 8, background: '#f9f9f9', borderRadius: 6 },
    actions: { display:'flex', gap:8, marginTop:12 },
    script: { marginTop:12, fontSize:12, color:'#666', padding: 8, background: '#f0f8ff', borderRadius: 6, border: '1px solid #e3f2fd' },
    error: { fontSize: 12, color: '#ef4444', marginTop: 8, textAlign: 'center' as const },
    help: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
    alert: { fontSize: 12, color: '#f59e0b', marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 6, border: '1px solid #fbbf24' },
    novice: { fontSize: 12, color: '#059669', marginBottom: 12, padding: 8, background: '#d1fae5', borderRadius: 6, border: '1px solid #10b981', textAlign: 'center' as const }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.h3}>🤖 Assistant Conseil</h3>
      <p style={styles.p}>Pose 5–6 questions rapides et obtiens une recommandation + remplissage auto du devis.</p>

      {step===0 && (
        <div>
          <label style={styles.label}>1. Type d'événement</label>
          <div style={styles.buttonGroup}>
            {['Mariage','Anniversaire','Association','Corporate','Église','Concert','Autre'].map(t=>(
              <button key={t} onClick={()=>setA({...a,type:t as any})}
                style={a.type===t ? styles.buttonActive : styles.button}>
                {t}
              </button>
            ))}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <span/>
            <button disabled={!a.type} onClick={next} style={!a.type ? styles.buttonNavDisabled : styles.buttonNav}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step===1 && (
        <div>
          <label style={styles.label}>2. Nombre de personnes</label>
          <div style={styles.buttonGroup}>
            {['0-40','40-80','80-150','150+'].map(t=>(
              <button key={t} onClick={()=>setA({...a,guests:t as any})}
                style={a.guests===t ? styles.buttonActive : styles.button}>
                {t}
              </button>
            ))}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <button onClick={prev} style={styles.buttonNav}>← Retour</button>
            <button disabled={!a.guests} onClick={next} style={!a.guests ? styles.buttonNavDisabled : styles.buttonNav}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step===2 && (
        <div>
          <label style={styles.label}>3. Lieu</label>
          <div style={styles.buttonGroup}>
            {['Intérieur','Extérieur'].map(t=>(
              <button key={t} onClick={()=>setA({...a,venue:t as any})}
                style={a.venue===t ? styles.buttonActive : styles.button}>
                {t}
              </button>
            ))}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <button onClick={prev} style={styles.buttonNav}>← Retour</button>
            <button disabled={!a.venue} onClick={next} style={!a.venue ? styles.buttonNavDisabled : styles.buttonNav}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <label style={styles.label}>4. Quelle est votre source audio principale ?</label>
          <div style={styles.help}>Si vous diffusez depuis un smartphone en Bluetooth, l'AS108 peut fonctionner sans console.</div>
          <div style={styles.buttonGroup}>
            {['Smartphone (Bluetooth)','Smartphone (câble)','PC / Tablette','DJ Controller / Platines','Instrument (jack)','Autre'].map(t=>(
              <button key={t} onClick={()=>setA({...a,source:t as any})}
                style={a.source===t ? styles.buttonActive : styles.button}>
                {t}
              </button>
            ))}
          </div>
          {a.source === 'Smartphone (Bluetooth)' && (
            <div style={styles.alert}>
              ⚠️ Portée Bluetooth ≈ 8-10 m selon l'environnement. Pour une fiabilité maximale (mariage/corporate), privilégiez le câble ou une console.
            </div>
          )}
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <button onClick={prev} style={styles.buttonNav}>← Retour</button>
            <button disabled={!a.source} onClick={next} style={!a.source ? styles.buttonNavDisabled : styles.buttonNav}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step===4 && (
        <div>
          <label style={styles.label}>5. Besoins</label>
          <div style={styles.grid}>
            <label style={{display: 'flex', alignItems: 'center'}}>
              <input type="checkbox" checked={a.needs.music} onChange={e=>setA({...a,needs:{...a.needs,music:e.target.checked}})} style={styles.checkbox} />
              Musique (téléphone/DJ)
            </label>
            <label style={{display: 'flex', alignItems: 'center'}}>
              <input type="checkbox" checked={a.needs.speeches} onChange={e=>setA({...a,needs:{...a.needs,speeches:e.target.checked}})} style={styles.checkbox} />
              Discours
            </label>
            <label style={{display: 'flex', alignItems: 'center'}}>
              <input type="checkbox" checked={a.needs.dj} onChange={e=>setA({...a,needs:{...a.needs,dj:e.target.checked}})} style={styles.checkbox} />
              DJ / platines
            </label>
          </div>
          <div style={styles.grid2}>
            <label style={styles.label}>Micros filaires
              <input type="number" min={0} value={a.mics.wired} onChange={e=>setA({...a,mics:{...a.mics,wired:parseInt(e.target.value||'0')}})} style={styles.input} />
            </label>
            <label style={styles.label}>Micros sans fil
              <input type="number" min={0} value={a.mics.wireless} onChange={e=>setA({...a,mics:{...a.mics,wireless:parseInt(e.target.value||'0')}})} style={styles.input} />
            </label>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <button onClick={prev} style={styles.buttonNav}>← Retour</button>
            <button onClick={next} style={styles.buttonNav}>Suivant →</button>
          </div>
        </div>
      )}

      {step===5 && (
        <div>
          <label style={styles.label}>6. Informations pratiques</label>
          <label style={styles.label}>Code postal (pour estimer la livraison)
            <input value={a.postal} onChange={e=>setA({...a,postal:e.target.value})} placeholder="Ex: 75008" style={styles.input} />
          </label>
          <div style={styles.grid2}>
            <label style={styles.label}>Date/heure
              <input type="datetime-local" value={a.date} onChange={e=>setA({...a,date:e.target.value})} style={styles.input} />
            </label>
            <label style={styles.label}>Budget
              <select value={a.budget} onChange={e=>setA({...a,budget:e.target.value as any})} style={styles.select}>
                <option value="">—</option>
                <option value="<=300">≤ 300 €</option>
                <option value="300-600">300 – 600 €</option>
                <option value="600-1000">600 – 1 000 €</option>
                <option value="1000+">1 000 € +</option>
              </select>
            </label>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.nav}>
            <button onClick={prev} style={styles.buttonNav}>← Retour</button>
            <button disabled={!a.postal} onClick={next} style={!a.postal ? styles.buttonNavDisabled : styles.buttonNav}>
              Voir la recommandation →
            </button>
          </div>
        </div>
      )}

      {step===6 && rec && (
        <div>
          <div style={styles.novice}>
            💡 Ces réglages sont ajustables après un court échange avec notre technicien.
          </div>
          <h4 style={{marginTop: 0, color: '#e27431'}}>🎯 Recommandation</h4>
          <div style={{background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 12}}>
            <div><strong>Recommandation :</strong> {rec.speakers} enceinte(s) ({rec.speakerModel==='AS108'?'AS108': rec.speakerModel==='AS115'?'AS115':'FBT115'}), {rec.subwoofers} caisson(s), Console : {rec.console==='NONE'?'Aucune': rec.console==='PROMIX8'?'Promix 8':'Promix 16'}, Micros : {rec.micWired} filaires / {rec.micWireless} sans fil</div>
            <div><strong>Source :</strong> {a.source}</div>
            <div><strong>Zone estimée :</strong> {parseZoneFromPostal(a.postal)} {isUrgent(a.date)?'• Urgence +20%':''}</div>
            <div style={{fontSize: 11, color: '#6b7280', marginTop: 8}}>
              <em>Repères prix (info interne) : AS108 70€, AS115 80€, FBT115 90€ (TTC/jour)</em>
            </div>
          </div>
          {rec.reasons.length>0 && (
            <div style={styles.reasons}>
              <strong>💡 Justification :</strong>
              {rec.reasons.map((r,i)=><div key={i}>• {r}</div>)}
            </div>
          )}

          <div style={styles.actions}>
            <button onClick={()=>onApplyToQuote(rec, parseZoneFromPostal(a.postal), isUrgent(a.date), a.date, a.postal, a.source)} style={styles.buttonNav}>
              ✅ Remplir le devis
            </button>
            <button onClick={()=>setStep(0)} style={styles.button}>
              🔄 Recommencer
            </button>
          </div>

          <div style={styles.script}>
            <strong>📞 Script à lire au client :</strong><br/>
            {a.guests === '0-40' && a.venue === 'Intérieur' ? 
              `"Avec ~30 personnes en intérieur, 1 AS108 suffit. Si vous voulez plus d'ampleur, on passe à 2 enceintes."` :
            a.venue === 'Extérieur' ?
              `"En extérieur le son se disperse : on part sur FBT 115A, et au-delà de 80 personnes on ajoute un caisson."` :
            a.source === 'Smartphone (Bluetooth)' ?
              `"Si vous diffusez via smartphone en Bluetooth, la console n'est pas nécessaire sur l'AS108. Pour une fiabilité maximale, on peut basculer en câble."` :
              `"Avec ${a.guests.replace('+',' plus de ')} personnes ${a.venue.toLowerCase()}, je vous conseille ${rec.speakers} enceinte(s)${rec.subwoofers>0? ' avec caisson pour l\'assise':''}. ${rec.console!=='NONE'?' Je prévois une console pour vos sources.':''}${rec.micWired+rec.micWireless>0?` Et ${rec.micWired+rec.micWireless} micro(s) pour les prises de parole.`:''} Livraison en zone ${parseZoneFromPostal(a.postal)}${isUrgent(a.date)?', intervention en urgence':''}."`
            }
          </div>
        </div>
      )}
    </div>
  );
}
