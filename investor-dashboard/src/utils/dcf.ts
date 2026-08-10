import type { Recommendation, ValuationInputs } from '../types';

export interface DcfYearProjection {
  year: number;
  growthRate: number;
  cashFlow: number;
  discounted: number;
}

export interface DcfResult {
  projections: DcfYearProjection[];
  presentValueSum: number;
  terminalValue: number;
  discountedTerminalValue: number;
  fairValueDcf: number;
  fairValueMultiple: number;
  fairValueBlended: number;
  buyBelowPrice: number;
  upsidePct: number;
  recommendation: Recommendation;
}

/** Fades from an early-year growth rate to a long-run terminal rate across `years`. */
function growthForYear(year: number, inputs: ValuationInputs): number {
  const { growth3y, growth5y, growth10y } = inputs;
  if (year <= 3) return growth3y;
  if (year <= 5) return growth5y;
  if (year <= 10) return growth10y;
  return growth10y;
}

export function runDcf(inputs: ValuationInputs): DcfResult {
  const { epsBase, wacc, terminalGrowth, marginOfSafety, peRatio, currentPrice } = inputs;
  const waccDecimal = wacc / 100;
  const projections: DcfYearProjection[] = [];
  let cashFlow = epsBase;
  let presentValueSum = 0;

  for (let year = 1; year <= 10; year++) {
    const g = growthForYear(year, inputs) / 100;
    cashFlow = cashFlow * (1 + g);
    const discounted = cashFlow / Math.pow(1 + waccDecimal, year);
    presentValueSum += discounted;
    projections.push({ year, growthRate: g * 100, cashFlow, discounted });
  }

  const terminalGrowthDecimal = Math.min(terminalGrowth / 100, waccDecimal - 0.005);
  const terminalValue =
    waccDecimal > terminalGrowthDecimal
      ? (cashFlow * (1 + terminalGrowthDecimal)) / (waccDecimal - terminalGrowthDecimal)
      : cashFlow * 20;
  const discountedTerminalValue = terminalValue / Math.pow(1 + waccDecimal, 10);

  const fairValueDcf = presentValueSum + discountedTerminalValue;

  const projectedEps5y = epsBase * Math.pow(1 + inputs.growth5y / 100, 5);
  const fairValueMultiple = projectedEps5y * peRatio;

  const fairValueBlended = fairValueDcf * 0.6 + fairValueMultiple * 0.4;
  const buyBelowPrice = fairValueBlended * (1 - marginOfSafety / 100);
  const upsidePct = ((fairValueBlended - currentPrice) / currentPrice) * 100;

  let recommendation: Recommendation = 'Halten';
  if (currentPrice <= buyBelowPrice) recommendation = 'Kaufen';
  else if (currentPrice >= fairValueBlended * 1.1) recommendation = 'Verkaufen';

  return {
    projections,
    presentValueSum,
    terminalValue,
    discountedTerminalValue,
    fairValueDcf,
    fairValueMultiple,
    fairValueBlended,
    buyBelowPrice,
    upsidePct,
    recommendation,
  };
}

export interface ScenarioResult {
  name: 'Bear Case' | 'Base Case' | 'Bull Case';
  fairValue: number;
  upsidePct: number;
}

export function runScenarios(inputs: ValuationInputs): ScenarioResult[] {
  const scale = (val: number, factor: number) => val * factor;

  const bear: ValuationInputs = {
    ...inputs,
    growth3y: scale(inputs.growth3y, 0.55),
    growth5y: scale(inputs.growth5y, 0.55),
    growth10y: scale(inputs.growth10y, 0.6),
    wacc: inputs.wacc + 1.5,
    terminalGrowth: Math.max(0, inputs.terminalGrowth - 0.5),
  };
  const bull: ValuationInputs = {
    ...inputs,
    growth3y: scale(inputs.growth3y, 1.35),
    growth5y: scale(inputs.growth5y, 1.3),
    growth10y: scale(inputs.growth10y, 1.2),
    wacc: Math.max(2, inputs.wacc - 1),
    terminalGrowth: inputs.terminalGrowth + 0.5,
  };

  return [
    { name: 'Bear Case', ...toSummary(runDcf(bear), inputs.currentPrice) },
    { name: 'Base Case', ...toSummary(runDcf(inputs), inputs.currentPrice) },
    { name: 'Bull Case', ...toSummary(runDcf(bull), inputs.currentPrice) },
  ];
}

function toSummary(result: DcfResult, currentPrice: number) {
  return {
    fairValue: result.fairValueBlended,
    upsidePct: ((result.fairValueBlended - currentPrice) / currentPrice) * 100,
  };
}

export function runSensitivity(inputs: ValuationInputs): { waccSteps: number[]; growthSteps: number[]; grid: number[][] } {
  const waccSteps = [-2, -1, 0, 1, 2].map((d) => Math.max(2, inputs.wacc + d));
  const growthSteps = [-4, -2, 0, 2, 4].map((d) => Math.max(-10, inputs.growth5y + d));

  const grid = waccSteps.map((wacc) =>
    growthSteps.map((growth5y) => {
      const result = runDcf({ ...inputs, wacc, growth5y });
      return result.fairValueBlended;
    }),
  );

  return { waccSteps, growthSteps, grid };
}
