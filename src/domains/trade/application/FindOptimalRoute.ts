import { IRouteRepository } from "../domain/repositories/IRouteRepository";
import { Route } from "../domain/models/Route";

export class FindOptimalRoute {
  constructor(private routeRepo: IRouteRepository) {}

  /**
   * Ejecuta el caso de uso para encontrar la ruta óptima
   * @param origin país de origen
   * @param destination país de destino
   * @returns objeto Route con origen, destino, path completo y costo total
   */
  async execute(origin: string, destination: string): Promise<Route> {
    const route = await this.routeRepo.findOptimalRoute(origin, destination);

    if (!route || !route.path || route.path.length === 0 || !route.cost) {
      throw new Error("No se pudo calcular la ruta óptima");
    }

    return route;
  }
}
