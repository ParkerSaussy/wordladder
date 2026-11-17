export default function Toolbar({ config, onHelp, onRestart, onGiveUp, onHint, disabled }) {
  return (
    <div className="toolbar">
      <button type="button" onClick={onHelp}>
        {config.helpButtonLabel}
      </button>
      <button type="button" onClick={onRestart}>
        {config.restartButtonLabel}
      </button>
      <button type="button" onClick={onGiveUp} disabled={disabled}>
        {config.giveUpButtonLabel}
      </button>
      <button type="button" onClick={onHint} disabled={disabled}>
        {config.hintButtonLabel}
      </button>
    </div>
  );
}
