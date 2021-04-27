import { SavedRoiAggregate, ShareInput, UserProfile } from '@roc-modeling-gateway-models';
import { IUseCase, Result } from '@vantage-point/ddd-core';

import { Auth0UserRepoService, auth0UserRepoService } from '../../../user-profile/repos/auth0-repo.service';
import { RoiAggregateRepoService, roiAggregateRepoService } from '../../repos/roi-aggregate-repo.service';


export class ShareUseCase implements IUseCase<ShareInput, Promise<SavedRoiAggregate>>
{

  private constructor
    (
      private repo: RoiAggregateRepoService,
      private userRepo: Auth0UserRepoService
    )
  {
  }


  public static create(repo: RoiAggregateRepoService, userRepo: Auth0UserRepoService): ShareUseCase
  {
    return new ShareUseCase(repo, userRepo);
  }

  async executeAsync(input: ShareInput): Promise<SavedRoiAggregate>
  {
    const userProfileOrError: Result<UserProfile> = await this.userRepo.getOrCreateUserForSharingModel(input);

    // SUCCESS
    if (userProfileOrError.isSuccess)
    {
      const userProfile: UserProfile = userProfileOrError.getValue();
      const roiAggregateOrError: Result<SavedRoiAggregate> = await this.repo.saveShare(input, userProfile);

      if (roiAggregateOrError.isSuccess)
      {
        return roiAggregateOrError.getValue();
      }

      // FAILURE
      throw roiAggregateOrError.getError();
    }

    // FAILURE
    throw userProfileOrError.getError();
  }
}

export const shareUseCase: ShareUseCase = ShareUseCase.create(roiAggregateRepoService, auth0UserRepoService);
