import OpenAI from 'openai';
import {
  generateMockItinerary,
  validateItinerarySchema,
  sortActivitiesChronologically,
  reconcileItineraryCosts,
  BUDGET_TIERS,
} from '@travel-planner/shared';

/**
 * Dedicated GenAI service for generating structured travel itineraries.
 * Encapsulates all OpenAI interactions, schema enforcement, timeout control,
 * sanitized logging, and development mock fallback mode.
 */

/**
 * Checks if the system should operate in mock fallback mode.
 * @returns {boolean}
 */
export function isMockModeEnabled() {
  if (process.env.MOCK_AI_GENERATION === 'true') {
    return true;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === '' || key.includes('placeholder') || key.includes('your_openai_api_key')) {
    return true;
  }
  return false;
}

/**
 * Generates a structured itinerary via OpenAI API (or development mock fallback).
 *
 * @param {Object} trip - Trip parameters { id, destination, durationDays, budget, interests }
 * @returns {Promise<Object>} Strictly validated canonical itinerary object
 */
export async function generateItinerary(trip) {
  const { destination, durationDays, budget, interests } = trip;

  console.log(`[AI Service] Processing itinerary request for "${destination}", ${durationDays} days, budget: ${budget}`);

  // Check for development mock / fallback mode
  if (isMockModeEnabled()) {
    console.log('[AI Service] Operating in development fallback mode (MOCK_AI_GENERATION=true or placeholder key).');
    const mockResult = generateMockItinerary(trip);
    sortActivitiesChronologically(mockResult);
    reconcileItineraryCosts(mockResult);

    // Validate even the mock result against the schema
    const validation = validateItinerarySchema(mockResult);
    if (!validation.valid) {
      throw new Error(`Mock itinerary failed schema validation: ${validation.errors.join('; ')}`);
    }

    return {
      ...mockResult,
      isMock: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // Active OpenAI API path
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const client = new OpenAI({
    apiKey,
    timeout: 45000, // 45 second timeout
  });

  const prompt = `
Create a realistic, geographically cohesive, day-by-day travel itinerary for:
- Destination: ${destination}
- Duration: ${durationDays} full days
- Budget Level: ${budget}
- Interests: ${interests.join(', ')}

Strict Rules:
1. Schedule exactly ${durationDays} days (day numbers 1 through ${durationDays}).
2. Provide 3 to 4 distinct, realistic activities per day (e.g. morning, lunch/afternoon, late afternoon, evening).
3. Cluster activities geographically each day to minimize unnecessary cross-city transit.
4. Provide realistic approximate travel metrics in "travelFromPrevious" for each activity (first activity of each day can have 0 km/mins from lodging).
5. Ensure all costs are realistic approximate estimates in USD matching the requested "${budget}" tier.
6. Return strictly valid JSON conforming to the canonical schema provided.
`;

  const systemInstructions = `
You are an expert master travel architect. You generate meticulously organized, realistic travel itineraries.
You must respond with ONLY a valid JSON object strictly matching this schema:

{
  "destination": "${destination}",
  "budget": "${budget}",
  "interests": ${JSON.stringify(interests)},
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "id": "act-d1-1",
          "time": "09:00",
          "title": "Descriptive Activity Title",
          "category": "sightseeing",
          "location": "Specific place name or landmark in ${destination}",
          "durationMinutes": 120,
          "estimatedCost": 25,
          "description": "Engaging description of what the traveler does here.",
          "travelFromPrevious": {
            "distanceKm": 0,
            "travelTimeMinutes": 0,
            "transportMode": "start"
          },
          "notes": "Helpful insider tip or logistical guidance."
        }
      ]
    }
  ],
  "totalEstimatedCost": 150
}

Valid categories: sightseeing, food, adventure, culture, shopping, relaxation, nightlife, nature, transit, other.
Valid transport modes: walk, subway, bus, taxi, train, ferry, rideshare, bicycle, car, flight, start.
Do not output markdown code blocks or additional text. Output ONLY pure raw JSON.
`;

  try {
    console.log(`[AI Service] Invoking OpenAI model ${model}...`);
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty completion response.');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('[AI Service] Failed to parse JSON from OpenAI response:', parseErr.message);
      throw new Error('OpenAI output was not valid JSON.');
    }

    // Ensure metadata fields match input
    parsed.destination = parsed.destination || destination;
    parsed.budget = parsed.budget || budget;
    parsed.interests = Array.isArray(parsed.interests) ? parsed.interests : interests;

    // Enforce chronological sorting and cost reconciliation
    sortActivitiesChronologically(parsed);
    reconcileItineraryCosts(parsed);

    // Validate strictly against canonical schema
    const validation = validateItinerarySchema(parsed);
    if (!validation.valid) {
      console.error('[AI Service] Schema validation failed:', validation.errors);
      throw new Error(`AI generated itinerary failed schema validation: ${validation.errors.join('; ')}`);
    }

    console.log(`[AI Service] Successfully generated and validated ${parsed.days.length}-day itinerary.`);

    return {
      ...parsed,
      isMock: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    // Sanitize and handle errors without leaking credentials
    if (err.status === 401) {
      console.error('[AI Service] OpenAI Authentication failed: Invalid API key.');
      throw new Error('OpenAI authentication failed. Please verify your OPENAI_API_KEY.');
    } else if (err.status === 429) {
      console.error('[AI Service] OpenAI Rate limit or quota exceeded.');
      throw new Error('OpenAI rate limit or quota exceeded. Please check your account usage.');
    } else if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
      console.error('[AI Service] OpenAI API request timed out.');
      throw new Error('OpenAI request timed out. Please try again.');
    }

    console.error('[AI Service] Generation error:', err.message);
    throw err;
  }
}


/**
 * Refines an existing itinerary based on a user's conversational request.
 * The AI receives the CURRENT itinerary as context and modifies only what
 * the user requests, preserving everything else.
 *
 * @param {Object} trip - Trip parameters { destination, durationDays, budget, interests }
 * @param {Object} currentItinerary - The current canonical itinerary JSON
 * @param {Array} chatHistory - Array of { role, content } chat messages (last N)
 * @param {string} userMessage - The user's refinement request
 * @returns {Promise<Object>} Updated canonical itinerary object
 */
export async function refineItinerary(trip, currentItinerary, chatHistory, userMessage) {
  const { destination, durationDays, budget, interests } = trip;

  console.log(`[AI Service] Processing refinement request for "${destination}": "${userMessage}"`);

  // ─── Mock Fallback Mode ────────────────────────────────────
  if (isMockModeEnabled()) {
    console.log('[AI Service] Refinement in development fallback mode (mock mutations).');
    const refined = applyMockRefinement(currentItinerary, userMessage);
    sortActivitiesChronologically(refined);
    reconcileItineraryCosts(refined);

    const validation = validateItinerarySchema(refined);
    if (!validation.valid) {
      throw new Error(`Mock refinement failed schema validation: ${validation.errors.join('; ')}`);
    }

    return {
      ...refined,
      isMock: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Active OpenAI API Path ────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const client = new OpenAI({
    apiKey,
    timeout: 60000, // 60s timeout (refinement can be slower with large context)
  });

  const systemInstructions = `
You are an expert travel itinerary editor. You will receive:
1. A user's current travel itinerary as a JSON object.
2. A conversation history of previous refinements.
3. A new refinement request from the user.

YOUR CRITICAL RULES:
- You MUST modify ONLY what the user explicitly requests.
- You MUST preserve ALL activities, timings, locations, costs, and logistics that the user did NOT ask to change.
- You MUST maintain the exact same JSON schema structure as the input.
- You MUST maintain budget constraints (budget tier: "${budget}").
- You MUST maintain chronological ordering of activities within each day.
- You MUST maintain realistic travel logistics (travelFromPrevious) between consecutive activities.
- You MUST recalculate "totalEstimatedCost" after any cost changes.
- You MUST return the COMPLETE updated itinerary, not just the changed parts.

Valid categories: sightseeing, food, adventure, culture, shopping, relaxation, nightlife, nature, transit, other.
Valid transport modes: walk, subway, bus, taxi, train, ferry, rideshare, bicycle, car, flight, start.

Do not output markdown code blocks or additional text. Output ONLY pure raw JSON matching the canonical schema.
`;

  // Build the conversation messages
  const messages = [
    { role: 'system', content: systemInstructions },
    {
      role: 'user',
      content: `Here is the current itinerary for ${destination} (${durationDays} days, ${budget} budget, interests: ${interests.join(', ')}):\n\n${JSON.stringify(currentItinerary, null, 2)}`,
    },
  ];

  // Include recent chat history for multi-turn context (last 10 messages)
  const recentHistory = Array.isArray(chatHistory) ? chatHistory.slice(-10) : [];
  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the new user refinement request
  messages.push({
    role: 'user',
    content: `Please apply this refinement to the itinerary: "${userMessage}"\n\nReturn the complete updated itinerary JSON.`,
  });

  try {
    console.log(`[AI Service] Invoking OpenAI model ${model} for refinement...`);
    const completion = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower temperature for more precise edits
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty refinement response.');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('[AI Service] Failed to parse refinement JSON:', parseErr.message);
      throw new Error('OpenAI refinement output was not valid JSON.');
    }

    // Ensure metadata fields match input
    parsed.destination = parsed.destination || destination;
    parsed.budget = parsed.budget || budget;
    parsed.interests = Array.isArray(parsed.interests) ? parsed.interests : interests;

    // Enforce chronological sorting and cost reconciliation
    sortActivitiesChronologically(parsed);
    reconcileItineraryCosts(parsed);

    // Validate strictly against canonical schema
    const validation = validateItinerarySchema(parsed);
    if (!validation.valid) {
      console.error('[AI Service] Refinement schema validation failed:', validation.errors);
      throw new Error(`Refined itinerary failed schema validation: ${validation.errors.join('; ')}`);
    }

    console.log(`[AI Service] Successfully refined itinerary (${parsed.days.length} days).`);

    return {
      ...parsed,
      isMock: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err.status === 401) {
      console.error('[AI Service] OpenAI Authentication failed during refinement.');
      throw new Error('OpenAI authentication failed. Please verify your OPENAI_API_KEY.');
    } else if (err.status === 429) {
      console.error('[AI Service] OpenAI Rate limit exceeded during refinement.');
      throw new Error('OpenAI rate limit or quota exceeded. Please check your account usage.');
    } else if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
      console.error('[AI Service] OpenAI refinement request timed out.');
      throw new Error('OpenAI refinement request timed out. Please try again.');
    }

    console.error('[AI Service] Refinement error:', err.message);
    throw err;
  }
}


/**
 * Applies deterministic mock mutations to simulate AI refinement
 * when running in development/fallback mode.
 *
 * @param {Object} currentItinerary - The current canonical itinerary
 * @param {string} userMessage - The user's request (used to pick mutation type)
 * @returns {Object} Modified itinerary
 */
function applyMockRefinement(currentItinerary, userMessage) {
  // Deep clone to avoid mutating the original
  const refined = JSON.parse(JSON.stringify(currentItinerary));
  const msg = userMessage.toLowerCase();

  if (msg.includes('less packed') || msg.includes('fewer') || msg.includes('remove')) {
    // Remove the last activity from the mentioned day (or day 2 as default)
    const dayMatch = msg.match(/day\s*(\d+)/);
    const targetDay = dayMatch ? parseInt(dayMatch[1]) : 2;
    const dayObj = refined.days.find(d => d.day === targetDay);
    if (dayObj && dayObj.activities.length > 1) {
      const removed = dayObj.activities.pop();
      console.log(`[Mock Refinement] Removed "${removed.title}" from Day ${targetDay}`);
    }
  } else if (msg.includes('food') || msg.includes('restaurant') || msg.includes('eat')) {
    // Add a food activity to day 1
    const dayObj = refined.days[0];
    if (dayObj) {
      dayObj.activities.push({
        id: `act-d${dayObj.day}-${dayObj.activities.length + 1}`,
        time: '12:30',
        title: `Local Street Food Discovery Tour`,
        category: 'food',
        location: `${refined.destination} Old Town Food Quarter`,
        durationMinutes: 90,
        estimatedCost: 25,
        description: `Added per your request — explore authentic local street food stalls and hidden gem eateries.`,
        travelFromPrevious: {
          distanceKm: 0.8,
          travelTimeMinutes: 10,
          transportMode: 'walk',
        },
        notes: 'Cash recommended for street vendors. Vegetarian options available.',
      });
      console.log(`[Mock Refinement] Added food activity to Day ${dayObj.day}`);
    }
  } else if (msg.includes('cheaper') || msg.includes('budget') || msg.includes('cost')) {
    // Reduce all costs by 30%
    refined.days.forEach(day => {
      day.activities.forEach(act => {
        act.estimatedCost = Math.round(act.estimatedCost * 0.7);
      });
    });
    console.log('[Mock Refinement] Reduced all activity costs by 30%');
  } else if (msg.includes('nature') || msg.includes('outdoor') || msg.includes('park')) {
    // Change a culture activity to nature
    for (const day of refined.days) {
      const cultureAct = day.activities.find(a => a.category === 'culture' || a.category === 'sightseeing');
      if (cultureAct) {
        cultureAct.category = 'nature';
        cultureAct.title = `Scenic Nature Walk & Garden Exploration`;
        cultureAct.location = `${refined.destination} Central Park & Botanical Gardens`;
        cultureAct.description = `Replaced per your request — peaceful nature walk through lush gardens and scenic trails.`;
        console.log(`[Mock Refinement] Swapped activity in Day ${day.day} to nature`);
        break;
      }
    }
  } else {
    // Default: adjust timing of first activity on day 1
    const dayObj = refined.days[0];
    if (dayObj && dayObj.activities.length > 0) {
      dayObj.activities[0].time = '10:00';
      dayObj.activities[0].notes = `(Modified per your request: "${userMessage}")`;
      console.log('[Mock Refinement] Applied default time adjustment to Day 1 Activity 1');
    }
  }

  // Recalculate total cost
  refined.totalEstimatedCost = refined.days.reduce(
    (sum, day) => sum + day.activities.reduce((dSum, act) => dSum + act.estimatedCost, 0),
    0
  );

  return refined;
}
