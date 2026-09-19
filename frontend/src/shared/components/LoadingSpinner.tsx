import './LoadingSpinner.css';

export function LoadingSpinner() {
  return (
    <div className="spinner-overlay" role="status" aria-label="Laddar">
      <div className="spinner" />
    </div>
  );
}