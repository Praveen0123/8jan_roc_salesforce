import { ModuleContext } from '@graphql-modules/core';
import { SavedRoiAggregate } from '@roc-modeling-gateway-models';

import { GetRoiAggregateUseCase, RoiAggregateParameters } from '../use-cases/get-roi-aggregate';
import { SaveRoiAggregateUseCase } from '../use-cases/save-roi-aggregate';
import { ShareUseCase } from '../use-cases/share';




export default
  {
    Query:
    {
      getRoiAggregate: async (_root: any, args: any, { injector }: ModuleContext): Promise<SavedRoiAggregate> =>
      {
        const roiAggregateParameters: RoiAggregateParameters =
        {
          tenantId: args.tenantId,
          userId: args.userId
        };

        return await injector.get(GetRoiAggregateUseCase).executeAsync(roiAggregateParameters);
      }
    },
    Mutation:
    {
      saveRoiAggregate: async (_root: any, args: any, { injector }: ModuleContext): Promise<SavedRoiAggregate> =>
      {
        return await injector.get(SaveRoiAggregateUseCase).executeAsync(args.roiAggregateInput);
      },
      share: async (_root: any, args: any, { injector }: ModuleContext): Promise<SavedRoiAggregate> =>
      {
        return await injector.get(ShareUseCase).executeAsync(args.shareInput);
      }
    },
  };
