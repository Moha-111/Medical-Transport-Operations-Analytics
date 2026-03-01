'use strict';

/**
 * @file csv-parser.js
 * @description CSV text parsing utilities for mission data ingestion.
 *
 * Converts raw comma-delimited text into an array of plain row objects,
 * using the first line as the header (column name) row.
 */

/**
 * Parse CSV text into an array of plain objects keyed by the header row.
 *
 * Handles:
 *  - Optional double-quote wrapping on headers and values
 *  - Leading/trailing whitespace trimming on every field
 *  - Windows (CRLF) and Unix (LF) line endings
 *  - Missing trailing columns (filled with empty string '')
 *
 * @param {string} txt - Raw CSV text. First line must be the header row.
 * @returns {Object[]} Array of row objects; empty array if fewer than 2 lines.
 *
 * @example
 * parseCSV('Status,ResponseMin\nlate,12\ngood,8')
 * // → [{ Status: 'late', ResponseMin: '12' }, { Status: 'good', ResponseMin: '8' }]
 *
 * @example
 * parseCSV('"Status","Time"\n"late","12"')  // quoted headers/values
 * // → [{ Status: 'late', Time: '12' }]
 */
function parseCSV(txt) {
  const lines = txt.trim().split(/\r?\n/);

  // Need at least a header row + one data row to produce any output
  if (lines.length < 2) return [];

  // Strip surrounding double-quotes and whitespace from each header name
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  // Map each data line to a { header: value } plain object
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((header, i) => {
      // Fall back to '' when a row has fewer columns than the header
      row[header] = values[i] || '';
    });
    return row;
  });
}

module.exports = { parseCSV };
