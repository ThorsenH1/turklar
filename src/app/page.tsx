"use client";

import { useState, useEffect } from "react";
import { loginWithGoogle, logout, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getUserProfile, savePreferences, saveWardrobe, saveUserBasicInfo, getAllUsers } from "@/lib/db";
import { UserProfileData, defaultPreferences, defaultWardrobe, ActivityType, Wardrobe } from "@/lib/types";
import { getWeather, WeatherData } from "@/lib/weather";
import { getClothingRecommendation, ClothingRecommendation } from "@/lib/algorithm";
import { 
  CloudRain, Wind, Thermometer, MapPin, Activity, Clock, 
  LogOut, CheckCircle2, Settings, Shirt, Home as HomeIcon, Map, ShieldCheck, Mail
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData>({ preferences: defaultPreferences, wardrobe: defaultWardrobe });
  const [activeTab, setActiveTab] = useState<'planlegg' | 'garderobe' | 'preferanser' | 'admin'>('planlegg');
  
  // Sjekker om brukeren din er admin
  const isAdmin = user?.email === 'halvor.thorsenh@gmail.com';
  
  // Tursystem
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityType>('rolig_gange');
  const [duration, setDuration] = useState<number>(60);
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);
  const [locationName, setLocationName] = useState<string>('Venter på ditt valg...'); 

  // Admin-data
  const [allSystemUsers, setAllSystemUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Lagre at brukeren har logget inn
        await saveUserBasicInfo(u); 
        
        // Hent profildata
        const userProf = await getUserProfile(u.uid);
        setProfile(userProf);
      }
    });
    return () => unsub();
  }, []);

  // Laste administrator data hvis fanen endres
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      getAllUsers().then(setAllSystemUsers);
    }
  }, [activeTab, isAdmin]);

  const getLocationAndWeather = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocationName(`Min lokasjon (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`);
          await fetchAndCalculate(lat, lon);
        },
        async (error) => {
          console.warn("Kunne ikke hente posisjon, bruker Bergen", error);
          alert("Kunne ikke hente posisjon. Sjekk at du har gitt nettleseren tillatelse. Bruker Bergen som standard.");
          setLocationName('Bergen (Standard/Fallback)');
          await fetchAndCalculate(60.3913, 5.3221);
        }
      );
    } else {
      setLocationName('Bergen (Standard/Fallback)');
      fetchAndCalculate(60.3913, 5.3221);
    }
  };

  const fetchAndCalculate = async (lat: number, lon: number) => {
    try {
      const w = await getWeather(lat, lon);
      setWeather(w);
      setRecommendation(getClothingRecommendation(w, activity, duration, profile.preferences, profile.wardrobe));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (newPrefs: any) => {
    const updated = { ...profile.preferences, ...newPrefs };
    setProfile({ ...profile, preferences: updated });
    if (user) await savePreferences(user.uid, updated);
  };

  const handleAddWardrobeItem = async (category: keyof typeof profile.wardrobe, item: string) => {
    if (!item.trim()) return;
    const updatedWardrobe = { ...profile.wardrobe, [category]: [...profile.wardrobe[category], item] };
    setProfile({ ...profile, wardrobe: updatedWardrobe });
    if (user) await saveWardrobe(user.uid, updatedWardrobe);
  };

  const handleRemoveWardrobeItem = async (category: keyof typeof profile.wardrobe, index: number) => {
    const arr = [...profile.wardrobe[category]];
    arr.splice(index, 1);
    const updatedWardrobe = { ...profile.wardrobe, [category]: arr };
    setProfile({ ...profile, wardrobe: updatedWardrobe });
    if (user) await saveWardrobe(user.uid, updatedWardrobe);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('planlegg')}>
            🏔️ TurKlar <span className="text-xs bg-white text-indigo-700 px-2 py-1 rounded-full uppercase tracking-widest font-bold">Pro</span>
          </h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="opacity-80 text-sm hidden md:block">{user.email}</span>
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
              <button 
                onClick={logout} 
                className="flex items-center gap-2 bg-indigo-900/50 hover:bg-indigo-800/80 px-4 py-2 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Logg ut</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle} 
              className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-50 transition-all hover:scale-105"
            >
              Logg inn
            </button>
          )}
        </div>
      </header>

      {!user ? (
        <main className="max-w-4xl mx-auto p-4 py-16">
          <div className="text-center py-24 px-6 bg-white mt-10 rounded-[2rem] shadow-xl border border-slate-100 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight leading-tight">
              Smartere turklær, <br/><span className="text-indigo-600">skreddersydd for deg.</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed">
              Logg inn for å lagre din egen garderobe, stille inn dine kuldepreferanser, og bruk <b>din nøyaktige posisjon</b> for å få vite akkurat hva du bør ha på deg i dag!
            </p>
            <button 
              onClick={loginWithGoogle} 
              className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all text-lg"
            >
              Start planleggingen gratis
            </button>
          </div>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto p-4 py-8">
          
          <div className="flex flex-wrap justify-center bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 mb-8 w-fit mx-auto">
            <button 
              onClick={() => setActiveTab('planlegg')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'planlegg' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <HomeIcon size={18} /> Planlegg Tur
            </button>
            <button 
              onClick={() => setActiveTab('garderobe')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'garderobe' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Shirt size={18} /> Min Garderobe
            </button>
            <button 
              onClick={() => setActiveTab('preferanser')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'preferanser' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings size={18} /> Preferanser
            </button>
            
            {/* KUN FOR ADMIN */}
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ml-4 ${activeTab === 'admin' ? 'bg-red-100 text-red-700' : 'text-red-400 hover:bg-red-50'}`}
              >
                <ShieldCheck size={18} /> Admin {allSystemUsers.length > 0 && `(${allSystemUsers.length})`}
              </button>
            )}
          </div>

          {/* TAB: PLANLEGG TUR */}
          {activeTab === 'planlegg' && (
            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* SKJEMA */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-4">
                  <MapPin className="text-indigo-600" /> Planlegg for dagens tur
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Activity size={18} className="text-slate-400" /> Hvilket tempo?
                    </label>
                    <select 
                      value={activity} 
                      onChange={(e) => setActivity(e.target.value as ActivityType)}
                      className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    >
                      <option value="sitte">Sitte stille (Post/Bål)</option>
                      <option value="rolig_gange">Rolig Gange / Vandring</option>
                      <option value="rask_gange">Rask Gange / Topptur</option>
                      <option value="løpe">Løpetur</option>
                      <option value="rolig_sykling">Rolig Sykkeltur</option>
                      <option value="rask_sykling">Rask Sykkeltur (Trening)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Clock size={18} className="text-slate-400" /> Varighet: <span className="text-indigo-600">{duration} minutter</span>
                    </label>
                    <input 
                      type="range" 
                      value={duration} 
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="10" 
                      max="300"
                      step="10"
                      className="w-full mt-2 accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                      <span>Kort</span>
                      <span>5 Timer</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={getLocationAndWeather}
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
                    >
                      {loading ? 'Henter inn data...' : (
                        <><Map size={20} /> Bruk min posisjon & Beregn</>
                      )}
                    </button>
                    {weather && (
                      <p className="text-xs text-center text-slate-400 mt-3">Anvendt lokasjon: {locationName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RESULTATER */}
              <div className="space-y-6">
                {weather && (
                  <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-lg animate-in zoom-in-95 duration-500">
                    <h3 className="text-sm font-bold text-indigo-300 mb-4 tracking-widest uppercase">Lokalt Vær Nå</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-xs text-indigo-300 font-medium tracking-wider">TEMP / FØLES SOM</p>
                        <p className="font-bold text-2xl">{weather.temperature}° <span className="text-indigo-400 font-normal text-lg">/ {weather.feelsLike}°</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-300 font-medium tracking-wider">VINDHASTIGHET</p>
                        <p className="font-bold text-2xl">{weather.windSpeed} <span className="text-sm font-normal text-indigo-400">m/s</span></p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-indigo-300 font-medium tracking-wider">NEDBØR SISTE TIME</p>
                        <p className="font-bold text-lg flex items-center gap-2">
                          <CloudRain size={20} className={weather.precipitation > 0 ? 'text-blue-300' : 'text-slate-400'} /> 
                          {weather.precipitation} mm
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {recommendation && (
                  <div className="bg-emerald-500 p-8 rounded-3xl shadow-xl text-white animate-in slide-in-from-right-8 duration-700">
                    <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-3 border-b border-emerald-400 pb-4">
                      <CheckCircle2 className="text-white" size={32} /> Tilpasset Antrekk
                    </h3>
                    
                    <div className="space-y-6">
                      {Object.entries(recommendation).map(([k, v]) => {
                        const recArray = v as string[];
                        if (recArray.length === 0) return null;
                        
                        const titles: Record<string, string> = { hode: '🧢 Hode', overkropp: '👕 Overkropp (Lag-på-lag)', underkropp: '👖 Underkropp', fotter: '👟 Føtter', ekstra: '🎒 Valgfritt Ekstra' };
                        
                        return (
                          <div key={k}>
                            <h4 className="font-bold text-emerald-100 uppercase text-xs tracking-widest mb-2">{titles[k]}</h4>
                            <ul className="space-y-2">
                              {recArray.map((item, i) => (
                                <li key={i} className="text-white bg-emerald-600/50 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-400/50 flex items-start gap-3 shadow-sm font-medium">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MIN GARDEROBE */}
          {activeTab === 'garderobe' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-300">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                  <Shirt className="text-indigo-600" size={32}/> Min Garderobe
                </h2>
                <p className="text-slate-500 mt-2 text-lg">Vi skreddersyr anbefalingene basert på nøyaktig det du eier.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {(['hode', 'overkropp', 'underkropp', 'fotter', 'ekstra'] as (keyof Wardrobe)[]).map((category) => (
                  <div key={category} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 capitalize mb-4 text-indigo-900 border-b border-slate-200 pb-2">
                      {category}
                    </h3>
                    
                    <ul className="space-y-2 mb-4">
                      {(profile.wardrobe[category as keyof Wardrobe] || []).map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-sm font-medium text-slate-700">
                          {item}
                          <button onClick={() => handleRemoveWardrobeItem(category as keyof Wardrobe, idx)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-red-50 rounded-md">
                            Fjern
                          </button>
                        </li>
                      ))}
                      {(profile.wardrobe[category as keyof Wardrobe] || []).length === 0 && (
                        <p className="text-sm text-slate-400 italic">Ingenting lagt til</p>
                      )}
                    </ul>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('item') as HTMLInputElement;
                      handleAddWardrobeItem(category as keyof Wardrobe, input.value);
                      input.value = '';
                    }} className="flex gap-2">
                      <input name="item" type="text" placeholder="Legg til et nytt plagg..." className="flex-1 p-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500" autoComplete="off" />
                      <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors">Legg til</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PREFERANSER */}
          {activeTab === 'preferanser' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-300 max-w-2xl mx-auto">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                  <Settings className="text-indigo-600" size={32}/> Mine Preferanser
                </h2>
              </div>

              <div className="space-y-8">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <label className="block font-bold text-indigo-900 mb-4 text-lg">Hvordan takler du kulde?</label>
                  <div className="flex flex-col gap-3">
                    {[
                      { val: 'fryser_lett', label: '🥶 Jeg fryser lett (Trenger tykkere klær)' },
                      { val: 'normal', label: '😐 Helt vanlig (Standard)' },
                      { val: 'varm_av_meg', label: '🥵 Jeg er uansett varm (Mindre klær)' },
                    ].map((opt) => (
                      <label key={opt.val} className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${profile.preferences.coldTolerance === opt.val ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent hover:bg-indigo-100'}`}>
                        <input type="radio" value={opt.val} checked={profile.preferences.coldTolerance === opt.val} onChange={() => handleSavePreferences({ coldTolerance: opt.val })} className="w-5 h-5 accent-indigo-600" />
                        <span className="font-semibold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <h4 className="font-bold text-slate-800">Forby Tights?</h4>
                      <p className="text-sm text-slate-500">Om du ikke vil ha anbefalinger om tights selv til løping.</p>
                    </div>
                    <input type="checkbox" checked={profile.preferences.noTights} onChange={(e) => handleSavePreferences({ noTights: e.target.checked })} className="w-6 h-6 rounded accent-indigo-600" />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <h4 className="font-bold text-slate-800">Foretrekker Ull?</h4>
                      <p className="text-sm text-slate-500">Gi råd om Ull foran syntetisk superundertøy.</p>
                    </div>
                    <input type="checkbox" checked={profile.preferences.preferWool} onChange={(e) => handleSavePreferences({ preferWool: e.target.checked })} className="w-6 h-6 rounded accent-indigo-600" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADMIN (Kun for Halvor) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-red-100 animate-in fade-in duration-300">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-4xl font-extrabold text-slate-800 flex items-center gap-3">
                  <ShieldCheck className="text-red-500" size={40}/> Kontrollpanel (Admin)
                </h2>
                <p className="text-slate-500 mt-2 text-lg">
                  Hei Halvor! Her har du totalt oversikt over alle som bruker appen din!
                </p>
              </div>

              <div className="bg-red-50 text-red-900 border border-red-200 p-6 rounded-2xl mb-8 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-red-400">Database-Status</p>
                  <p className="text-3xl font-extrabold">{allSystemUsers.length} registrerte brukere</p>
                </div>
                <div className="bg-white p-3 rounded-full shadow-sm text-red-500">
                  <ShieldCheck size={32} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white border border-slate-200 rounded-xl shadow-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4 rounded-tl-xl border-b border-slate-200">Navn</th>
                      <th className="p-4 border-b border-slate-200">E-post / ID</th>
                      <th className="p-4 border-b border-slate-200">Sist Innlogget</th>
                      <th className="p-4 border-b border-slate-200">Klær i Garderobe</th>
                      <th className="p-4 rounded-tr-xl border-b border-slate-200">Kuldetoleranse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allSystemUsers.map((u, i) => {
                      // Telle totalt antall klær:
                      let clothesCount = 0;
                      if (u.wardrobe) {
                        clothesCount += (u.wardrobe.hode?.length || 0) + (u.wardrobe.overkropp?.length || 0) + (u.wardrobe.underkropp?.length || 0) + (u.wardrobe.fotter?.length || 0) + (u.wardrobe.ekstra?.length || 0);
                      }

                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{u.displayName || 'Ukjent Navn'}</td>
                          <td className="p-4">
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                              <Mail size={14} /> {u.email || 'Ukjent'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Aldri'}
                          </td>
                          <td className="p-4 font-semibold text-emerald-600">{clothesCount} plagg lagret</td>
                          <td className="p-4 text-slate-600 capitalize text-sm">
                            {u.preferences?.coldTolerance?.replace('_', ' ') || 'Normal'}
                          </td>
                        </tr>
                      )
                    })}
                    {allSystemUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">Ingen brukere funnet enda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      )}
    </div>
  );
}
