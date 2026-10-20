// The tune schema: every section and field as plain data.
// Types, defaults and rules are all derived from this file, so a new field is added here only.

export const DRIVETRAINS = ['FR', 'FF', '4WD', 'MR', 'RR', 'Other'] as const

// Which unit family a number belongs to, so the unit converter (D8) can find it.
export type UnitFamily = 'power' | 'torque' | 'weight'

interface FieldBase {
  key: string
  label: string
  group?: string
}

export type FieldDef = FieldBase &
  (
    | { kind: 'toggle' }
    | { kind: 'enum'; options: readonly string[] }
    | { kind: 'int'; min?: number; max?: number; unit?: UnitFamily }
    | { kind: 'decimal'; decimals: number; min?: number; max?: number; unit?: UnitFamily }
    // Front share of the front/rear torque split, in whole percent. Rear is 100 minus this.
    | { kind: 'ratio'; min: number; max: number }
    // Ordered gears 1st..Nth plus a Final gear.
    | { kind: 'gears'; decimals: number; maxGears: number }
  )

export interface SectionDef {
  id: string
  title: string
  fields: readonly FieldDef[]
}

const TIRES = [
  'Comfort Hard',
  'Comfort Medium',
  'Comfort Soft',
  'Sports Hard',
  'Sports Medium',
  'Sports Soft',
  'Racing Hard',
  'Racing Medium',
  'Racing Soft',
  'Racing Intermediate',
  'Racing Heavy Wet',
  'Dirt',
  'Snow',
] as const

// Front and rear share the same seven suspension inputs, so one helper builds both.
const suspensionAxle = <P extends 'suspFront' | 'suspRear'>(p: P, group: string) =>
  [
    { key: `${p}BodyHeight`, label: 'Body Height Adjustment', kind: 'int', group },
    { key: `${p}AntiRollBar`, label: 'Anti-Roll Bar', kind: 'int', group },
    { key: `${p}DampingCompression`, label: 'Damping Ratio (Compression)', kind: 'int', group },
    { key: `${p}DampingExpansion`, label: 'Damping Ratio (Expansion)', kind: 'int', group },
    { key: `${p}NaturalFrequency`, label: 'Natural Frequency', kind: 'decimal', decimals: 2, group },
    { key: `${p}NegativeCamber`, label: 'Negative Camber Angle', kind: 'decimal', decimals: 1, group },
    { key: `${p}Toe`, label: 'Toe Angle', kind: 'decimal', decimals: 2, group },
  ] as const

// Front and rear differential share the same three inputs.
const diffAxle = <P extends 'diffFront' | 'diffRear'>(p: P, group: string) =>
  [
    { key: `${p}InitialTorque`, label: 'Initial Torque', kind: 'int', group },
    { key: `${p}AccelSensitivity`, label: 'Acceleration Sensitivity', kind: 'int', group },
    { key: `${p}BrakingSensitivity`, label: 'Braking Sensitivity', kind: 'int', group },
  ] as const

