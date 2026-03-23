import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firebase";
import { UserProfileData, defaultPreferences, defaultWardrobe, UserPreferences, Wardrobe } from "./types";

// Lagrer e-post og navn når noen logger inn, så Admin kan se hvem det er
export async function saveUserBasicInfo(user: User) {
  const docRef = doc(db, "users", user.uid);
  await setDoc(docRef, {
    email: user.email,
    displayName: user.displayName,
    lastLogin: new Date().toISOString(),
  }, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfileData> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      preferences: { ...defaultPreferences, ...(data.preferences || {}) },
      wardrobe: { ...defaultWardrobe, ...(data.wardrobe || {}) }
    };
  } else {
    return { preferences: defaultPreferences, wardrobe: defaultWardrobe };
  }
}

export async function savePreferences(userId: string, preferences: UserPreferences) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { preferences }, { merge: true });
}

export async function saveWardrobe(userId: string, wardrobe: Wardrobe) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { wardrobe }, { merge: true });
}

// 👑 ADMIN-FUNKSJON: Hente oversikt over alle brukere
export async function getAllUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  }));
}
