import { ResourceQueryBuilder } from './build-resource-query';
import { ResourceQueryDto } from '../resource-query.dto';

const build = (patch: Partial<ResourceQueryDto>) =>
  new ResourceQueryBuilder().build(
    Object.assign(new ResourceQueryDto(), patch),
  );

describe('ResourceQueryBuilder — course filter (D7)', () => {
  it('matches the course code exactly, ignoring case', () => {
    const q = build({ course: ' cs-341 ' });
    expect(q.course).toEqual({ $regex: '^cs-341$', $options: 'i' });
  });

  it('escapes regex metacharacters so input stays literal', () => {
    const q = build({ course: 'CS.3+1' });
    expect(q.course).toEqual({ $regex: '^CS\\.3\\+1$', $options: 'i' });
  });

  it('adds no course clause when absent', () => {
    expect(build({}).course).toBeUndefined();
  });
});