export const SECTIONS = [
  {
    id: 'general',
    title: 'General',
    fields: [
      { key: 'maxPower', label: 'Max Power', kind: 'int', min: 0, unit: 'power' },
      { key: 'maxTorque', label: 'Max Torque', kind: 'decimal', decimals: 1, min: 0, unit: 'torque' },
      { key: 'weight', label: 'Weight', kind: 'int', min: 0, unit: 'weight' },
    ],
  },
  {
    id: 'gtAuto',
    title: 'GT Auto',
    fields: [
      { key: 'bodyKit', label: 'Body Kit', kind: 'toggle' },
      { key: 'rimWidth', label: 'Rim Width', kind: 'enum', options: ['Standard', 'Wide'], group: 'Wheel' },
      { key: 'rimOffset', label: 'Offset', kind: 'enum', options: ['Standard', 'Wide'], group: 'Wheel' },
    ],
  },
  {
    id: 'tires',
    title: 'Tires',
    fields: [
      { key: 'tiresFront', label: 'Front', kind: 'enum', options: TIRES },
      { key: 'tiresRear', label: 'Rear', kind: 'enum', options: TIRES },
    ],
  },
  {
    id: 'suspension',
    title: 'Suspension',
    fields: [
      {
        key: 'suspension',
        label: 'Suspension',
        kind: 'enum',
        options: [
          'Normal',
          'Street',
          'Sports Suspension',
          'Height-Adjustable Sports',
          'Fully Customised Suspension',
        ],
      },
      ...suspensionAxle('suspFront', 'Front'),
      ...suspensionAxle('suspRear', 'Rear'),
    ],
  },
  {
    id: 'differential',
    title: 'Differential Gear',
    fields: [
      {
        key: 'differential',
        label: 'Differential',
        kind: 'enum',
        options: ['Normal', 'One-Way LSD', 'Two-Way LSD', 'Fully Customised'],
      },
      ...diffAxle('diffFront', 'Front'),
      ...diffAxle('diffRear', 'Rear'),
      {
        key: 'centerDifferential',
        label: 'Torque-Vectoring Center Differential',
        kind: 'enum',
        options: ['Normal', 'Torque-Vectoring Center Differential'],
      },
      { key: 'torqueSplitFront', label: 'Front/Rear Torque Distribution', kind: 'ratio', min: 5, max: 50 },
    ],
  },
  {
    id: 'aerodynamics',
    title: 'Aerodynamics',
    fields: [
      { key: 'aeroFront', label: 'Front', kind: 'int' },
      { key: 'aeroRear', label: 'Rear', kind: 'int' },
    ],
  },
  {
    id: 'ecu',
    title: 'ECU',
    fields: [
      { key: 'ecu', label: 'ECU', kind: 'enum', options: ['Normal', 'Sport Computer', 'Full Control Computer'] },
      { key: 'ecuOutput', label: 'Output Adjustment', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'performance',
    title: 'Performance Adjustment',
    fields: [
      { key: 'ballast', label: 'Ballast', kind: 'int', min: 0 },
      { key: 'ballastPosition', label: 'Ballast Positioning', kind: 'int', min: -50, max: 50 },
      { key: 'powerRestrictor', label: 'Power Restrictor', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'transmission',
    title: 'Transmission',
    fields: [
      {
        key: 'transmission',
        label: 'Transmission',
        kind: 'enum',
        options: [
          'Normal',
          'Close-Ratio: Low',
          'Close-Ratio: High',
          'Fully Customisable: Manual',
          'Fully Customisable: Racing',
        ],
      },
      { key: 'topSpeed', label: 'Top Speed', kind: 'int', min: 0 },
      { key: 'gearRatios', label: 'Gear Ratios', kind: 'gears', decimals: 3, maxGears: 8 },
    ],
  },
  {
    id: 'nitrous',
    title: 'Nitrous/Overtake',
    fields: [
      { key: 'nitrous', label: 'Nitrous/Overtake', kind: 'enum', options: ['None', 'Nitrous'] },
      { key: 'nitrousOutput', label: 'Output Adjustment', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'forcedInduction',
    title: 'Turbocharger/Supercharger',
    fields: [
      {
        key: 'turbocharger',
        label: 'Turbocharger',
        kind: 'enum',
        options: ['Normal', 'Low RPM', 'Medium RPM', 'High RPM'],
      },
      { key: 'antiLag', label: 'Anti-Lag', kind: 'enum', options: ['None', 'Anti-Lag System'] },
      { key: 'antiLagSystem', label: 'Anti-Lag System', kind: 'enum', options: ['Off', 'Weak', 'Strong'] },
      {
        key: 'intercooler',
        label: 'Intercooler',
        kind: 'enum',
        options: ['None', 'High-Capacity Intercooler', 'Racing Intercooler'],
      },
      {
        key: 'supercharger',
        label: 'Supercharger',
        kind: 'enum',
        options: ['Normal', 'Low-End Torque', 'High-End Torque'],
      },
    ],
  },
  {
    id: 'intakeExhaust',
    title: 'Intake & Exhaust',
    fields: [
      {
        key: 'airCleaner',
        label: 'Air Cleaner',
        kind: 'enum',
        options: ['Normal', 'Sports Air Filter', 'Racing Air Filter'],
      },
      {
        key: 'muffler',
        label: 'Muffler/Silencer',
        kind: 'enum',
        options: ['Normal', 'Sports', 'Semi-Racing', 'Racing'],
      },
      { key: 'exhaustManifold', label: 'Exhaust Manifold', kind: 'enum', options: ['Normal', 'Racing'] },
    ],
  },
  {
    id: 'brakes',
    title: 'Brakes',
    fields: [
      {
        key: 'brakes',
        label: 'Brakes',
        kind: 'enum',
        options: ['Normal', 'Racing (Slotted Discs)', 'Racing (Drilled Discs)', 'Carbon'],
      },
      { key: 'brakePads', label: 'Brake Pads', kind: 'enum', options: ['Normal', 'Racing'] },
      { key: 'handbrake', label: 'Handbrake', kind: 'enum', options: ['Normal', 'Hydraulic Handbrake'] },
      { key: 'handbrakeTorque', label: 'Handbrake Torque', kind: 'int', min: 0, max: 100 },
      { key: 'brakeBalance', label: 'Brake Balance', kind: 'enum', options: ['Normal', 'Brake Controller'] },
      { key: 'brakeFrontRearBalance', label: 'Front/Rear Balance', kind: 'int', min: -5, max: 5 },
    ],
  },
  {
    // 4WS System and Rear Steering Angle are research to-dos (T1, T2) and not modelled yet.
    id: 'steering',
    title: 'Steering',
    fields: [
      {
        key: 'steeringAngleKit',
        label: 'Steering Angle Kit',
        kind: 'enum',
        options: ['Normal', 'Steering Angle Adapter'],
      },
    ],
  },
  {
    id: 'drivetrain',
    title: 'Drivetrain',
    fields: [
      {
        key: 'clutchFlywheel',
        label: 'Clutch & Flywheel',
        kind: 'enum',
        options: ['Normal', 'Semi-Racing', 'Racing'],
      },
      {
        key: 'propellerShaft',
        label: 'Propeller Shaft',
        kind: 'enum',
        options: ['Normal', 'Carbon Propeller Shaft'],
      },
    ],
  },
  {
    id: 'engineTuning',
    title: 'Engine Tuning',
    fields: [
      { key: 'boreUp', label: 'Bore Up', kind: 'toggle' },
      { key: 'strokeUp', label: 'Stroke Up', kind: 'toggle' },
      { key: 'engineBalanceTuning', label: 'Engine Balance Tuning', kind: 'toggle' },
      { key: 'polishPorts', label: 'Polish Ports', kind: 'toggle' },
      { key: 'highLiftCamShaft', label: 'High Lift Cam Shaft', kind: 'toggle' },
      {
        key: 'titaniumRodsPistons',
        label: 'Titanium Connecting Rods & Pistons',
        kind: 'toggle',
      },
      { key: 'racingCrankShaft', label: 'Racing Crank Shaft', kind: 'toggle' },
      { key: 'highCompressionPistons', label: 'High Compression Pistons', kind: 'toggle' },
    ],
  },
  {
    id: 'bodywork',
    title: 'Bodywork',
    fields: [
      { key: 'weightReduction1', label: 'Weight Reduction: Stage 1', kind: 'toggle' },
      { key: 'weightReduction2', label: 'Weight Reduction: Stage 2', kind: 'toggle' },
      { key: 'weightReduction3', label: 'Weight Reduction: Stage 3', kind: 'toggle' },
      { key: 'weightReduction4', label: 'Weight Reduction: Stage 4', kind: 'toggle' },
      { key: 'weightReduction5', label: 'Weight Reduction: Stage 5', kind: 'toggle' },
      { key: 'bodyRigidity', label: 'Increase Body Rigidity', kind: 'toggle' },
    ],
  },
] as const satisfies readonly SectionDef[]

// All fields in display order, for code that loops over them.
export const FIELDS: readonly FieldDef[] = SECTIONS.flatMap((s) => [...s.fields] as FieldDef[])

export const FIELD_BY_KEY: Readonly<Record<string, FieldDef>> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f]),
)
