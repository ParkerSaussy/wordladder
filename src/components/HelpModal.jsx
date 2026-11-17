export default function HelpModal({ config, onClose }) {
  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-label={config.helpButtonLabel}>
      <div className="help-modal">
        <h2>{config.title}</h2>
        <p>{config.helpText}</p>
        <button type="button" onClick={onClose}>
          {config.closeHelpLabel}
        </button>
      </div>
    </div>
  );
}
