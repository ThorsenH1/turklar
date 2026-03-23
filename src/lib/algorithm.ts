import { WeatherData } from './weather';
import { ActivityType, UserPreferences, Wardrobe } from './types';

export interface ClothingRecommendation {
  hode: string[];
  overkropp: string[];
  underkropp: string[];
  fotter: string[];
  ekstra: string[];
}

// Hjelpefunksjon for å velge fra brukerens garderobe hvis den finnes,
// ellers gi et generisk forslag.
function pickFromWardrobe(category: keyof Wardrobe, generic: string, wardrobe: Wardrobe): string {
  if (wardrobe[category] && wardrobe[category].length > 0) {
    // Veldig enkel match: Vi gir beskjed om hva brukeren "burde" se etter
    // i fremtiden kan vi gjøre string-matching (f.eks "regn", "ull") for å velge spesifikt.
    // Inntil videre kombinerer vi den generelle regelen med garderoben.
    return `${generic} (Fra garderoben din: ${wardrobe[category].join(' eller ')})`;
  }
  return generic;
}

export function getClothingRecommendation(
  weather: WeatherData,
  activity: ActivityType,
  durationMinutes: number,
  preferences: UserPreferences,
  wardrobe: Wardrobe
): ClothingRecommendation {
  const rec: ClothingRecommendation = {
    hode: [],
    overkropp: [],
    underkropp: [],
    fotter: [],
    ekstra: []
  };

  // --- BERGEN OG TEMPERATUR JUSTERINGER ---
  let adjustedTemp = weather.feelsLike;

  // 1. Aktivitetspåvirkning
  switch (activity) {
    case 'løpe': adjustedTemp += 8; break;
    case 'rask_gange': adjustedTemp += 4; break;
    case 'rolig_gange': adjustedTemp += 1; break;
    case 'rask_sykling': adjustedTemp += 5; break; // Du jobber, men mye vindavkjøling
    case 'rolig_sykling': adjustedTemp += 1; break;
    case 'sitte': adjustedTemp -= 3; break;
  }

  // 2. Tidsaspektet (du blir kaldere over tid)
  if (durationMinutes > 120) adjustedTemp -= 3;
  else if (durationMinutes > 60) adjustedTemp -= 1;

  // 3. Personlige Preferanser 
  if (preferences.coldTolerance === 'fryser_lett') adjustedTemp -= 4;
  if (preferences.coldTolerance === 'varm_av_meg') adjustedTemp += 4;

  const ullPref = preferences.preferWool ? 'Ull' : 'Superundertøy/Syntetisk';

  // --- HODE ---
  if (adjustedTemp < 5) {
    rec.hode.push(pickFromWardrobe('hode', 'Varm tykk lue', wardrobe));
  } else if (adjustedTemp < 12) {
    rec.hode.push(pickFromWardrobe('hode', 'Tynn lue eller pannebånd', wardrobe));
  } else if (weather.precipitation > 0) {
    rec.hode.push(pickFromWardrobe('hode', 'Caps mot regn', wardrobe));
  } else if (adjustedTemp > 20) {
    rec.hode.push(pickFromWardrobe('hode', 'Caps eller solhatt', wardrobe));
  } else {
    rec.hode.push('Ingenting nødvendig på hodet');
  }

  // --- OVERKROPP ---
  if (adjustedTemp < -5) {
    rec.overkropp.push(pickFromWardrobe('overkropp', `${ullPref} + Tykk Fleece/Ullgenser`, wardrobe));
    rec.overkropp.push(pickFromWardrobe('overkropp', 'Varm foret jakke (Dunjakke/Vinterjakke)', wardrobe));
  } else if (adjustedTemp < 5) {
    rec.overkropp.push(pickFromWardrobe('overkropp', `${ullPref}`, wardrobe));
    rec.overkropp.push(pickFromWardrobe('overkropp', 'Tynn mellomlagsgenser (Fleece/Ull)', wardrobe));
    rec.overkropp.push(pickFromWardrobe('overkropp', 'Vind-/Vanntett jakke (Skalljakke)', wardrobe));
  } else if (adjustedTemp < 13) {
    rec.overkropp.push(pickFromWardrobe('overkropp', `T-skjorte eller tynn langarmet`, wardrobe));
    rec.overkropp.push(pickFromWardrobe('overkropp', 'Lett vindjakke/treningsjakke', wardrobe));
  } else if (adjustedTemp < 20) {
    rec.overkropp.push(pickFromWardrobe('overkropp', 'T-skjorte', wardrobe));
  } else {
    rec.overkropp.push(pickFromWardrobe('overkropp', 'Singlet eller T-skjorte (luftig)', wardrobe));
  }

  // Regn-overstyring (Hvis det regner mer enn 0.2mm, legg til regnjakke hvis de ikke allerede har skalljakke)
  if (weather.precipitation > 0.2 && adjustedTemp >= 5) {
    if (activity === 'løpe' || activity === 'rask_sykling') {
      rec.overkropp.push('Vannavstøtende/lett treningsjakke (pga høy puls)');
    } else {
      rec.overkropp.push('Regnjakke');
    }
  }

  // --- UNDERKROPP ---
  if (adjustedTemp < -2) {
    const under = preferences.noTights ? 'Varm turbukse / Skibukse' : `${ullPref}-stilongs + foret bukse`;
    rec.underkropp.push(pickFromWardrobe('underkropp', under, wardrobe));
  } else if (adjustedTemp < 10) {
    if (activity === 'løpe') {
      rec.underkropp.push(pickFromWardrobe('underkropp', preferences.noTights ? 'Lett og fleksibel treningsbukse' : 'Tykk løpetights', wardrobe));
    } else {
      rec.underkropp.push(pickFromWardrobe('underkropp', 'Turbukse', wardrobe));
    }
  } else if (adjustedTemp < 18) {
    if (activity === 'løpe') {
      rec.underkropp.push(pickFromWardrobe('underkropp', preferences.noTights ? 'Lett shorts / treningsbukse' : 'Kort eller lang tights', wardrobe));
    } else {
      rec.underkropp.push(pickFromWardrobe('underkropp', 'Lett bukse (eller zip-off)', wardrobe));
    }
  } else {
    rec.underkropp.push(pickFromWardrobe('underkropp', 'Shorts', wardrobe));
  }

  if (weather.precipitation > 1.0 && (activity === 'rolig_gange' || activity === 'sitte')) {
    rec.underkropp.push(pickFromWardrobe('underkropp', 'Regnbukse', wardrobe));
  }

  // --- FØTTER ---
  if (weather.precipitation > 2 && (activity === 'rolig_gange' || activity === 'sitte' || activity === 'rolig_sykling')) {
    rec.fotter.push(pickFromWardrobe('fotter', 'Gummistøvler / Helt vanntette fjellsko', wardrobe));
  } else if (adjustedTemp < -2) {
    rec.fotter.push(pickFromWardrobe('fotter', 'Varme vintersko med ullsokker', wardrobe));
  } else if (activity === 'løpe' || activity === 'rask_gange') {
    rec.fotter.push(pickFromWardrobe('fotter', weather.precipitation > 0 ? 'Trail/Gore-Tex Løpesko' : 'Løpesko', wardrobe));
  } else if (activity === 'sykle' || activity === 'rask_sykling' || activity === 'rolig_sykling') {
    rec.fotter.push(pickFromWardrobe('fotter', 'Sneakers / Sykkelsko', wardrobe));
  } else {
    rec.fotter.push(pickFromWardrobe('fotter', 'Gode gåsko / tursko', wardrobe));
  }

  // --- EKSTRA ---
  if (adjustedTemp < 5) rec.ekstra.push(pickFromWardrobe('ekstra', 'Hansker og Skjerf/Buff', wardrobe));
  if (adjustedTemp < -5) rec.ekstra.push(pickFromWardrobe('ekstra', 'Votter oppleves varmere enn hansker!', wardrobe));
  if (weather.windSpeed > 8) rec.ekstra.push('Advarsel: Mye vind. Pass på at ytterlaget er helt vindtett!');
  if (durationMinutes > 90) rec.ekstra.push('Drikke og litt snacks/energi');
  if (adjustedTemp > 20 && weather.precipitation === 0) rec.ekstra.push('Solbriller og solkrem!');
  
  if (rec.ekstra.length === 0) rec.ekstra.push('Ingen spesielle behov for denne turen.');

  return rec;
}