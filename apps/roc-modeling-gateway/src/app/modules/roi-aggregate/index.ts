import 'graphql-import-node';

import { GraphQLModule } from '@graphql-modules/core';

import RoiAggregateProvider from './providers/providers';
import resolvers from './resolvers/resolvers';
import * as typeDefs from './schema/schema.graphql';
import { GetRoiAggregateUseCase, getRoiAggregateUseCase } from './use-cases/get-roi-aggregate';
import { SaveRoiAggregateUseCase, saveRoiAggregateUseCase } from './use-cases/save-roi-aggregate';
import { ShareUseCase, shareUseCase } from './use-cases/share';

export const RoiAggregateModule = new GraphQLModule
  (
    {
      name: 'RoiAggregate',
      typeDefs,
      resolvers,
      providers:
        [
          RoiAggregateProvider,
          {
            provide: GetRoiAggregateUseCase,
            useFactory: () => getRoiAggregateUseCase
          },
          {
            provide: SaveRoiAggregateUseCase,
            useFactory: () => saveRoiAggregateUseCase
          },
          {
            provide: ShareUseCase,
            useFactory: () => shareUseCase
          }
        ]
    }
  );
