// data/bodies.ts
// Catalog of travelable destinations for SolarExpress.
// distanceAU values are illustrative (rounded, average Sun-distance for planets;
// moons inherit their parent planet's approximate distance).

export type Body = {
  id: number;
  name: string;
  type: "planet" | "moon";
  parentPlanetId?: number;
  priceEth: string;
  description: string;
  color?: string;
  hasRing?: boolean;
};

export const bodies: Body[] = [
  // --- Mercury ---
  { id: 1, name: "Mercury", type: "planet", priceEth: "0.004", color: "#8c7853",
    description: "The innermost world — a scorched, cratered dash past the Sun." },

  // --- Venus ---
  { id: 2, name: "Venus", type: "planet", priceEth: "0.006", color: "#e8c88a",
    description: "Thick clouds and crushing pressure. Not a beach destination." },

  // --- Earth + Moon ---
  { id: 3, name: "Earth", type: "planet", priceEth: "0.001", color: "#2266aa",
    description: "Home base. Most departures start here." },
  { id: 4, name: "Luna", type: "moon", parentPlanetId: 3, priceEth: "0.002", color: "#b8b8b8",
    description: "Earth's own Moon — the classic first hop for new travelers." },

  // --- Mars + moons ---
  { id: 5, name: "Mars", type: "planet", priceEth: "0.010", color: "#c1440e",
    description: "The red frontier. Most-booked long-haul destination." },
  { id: 6, name: "Phobos", type: "moon", parentPlanetId: 5, priceEth: "0.012", color: "#8a7a6a",
    description: "A lumpy, fast-orbiting rock — low gravity, great views of Mars." },
  { id: 7, name: "Deimos", type: "moon", parentPlanetId: 5, priceEth: "0.011", color: "#9a8a7a",
    description: "Smaller and quieter than Phobos. A favorite for photographers." },

  // --- Jupiter + moons ---
  { id: 8, name: "Jupiter", type: "planet", priceEth: "0.035", color: "#d8a76c",
    description: "The giant. Ticket includes a storm-watching pass over the Great Red Spot." },
  { id: 9, name: "Io", type: "moon", parentPlanetId: 8, priceEth: "0.038", color: "#e8d888",
    description: "The most volcanically active body in the system. Bring a heat shield." },
  { id: 10, name: "Europa", type: "moon", parentPlanetId: 8, priceEth: "0.040", color: "#d8e8f0",
    description: "An icy shell over a hidden ocean — the system's top astrobiology stop." },
  { id: 11, name: "Ganymede", type: "moon", parentPlanetId: 8, priceEth: "0.039", color: "#a89888",
    description: "The largest moon in the solar system, with its own magnetic field." },
  { id: 12, name: "Callisto", type: "moon", parentPlanetId: 8, priceEth: "0.037", color: "#6a6058",
    description: "Ancient, heavily cratered, and calm — a quiet edge-of-Jupiter stop." },

  // --- Saturn + moons ---
  { id: 13, name: "Saturn", type: "planet", priceEth: "0.050", color: "#e0c992", hasRing: true,
    description: "Ringside seats, literally. Package includes a ring-plane flyby." },
  { id: 14, name: "Titan", type: "moon", parentPlanetId: 13, priceEth: "0.055", color: "#d8a858",
    description: "Thick atmosphere, methane lakes — the closest thing to alien coastlines." },
  { id: 15, name: "Enceladus", type: "moon", parentPlanetId: 13, priceEth: "0.052", color: "#f0f4f8",
    description: "Ice geysers erupt from its south pole. A short but spectacular detour." },

  // --- Uranus + moon ---
  { id: 16, name: "Uranus", type: "planet", priceEth: "0.080", color: "#9fd8e0",
    description: "Tilted on its side and pale blue-green. A long, cold journey." },
  { id: 17, name: "Titania", type: "moon", parentPlanetId: 16, priceEth: "0.082", color: "#9098a0",
    description: "Uranus's largest moon — canyons deep enough to swallow a station." },

  // --- Neptune + moon ---
  { id: 18, name: "Neptune", type: "planet", priceEth: "0.095", color: "#3d5ce0",
    description: "The windiest world in the system. Not for the faint of heart." },
  { id: 19, name: "Triton", type: "moon", parentPlanetId: 18, priceEth: "0.097", color: "#d1495b",
    description: "A captured moon with nitrogen geysers, orbiting backwards." },

  // --- Pluto (bonus, dwarf planet) ---
  { id: 20, name: "Pluto", type: "planet", priceEth: "0.120", color: "#c9b8a8",
    description: "The farthest scheduled stop. Bring warm clothes and patience." }
];
