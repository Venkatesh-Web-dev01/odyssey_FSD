import React from 'react';
import './TravelConnector.css';

const TRANSPORT_LABELS = {
  walk: 'Walk',
  subway: 'Subway',
  train: 'Train',
  bus: 'Bus',
  taxi: 'Taxi',
  rideshare: 'Rideshare',
  bicycle: 'Bicycle',
  ferry: 'Ferry',
  flight: 'Flight',
  car: 'Drive',
  other: 'Transit',
};

function TravelConnector({ travel }) {
  if (!travel) return null;

  const mode = (travel.transportMode || 'walk').toLowerCase();
  const label = TRANSPORT_LABELS[mode] || mode.toUpperCase();
  const timeMinutes = Number(travel.travelTimeMinutes) || 0;
  const distance = Number(travel.distanceKm) || 0;

  if (mode === 'start' || (timeMinutes === 0 && distance === 0)) {
    return (
      <div className="travel-connector start-connector" aria-label="Start from accommodation">
        <span className="connector-indicator">↓</span>
        <span className="connector-text muted">Depart from accommodation</span>
      </div>
    );
  }

  // Format: "20 min · Subway (4.5 km)"
  let flowText = '';
  if (timeMinutes > 0) {
    flowText = `${timeMinutes} min · ${label}`;
  } else {
    flowText = label;
  }

  if (distance > 0) {
    flowText += ` (${distance} km)`;
  }

  return (
    <div className="travel-connector" aria-label={`Travel flow: ${flowText}`}>
      <span className="connector-indicator">↓</span>
      <span className="connector-text">{flowText}</span>
    </div>
  );
}

export default TravelConnector;
