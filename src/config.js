'use strict';

/**
 * @file config.js
 * @description Application configuration persistence helpers.
 *
 * Serialises and deserialises the SYNC state object to/from a JSON string
 * suitable for browser localStorage. These functions are kept pure (no direct
 * localStorage access) so they can be unit-tested in Node.js without a DOM.
 */

/**
 * Serialise a SYNC config state object into a JSON string for persistent storage.
 *
 * Only the fields needed across sessions are included in the output;
 * transient runtime state (loaded rows, chart instances, etc.) is excluded.
 * The alert log is capped at the 100 most recent entries to prevent unbounded
 * localStorage growth.
 *
 * @param {Object} syncState - The application SYNC configuration object
 * @returns {string} JSON string ready for `localStorage.setItem()`
 *
 * @example
 * const json = serialiseCFG(SYNC);
 * localStorage.setItem('wasl-config', json);
 */
function serialiseCFG(syncState) {
  return JSON.stringify({
    gsUrl:       syncState.gsUrl,
    webhookUrl:  syncState.webhookUrl,
    alertEmail:  syncState.alertEmail,
    intervalMin: syncState.intervalMin,
    thresholds:  syncState.thresholds,
    alertLog:    (syncState.alertLog || []).slice(0, 100),  // cap to last 100 entries
    alertsToday: syncState.alertsToday,
  });
}

/**
 * Deserialise a stored JSON string and merge it into an existing SYNC state.
 *
 * Merge rules:
 *  - Only truthy stored values overwrite the base state (a stored `0` or `''`
 *    is treated as "not set" and leaves the default intact).
 *  - Thresholds are merged at key level so a partial update (e.g. only `resp`
 *    changed) preserves the other threshold values.
 *  - The original `syncState` object is never mutated — a new object is returned.
 *  - Returns a shallow copy of `syncState` unchanged if `raw` is null, undefined,
 *    empty string, or invalid JSON.
 *
 * @param {string|null|undefined} raw       - JSON string from localStorage (null-safe)
 * @param {Object}                syncState - Existing SYNC state to merge into
 * @returns {Object} New state object with stored values merged in
 *
 * @example
 * const SYNC = deserialiseCFG(localStorage.getItem('wasl-config'), DEFAULT_SYNC);
 */
function deserialiseCFG(raw, syncState) {
  try {
    // `raw || '{}'` safely handles null/undefined/empty-string inputs
    const stored = JSON.parse(raw || '{}');

    // Start from a shallow copy so we never mutate the caller's object
    const output = { ...syncState };

    // Only overwrite fields that are present and truthy in the stored data
    if (stored.gsUrl)       output.gsUrl       = stored.gsUrl;
    if (stored.webhookUrl)  output.webhookUrl  = stored.webhookUrl;
    if (stored.alertEmail)  output.alertEmail  = stored.alertEmail;
    if (stored.intervalMin) output.intervalMin = stored.intervalMin;
    if (stored.alertLog)    output.alertLog    = stored.alertLog;
    if (stored.alertsToday) output.alertsToday = stored.alertsToday;

    // Merge thresholds at key level to support partial threshold updates
    if (stored.thresholds) {
      output.thresholds = { ...syncState.thresholds, ...stored.thresholds };
    }

    return output;
  } catch (_) {
    // Malformed JSON — return a clean copy of the base state unchanged
    return { ...syncState };
  }
}

module.exports = { serialiseCFG, deserialiseCFG };
