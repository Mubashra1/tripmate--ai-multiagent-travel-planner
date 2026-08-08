import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// ── CORS ───────────────────────────────────────────────────────────────
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ──────────────────────────────────────────────────────────────

interface TripBody {
  destination: string;
  budget: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  preferences?: string;
  latitude?: number;
  longitude?: number;
}

interface AgentResult {
  id: string;
  name: string;
  icon: string;
  content: string;
  delay: number; // ms to simulate streaming
}

// ── Currency-aware realistic pricing ──────────────────────────────────

/** Approximate USD conversion rates for common currencies (mid-market). */
const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278,
  INR: 83,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.37,
  AUD: 1.52,
  JPY: 150,
  CNY: 7.24,
  THB: 36,
  MYR: 4.68,
  SGD: 1.34,
  NZD: 1.65,
  CHF: 0.88,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.9,
  KRW: 1325,
  IDR: 15700,
  VND: 24800,
  PHP: 56,
  BDT: 110,
  LKR: 305,
  NPR: 133,
  EGP: 48,
  TRY: 32,
  ZAR: 18.5,
  BRL: 5.05,
  MXN: 17.0,
};

/** Realistic MINIMUM unit prices in USD (these are real-world floors). */
const MIN_PRICES_USD = {
  /** Economy round-trip domestic */
  flightEconomy: 200,
  /** Economy round-trip international */
  flightInternational: 400,
  /** Budget hotel per night */
  hotelBudget: 30,
  /** Mid-range hotel per night */
  hotelMid: 60,
  /** Luxury hotel per night */
  hotelLuxury: 120,
  /** Cheap meal per person */
  mealCheap: 5,
  /** Mid-range meal per person */
  mealMid: 12,
  /** Fancy meal per person */
  mealFancy: 25,
  /** Activity entry fee */
  activityEntry: 3,
  /** Activity tour cost */
  activityTour: 15,
};

function toLocal(usdAmount: number, currency: string): number {
  const rate = USD_RATES[currency.toUpperCase()] ?? 1;
  return Math.round(usdAmount * rate);
}

function formatPrice(amount: number): string {
  return amount.toLocaleString();
}

// ── Data generators (currency-aware) ─────────────────────────────────

function generateFlights(body: TripBody): string {
  const dest = body.destination;
  const currency = body.currency.toUpperCase();
  const rate = USD_RATES[currency] ?? 1;

  // Determine if likely international (simple heuristic)
  const domesticKeywords = ["lahore", "karachi", "islamabad", "new york", "los angeles", "london", "paris", "tokyo", "dubai"];
  const isDomestic = domesticKeywords.some((d) => dest.toLowerCase().includes(d));
  const baseMin = isDomestic ? MIN_PRICES_USD.flightEconomy : MIN_PRICES_USD.flightInternational;

  // Scale with budget: higher budget = more expensive options
  const budgetInUsd = Math.round(body.budget / rate);
  const multiplier = Math.max(1, Math.min(3, budgetInUsd / 1000));

  const airlines = [
    { name: "SkyWings Airways", rating: "4.2" },
    { name: "GlobalAir Connect", rating: "4.5" },
    { name: "AeroVista", rating: "3.9" },
  ];

  return airlines
    .map((a, i) => {
      const basePrice = Math.round(baseMin * multiplier);
      const priceLow = basePrice + i * 60;
      const priceHigh = priceLow + Math.round(100 * multiplier);

      const localLow = formatPrice(Math.round(priceLow * rate));
      const localHigh = formatPrice(Math.round(priceHigh * rate));
      const dur = `${6 + i * 2}h ${10 + i * 15}m`;
      const stopInfo = i === 0
        ? "Direct (non-stop)"
        : `${1 + (i - 1) * 1} stop`;
      const tag = i === 0
        ? "Best value — lowest fare"
        : i === 1
          ? "Recommended — balanced price & comfort"
          : "Budget-friendly, longer layover";

      return (
        `**${a.name}** ⭐ ${a.rating}\n` +
        `- Estimated round-trip: ${currency} ${localLow}–${localHigh}\n` +
        `- Duration: ${dur} — ${stopInfo}\n` +
        `- ${tag}\n`
      );
    })
    .join("\n");
}

