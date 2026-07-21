type InterventionType = "levee" | "excavation" | "culvert" | "blockage";

type Intervention = {
  id: string;
  type: InterventionType;
  x: number;
  y: number;
};

type SimulationInput = {
  rainfall?: number;
  duration?: number;
  discharge?: number;
  tide?: number;
  interventions?: Intervention[];
};

const WIDTH = 32;
const HEIGHT = 22;

const BUILDINGS = [
  [4, 3], [7, 4], [10, 3], [14, 4], [18, 3], [22, 4], [27, 3],
  [3, 8], [7, 8], [12, 7], [17, 8], [23, 7], [28, 8],
  [5, 16], [9, 18], [15, 17], [20, 18], [25, 16], [29, 18],
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const safeNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
};

const riverY = (x: number) => 11 + Math.sin(x * 0.31) * 1.7;

function normalizeInterventions(value: unknown): Intervention[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 16).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<Intervention>;
    if (
      !candidate.type ||
      !["levee", "excavation", "culvert", "blockage"].includes(candidate.type)
    ) {
      return [];
    }

    return [{
      id: String(candidate.id ?? `intervention-${index}`),
      type: candidate.type,
      x: Math.round(safeNumber(candidate.x, WIDTH / 2, 0, WIDTH - 1)),
      y: Math.round(safeNumber(candidate.y, HEIGHT / 2, 0, HEIGHT - 1)),
    }];
  });
}

function calculate(input: Required<Omit<SimulationInput, "interventions">> & {
  interventions: Intervention[];
}) {
  const forcing = clamp(
    (input.rainfall / 140) * 0.46 +
      (input.duration / 240) * 0.18 +
      (input.discharge / 1500) * 0.28 +
      (input.tide / 2.5) * 0.08,
    0.08,
    1.35,
  );

  const cells = [];

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const distanceToRiver = Math.abs(y - riverY(x));
      const riverInfluence = Math.exp(-distanceToRiver / 4.7);
      const urbanPocket =
        Math.max(0, Math.sin(x * 0.55 + y * 0.38)) *
        Math.exp(-Math.abs(y - 6) / 7);
      const terrain =
        5.4 + distanceToRiver * 0.28 + Math.sin(x * 0.22) * 0.38 +
        Math.cos(y * 0.51) * 0.18;

      let depth =
        forcing * (2.35 * riverInfluence + 0.62 * urbanPocket) -
        (0.22 + distanceToRiver * 0.052);

      for (const intervention of input.interventions) {
        const dx = x - intervention.x;
        const dy = y - intervention.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const localWeight = Math.exp(-distance / 3.2);

        if (intervention.type === "levee") {
          depth -= 0.76 * localWeight;
          if (x < intervention.x && distanceToRiver < 4.5) {
            depth += 0.14 * Math.exp(-Math.abs(dx) / 7) * Math.exp(-Math.abs(dy) / 3);
          }
        }

        if (intervention.type === "excavation") {
          depth -= 0.42 * localWeight * Math.exp(-distanceToRiver / 5);
        }

        if (intervention.type === "culvert") {
          depth -= 0.58 * localWeight * (0.65 + urbanPocket * 0.5);
        }

        if (intervention.type === "blockage") {
          const upstream = x <= intervention.x ? 1 : -0.25;
          depth +=
            0.72 * upstream * Math.exp(-Math.abs(dx) / 7.5) *
            Math.exp(-Math.abs(dy) / 3.4);
        }
      }

      depth = clamp(depth, 0, 3.8);
      const arrival = depth < 0.08
        ? 99
        : clamp(
            Math.round(2 + distanceToRiver * 0.72 + (1.15 - forcing) * 4),
            1,
            11,
          );

      cells.push({
        x,
        y,
        elevation: Number(terrain.toFixed(2)),
        depth: Number(depth.toFixed(2)),
        arrival,
      });
    }
  }

  const getDepth = (x: number, y: number) =>
    cells[y * WIDTH + x]?.depth ?? 0;
  const maxDepth = Math.max(...cells.map((cell) => cell.depth));
  const floodedCells = cells.filter((cell) => cell.depth >= 0.15);
  const affectedBuildings = BUILDINGS.filter(
    ([x, y]) => getDepth(x, y) >= 0.2,
  ).length;
  const exposedRoads = cells.filter(
    (cell) =>
      (cell.x === 8 || cell.x === 20 || cell.y === 5 || cell.y === 17) &&
      cell.depth >= 0.18,
  ).length;
  const earliestArrivalStep = Math.min(
    ...cells.filter((cell) => cell.depth >= 0.3).map((cell) => cell.arrival),
    12,
  );
  const riskScore = clamp(
    Math.round(
      (floodedCells.length / cells.length) * 58 + (maxDepth / 3.8) * 42,
    ),
    0,
    100,
  );

  return {
    cells,
    metrics: {
      maxDepth: Number(maxDepth.toFixed(2)),
      floodedArea: Number((floodedCells.length * 0.0025).toFixed(2)),
      affectedBuildings,
      exposedRoads: Number((exposedRoads * 0.05).toFixed(1)),
      firstArrivalMinutes: earliestArrivalStep * 15,
      riskScore,
      estimatedDamage: Math.round(
        affectedBuildings * 2.8 + floodedCells.length * 0.018,
      ),
    },
  };
}

export async function POST(request: Request) {
  let body: SimulationInput;

  try {
    body = (await request.json()) as SimulationInput;
  } catch {
    return Response.json(
      { message: "시뮬레이션 입력 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const input = {
    rainfall: safeNumber(body.rainfall, 96, 10, 180),
    duration: safeNumber(body.duration, 180, 30, 360),
    discharge: safeNumber(body.discharge, 980, 100, 2000),
    tide: safeNumber(body.tide, 0.8, 0, 3),
    interventions: normalizeInterventions(body.interventions),
  };

  const scenario = calculate(input);
  const baseline = calculate({ ...input, interventions: [] });

  return Response.json({
    ...scenario,
    grid: { width: WIDTH, height: HEIGHT, cellMeters: 50 },
    comparison: {
      baselineRisk: baseline.metrics.riskScore,
      deltaRisk: scenario.metrics.riskScore - baseline.metrics.riskScore,
      baselineDamage: baseline.metrics.estimatedDamage,
      deltaDamage:
        scenario.metrics.estimatedDamage - baseline.metrics.estimatedDamage,
    },
    model: "RIVERSE rapid-grid v0.1",
    generatedAt: new Date().toISOString(),
  });
}
