import { IRouteRepository } from "../../domain/repositories/IRouteRepository";
import { Route } from "../../domain/models/Route";

type RawResp = {
  path: string[];
  total_cost: number;
};

export class RouteApiRepository implements IRouteRepository {
  async findOptimalRoute(origin: string, destination: string): Promise<Route> {
    const response = await fetch("/api/compute-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, product: "Paneles solares" }),
    });

    if (!response.ok) {
      throw new Error("Error al calcular la ruta");
    }

    const data: RawResp = await response.json();
    // construimos el objeto Route con el path completo y costo
    return new Route(data.path[0], data.path[data.path.length - 1], data.total_cost);
  }
}
