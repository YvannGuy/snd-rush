export type Inventory = {
  speakers: {
    AS108: { qty: number; power: 'compact'; bt: boolean };
    AS115: { qty: number; power: 'mid'; bt: false };
    FBT115: { qty: number; power: 'full'; bt: false };
  };
  subs: { FBT118: { qty: number } };
  mixers: { PROMIX8: { qty: number }, PROMIX16: { qty: number } };
  mics: { SHURE_SM58: { qty: number }, MIPRO_WIRELESS: { qty: number } };
};

export const INVENTORY: Inventory = {
  speakers: {
    AS108:  { qty: 2, power: 'compact', bt: true },
    AS115:  { qty: 2, power: 'mid',     bt: false },
    FBT115: { qty: 2, power: 'full',    bt: false },
  },
  subs: { FBT118: { qty: 1 } },
  mixers: { PROMIX8: { qty: 1 }, PROMIX16: { qty: 1 } },
  mics: { SHURE_SM58: { qty: 5 }, MIPRO_WIRELESS: { qty: 2 } },
};
