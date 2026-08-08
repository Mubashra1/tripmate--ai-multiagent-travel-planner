import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Tables } from "../lib/database.types";
import {
  ArrowLeft, Loader2, AlertCircle, MapPin, DollarSign,
  Calendar, Plane, Building2, UtensilsCrossed, Sun,
  Trash2, Backpack, Sparkles, Lightbulb, Check, Star,
  Clock, Download
} from "lucide-react";
import {
  parseFlights, parseHotels, parseRestaurants, parseAttractions,
  parseBudget, parseWeather,
} from "../utils/parsers";
import type {
  FlightItem, HotelItem, RestaurantItem, AttractionItem,
  BudgetData, WeatherData,
} from "../utils/parsers";

type Trip = Tables<"trips">;

// ── Cost Reduction Tips ──────────────────────────────────────────────────

const COST_TIPS = [
  { icon: "📅", title: "Travel Off-Peak", desc: "Fly mid-week (Tue-Wed) and avoid holiday seasons for 20-40% cheaper flights and hotels." },
  { icon: "🏠", title: "Stay Outside City Center", desc: "Book accommodation a 15-20 min transit from the center — prices drop by half." },
  { icon: "🍜", title: "Eat Like a Local", desc: "Skip tourist-trap restaurants. Visit local markets and street food for authentic meals at 1/3 the price." },
  { icon: "🚶", title: "Walk & Use Public Transit", desc: "Most attractions are walkable. Use day-pass metro/bus tickets instead of taxis or ride-shares." },
  { icon: "🎫", title: "Look for City Passes", desc: "Many cities offer tourist passes with free museum entry and transit included — saves 30-50%." },
  { icon: "💧", title: "Carry a Reusable Bottle", desc: "Fill up at your hotel or public fountains. Saves $3-5 per drink and is eco-friendly." },
];

// ── Parsed card components (reused from TabViews) ────────────────────────

