import { Route } from "../models/Route";

export interface IRouteRepository {
  /**
   * Encuentra la ruta óptima entre un país de origen y destino.
   * @param origin país de origen
   * @param destination país de destino
   * @returns Promesa con el objeto Route que contiene origen, destino y costo
   */
  findOptimalRoute(origin: string, destination: string): Promise<Route>;
}
