import { IMapper, Result, UniqueEntityID } from '@vantage-point/ddd-core';

import { EducationFinancing, RoiModelId, UserModel } from '../domain';
import { Model, ModelProps } from '../domain/model';
import { RoiAggregate } from '../domain/roi.aggregate';
import { EducationFinancingDto, RoiModelDto, RoiModelToSaveDto, UserModelDto } from '../dtos';
import { EducationFinancingMapper } from './education-financing.mapper';
import { UserModelMapper } from './user-model.mapper';


export class RoiModelAggregateMapper implements IMapper<RoiAggregate, RoiModelDto>
{

  private constructor()
  {
  }

  public static create(): RoiModelAggregateMapper
  {
    return new RoiModelAggregateMapper();
  }


  toDTO(input: RoiAggregate): RoiModelDto
  {
    return this.toRoiModelDto(input, input.activeModel);
  }

  toSaveDTO(input: RoiAggregate): RoiModelToSaveDto
  {
    const roiModelList: RoiModelDto[] = this.toDTOList(input);
    const userModelDto: UserModelDto = (input.userModel) ? UserModelMapper.create().toDTO(input.userModel) : null;

    const roiModelToSaveDto: RoiModelToSaveDto =
    {
      roiAggregateId: input.roiAggregateId,
      activeModelId: input.activeModel.roiModelId.id.toString(),
      userModelDto: userModelDto,
      roiModelList: roiModelList
    };

    return roiModelToSaveDto;
  }

  toDTOList(input: RoiAggregate): RoiModelDto[]
  {
    const list: RoiModelDto[] = [];

    input.modelList.map((item: Model) =>
    {
      const roiModelDto: RoiModelDto = this.toRoiModelDto(input, item);
      list.push(roiModelDto);
    });

    return list;
  }

  toDomain(input: RoiModelDto): Result<RoiAggregate>
  {
    const modelOrError: Result<Model> = this.toModel(input);

    if (modelOrError.isSuccess)
    {
      const model: Model = modelOrError.getValue();

      return RoiAggregate.create
        (
          {
            model: model
          },
          UniqueEntityID.create(input.roiAggregateId)
        );
    }

    if (modelOrError.isFailure)
    {
      throw modelOrError.getError();
    }
  }

  toDomainFromSavedModel(roiModelToSaveDto: RoiModelToSaveDto): Result<RoiAggregate>
  {
    const userModelOrError: Result<UserModel> = UserModelMapper.create().toDomain(roiModelToSaveDto.userModelDto);

    if (userModelOrError.isSuccess)
    {
      const roiAggregateOrError: Result<RoiAggregate> = RoiAggregate.create
        (
          {
            userModel: userModelOrError.getValue()
          },
          UniqueEntityID.create(roiModelToSaveDto.roiAggregateId)
        );

      if (roiAggregateOrError.isSuccess)
      {
        const roiAggregate: RoiAggregate = roiAggregateOrError.getValue();

        const list: Model[] = [];

        roiModelToSaveDto.roiModelList.map((item: RoiModelDto) =>
        {
          const modelOrError: Result<Model> = this.toModel(item);

          if (modelOrError.isSuccess)
          {
            list.push(modelOrError.getValue());
          }
        });

        roiAggregate.loadModelList(list);

        roiAggregate.makeActive(roiModelToSaveDto.activeModelId);

        return Result.success<RoiAggregate>(roiAggregate);
      }

      throw roiAggregateOrError.getError();
    }

    if (userModelOrError.isFailure)
    {
      throw userModelOrError.getError();
    }
  }


