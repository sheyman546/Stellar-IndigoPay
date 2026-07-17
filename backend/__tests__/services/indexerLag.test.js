const { jest } = require('@jest/globals');

jest.mock('../../src/db/pool', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../../src/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../src/services/indexerDLQWorker', () => ({
  enqueue: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/services/indexerBackfill', () => ({
  runBackfill: jest.fn(),
}));

jest.mock('../../src/services/indexerDonationHandler', () => ({
  handleDonation: jest.fn().mockResolvedValue(true),
  setUsdcToXlmRate: jest.fn(),
}));

jest.mock('../../src/services/metrics', () => ({
  registry: {},
}));

const pool = require('../../src/db/pool');
const { runLagCheck, setLagRuntimeState, getLagRuntimeState, resetLagRuntimeState } = require('../../src/services/indexerService');

describe('indexer lag detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLagRuntimeState();
    setLagRuntimeState({
      currentCursorLedger: 100,
      latestLedger: 110,
      lastCheckedAt: Date.now(),
      backoffMs: 1000,
      lastBackfillOutcome: null,
    });
  });

  it('calculates lag and triggers a backfill when threshold is exceeded', async () => {
    const backfill = require('../../src/services/indexerBackfill');
    backfill.runBackfill = jest.fn().mockResolvedValue({ processed: 2, errors: 0 });

    const result = await runLagCheck();

    expect(result.lag).toBe(10);
    expect(result.triggeredBackfill).toBe(true);
    expect(backfill.runBackfill).toHaveBeenCalled();
  });

  it('doubles backoff after a failed backfill', async () => {
    const backfill = require('../../src/services/indexerBackfill');
    backfill.runBackfill = jest.fn().mockRejectedValue(new Error('boom'));

    await runLagCheck();
    const stateAfterFailure = getLagRuntimeState();

    expect(stateAfterFailure.backoffMs).toBe(2000);
  });
});
