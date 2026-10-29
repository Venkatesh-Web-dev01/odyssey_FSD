import puppeteer from 'puppeteer';
import fs from 'node:fs';

/**
 * Service to generate printable, high-quality PDFs of travel itineraries.
 * Uses Puppeteer to render a clean, high-contrast HTML template with
 * page-break controls to avoid awkward splits across pages.
 */

/**
 * Determines the best browser launch options, falling back to system
 * Google Chrome or Microsoft Edge if bundled browser is unavailable.
 */
function getBrowserLaunchOptions() {
  const options = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };

  // Check if default bundled puppeteer executable is available
  try {
    const bundledPath = puppeteer.executablePath();
    if (bundledPath && fs.existsSync(bundledPath)) {
      return options;
    }
  } catch {
    // Proceed to system fallbacks
  }

  const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const systemEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  if (fs.existsSync(systemChrome)) {
    options.executablePath = systemChrome;
  } else if (fs.existsSync(systemEdge)) {
    options.executablePath = systemEdge;
  }

  return options;
}

/**
 * Formats duration in minutes to human-readable string.
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} mins`;
}

/**
 * Escapes HTML characters to prevent XSS in generated PDF templates.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the complete print-optimized HTML markup for an itinerary.
 *
 * @param {Object} trip - Trip record with latest itinerary
 * @returns {string} HTML string
 */
