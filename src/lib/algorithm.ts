import { WeatherData } from './weather';

export type ActivityType = 'gå' | 'løpe' | 'sykle' | 'sitte';

export interface ClothingRecommendation {
  hode: string;
  overkropp: string[];
  underkropp: string[];
  fotter: string;
  ekstra: string[];
}

export function getClothingRecommendation(
  weather: WeatherData,
  activity: ActivityType,
  durationMinutes: number
): ClothingRecommendation {
  const rec: ClothingRecommendation = {
    hode: '',
    overkropp: [],
    underkropp: [],
    fotter: '',
    ekstra: []
  };

  // Aktivitetspåvirkning (løping gjør at man føler det varmere)
  let adjustedTemp = weather.feelsLike;
  if (activity === 'løpe') adjustedTemp += 7;
  if (activity === 'sykle') adjustedTemp += 3; // Vind kjøler, men man jobber litt
  if (activity === 'sitte') adjustedTemp -= 3;
  if (durationMinutes > 60) adjustedTemp -= 2; // Blir fortere kald hvis man er ute lenge

  // HODE
  if (adjustedTemp < 5) {
    rec.hode = 'Varm lue';
  } else if (adjustedTemp < 12) {
    rec.hode = 'Tynn lue eller pannebånd';
  } else if (weather.precipitation > 0) {
    rec.hode = 'Caps og hette';
  } else if (adjustedTemp > 20) {
    rec.hode = 'Caps mot solen';
  } else {
    rec.hode = 'Ingenting / Valgfritt';
  }

  // OVERKROPP
  if (adjustedTemp < 0) {
    rec.overkropp.push('Ulltrøye', 'Fleece eller tykk genser', 'Vind/vanntett jakke');
  } else if (adjustedTemp < 10) {
    rec.overkropp.push('Tynn ull/superundertøy', 'Tynn vindjakke eller treningsjakke');
  } else if (adjustedTemp < 18) {
    rec.overkropp.push('T-skjorte', 'Tynn genser over');
  } else {
    rec.overkropp.push('T-skjorte eller singlet');
  }

  // REGN? - Overstyr ytterlag
  if (weather.precipitation > 0 && activity !== 'løpe') {
    rec.overkropp.push('Regnjakke');
  } else if (weather.precipitation > 0 && activity === 'løpe') {
    rec.overkropp.push('Vannavvisende løpejakke');
  }

  // UNDERKROPP
  if (adjustedTemp < 0) {
    rec.underkropp.push('Ullstillongs', 'Turbukse/Vindbukse');
  } else if (adjustedTemp < 12) {
    rec.underkropp.push(activity === 'løpe' ? 'Løpetights' : 'Turbukse');
  } else if (adjustedTemp < 20) {
    rec.underkropp.push(activity === 'løpe' ? 'Kort tights' : 'Lett bukse/shorts');
  } else {
    rec.underkropp.push('Shorts');
  }

  if (weather.precipitation > 0 && activity === 'gå') {
    rec.underkropp.push('Regnbukse');
  }

  // FØTTER
  if (weather.precipitation > 2) {
    rec.fotter = activity === 'løpe' ? 'Terrengløpesko (Gore-Tex)' : 'Vanntette tursko eller støvler';
  } else if (adjustedTemp < 0) {
    rec.fotter = 'Varme vintersko med ullsokker';
  } else {
    rec.fotter = activity === 'gå' ? 'Lette tursko / joggesko' : 'Løpesko for asfalt/grus';
  }

  // EKSTRA
  if (adjustedTemp < 5) rec.ekstra.push('Hansker/Votter');
  if (adjustedTemp < 0) rec.ekstra.push('Buff / Hals');
  if (weather.windSpeed > 8) rec.ekstra.push('Spesielt vindblåsende: sjekk at ytterste lag er helt vindtett!');
  if (durationMinutes > 90) rec.ekstra.push('Drikkeflaske og litt energi');
  
  if (rec.ekstra.length === 0) rec.ekstra.push('Ingen spesielle ekstra behov. God tur!');

  return rec;
}