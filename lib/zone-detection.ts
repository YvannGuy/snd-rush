// Détection automatique de zone par code postal/adresse

export function detectZoneFromText(input: string): "paris" | "petite" | "grande" | null {
  const m = input.match(/\b(\d{5})\b/);
  if (!m) return null;
  const zip = m[1];
  const dep = parseInt(zip.slice(0, 2), 10);
  
  if (dep === 75) return "paris";
  if ([92, 93, 94].includes(dep)) return "petite";
  if ([77, 78, 91, 95].includes(dep)) return "grande";
  return null;
}

export const DELIVERY_AR = { 
  paris: 80, 
  petite: 120, 
  grande: 156, 
  retrait: 0 
};

export function getDeliveryPrice(zone: string): number {
  return DELIVERY_AR[zone as keyof typeof DELIVERY_AR] || 0;
}

export function getZoneLabel(zone: string): string {
  const labels = {
    paris: 'Paris',
    petite: 'Petite couronne',
    grande: 'Grande couronne',
    retrait: 'Retrait sur place'
  };
  return labels[zone as keyof typeof labels] || 'Zone non détectée';
}