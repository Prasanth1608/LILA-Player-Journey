// Shown instead of an empty area, so it's clear nothing is broken.
export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
    </div>
  );
}
