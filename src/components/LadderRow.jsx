import { useRef } from 'react';
import { CELL_STATUS, ROW_STATUS } from '../game/ladder';

function tileClass(cellStatus, isInteractive) {
  if (cellStatus === CELL_STATUS.LOCKED) return 'tile tile--locked';
  if (cellStatus === CELL_STATUS.PRESENT) return 'tile tile--present';
  return isInteractive ? 'tile tile--empty' : 'tile tile--hidden';
}

function rowVariantClass(row, config) {
  if (row.prefix === config.correctPrefix) return 'row--correct';
  if (row.prefix === config.tryAgainPrefix) return 'row--retry';
  if (row.prefix === config.gaveUpPrefix) return 'row--gaveup';
  if (row.status === ROW_STATUS.KNOWN) return 'row--known';
  if (row.status === ROW_STATUS.ACTIVE) return 'row--active';
  return 'row--unknown';
}

export default function LadderRow({ row, rowIndex, config, onLetterChange, onSubmit }) {
  const inputRefs = useRef([]);
  const isActive = row.status === ROW_STATUS.ACTIVE;
  const isComplete = isActive && row.letters.every((letter) => letter !== '');

  const focusInput = (position) => {
    const el = inputRefs.current[position];
    if (el) el.focus();
  };

  const handleChange = (position, rawValue) => {
    const value = rawValue.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();
    onLetterChange(rowIndex, position, value);
    if (value) focusInput(position + 1);
  };

  const handleKeyDown = (position, event) => {
    if (event.key === 'Backspace' && row.letters[position] === '') {
      focusInput(position - 1);
    } else if (event.key === 'ArrowLeft') {
      focusInput(position - 1);
    } else if (event.key === 'ArrowRight') {
      focusInput(position + 1);
    } else if (event.key === 'Enter') {
      onSubmit(rowIndex);
    }
  };

  return (
    <div className={`ladder-row ${rowVariantClass(row, config)}`} data-row-index={rowIndex}>
      <div className="ladder-row__prefix">{row.prefix}</div>
      <div className="ladder-row__tiles">
        {row.word.split('').map((_, position) => {
          const cellStatus = row.cellStatus[position];
          const letter = row.letters[position];
          const locked = cellStatus === CELL_STATUS.LOCKED;

          if (!isActive) {
            return (
              <div
                key={position}
                className={tileClass(cellStatus, false)}
                aria-hidden={row.status === ROW_STATUS.UNKNOWN}
              >
                {row.status === ROW_STATUS.UNKNOWN ? '' : letter}
              </div>
            );
          }

          if (locked) {
            return (
              <div key={position} className={tileClass(cellStatus, true)}>
                {letter}
              </div>
            );
          }

          return (
            <input
              key={position}
              ref={(el) => {
                inputRefs.current[position] = el;
              }}
              className={tileClass(cellStatus, true)}
              value={letter}
              maxLength={1}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              aria-label={`Row ${rowIndex + 1}, letter ${position + 1}`}
              onChange={(event) => handleChange(position, event.target.value)}
              onKeyDown={(event) => handleKeyDown(position, event)}
            />
          );
        })}
        {isActive && (
          <button
            type="button"
            className="ladder-row__submit"
            onClick={() => onSubmit(rowIndex)}
            disabled={!isComplete}
          >
            {config.submitButtonLabel}
          </button>
        )}
      </div>
      {row.notIn.length > 0 && (
        <div className="ladder-row__not-in">
          {config.notInWordLabel}
          {row.notIn.join(', ')}
        </div>
      )}
    </div>
  );
}