function FlightCards({ items }: { items: FlightItem[] }) {
  if (!items.length) return <p className="text-gray-400 text-sm text-center py-8">No flight data available.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border/60 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-heading font-bold text-foreground text-sm">{item.airline}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-gray-500">{item.rating}</span>
              </div>
            </div>
            {item.tag && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                i === 0 ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
              }`}>
                {item.tag.includes("Best value") ? "Best Value" : item.tag.includes("Recommended") ? "Recommended" : "Budget"}
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            {item.priceRange && <p>{item.priceRange}</p>}
            {item.duration && <p className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</p>}
            {item.stops && <p className="text-gray-400">{item.stops}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function HotelCards({ items }: { items: HotelItem[] }) {
  if (!items.length) return <p className="text-gray-400 text-sm text-center py-8">No hotel data available.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border/60 p-4 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: item.stars?.match(/★/g)?.length || 0 }).map((_, si) => (
              <Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h4 className="font-heading font-bold text-foreground text-sm mb-1">{item.name}</h4>
          <div className="space-y-1 text-xs text-gray-500">
            {item.pricePerNight && <p className="font-semibold text-foreground">{item.pricePerNight} /night</p>}
            {item.vibe && <p>{item.vibe}</p>}
            {item.amenities && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{item.amenities}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RestaurantCards({ items }: { items: RestaurantItem[] }) {
  if (!items.length) return <p className="text-gray-400 text-sm text-center py-8">No restaurant data available.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border/60 p-4 shadow-sm">
          <h4 className="font-heading font-bold text-foreground text-sm">{item.name}</h4>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mt-1 mb-2">{item.cuisine}</span>
          <div className="space-y-1 text-xs text-gray-500">
            {item.cost && <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{item.cost}</p>}
            {item.description && <p>{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttractionCards({ items }: { items: AttractionItem[] }) {
  if (!items.length) return <p className="text-gray-400 text-sm text-center py-8">No attractions data available.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border/60 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-heading font-bold text-foreground text-sm">{item.name}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{item.category}</span>
          </div>
          <div className="space-y-1 text-xs text-gray-500">
            {item.cost && <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{item.cost}</p>}
            {item.timeNeeded && <p className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.timeNeeded}</p>}
            {item.description && <p className="mt-1">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetView({ data, currency }: { data: BudgetData; currency?: string }) {
  if (!data.categories.length) return <p className="text-gray-400 text-sm text-center py-8">No budget data available.</p>;
  const sym = currency === "PKR" ? "₨" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return (
    <div className="space-y-3">
      {data.categories.map((cat, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-foreground">{cat.name}</span>
            <span className="text-xs font-semibold text-foreground">{sym}{cat.amount.toLocaleString()} <span className="text-gray-400 font-normal">{cat.percentage}%</span></span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: i === 0 ? "oklch(0.6847 0.1479 237.32)" : i === 1 ? "oklch(0.6461 0.1943 41.12)" : i === 2 ? "oklch(0.6461 0.1283 167.25)" : i === 3 ? "oklch(0.6461 0.1693 294.32)" : "oklch(0.7535 0.139 232.66)" }} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-400">Total</p>
          <p className="text-sm font-bold text-foreground">{sym}{data.total.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-400">Remaining</p>
          <p className="text-sm font-bold text-blue-700">{sym}{data.remaining.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function WeatherView({ data }: { data: WeatherData }) {
  if (!data.temperatureRange && !data.conditions) return <p className="text-gray-400 text-sm text-center py-8">No weather data available.</p>;
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {data.temperatureRange && <p><span className="text-gray-400">Temperature:</span> <span className="font-medium">{data.temperatureRange}</span></p>}
          {data.conditions && <p><span className="text-gray-400">Conditions:</span> <span className="font-medium">{data.conditions}</span></p>}
          {data.precipitationChance && <p><span className="text-gray-400">Precipitation:</span> <span className="font-medium">{data.precipitationChance}</span></p>}
          {data.humidity && <p><span className="text-gray-400">Humidity:</span> <span className="font-medium">{data.humidity}</span></p>}
        </div>
      </div>
      {data.packingList.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-4 shadow-sm" id="packing">
          <h4 className="font-heading font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-primary" /> Packing List
          </h4>
          <ul className="space-y-1.5">
            {data.packingList.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

type TabKey = "flights" | "hotels" | "restaurants" | "attractions" | "budget" | "weather" | "tips";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "flights", label: "Flights", icon: Plane },
  { key: "hotels", label: "Hotels", icon: Building2 },
  { key: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { key: "attractions", label: "Attractions", icon: MapPin },
  { key: "budget", label: "Budget", icon: DollarSign },
  { key: "weather", label: "Weather", icon: Sun },
  { key: "tips", label: "Cost Tips", icon: Lightbulb },
];

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("flights");

  useEffect(() => {
    if (!id || !user) return;
    loadTrip();

    // Read initial tab from URL search params (e.g. ?tab=weather#packing)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as TabKey | null;
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [id, user]);

  const loadTrip = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id!)
      .eq("user_id", user!.id)
      .single();

    if (error) {
      setError(error.message || "Trip not found");
    } else {
      setTrip(data);
    }
    setLoading(false);
  };

  const deleteTrip = async () => {
    if (!confirm("Delete this trip?")) return;
    setDeleting(true);
    await supabase.from("trips").delete().eq("id", id!);
    navigate("/dashboard");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 font-sans">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card text-center py-12 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Trip not found</h2>
          <p className="text-gray-500 text-sm mb-4 font-sans">{error || "This trip doesn't exist or you don't have access."}</p>
          <Link to="/dashboard" className="btn-primary text-sm inline-flex">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const itinerary = trip.itinerary as Record<string, string> || {};

  // Parse all data
  const parsed = {
    flights: parseFlights(itinerary.flight || ""),
    hotels: parseHotels(itinerary.hotel || ""),
    restaurants: parseRestaurants(itinerary.restaurant || ""),
    attractions: parseAttractions(itinerary.attractions || ""),
    budget: parseBudget(itinerary.budget || ""),
    weather: parseWeather(itinerary.weather || ""),
  };

  const currency = trip.currency || "USD";

  return (
    <div className="min-h-screen py-8 relative">
      <div className="absolute inset-0 bg-hero-gradient opacity-3" />
      <div className="absolute inset-0 bg-warm-glow" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 fade-in-up">
          <div>
            <button onClick={() => navigate("/dashboard")} className="btn-ghost text-sm flex items-center gap-2 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 font-sans">
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <MapPin className="w-4 h-4" />
                {trip.destination}
              </span>
              {trip.budget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  ${trip.budget.toLocaleString()}
                </span>
              )}
              {trip.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(trip.start_date)}
                  {trip.end_date && ` — ${formatDate(trip.end_date)}`}
                </span>
              )}
            </div>
          </div>
          <button onClick={deleteTrip} disabled={deleting} className="btn-ghost text-sm text-gray-400 hover:text-destructive cursor-pointer">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Packing List Quick Button */}
        <button
          onClick={() => {
            // Scroll to packing list in weather tab
            setActiveTab("weather");
            setTimeout(() => {
              document.getElementById("packing")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary text-sm font-medium hover:from-primary/20 hover:to-accent/20 transition-all cursor-pointer"
        >
          <Backpack className="w-5 h-5" />
          View Packing List
          <Sparkles className="w-3.5 h-3.5 text-accent" />
        </button>

        {/* Tab Navigation */}
        <nav className="sticky top-0 z-20 -mx-1 px-1 pb-1 overflow-x-auto scrollbar-none mb-4">
          <div className="flex gap-1.5 min-w-max p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="space-y-4 fade-in-up">
          {activeTab === "flights" && <FlightCards items={parsed.flights} />}
          {activeTab === "hotels" && <HotelCards items={parsed.hotels} />}
          {activeTab === "restaurants" && <RestaurantCards items={parsed.restaurants} />}
          {activeTab === "attractions" && <AttractionCards items={parsed.attractions} />}
          {activeTab === "budget" && <BudgetView data={parsed.budget} currency={currency} />}
          {activeTab === "weather" && <WeatherView data={parsed.weather} />}

          {/* Cost Reduction Tips Tab */}
          {activeTab === "tips" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-base">Money-Saving Tips</h3>
                  <p className="text-xs text-gray-400">Smart ways to reduce your travel costs</p>
                </div>
              </div>
              {COST_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border/60 shadow-sm hover:shadow-md transition-all">
                  <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <h4 className="font-heading font-semibold text-foreground text-sm">{tip.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-accent/5 border border-accent/10 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  💡 These tips can save you 30-50% on your total trip cost!
                </p>
              </div>
            </div>
          )}

          {/* Packing List Button (bottom) */}
          <div className="pt-4 border-t border-border/30 text-center">
            <button
              onClick={() => {
                setActiveTab("weather");
                setTimeout(() => {
                  document.getElementById("packing")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
              }}
              className="btn-secondary text-sm cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
              Make a Packing List
            </button>
          </div>
        </div>

        {/* Preferences */}
        {trip.preferences && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/10">
            <p className="text-xs text-accent font-medium mb-1 font-sans">Your Preferences</p>
            <p className="text-sm text-gray-600 italic font-sans">&ldquo;{trip.preferences}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}