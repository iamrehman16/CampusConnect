import { Types } from 'mongoose';
import 'reflect-metadata';
import { ResourceQueryBuilder } from './build-resource-query';
import { ResourceQueryDto } from '../resource-query.dto';
import { ApprovalStatus } from '../../enums/approval-status.enum';

const build = (patch: Partial<ResourceQueryDto>) =>
  new ResourceQueryBuilder().build(
    Object.assign(new ResourceQueryDto(), patch),
  );

const UPLOADER = '6ab5510401fb50d16c71f067';

describe('ResourceQueryBuilder — status defaults', () => {
  it('defaults general listings to approved', () => {
    expect(build({}).approvalStatus).toBe('Approved');
  });

  it("returns every status for an uploader's own list when none is given", () => {
    expect(build({ uploadedBy: UPLOADER }).approvalStatus).toBeUndefined();
  });

  it('filters by uploader as an ObjectId (the stored type), not a string', () => {
    const uploadedBy = build({ uploadedBy: UPLOADER }).uploadedBy;

    expect(uploadedBy).toBeInstanceOf(Types.ObjectId);
    expect((uploadedBy as Types.ObjectId).toString()).toBe(UPLOADER);
  });

  it('respects an explicit status', () => {
    expect(
      build({ uploadedBy: UPLOADER, status: ApprovalStatus.PENDING })
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
