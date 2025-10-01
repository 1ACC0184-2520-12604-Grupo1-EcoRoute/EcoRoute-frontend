export class Route {
  constructor(
    public origin: string,
    public destination: string,
    public cost: number,
    public path: string[]   // ✅ agregamos el camino completo
  ) {}
}