  private toRoiModelDto(input: RoiAggregate, model: Model): RoiModelDto
  {
    const educationFinancing: EducationFinancingDto = (model.educationFinancing) ? EducationFinancingMapper.create().toDTO(model.educationFinancing) : null;
    const loanLimitsInfo = model.getLoanLimitsInfo();

    const roiModelDto: RoiModelDto =
    {
      roiModelId: model.roiModelId.id.toString(),
      roiAggregateId: input.roiAggregateId,
      name: model.name,

      location: model.location,
      occupation: model.occupation,
      degreeLevel: model.degreeLevel,
      degreeProgram: model.degreeProgram,
      retirementAge: model.retirementAge,
      careerGoalPathType: model.careerGoalPathType,

      institution: model.institution,
      startYear: model.startYear,
      isFulltime: model.isFulltime,
      yearsToCompleteDegree: model.yearsToCompleteDegree,

      residencyType: model.residencyType,
      livingConditionTypeEnum: model.livingConditionTypeEnum,
      costOfAttendance: model.costOfAttendance,
      grantsAndScholarships: model.grantsAndScholarships,
      expectedFamilyContribution: model.expectedFamilyContribution,

      educationFinancing: educationFinancing,

      radiusInMiles: model.radiusInMiles,
      dateCreated: model.dateCreated,
      lastUpdated: model.lastUpdated,

      roiCalculatorInput: model.roiCalculatorInput,
      roiCalculatorInputHash: model.hash,
      roiCalculatorOutput: model.roiCalculatorOutput,

      costOfAttendanceByYear: model.getCostOfAttendanceByYear(input.userModel),
      grantOrScholarshipAidExcludingPellGrant: model.getGrantOrScholarshipAidExcludingPellGrant(),
      efc: model.getEfc(input.userModel),
      netPriceByYear: model.getNetPriceByYear(input.userModel),
      federalSubsidizedLoanLimitByYear: loanLimitsInfo.federalSubsidizedLoanByYear,
      federalUnsubsidizedLoanLimitByYear: loanLimitsInfo.federalUnsubsidizedLoanByYear,
      outOfPocketExpensesByYear: model.getOutOfPocketExpensesByYear(input.userModel),

      isReadyForCompare: false
    };

    return roiModelDto;

  }

  private toModel(input: RoiModelDto): Result<Model>
  {
    const defaultProps: ModelProps = Model.defaultProps;
    const educationFinancingOrError: Result<EducationFinancing> = EducationFinancingMapper.create().toDomain(input.educationFinancing);


    const modelOrError: Result<Model> = Model.create
      (
        {
          name: input.name,

          location: input.location ?? defaultProps.location,
          occupation: input.occupation ?? defaultProps.occupation,
          degreeLevel: input.degreeLevel ?? defaultProps.degreeLevel,
          degreeProgram: input.degreeProgram ?? defaultProps.degreeProgram,
          retirementAge: input.retirementAge ?? defaultProps.retirementAge,
          careerGoalPathType: input?.careerGoalPathType ?? defaultProps.careerGoalPathType,

          institution: input.institution ?? defaultProps.institution,
          startYear: input.startYear ?? defaultProps.startYear,
          isFulltime: input.isFulltime ?? defaultProps.isFulltime,
          yearsToCompleteDegree: input.yearsToCompleteDegree ?? defaultProps.yearsToCompleteDegree,

          residencyType: input.residencyType ?? defaultProps.residencyType,
          livingConditionTypeEnum: input.livingConditionTypeEnum ?? defaultProps.livingConditionTypeEnum,
          costOfAttendance: input.costOfAttendance ?? defaultProps.costOfAttendance,
          grantsAndScholarships: input.grantsAndScholarships ?? defaultProps.grantsAndScholarships,
          expectedFamilyContribution: input.expectedFamilyContribution ?? defaultProps.expectedFamilyContribution,

          educationFinancing: educationFinancingOrError.isSuccess ? educationFinancingOrError.getValue() : null,

          radiusInMiles: input.radiusInMiles ?? defaultProps.radiusInMiles,
          dateCreated: input.dateCreated ?? defaultProps.dateCreated,
          lastUpdated: input.lastUpdated ?? defaultProps.lastUpdated
        },
        RoiModelId.create(input.roiModelId)
      );

    return modelOrError;
  }

}
