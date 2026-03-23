export type ActivityType = 
  | 'sitte'
  | 'rolig_gange'
  | 'rask_gange'
  | 'løpe'
  | 'rolig_sykling'
  | 'rask_sykling';

export interface UserPreferences {
  coldTolerance: 'fryser_lett' | 'normal' | 'varm_av_meg';
  noTights: boolean;
  preferWool: boolean;
}

export interface Wardrobe {
  hode: string[];
  overkropp: string[];
  underkropp: string[];
  fotter: string[];
  ekstra: string[];
}

export interface UserProfileData {
  preferences: UserPreferences;
  wardrobe: Wardrobe;
}

export const defaultPreferences: UserPreferences = {
  coldTolerance: 'normal',
  noTights: false,
  preferWool: true,
};

export const defaultWardrobe: Wardrobe = {
  hode: [],
  overkropp: [],
  underkropp: [],
  fotter: [],
  ekstra: []
};
