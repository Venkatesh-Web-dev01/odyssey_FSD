/**
 * Canonical data models for the Travel Itinerary Planner.
 *
 * These schemas define the shape of data flowing between
 * frontend, backend, database, and AI generation.
 */

// ─── Enums ───────────────────────────────────────────────

/** Activity categories for classification */
export const ACTIVITY_CATEGORIES = Object.freeze({
  SIGHTSEEING: 'sightseeing',
  FOOD: 'food',
  ADVENTURE: 'adventure',
  CULTURE: 'culture',
  SHOPPING: 'shopping',
  RELAXATION: 'relaxation',
  NIGHTLIFE: 'nightlife',
  NATURE: 'nature',
  TRANSIT: 'transit',
  OTHER: 'other',
});

/** Transport modes for logistics */
export const TRANSPORT_MODES = Object.freeze({
  WALK: 'walk',
  BUS: 'bus',
  TRAIN: 'train',
  TAXI: 'taxi',
  RIDESHARE: 'rideshare',
  SUBWAY: 'subway',
  FERRY: 'ferry',
  FLIGHT: 'flight',
  CAR: 'car',
  BICYCLE: 'bicycle',
  OTHER: 'other',
});

/** Trip lifecycle statuses */
export const TRIP_STATUSES = Object.freeze({
  DRAFT: 'draft',
  GENERATING: 'generating',
  GENERATED: 'generated',
  REFINING: 'refining',
  FINALIZED: 'finalized',
});

/** Budget ranges / tiers */
export const BUDGET_TIERS = Object.freeze({
  BUDGET: 'budget',
  MID_RANGE: 'mid-range',
  LUXURY: 'luxury',
});

