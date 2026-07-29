// data/routes.ts
// One route per travelable body (see bodies.ts). Stations are fictional waypoints
// along the way. distanceAU is illustrative (rounded, roughly Earth-relative).


export type Route = {
  destinationId: number; // matches Body.id
  stations: string[];    // ordered, Earth departure -> arrival
  distanceAU: number;
};

export const routes: Route[] = [
  // Mercury
  { destinationId: 1, distanceAU: 0.6,
    stations: ["Earth Orbit Gateway", "Hermes Waypoint", "Mercury Approach"] },

  // Venus
  { destinationId: 2, distanceAU: 0.3,
    stations: ["Earth Orbit Gateway", "Aphrodite Relay", "Venus Approach"] },

  // Earth (origin — technically a "local shuttle" route)
  { destinationId: 3, distanceAU: 0.0,
    stations: ["Earth Orbit Gateway"] },

  // Luna (Earth's moon)
  { destinationId: 4, distanceAU: 0.003,
    stations: ["Earth Orbit Gateway", "Luna Dock"] },

  // Mars
  { destinationId: 5, distanceAU: 0.5,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Mars Approach"] },

  // Phobos
  { destinationId: 6, distanceAU: 0.51,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Phobos Anchor Point"] },

  // Deimos
  { destinationId: 7, distanceAU: 0.51,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Deimos Outpost"] },

  // Jupiter
  { destinationId: 8, distanceAU: 4.2,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Jupiter Approach"] },

  // Io
  { destinationId: 9, distanceAU: 4.21,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Io Thermal Dock"] },

  // Europa
  { destinationId: 10, distanceAU: 4.22,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Europa Ice Pier"] },

  // Ganymede
  { destinationId: 11, distanceAU: 4.23,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Ganymede Central Hub"] },

  // Callisto
  { destinationId: 12, distanceAU: 4.24,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Callisto Rim Station"] },

  // Saturn
  { destinationId: 13, distanceAU: 8.6,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Saturn Approach"] },

  // Titan
  { destinationId: 14, distanceAU: 8.61,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Titan Mist Port"] },

  // Enceladus
  { destinationId: 15, distanceAU: 8.61,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Enceladus Geyser Watch"] },

  // Uranus
  { destinationId: 16, distanceAU: 18.2,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Uranus Tilt Station", "Uranus Approach"] },

  // Titania
  { destinationId: 17, distanceAU: 18.21,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Uranus Tilt Station", "Titania Canyon Dock"] },

  // Neptune
  { destinationId: 18, distanceAU: 29.1,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Uranus Tilt Station", "Neptune Windwatch Post", "Neptune Approach"] },

  // Triton
  { destinationId: 19, distanceAU: 29.11,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Uranus Tilt Station", "Neptune Windwatch Post", "Triton Retrograde Pier"] },

  // Pluto
  { destinationId: 20, distanceAU: 38.5,
    stations: ["Earth Orbit Gateway", "Ares Transfer Station", "Jovian Approach Beacon", "Cronus Ring Gate", "Uranus Tilt Station", "Neptune Windwatch Post", "Charon Frontier Post", "Pluto Approach"] },
];

// Simple MVP lookup (see lib/routeUtils.ts for how this gets used in the app)
export function getRoute(destinationId: number): Route {
  const route = routes.find((r) => r.destinationId === destinationId);
  if (!route) throw new Error(`No route found for destination id ${destinationId}`);
  return route;
}
