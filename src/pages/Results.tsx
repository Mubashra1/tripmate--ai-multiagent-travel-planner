import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import {
  Plane, Building2, UtensilsCrossed, MapPin, DollarSign, Sun,
  ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, User,
  Clock, Sparkles
} from "lucide-react";
import {
  TabsNav, FlightsTab, HotelsTab, RestaurantsTab, AttractionsTab,
  BudgetTab, WeatherTab, ActivitiesTab,
} from "../components/results/TabViews";
import type { TabKey } from "../components/results/TabViews";
import {
  parseFlights, parseHotels, parseRestaurants, parseAttractions,
  parseBudget, parseWeather,
} from "../utils/parsers";
import type {
  FlightItem, HotelItem, RestaurantItem, AttractionItem,
  BudgetData, WeatherData,
} from "../utils/parsers";

const AGENTS = [
  { key: "flight", label: "Flight Finder", icon: Plane, color: "flight-card" },
  { key: "hotel", label: "Hotel Scout", icon: Building2, color: "hotel-card" },
  { key: "restaurant", label: "Restaurant Guide", icon: UtensilsCrossed, color: "restaurant-card" },
  { key: "attractions", label: "Attractions Guide", icon: MapPin, color: "attractions-card" },
  { key: "budget", label: "Budget Optimizer", icon: DollarSign, color: "budget-card" },
  { key: "weather", label: "Weather Advisor", icon: Sun, color: "weather-card" },
];

