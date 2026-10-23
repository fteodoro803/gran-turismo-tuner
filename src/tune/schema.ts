// The tune schema: every section and field as plain data.
// Types, defaults and rules are all derived from this file, so a new field is added here only.

export const DRIVETRAINS = ['FR', 'FF', '4WD', 'MR', 'RR', 'Other'] as const

// Which unit family a number belongs to, so the unit converter (D8) can find it.
export type UnitFamily = 'power' | 'torque' | 'weight'

interface FieldBase {
  key: string
  // This field's permanent number in a share link (#5). Never changed, reused or renumbered, so
  // old links keep their meaning. A new field takes the next free number.
  n: number
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
const suspensionAxle = <P extends 'suspFront' | 'suspRear'>(p: P, group: string, first: number) =>
  [
    { key: `${p}BodyHeight`, n: first + 0, label: 'Body Height Adjustment', kind: 'int', group },
    { key: `${p}AntiRollBar`, n: first + 1, label: 'Anti-Roll Bar', kind: 'int', group },
    { key: `${p}DampingCompression`, n: first + 2, label: 'Damping Ratio (Compression)', kind: 'int', group },
    { key: `${p}DampingExpansion`, n: first + 3, label: 'Damping Ratio (Expansion)', kind: 'int', group },
    { key: `${p}NaturalFrequency`, n: first + 4, label: 'Natural Frequency', kind: 'decimal', decimals: 2, group },
    { key: `${p}NegativeCamber`, n: first + 5, label: 'Negative Camber Angle', kind: 'decimal', decimals: 1, group },
    { key: `${p}Toe`, n: first + 6, label: 'Toe Angle', kind: 'decimal', decimals: 2, group },
  ] as const

// Front and rear differential share the same three inputs.
const diffAxle = <P extends 'diffFront' | 'diffRear'>(p: P, group: string, first: number) =>
  [
    { key: `${p}InitialTorque`, n: first + 0, label: 'Initial Torque', kind: 'int', group },
    { key: `${p}AccelSensitivity`, n: first + 1, label: 'Acceleration Sensitivity', kind: 'int', group },
    { key: `${p}BrakingSensitivity`, n: first + 2, label: 'Braking Sensitivity', kind: 'int', group },
  ] as const

export const SECTIONS = [
  {
    id: 'general',
    title: 'General',
    fields: [
      { key: 'maxPower', n: 1, label: 'Max Power', kind: 'int', min: 0, unit: 'power' },
      { key: 'maxTorque', n: 2, label: 'Max Torque', kind: 'decimal', decimals: 1, min: 0, unit: 'torque' },
      { key: 'weight', n: 3, label: 'Weight', kind: 'int', min: 0, unit: 'weight' },
    ],
  },
  {
    id: 'gtAuto',
    title: 'GT Auto',
    fields: [
      { key: 'bodyKit', n: 4, label: 'Body Kit', kind: 'toggle' },
      { key: 'rimWidth', n: 5, label: 'Rim Width', kind: 'enum', options: ['Standard', 'Wide'], group: 'Wheel' },
      { key: 'rimOffset', n: 6, label: 'Offset', kind: 'enum', options: ['Standard', 'Wide'], group: 'Wheel' },
    ],
  },
  {
    id: 'tires',
    title: 'Tires',
    fields: [
      { key: 'tiresFront', n: 7, label: 'Front', kind: 'enum', options: TIRES },
      { key: 'tiresRear', n: 8, label: 'Rear', kind: 'enum', options: TIRES },
    ],
  },
  {
    id: 'suspension',
    title: 'Suspension',
    fields: [
      {
        key: 'suspension',
        n: 9,
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
      ...suspensionAxle('suspFront', 'Front', 10),
      ...suspensionAxle('suspRear', 'Rear', 17),
    ],
  },
  {
    id: 'differential',
    title: 'Differential Gear',
    fields: [
      {
        key: 'differential',
        n: 24,
        label: 'Differential',
        kind: 'enum',
        options: ['Normal', 'One-Way LSD', 'Two-Way LSD', 'Fully Customised'],
      },
      ...diffAxle('diffFront', 'Front', 25),
      ...diffAxle('diffRear', 'Rear', 28),
      {
        key: 'centerDifferential',
        n: 31,
        label: 'Torque-Vectoring Center Differential',
        kind: 'enum',
        options: ['Normal', 'Torque-Vectoring Center Differential'],
      },
      { key: 'torqueSplitFront', n: 32, label: 'Front/Rear Torque Distribution', kind: 'ratio', min: 5, max: 50 },
    ],
  },
  {
    id: 'aerodynamics',
    title: 'Aerodynamics',
    fields: [
      { key: 'aeroFront', n: 33, label: 'Front', kind: 'int' },
      { key: 'aeroRear', n: 34, label: 'Rear', kind: 'int' },
    ],
  },
  {
    id: 'ecu',
    title: 'ECU',
    fields: [
      { key: 'ecu', n: 35, label: 'ECU', kind: 'enum', options: ['Normal', 'Sport Computer', 'Full Control Computer'] },
      { key: 'ecuOutput', n: 36, label: 'Output Adjustment', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'performance',
    title: 'Performance Adjustment',
    fields: [
      { key: 'ballast', n: 37, label: 'Ballast', kind: 'int', min: 0 },
      { key: 'ballastPosition', n: 38, label: 'Ballast Positioning', kind: 'int', min: -50, max: 50 },
      { key: 'powerRestrictor', n: 39, label: 'Power Restrictor', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'transmission',
    title: 'Transmission',
    fields: [
      {
        key: 'transmission',
        n: 40,
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
      { key: 'topSpeed', n: 41, label: 'Top Speed', kind: 'int', min: 0 },
      { key: 'gearRatios', n: 42, label: 'Gear Ratios', kind: 'gears', decimals: 3, maxGears: 8 },
    ],
  },
  {
    id: 'nitrous',
    title: 'Nitrous/Overtake',
    fields: [
      { key: 'nitrous', n: 43, label: 'Nitrous/Overtake', kind: 'enum', options: ['None', 'Nitrous'] },
      { key: 'nitrousOutput', n: 44, label: 'Output Adjustment', kind: 'int', min: 0, max: 100 },
    ],
  },
  {
    id: 'forcedInduction',
    title: 'Turbocharger/Supercharger',
    fields: [
      {
        key: 'turbocharger',
        n: 45,
        label: 'Turbocharger',
        kind: 'enum',
        options: ['Normal', 'Low RPM', 'Medium RPM', 'High RPM'],
      },
      { key: 'antiLag', n: 46, label: 'Anti-Lag', kind: 'enum', options: ['None', 'Anti-Lag System'] },
      { key: 'antiLagSystem', n: 47, label: 'Anti-Lag System', kind: 'enum', options: ['Off', 'Weak', 'Strong'] },
      {
        key: 'intercooler',
        n: 48,
        label: 'Intercooler',
        kind: 'enum',
        options: ['None', 'High-Capacity Intercooler', 'Racing Intercooler'],
      },
      {
        key: 'supercharger',
        n: 49,
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
        n: 50,
        label: 'Air Cleaner',
        kind: 'enum',
        options: ['Normal', 'Sports Air Filter', 'Racing Air Filter'],
      },
      {
        key: 'muffler',
        n: 51,
        label: 'Muffler/Silencer',
        kind: 'enum',
        options: ['Normal', 'Sports', 'Semi-Racing', 'Racing'],
      },
      { key: 'exhaustManifold', n: 52, label: 'Exhaust Manifold', kind: 'enum', options: ['Normal', 'Racing'] },
    ],
  },
  {
    id: 'brakes',
    title: 'Brakes',
    fields: [
      {
        key: 'brakes',
        n: 53,
        label: 'Brakes',
        kind: 'enum',
        options: ['Normal', 'Racing (Slotted Discs)', 'Racing (Drilled Discs)', 'Carbon'],
      },
      { key: 'brakePads', n: 54, label: 'Brake Pads', kind: 'enum', options: ['Normal', 'Racing'] },
      { key: 'handbrake', n: 55, label: 'Handbrake', kind: 'enum', options: ['Normal', 'Hydraulic Handbrake'] },
      { key: 'handbrakeTorque', n: 56, label: 'Handbrake Torque', kind: 'int', min: 0, max: 100 },
      { key: 'brakeBalance', n: 57, label: 'Brake Balance', kind: 'enum', options: ['Normal', 'Brake Controller'] },
      { key: 'brakeFrontRearBalance', n: 58, label: 'Front/Rear Balance', kind: 'int', min: -5, max: 5 },
    ],
  },
  {
    // 4WS System and Rear Steering Angle are research to-dos (T1, T2) and not modelled yet.
    id: 'steering',
    title: 'Steering',
    fields: [
      {
        key: 'steeringAngleKit',
        n: 59,
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
        n: 60,
        label: 'Clutch & Flywheel',
        kind: 'enum',
        options: ['Normal', 'Semi-Racing', 'Racing'],
      },
      {
        key: 'propellerShaft',
        n: 61,
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
      { key: 'boreUp', n: 62, label: 'Bore Up', kind: 'toggle' },
      { key: 'strokeUp', n: 63, label: 'Stroke Up', kind: 'toggle' },
      { key: 'engineBalanceTuning', n: 64, label: 'Engine Balance Tuning', kind: 'toggle' },
      { key: 'polishPorts', n: 65, label: 'Polish Ports', kind: 'toggle' },
      { key: 'highLiftCamShaft', n: 66, label: 'High Lift Cam Shaft', kind: 'toggle' },
      {
        key: 'titaniumRodsPistons',
        n: 67,
        label: 'Titanium Connecting Rods & Pistons',
        kind: 'toggle',
      },
      { key: 'racingCrankShaft', n: 68, label: 'Racing Crank Shaft', kind: 'toggle' },
      { key: 'highCompressionPistons', n: 69, label: 'High Compression Pistons', kind: 'toggle' },
    ],
  },
  {
    id: 'bodywork',
    title: 'Bodywork',
    fields: [
      { key: 'weightReduction1', n: 70, label: 'Weight Reduction: Stage 1', kind: 'toggle' },
      { key: 'weightReduction2', n: 71, label: 'Weight Reduction: Stage 2', kind: 'toggle' },
      { key: 'weightReduction3', n: 72, label: 'Weight Reduction: Stage 3', kind: 'toggle' },
      { key: 'weightReduction4', n: 73, label: 'Weight Reduction: Stage 4', kind: 'toggle' },
      { key: 'weightReduction5', n: 74, label: 'Weight Reduction: Stage 5', kind: 'toggle' },
      { key: 'bodyRigidity', n: 75, label: 'Increase Body Rigidity', kind: 'toggle' },
    ],
  },
] as const satisfies readonly SectionDef[]

// All fields in display order, for code that loops over them.
export const FIELDS: readonly FieldDef[] = SECTIONS.flatMap((s) => [...s.fields] as FieldDef[])

export const FIELD_BY_KEY: Readonly<Record<string, FieldDef>> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f]),
)
