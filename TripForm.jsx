import { useState } from 'react';
import { AVAILABLE_INTERESTS, BUDGET_TIERS, validateTrip } from '@travel-planner/shared';
import './TripForm.css';

const BUDGET_OPTIONS = [
  {
    tier: BUDGET_TIERS.BUDGET,
    label: 'Budget',
    symbol: '$',
    description: 'Hostels, public transit & authentic street food',
    estDaily: '~$50–$100 / day',
  },
  {
    tier: BUDGET_TIERS.MID_RANGE,
    label: 'Mid-range',
    symbol: '$$',
    description: 'Boutique hotels, casual dining & guided tours',
    estDaily: '~$150–$300 / day',
  },
  {
    tier: BUDGET_TIERS.LUXURY,
    label: 'Luxury',
    symbol: '$$$',
    description: '5-star accommodations, fine dining & private transfers',
    estDaily: '$500+ / day',
  },
];

const POPULAR_DESTINATIONS = ['Tokyo, Japan', 'Paris, France', 'Rome, Italy', 'Kyoto, Japan', 'Bali, Indonesia', 'New York, USA'];

function TripForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    destination: '',
    durationDays: 5,
    budget: BUDGET_TIERS.MID_RANGE,
    interests: ['Food', 'History'],
  });

  const [errors, setErrors] = useState({});
  const [, setTouched] = useState({});

  const handleDestinationChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, destination: val }));
    if (errors.destination) {
      setErrors((prev) => ({ ...prev, destination: null }));
    }
  };

  const handleDestinationSelect = (dest) => {
    setFormData((prev) => ({ ...prev, destination: dest }));
    if (errors.destination) {
      setErrors((prev) => ({ ...prev, destination: null }));
    }
  };

  const handleDurationChange = (delta) => {
    setFormData((prev) => {
      const nextVal = Math.max(1, Math.min(30, (Number(prev.durationDays) || 1) + delta));
      return { ...prev, durationDays: nextVal };
    });
    if (errors.durationDays) {
      setErrors((prev) => ({ ...prev, durationDays: null }));
    }
  };

  const handleDurationDirectInput = (e) => {
    const val = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, durationDays: isNaN(val) ? '' : val }));
    if (errors.durationDays) {
      setErrors((prev) => ({ ...prev, durationDays: null }));
    }
  };

  const handleBudgetSelect = (tier) => {
    setFormData((prev) => ({ ...prev, budget: tier }));
    if (errors.budget) {
      setErrors((prev) => ({ ...prev, budget: null }));
    }
  };

  const toggleInterest = (interestLabel) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interestLabel);
      const updated = exists
        ? prev.interests.filter((i) => i !== interestLabel)
        : [...prev.interests, interestLabel];
      return { ...prev, interests: updated };
    });
    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    setTouched({
      destination: true,
      durationDays: true,
      budget: true,
      interests: true,
    });

    const validation = validateTrip(formData);
    if (!validation.valid) {
      const errMap = {};
      validation.errors.forEach((msg) => {
        if (msg.includes('Destination')) errMap.destination = msg;
        else if (msg.includes('duration') || msg.includes('Duration')) errMap.durationDays = msg;
        else if (msg.includes('Budget') || msg.includes('budget')) errMap.budget = msg;
        else if (msg.includes('interest') || msg.includes('Interest')) errMap.interests = msg;
      });
      setErrors(errMap);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <form className="trip-form" onSubmit={handleSubmit} noValidate>
      <div className="trip-form__header">
        <h2 className="trip-form__title">Plan Your Journey</h2>
        <p className="trip-form__subtitle">
          Configure your destination, duration, budget, and travel interests.
        </p>
      </div>

      {/* 1. Destination Input */}
      <div className={`form-group ${errors.destination ? 'has-error' : ''}`}>
        <label htmlFor="destination-input" className="form-label">
          <span>Destination</span>
          <span className="form-label__required">*</span>
        </label>
        <div className="input-with-icon">
          <input
            id="destination-input"
            type="text"
            className="form-input destination-hero-input"
            placeholder="e.g. Tokyo, Japan or Paris, France"
            value={formData.destination}
            onChange={handleDestinationChange}
            onBlur={() => setTouched((prev) => ({ ...prev, destination: true }))}
            disabled={isLoading}
            autoComplete="off"
          />
          {formData.destination && !isLoading && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setFormData((prev) => ({ ...prev, destination: '' }))}
              aria-label="Clear destination"
            >
              ×
            </button>
          )}
        </div>
        {errors.destination && <p className="error-message">{errors.destination}</p>}

        {/* Quick Suggestions */}
        <div className="quick-suggestions">
          <span className="quick-suggestions__label">Popular:</span>
          {POPULAR_DESTINATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`suggestion-chip ${formData.destination === d ? 'active' : ''}`}
              onClick={() => handleDestinationSelect(d)}
              disabled={isLoading}
            >
              {d.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Duration Stepper */}
      <div className={`form-group ${errors.durationDays ? 'has-error' : ''}`}>
        <label htmlFor="duration-input" className="form-label">
          <span>Trip Duration</span>
          <span className="form-label__badge">{formData.durationDays || 0} {Number(formData.durationDays) === 1 ? 'Day' : 'Days'}</span>
        </label>
        <div className="stepper-wrapper">
          <div className="duration-stepper">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => handleDurationChange(-1)}
              disabled={isLoading || Number(formData.durationDays) <= 1}
              aria-label="Decrease days"
            >
              −
            </button>
            <input
              id="duration-input"
              type="number"
              min="1"
              max="30"
              className="stepper-input"
              value={formData.durationDays}
              onChange={handleDurationDirectInput}
              disabled={isLoading}
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => handleDurationChange(1)}
              disabled={isLoading || Number(formData.durationDays) >= 30}
              aria-label="Increase days"
            >
              +
            </button>
          </div>
          <span className="stepper-hint">Between 1 and 30 days</span>
        </div>
        {errors.durationDays && <p className="error-message">{errors.durationDays}</p>}
      </div>

      {/* 3. Budget Tier Selector */}
      <div className={`form-group ${errors.budget ? 'has-error' : ''}`}>
        <label className="form-label">
          <span>Budget Preference</span>
          <span className="form-label__required">*</span>
        </label>
        <div className="budget-grid">
          {BUDGET_OPTIONS.map((opt) => {
            const isSelected = formData.budget === opt.tier;
            return (
              <button
                key={opt.tier}
                type="button"
                className={`budget-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleBudgetSelect(opt.tier)}
                disabled={isLoading}
                aria-pressed={isSelected}
              >
                <div className="budget-card__header">
                  <span className="budget-card__symbol">{opt.symbol}</span>
                  <span className="budget-card__label">{opt.label}</span>
                </div>
                <p className="budget-card__desc">{opt.description}</p>
                <span className="budget-card__est">{opt.estDaily}</span>
              </button>
            );
          })}
        </div>
        {errors.budget && <p className="error-message">{errors.budget}</p>}
      </div>

      {/* 4. Interests Selector */}
      <div className={`form-group ${errors.interests ? 'has-error' : ''}`}>
        <div className="form-label-row">
          <label className="form-label">
            <span>Interests & Style</span>
            <span className="form-label__required">*</span>
          </label>
          <span className="interests-counter">
            {formData.interests.length} selected
          </span>
        </div>
        <div className="interests-grid">
          {AVAILABLE_INTERESTS.map((item) => {
            const isSelected = formData.interests.includes(item.label);
            return (
              <button
                key={item.id}
                type="button"
                className={`interest-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleInterest(item.label)}
                disabled={isLoading}
                aria-pressed={isSelected}
              >
                <span className="interest-pill__label">{item.label}</span>
                {isSelected && <span className="interest-pill__check">✓</span>}
              </button>
            );
          })}
        </div>
        {errors.interests && <p className="error-message">{errors.interests}</p>}
      </div>

      {/* Submit Action: Primary CTA "Plan My Journey" */}
      <div className="form-actions">
        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              <span>Odyssey is planning your journey...</span>
            </>
          ) : (
            <>
              <span>Plan My Journey</span>
              <span className="submit-btn__arrow">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default TripForm;
