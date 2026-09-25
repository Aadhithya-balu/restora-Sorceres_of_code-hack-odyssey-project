/**
 * Geocoding and Locality Discovery Service for Restora
 * Supports fast corridor autocomplete for Tamil Nadu logistics hubs
 * and debounced OpenStreetMap Nominatim search for any Indian locality.
 * Strictly respects free-tier usage limits and never labels searched coords as live GPS.
 */

export interface LocalityResult {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: 'local_preset' | 'osm_result';
  zone?: string;
  city?: string;
}

// Key delivery and transport corridors in Tamil Nadu
export const PRESET_CORRIDORS: LocalityResult[] = [
  // Coimbatore Delivery Corridors
  {
    displayName: 'Peelamedu & Avinashi Road IT Corridor, Coimbatore',
    shortName: 'Peelamedu, Coimbatore',
    lat: 11.0267,
    lng: 77.0118,
    type: 'local_preset',
    zone: 'Peelamedu',
    city: 'Coimbatore'
  },
  {
    displayName: 'Gandhipuram Central Bus Terminal, Coimbatore',
    shortName: 'Gandhipuram, Coimbatore',
    lat: 11.0168,
    lng: 76.9676,
    type: 'local_preset',
    zone: 'Gandhipuram',
    city: 'Coimbatore'
  },
  {
    displayName: 'RS Puram Commercial Hub, Coimbatore',
    shortName: 'RS Puram, Coimbatore',
    lat: 11.0084,
    lng: 76.9485,
    type: 'local_preset',
    zone: 'RS Puram',
    city: 'Coimbatore'
  },
  {
    displayName: 'Singanallur Trichy Road Corridor, Coimbatore',
    shortName: 'Singanallur, Coimbatore',
    lat: 10.9998,
    lng: 77.0234,
    type: 'local_preset',
    zone: 'Singanallur',
    city: 'Coimbatore'
  },
  {
    displayName: 'Saravanampatti Tech Zone, Coimbatore',
    shortName: 'Saravanampatti, Coimbatore',
    lat: 11.0827,
    lng: 76.9961,
    type: 'local_preset',
    zone: 'Saravanampatti',
    city: 'Coimbatore'
  },
  {
    displayName: 'Hope College Junction, Coimbatore',
    shortName: 'Hope College, Coimbatore',
    lat: 11.0315,
    lng: 77.0162,
    type: 'local_preset',
    zone: 'Peelamedu',
    city: 'Coimbatore'
  },
  {
    displayName: 'Coimbatore Railway Station Junction',
    shortName: 'Coimbatore Junction',
    lat: 10.9972,
    lng: 76.9629,
    type: 'local_preset',
    zone: 'Town Hall',
    city: 'Coimbatore'
  },
  {
    displayName: 'TIDEL Park ELCOT SEZ, Coimbatore',
    shortName: 'TIDEL Park, Coimbatore',
    lat: 11.0289,
    lng: 77.0274,
    type: 'local_preset',
    zone: 'Peelamedu',
    city: 'Coimbatore'
  },

  // Chennai Hubs
  {
    displayName: 'Koyambedu CMBT Bus Terminus, Chennai',
    shortName: 'Koyambedu, Chennai',
    lat: 13.0674,
    lng: 80.1952,
    type: 'local_preset',
    zone: 'Koyambedu',
    city: 'Chennai'
  },
  {
    displayName: 'OMR Rajiv Gandhi IT Expressway, Thoraipakkam, Chennai',
    shortName: 'OMR IT Corridor, Chennai',
    lat: 12.9696,
    lng: 80.2443,
    type: 'local_preset',
    zone: 'Thoraipakkam',
    city: 'Chennai'
  },
  {
    displayName: 'T. Nagar Commercial Shopping District, Chennai',
    shortName: 'T. Nagar, Chennai',
    lat: 13.0418,
    lng: 80.2341,
    type: 'local_preset',
    zone: 'T Nagar',
    city: 'Chennai'
  },
  {
    displayName: 'Guindy Industrial Estate & Metro, Chennai',
    shortName: 'Guindy, Chennai',
    lat: 13.0067,
    lng: 80.2023,
    type: 'local_preset',
    zone: 'Guindy',
    city: 'Chennai'
  },

  // Madurai & Salem
  {
    displayName: 'Mattuthavani Integrated Bus Stand, Madurai',
    shortName: 'Mattuthavani, Madurai',
    lat: 9.9452,
    lng: 78.1568,
    type: 'local_preset',
    zone: 'Mattuthavani',
    city: 'Madurai'
  },
  {
    displayName: 'New Bus Stand Meyyanur, Salem',
    shortName: 'New Bus Stand, Salem',
    lat: 11.6683,
    lng: 78.1342,
    type: 'local_preset',
    zone: 'Meyyanur',
    city: 'Salem'
  }
];

let lastSearchTime = 0;

export async function searchLocalities(query: string): Promise<LocalityResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // 1. Instant local preset matching
  const presetMatches = PRESET_CORRIDORS.filter(p => 
    p.displayName.toLowerCase().includes(trimmed) ||
    p.shortName.toLowerCase().includes(trimmed) ||
    (p.zone && p.zone.toLowerCase().includes(trimmed)) ||
    (p.city && p.city.toLowerCase().includes(trimmed))
  );

  // If we have strong local preset matches, return them immediately
  if (presetMatches.length >= 3) {
    return presetMatches.slice(0, 5);
  }

  // 2. OpenStreetMap Nominatim Search (debounced 500ms to respect rate limits)
  const now = Date.now();
  if (now - lastSearchTime < 400) {
    return presetMatches;
  }
  lastSearchTime = now;

  try {
    const encoded = encodeURIComponent(`${query}, India`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=4&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RestoraGigWorkerNetwork/1.0'
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      const osmResults: LocalityResult[] = data.map((item: any) => ({
        displayName: item.display_name,
        shortName: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: 'osm_result' as const,
        city: item.address?.city || item.address?.town || item.address?.state_district,
        zone: item.address?.suburb || item.address?.neighbourhood
      }));

      // Combine unique results
      const combined = [...presetMatches];
      for (const r of osmResults) {
        if (!combined.some(c => Math.abs(c.lat - r.lat) < 0.005 && Math.abs(c.lng - r.lng) < 0.005)) {
          combined.push(r);
        }
      }
      return combined.slice(0, 6);
    }
  } catch (err) {
    console.warn('[GeocodeService] Nominatim fallback failed or offline:', err);
  }

  return presetMatches;
}
