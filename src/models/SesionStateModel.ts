import type { Sesion } from '../models/SesionModel';

export interface SesionState {
    loading: boolean,
    data: Sesion | null
}
