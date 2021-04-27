import { RoiModelDto, UserModelDto } from '@app/domain';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { ROI_MODEL_STORE_FEATURE_KEY, RoiModelStoreState } from './state';


// RETRIEVE SLICE OF STATE
export const roiModelStoreSlice: MemoizedSelector<object, RoiModelStoreState> = createFeatureSelector<RoiModelStoreState>(ROI_MODEL_STORE_FEATURE_KEY);


export const getSelectedRoiModel: MemoizedSelector<object, RoiModelDto> = createSelector
  (
    roiModelStoreSlice,
    (state): RoiModelDto => state.roiModelDto
  );

export const getSelectedUserModel: MemoizedSelector<object, UserModelDto> = createSelector
  (
    roiModelStoreSlice,
    (state): UserModelDto => state.userModelDto
  );

export const getSelectedRoiModelId: MemoizedSelector<object, string> = createSelector
  (
    roiModelStoreSlice,
    (state): string => state.roiModelDto?.roiModelId ?? ''
  );
