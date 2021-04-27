import { SavedRoiAggregate } from '@roc-modeling-gateway-models';
import { IUseCase, Result } from '@vantage-point/ddd-core';

import { RoiAggregateRepoService, roiAggregateRepoService } from '../../repos/roi-aggregate-repo.service';


export interface RoiAggregateParameters
{
  tenantId: string;
  userId: string;
}

export class GetRoiAggregateUseCase implements IUseCase<RoiAggregateParameters, Promise<SavedRoiAggregate>>
{

  private constructor
    (
      private repo: RoiAggregateRepoService
    )
  {

  }

  public static create(repo: RoiAggregateRepoService): GetRoiAggregateUseCase
  {
    return new GetRoiAggregateUseCase(repo);
  }

  async executeAsync(input: RoiAggregateParameters): Promise<SavedRoiAggregate>
  {
    const roiModelListOrError: Result<SavedRoiAggregate> = await this.repo.getRoiAggregate(input.tenantId, input.userId);

    // SUCCESS
    if (roiModelListOrError.isSuccess)
    {
      return roiModelListOrError.getValue();
    }

    // FAILURE
    throw roiModelListOrError.getError();
  }

}

export const getRoiAggregateUseCase: GetRoiAggregateUseCase = GetRoiAggregateUseCase.create(roiAggregateRepoService);
