import 'reflect-metadata';
import { ResourceQueryBuilder } from './build-resource-query';
import { ResourceQueryDto } from '../resource-query.dto';
import { ApprovalStatus } from '../../enums/approval-status.enum';

const build = (patch: Partial<ResourceQueryDto>) =>
  new ResourceQueryBuilder().build(
    Object.assign(new ResourceQueryDto(), patch),
  );

describe('ResourceQueryBuilder — status defaults', () => {
  it('defaults general listings to approved', () => {
    expect(build({}).approvalStatus).toBe('Approved');
  });

  it("returns every status for an uploader's own list when none is given", () => {
    expect(build({ uploadedBy: 'u1' }).approvalStatus).toBeUndefined();
  });

  it('respects an explicit status', () => {
    expect(
      build({ uploadedBy: 'u1', status: ApprovalStatus.PENDING })
        .approvalStatus,
    ).toBe('Pending');
  });
});

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
