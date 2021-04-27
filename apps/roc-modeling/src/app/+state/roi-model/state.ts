import { RoiModelDto, UserModelDto } from '@app/domain';


export const ROI_MODEL_STORE_FEATURE_KEY = 'roi-model-store';

export interface RoiModelStoreState
{
  roiModelDto: RoiModelDto;
  userModelDto: UserModelDto;
}

export const initialRoiModelStoreState: RoiModelStoreState =
{
  roiModelDto: null,
  userModelDto: null
};
