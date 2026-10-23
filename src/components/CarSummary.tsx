import { CarImage } from './CarImage'
import type { CarChoice } from './CarPicker'

interface Props {
  choice: CarChoice
  onChangeCar: () => void
}

// The manufacturer, car and drivetrain at the top of the General panel, with the way back to the first page (#12).
export function CarSummary({ choice, onChangeCar }: Props) {
  return (
    <div className="car-summary">
      <CarImage key={choice.car.id} image={choice.car.image} className="car-image-small" />
      <div className="readout-row">
        <span>Manufacturer</span>
        <strong>{choice.car.manufacturer}</strong>
      </div>
      <div className="readout-row">
        <span>Car</span>
        <strong>{choice.car.name}</strong>
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
