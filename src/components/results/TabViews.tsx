import {
  Plane, Building2, UtensilsCrossed, MapPin, DollarSign, Sun,
  ExternalLink, Star, Clock, ChevronRight, Check, Thermometer,
  CloudRain, Wind, Umbrella, Gauge, Layers, Download
} from "lucide-react";
import type {
  FlightItem, HotelItem, RestaurantItem, AttractionItem,
  BudgetData, WeatherData
} from "../utils/parsers";

// ─── Tab Navbar ─────────────────────────────────────────────────────────

const TABS_CONFIG = [
  { key: "flights", label: "Flights", icon: Plane },
  { key: "hotels", label: "Hotels", icon: Building2 },
  { key: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { key: "attractions", label: "Attractions", icon: MapPin },
  { key: "budget", label: "Budget", icon: DollarSign },
  { key: "weather", label: "Weather", icon: Sun },
  { key: "activities", label: "Activities", icon: Check },
] as const;

export type TabKey = (typeof TABS_CONFIG)[number]["key"];

interface TabsNavProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}

export function TabsNav({ activeTab, onTabChange }: TabsNavProps) {
  return (
    <nav className="sticky top-0 z-20 -mx-1 px-1 pb-1 overflow-x-auto scrollbar-none">
      <div className="flex gap-1.5 min-w-max p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm">
        {TABS_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Helper: Shared card wrapper ────────────────────────────────────────

function ItemCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  );
}

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "info" | "warning" }) {
  const colors = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-green-50 text-green-700",
    info: "bg-blue-50 text-blue-700",
    warning: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

// ─── Flights Tab ────────────────────────────────────────────────────────

export function FlightsTab({ items, currency }: { items: FlightItem[]; currency?: string }) {
  if (!items.length) {
    return <EmptyState icon={Plane} message="No flight information available." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard key={i}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-foreground text-base truncate">
                {item.airline}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm text-gray-500">{item.rating}</span>
              </div>
            </div>
            {item.tag && (
              <Tag variant={i === 0 ? "success" : i === 1 ? "info" : "default"}>
                {item.tag.includes("Best value") ? "Best Value" :
                 item.tag.includes("Recommended") ? "Recommended" :
                 item.tag.includes("Budget") ? "Budget" : item.tag}
              </Tag>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{item.priceRange}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{item.duration}</span>
            </div>
            {item.stops && (
              <div className="flex items-center gap-2 text-gray-500">
                <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{item.stops}</span>
              </div>
            )}
          </div>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
            >
              View Flight <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </ItemCard>
      ))}
    </div>
  );
}

// ─── Hotels Tab ─────────────────────────────────────────────────────────

export function HotelsTab({ items }: { items: HotelItem[] }) {
  if (!items.length) {
    return <EmptyState icon={Building2} message="No hotel information available." />;
  }

  const getStarCount = (stars: string) => {
    const match = stars.match(/★/g);
    return match ? match.length : 0;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard key={i}>
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: getStarCount(item.stars) }).map((_, si) => (
                <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="font-heading font-bold text-foreground text-base">
              {item.name}
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            {item.pricePerNight && (
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-foreground">{item.pricePerNight}</span>
                <span className="text-gray-400">/night</span>
              </div>
            )}
            {item.vibe && (
              <p className="text-gray-500 leading-relaxed">{item.vibe}</p>
            )}
            {item.amenities && (
              <Tag variant="info">{item.amenities}</Tag>
            )}
          </div>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/5 text-accent text-sm font-medium hover:bg-accent/10 transition-colors cursor-pointer"
            >
              View Hotel <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </ItemCard>
      ))}
    </div>
  );
}

// ─── Restaurants Tab ────────────────────────────────────────────────────

export function RestaurantsTab({ items }: { items: RestaurantItem[] }) {
  if (!items.length) {
    return <EmptyState icon={UtensilsCrossed} message="No restaurant recommendations available." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard key={i}>
          <h3 className="font-heading font-bold text-foreground text-base mb-1">
            {item.name}
          </h3>
          <Tag className="mb-3">{item.cuisine}</Tag>

          <div className="space-y-2 text-sm mt-3">
            {item.cost && (
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{item.cost}</span>
              </div>
            )}
            {item.description && (
              <p className="text-gray-500 leading-relaxed">{item.description}</p>
            )}
          </div>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors cursor-pointer"
            >
              View Restaurant <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </ItemCard>
      ))}
    </div>
  );
}

// ─── Attractions Tab ────────────────────────────────────────────────────

export function AttractionsTab({ items }: { items: AttractionItem[] }) {
  if (!items.length) {
    return <EmptyState icon={MapPin} message="No attractions found." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <ItemCard key={i}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-heading font-bold text-foreground text-base">
              {item.name}
            </h3>
            <Tag>{item.category}</Tag>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-3">
              {item.cost && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  <span>{item.cost}</span>
                </div>
              )}
              {item.timeNeeded && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{item.timeNeeded}</span>
                </div>
              )}
            </div>
            {item.description && (
              <p className="text-gray-500 leading-relaxed text-sm">{item.description}</p>
            )}
          </div>
        </ItemCard>
      ))}
    </div>
  );
}