type AgentResponse = {
  agent: string;
  content: string;
  status: "pending" | "streaming" | "complete" | "error";
  error?: string;
};

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const destination = searchParams.get("destination") || "";
  const budget = searchParams.get("budget") || "";
  const currency = searchParams.get("currency") || "USD";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const preferences = searchParams.get("preferences") || "";
  const latitude = searchParams.get("latitude") || "";
  const longitude = searchParams.get("longitude") || "";

  const currencySymbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹", PKR: "₨", AED: "د.إ", SAR: "﷼",
  };
  const curSymbol = currencySymbols[currency] || currency;

  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>(
    AGENTS.map((a) => ({ agent: a.key, content: "", status: "pending" }))
  );
  const [currentAgent, setCurrentAgent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("flights");
  const [activitiesChecked, setActivitiesChecked] = useState<Record<string, boolean>>({});

  // Parsed data (re-computed when agentResponses complete)
  const [parsedData, setParsedData] = useState<{
    flights: FlightItem[];
    hotels: HotelItem[];
    restaurants: RestaurantItem[];
    attractions: AttractionItem[];
    budget: BudgetData | null;
    weather: WeatherData | null;
  } | null>(null);

  useEffect(() => {
    if (!destination || !budget) {
      navigate("/");
      return;
    }
    startPlanning();
  }, []);

  // Parse data once all agents are complete
  useEffect(() => {
    if (!completed) return;
    const getContent = (key: string) =>
      agentResponses.find((r) => r.agent === key)?.content || "";

    setParsedData({
      flights: parseFlights(getContent("flight")),
      hotels: parseHotels(getContent("hotel")),
      restaurants: parseRestaurants(getContent("restaurant")),
      attractions: parseAttractions(getContent("attractions")),
      budget: parseBudget(getContent("budget")),
      weather: parseWeather(getContent("weather")),
    });
  }, [completed]);

  const startPlanning = async () => {
    // Reset state
    setError(null);
    setCompleted(false);
    setShowSavePrompt(false);
    setParsedData(null);
    setAgentResponses(AGENTS.map((a) => ({ agent: a.key, content: "", status: "pending" })));
    setCurrentAgent(0);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://knstaxhomdzcbccjfwpc.supabase.co"}/functions/v1/trip-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } : {}),
          },
          body: JSON.stringify({
            destination,
            budget: parseFloat(budget),
            currency: currency || "USD",
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            preferences: preferences || undefined,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "agent_stream") {
              setAgentResponses(prev => {
                const next = [...prev];
                const idx = next.findIndex(a => a.agent === parsed.agent);
                if (idx >= 0) {
                  next[idx] = {
                    ...next[idx],
                    status: "streaming",
                    content: (next[idx].content || "") + (parsed.content || ""),
                  };
                }
                return next;
              });
            } else if (parsed.type === "agent_complete") {
              // BUG FIX: Don't append content again — it's already fully streamed.
              // Just update the status to "complete".
              setAgentResponses(prev => {
                const next = [...prev];
                const idx = next.findIndex(a => a.agent === parsed.agent);
                if (idx >= 0) {
                  next[idx] = {
                    ...next[idx],
                    status: "complete",
                    // If somehow content is empty (streaming didn't happen), use the complete payload
                    content: next[idx].content || parsed.content || "",
                  };
                }
                return next;
              });
              setCurrentAgent(prev => {
                const agentIdx = AGENTS.findIndex(a => a.key === parsed.agent);
                return Math.max(prev, agentIdx + 1);
              });
            } else if (parsed.type === "agent_error") {
              setAgentResponses(prev => {
                const next = [...prev];
                const idx = next.findIndex(a => a.agent === parsed.agent);
                if (idx >= 0) {
                  next[idx] = {
                    ...next[idx],
                    status: "error",
                    error: parsed.error || "Agent failed",
                  };
                }
                return next;
              });
              setCurrentAgent(prev => {
                const agentIdx = AGENTS.findIndex(a => a.key === parsed.agent);
                return Math.max(prev, agentIdx + 1);
              });
            } else if (parsed.type === "complete") {
              setCompleted(true);
              setShowSavePrompt(true);
            } else if (parsed.type === "error") {
              setError(parsed.error || "Planning failed");
            }
          } catch { /* skip malformed json */ }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to start planning");
    }
  };

  const saveTrip = useCallback(async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    setSaving(true);
    try {
      const title = `Trip to ${destination}`;
      const itinerary = agentResponses.reduce((acc, r) => {
        acc[r.agent] = r.content;
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        title,
        destination,
        budget: parseFloat(budget) || null,
        currency: currency || "USD",
        start_date: startDate || null,
        end_date: endDate || null,
        preferences: preferences || null,
        itinerary,
      });

      if (error) throw error;
      setSaved(true);
      setShowSavePrompt(false);
    } catch (err: any) {
      setError("Failed to save trip: " + err.message);
    } finally {
      setSaving(false);
    }
  }, [user, destination, budget, currency, startDate, endDate, preferences, agentResponses, navigate]);

  const toggleActivity = useCallback((id: string) => {
    setActivitiesChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-gray-300" />;
      case "streaming": return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "complete": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  // No destination — redirect
  if (!destination) return null;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-6 sm:py-8 relative">
      <div className="absolute inset-0 bg-hero-gradient opacity-3" />
      <div className="absolute inset-0 bg-warm-glow" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 fade-in-up">
          <button onClick={() => navigate("/")} className="btn-ghost text-sm flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-right">
            <h1 className="text-xl font-heading font-bold text-foreground">{destination}</h1>
            <p className="text-sm text-gray-500 font-sans">
              Budget: {curSymbol}{parseInt(budget).toLocaleString()} {currency !== "USD" ? currency : ""}
              {startDate && endDate && ` · ${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && !completed && (
          <div className="card border-red-200 bg-red-50 text-center py-12 mb-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-heading font-semibold text-foreground mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-4 font-sans">{error}</p>
            <button onClick={startPlanning} className="btn-primary text-sm cursor-pointer">
              Try Again
            </button>
          </div>
        )}

        {/* ── STREAMING / PROGRESS VIEW ─────────────────────────────── */}
        {!completed && !error && (
          <div className="space-y-4 mb-8">
            {AGENTS.map((agent, idx) => {
              const response = agentResponses[idx];
              const isActive = idx === currentAgent && response?.status === "streaming";
              const isDone = response?.status === "complete";
              const isError = response?.status === "error";
              const isPending = response?.status === "pending";

              return (
                <div
                  key={agent.key}
                  className={`card overflow-hidden transition-all duration-300 ${
                    isActive ? "ring-2 ring-primary/30 shadow-lg" : ""
                  } ${isDone ? "opacity-100" : isPending ? "opacity-60" : ""} fade-in-up stagger-${Math.min(idx + 1, 6)}`}
                >
                  {/* Agent Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive ? "bg-primary/10" :
                        isDone ? "bg-green-50" :
                        isError ? "bg-red-50" : "bg-gray-50"
                      }`}>
                        <agent.icon className={`w-5 h-5 ${
                          isActive ? "text-primary" :
                          isDone ? "text-green-600" :
                          isError ? "text-destructive" : "text-gray-300"
                        }`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-heading font-semibold text-foreground text-sm sm:text-base">
                          {agent.label}
                        </h3>
                        <p className="text-xs text-gray-400 font-sans">
                          {isActive ? "Generating..." :
                           isDone ? "Complete" :
                           isError ? response?.error || "Failed" :
                           isPending && idx > currentAgent ? "Waiting..." :
                           isPending ? "Up next..." : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(response?.status || "pending")}
                    </div>
                  </div>

                  {/* Live preview while streaming */}
                  {isActive && response?.content && (
                    <div className={`px-4 sm:px-5 pb-5 ${agent.color} border-t border-border/50 pt-3`}>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 font-sans">
                        {response.content}
                      </div>
                      <span className="inline-block mt-2 w-2 h-5 bg-primary rounded-sm animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading indicator */}
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 border border-border shadow-sm">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-gray-500 font-sans">
                  {agentResponses.some((r) => r.status === "streaming")
                    ? "AI agents are planning your trip..."
                    : "Starting agents..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETED / RESULTS VIEW ──────────────────────────────── */}
        {completed && (
          <div className="space-y-5 fade-in-up">
            {/* Success banner */}
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Your trip to {destination} is ready!
              </div>
            </div>

            {/* Tab navigation */}
            <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab content */}
            <div className="mt-2 animate-fade-in">
              {parsedData && (() => {
                switch (activeTab) {
                  case "flights":
                    return <FlightsTab items={parsedData.flights} />;
                  case "hotels":
                    return <HotelsTab items={parsedData.hotels} />;
                  case "restaurants":
                    return <RestaurantsTab items={parsedData.restaurants} />;
                  case "attractions":
                    return <AttractionsTab items={parsedData.attractions} />;
                  case "budget":
                    return <BudgetTab data={parsedData.budget!} currency={currency} />;
                  case "weather":
                    return <WeatherTab data={parsedData.weather!} />;
                  case "activities":
                    return (
                      <ActivitiesTab
                        attractions={parsedData.attractions}
                        weatherActivities={parsedData.weather?.bestActivities || []}
                        checked={activitiesChecked}
                        onToggle={toggleActivity}
                      />
                    );
                }
              })()}
            </div>

            {/* Action buttons */}
            <div className="text-center pt-6 pb-8 space-y-4 border-t border-border/30">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {showSavePrompt && !saved && (
                  <button onClick={saveTrip} disabled={saving} className="btn-primary text-sm cursor-pointer">
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Trip</>
                    )}
                  </button>
                )}

                {saved && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Saved to your trips!
                  </div>
                )}

                {!user && !saved && (
                  <button onClick={() => navigate("/signup")} className="btn-secondary text-sm cursor-pointer">
                    <User className="w-4 h-4" />
                    Sign Up to Save
                  </button>
                )}

                {saved && (
                  <button onClick={() => navigate("/dashboard")} className="btn-secondary text-sm cursor-pointer">
                    View Dashboard
                  </button>
                )}

                <button onClick={() => navigate("/")} className="btn-ghost text-sm cursor-pointer">
                  Plan Another Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}