/**
 * src/routes/stats.js
 * GET /api/stats/global — landing-page aggregate platform totals.
 */
"use strict";
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const redis = require("../services/redis");

const GLOBAL_STATS_CACHE_KEY = "stats:global";
const GLOBAL_STATS_CACHE_TTL_SECONDS = 60;

function mapGlobalStatsRow(row = {}) {
  return {
    totalXLMRaised: Number.parseFloat(row.totalXLMRaised || "0").toFixed(7),
    totalCO2OffsetKg: Number.parseInt(row.totalCO2OffsetKg, 10) || 0,
    totalDonations: Number.parseInt(row.totalDonations, 10) || 0,
    totalProjects: Number.parseInt(row.totalProjects, 10) || 0,
    totalDonors: Number.parseInt(row.totalDonors, 10) || 0,
  };
}

// GET /api/stats/global
router.get("/global", async (req, res, next) => {
  try {
    const cached = await redis.get(GLOBAL_STATS_CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    // Global stats are served from the `projection_global_stats`
    // materialised view, maintained by the projection engine from the
    // `donation_events` event store. totalProjects is still read from the
    // authoritative `projects` table (project registration is not yet an
    // event-sourced aggregate).
    const result = await pool.query(`
      SELECT
        g.total_xlm_raised::text                                                   AS "totalXLMRaised",
        g.total_co2_offset_kg::int                                                 AS "totalCO2OffsetKg",
        g.total_donations::int                                                     AS "totalDonations",
        (SELECT COUNT(*)::int FROM projects)                                       AS "totalProjects",
        g.total_donors::int                                                        AS "totalDonors"
      FROM projection_global_stats g
      WHERE g.id = 1
    `);

    const stats = mapGlobalStatsRow(result.rows[0]);
    await redis.set(
      GLOBAL_STATS_CACHE_KEY,
      stats,
      GLOBAL_STATS_CACHE_TTL_SECONDS,
    );

    res.json(stats);
  } catch (e) {
    next(e);
  }
});

// GET /api/stats/categories — project count per category
router.get("/categories", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        category,
        COUNT(*)::int AS count
      FROM projects
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
module.exports.GLOBAL_STATS_CACHE_KEY = GLOBAL_STATS_CACHE_KEY;
module.exports.GLOBAL_STATS_CACHE_TTL_SECONDS = GLOBAL_STATS_CACHE_TTL_SECONDS;
module.exports.mapGlobalStatsRow = mapGlobalStatsRow;
