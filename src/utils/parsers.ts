// ── Types ───────────────────────────────────────────────────────────────

export interface FlightItem {
  airline: string;
  rating: string;
  priceRange: string;
  duration: string;
  stops: string;
  tag: string;
  url?: string;
}

export interface HotelItem {
  name: string;
  stars: string;
  pricePerNight: string;
  vibe: string;
  amenities: string;
  url?: string;
}

export interface RestaurantItem {
  name: string;
  cuisine: string;
  cost: string;
  description: string;
  url?: string;
}

export interface AttractionItem {
  name: string;
  category: string;
  cost: string;
  timeNeeded: string;
  description: string;
}

export interface BudgetCategory {
  name: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface BudgetData {
  categories: BudgetCategory[];
  total: number;
  remaining: number;
  tip?: string;
}

export interface WeatherData {
  temperatureRange: string;
  conditions: string;
  precipitationChance?: string;
  humidity?: string;
  wind?: string;
  packingList: string[];
  bestActivities: string[];
}

// ── Flight Parser ────────────────────────────────────────────────────────

export function parseFlights(markdown: string): FlightItem[] {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean);
  const items: FlightItem[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(/\*\*(.+?)\*\*\s*⭐\s*([\d.]+)/);
    if (!nameMatch) continue;

    const lines = block.split("\n").map((l) => l.trim());
    let priceRange = "";
    let duration = "";
    let stops = "";
    let tag = "";
    let url: string | undefined;

    for (const line of lines) {
      if (line.startsWith("- Estimated round-trip:")) {
        priceRange = line.replace("- Estimated round-trip:", "").trim();
      } else if (line.startsWith("- Duration:")) {
        const dur = line.replace("- Duration:", "").trim();
        const stopMatch = dur.match(/\((.+?)\)/);
        duration = stopMatch ? dur.replace(/\(.+?\)/, "").trim() : dur;
        stops = stopMatch ? stopMatch[1] : "Direct";
      } else if (line.startsWith("- ") && !line.startsWith("- Estimated") && !line.startsWith("- Duration:")) {
        tag = line.replace(/^-\s*/, "").trim();
      } else if (line.toLowerCase().startsWith("http") || line.toLowerCase().includes(".com")) {
        url = line.trim();
      }
    }

    items.push({
      airline: nameMatch[1],
      rating: nameMatch[2],
      priceRange,
      duration,
      stops,
      tag,
      url,
    });
  }

  return items;
}

// ── Hotel Parser ─────────────────────────────────────────────────────────

export function parseHotels(markdown: string): HotelItem[] {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean);
  const items: HotelItem[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(/\*\*(.+?)\*\*\s*([★☆]+)/);
    if (!nameMatch) continue;

    const lines = block.split("\n").map((l) => l.trim());
    let pricePerNight = "";
    let vibe = "";
    let amenities = "";
    let url: string | undefined;

    for (const line of lines) {
      if (line.startsWith("- ") && !line.startsWith("- Highlights:")) {
        const content = line.replace(/^-\s*/, "").trim();
        const priceMatch = content.match(/^([\w$€£¥₹₨]+\s*[\d,]+(?:\s*–\s*[\d,]+)?)\/night\s*[—–]\s*(.+)/);
        if (priceMatch) {
          pricePerNight = priceMatch[1].trim();
          vibe = priceMatch[2].trim();
        } else {
          vibe = content;
        }
      } else if (line.startsWith("- Highlights:")) {
        amenities = line.replace("- Highlights:", "").trim();
      } else if (line.toLowerCase().startsWith("http") || line.toLowerCase().includes(".com")) {
        url = line.trim();
      }
    }

    items.push({
      name: nameMatch[1],
      stars: nameMatch[2].trim(),
      pricePerNight,
      vibe,
      amenities,
      url,
    });
  }

  return items;
}

// ── Restaurant Parser ────────────────────────────────────────────────────

export function parseRestaurants(markdown: string): RestaurantItem[] {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean);
  const items: RestaurantItem[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(/\*\*(.+?)\*\*\s*[—–]\s*(.+)/);
    if (!nameMatch) continue;

    const lines = block.split("\n").map((l) => l.trim());
    let cost = "";
    let description = "";
    let url: string | undefined;

    for (const line of lines) {
      if (line.startsWith("- Estimated cost:")) {
        cost = line.replace("- Estimated cost:", "").trim();
      } else if (line.startsWith("- ") && !line.startsWith("- Estimated")) {
        description = line.replace(/^-\s*/, "").trim();
      } else if (line.toLowerCase().startsWith("http") || line.toLowerCase().includes(".com")) {
        url = line.trim();
      }
    }

    items.push({
      name: nameMatch[1],
      cuisine: nameMatch[2].trim(),
      cost,
      description,
      url,
    });
  }

  return items;
}

// ── Attractions Parser ───────────────────────────────────────────────────

