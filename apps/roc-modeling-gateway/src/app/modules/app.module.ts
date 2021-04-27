import { GraphQLModule } from '@graphql-modules/core';

import { RoiAggregateModule } from './roi-aggregate';
import { TenantModule } from './tenant';
import { UserProfileModule } from './user-profile';


export const RocGatewayModule: GraphQLModule = new GraphQLModule
  (
    {
      imports: () =>
        [
          RoiAggregateModule,
          TenantModule,
          UserProfileModule
        ]
    }
  );
