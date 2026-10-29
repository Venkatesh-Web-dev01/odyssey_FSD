import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip, generateItinerary, refineItinerary, exportTripPdf, exportTripCalendar } from '../services/api';
import BudgetSummary from '../components/BudgetSummary';
import TravelConnector from '../components/TravelConnector';
import ItinerarySkeleton from '../components/ItinerarySkeleton';
import ChatPanel from '../components/ChatPanel';
import './TripPage.css';

// Lazy-load the map to avoid blocking itinerary rendering
const MapView = lazy(() => import('../components/MapView'));

const CATEGORY_ICONS = {
  sightseeing: '🏛️',
  food: '🍜',
  adventure: '🧗',
  culture: '🎭',
  shopping: '🛍️',
  relaxation: '🧘',
  nightlife: '🍸',
  nature: '🌲',
  transit: '🚇',
  other: '📍',
};

function formatDuration(minutes) {
  if (!minutes) return '';
  if (typeof minutes === 'string') return minutes;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} mins`;
}

function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all' | 'map'
  const [chatOpen, setChatOpen] = useState(false);
  const [highlightedActivityId, setHighlightedActivityId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTrip(id);
        if (!cancelled) {
          setTrip(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load trip details');
          setLoading(false);
        }
      }
    }

    if (id) {
      loadTrip();
    }

    return () => { cancelled = true; };
  }, [id]);

  const isBusy = isRegenerating || isRefining || isExportingPdf || isExportingCalendar;

  // Auto-dismiss notification toasts
  useEffect(() => {
    if (!actionMessage) return;
    const timer = setTimeout(() => {
      setActionMessage(null);
    }, actionMessage.type === 'error' ? 7000 : 5000);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  const handleRegenerate = async () => {
    if (isBusy) return;
    setIsRegenerating(true);
    setActionMessage(null);
    try {
      const updatedTrip = await generateItinerary(id);
      setTrip(updatedTrip);
      setActionMessage({
        type: 'success',
        text: `Itinerary regenerated successfully (version ${updatedTrip.itineraryVersion})!`,
      });
      setActiveDay(1);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to regenerate itinerary. Please try again.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleChatRefine = async (message) => {
    if (isBusy) return;
    setIsRefining(true);
    setActionMessage(null);
    try {
      const updatedTrip = await refineItinerary(id, message);
      setTrip(updatedTrip);
      setActionMessage({
        type: 'success',
        text: `Itinerary refined (v${updatedTrip.itineraryVersion}). Changes applied!`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to refine itinerary. Please try again.',
      });
      // Add an error message to the local chat display
      setTrip((prev) => ({
        ...prev,
        chatHistory: [
          ...(prev?.chatHistory || []),
          { role: 'user', content: message, createdAt: new Date().toISOString() },
          { role: 'assistant', content: `⚠️ Refinement failed: ${err.message}`, createdAt: new Date().toISOString() },
        ],
      }));
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportPdf = async () => {
    if (isBusy) return;
    setIsExportingPdf(true);
    setActionMessage(null);
    try {
      const { blob, filename } = await exportTripPdf(id);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setActionMessage({
        type: 'success',
        text: `PDF exported successfully (${filename})!`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to export PDF. Please try again.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCalendar = async () => {
    if (isBusy) return;
    setIsExportingCalendar(true);
    setActionMessage(null);
    try {
      const { blob, filename } = await exportTripCalendar(id);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setActionMessage({
        type: 'success',
        text: `Calendar events exported successfully (${filename})!`,
      });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to export calendar events. Please try again.',
      });
    } finally {
      setIsExportingCalendar(false);
    }
  };

  // Loading State with Shimmer Skeleton
  if (loading) {
    return <ItinerarySkeleton />;
  }

  // Error State
  if (error || !trip) {
    return (
      <div className="trip-error-container">
        <div className="trip-error-card">
          <div className="trip-error-icon">⚠️</div>
          <h2 className="trip-error-title">Unable to Load Itinerary</h2>
          <p className="trip-error-text">
            {error || "We couldn't retrieve the itinerary for this trip ID."}
          </p>
          <Link to="/" className="trip-back-btn">
            ← Return to Trip Planner
          </Link>
        </div>
      </div>
    );
  }

  const days = trip.itinerary?.days || [];
  const currentDayData = days.find((d) => (d.day || d.dayNumber) === activeDay) || days[0];

  return (
    <div className="trip-page-layout">
      {/* ─── LEFT COLUMN: Itinerary ──────────────────────────── */}
      <div className="trip-page">
        {/* Navigation Breadcrumb */}
        <nav className="trip-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">
            <span className="breadcrumb-arrow">←</span>
            <span>Back to Planner</span>
          </Link>
          <div className="breadcrumb-right">
            <button
              type="button"
              className="export-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              title="Download print-ready PDF itinerary"
            >
              {isExportingPdf ? (
                <>
                  <span className="btn-spinner" />
                  <span>Exporting PDF...</span>
                </>
              ) : (
                <>
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="export-calendar-btn"
              onClick={handleExportCalendar}
              disabled={isExportingCalendar}
              title="Download RFC 5545 calendar (.ics) file"
            >
              {isExportingCalendar ? (
                <>
                  <span className="btn-spinner" />
                  <span>Exporting Calendar...</span>
                </>
              ) : (
                <>
                  <span>Export Calendar</span>
                </>
              )}
            </button>
            <span className="version-tag">v{trip.itineraryVersion || 1}</span>
          </div>
        </nav>

        {/* Action Notification Banner */}
        {actionMessage && (
          <div className={`action-banner ${actionMessage.type}`} role="status">
            <span>{actionMessage.type === 'success' ? '✅' : '⚠️'} {actionMessage.text}</span>
            <button
              type="button"
              className="close-banner-btn"
              onClick={() => setActionMessage(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* Generation Mode Banner */}
        <div className={`mode-banner ${trip.isMock ? 'mode-mock' : 'mode-ai'}`}>
          <div className="mode-banner__left">
            <span className="mode-badge">
              {trip.isMock ? 'DEV FALLBACK MODE' : '✨ GENAI GENERATED'}
            </span>
            <p className="mode-text">
              {trip.isMock
                ? 'Operating in development fallback mode (MOCK_AI_GENERATION or placeholder key). Set OPENAI_API_KEY in server/.env for live OpenAI generation.'
                : 'Synthesized via OpenAI API with structured JSON validation, geographic clustering, and cost estimation.'}
            </p>
          </div>
          <button
            type="button"
            className="regenerate-btn"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Request a fresh generation with updated pacing"
          >
            {isRegenerating ? (
              <>
                <span className="btn-spinner" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>⚡ Regenerate</span>
              </>
            )}
          </button>
        </div>

        {/* ─── 1. HEADER SECTION ─────────────────────────────────── */}
        <header className="trip-header-card">
          <div className="trip-header-top">
            <div className="trip-dest-wrapper">
              <span className="trip-dest-icon">📍</span>
              <div>
                <h1 className="trip-dest-title">{trip.destination}</h1>
                <p className="trip-meta-subtitle">
                  Created on {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="trip-meta-badges">
              <span className="meta-badge">
                <span className="meta-badge__icon">📅</span>
                <span>{trip.durationDays} Days</span>
              </span>
              <span className="meta-badge">
                <span className="meta-badge__icon">💰</span>
                <span className="capitalize">{trip.budget} Tier</span>
              </span>
              {trip.itinerary?.totalEstimatedCost > 0 && (
                <span className="meta-badge cost-badge">
                  <span className="meta-badge__icon">💵</span>
                  <span>~${trip.itinerary.totalEstimatedCost} Total Est.</span>
                </span>
              )}
            </div>
          </div>

          {/* Selected Interests Row */}
          <div className="trip-interests-row">
            <span className="interests-label">Selected Interests:</span>
            <div className="interests-tags">
              {trip.interests?.map((interest) => (
                <span key={interest} className="interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ─── 2. BUDGET SUMMARY SECTION ─────────────────────────── */}
        <BudgetSummary
          itinerary={trip.itinerary}
          durationDays={trip.durationDays}
          budgetTier={trip.budget}
        />

        {/* ─── 3. DAY SECTION WITH TRAVEL FLOW ───────────────────── */}
        {days.length > 0 ? (
          <div className="days-section">
            {/* Timeline Navigation & View Mode Controls */}
            <div className="days-nav-toolbar">
              <div className="toolbar-left">
                <h3 className="days-nav-title">Itinerary Schedule</h3>
                <span className="total-days-badge">{days.length} Days Planned</span>
              </div>

              <div className="view-mode-toggle" role="group" aria-label="Itinerary View Mode">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
                  onClick={() => setViewMode('single')}
                >
                  Day-by-Day
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => setViewMode('all')}
                >
                  All Days
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Map
                </button>
              </div>
            </div>

            {/* Single Day Tab Bar (only when in single day mode) */}
            {viewMode === 'single' && (
              <div className="days-tab-scroller">
                <div className="days-nav-tabs" role="tablist">
                  {days.map((d, index) => {
                    const dayNumber = d.day || d.dayNumber || (index + 1);
                    const isSelected = activeDay === dayNumber;
                    return (
                      <button
                        key={dayNumber}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={`day-tab ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveDay(dayNumber)}
                      >
                        <span className="day-tab__num">Day {dayNumber}</span>
                        {d.date && <span className="day-tab__date">{d.date.slice(5)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single Day View Mode */}
            {viewMode === 'single' && currentDayData && (
              <DayScheduleBlock
                dayData={currentDayData}
                destination={trip.destination}
                highlightedActivityId={highlightedActivityId}
                onActivityClick={(activityId) => {
                  setHighlightedActivityId(activityId);
                  setViewMode('map');
                }}
              />
            )}

            {/* All Days View Mode */}
            {viewMode === 'all' && (
              <div className="all-days-container">
                {days.map((dayData) => (
                  <DayScheduleBlock
                    key={dayData.day || dayData.dayNumber}
                    dayData={dayData}
                    destination={trip.destination}
                    highlightedActivityId={highlightedActivityId}
                    onActivityClick={(activityId) => {
                      setHighlightedActivityId(activityId);
                      setViewMode('map');
                    }}
                  />
                ))}
              </div>
            )}

            {/* Map View Mode */}
            {viewMode === 'map' && (
              <Suspense
                fallback={
                  <div className="map-loading-container">
                    <div className="map-loading-spinner" />
                    <p className="map-loading-text">Loading map...</p>
                  </div>
                }
              >
                <MapView
                  tripId={id}
                  highlightedActivityId={highlightedActivityId}
                  onMarkerClick={(activityId, day) => {
                    setHighlightedActivityId(activityId);
                    setActiveDay(day);
                  }}
                  itineraryVersion={trip.itineraryVersion}
                />
              </Suspense>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="trip-empty-state">
            <div className="empty-icon">🗺️</div>
            <h3 className="empty-title">No Activities Found</h3>
            <p className="empty-text">This trip currently has no scheduled activities.</p>
            <button type="button" className="trip-back-btn" onClick={handleRegenerate}>
              ⚡ Generate Itinerary
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <footer className="trip-footer-actions">
          <button
            type="button"
            className="footer-export-btn"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? (
              <>
                <span className="btn-spinner" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <span>Export PDF</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="footer-calendar-btn"
            onClick={handleExportCalendar}
            disabled={isExportingCalendar}
            title="Download standard .ics calendar file"
          >
            {isExportingCalendar ? (
              <>
                <span className="btn-spinner" />
                <span>Generating Calendar...</span>
              </>
            ) : (
              <>
                <span>Export Calendar</span>
              </>
            )}
          </button>
        </footer>
      </div>

      {/* ─── RIGHT COLUMN: Chat Panel ────────────────────────── */}
      <ChatPanel
        chatHistory={trip.chatHistory || []}
        onSendMessage={handleChatRefine}
        isRefining={isRefining}
        currentVersion={trip.itineraryVersion}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />

      {/* Mobile FAB for Chat */}
      <button
        type="button"
        className="chat-mobile-toggle-btn"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label="Toggle chat panel"
      >
        💬
        {(trip.chatHistory?.length || 0) > 0 && (
          <span className="chat-unread-dot" />
        )}
      </button>
    </div>
  );
}

/**
 * Renders a single day's schedule card with activities and travel connectors.
 */
function DayScheduleBlock({ dayData, destination, highlightedActivityId, onActivityClick }) {
  const dayNumber = dayData.day || dayData.dayNumber;
  const activities = dayData.activities || [];

  return (
    <section className="day-schedule-card" aria-label={`Day ${dayNumber} Schedule`}>
      <div className="day-schedule-header">
        <div className="day-header-left">
          <span className="day-pill-badge">DAY {dayNumber}</span>
          <h3 className="day-title">
            {dayData.date ? `Day ${dayNumber} • ${dayData.date}` : `Day ${dayNumber} in ${destination}`}
          </h3>
        </div>
        <div className="day-header-right">
          <span className="day-activities-count">
            {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
          </span>
        </div>
      </div>

      <div className="activities-timeline">
        {activities.map((activity, idx) => {
          const cat = (activity.category || 'other').toLowerCase();
          const catIcon = CATEGORY_ICONS[cat] || '📍';
          const durationStr = formatDuration(activity.durationMinutes || activity.duration);

          return (
            <div key={activity.id || idx} className="timeline-step">
              {/* Travel Flow Connector from Previous Activity */}

              {idx > 0 && activity.travelFromPrevious && (
                <TravelConnector travel={activity.travelFromPrevious} />
              )}

              {/* Activity Card */}
              <div
                className={`activity-item ${highlightedActivityId === (activity.id || `day${dayNumber}-${idx}`) ? 'activity-highlighted' : ''}`}
                onClick={() => onActivityClick?.(activity.id || `day${dayNumber}-${idx}`)}
                style={{ cursor: onActivityClick ? 'pointer' : 'default' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onActivityClick?.(activity.id || `day${dayNumber}-${idx}`);
                  }
                }}
              >
                {/* Timeline Marker */}
                <div className="activity-timeline-marker">
                  <div className="marker-dot" title={activity.category}>
                    {catIcon}
                  </div>
                  {idx < activities.length - 1 && <div className="marker-line" />}
                </div>

                {/* Activity Details Card */}
                <article className="activity-card">
                  <div className="activity-card__top">
                    <div className="activity-time-badge">
                      <span className="time-icon">⏰</span>
                      <time className="time-val">{activity.time}</time>
                      {durationStr && <span className="duration-tag">({durationStr})</span>}
                    </div>
                    <span className={`category-badge cat-${cat}`}>
                      {activity.category}
                    </span>
                  </div>

                  <h4 className="activity-title">{activity.title || activity.name}</h4>

                  <div className="activity-meta">
                    <span className="meta-loc">📍 {activity.location}</span>
                    <span className="meta-cost">
                      💵 Est. Cost: <strong>${activity.estimatedCost}</strong>
                    </span>
                  </div>

                  {/* Description */}
                  {(activity.description || activity.notes) && (
                    <p className="activity-description">
                      {activity.description || activity.notes}
                    </p>
                  )}

                  {/* Notes / Tips (if distinct from description) */}
                  {activity.notes && activity.description && activity.notes !== activity.description && (
                    <div className="activity-notes">
                      <span className="notes-icon">💡</span>
                      <span className="notes-text">{activity.notes}</span>
                    </div>
                  )}
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TripPage;
