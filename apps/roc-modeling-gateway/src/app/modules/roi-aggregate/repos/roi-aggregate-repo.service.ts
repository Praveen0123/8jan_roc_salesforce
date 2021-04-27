import { RoiAggregateInput, SavedRoiAggregate, ShareInput, UserProfile } from '@roc-modeling-gateway-models';
import { Result } from '@vantage-point/ddd-core';
import { QueryResult } from 'pg';

import { BaseRepository } from '../../../core/base-repository';
import { RoiModelError } from '../errors';
import { RoiModelMapper } from '../mappers';

export class RoiAggregateRepoService extends BaseRepository
{

  private constructor()
  {
    super();
  }

  static create(): RoiAggregateRepoService
  {
    return new RoiAggregateRepoService();
  }

  async getRoiAggregate(tenantId: string, userId: string): Promise<Result<SavedRoiAggregate>>
  {
    try
    {
      const queryName: string = 'GetAggregate';
      const query = `SELECT "public"."${queryName}"($1, $2)`;
      const queryResult: QueryResult<SavedRoiAggregate> = await this.query<SavedRoiAggregate>(query, [tenantId, userId]);
      const roiAggregate: SavedRoiAggregate = RoiModelMapper.toRoiModel<SavedRoiAggregate>(queryResult, queryName);

      return Result.success<SavedRoiAggregate>(roiAggregate);
    }
    catch (error)
    {
      const message = `ERROR | ${error.message}`;
      const roiModelError: RoiModelError = new RoiModelError(message);

      return Result.failure<SavedRoiAggregate>(roiModelError);
    }
  }

  async saveRoiAggregate(roiAggregateInput: RoiAggregateInput): Promise<Result<SavedRoiAggregate>>
  {
    try
    {
      const queryName: string = 'SaveAggregate';
      const query = `SELECT "public"."${queryName}"($1, $2, $3, $4)`;
      const params =
        [
          roiAggregateInput.tenantId,
          roiAggregateInput.userId,
          roiAggregateInput.roiAggregateId,
          JSON.parse(roiAggregateInput.roiAggregate)
        ];

      const queryResult: QueryResult<SavedRoiAggregate> = await this.query<SavedRoiAggregate>(query, params);
      const roiAggregate: SavedRoiAggregate = RoiModelMapper.toRoiModel<SavedRoiAggregate>(queryResult, queryName);

      return Result.success<SavedRoiAggregate>(roiAggregate);
    }
    catch (error)
    {
      const message = `ERROR | ${error.message}`;
      const roiModelError: RoiModelError = new RoiModelError(message);

      return Result.failure<SavedRoiAggregate>(roiModelError);
    }
  }

  async saveShare(shareInput: ShareInput, userProfile: UserProfile): Promise<Result<SavedRoiAggregate>>
  {
    try
    {
      const queryName: string = 'SaveShare';
      const query = `SELECT "public"."${queryName}"($1, $2, $3)`;
      const params =
        [
          shareInput.tenantId,
          shareInput.sharedFromUserId,
          userProfile.id
        ];

      const queryResult: QueryResult<SavedRoiAggregate> = await this.query<SavedRoiAggregate>(query, params);
      const roiAggregate: SavedRoiAggregate = RoiModelMapper.toRoiModel<SavedRoiAggregate>(queryResult, queryName);

      return Result.success<SavedRoiAggregate>(roiAggregate);
    }
    catch (error)
    {
      const message = `ERROR | ${error.message}`;
      const roiModelError: RoiModelError = new RoiModelError(message);

      return Result.failure<SavedRoiAggregate>(roiModelError);
    }
  }

}


export const roiAggregateRepoService: RoiAggregateRepoService = RoiAggregateRepoService.create();
