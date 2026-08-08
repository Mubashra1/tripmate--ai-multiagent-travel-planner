import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Tables } from "../lib/database.types";
import {
  MapPin, Trash2, Calendar, DollarSign,
  Loader2, AlertCircle, Plus, Clock, Compass, Sparkles, Backpack
} from "lucide-react";

type Trip = Tables<"trips">;

const DEST_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
};

const getDestImage = (dest?: string | null) => {
  if (!dest) return DEST_IMAGES.default;
  const key = Object.keys(DEST_IMAGES).find(k =>
    dest.toLowerCase().includes(k)
  );
  return DEST_IMAGES[key || "default"];
};

// Check if a trip has valid itinerary data (not garbage auto-save)
function hasValidItinerary(trip: Trip): boolean {
  if (!trip.itinerary) return false;
  const itin = trip.itinerary as Record<string, unknown>;
  // Valid if it has agent-specific content keys (flight, hotel, etc.)
  const validKeys = ["flight", "hotel", "restaurant", "attractions", "budget", "weather"];
  const matches = validKeys.filter(k => typeof itin[k] === "string" && (itin[k] as string).length > 20);
  return matches.length >= 3;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      // Filter out trips without valid itinerary (garbage auto-saves)
      const valid = (data || []).filter(hasValidItinerary);
      setTrips(valid);
    }
    setLoading(false);
  };

  const deleteTrip = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    setDeleting(id);
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      setError(error.message);
    } else {
      setTrips(prev => prev.filter(t => t.id !== id));
    }
    setDeleting(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="min-h-screen py-8 relative">
      <div className="absolute inset-0 bg-hero-gradient opacity-3" />
      <div className="absolute inset-0 bg-warm-glow" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">My Trips</h1>
            <p className="text-gray-500 text-sm mt-1 font-sans">
              {trips.length} {trips.length === 1 ? "trip" : "trips"} planned
            </p>
          </div>
          <Link to="/" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Plan New Trip
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-6" role="alert">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-gray-500 font-sans">Loading your trips...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && trips.length === 0 && (
          <div className="card text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-10 h-10 text-primary/40" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">No trips yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto font-sans">
              Plan your first adventure! Enter a destination and let AI build your perfect itinerary.
            </p>
            <Link to="/" className="btn-primary text-sm inline-flex">
              <Sparkles className="w-4 h-4" />
              Plan Your First Trip
            </Link>
          </div>
        )}

        {/* Trip Grid */}
        {!loading && trips.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <div key={trip.id} className="card group relative overflow-hidden !p-0">
                <Link to={`/trip/${trip.id}`}>
                  {/* Image */}
                  <div
                    className="h-40 sm:h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${getDestImage(trip.destination)})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 z-10">
                      <h3 className="font-heading font-semibold text-white text-lg leading-tight">
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-white/70 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {trip.destination}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3 font-sans">
                      {trip.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${trip.budget.toLocaleString()}
                        </span>
                      )}
                      {trip.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.start_date)}
                          {trip.end_date && ` — ${formatDate(trip.end_date)}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-sans">
                        <Clock className="w-3 h-3" />
                        {timeAgo(trip.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bottom actions */}
                <div className="px-4 pb-4 pt-0 flex items-center gap-2">
                  <Link
                    to={`/trip/${trip.id}?tab=weather#packing`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Backpack className="w-3.5 h-3.5" />
                    Packing List
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteTrip(trip.id);
                    }}
                    disabled={deleting === trip.id}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-destructive hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Delete trip"
                  >
                    {deleting === trip.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}