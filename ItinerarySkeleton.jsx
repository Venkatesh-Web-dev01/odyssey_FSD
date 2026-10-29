import React from 'react';
import './ItinerarySkeleton.css';

function ItinerarySkeleton() {
  return (
    <div className="itinerary-skeleton" aria-busy="true" aria-label="Loading itinerary details">
      {/* Header Skeleton */}
      <div className="skeleton-card skeleton-header">
        <div className="skeleton-row">
          <div className="skeleton-box skeleton-circle-lg" />
          <div className="skeleton-col">
            <div className="skeleton-box skeleton-title" />
            <div className="skeleton-box skeleton-subtitle" />
          </div>
        </div>
        <div className="skeleton-row badges-row">
          <div className="skeleton-box skeleton-pill" />
          <div className="skeleton-box skeleton-pill" />
          <div className="skeleton-box skeleton-pill" />
        </div>
      </div>

      {/* Budget Summary Skeleton */}
      <div className="skeleton-card skeleton-budget">
        <div className="skeleton-box skeleton-heading" />
        <div className="skeleton-metric-grid">
          <div className="skeleton-box skeleton-metric-tile" />
          <div className="skeleton-box skeleton-metric-tile" />
          <div className="skeleton-box skeleton-metric-tile" />
        </div>
        <div className="skeleton-box skeleton-bar" />
      </div>

      {/* Tabs Skeleton */}
      <div className="skeleton-tabs-row">
        <div className="skeleton-box skeleton-tab" />
        <div className="skeleton-box skeleton-tab" />
        <div className="skeleton-box skeleton-tab" />
        <div className="skeleton-box skeleton-tab" />
        <div className="skeleton-box skeleton-tab" />
      </div>

      {/* Activities Timeline Skeleton */}
      <div className="skeleton-card skeleton-day-card">
        <div className="skeleton-row between">
          <div className="skeleton-box skeleton-title-sm" />
          <div className="skeleton-box skeleton-pill-sm" />
        </div>

        <div className="skeleton-timeline">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-activity-item">
              <div className="skeleton-box skeleton-marker" />
              <div className="skeleton-col fill">
                <div className="skeleton-row between">
                  <div className="skeleton-box skeleton-time" />
                  <div className="skeleton-box skeleton-badge-sm" />
                </div>
                <div className="skeleton-box skeleton-act-title" />
                <div className="skeleton-box skeleton-act-loc" />
                <div className="skeleton-box skeleton-desc" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ItinerarySkeleton;
