import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Resource,
  ResourceDocument,
} from '../../resource/schemas/resource.schema';
import { populatedId } from '../../../common/utils/populated-id';
import { ReputationTier } from '../../reputation/tiers';
import { CitationContributor } from '../interfaces/retrieved-context.interface';

interface PopulatedUploader {
  _id: unknown;
  name?: string;
  avatar?: string;
  tier?: ReputationTier;
}

/**
 * Resolves the uploader of each cited resource (BACKLOG.md E14) in one
 * batched query — a resource find with the uploader populated, i.e. two
 * round trips total regardless of how many citations there are.
 */
@Injectable()
export class ContributorLookupService {
  private readonly logger = new Logger(ContributorLookupService.name);

  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
  ) {}

  /**
   * Attribution is an enhancement to an answer that is already generated, so
   * a lookup failure is logged with context and degrades to "no contributor"
   * instead of failing the chat response.
   */
  async resolve(
    resourceIds: string[],
  ): Promise<Map<string, CitationContributor>> {
    const result = new Map<string, CitationContributor>();
    if (resourceIds.length === 0) return result;

    try {
      const resources = await this.resourceModel
        .find({ _id: { $in: resourceIds } })
        .select('uploadedBy')
        .populate<{ uploadedBy: PopulatedUploader | null }>({
          path: 'uploadedBy',
          select: 'name avatar tier',
        })
        .lean()
        .exec();

      for (const resource of resources) {
        const uploader = resource.uploadedBy;
        const id = populatedId(uploader);
        if (!uploader || !id) continue;
        result.set(resource._id.toString(), {
          id,
          name: uploader.name ?? '',
          avatar: uploader.avatar,
          tier: uploader.tier ?? ReputationTier.NEWCOMER,
        });
      }
    } catch (err) {
      this.logger.error(
        `Failed to resolve contributors for ${resourceIds.length} cited resource(s)`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return result;
  }
}
