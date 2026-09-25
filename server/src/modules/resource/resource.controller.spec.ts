import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { ResourceQueryDto } from './dto/resource-query.dto';
import { ApprovalStatus } from './enums/approval-status.enum';
import { Roles } from '../user/enums/user-role.enum';

describe('ResourceController', () => {
  const build = () => {
    const findAll = jest.fn().mockResolvedValue({ data: [] });
    const controller = new ResourceController({
      findAll,
    } as unknown as ResourceService);
    return { controller, findAll };
  };
  const user = (id: string, role: Roles) => ({
    user: { id, role, isOnboarded: true },
  });
  const pending = () =>
    Object.assign(new ResourceQueryDto(), { status: ApprovalStatus.PENDING });

  it('should be defined', () => {
    expect(build().controller).toBeDefined();
  });

  describe('getResourcesByUser — unapproved uploads are private', () => {
    it("forces APPROVED when a student asks for someone else's pending uploads", async () => {
      const { controller, findAll } = build();
      await controller.getResourcesByUser(
        pending(),
        'uploader',
        user('other', Roles.STUDENT),
      );
      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: 'uploader',
          status: ApprovalStatus.APPROVED,
        }),
      );
    });

    it('lets the uploader see their own pending uploads', async () => {
      const { controller, findAll } = build();
      await controller.getResourcesByUser(
        pending(),
        'uploader',
        user('uploader', Roles.CONTRIBUTOR),
      );
      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: ApprovalStatus.PENDING }),
      );
    });

    it('lets an admin see any pending uploads', async () => {
      const { controller, findAll } = build();
      await controller.getResourcesByUser(
        pending(),
        'uploader',
        user('admin', Roles.ADMIN),
      );
      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: ApprovalStatus.PENDING }),
      );
    });
  });
});
