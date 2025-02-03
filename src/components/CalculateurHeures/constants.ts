import { HeuresJour, Resultats } from './types';

export const defaultHours: Record<string, HeuresJour> = {
  lundi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  mardi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  mercredi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  jeudi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  vendredi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
};

export const defaultResults: Resultats = {
  totalReel: 40,
  heuresEffectives: 40,
  hn: 0,
  hs25: 0,
  hs50: 0,
  totalFinal: 0,
};
