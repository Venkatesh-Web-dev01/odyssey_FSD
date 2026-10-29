import React, { useMemo } from 'react';
import './BudgetSummary.css';

function BudgetSummary({ itinerary, durationDays, budgetTier }) {
  const stats = useMemo(() => {
    if (!itinerary || !Array.isArray(itinerary.days)) {
      return { total: 0, dailyAvg: 0, totalActivities: 0, categories: [] };
    }

    const daysCount = Math.max(durationDays || itinerary.days.length || 1, 1);
    let total = 0;
    let totalActivities = 0;
    const catMap = {};

    itinerary.days.forEach((day) => {
      if (Array.isArray(day.activities)) {
        day.activities.forEach((act) => {
          totalActivities += 1;
          const cost = Number(act.estimatedCost) || 0;
          total += cost;
          const cat = (act.category || 'other').toLowerCase();
          catMap[cat] = (catMap[cat] || 0) + cost;
        });
      }
    });

    const finalTotal = itinerary.totalEstimatedCost && itinerary.totalEstimatedCost > 0
      ? itinerary.totalEstimatedCost
      : total;

    const dailyAvg = Math.round(finalTotal / daysCount);

    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({
        name: name.toUpperCase(),
        amount,
        percentage: finalTotal > 0 ? Math.round((amount / finalTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      total: finalTotal,
      dailyAvg,
      totalActivities,
      categories,
    };
  }, [itinerary, durationDays]);

  if (stats.total === 0 && stats.categories.length === 0) {
    return null;
  }

  return (
    <section className="budget-summary-card" aria-label="Trip Budget Summary">
      <div className="budget-summary-header">
        <h3 className="budget-title">Budget Architecture</h3>
        <span className="budget-disclaimer">
          *Estimates only — actual prices vary by season & bookings
        </span>
      </div>

      {/* Top Metric Tiles (Monochrome) */}
      <div className="budget-metric-grid">
        <div className="metric-tile primary">
          <span className="metric-label">Total Estimated Cost</span>
          <span className="metric-value">~${stats.total}</span>
          <span className="metric-sub">{budgetTier ? `${budgetTier.toUpperCase()} TIER` : 'ESTIMATED TOTAL'}</span>
        </div>

        <div className="metric-tile">
          <span className="metric-label">Daily Average</span>
          <span className="metric-value">~${stats.dailyAvg}</span>
          <span className="metric-sub">Across {durationDays || 1} Days</span>
        </div>

        <div className="metric-tile">
          <span className="metric-label">Activities Included</span>
          <span className="metric-value">{stats.totalActivities}</span>
          <span className="metric-sub">Over {itinerary.days?.length || 1} Days</span>
        </div>
      </div>

      {/* Category Breakdown Progress and List (Minimal Monochrome) */}
      {stats.categories.length > 0 && (
        <div className="category-breakdown-section">
          <h4 className="breakdown-title">Estimated Spend by Category</h4>

          {/* Simple Minimal Progress Bar */}
          <div className="stacked-spend-bar" role="progressbar" aria-label="Category cost distribution">
            {stats.categories.map((cat, idx) => (
              <div
                key={cat.name}
                className="spend-bar-segment"
                style={{
                  width: `${Math.max(cat.percentage, 4)}%`,
                  opacity: Math.max(0.2, 1 - idx * 0.15),
                }}
                title={`${cat.name}: $${cat.amount} (${cat.percentage}%)`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="category-items-grid">
            {stats.categories.map((cat) => (
              <div key={cat.name} className="cat-item">
                <div className="cat-item-left">
                  <span className="cat-bullet">▪</span>
                  <span className="cat-name">{cat.name}</span>
                </div>
                <div className="cat-item-right">
                  <span className="cat-amount">~${cat.amount}</span>
                  <span className="cat-percent">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default BudgetSummary;
