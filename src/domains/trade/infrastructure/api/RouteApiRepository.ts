import { IRouteRepository } from "../../domain/repositories/IRouteRepository";
import { Route } from "../../domain/models/Route";

type RawResp = {
  path: string[];
  total_cost: number;
  details: any[];
};

export class RouteApiRepository implements IRouteRepository {
  async findOptimalRoute(origin: string, destination: string): Promise<Route> {
    const response = await fetch("http://127.0.0.1:8000/api/compute-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, product: "Paneles solares" }),
    });

    if (!response.ok) {
      throw new Error("Error al calcular la ruta");
    }

    const data: RawResp = await response.json();

    return new Route(
      data.path[0],                       // primer nodo = origen real
      data.path[data.path.length - 1],    // último nodo = destino real
      data.total_cost,
      data.path                           // ✅ guardamos toda la ruta
    );
  }
}
