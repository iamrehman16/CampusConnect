import { buildEndorsementTags, canonicalTag } from './mentor-endorsement';

describe('canonicalTag', () => {
  const labels = ['Data Structures', 'SQL'];

  it("returns the mentor's own spelling, ignoring case and spacing", () => {
    expect(canonicalTag('  data structures ', labels)).toBe('Data Structures');
    expect(canonicalTag('sql', labels)).toBe('SQL');
  });

  it('rejects anything the mentor does not list', () => {
    expect(canonicalTag('Painting', labels)).toBeNull();
    expect(canonicalTag('Data', labels)).toBeNull(); // no partial matches
  });
});

describe('buildEndorsementTags', () => {
  it('lists every label with counts (0 included), most endorsed first, deduplicated', () => {
    const tags = buildEndorsementTags(
      ['SQL', 'Data Structures', 'sql', 'Graphs'],
      new Map([
        ['Data Structures', 3],
        ['SQL', 1],
      ]),
      new Set(['SQL']),
    );

    expect(tags).toEqual([
      { tag: 'Data Structures', count: 3, endorsedByMe: false },
      { tag: 'SQL', count: 1, endorsedByMe: true },
      { tag: 'Graphs', count: 0, endorsedByMe: false },
    ]);
  });

  it('breaks equal counts alphabetically so the order is stable', () => {
    const tags = buildEndorsementTags(['b', 'a'], new Map(), new Set());

    expect(tags.map((t) => t.tag)).toEqual(['a', 'b']);
  });
});
