import 'reflect-metadata';
import { Types } from 'mongoose';
import { MentorQueryBuilder } from './build-mentor-query';
import { MentorSortBuilder } from './build-mentor-sort';
import { MentorSort } from '../dto/mentor-query.dto';

const me = new Types.ObjectId().toString();

type Clause = Record<string, unknown>;
const clauses = (dto: Record<string, unknown>) =>
  (new MentorQueryBuilder(me).build(dto) as { $and: Clause[] }).$and;

describe('MentorQueryBuilder', () => {
  it('always restricts to active, open-to-mentor users and excludes the requester', () => {
    const [base] = clauses({});

    expect(base).toMatchObject({
      isOpenToMentor: true,
      accountStatus: 'Active',
    });
    expect((base._id as { $ne: Types.ObjectId }).$ne.toString()).toBe(me);
  });

  it('adds no extra clauses when no filters are given', () => {
    expect(clauses({})).toHaveLength(1);
  });

  it('matches department case-insensitively and exactly', () => {
    const [, dept] = clauses({ department: ' computer science ' });
    const rx = dept.department as RegExp;

    expect(rx.test('Computer Science')).toBe(true);
    expect(rx.test('Computer Science and Engineering')).toBe(false);
  });

  it('builds a semester range from either or both bounds', () => {
    expect(clauses({ semesterMin: 5 })[1]).toEqual({ semester: { $gte: 5 } });
    expect(clauses({ semesterMax: 3 })[1]).toEqual({ semester: { $lte: 3 } });
    expect(clauses({ semesterMin: 2, semesterMax: 6 })[1]).toEqual({
      semester: { $gte: 2, $lte: 6 },
    });
  });

  it('topic searches mentoring topics and expertise, substring, case-insensitive', () => {
    const [, topic] = clauses({ topic: 'data struct' });
    const [byTopics, byExpertise] = topic.$or as Clause[];

    expect(
      (byTopics.mentorTopics as RegExp).test('Advanced DATA STRUCTURES'),
    ).toBe(true);
    expect(byExpertise).toHaveProperty('expertise');
  });

  it('free-text search covers name/topics/expertise and NEVER email', () => {
    const [, search] = clauses({ search: 'sara' });
    const fields = (search.$or as Clause[]).flatMap((c) => Object.keys(c));

    expect(fields.sort()).toEqual(['expertise', 'mentorTopics', 'name']);
    expect(fields).not.toContain('email');
  });

  it('escapes regex metacharacters so input is matched literally', () => {
    const [, search] = clauses({ search: '.*' });
    const rx = (search.$or as Clause[])[0].name as RegExp;

    expect(rx.test('anything at all')).toBe(false);
    expect(rx.test('a.*b')).toBe(true);
  });

  it('combines filters with AND (each free-text clause stays independent)', () => {
    expect(
      clauses({ department: 'CS', topic: 'os', search: 'ali' }),
    ).toHaveLength(4);
  });

  it('hasCapacity adds an $expr comparing active mentees to the limit (legacy docs default safely)', () => {
    const [, cap] = clauses({ hasCapacity: true });
    const json = JSON.stringify(cap);

    expect(json).toContain('$lt');
    expect(json).toContain('$activeMenteeCount');
    expect(json).toContain('$maxActiveMentees');
    expect(json).toContain('$ifNull');
    expect(clauses({ hasCapacity: false })).toHaveLength(1);
  });

  it('ignores blank text filters', () => {
    expect(clauses({ department: '  ', topic: '', search: ' ' })).toHaveLength(
      1,
    );
  });
});

describe('MentorSortBuilder', () => {
  const sort = (s?: MentorSort) => new MentorSortBuilder().build({ sort: s });

  it('defaults to highest reputation with a stable tiebreaker', () => {
    expect(sort()).toEqual({ contributionScore: -1, _id: 1 });
  });

  it('can sort by most recently active', () => {
    expect(sort(MentorSort.ACTIVE)).toEqual({ lastSeenAt: -1, _id: 1 });
  });
});
