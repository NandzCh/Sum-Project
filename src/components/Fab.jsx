// Floating action button — bottom-left shortcut to toggle cashflow view.

export function Fab({ cashflowView, onToggle }) {
  const label = cashflowView ? 'habits' : 'cashflow';
  const title = cashflowView ? 'back to habits (m)' : 'open cashflow (m)';
  const ariaLabel = cashflowView ? 'back to habits' : 'open cashflow';

  return (
    <button
      className={'fab-cashflow' + (cashflowView ? ' active' : '')}
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onToggle}
    >
      <span className="fab-icon" aria-hidden="true">$</span>
      <span className="fab-label">{label}</span>
    </button>
  );
}
