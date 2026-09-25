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

// Key delivery and transport corridors in Tamil Nadu & South India
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
  {
    displayName: 'CODISSIA Trade Fair Complex, Coimbatore',
    shortName: 'CODISSIA, Coimbatore',
    lat: 11.0381,
    lng: 77.0298,
    type: 'local_preset',
    zone: 'Peelamedu',
    city: 'Coimbatore'
  },
  {
    displayName: 'Town Hall Commercial Market, Coimbatore',
    shortName: 'Town Hall, Coimbatore',
    lat: 10.9950,
    lng: 76.9610,
    type: 'local_preset',
    zone: 'Town Hall',
    city: 'Coimbatore'
  },
  {
    displayName: 'Ukkadam Bus Stand & Lake Corridor, Coimbatore',
    shortName: 'Ukkadam, Coimbatore',
    lat: 10.9880,
    lng: 76.9615,
    type: 'local_preset',
    zone: 'Ukkadam',
    city: 'Coimbatore'
  },
  {
    displayName: 'Saibaba Colony, Coimbatore',
    shortName: 'Saibaba Colony, Coimbatore',
    lat: 11.0275,
    lng: 76.9460,
    type: 'local_preset',
    zone: 'Saibaba Colony',
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
  {
    displayName: 'Velachery Bypass & MRTS Corridor, Chennai',
    shortName: 'Velachery, Chennai',
    lat: 12.9782,
    lng: 80.2224,
    type: 'local_preset',
    zone: 'Velachery',
    city: 'Chennai'
  },
  {
    displayName: 'Chennai Central Railway Station',
    shortName: 'Chennai Central',
    lat: 13.0827,
    lng: 80.2757,
    type: 'local_preset',
    zone: 'Park Town',
    city: 'Chennai'
  },

  // Other Major Tamil Nadu Hubs & Towns
  {
    displayName: 'Srivilliputhur, Virudhunagar, Tamil Nadu',
    shortName: 'Srivilliputhur',
    lat: 9.5601,
    lng: 77.6091,
    type: 'local_preset',
    zone: 'Srivilliputhur',
    city: 'Virudhunagar'
  },
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
    displayName: 'Periyar Bus Stand & Railway Junction, Madurai',
    shortName: 'Periyar, Madurai',
    lat: 9.9172,
    lng: 78.1130,
    type: 'local_preset',
    zone: 'Central',
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
  },
  {
    displayName: 'Central Bus Stand & Railway Station, Tiruchirappalli',
    shortName: 'Central Bus Stand, Trichy',
    lat: 10.7937,
    lng: 78.6865,
    type: 'local_preset',
    zone: 'Cantonment',
    city: 'Tiruchirappalli'
  },
  {
    displayName: 'Tiruppur Old & New Bus Stand Corridor, Tiruppur',
    shortName: 'Tiruppur Central',
    lat: 11.1085,
    lng: 77.3411,
    type: 'local_preset',
    zone: 'Central',
    city: 'Tiruppur'
  },
  {
    displayName: 'Erode Central Bus Terminus, Erode',
    shortName: 'Erode Bus Stand',
    lat: 11.3410,
    lng: 77.7172,
    type: 'local_preset',
    zone: 'Central',
    city: 'Erode'
  },
  {
    displayName: 'Dindigul City Bus Stand, Dindigul',
    shortName: 'Dindigul Central',
    lat: 10.3673,
    lng: 77.9803,
    type: 'local_preset',
    zone: 'Central',
    city: 'Dindigul'
  },
  {
    displayName: 'Tirunelveli Junction & New Bus Stand',
    shortName: 'Tirunelveli Junction',
    lat: 8.7139,
    lng: 77.7567,
    type: 'local_preset',
    zone: 'Junction',
    city: 'Tirunelveli'
  }
];

export async function searchLocalities(
  query: string,
  signal?: AbortSignal
): Promise<LocalityResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // 1. Instant local preset matching (supports partial and tokenized match)
  const queryTokens = trimmed.split(/[\s,]+/).filter(Boolean);
  const presetMatches = PRESET_CORRIDORS.filter(p => {
    const target = `${p.displayName} ${p.shortName} ${p.zone || ''} ${p.city || ''}`.toLowerCase();
    // Either exact substring or all query tokens present
    if (target.includes(trimmed)) return true;
    return queryTokens.every(token => target.includes(token));
  });

  // If query is very short or we have 4+ exact preset matches, return them directly
  if (trimmed.length < 3 || presetMatches.length >= 4) {
    return presetMatches.slice(0, 6);
  }

  // 2. OpenStreetMap Nominatim Search (with AbortSignal support)
  try {
    const encoded = encodeURIComponent(`${query}, India`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RestoraGigWorkerNetwork/1.0'
        },
        signal
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

      // Combine unique results: presets first, then OSM
      const combined = [...presetMatches];
      for (const r of osmResults) {
        if (!combined.some(c => Math.abs(c.lat - r.lat) < 0.005 && Math.abs(c.lng - r.lng) < 0.005)) {
          combined.push(r);
        }
      }
      return combined.slice(0, 7);
    }
  } catch (err: any) {
    // If request was aborted by newer search, silently return empty
    if (err.name === 'AbortError') {
      return [];
    }
    // Network or rate-limit fallback: return preset matches
  }

  return presetMatches;
}
