import { prisma } from "../lib/prisma.js";
const SAMPLE_SIZE = 10;
const ANOMALY_THRESHOLD = 3;

const MIN_CHECKS_REQUIRED = 3;

function calculateMean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
function calculateStdDev(values: number[], mean: number): number {
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}
export interface AnomalyResult {
  isAnomaly: boolean;
  mean: number | null;
  stdDev: number | null;
  zScore: number | null;
}
export async function detectLatencyAnomaly(
  monitorId: string,
  currentLatency: number,
): Promise<AnomalyResult> {
  const recentChecks = await prisma.check.findMany({
    where: {
      monitorId,
      isUp: true, // only compare against successful checks
      isAnomaly: false, // don't let previous anomalies skew the baseline
    },
    orderBy: { timestamp: "desc" },
    take: SAMPLE_SIZE,
    select: { latency: true },
  });
  if (recentChecks.length < MIN_CHECKS_REQUIRED) {
    return { isAnomaly: false, mean: null, stdDev: null, zScore: null };
  }
  const latencies = recentChecks.map((c) => c.latency);
  const mean = calculateMean(latencies);
  const stdDev = calculateStdDev(latencies, mean);
  if (stdDev === 0) {
    return { isAnomaly: false, mean, stdDev: 0, zScore: 0 };
  }
  const zScore = (currentLatency - mean) / stdDev;
  const isAnomaly = zScore > ANOMALY_THRESHOLD;
  return { isAnomaly, mean, stdDev, zScore };
}
