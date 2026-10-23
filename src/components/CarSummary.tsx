import { CarImage } from './CarImage'
import type { CarChoice } from './CarPicker'

interface Props {
  choice: CarChoice
  onChangeCar: () => void
}

// A car's name with its manufacturer in front, unless the name already starts with it.
const carLabel = ({ manufacturer, name }: CarChoice['car']) =>
  name.startsWith(manufacturer) ? name : `${manufacturer} ${name}`

// The car and drivetrain at the top of the General panel, with the way back to the first page (#12).
export function CarSummary({ choice, onChangeCar }: Props) {
  return (
    <div className="car-summary">
      <CarImage key={choice.car.id} image={choice.car.image} className="car-image-small" />
      <div className="readout-row">
        <span>Car</span>
        <strong>{carLabel(choice.car)}</strong>
      </div>
      <div className="readout-row">
        <span>Drivetrain</span>
        <strong>{choice.car.drivetrain}</strong>
      </div>
      <button type="button" className="button button-quiet" onClick={onChangeCar}>
        Change car
      </button>
    </div>
  )
}
