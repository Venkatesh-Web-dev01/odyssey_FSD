import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHealth, createTrip } from '../services/api';
import TripForm from '../components/TripForm';

function HomePage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState({ status: 'loading', data: null, error: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const data = await fetchHealth();
        if (!cancelled) {
          setHealth({ status: 'ok', data, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setHealth({ status: 'error', data: null, error: err.message });
        }
      }
    }

    checkHealth();
    return () => { cancelled = true; };
  }, []);

  const handleTripSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const trip = await createTrip(formData);
      if (trip && trip.id) {
        navigate(`/trip/${trip.id}`);
      } else {
        throw new Error('No trip ID returned from server.');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to plan your journey. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="home__hero">
        <span className="home__brand-eyebrow">Editorial Itinerary Architect</span>
        <h1 className="home__title">Odyssey</h1>
        <p className="home__tagline">"Your journey, intelligently planned."</p>
        <p className="home__subtitle">
          Personalized, editable travel itineraries crafted with realistic travel pacing,
          chronological logistics, and conversational refinement.
        </p>
      </section>

      {/* ─── Error Notification ─────────────────────────────── */}
      {submitError && (
        <div className="submit-error-banner" role="alert">
          <span>{submitError}</span>
          <button type="button" className="close-alert-btn" onClick={() => setSubmitError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* ─── Primary Form: Trip Planning ─────────────────────── */}
      <TripForm onSubmit={handleTripSubmit} isLoading={isSubmitting} />

      {/* ─── Core Capabilities Overview ──────────────────────── */}
      <section className="features" aria-label="Odyssey Capabilities">
        <h2 className="features__title">The Odyssey Approach</h2>
        <div className="features__grid">
          <div className="feature-card">
            <span className="feature-card__num">01</span>
            <h3 className="feature-card__name">Intelligent Synthesis</h3>
            <p className="feature-card__desc">Strictly structured, validated day-by-day schedules tailored to your duration and budget.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card__num">02</span>
            <h3 className="feature-card__name">Travel Logistics</h3>
            <p className="feature-card__desc">Calculated transit modes, walking times, and distances between consecutive stops.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card__num">03</span>
            <h3 className="feature-card__name">Iterative Refinement</h3>
            <p className="feature-card__desc">Modify pacing or activities conversationally while preserving the rest of your trip.</p>
          </div>
          <div className="feature-card">
            <span className="feature-card__num">04</span>
            <h3 className="feature-card__name">Actionable Sync</h3>
            <p className="feature-card__desc">Export print-ready A4 PDFs or download standard .ics calendar files for mobile sync.</p>
          </div>
        </div>
      </section>

      {/* ─── Health Status Footnote ──────────────────────────── */}
      <footer className="health-card" id="health-status">
        <div className="health-card__header">
          <span className="health-card__title">System Status</span>
          <HealthBadge status={health.status} />
        </div>
        <div className="health-card__details">
          {health.status === 'ok' && health.data && (
            <>
              <span className="health-card__label">Service</span>
              <span className="health-card__value">Ready ({formatUptime(health.data.uptime)})</span>
            </>
          )}
          {health.status === 'error' && (
            <>
              <span className="health-card__label">Status</span>
              <span className="health-card__value">{health.error}</span>
            </>
          )}
          {health.status === 'loading' && (
            <>
              <span className="health-card__label">Status</span>
              <span className="health-card__value">Connecting...</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function HealthBadge({ status }) {
  const config = {
    ok:      { label: 'Online', modifier: 'ok' },
    error:   { label: 'Offline', modifier: 'error' },
    loading: { label: 'Connecting', modifier: 'loading' },
  };

  const { label, modifier } = config[status] || config.loading;

  return (
    <span className={`health-card__badge health-card__badge--${modifier}`}>
      <span className="health-card__dot" />
      {label}
    </span>
  );
}

function formatUptime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m uptime`;
  return `${m}m uptime`;
}

export default HomePage;