function generateHotels(body: TripBody): string {
  const currency = body.currency.toUpperCase();
  const rate = USD_RATES[currency] ?? 1;
  const budgetInUsd = Math.round(body.budget / rate);

  // Scale multiplier based on budget (how many nights they can afford)
  const affordability = Math.max(1, Math.min(4, budgetInUsd / 500));

  const options = [
    {
      name: "Sunset Plaza Hotel",
      stars: "★★★★☆",
      baseUsd: MIN_PRICES_USD.hotelBudget,
      amenity: "Pool & free breakfast",
      vibe: "Mid-range comfort near city center",
    },
    {
      name: "The Grand Horizon",
      stars: "★★★★★",
      baseUsd: MIN_PRICES_USD.hotelLuxury,
      amenity: "Rooftop bar, spa & gym",
      vibe: "Luxury stay with panoramic views",
    },
    {
      name: "CozyStay Inn",
      stars: "★★★☆☆",
      baseUsd: MIN_PRICES_USD.hotelBudget * 0.6,
      amenity: "Free Wi-Fi & self-check-in",
      vibe: "Budget-friendly & centrally located",
    },
  ];

  return options
    .map((h) => {
      const priceUsd = Math.round(h.baseUsd * affordability);
      const localPrice = formatPrice(Math.round(priceUsd * rate));
      return (
        `**${h.name}** ${h.stars}\n` +
        `- ${currency} ${localPrice}/night — ${h.vibe}\n` +
        `- Highlights: ${h.amenity}\n`
      );
    })
    .join("\n");
}

function generateRestaurants(body: TripBody): string {
  const currency = body.currency.toUpperCase();
  const rate = USD_RATES[currency] ?? 1;
  const budgetInUsd = Math.round(body.budget / rate);
  const multiplier = Math.max(1, Math.min(3, budgetInUsd / 800));

  const picks = [
    {
      name: "Local Bazaar Kitchen",
      cuisine: "Street Food / Local",
      lowUsd: MIN_PRICES_USD.mealCheap,
      highUsd: Math.round(MIN_PRICES_USD.mealMid * 1.2),
      why: "Best place to sample authentic local dishes. Try the signature platter.",
    },
    {
      name: "Mediterraneo Grill",
      cuisine: "Mediterranean / Seafood",
      lowUsd: MIN_PRICES_USD.mealMid,
      highUsd: Math.round(MIN_PRICES_USD.mealFancy * 1.5),
      why: "Fresh seafood with a lovely outdoor terrace. Perfect for dinner.",
    },
    {
      name: "Fusion Table",
      cuisine: "Asian Fusion",
      lowUsd: Math.round(MIN_PRICES_USD.mealCheap * 2.5),
      highUsd: Math.round(MIN_PRICES_USD.mealMid * 2.2),
      why: "Creative small plates and craft cocktails in a trendy setting.",
    },
  ];

  return picks
    .map((r) => {
      const low = formatPrice(Math.round(r.lowUsd * multiplier * rate));
      const high = formatPrice(Math.round(r.highUsd * multiplier * rate));
      return (
        `**${r.name}** — ${r.cuisine}\n` +
        `- Estimated cost: ${currency} ${low}–${high}\n` +
        `- ${r.why}\n`
      );
    })
    .join("\n");
}

function generateAttractions(body: TripBody): string {
  const currency = body.currency.toUpperCase();
  const rate = USD_RATES[currency] ?? 1;

  const spots = [
    {
      name: "Old Town Heritage Walk",
      type: "Walking Tour",
      costUsd: 0,
      costLabel: "Free",
      time: "2–3 hours",
      why: "Explore historic streets, local markets, and hidden courtyards with a guide.",
    },
    {
      name: "Sunset Viewpoint & Nature Trail",
      type: "Outdoor / Hiking",
      costUsd: MIN_PRICES_USD.activityEntry,
      costLabel: null,
      time: "Half day",
      why: "A moderate hike leading to a stunning panoramic viewpoint. Bring your camera!",
    },
    {
      name: "City Museum of Art & Culture",
      type: "Museum",
      costUsd: Math.round(MIN_PRICES_USD.activityTour * 0.8),
      costLabel: null,
      time: "1.5–2 hours",
      why: "Houses an impressive collection of local art and rotating international exhibits.",
    },
  ];

  return spots
    .map((s) => {
      const costDisplay = s.costLabel
        ? `${currency} 0 (${s.costLabel})`
        : `${currency} ${formatPrice(Math.round(s.costUsd * rate))}`;
      return (
        `**${s.name}** — ${s.type}\n` +
        `- Cost: ${costDisplay} | Time needed: ${s.time}\n` +
        `- ${s.why}\n`
      );
    })
    .join("\n");
}

