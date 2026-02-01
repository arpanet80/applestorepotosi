import { Injectable } from "@angular/core";
import { StatCard } from "./stat-card.model";

@Injectable({ providedIn: 'root' })
export class StatsMapperService {
  /**
   * stats: objeto que devuelve TU servicio (cualquier forma)
   * defs: array con la definición manual de cada tarjeta
   */
  toCards(stats: Record<string, any>,
          defs: { key: string; label: string; icon: string; color: StatCard['color'] }[]): StatCard[] {

    if (!stats) return [];

    return defs
      .filter(d => typeof stats[d.key] === 'number')
      .map(d => ({
        icon   : d.icon,
        color  : d.color,
        label  : d.label,
        value  : stats[d.key]
      }));
  }
}