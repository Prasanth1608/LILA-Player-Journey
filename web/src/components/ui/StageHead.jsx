// Title + one status line above the map, shared by both modes.
export function StageHead({ title, status }) {
  return (
    <div className="stage-head">
      <h2>{title}</h2>
      <span className="stage-meta" role="status">{status}</span>
    </div>
  );
}