function generateBudget(body: TripBody, context: string): string {
  const budget = body.budget;
  const currency = body.currency.toUpperCase();
  const rate = USD_RATES[currency] ?? 1;
  const budgetInUsd = Math.round(budget / rate);

  // Realistic minimums in LOCAL currency
  const minFlight = toLocal(MIN_PRICES_USD.flightEconomy, currency);
  const minHotelTotal = toLocal(MIN_PRICES_USD.hotelBudget * 3, currency); // 3 nights minimum
  const minFood = toLocal(MIN_PRICES_USD.mealCheap * 9, currency); // 3 meals × 3 days
  const minActivities = toLocal(MIN_PRICES_USD.activityTour * 2, currency);
  const minMisc = toLocal(10, currency);

  // Adaptive allocation: try percentage first, but respect minimums
  let flightPct = 25;
  let hotelPct = 40;
  let foodPct = 15;
  let activitiesPct = 12;
  let miscPct = 8;

  // If budget is tight, allocate more to essentials
  if (budgetInUsd < 300) {
    hotelPct = 35;
    foodPct = 20;
    flightPct = 30;
    activitiesPct = 8;
    miscPct = 7;
  }

  const allocations = {
    flight: Math.max(minFlight, Math.round(budget * flightPct / 100)),
    hotel: Math.max(minHotelTotal, Math.round(budget * hotelPct / 100)),
    food: Math.max(minFood, Math.round(budget * foodPct / 100)),
    activities: Math.max(minActivities, Math.round(budget * activitiesPct / 100)),
    misc: Math.max(minMisc, Math.round(budget * miscPct / 100)),
  };

  const totalAllocated = allocations.flight + allocations.hotel + allocations.food +
    allocations.activities + allocations.misc;

  // If the minimums already exceed the budget, cap them proportionally
  let budgetBreakdown;
  if (totalAllocated > budget) {
    // Pro-rate everything to fit within budget
    const ratio = budget / totalAllocated;
    budgetBreakdown = {
      flight: Math.round(allocations.flight * ratio),
      hotel: Math.round(allocations.hotel * ratio),
      food: Math.round(allocations.food * ratio),
      activities: Math.round(allocations.activities * ratio),
      misc: Math.max(1, Math.round(allocations.misc * ratio)),
    };
  } else {
    budgetBreakdown = allocations;
  }

  const used = budgetBreakdown.flight + budgetBreakdown.hotel + budgetBreakdown.food +
    budgetBreakdown.activities + budgetBreakdown.misc;
  const remaining = budget - used;

  const percentOf = (val: number) => Math.round(val / budget * 100);

  return (
    `**Day-by-Day Budget Breakdown**\n\n` +
    `| Category | ${currency} | % of Budget |\n` +
    `|---|---|---|\n` +
    `| 🛫 Flights | ${currency} ${budgetBreakdown.flight.toLocaleString()} | ${percentOf(budgetBreakdown.flight)}% |\n` +
    `| 🏨 Accommodation | ${currency} ${budgetBreakdown.hotel.toLocaleString()} | ${percentOf(budgetBreakdown.hotel)}% |\n` +
    `| 🍽️ Meals & Dining | ${currency} ${budgetBreakdown.food.toLocaleString()} | ${percentOf(budgetBreakdown.food)}% |\n` +
    `| 🎯 Activities | ${currency} ${budgetBreakdown.activities.toLocaleString()} | ${percentOf(budgetBreakdown.activities)}% |\n` +
    `| 🔧 Misc / Transport | ${currency} ${budgetBreakdown.misc.toLocaleString()} | ${percentOf(budgetBreakdown.misc)}% |\n\n` +
    `**Total projected spend:** ${currency} ${used.toLocaleString()}\n` +
    `**Remaining buffer:** ${currency} ${remaining.toLocaleString()}\n\n` +
    `💡 *Tip: ${budgetInUsd < 200 ? "Consider extending your budget for a more comfortable trip. Look for off-season deals and package discounts." : "Look for combo deals on flights+hotels to free up more for activities."}*`
  );
}