// ─── Budget Tab ─────────────────────────────────────────────────────────

export function BudgetTab({ data, currency }: { data: BudgetData; currency?: string }) {
  if (!data.categories.length) {
    return <EmptyState icon={DollarSign} message="No budget breakdown available." />;
  }

  const sym = currency === "PKR" ? "₨" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <div className="space-y-5">
      {/* Budget bar chart */}
      <div className="space-y-3">
        {data.categories.map((cat, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">
                  {sym}{cat.amount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 ml-1.5">{cat.percentage}%</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${cat.percentage}%`,
                  background: i === 0 ? "oklch(0.6847 0.1479 237.32)" :
                              i === 1 ? "oklch(0.6461 0.1943 41.12)" :
                              i === 2 ? "oklch(0.6461 0.1283 167.25)" :
                              i === 3 ? "oklch(0.6461 0.1693 294.32)" :
                              i === 4 ? "oklch(0.7535 0.139 232.66)" :
                                        "oklch(0.6461 0.1283 167.25)"
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Budget</p>
          <p className="text-xl font-bold font-heading text-foreground">
            {sym}{data.total.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Remaining Buffer</p>
          <p className="text-xl font-bold font-heading text-blue-700">
            {sym}{data.remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {data.tip && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200/60">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{data.tip}</p>
        </div>
      )}
    </div>
  );
}

function Lightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

// ─── Weather Tab ────────────────────────────────────────────────────────

export function WeatherTab({ data }: { data: WeatherData }) {
  if (!data.temperatureRange && !data.conditions) {
    return <EmptyState icon={Sun} message="No weather information available." />;
  }

  return (
    <div className="space-y-5">
      {/* Main weather card */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-foreground text-lg">Expected Weather</h3>
          <Sun className="w-8 h-8 text-amber-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.temperatureRange && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Thermometer className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Temperature</p>
                <p className="font-medium text-foreground">{data.temperatureRange}</p>
              </div>
            </div>
          )}
          {data.conditions && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Conditions</p>
                <p className="font-medium text-foreground">{data.conditions}</p>
              </div>
            </div>
          )}
          {data.precipitationChance && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Precipitation</p>
                <p className="font-medium text-foreground">{data.precipitationChance}</p>
              </div>
            </div>
          )}
          {data.humidity && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Umbrella className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Humidity</p>
                <p className="font-medium text-foreground">{data.humidity}</p>
              </div>
            </div>
          )}
          {data.wind && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Wind className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Wind</p>
                <p className="font-medium text-foreground">{data.wind}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Packing List */}
      {data.packingList.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-heading font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Packing List
          </h3>
          <ul className="space-y-2">
            {data.packingList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Activities */}
      {data.bestActivities.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-heading font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            Best Activities
          </h3>
          <ul className="space-y-2">
            {data.bestActivities.map((act, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Activities Tab (Checklist) ─────────────────────────────────────────

interface ActivityTodo {
  id: string;
  label: string;
  note: string;
  done: boolean;
}

interface ActivitiesTabProps {
  attractions: AttractionItem[];
  weatherActivities: string[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function ActivitiesTab({ attractions, weatherActivities, checked, onToggle }: ActivitiesTabProps) {
  // Build the todo list from attractions + weather activities
  const todos: ActivityTodo[] = [
    ...attractions.map((a, i) => ({
      id: `attr-${i}`,
      label: a.name,
      note: `${a.category} · ${a.timeNeeded || a.cost || "Visit"}`,
      done: checked[`attr-${i}`] || false,
    })),
    ...weatherActivities.map((act, i) => ({
      id: `weather-${i}`,
      label: act,
      note: "Recommended activity",
      done: checked[`weather-${i}`] || false,
    })),
  ];

  if (todos.length === 0) {
    return (
      <EmptyState icon={Check} message="No activities to show yet. Check back once your trip is planned!" />
    );
  }

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-500 font-medium">
          {doneCount} of {todos.length} done
        </span>
        <span className="text-gray-400">
          {Math.round((doneCount / todos.length) * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{ width: `${(doneCount / todos.length) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {todos.map((todo) => (
          <label
            key={todo.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              todo.done
                ? "bg-green-50 border-green-200"
                : "bg-white border-border/60 hover:border-primary/30 hover:bg-blue-50/30"
            }`}
            style={{ cursor: "pointer" }}
          >
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => onToggle(todo.id)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  todo.done
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {todo.done && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium transition-all duration-200 ${
                todo.done ? "text-gray-400 line-through" : "text-foreground"
              }`}>
                {todo.label}
              </p>
              <p className={`text-xs mt-0.5 ${
                todo.done ? "text-gray-300" : "text-gray-400"
              }`}>
                {todo.note}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}