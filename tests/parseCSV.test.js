'use strict';

const { parseCSV } = require('../src/core');

describe('parseCSV', () => {
  // ── Happy path ────────────────────────────────────────────────────────────
  describe('normal input', () => {
    test('parses a minimal two-row CSV into one object', () => {
      const csv = 'Name,Age\nAlice,30';
      const result = parseCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ Name: 'Alice', Age: '30' });
    });

    test('parses multiple data rows', () => {
      const csv = 'Status,ResponseMin\nlate,72\ngood,45\nexcellent,30';
      const result = parseCSV(csv);
      expect(result).toHaveLength(3);
      expect(result[0].Status).toBe('late');
      expect(result[1].Status).toBe('good');
      expect(result[2].ResponseMin).toBe('30');
    });

    test('trims whitespace from header and cell values', () => {
      const csv = ' Status , ResponseMin \n late , 72 ';
      const result = parseCSV(csv);
      expect(result[0]).toEqual({ Status: 'late', ResponseMin: '72' });
    });

    test('strips surrounding double-quotes from headers', () => {
      const csv = '"Status","ResponseMin"\n"late","72"';
      const result = parseCSV(csv);
      expect(result[0]).toEqual({ Status: 'late', ResponseMin: '72' });
    });

    test('handles Windows-style CRLF line endings', () => {
      const csv = 'Status,ResponseMin\r\nlate,72\r\ngood,45';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0].Status).toBe('late');
    });

    test('maps real medical transport column names correctly', () => {
      const csv = [
        'ResponseMin,DispatchMin,TravelMin,DurationMin,Status,Center,Severity,Shift,Month,Hospital',
        '64,12,38,110,late,C1,life-saving,Morning,January,King Faisal',
      ].join('\n');
      const result = parseCSV(csv);
      expect(result[0].ResponseMin).toBe('64');
      expect(result[0].Center).toBe('C1');
      expect(result[0].Hospital).toBe('King Faisal');
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    test('returns empty array for empty string', () => {
      expect(parseCSV('')).toEqual([]);
    });

    test('returns empty array for only whitespace', () => {
      expect(parseCSV('   ')).toEqual([]);
    });

    test('returns empty array when only header row exists (no data)', () => {
      expect(parseCSV('Status,ResponseMin')).toEqual([]);
    });

    test('fills missing columns with empty string', () => {
      const csv = 'A,B,C\n1,2';
      const result = parseCSV(csv);
      expect(result[0].C).toBe('');
    });

    test('handles a row with extra commas (more columns than header)', () => {
      const csv = 'A,B\n1,2,3';
      const result = parseCSV(csv);
      // Extra value is simply ignored — only declared columns are mapped
      expect(result[0].A).toBe('1');
      expect(result[0].B).toBe('2');
    });

    test('handles completely empty data row as all-empty-string values', () => {
      const csv = 'A,B\n,';
      const result = parseCSV(csv);
      expect(result[0].A).toBe('');
      expect(result[0].B).toBe('');
    });

    test('preserves numeric strings without coercion', () => {
      const csv = 'Value\n007';
      expect(parseCSV(csv)[0].Value).toBe('007');
    });

    test('handles a single-column CSV', () => {
      const csv = 'Status\nlate\ngood';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Status: 'late' });
    });

    test('handles Arabic text in headers and values', () => {
      const csv = 'الحالة,وقت_الاستجابة\nمتأخر,72\nجيد,45';
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]['الحالة']).toBe('متأخر');
      expect(result[0]['وقت_الاستجابة']).toBe('72');
      expect(result[1]['الحالة']).toBe('جيد');
    });

    test('handles mixed Arabic and Latin column names', () => {
      const csv = 'ResponseMin,الحالة\n64,متأخر';
      const result = parseCSV(csv);
      expect(result[0].ResponseMin).toBe('64');
      expect(result[0]['الحالة']).toBe('متأخر');
    });

    test('documents current behavior: embedded comma inside quotes is not supported', () => {
      // The parser splits on ALL commas — RFC 4180 embedded commas are not handled.
      // "value with, comma" is split into two cells, not one.
      const csv = 'A,B\n"value with, comma","second"';
      const result = parseCSV(csv);
      // After split on comma: A gets "value with", the embedded comma becomes a separator
      expect(result[0].A).toBe('value with');
      expect(result[0].B).toBe('comma');
    });

    test('values with spaces (but no embedded commas) are preserved correctly', () => {
      const csv = 'Hospital,Status\nKing Faisal,good';
      const result = parseCSV(csv);
      expect(result[0].Hospital).toBe('King Faisal');
    });
  });
});
