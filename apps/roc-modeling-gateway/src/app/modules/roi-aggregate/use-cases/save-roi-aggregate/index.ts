import { RoiAggregateInput, SavedRoiAggregate } from '@roc-modeling-gateway-models';
import { IUseCase, Result } from '@vantage-point/ddd-core';

import { RoiAggregateRepoService, roiAggregateRepoService } from '../../repos/roi-aggregate-repo.service';


export class SaveRoiAggregateUseCase implements IUseCase<RoiAggregateInput, Promise<SavedRoiAggregate>>
{

  private constructor
    (
      private repo: RoiAggregateRepoService
    )
  {

  }

  public static create(repo: RoiAggregateRepoService): SaveRoiAggregateUseCase
  {
    return new SaveRoiAggregateUseCase(repo);
  }

  async executeAsync(input: RoiAggregateInput): Promise<SavedRoiAggregate>
  {
    const RoiAggregateOrError: Result<SavedRoiAggregate> = await this.repo.saveRoiAggregate(input);

    // SUCCESS
    if (RoiAggregateOrError.isSuccess)
    {
      return RoiAggregateOrError.getValue();
    }

    // FAILURE
    throw RoiAggregateOrError.getError();
  }

}

export const saveRoiAggregateUseCase: SaveRoiAggregateUseCase = SaveRoiAggregateUseCase.create(roiAggregateRepoService);
