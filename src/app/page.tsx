"use client";

import { useState, useEffect } from "react";
import { loginWithGoogle, logout, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getWeather, WeatherData } from "@/lib/weather";
import { getClothingRecommendation, ActivityType, ClothingRecommendation } from "@/lib/algorithm";
import { CloudRain, Wind, Thermometer, MapPin, Activity, Clock, LogOut, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityType>('gå');
  const [duration, setDuration] = useState<number>(60);
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWeatherAndRecommend = async () => {
    setLoading(true);
    // Standard lokasjon Bergen. (Senere: legg til navigator.geolocation)
    const w = await getWeather(60.3913, 5.3221); // Koordinater for Bergen
    setWeather(w);
    setRecommendation(getClothingRecommendation(w, activity, duration));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">TurKlar 🏔️</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline-block">Hei, {user.displayName}</span>
              <button 
                onClick={logout} 
                className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <LogOut size={16} /> Logg ut
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition-colors"
            >
              Logg inn med Google
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        {!user ? (
          <div className="text-center py-24 px-4 bg-white mt-10 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
              Hva skal du ha på deg i dag?
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              TurKlar kombinerer nøyaktige værdata med dine personlige preferanser og gir deg feilfrie klesanbefalinger. 
              Aldri frys, og aldri bli for varm!
            </p>
            <button 
              onClick={handleLogin} 
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 transition-all text-lg"
            >
              Kom i gang helt gratis
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-900 border-b border-slate-100 pb-4">
                <MapPin className="text-indigo-600" /> Planlegg turen
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Activity size={18} className="text-slate-400" /> Hva skal du gjøre?
                  </label>
                  <select 
                    value={activity} 
                    onChange={(e) => setActivity(e.target.value as ActivityType)}
                    className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="gå">Gå tur</option>
                    <option value="løpe">Løpetur</option>
                    <option value="sykle">Sykkeltur</option>
                    <option value="sitte">Sitte stille (f.eks på post)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" /> Hvor lenge? (Minutter)
                  </label>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="10" 
                    max="600"
                    className="w-full p-3.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={fetchWeatherAndRecommend}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Henter data...' : 'Få Klesanbefaling'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {weather && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">Været i Bergen</h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><Thermometer className="text-orange-500" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">TEMP / FØLES SOM</p>
                        <p className="font-bold text-lg text-slate-800">{weather.temperature}°C <span className="text-slate-400 font-normal">/ {weather.feelsLike}°C</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><Wind className="text-blue-500" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">VINDHASTIGHET</p>
                        <p className="font-bold text-lg text-slate-800">{weather.windSpeed} <span className="text-sm font-normal text-slate-500">m/s</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><CloudRain className="text-indigo-400" /></div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">NEDBØR</p>
                        <p className="font-bold text-lg text-slate-800">{weather.precipitation} <span className="text-sm font-normal text-slate-500">mm</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {recommendation && (
                <div className="bg-white p-8 rounded-3xl shadow-lg shadow-indigo-100/50 border border-indigo-50 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-emerald-800 border-b border-slate-100 pb-4">
                    <CheckCircle2 className="text-emerald-500" size={28} /> Perfekt Antrekk
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-wider mb-2 text-indigo-500">🧢 Hode</h4>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{recommendation.hode}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-wider mb-2 text-indigo-500">👕 Overkropp (Lag-på-lag)</h4>
                      <ul className="space-y-2">
                        {recommendation.overkropp.map((item, i) => (
                          <li key={i} className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">{i+1}</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-wider mb-2 text-indigo-500">👖 Underkropp</h4>
                      <ul className="space-y-2">
                        {recommendation.underkropp.map((item, i) => (
                          <li key={i} className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">{i+1}</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-wider mb-2 text-indigo-500">👟 Føtter</h4>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{recommendation.fotter}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 uppercase text-xs tracking-wider mb-2 text-indigo-500">🎒 Ekstra</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.ekstra.map((item, i) => (
                          <span key={i} className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
