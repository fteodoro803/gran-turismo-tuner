import type { Units } from '../tune/units'
import { UNIT_FAMILIES, UNIT_OPTIONS } from '../tune/units'
import type { UnitFamily } from '../tune/schema'

const LABELS: Record<UnitFamily, string> = { power: 'Power unit', torque: 'Torque unit', weight: 'Weight unit' }

interface Props {
  shown: Units
  onChange: (family: UnitFamily, unit: string) => void
}

// The three unit choices at the bottom of the General panel, as a row of buttons each (#14).
//
// They change the unit the numbers are shown in. The numbers themselves are converted for display
// only, so the shared link still carries each one as it was typed (D3).
export function UnitSelects({ shown, onChange }: Props) {
  return (
    <fieldset className="group unit-selects">
      <legend>Units</legend>
      <div className="fields">
        {UNIT_FAMILIES.map((family) => (
          <div key={family} className="field">
            <span id={`unit-${family}`}>{LABELS[family]}</span>
            <div className="unit-buttons" role="group" aria-labelledby={`unit-${family}`}>
              {UNIT_OPTIONS[family].map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={shown[family] === unit}
                  onClick={() => onChange(family, unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