/** Predefined user interests */
export const AVAILABLE_INTERESTS = Object.freeze([
  { id: 'food', label: 'Food', icon: '🍜', category: 'food' },
  { id: 'history', label: 'History', icon: '🏛️', category: 'culture' },
  { id: 'nature', label: 'Nature', icon: '🌲', category: 'nature' },
  { id: 'nightlife', label: 'Nightlife', icon: '🍸', category: 'nightlife' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', category: 'shopping' },
  { id: 'art_culture', label: 'Art & Culture', icon: '🎨', category: 'culture' },
  { id: 'adventure', label: 'Adventure', icon: '🧗', category: 'adventure' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘', category: 'relaxation' },
]);


// ─── Factory Functions ───────────────────────────────────

/**
 * Creates an empty Trip object.
 *
 * @typedef {Object} Trip
 * @property {string|null} id
 * @property {string} destination
 * @property {number} durationDays - Number of days
 * @property {string|number} budget - Budget tier ('budget' | 'mid-range' | 'luxury') or numeric amount
 * @property {string[]} interests - e.g. ["Food", "History"]
 * @property {string} status - One of TRIP_STATUSES
 * @property {string|null} createdAt - ISO 8601
 * @property {string|null} updatedAt - ISO 8601
 *
 * @returns {Trip}
 */
export function createEmptyTrip() {
  return {
    id: null,
    destination: '',
    durationDays: 3,
    budget: BUDGET_TIERS.MID_RANGE,
    interests: [],
    status: TRIP_STATUSES.DRAFT,
    createdAt: null,
    updatedAt: null,
  };
}

/**
 * Creates an empty Logistics object.
 *
 * @typedef {Object} Logistics
 * @property {string} travelTime - e.g. "15 min", "1 hr 30 min"
 * @property {string} transportMode - One of TRANSPORT_MODES
 * @property {string} notes - Additional travel notes
 *
 * @returns {Logistics}
 */
export function createEmptyLogistics() {
  return {
    travelTime: '',
    transportMode: TRANSPORT_MODES.WALK,
    notes: '',
  };
}

/**
 * Creates an empty Activity object.
 *
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} name - Activity name
 * @property {string} time - Start time, e.g. "09:00"
 * @property {string} duration - e.g. "2 hours"
 * @property {number} estimatedCost - Cost in USD
 * @property {string} category - One of ACTIVITY_CATEGORIES
 * @property {string} location - Address or place name
 * @property {string} notes - Additional details
 * @property {Logistics} logistics - Travel logistics to reach this activity
 *
 * @returns {Activity}
 */
export function createEmptyActivity() {
  return {
    id: '',
    name: '',
    time: '',
    duration: '',
    estimatedCost: 0,
    category: ACTIVITY_CATEGORIES.OTHER,
    location: '',
    notes: '',
    logistics: createEmptyLogistics(),
  };
}

/**
 * Creates an empty Day object.
 *
 * @typedef {Object} Day
 * @property {number} dayNumber - 1-indexed day number
 * @property {string} date - ISO date string, e.g. "2025-03-15"
 * @property {Activity[]} activities
 *
 * @returns {Day}
 */
export function createEmptyDay(dayNumber = 1) {
  return {
    dayNumber,
    date: '',
    activities: [],
  };
}

/**
 * Creates an empty Itinerary object.
 *
 * @typedef {Object} Itinerary
 * @property {Trip} trip
 * @property {Day[]} days
 * @property {boolean} isMock - Whether this is a mock or AI-generated
 *
 * @returns {Itinerary}
 */
export function createEmptyItinerary() {
  return {
    trip: createEmptyTrip(),
    days: [],
    isMock: false,
  };
}


// ─── Validation ──────────────────────────────────────────

/**
 * Validates a trip input object. Returns an object with
 * `valid` boolean and `errors` array.
 *
 * @param {Object} tripInput
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrip(tripInput) {
  const errors = [];

  if (!tripInput || typeof tripInput !== 'object') {
    return { valid: false, errors: ['Invalid trip payload.'] };
  }

  // 1. Destination
  if (!tripInput.destination || typeof tripInput.destination !== 'string' || tripInput.destination.trim() === '') {
    errors.push('Destination is required.');
  }

  // 2. Duration
  const duration = Number(tripInput.durationDays);
  if (!Number.isInteger(duration) || duration < 1 || duration > 30) {
    errors.push('Trip duration must be between 1 and 30 days.');
  }

  // 3. Budget (either string tier or positive number)
  const validTiers = Object.values(BUDGET_TIERS);
  if (typeof tripInput.budget === 'string') {
    if (!validTiers.includes(tripInput.budget.toLowerCase())) {
      errors.push(`Budget tier must be one of: ${validTiers.join(', ')}.`);
    }
  } else if (typeof tripInput.budget === 'number') {
    if (isNaN(tripInput.budget) || tripInput.budget < 0) {
      errors.push('Budget must be a non-negative number.');
    }
  } else {
    errors.push('Budget is required.');
  }

  // 4. Interests
  if (!Array.isArray(tripInput.interests) || tripInput.interests.length === 0) {
    errors.push('Select at least one interest.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


// ─── Canonical Schema Validation ─────────────────────────

/**
 * Validates that an itinerary strictly conforms to the canonical JSON structure.
 *
 * @param {Object} itinerary
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateItinerarySchema(itinerary) {
  const errors = [];
  if (!itinerary || typeof itinerary !== 'object') {
    return { valid: false, errors: ['Itinerary must be a valid JSON object.'] };
  }

  if (typeof itinerary.destination !== 'string' || !itinerary.destination.trim()) {
    errors.push('Missing or invalid "destination" string.');
  }

  if (typeof itinerary.budget !== 'string') {
    errors.push('Missing or invalid "budget" string.');
  }

  if (!Array.isArray(itinerary.interests)) {
    errors.push('Missing or invalid "interests" array.');
  }

  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    errors.push('Itinerary must contain at least one day in "days" array.');
  } else {
    itinerary.days.forEach((dayObj, dIdx) => {
      if (!dayObj || typeof dayObj !== 'object') {
        errors.push(`Day at index ${dIdx} is not an object.`);
        return;
      }
      if (typeof dayObj.day !== 'number') {
        errors.push(`Day at index ${dIdx} must have a numeric "day" property.`);
      }
      if (!Array.isArray(dayObj.activities) || dayObj.activities.length === 0) {
        errors.push(`Day ${dayObj.day || dIdx + 1} must contain at least one activity.`);
      } else {
        dayObj.activities.forEach((act, aIdx) => {
          if (!act || typeof act !== 'object') {
            errors.push(`Activity ${aIdx + 1} in Day ${dayObj.day || dIdx + 1} is not an object.`);
            return;
          }
          if (typeof act.id !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "id" string.`);
          if (typeof act.time !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "time" string.`);
          if (typeof act.title !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "title" string.`);
          if (typeof act.category !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "category" string.`);
          if (typeof act.location !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "location" string.`);
          if (typeof act.durationMinutes !== 'number' || act.durationMinutes <= 0) {
            errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: "durationMinutes" must be a positive number.`);
          }
          if (typeof act.estimatedCost !== 'number' || act.estimatedCost < 0) {
            errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: "estimatedCost" must be a non-negative number.`);
          }
          if (typeof act.description !== 'string') errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "description" string.`);
          if (!act.travelFromPrevious || typeof act.travelFromPrevious !== 'object') {
            errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: missing "travelFromPrevious" object.`);
          } else {
            if (typeof act.travelFromPrevious.distanceKm !== 'number' || act.travelFromPrevious.distanceKm < 0) {
              errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: travelFromPrevious.distanceKm must be a non-negative number.`);
            }
            if (typeof act.travelFromPrevious.travelTimeMinutes !== 'number' || act.travelFromPrevious.travelTimeMinutes < 0) {
              errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: travelFromPrevious.travelTimeMinutes must be a non-negative number.`);
            }
            if (typeof act.travelFromPrevious.transportMode !== 'string') {
              errors.push(`Day ${dayObj.day} Activity ${aIdx + 1}: travelFromPrevious.transportMode must be a string.`);
            }
          }
        });
      }
    });
  }

  if (typeof itinerary.totalEstimatedCost !== 'number' || itinerary.totalEstimatedCost < 0) {
    errors.push('Missing or invalid non-negative numeric "totalEstimatedCost".');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Ensures all activities in each day of an itinerary are sorted
 * chronologically by their start time ("HH:MM").
 *
 * @param {Object} itinerary
 * @returns {Object} Itinerary with chronologically ordered activities
 */
export function sortActivitiesChronologically(itinerary) {
  if (!itinerary?.days || !Array.isArray(itinerary.days)) {
    return itinerary;
  }

  itinerary.days.forEach((day) => {
    if (Array.isArray(day.activities) && day.activities.length > 1) {
      day.activities.sort((a, b) => {
        const timeA = (a.time || '00:00').trim();
        const timeB = (b.time || '00:00').trim();
        return timeA.localeCompare(timeB);
      });

      // Ensure the first activity starts from lodging/start point
      if (day.activities[0]?.travelFromPrevious) {
        day.activities[0].travelFromPrevious.distanceKm = 0;
        day.activities[0].travelFromPrevious.travelTimeMinutes = 0;
        day.activities[0].travelFromPrevious.transportMode = 'start';
      }
    }
  });

  return itinerary;
}

/**
 * Reconciles and recalculates totalEstimatedCost to strictly equal
 * the sum of all activities in the itinerary.
 *
 * @param {Object} itinerary
 * @returns {Object} Itinerary with verified totalEstimatedCost
 */
export function reconcileItineraryCosts(itinerary) {
  if (!itinerary?.days || !Array.isArray(itinerary.days)) {
    return itinerary;
  }

  const sum = itinerary.days.reduce(
    (total, day) => total + (day.activities || []).reduce((dSum, act) => dSum + (Number(act.estimatedCost) || 0), 0),
    0
  );

  itinerary.totalEstimatedCost = sum;
  return itinerary;
}


// ─── Mock Itinerary Generator ────────────────────────────

/**
 * Generates a structured mock day-by-day itinerary that conforms
 * strictly to the canonical Milestone 2 JSON schema.
 *
 * @param {Object} trip
 * @returns {Object} Itinerary matching the canonical structure
 */
export function generateMockItinerary(trip) {
  const destination = trip.destination || 'Selected Destination';
  const duration = Math.min(Math.max(Number(trip.durationDays) || 3, 1), 30);
  const budget = typeof trip.budget === 'string' ? trip.budget : BUDGET_TIERS.MID_RANGE;
  const interests = Array.isArray(trip.interests) && trip.interests.length > 0
    ? trip.interests
    : ['Culture', 'Food'];

  // Base cost multiplier by budget tier
  const costMultiplier = budget === BUDGET_TIERS.LUXURY ? 3.5 : budget === BUDGET_TIERS.BUDGET ? 0.7 : 1.5;

  // City-specific landmark datasets for rich and accurate mock itineraries & geocoding
  const isTokyo = destination.toLowerCase().includes('tokyo');
  const isParis = destination.toLowerCase().includes('paris');
  const isNewYork = destination.toLowerCase().includes('new york') || destination.toLowerCase().includes('nyc');

  const tokyoThemes = [
    [
      { time: '09:30', durationMinutes: 150, category: ACTIVITY_CATEGORIES.SIGHTSEEING, title: 'Senso-ji Temple & Traditional Asakusa Walk', location: 'Senso-ji Temple, Asakusa, Tokyo', description: 'Explore Tokyo’s oldest Buddhist temple and stroll along the historic Nakamise-dori merchant street.', cost: Math.round(15 * costMultiplier), travel: { distanceKm: 1.2, travelTimeMinutes: 15, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Early morning avoids the heaviest crowds; photography permitted outdoors.' },
      { time: '13:00', durationMinutes: 120, category: ACTIVITY_CATEGORIES.FOOD, title: 'Tsukiji Outer Market Tasting Tour', location: 'Tsukiji Outer Market, Chuo, Tokyo', description: 'Sample fresh sushi, tamagoyaki, grilled seafood, and artisanal street snacks directly from stall vendors.', cost: Math.round(35 * costMultiplier), travel: { distanceKm: 4.5, travelTimeMinutes: 20, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Cash is preferred at traditional street stalls.' },
      { time: '15:45', durationMinutes: 150, category: ACTIVITY_CATEGORIES.NATURE, title: 'Ueno Park & Cultural Museum Stroll', location: 'Ueno Park, Taito, Tokyo', description: 'Walk through spacious grounds featuring peaceful ponds, botanical gardens, and the Tokyo National Museum.', cost: Math.round(20 * costMultiplier), travel: { distanceKm: 3.2, travelTimeMinutes: 18, transportMode: TRANSPORT_MODES.WALK }, notes: 'Audio guides available in English and Japanese.' },
      { time: '19:00', durationMinutes: 180, category: ACTIVITY_CATEGORIES.NIGHTLIFE, title: 'Roppongi Hills Panorama & Dinner', location: 'Roppongi Hills, Minato, Tokyo', description: 'Enjoy spectacular evening city views from Tokyo City View observation deck followed by dining.', cost: Math.round(60 * costMultiplier), travel: { distanceKm: 6.0, travelTimeMinutes: 25, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Sunset window around 18:30 offers prime skyline views.' },
    ],
    [
      { time: '09:30', durationMinutes: 150, category: ACTIVITY_CATEGORIES.CULTURE, title: 'Meiji Jingu Shrine & Forest Path', location: 'Meiji Jingu Shrine, Shibuya, Tokyo', description: 'Visit the forested Shinto shrine dedicated to Emperor Meiji, entered through monumental cypress torii gates.', cost: Math.round(10 * costMultiplier), travel: { distanceKm: 1.5, travelTimeMinutes: 15, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Respectful silence encouraged near the main hall.' },
      { time: '13:00', durationMinutes: 120, category: ACTIVITY_CATEGORIES.SHOPPING, title: 'Harajuku Takeshita Street & Cat Street', location: 'Takeshita Street, Shibuya, Tokyo', description: 'Browse boutique fashion, vibrant street fashion, quirky cafes, and artisan coffee spots along Cat Street.', cost: Math.round(30 * costMultiplier), travel: { distanceKm: 0.8, travelTimeMinutes: 10, transportMode: TRANSPORT_MODES.WALK }, notes: 'Great spot for crepes and street treats.' },
      { time: '15:45', durationMinutes: 150, category: ACTIVITY_CATEGORIES.NATURE, title: 'Shinjuku Gyoen National Garden', location: 'Shinjuku Gyoen National Garden, Tokyo', description: 'Unwind in this expansive blend of Japanese traditional, English landscape, and French formal garden styles.', cost: Math.round(15 * costMultiplier), travel: { distanceKm: 2.4, travelTimeMinutes: 16, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Alcohol and sports equipment prohibited inside.' },
      { time: '19:00', durationMinutes: 180, category: ACTIVITY_CATEGORIES.FOOD, title: 'Shibuya Crossing & Izakaya Evening', location: 'Shibuya Crossing, Shibuya, Tokyo', description: 'Experience the world-famous scramble crossing from above, followed by a lively izakaya dining experience.', cost: Math.round(55 * costMultiplier), travel: { distanceKm: 2.8, travelTimeMinutes: 18, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Book tables ahead on Friday and weekend nights.' },
    ],
    [
      { time: '09:30', durationMinutes: 150, category: ACTIVITY_CATEGORIES.SIGHTSEEING, title: 'Imperial Palace East Gardens', location: 'Imperial Palace East Gardens, Chiyoda, Tokyo', description: 'Walk the historic foundations of Edo Castle, stone ramparts, moat bridges, and manicured Ninomaru gardens.', cost: Math.round(10 * costMultiplier), travel: { distanceKm: 2.0, travelTimeMinutes: 15, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Free entry; closed on Mondays and Fridays.' },
      { time: '13:00', durationMinutes: 120, category: ACTIVITY_CATEGORIES.SHOPPING, title: 'Ginza Avenue & Mitsukoshi Department Store', location: 'Ginza, Chuo, Tokyo', description: 'World-renowned shopping boulevard featuring department stores, architectural flagships, and gourmet depachika basements.', cost: Math.round(45 * costMultiplier), travel: { distanceKm: 1.5, travelTimeMinutes: 12, transportMode: TRANSPORT_MODES.WALK }, notes: 'Pedestrian paradise on weekend afternoons.' },
      { time: '15:45', durationMinutes: 150, category: ACTIVITY_CATEGORIES.CULTURE, title: 'Akihabara Electric Town & Pop Culture', location: 'Akihabara, Chiyoda, Tokyo', description: 'Explore iconic electronics superstores, retro gaming havens, anime figurines, and multi-floor tech arcades.', cost: Math.round(25 * costMultiplier), travel: { distanceKm: 3.5, travelTimeMinutes: 18, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Duty-free available with passport.' },
      { time: '19:00', durationMinutes: 180, category: ACTIVITY_CATEGORIES.NIGHTLIFE, title: 'Tokyo Skytree & Solamachi Dinner', location: 'Tokyo Skytree, Sumida, Tokyo', description: 'Take in nighttime panoramic vistas from 450m up, followed by waterfront promenade dining at Tokyo Solamachi.', cost: Math.round(65 * costMultiplier), travel: { distanceKm: 4.2, travelTimeMinutes: 22, transportMode: TRANSPORT_MODES.SUBWAY }, notes: 'Online fast-pass saves significant queue time.' },
    ],
  ];

  const genericThemes = [
    {
      time: '09:30',
      durationMinutes: 150,
      category: ACTIVITY_CATEGORIES.SIGHTSEEING,
      title: (d) => `Historic Highlights & Landmark Walk in ${destination} (Part ${d})`,
      location: `${destination} City Center`,
      description: `Morning walking and exploration tour focusing on historical monuments and iconic viewpoints matching your interests in ${interests.join(', ')}.`,
      cost: Math.round(20 * costMultiplier),
      travel: { distanceKm: 1.2, travelTimeMinutes: 15, transportMode: TRANSPORT_MODES.SUBWAY },
      notes: 'Morning hours offer the best light for photos and significantly smaller crowds.',
    },
    {
      time: '13:00',
      durationMinutes: 120,
      category: ACTIVITY_CATEGORIES.FOOD,
      title: (d) => `Curated Culinary Tasting & Central Market Tour (Day ${d})`,
      location: `${destination} Central Market`,
      description: `Sample authentic local specialties, street delicacies, and regional dishes matching your culinary preferences.`,
      cost: Math.round(35 * costMultiplier),
      travel: { distanceKm: 0.8, travelTimeMinutes: 10, transportMode: TRANSPORT_MODES.WALK },
      notes: 'Cash recommended for traditional stall vendors.',
    },
    {
      time: '15:45',
      durationMinutes: 150,
      category: interests.includes('Nature') ? ACTIVITY_CATEGORIES.NATURE : ACTIVITY_CATEGORIES.CULTURE,
      title: (d) => `${interests[0] || 'Art & Heritage'} Cultural Immersion`,
      location: `${destination} Botanical Gardens`,
      description: `In-depth visit to celebrated cultural galleries, artisan workshops, or tranquil gardens in central ${destination}.`,
      cost: Math.round(18 * costMultiplier),
      travel: { distanceKm: 2.1, travelTimeMinutes: 16, transportMode: TRANSPORT_MODES.BUS },
      notes: 'Advance entry included; audio guides provided in multiple languages.',
    },
    {
      time: '19:00',
      durationMinutes: 180,
      category: interests.includes('Nightlife') ? ACTIVITY_CATEGORIES.NIGHTLIFE : ACTIVITY_CATEGORIES.FOOD,
      title: (d) => `Evening Dining & Illuminated Promenade (Day ${d})`,
      location: `${destination} Waterfront`,
      description: `Relaxing dinner experience with panoramic views, regional beverage pairings, and evening walks.`,
      cost: Math.round(55 * costMultiplier),
      travel: { distanceKm: 3.0, travelTimeMinutes: 18, transportMode: TRANSPORT_MODES.TAXI },
      notes: 'Reservations recommended for peak evening seatings.',
    },
  ];

  const days = [];

  for (let d = 1; d <= duration; d++) {
    let dayActivities;

    if (isTokyo) {
      const themeSet = tokyoThemes[(d - 1) % tokyoThemes.length];
      dayActivities = themeSet.map((theme, idx) => ({
        id: `act-d${d}-${idx + 1}`,
        time: theme.time,
        title: theme.title,
        category: theme.category,
        location: theme.location,
        durationMinutes: theme.durationMinutes,
        estimatedCost: theme.cost,
        description: theme.description,
        travelFromPrevious: {
          distanceKm: idx === 0 ? 0 : theme.travel.distanceKm,
          travelTimeMinutes: idx === 0 ? 0 : theme.travel.travelTimeMinutes,
          transportMode: idx === 0 ? 'start' : theme.travel.transportMode,
        },
        notes: theme.notes,
      }));
    } else {
      dayActivities = genericThemes.map((theme, idx) => ({
        id: `act-d${d}-${idx + 1}`,
        time: theme.time,
        title: theme.title(d),
        category: theme.category,
        location: theme.location,
        durationMinutes: theme.durationMinutes,
        estimatedCost: theme.cost,
        description: theme.description,
        travelFromPrevious: {
          distanceKm: idx === 0 ? 0 : theme.travel.distanceKm,
          travelTimeMinutes: idx === 0 ? 0 : theme.travel.travelTimeMinutes,
          transportMode: idx === 0 ? 'start' : theme.travel.transportMode,
        },
        notes: theme.notes,
      }));
    }

    days.push({
      day: d,
      activities: dayActivities,
    });
  }

  const totalEstimatedCost = days.reduce(
    (sum, day) => sum + day.activities.reduce((dSum, act) => dSum + act.estimatedCost, 0),
    0
  );

  return {
    destination,
    budget,
    interests,
    days,
    totalEstimatedCost,
    isMock: true,
  };
}
