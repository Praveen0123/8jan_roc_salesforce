import { createReducer, on } from '@ngrx/store';

import { requestLogout } from '../user/actions';
import { clearAll, deleteRoiModel, updateRoiAggregate } from './actions';
import { initialRoiModelStoreState } from './state';


export const reducer = createReducer
  (
    initialRoiModelStoreState,

    on(updateRoiAggregate, (state, { activeRoiDto }) => (
      {
        ...state,
        roiModelDto: activeRoiDto.roiModelDto,
        userModelDto: activeRoiDto.userModelDto
      })),

    on(deleteRoiModel, clearAll, requestLogout, (state) => ({ ...state, roiModelDto: null })),

  );
