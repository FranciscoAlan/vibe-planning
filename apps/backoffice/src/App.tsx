import { ArrowUpRight, CalendarDays, Check, Clock3, Plus, Users } from 'lucide-react';

const events = [
  { name: 'Mara & Luis', type: 'Wedding', date: 'Oct 18, 2026', status: 'On track' },
  { name: 'Casa Nopal launch', type: 'Brand event', date: 'Oct 24, 2026', status: 'Needs review' },
  { name: 'Elena turns thirty', type: 'Private dinner', date: 'Nov 02, 2026', status: 'On track' },
];

export function BackofficeApp() {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Vibe Planners overview">
          <span className="brand-mark">
            <CalendarDays size={19} aria-hidden="true" />
          </span>
          <span>Vibe Planners</span>
        </a>
        <p className="sidebar-label">Administration</p>
        <nav aria-label="Administration">
          <a className="nav-link nav-link-active" href="#overview">
            <ArrowUpRight size={17} aria-hidden="true" /> Overview
          </a>
          <a className="nav-link" href="#events">
            <CalendarDays size={17} aria-hidden="true" /> Events
          </a>
          <a className="nav-link" href="#users">
            <Users size={17} aria-hidden="true" /> Users
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">MC</div>
          <div>
            <strong>Mariana Cruz</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="page-header">
          <div>
            <p className="eyebrow">Wednesday, October 1, 2026</p>
            <h1>Operations overview</h1>
          </div>
          <button className="button-primary" type="button">
            <Plus size={17} aria-hidden="true" /> Add event
          </button>
        </header>

        <section className="metric-grid" aria-label="Platform summary">
          <article className="metric">
            <span className="metric-label">Active events</span>
            <strong>128</strong>
            <span className="metric-note positive">
              <ArrowUpRight size={14} aria-hidden="true" /> 12% this month
            </span>
          </article>
          <article className="metric">
            <span className="metric-label">Registered users</span>
            <strong>2,406</strong>
            <span className="metric-note positive">
              <ArrowUpRight size={14} aria-hidden="true" /> 8% this month
            </span>
          </article>
          <article className="metric">
            <span className="metric-label">Needs attention</span>
            <strong>7</strong>
            <span className="metric-note">
              <Clock3 size={14} aria-hidden="true" /> Review pending items
            </span>
          </article>
        </section>

        <section className="events-section" id="events" aria-labelledby="events-heading">
          <div className="section-heading">
            <div>
              <h2 id="events-heading">Recent events</h2>
              <p>Latest activity across the platform</p>
            </div>
            <a href="#all-events">
              View all events <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.name}>
                    <td>
                      <strong>{event.name}</strong>
                    </td>
                    <td>{event.type}</td>
                    <td>{event.date}</td>
                    <td>
                      <span
                        className={`status ${event.status === 'On track' ? 'status-good' : 'status-review'}`}
                      >
                        {event.status === 'On track' && <Check size={13} aria-hidden="true" />}
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