function generateWeather(body: TripBody): string {
  const dest = body.destination;
  const isTropical = ["bali", "thailand", "maldives", "hawaii", "phuket", "goa", "kerala", "sri lanka"].some((d) =>
    dest.toLowerCase().includes(d)
  );
  const isCold = ["reykjavik", "iceland", "oslo", "stockholm", "helsinki", "switzerland", "alps", "norway", "sweden"].some((d) =>
    dest.toLowerCase().includes(d)
  );

  if (isTropical) {
    return (
      `**Expected Weather**\n` +
      `- Temperature range: 27°C–33°C (80°F–92°F)\n` +
      `- Conditions: Mostly sunny with brief afternoon showers possible\n` +
      `- Humidity: Moderate to high (70–85%)\n\n` +
      `**Packing List**\n` +
      `- Light cotton clothing, swimwear, sunglasses, sunscreen (SPF 50+)\n` +
      `- Light rain jacket or umbrella for sudden showers\n` +
      `- Insect repellent, flip-flops, and a reusable water bottle\n\n` +
      `**Best Activities**\n` +
      `- Morning: Beach time, snorkeling, or temple visits (before noon heat)\n` +
      `- Afternoon: Indoor markets, spa, or a café lunch\n` +
      `- Evening: Sunset dinner, night markets, or a cultural show`
    );
  }

  if (isCold) {
    return (
      `**Expected Weather**\n` +
      `- Temperature range: -2°C–7°C (28°F–45°F)\n` +
      `- Conditions: Cold, partly cloudy. Chance of snow flurries\n` +
      `- Wind: Moderate, wind chill may make it feel colder\n\n` +
      `**Packing List**\n` +
      `- Thermal layers, fleece, waterproof winter jacket\n` +
      `- Warm hat, gloves, scarf, and wool socks\n` +
      `- Waterproof boots with good grip\n\n` +
      `**Best Activities**\n` +
      `- Indoor: Museums, galleries, cozy cafés, thermal baths\n` +
      `- Outdoor: Short walks in clear weather (midday is warmest)\n` +
      `- Evening: Indoor dining, pubs, or theater performances`
    );
  }

  return (
    `**Expected Weather**\n` +
    `- Temperature range: 15°C–25°C (59°F–77°F)\n` +
    `- Conditions: Mild with a mix of sun and clouds\n` +
    `- Precipitation chance: Low (10–20%)\n\n` +
    `**Packing List**\n` +
    `- Light layers (t-shirts + a light jacket or cardigan)\n` +
    `- Comfortable walking shoes, jeans or trousers\n` +
    `- A scarf or wrap for cooler evenings\n\n` +
    `**Best Activities**\n` +
    `- All activities recommended! Great weather for both indoor and outdoor plans.\n` +
    `- Perfect for walking tours, outdoor dining, and sightseeing.\n` +
    `- Evenings: Al fresco dining or rooftop bars if available`
  );
}

// ── SSE helpers ────────────────────────────────────────────────────────

function encodeSSE(data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `data: ${JSON.stringify(data)}\n\n`,
  );
}

// ── Simulated streaming delay ──────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Agent runner (non-AI) ──────────────────────────────────────────────

interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  generator: (body: TripBody, context?: string) => string;
  delay: number;
}

const AGENTS: AgentConfig[] = [
  { id: "flight", name: "Flight Finder", icon: "🛫", generator: generateFlights, delay: 600 },
  { id: "hotel", name: "Hotel Scout", icon: "🏨", generator: generateHotels, delay: 700 },
  { id: "restaurant", name: "Restaurant Recommender", icon: "🍽️", generator: generateRestaurants, delay: 500 },
  { id: "attractions", name: "Attractions Agent", icon: "🎯", generator: generateAttractions, delay: 550 },
  { id: "budget", name: "Budget Optimizer", icon: "💰", generator: generateBudget, delay: 400 },
  { id: "weather", name: "Weather Advisor", icon: "🌤️", generator: generateWeather, delay: 450 },
];

