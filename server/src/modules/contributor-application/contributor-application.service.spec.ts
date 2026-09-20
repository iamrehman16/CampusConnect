import { Model, Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContributorApplicationService } from './contributor-application.service';
import { ContributorApplicationDocument } from './schema/contributor-application.schema';
import { ApplicationStatus } from './enums/application-status.enum';
import { UserService } from '../user/user.service';
import { Roles } from '../user/enums/user-role.enum';
import { PaginationService } from '../../common/services/pagination.service';

const applicantId = new Types.ObjectId();
const adminId = new Types.ObjectId().toString();
const applicationId = new Types.ObjectId();

const reason = 'I have complete, well organised notes for the whole of CS-301.';

function leanChain(result: unknown) {
  return {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
}

function build(opts: {
  role?: Roles;
  score?: number;
  model?: Record<string, unknown>;
  updateRole?: jest.Mock;
}) {
  const userService = {
    findOne: jest.fn().mockResolvedValue({
      role: opts.role ?? Roles.STUDENT,
      contributionScore: opts.score ?? 4,
    }),
    updateRole: opts.updateRole ?? jest.fn().mockResolvedValue({}),
  };
  const eventEmitter = { emit: jest.fn() };
  const service = new ContributorApplicationService(
    (opts.model ?? {}) as unknown as Model<ContributorApplicationDocument>,
    userService as unknown as UserService,
    {} as PaginationService,
    eventEmitter as unknown as EventEmitter2,
  );
  return { service, userService, eventEmitter };
}

const pendingDoc = {
  _id: applicationId,
  applicant: applicantId,
  status: ApplicationStatus.APPROVED,
};

describe('ContributorApplicationService#apply', () => {
  it('creates an application snapshotting the current score', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ toObject: () => ({ _id: applicationId }) });
    const { service } = build({ score: 7, model: { create } });

    await service.apply(applicantId.toString(), { reason });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ reason, scoreAtApplication: 7 }),
    );
  });

  it.each([Roles.CONTRIBUTOR, Roles.ADMIN])(
    'rejects an applicant who is already %s',
    async (role) => {
      const create = jest.fn();
      const { service } = build({ role, model: { create } });

      await expect(
        service.apply(applicantId.toString(), { reason }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('maps the unique open-application index violation to 409', async () => {
    const create = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));
    const { service } = build({ model: { create } });

    await expect(
      service.apply(applicantId.toString(), { reason }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows unexpected errors instead of masking them as a conflict', async () => {
    const create = jest.fn().mockRejectedValue(new Error('mongo down'));
    const { service } = build({ model: { create } });

    await expect(
      service.apply(applicantId.toString(), { reason }),
    ).rejects.toThrow('mongo down');
  });
});

describe('ContributorApplicationService#getMine', () => {
  it('reports eligibility from the score threshold without gating applying', async () => {
    const { service } = build({
      score: 12,
      model: { findOne: jest.fn().mockReturnValue(leanChain(null)) },
    });

    const mine = await service.getMine(applicantId.toString());

    expect(mine).toMatchObject({
      application: null,
      score: 12,
      threshold: 10,
      eligible: true,
      canApply: true,
    });
  });

  it('an under-threshold student can still apply', async () => {
    const { service } = build({
      score: 0,
      model: { findOne: jest.fn().mockReturnValue(leanChain(null)) },
    });

    const mine = await service.getMine(applicantId.toString());

    expect(mine.eligible).toBe(false);
    expect(mine.canApply).toBe(true);
  });

  it('a contributor cannot apply', async () => {
    const { service } = build({
      role: Roles.CONTRIBUTOR,
      model: { findOne: jest.fn().mockReturnValue(leanChain(null)) },
    });

    expect((await service.getMine(applicantId.toString())).canApply).toBe(
      false,
    );
  });
});

describe('ContributorApplicationService#approve', () => {
  it('claims the pending application atomically, promotes the applicant, then emits', async () => {
    const findOneAndUpdate = jest.fn().mockReturnValue(leanChain(pendingDoc));
    const { service, userService, eventEmitter } = build({
      model: { findOneAndUpdate },
    });

    await service.approve(applicationId.toString(), adminId);

    const [filter] = findOneAndUpdate.mock.calls[0] as [
      { status: ApplicationStatus },
    ];
    expect(filter.status).toBe(ApplicationStatus.PENDING);
    expect(userService.updateRole).toHaveBeenCalledWith(
      applicantId.toString(),
      Roles.CONTRIBUTOR,
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'contributor_application.approved',
      {
        applicantId: applicantId.toString(),
        applicationId: applicationId.toString(),
      },
    );
  });

  it('404s without side effects when already reviewed (double click / second admin)', async () => {
    const { service, userService, eventEmitter } = build({
      model: { findOneAndUpdate: jest.fn().mockReturnValue(leanChain(null)) },
    });

    await expect(
      service.approve(applicationId.toString(), adminId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userService.updateRole).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('puts the application back to Pending and rethrows when the role update fails', async () => {
    const updateOne = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    const { service, eventEmitter } = build({
      updateRole: jest.fn().mockRejectedValue(new Error('db down')),
      model: {
        findOneAndUpdate: jest.fn().mockReturnValue(leanChain(pendingDoc)),
        updateOne,
      },
    });

    await expect(
      service.approve(applicationId.toString(), adminId),
    ).rejects.toThrow('db down');

    expect(updateOne).toHaveBeenCalledWith(
      { _id: applicationId, status: ApplicationStatus.APPROVED },
      expect.objectContaining({ status: ApplicationStatus.PENDING }),
    );
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});

describe('ContributorApplicationService#reject', () => {
  it('records the reason and emits it for the notification', async () => {
    const findOneAndUpdate = jest
      .fn()
      .mockReturnValue(
        leanChain({ ...pendingDoc, status: ApplicationStatus.REJECTED }),
      );
    const { service, userService, eventEmitter } = build({
      model: { findOneAndUpdate },
    });

    await service.reject(applicationId.toString(), adminId, 'Not enough work');

    const [, update] = findOneAndUpdate.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(update).toMatchObject({
      status: ApplicationStatus.REJECTED,
      rejectionReason: 'Not enough work',
    });
    expect(userService.updateRole).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'contributor_application.rejected',
      {
        applicantId: applicantId.toString(),
        applicationId: applicationId.toString(),
        reason: 'Not enough work',
      },
    );
  });
});
