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

// ── Simulated streaming delay ──────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Data generators ────────────────────────────────────────────────────

function generateFlights(body: TripBody): string {
  const dest = body.destination;
  const budget = body.budget;
  const currency = body.currency;

  const airlines = [
    { name: "SkyWings Airways", rating: "4.2" },
    { name: "GlobalAir Connect", rating: "4.5" },
    { name: "AeroVista", rating: "3.9" },
  ];

  const priceRange = Math.max(200, Math.round(budget * 0.25));

  return airlines
    .map(
      (a, i) =>
        `**${a.name}** ⭐ ${a.rating}\n` +
        `- Estimated round-trip: ${currency} ${priceRange + i * 80}–${priceRange + i * 80 + 120}\n` +
        `- Duration: ${6 + i * 2}h ${10 + i * 15}m (with 1 stop)` +
        (i === 1 ? " — direct option available at +15%" : "") +
        `\n- ${i === 0 ? "Best value — lowest fare" : i === 1 ? "Recommended — balanced price & comfort" : "Budget-friendly, longer layover"}\n`
    )
    .join("\n");
}

function generateHotels(body: TripBody): string {
  const currency = body.currency;
  const budget = body.budget;
  const nightly = Math.round(budget * 0.15);

  const options = [
    {
      name: "Sunset Plaza Hotel",
      stars: "★★★★☆",
      price: nightly,
      amenity: "Pool & free breakfast",
      vibe: "Mid-range comfort near city center",
    },
    {
      name: "The Grand Horizon",
      stars: "★★★★★",
      price: Math.round(nightly * 1.6),
      amenity: "Rooftop bar, spa & gym",
      vibe: "Luxury stay with panoramic views",
    },
    {
      name: "CozyStay Inn",
      stars: "★★★☆☆",
      price: Math.round(nightly * 0.6),
      amenity: "Free Wi-Fi & self-check-in",
      vibe: "Budget-friendly & centrally located",
    },
  ];

  return options
    .map(
      (h) =>
        `**${h.name}** ${h.stars}\n` +
        `- ${currency} ${h.price}/night — ${h.vibe}\n` +
        `- Highlights: ${h.amenity}\n`
    )
    .join("\n");
}

function generateRestaurants(body: TripBody): string {
  const currency = body.currency;

  const picks = [
    {
      name: "Local Bazaar Kitchen",
      cuisine: "Street Food / Local",
      cost: `${currency} 8–15`,
      why: "Best place to sample authentic local dishes. Try the signature platter.",
    },
    {
      name: "Mediterraneo Grill",
      cuisine: "Mediterranean / Seafood",
      cost: `${currency} 25–45`,
      why: "Fresh seafood with a lovely outdoor terrace. Perfect for dinner.",
    },
    {
      name: "Fusion Table",
      cuisine: "Asian Fusion",
      cost: `${currency} 15–30`,
      why: "Creative small plates and craft cocktails in a trendy setting.",
    },
  ];

  return picks
    .map(
      (r) =>
        `**${r.name}** — ${r.cuisine}\n` +
        `- Estimated cost: ${r.cost}\n` +
        `- ${r.why}\n`
    )
    .join("\n");
}

function generateAttractions(body: TripBody): string {
  const currency = body.currency;

  const spots = [
    {
      name: "Old Town Heritage Walk",
      type: "Walking Tour",
      cost: `${currency} 0 (free)`,
      time: "2–3 hours",
      why: "Explore historic streets, local markets, and hidden courtyards with a guide.",
    },
    {
      name: "Sunset Viewpoint & Nature Trail",
      type: "Outdoor / Hiking",
      cost: `${currency} 5 entry`,
      time: "Half day",
      why: "A moderate hike leading to a stunning panoramic viewpoint. Bring your camera!",
    },
    {
      name: "City Museum of Art & Culture",
      type: "Museum",
      cost: `${currency} 12`,
      time: "1.5–2 hours",
      why: "Houses an impressive collection of local art and rotating international exhibits.",
    },
  ];

  return spots
    .map(
      (s) =>
        `**${s.name}** — ${s.type}\n` +
        `- Cost: ${s.cost} | Time needed: ${s.time}\n` +
        `- ${s.why}\n`
    )
    .join("\n");
}

function generateBudget(body: TripBody, context: string): string {
  const budget = body.budget;
  const currency = body.currency;

  const flightPct = 25;
  const hotelPct = 40;
  const foodPct = 15;
  const activitiesPct = 12;
  const miscPct = 8;

  return (
    `**Day-by-Day Budget Breakdown**\n\n` +
    `| Category | ${currency} | % of Budget |\n` +
    `|---|---|---|\n` +
    `| 🛫 Flights | ${currency} ${Math.round(budget * flightPct / 100)} | ${flightPct}% |\n` +
    `| 🏨 Accommodation | ${currency} ${Math.round(budget * hotelPct / 100)} | ${hotelPct}% |\n` +
    `| 🍽️ Meals & Dining | ${currency} ${Math.round(budget * foodPct / 100)} | ${foodPct}% |\n` +
    `| 🎯 Activities | ${currency} ${Math.round(budget * activitiesPct / 100)} | ${activitiesPct}% |\n` +
    `| 🔧 Misc / Transport | ${currency} ${Math.round(budget * miscPct / 100)} | ${miscPct}% |\n\n` +
    `**Total projected spend:** ${currency} ${budget}\n` +
    `**Remaining buffer:** ${currency} 0 (allocation is within budget)\n\n` +
    `💡 *Tip: Look for combo deals on flights+hotels to free up more for activities.*`
  );
}

function generateWeather(body: TripBody): string {
  const dest = body.destination;
  const isTropical = ["bali", "thailand", "maldives", "hawaii", "phuket", "goa"].some((d) =>
    dest.toLowerCase().includes(d)
  );
  const isCold = ["reykjavik", "iceland", "oslo", "stockholm", "helsinki", "switzerland", "alps"].some((d) =>
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
        let accumulatedContext = `Destination: ${body.destination}\nBudget: ${body.budget} ${body.currency}`;
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
                currency: body.currency || "USD",
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