import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { Plane, MapPin, DollarSign, Calendar, Sparkles, ArrowRight, Globe, Sun, Umbrella, Compass, Star, ChevronRight, Crosshair, Loader2 } from "lucide-react";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
];

type TripFormData = {
  destination: string;
  budget: string;
  currency: string;
  startDate: string;
  endDate: string;
  preferences: string;
  latitude: string;
  longitude: string;
};

const DESTINATIONS = [
  {
    name: "Bali, Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    tag: "Tropical Paradise",
  },
  {
    name: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    tag: "Cultural Hub",
  },
  {
    name: "Paris, France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    tag: "City of Light",
  },
  {
    name: "Santorini, Greece",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80",
    tag: "Coastal Beauty",
  },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85";

export default function Home() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TripFormData>({
    destination: "",
    budget: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    preferences: "",
    latitude: "",
    longitude: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("destination", formData.destination);
    params.set("budget", formData.budget);
    params.set("currency", formData.currency);
    if (formData.startDate) params.set("startDate", formData.startDate);
    if (formData.endDate) params.set("endDate", formData.endDate);
    if (formData.preferences) params.set("preferences", formData.preferences);
    if (formData.latitude) params.set("latitude", formData.latitude);
    if (formData.longitude) params.set("longitude", formData.longitude);
    navigate(`/results?${params.toString()}`);
  };

  const updateField = (field: keyof TripFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Try again or enter manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Try again.");
            break;
          default:
            setLocationError("Could not get your location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const quickSelect = (dest: string) => {
    setFormData(prev => ({ ...prev, destination: dest }));
    document.getElementById("destination")?.focus();
  };

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          role="img"
          aria-label="Woman with suitcase walking towards a scenic mountain destination at sunset"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 via-[#0F172A]/40 to-[#0F172A]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-primary/10" />

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] text-white/5 animate-float">
            <Plane className="w-20 h-20" />
          </div>
          <div className="absolute top-40 right-[15%] text-white/5 animate-float" style={{ animationDelay: "2s" }}>
            <Globe className="w-14 h-14" />
          </div>
          <div className="absolute bottom-40 left-[20%] text-white/5 animate-float" style={{ animationDelay: "4s" }}>
            <Compass className="w-16 h-16" />
          </div>
          <div className="absolute bottom-60 right-[10%] text-accent/10 animate-float" style={{ animationDelay: "3s" }}>
            <Star className="w-12 h-12" />
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 text-accent" />
                AI-Powered Travel Planning
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
                Explore the{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-amber-400 to-primary">
                  World
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-light text-white/90">
                  with AI Agents
                </span>
              </h1>
              <p className="text-lg text-white/70 max-w-lg mx-auto lg:mx-0 mb-8 font-sans">
                Six specialized AI agents — Flights, Hotels, Restaurants, Attractions, Budget, and Weather — collaborate in real-time to build your perfect itinerary.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                {[
                  { icon: Plane, label: "Flights" },
                  { icon: MapPin, label: "Hotels" },
                  { icon: Umbrella, label: "Activities" },
                  { icon: Sun, label: "Weather" },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/80">
                    <feat.icon className="w-3.5 h-3.5 text-accent" />
                    {feat.label}
                  </div>
                ))}
              </div>

              {/* Quick Destinations */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                <span className="text-xs text-white/50 font-sans">Popular:</span>
                {["Bali", "Tokyo", "Paris", "NYC"].map((city) => (
                  <button
                    key={city}
                    onClick={() => quickSelect(city)}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Trip Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto fade-in-up stagger-2">
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 space-y-5 border border-accent/20 shadow-xl shadow-accent/10"
              >
                <h2 className="text-lg font-heading font-bold text-white text-center flex items-center justify-center gap-2">
                  <Plane className="w-5 h-5 text-accent" />
                  Where to next?
                </h2>

                {/* Destination */}
                <div className={`transition-all duration-200 ${focusedField === "destination" ? "scale-[1.02]" : ""}`}>
                  <label htmlFor="destination" className="block text-sm font-medium text-white/80 mb-1.5">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                    <input
                      id="destination"
                      type="text"
                      value={formData.destination}
                      onChange={(e) => updateField("destination", e.target.value)}
                      onFocus={() => setFocusedField("destination")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                      placeholder="e.g. Bali, Tokyo, Paris..."
                      required
                    />
                  </div>
                </div>

                {/* Budget + Currency */}
                <div className={`transition-all duration-200 ${focusedField === "budget" ? "scale-[1.02]" : ""}`}>
                  <label htmlFor="budget" className="block text-sm font-medium text-white/80 mb-1.5">
                    Total Budget
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative col-span-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                      <input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => updateField("budget", e.target.value)}
                        onFocus={() => setFocusedField("budget")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                        placeholder="e.g. 2000"
                        min={1}
                        required
                      />
                    </div>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className="px-2 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm appearance-none cursor-pointer text-center"
                      aria-label="Currency"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="text-gray-900 bg-white">
                          {c.symbol} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-white/80 mb-1.5">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                      <input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateField("startDate", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white [color-scheme:dark] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-white/80 mb-1.5">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
                      <input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateField("endDate", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white [color-scheme:dark] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-white/80">
                      Your Location <span className="text-white/40 font-normal">(optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locating}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {locating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Crosshair className="w-3.5 h-3.5" />
                      )}
                      {locating ? "Detecting..." : "Use My Location"}
                    </button>
                  </div>
                  {formData.latitude && formData.latitude ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-xs">
                      <Crosshair className="w-3.5 h-3.5" />
                      Location detected — AI will use it for accurate suggestions
                    </div>
                  ) : locationError ? (
                    <div className="text-red-300 text-xs mt-1">{locationError}</div>
                  ) : null}
                </div>

                {/* Preferences */}
                <div>
                  <label htmlFor="preferences" className="block text-sm font-medium text-white/80 mb-1.5">
                    Preferences <span className="text-white/40 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="preferences"
                    value={formData.preferences}
                    onChange={(e) => updateField("preferences", e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm resize-none"
                    placeholder="e.g. I love street food, adventure, and beach vibes..."
                    rows={2}
                  />
                </div>

                <button type="submit" className="btn-primary w-full justify-center text-sm group relative overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-dark via-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Plan My Trip</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform relative z-10" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-white/60 animate-pulse-slow" />
          </div>
        </div>
      </section>

      {/* ===== DESTINATION SHOWCASE ===== */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-sunset-gradient opacity-5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto font-sans">
              Let AI plan your perfect getaway to these amazing places
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DESTINATIONS.map((dest, idx) => (
              <button
                key={dest.name}
                onClick={() => quickSelect(dest.name)}
                className={`img-card rounded-2xl h-56 sm:h-64 group cursor-pointer text-left fade-in-up ${`stagger-${idx + 1}`}`}
                style={{ backgroundImage: `url(${dest.image})` }}
                aria-label={`Plan a trip to ${dest.name}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
                <div className="relative z-10 flex flex-col justify-end h-full p-5">
                  <span className="text-xs font-medium text-accent bg-accent/20 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit mb-2">
                    {dest.tag}
                  </span>
                  <h3 className="text-lg font-heading font-bold text-white">{dest.name}</h3>
                  <div className="flex items-center gap-1 text-white/60 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Plan trip</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto font-sans">
              Six AI agents work together in real-time to build your complete travel plan
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Enter Your Details",
                desc: "Tell us your destination, budget, and preferences. It takes just 30 seconds.",
                icon: MapPin,
                color: "text-primary",
                bg: "bg-primary/5",
              },
              {
                step: "02",
                title: "AI Agents Plan",
                desc: "Six specialists analyze flights, hotels, food, attractions, budget, and weather for you.",
                icon: Sparkles,
                color: "text-accent",
                bg: "bg-accent/5",
              },
              {
                step: "03",
                title: "Get Your Itinerary",
                desc: "See your complete day-by-day plan stream in live. Save it for later or share it.",
                icon: Globe,
                color: "text-green-600",
                bg: "bg-green-50",
              },
            ].map((item) => (
              <div key={item.step} className="card text-center p-8 hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <div className="text-sm text-primary font-bold mb-1 font-sans">Step {item.step}</div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BANNER ===== */}
      <section className="py-16 relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-[#0F172A]/80" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "6", label: "AI Agents" },
              { number: "50+", label: "Destinations" },
              { number: "10k+", label: "Trips Planned" },
              { number: "< 30s", label: "Planning Time" },
            ].map((stat) => (
              <div key={stat.label} className="fade-in-up">
                <div className="text-3xl sm:text-4xl font-heading font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-white/60 font-sans">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-hero-gradient opacity-5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="text-gray-500 font-sans mb-8 max-w-lg mx-auto">
            Join TripMate and let AI handle the planning. Your dream trip is just a few clicks away.
          </p>
          <button
            onClick={() => {
              document.getElementById("destination")?.focus();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="btn-primary text-base"
          >
            Start Planning Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <footer className="mt-20 text-center text-sm text-gray-400 font-sans">
          <p>&copy; 2026 TripMate. Plan smarter. Travel further.</p>
        </footer>
      </section>
    </div>
  );
}