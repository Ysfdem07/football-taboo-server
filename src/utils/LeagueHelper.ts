import { ImageSourcePropType } from 'react-native';

export interface LeagueInfo {
  id: string;
  name: string;
  minKp: number;
  maxKp: number;
  color: string;
  glowColor: string;
  badgeBg: [string, string];
  tierTitle: string;
  vectorIcon: string;
}

export const getLeagues = (lang: 'tr' | 'en' = 'tr'): LeagueInfo[] => [
  { 
    id: 'amateur',
    name: lang === 'en' ? 'Amateur League' : 'Amatör Küme', 
    minKp: 0, 
    maxKp: 500, 
    color: '#94A3B8',
    glowColor: 'rgba(148, 163, 184, 0.6)',
    badgeBg: ['#334155', '#0F172A'],
    tierTitle: lang === 'en' ? 'AMATEUR' : 'AMATÖR',
    vectorIcon: 'shield-outline'
  },
  { 
    id: 'league3',
    name: lang === 'en' ? 'League 3' : '3. Lig', 
    minKp: 501, 
    maxKp: 1500, 
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.7)',
    badgeBg: ['#78350F', '#1F2937'],
    tierTitle: lang === 'en' ? 'BRONZE' : 'BRONZ',
    vectorIcon: 'shield-sharp'
  },
  { 
    id: 'league2',
    name: lang === 'en' ? 'League 2' : '2. Lig', 
    minKp: 1501, 
    maxKp: 3000, 
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    badgeBg: ['#0284C7', '#0F172A'],
    tierTitle: lang === 'en' ? 'SILVER' : 'GÜMÜŞ',
    vectorIcon: 'ribbon-outline'
  },
  { 
    id: 'league1',
    name: lang === 'en' ? 'League 1' : '1. Lig', 
    minKp: 3001, 
    maxKp: 5000, 
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    badgeBg: ['#B45309', '#451A03'],
    tierTitle: lang === 'en' ? 'GOLD' : 'ALTIN',
    vectorIcon: 'medal-outline'
  },
  { 
    id: 'champions',
    name: lang === 'en' ? 'Champions League' : 'Şampiyonlar Ligi', 
    minKp: 5001, 
    maxKp: Infinity, 
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.9)',
    badgeBg: ['#BE185D', '#4C0519'],
    tierTitle: lang === 'en' ? 'CHAMPION' : 'ŞAMPİYON',
    vectorIcon: 'trophy-sharp'
  }
];

// Fallback constant for backwards compatibility where language isn't readily available
export const LEAGUES: LeagueInfo[] = getLeagues('tr');

export const CATEGORY_LEAGUE_LOGOS: Record<string, Record<string, ImageSourcePropType>> = {
  football: {
    amateur: require('../../assets/leagues/football_amateur.png'),
    league3: require('../../assets/leagues/football_league3.png'),
    league2: require('../../assets/leagues/football_league2.png'),
    league1: require('../../assets/leagues/football_league1.png'),
    champions: require('../../assets/leagues/football_champions.png'),
  },
  music: {
    amateur: require('../../assets/leagues/music_amateur.png'),
    league3: require('../../assets/leagues/music_league3.png'),
    league2: require('../../assets/leagues/music_league2.png'),
    league1: require('../../assets/leagues/music_league1.png'),
    champions: require('../../assets/leagues/music_champions.png'),
  },
  cinema: {
    amateur: require('../../assets/leagues/cinema_amateur.png'),
    league3: require('../../assets/leagues/cinema_league3.png'),
    league2: require('../../assets/leagues/cinema_league2.png'),
    league1: require('../../assets/leagues/cinema_league1.png'),
    champions: require('../../assets/leagues/cinema_champions.png'),
  }
};

export function getLeagueForKp(kp: number, lang: 'tr' | 'en' = 'tr'): LeagueInfo {
  const leagues = getLeagues(lang);
  return leagues.find(l => kp >= l.minKp && kp <= l.maxKp) || leagues[0];
}

export function getLeagueLogo(categoryId: string, leagueId: string): ImageSourcePropType {
  const baseCat = categoryId.replace('_en', '');
  const catMap = CATEGORY_LEAGUE_LOGOS[baseCat] || CATEGORY_LEAGUE_LOGOS.football;
  return catMap[leagueId] || catMap.amateur;
}