export function parseAttractions(markdown: string): AttractionItem[] {
  const blocks = markdown.split(/\n\s*\n/).filter(Boolean);
  const items: AttractionItem[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(/\*\*(.+?)\*\*\s*[—–]\s*(.+)/);
    if (!nameMatch) continue;

    const lines = block.split("\n").map((l) => l.trim());
    let cost = "";
    let timeNeeded = "";
    let description = "";

    for (const line of lines) {
      if (line.startsWith("- Cost:")) {
        const parts = line.replace("- Cost:", "").trim();
        const partsSplit = parts.split("|");
        if (partsSplit.length >= 1) cost = partsSplit[0].trim();
        if (partsSplit.length >= 2) timeNeeded = partsSplit[1].replace("Time needed:", "").trim();
      } else if (line.startsWith("- ") && !line.startsWith("- Cost:")) {
        description = line.replace(/^-\s*/, "").trim();
      }
    }

    items.push({
      name: nameMatch[1],
      category: nameMatch[2].trim(),
      cost,
      timeNeeded,
      description,
    });
  }

  return items;
}

// ── Budget Parser ────────────────────────────────────────────────────────

export function parseBudget(markdown: string): BudgetData {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const categories: BudgetCategory[] = [];
  let total = 0;
  let remaining = 0;
  let tip = "";

  for (const line of lines) {
    // Parse table rows: | 🛫 Flights | USD 250 | 25% |
    const tableMatch = line.match(/^\|\s*(.+?)\s*\|\s*([\w$€£¥₹₨]+)\s*([\d,]+)\s*\|\s*(\d+)%\s*\|/);
    if (tableMatch) {
      categories.push({
        name: tableMatch[1].replace(/[^\w\s]/g, "").trim(),
        icon: tableMatch[1].match(/^(\p{Emoji})/u)?.[1] || "💰",
        amount: parseInt(tableMatch[3].replace(/,/g, "")),
        percentage: parseInt(tableMatch[4]),
      });
      continue;
    }

    // Total
    const totalMatch = line.match(/Total projected spend:/);
    if (totalMatch) {
      const numMatch = line.match(/[\w$€£¥₹₨]+\s*([\d,]+)/);
      if (numMatch) total = parseInt(numMatch[1].replace(/,/g, ""));
    }

    // Remaining
    const remainingMatch = line.match(/Remaining buffer:/);
    if (remainingMatch) {
      const numMatch = line.match(/[\w$€£¥₹₨]+\s*([\d,]+)/);
      if (numMatch) remaining = parseInt(numMatch[1].replace(/,/g, ""));
    }

    // Tip
    if (line.startsWith("💡") || line.includes("*Tip:")) {
      tip = line.replace(/^💡\s*/, "").replace(/\*/g, "").trim();
    }
  }

  return { categories, total, remaining, tip };
}

// ── Weather Parser ───────────────────────────────────────────────────────

export function parseWeather(markdown: string): WeatherData {
  const lines = markdown.split("\n").map((l) => l.trim());
  let temperatureRange = "";
  let conditions = "";
  let precipitationChance = "";
  let humidity = "";
  let wind = "";
  const packingList: string[] = [];
  const bestActivities: string[] = [];

  let currentSection: "weather" | "packing" | "activities" = "weather";

  for (const line of lines) {
    // Detect sections
    if (line.startsWith("**Expected Weather**")) {
      currentSection = "weather";
      continue;
    }
    if (line.startsWith("**Packing List**")) {
      currentSection = "packing";
      continue;
    }
    if (line.startsWith("**Best Activities**") || line.startsWith("**Best Activities:**")) {
      currentSection = "activities";
      continue;
    }

    // Skip empty lines and headers
    if (!line || line.startsWith("**")) continue;

    if (currentSection === "weather") {
      if (line.startsWith("- Temperature range:")) {
        temperatureRange = line.replace("- Temperature range:", "").trim();
      } else if (line.startsWith("- Conditions:")) {
        conditions = line.replace("- Conditions:", "").trim();
      } else if (line.startsWith("- Precipitation chance:")) {
        precipitationChance = line.replace("- Precipitation chance:", "").trim();
      } else if (line.startsWith("- Humidity:")) {
        humidity = line.replace("- Humidity:", "").trim();
      } else if (line.startsWith("- Wind:")) {
        wind = line.replace("- Wind:", "").trim();
      }
    } else if (currentSection === "packing") {
      if (line.startsWith("- ")) {
        packingList.push(line.replace(/^-\s*/, "").trim());
      } else {
        // Lines without - prefix but non-empty
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("**") && trimmed.length > 3) {
          packingList.push(trimmed);
        }
      }
    } else if (currentSection === "activities") {
      if (line.startsWith("- ")) {
        bestActivities.push(line.replace(/^-\s*/, "").trim());
      } else {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("**") && trimmed.length > 3) {
          bestActivities.push(trimmed);
        }
      }
    }
  }

  return {
    temperatureRange,
    conditions,
    precipitationChance,
    humidity,
    wind,
    packingList,
    bestActivities,
  };
}

// ── Generic markdown cleanup ─────────────────────────────────────────────

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic
    .replace(/```[\s\S]*?```/g, "")     // code blocks
    .replace(/`([^`]+)`/g, "$1")        // inline code
    .replace(/[|]{2,}/g, "")            // table pipes
    .replace(/^[-*+]\s+/gm, "")         // list markers
    .replace(/^#+\s+/gm, "")            // headings
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // links as text
    .trim();
}