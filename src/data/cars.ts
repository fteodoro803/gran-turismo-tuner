import type { Car } from '../components/CarPicker'
import cars from './cars.json'

// Every car in the game's list, in the order of the game's by-manufacturer view (#4).
//
// cars.json was built once from the owner's saved copies of the official car list. Ids are our own
// readable slugs (D8), and each car's `image` field is its picture's path under public/ (D11). Once
// an id has appeared in a shared link it is never changed or reused.
export const CARS = cars as readonly Car[]