async function runAgent(
  agent: AgentConfig,
  body: TripBody,
  context: string | undefined,
  controller: ReadableStreamDefaultController,
): Promise<string> {
  controller.enqueue(
    encodeSSE({ type: "agent_start", agent: agent.id, status: "started" }),
  );

  // Simulate thinking delay
  await sleep(agent.delay);

  const fullContent = agent.generator(body, context);

  // Stream the content character-by-character for a nice live effect
  const streamChars = Math.min(fullContent.length, 20);
  const chunkSize = Math.ceil(fullContent.length / streamChars);

  for (let i = 0; i < fullContent.length; i += chunkSize) {
    const chunk = fullContent.slice(i, i + chunkSize);
    controller.enqueue(
      encodeSSE({
        type: "agent_stream",
        agent: agent.id,
        content: chunk,
        status: "streaming",
      }),
    );
    // Small delay between chunks for streaming effect
    await sleep(15);
  }

  controller.enqueue(
    encodeSSE({
      type: "agent_complete",
      agent: agent.id,
      content: fullContent,
      status: "complete",
    }),
  );

  return fullContent;
}

// ── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // ── CORS preflight ────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Authenticate (optional) ────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  let userId: string | null = null;

  if (authHeader.startsWith("Bearer ")) {
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await supabaseClient.auth.getUser();
      userId = data?.user?.id ?? null;
    } catch {
      // Token invalid — treat as anonymous
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────
  let body: TripBody;

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!body.destination || !body.budget) {
    return new Response(
      JSON.stringify({ error: "destination and budget are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Validate budget is realistic ───────────────────────────────────
  const currency = (body.currency || "USD").toUpperCase();
  const rate = USD_RATES[currency] ?? 1;
  const budgetInUsd = Math.round(body.budget / rate);
  if (budgetInUsd < 50) {
    return new Response(
      JSON.stringify({
        error: `Your budget of ${currency} ${body.budget.toLocaleString()} (≈ $${budgetInUsd} USD) is too low for a realistic trip plan. Please enter a higher budget.`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ── Streaming response ────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        // Phase 1: Flight, Hotel, Restaurant, Attractions (parallel)
        const phase1Agents = AGENTS.slice(0, 4);
        const phase1Results = await Promise.all(
          phase1Agents.map(async (agent) => {
            const content = await runAgent(agent, body, undefined, controller);
            return { id: agent.id, name: agent.name, content };
          }),
        );

        // Build context from Phase 1
        let accumulatedContext = `Destination: ${body.destination}\nBudget: ${body.budget} ${currency}`;
        for (const result of phase1Results) {
          accumulatedContext += `\n\n--- ${result.name} recommends ---\n${result.content}`;
        }

        // Phase 2: Budget & Weather (sequential, need Phase 1 context)
        const phase2Agents = AGENTS.slice(4);
        const phase2Results: { id: string; content: string }[] = [];
        for (const agent of phase2Agents) {
          const content = await runAgent(agent, body, accumulatedContext, controller);
          phase2Results.push({ id: agent.id, content });
        }

        // ── Save trip if authenticated ─────────────────────────────
        // Auto-save with FULL itinerary data (all 6 agents)
        if (userId) {
          try {
            const serviceClient = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            );

            // Build full itinerary from ALL agents
            const allResults: Record<string, string> = {};
            for (const r of phase1Results) allResults[r.id] = r.content;
            for (const r of phase2Results) allResults[r.id] = r.content;

            const { data: trip, error } = await serviceClient
              .from("trips")
              .insert({
                user_id: userId,
                title: `Trip to ${body.destination}`,
                destination: body.destination,
                budget: body.budget,
                currency: currency,
                start_date: body.startDate || null,
                end_date: body.endDate || null,
                preferences: body.preferences || null,
                itinerary: allResults,
              })
              .select("id")
              .single();

            if (!error && trip) {
              controller.enqueue(
                encodeSSE({
                  type: "saved",
                  tripId: trip.id,
                  message: "Trip saved to your dashboard!",
                }),
              );
            }
          } catch {
            controller.enqueue(
              encodeSSE({
                type: "save_error",
                message: "Could not save trip. You can still copy the results.",
              }),
            );
          }
        }

        // Signal done
        controller.enqueue(encodeSSE({ type: "complete", status: "done" }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encodeSSE({
            type: "error",
            status: "error",
            error: "Trip planning failed: " + errorMessage,
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});