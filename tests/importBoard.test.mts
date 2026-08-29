import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoardImport } from '../src/utils/importBoard.ts';
import { getImportLayout } from '../src/utils/importLayout.ts';
import { normalizeBoardState } from '../src/utils/boardValidation.ts';

test('parses CSV columns, quoted commas, colors, and multiline cells', () => {
  const result = parseBoardImport(
    'title,body,category,color\n"Improve, onboarding","First line\nSecond line",Research,blue\nShip it,,Launch,unknown',
    'ideas.csv',
  );

  assert.equal(result.cards.length, 2);
  assert.equal(result.cards[0].title, 'Improve, onboarding');
  assert.equal(result.cards[0].body, 'First line\nSecond line');
  assert.equal(result.cards[0].color, 'blue');
  assert.equal(result.cards[1].title, 'Ship it');
  assert.equal(result.cards[1].color, 'yellow');
  assert.deepEqual(result.warnings, []);
});

test('parses markdown headings and bullets while ignoring prose', () => {
  const result = parseBoardImport('# Research\n\nContext\n- Interview users\n* Map the journey', 'notes.md');

  assert.deepEqual(result.cards.map(card => card.title), ['Research', 'Interview users', 'Map the journey']);
  assert.equal(result.cards[0].eyebrow, 'Heading');
  assert.equal(result.cards[1].eyebrow, 'Idea');
});

test('returns a useful warning for empty input and malformed CSV quotes', () => {
  assert.deepEqual(parseBoardImport('   \n\n', 'ideas.csv').cards, []);
  assert.match(parseBoardImport('title,body\n"Unfinished,idea', 'ideas.csv').warnings[0], /quoted CSV field/);
});

test('lays out imported cards without overlap or stacking', () => {
  const occupied = [{ x: 0, y: 100, width: 220, height: 140 }];
  const layout = getImportLayout(8, occupied);

  assert.equal(layout.length, 8);
  assert.equal(new Set(layout.map(item => `${item.x}:${item.y}`)).size, 8);
  for (let left = 0; left < layout.length; left += 1) {
    for (let right = left + 1; right < layout.length; right += 1) {
      const a = layout[left];
      const b = layout[right];
      const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      assert.equal(overlaps, false);
    }
  }
  assert.ok(layout.every(item => item.x >= 300));
});

test('normalizes legacy and malformed board JSON safely', () => {
  const state = normalizeBoardState({
    cards: [{ id: 'card-1', title: 'Keep me', x: 10, y: 20, width: 220, height: 140, color: 'blue' }, { id: 7 }],
    shapes: 'not-an-array',
    connectors: [{ id: 'line-1', fromCardId: 'card-1', toCardId: 'missing', color: 'bad' }],
    clusters: [],
    images: [{ id: 'image-1', src: 'data:image/png;base64,abc', width: 4, shape: 'circle' }, { id: 7 }],
    textItems: [{ id: 'text-1', color: 'not-a-color' }],
  });

  assert.equal(state.cards.length, 1);
  assert.equal(state.cards[0].title, 'Keep me');
  assert.equal(state.cards[0].color, 'blue');
  assert.deepEqual(state.shapes, []);
  assert.equal(state.connectors[0].color, 'red');
  assert.equal(state.textItems?.length, 1);
  assert.deepEqual(state.voteDots, []);
  assert.equal(state.images?.length, 1);
  assert.equal(state.images?.[0].shape, 'circle');
  assert.equal(state.images?.[0].width, 40);
  assert.equal(state.textItems?.[0].color, '#2b2420');
});