export function buildItineraryHtml(trip) {
  const itinerary = trip.itinerary || {};
  const destination = trip.destination || itinerary.destination || 'Destination';
  const durationDays = trip.durationDays || (itinerary.days ? itinerary.days.length : 1);
  const budget = trip.budget || itinerary.budget || 'standard';
  const interests = Array.isArray(trip.interests) ? trip.interests : (itinerary.interests || []);
  const days = itinerary.days || [];
  const totalCost = itinerary.totalEstimatedCost != null ? itinerary.totalEstimatedCost : 0;
  const version = trip.itineraryVersion || 1;
  const isMock = Boolean(trip.isMock || itinerary.isMock);
  const exportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const daysHtml = days.map((dayData) => {
    const dayNum = dayData.day || dayData.dayNumber || 1;
    const activities = dayData.activities || [];

    const activitiesHtml = activities.map((act, actIdx) => {
      const travel = act.travelFromPrevious;
      let travelConnectorHtml = '';

      if (travel && (travel.travelTimeMinutes > 0 || travel.distanceKm > 0)) {
        const mode = travel.transportMode || 'transit';
        const time = travel.travelTimeMinutes ? `${travel.travelTimeMinutes} min` : '';
        const dist = travel.distanceKm ? ` (${travel.distanceKm} km)` : '';
        travelConnectorHtml = `
          <div class="travel-connector">
            <span class="connector-arrow">&darr;</span>
            <span class="connector-text">${escapeHtml(mode)}: ${time}${dist}</span>
          </div>
        `;
      }

      const durationStr = act.durationMinutes ? formatDuration(act.durationMinutes) : '';

      return `
        ${travelConnectorHtml}
        <div class="activity-card">
          <div class="activity-header">
            <div class="activity-time-title">
              <span class="activity-time">${escapeHtml(act.time || '')}</span>
              <span class="activity-title">${escapeHtml(act.title || act.name || 'Activity')}</span>
            </div>
            <div class="activity-badges">
              <span class="badge category-badge">${escapeHtml(act.category || 'general')}</span>
              <span class="badge cost-badge">$${act.estimatedCost != null ? act.estimatedCost : 0}</span>
            </div>
          </div>

          <div class="activity-meta">
            ${act.location ? `<span class="meta-item location-item">&#128205; ${escapeHtml(act.location)}</span>` : ''}
            ${durationStr ? `<span class="meta-item duration-item">&#9201; ${escapeHtml(durationStr)}</span>` : ''}
          </div>

          ${act.description ? `<p class="activity-description">${escapeHtml(act.description)}</p>` : ''}
          ${act.notes && act.notes !== act.description ? `
            <div class="activity-notes">
              <span class="notes-icon">&#128161;</span>
              <span class="notes-text"><strong>Tip:</strong> ${escapeHtml(act.notes)}</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="day-section">
        <div class="day-header">
          <h2 class="day-title">Day ${dayNum}${dayData.date ? ` &bull; ${escapeHtml(dayData.date)}` : ''}</h2>
          <span class="day-count">${activities.length} ${activities.length === 1 ? 'Activity' : 'Activities'}</span>
        </div>
        <div class="day-activities">
          ${activitiesHtml}
        </div>
      </section>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(destination)} Itinerary — ${durationDays} Days</title>
  <style>
    /* ─── Print Reset & Page Rules ────────────────────────────── */
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ─── Avoid content being cut across pages ───────────────── */
    .day-section {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 20px;
    }

    .activity-card {
      break-inside: avoid;
      page-break-inside: avoid;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }

    .travel-connector {
      break-inside: avoid;
      page-break-inside: avoid;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      color: #64748b;
      font-size: 8.5pt;
      font-weight: 500;
    }

    .connector-arrow {
      color: #0284c7;
      font-weight: bold;
    }

    /* ─── Header Section ──────────────────────────────────────── */
    .itinerary-header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .brand-title {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0284c7;
      margin-bottom: 4px;
    }

    .destination-heading {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.15;
    }

    .header-right {
      text-align: right;
    }

    .version-pill {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .export-date {
      font-size: 8pt;
      color: #64748b;
    }

    /* ─── Trip Parameters Summary Box ─────────────────────────── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-top: 10px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }

    .summary-val {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .interests-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 2px;
    }

    .interest-tag {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 3px;
    }

    /* ─── Day Header ──────────────────────────────────────────── */
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border-left: 4px solid #0284c7;
      padding: 6px 10px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 10px;
    }

    .day-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
    }

    .day-count {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
    }

    /* ─── Activity Card Elements ──────────────────────────────── */
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .activity-time-title {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .activity-time {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      font-size: 9.5pt;
      color: #0284c7;
      min-width: 48px;
    }

    .activity-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }

    .activity-badges {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .badge {
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: capitalize;
    }

    .category-badge {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .cost-badge {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .activity-meta {
      display: flex;
      gap: 12px;
      font-size: 8pt;
      color: #475569;
      margin-bottom: 4px;
    }

    .activity-description {
      font-size: 9pt;
      color: #334155;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .activity-notes {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 8pt;
      color: #92400e;
      margin-top: 4px;
    }

    .notes-icon {
      font-size: 8.5pt;
      line-height: 1;
    }

    /* ─── Footer Section ──────────────────────────────────────── */
    .itinerary-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="itinerary-header">
    <div class="header-top">
      <div>
        <div class="brand-title">Generative AI Travel Itinerary</div>
        <h1 class="destination-heading">${escapeHtml(destination)}</h1>
      </div>
      <div class="header-right">
        <span class="version-pill">Version ${version}${isMock ? ' (Dev Fallback)' : ''}</span>
        <div class="export-date">Exported on ${exportDate}</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">Duration</span>
        <span class="summary-val">${durationDays} Days</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Budget Tier</span>
        <span class="summary-val" style="text-transform: capitalize;">${escapeHtml(budget)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Estimated Cost</span>
        <span class="summary-val" style="color: #059669;">$${totalCost}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Interests</span>
        <div class="interests-list">
          ${interests.map((i) => `<span class="interest-tag">${escapeHtml(i)}</span>`).join('')}
        </div>
      </div>
    </div>
  </header>

  <!-- Day by Day Activities -->
  <main>
    ${daysHtml}
  </main>

  <!-- Footer -->
  <footer class="itinerary-footer">
    <span>Trip ID: ${escapeHtml(trip.id || 'N/A')} &bull; Generated by Generative AI Travel Planner</span>
    <span>Costs are approximate estimates &bull; Safe travels!</span>
  </footer>
</body>
</html>
  `.trim();
}

/**
 * Generates a PDF buffer from a trip object containing an itinerary.
 *
 * @param {Object} trip - Trip object with latest itinerary
 * @returns {Promise<Buffer>} Binary PDF buffer
 */
export async function generateItineraryPdf(trip) {
  if (!trip || !trip.itinerary) {
    throw new Error('Trip does not contain an itinerary to export.');
  }

  const html = buildItineraryHtml(trip);
  const launchOptions = getBrowserLaunchOptions();

  console.log(`[PDF Service] Launching Puppeteer for trip "${trip.destination}" (v${trip.itineraryVersion || 1})...`);
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF with A4 format and margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm',
      },
    });

    console.log(`[PDF Service] Successfully generated PDF (${pdfBuffer.length} bytes).`);
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
