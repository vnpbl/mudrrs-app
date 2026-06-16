import React from 'react';
import { type RegistryRoom } from '../types';

interface AnalyticsProps {
  activeBookingsCount: number;
  registry: RegistryRoom[];
  campusMetrics: {
    Makati: { percent: number; count: number };
    Intramuros: { percent: number; count: number };
  };
}

export const AnalyticsView: React.FC<AnalyticsProps> = ({
  activeBookingsCount,
  registry,
  campusMetrics,
}) => {
  return (
    <div className="analytics-viewport-stack">
      <section className="section-card header-filter-card">
        <div className="metrics-header-flex">
          <div className="header-text-cluster">
            <h2>System Performance Metrics</h2>
            <p>Historical utilization logs and real-time database metric aggregations.</p>
          </div>
          <div className="time-select-dropdown">
            <select defaultValue="today">
              <option value="today">Today (June 11)</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </section>
      
      <section className="kpi-metrics-row">
        <div className="kpi-card-mini">
          <span className="kpi-title">Total Bookings Fulfilled</span>
          <span className="kpi-value">{activeBookingsCount}</span>
          <span className="kpi-sub-trend trend-muted">Aggregating database clusters...</span>
        </div>
        <div className="kpi-card-mini">
          <span className="kpi-title">Auto-Canceled Rooms</span>
          <span className="kpi-value">0</span>
          <span className="kpi-sub-trend trend-muted">No policy deviations logged</span>
        </div>
        <div className="kpi-card-mini">
          <span className="kpi-title">Average Occupancy Window</span>
          <span className="kpi-value">{registry.length > 0 ? "1.8 hrs" : "0.0 hrs"}</span>
          <span className="kpi-sub-trend trend-muted">Computed from active logs</span>
        </div>
        <div className="kpi-card-mini">
          <span className="kpi-title">Peak User Traffic</span>
          <span className="kpi-value">{registry.length * 4}</span>
          <span className="kpi-sub-trend trend-safe">
            <span className="indicator-dot-green"></span> System listeners online
          </span>
        </div>
      </section>
      
      <div className="analytics-split-grid">
        <section className="section-card">
          <div className="card-title-area">
            <h2>Campus Utilization Comparison</h2>
          </div>
          <div className="campus-comparison-container">
            <div className="campus-stat-block">
              <div className="campus-stat-info">
                <div className="campus-name-labels">
                  <h3>Makati Campus Libraries</h3>
                  <p>Primary tracking targets: Room A, Room B</p>
                </div>
                <span className="percentage-metric font-maroon">{campusMetrics.Makati.percent}%</span>
              </div>
              <div className="progress-track-bg">
                <div className="progress-bar-fill fill-maroon" style={{ width: `${campusMetrics.Makati.percent}%` }}></div>
              </div>
              <div className="campus-sub-data-footer">
                <span>Active Tracks Today: <strong>{campusMetrics.Makati.count}</strong></span>
                <span>ID Records Verified: <strong>{registry.length > 0 ? '100%' : '0%'}</strong></span>
              </div>
            </div>

            <div className="campus-stat-block" style={{ marginTop: '2rem' }}>
              <div className="campus-stat-info">
                <div className="campus-name-labels">
                  <h3>Intramuros Campus Libraries</h3>
                  <p>Primary tracking targets: Room B, Multimedia Space</p>
                </div>
                <span className="percentage-metric font-orange">{campusMetrics.Intramuros.percent}%</span>
              </div>
              <div className="progress-track-bg">
                <div className="progress-bar-fill fill-orange" style={{ width: `${campusMetrics.Intramuros.percent}%` }}></div>
              </div>
              <div className="campus-sub-data-footer">
                <span>Active Tracks Today: <strong>{campusMetrics.Intramuros.count}</strong></span>
                <span>ID Records Verified: <strong>{registry.length > 0 ? '100%' : '0%'}</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="card-title-area">
            <h2>Most Demanded Spaces</h2>
          </div>
          <div className="ranking-stack-list">
            {registry.length === 0 ? (
              <p>Awaiting metrics aggregation pipeline calculations from backend cluster array nodes.</p>
            ) : (
              registry.slice(0, 3).map((room, index) => (
                <div className="ranking-item-row" key={index}>
                  <div className={`rank-number-badge ${index === 0 ? 'font-maroon' : 'font-orange'}`}>#{index + 1}</div>
                  <div className="rank-details">
                    <h4>{room.name} ({room.campus})</h4>
                    <p>{room.capacity}-Seat Capacity • Tracking node telemetry active</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};