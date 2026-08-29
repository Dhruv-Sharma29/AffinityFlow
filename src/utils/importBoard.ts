import type { Card, CardColor } from '../types/board';

export interface ParsedImport {
  cards: Array<Pick<Card, 'title' | 'body' | 'eyebrow' | 'color'>>;
  warnings: string[];
}

const colors: CardColor[] = ['cream', 'yellow', 'pink', 'green', 'blue', 'purple'];

function parseCsv(input: string): { rows: string[][]; warnings: string[] } {
  const rows: string[][] = [];
  const warnings: string[] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const pushRow = () => {
    if (row.some(value => value.length > 0)) rows.push(row);
    row = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      pushCell();
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      pushCell();
      pushRow();
    } else {
      cell += character;
    }
  }

  if (quoted) warnings.push('A quoted CSV field was not closed; the remaining text was imported as-is.');
  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }
  return { rows, warnings };
}

export function parseBoardImport(input: string, filename = ''): ParsedImport {
  const cleanInput = input.replace(/^\uFEFF/, '');
  const lines = cleanInput.split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return { cards: [], warnings: ['The file is empty.'] };

  if (/\.md$|\.markdown$/i.test(filename) || /^\s*[-*+]\s+/m.test(cleanInput)) {
    const cards = lines
      .filter(line => /^\s*[-*+]\s+/.test(line) || /^\s*#{1,6}\s+/.test(line))
      .map((line, index) => {
        const match = line.match(/^\s*(?:[-*+]\s+|#{1,6}\s+)(.*)$/);
        const value = match?.[1]?.trim() || line.trim();
        return {
          title: value,
          body: '',
          eyebrow: /^\s*#/.test(line) ? 'Heading' : 'Idea',
          color: colors[index % colors.length],
        };
      });
    return { cards, warnings: cards.length ? [] : ['No bullet points or headings were found.'] };
  }

  const parsedCsv = parseCsv(cleanInput);
  const rows = parsedCsv.rows;
  if (!rows.length) return { cards: [], warnings: ['The file is empty.'] };

  const headers = rows[0].map(header => header.toLowerCase());
  const index = (names: string[]) => names.map(name => headers.indexOf(name)).find(value => value >= 0) ?? -1;
  const titleIndex = index(['title', 'name', 'idea', 'text']);
  const bodyIndex = index(['body', 'description', 'details', 'notes']);
  const eyebrowIndex = index(['category', 'eyebrow', 'type']);
  const colorIndex = index(['color']);
  const warnings = [...parsedCsv.warnings];
  if (titleIndex < 0) warnings.push('No title column found; the first column will be used.');

  const cards = rows.slice(1).map((row, rowIndex) => {
    const rawColor = colorIndex >= 0 ? row[colorIndex]?.toLowerCase() : '';
    return {
      title: row[titleIndex >= 0 ? titleIndex : 0] || `Imported idea ${rowIndex + 1}`,
      body: bodyIndex >= 0 ? row[bodyIndex] || '' : '',
      eyebrow: eyebrowIndex >= 0 ? row[eyebrowIndex] || '' : '',
      color: colors.includes(rawColor as CardColor) ? rawColor as CardColor : colors[rowIndex % colors.length],
    };
  });

  return { cards, warnings };
}
