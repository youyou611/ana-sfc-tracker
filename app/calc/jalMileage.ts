export type JalRouteType = 'domestic' | 'asia_oceania' | 'other_intl';

export interface JalCalcParams {
  baseMiles: number;
  accumulationRate: number; // e.g. 1.0 (100%), 0.75 (75%)
  routeType: JalRouteType;
  boardingBonus: number; // e.g. 400 or 0
}

export function calcJalFOP(params: JalCalcParams): number {
  const { baseMiles, accumulationRate, routeType, boardingBonus } = params;
  
  let routeMultiplier = 1;
  if (routeType === 'domestic') {
    routeMultiplier = 2;
  } else if (routeType === 'asia_oceania') {
    routeMultiplier = 1.5;
  }
  
  const fop = Math.floor(baseMiles * accumulationRate * routeMultiplier) + boardingBonus;
  return fop;
}

export function calcJalLSP(routeType: JalRouteType, baseMiles: number): number {
  if (routeType === 'domestic') {
    // 5 points per domestic flight (regardless of distance)
    return 5;
  } else {
    // 5 points per 1,000 flight miles for international
    // JAL calculates it cumulatively across flights usually, but per flight for simplicity here:
    // Actually JAL awards 5 points per 1000 base miles flown (not strictly per flight but based on cumulative miles, 
    // however for this tracker we'll approximate it per flight or track total miles. 
    // Let's implement the standard: (Base Miles / 1000) * 5, maybe rounded or floored? 
    // Usually it's strictly 5 per 1,000 miles. Let's do exact decimal or just integer for simplicity if requested.
    // JAL's official page says: "1,000 flight miles = 5 Life Status Points".
    // We'll calculate it as a float and let the UI round it if needed, or floor it.
    // Let's return float so the total can be summed accurately.
    return (baseMiles / 1000) * 5;
  }
}
