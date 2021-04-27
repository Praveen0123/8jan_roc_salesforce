import { AggregateRoot, Guard, Result, UniqueEntityID } from '@vantage-point/ddd-core';

import { CareerGoalDto, CurrentInformationDto, DialogDataToKeepModel, EducationCostDto, EducationFinancingDto } from '../dtos';
import { RoiModelMissingError } from '../errors';
import { RoiCalculatorInput, RoiCalculatorOutputModel } from '../models';
import { EducationFinancing, EducationFinancingProps } from './education-financing.model';
import { Model, ModelProps } from './model';
import { RoiAggregateId } from './roi-aggregate-id';
import { RoiModelId } from './roi-model-id';
import { UserModel } from './user-model';


interface RoiAggregateProps
{
  userModel?: UserModel;
  model?: Model;
}


export class RoiAggregate extends AggregateRoot<RoiAggregateProps>
{
  private _roiAggregateId: RoiAggregateId;
  private _activeModelId: RoiModelId;
  private store: Map<string, Model> = new Map();


  get roiAggregateId(): string
  {
    return this._roiAggregateId.id.toString();
  }
  get userModel(): UserModel
  {
    return this.props.userModel;
  }
  get name(): string
  {
    return this.activeModel.name;
  }
  get activeModel(): Model
  {
    const key: string = this._activeModelId.id.toString();

    if (this.store.has(key))
    {
      return this.store.get(key);
    }

    throw RoiModelMissingError.create('ROI AGGREGATE IS MISSING MODEL');
  }
  get roiCalculatorInput(): RoiCalculatorInput
  {
    return this.activeModel.roiCalculatorInput;
  }
  get modelList(): Model[]
  {
    return Array.from(this.store.values());
  }
  get modelCount(): number
  {
    return (this.store) ? this.store.size : 0;
  }


  private constructor(props: RoiAggregateProps, id?: UniqueEntityID)
  {
    super(props, id);

    this._roiAggregateId = RoiAggregateId.create(this._id);
    this.addModelToInternalStore(props.model);
  }

  static create(props: RoiAggregateProps, id?: UniqueEntityID): Result<RoiAggregate>
  {
    const propsResult = Guard.againstNullOrUndefinedBulk([]);

    if (!propsResult.succeeded)
    {
      return Result.failure<RoiAggregate>(propsResult.message || 'roi aggregate properties error');
    }

    const roiAggregate = new RoiAggregate
      (
        {
          ...props
        },
        id
      );

    return Result.success<RoiAggregate>(roiAggregate);
  }

  static get defaultProps(): RoiAggregateProps
  {
    const userModelOrError: Result<UserModel> = UserModel.create(UserModel.defaultProps);
    const modelOrError: Result<Model> = Model.create(Model.defaultProps);

    if (userModelOrError.isSuccess && modelOrError.isSuccess)
    {
      const props: RoiAggregateProps =
      {
        userModel: userModelOrError.getValue(),
        model: modelOrError.getValue()
      };

      return props;
    }

    return {
      userModel: null,
      model: null
    };
  }


  createEmptyRoiModel(name?: string): void
  {
    const modelOrError: Result<Model> = Model.create
      (
        {
          ...Model.defaultProps,
          name: name ?? this.getDefaultModelName()
        }
      );

    if (modelOrError.isSuccess)
    {
      this.addModelToInternalStore(modelOrError.getValue());
    }
    else
    {
      throw modelOrError.getError();
    }
  }
  clone(dialogDataToKeepModel: DialogDataToKeepModel): void
  {
    const defaultProps: ModelProps = Model.defaultProps;

    const cloneOrError: Result<Model> = Model.create
      (
        {
          name: dialogDataToKeepModel.modelName,

          location: (dialogDataToKeepModel.isGoalLocationCloned) ? this.activeModel.location : defaultProps.location,
          occupation: (dialogDataToKeepModel.isGoalOccupationCloned) ? this.activeModel.occupation : defaultProps.occupation,
          degreeLevel: (dialogDataToKeepModel.isGoalDegreeLevelCloned) ? this.activeModel.degreeLevel : defaultProps.degreeLevel,
          degreeProgram: (dialogDataToKeepModel.isGoalDegreeProgramCloned) ? this.activeModel.degreeProgram : defaultProps.degreeProgram,
          retirementAge: (dialogDataToKeepModel.isGoalRetirementAgeCloned) ? this.activeModel.retirementAge : defaultProps.retirementAge,
          careerGoalPathType: this.activeModel.careerGoalPathType,

          institution: (dialogDataToKeepModel.isEducationCostInstitutionCloned) ? this.activeModel.institution : defaultProps.institution,
          startYear: (dialogDataToKeepModel.isEducationCostStartSchoolCloned) ? this.activeModel.startYear : defaultProps.startYear,
          isFulltime: (dialogDataToKeepModel.isEducationCostPartTimeFullTimeCloned) ? this.activeModel.isFulltime : defaultProps.isFulltime,
          yearsToCompleteDegree: (dialogDataToKeepModel.isEducationCostYearsToCompleteCloned) ? this.activeModel.yearsToCompleteDegree : defaultProps.yearsToCompleteDegree,

          residencyType: this.activeModel.residencyType,
          livingConditionTypeEnum: this.activeModel.livingConditionTypeEnum,
          costOfAttendance: this.activeModel.costOfAttendance,
          grantsAndScholarships: this.activeModel.grantsAndScholarships,
          expectedFamilyContribution: this.activeModel.expectedFamilyContribution,

          educationFinancing: this.activeModel.educationFinancing,

          radiusInMiles: this.activeModel.radiusInMiles,
          dateCreated: this.activeModel.dateCreated,

          lastUpdated: new Date()
        },
        null,
        this.props.userModel
      );

    if (cloneOrError.isSuccess)
    {
      this.addModelToInternalStore(cloneOrError.getValue());
    }
  }
  makeActive(key: string): void
  {
    if (this.store.has(key))
    {
      this._activeModelId = RoiModelId.create(key);
    }
    else
    {
      const message: string = `ROI Aggregate Model (${key}) does not exist`;
      throw RoiModelMissingError.create(message);
    }
  }
  deleteRoiModel(roiModelId: RoiModelId): void
  {
    const key: string = roiModelId.id.toString();
    const activeKey: string = this._activeModelId.id.toString();

    if (this.store.has(key))
    {
      this.store.delete(key);

      // IF STORE IS EMPTY, CREATE A NEW ROI MODEL
      if (this.store.size === 0)
      {
        this.createEmptyRoiModel();
      }

      // IF MODEL BEING DELETED IS ACTIVE MODEL, THEN FIND NEW ACTIVE
      else if (key === activeKey)
      {
        const nextModel: Model = this.modelList[0];

        this._activeModelId = nextModel.roiModelId;
      }
    }
  }
  loadModelList(list: Model[]): void
  {
    list.map((item: Model) => this.addModelToInternalStore(item));
  }




  /* #region UPDATE AGGREGATE FROM DATA ENTRY FORMS */

  updateRoiModelName(name: string)
  {
    this.activeModel.updateModelName(name);
  }
  updateCurrentInformation(currentInformationDto: CurrentInformationDto): void
  {
    const updatedUserOrError: Result<UserModel> = UserModel.create
      (
        {
          userId: this.userModel.userId,
          name: this.userModel.name,
          currentAge: (currentInformationDto.currentAge) ? currentInformationDto.currentAge : this.userModel.currentAge,
          occupation: (currentInformationDto.occupation) ? currentInformationDto.occupation : this.userModel.occupation,
          location: (currentInformationDto.location) ? currentInformationDto.location : this.userModel.location,
          educationLevel: (currentInformationDto.educationLevel) ? currentInformationDto.educationLevel : this.userModel.educationLevel,
          incomeRange: this.userModel.incomeRange
        }
      );

    if (updatedUserOrError.isSuccess)
    {
      this.props.userModel = updatedUserOrError.getValue();
    }
    else
    {
      throw updatedUserOrError.getError();
    }
  }
  updateCareerGoal(careerGoalDto: CareerGoalDto): void
  {
    const updatedCareerGoalOrError: Result<Model> = Model.create
      (
        {
          name: this.activeModel.name,

          location: (careerGoalDto.location) ? careerGoalDto.location : this.activeModel.location,
          occupation: (careerGoalDto.occupation) ? careerGoalDto.occupation : this.activeModel.occupation,
          degreeLevel: (careerGoalDto.degreeLevel) ? careerGoalDto.degreeLevel : this.activeModel.degreeLevel,
          degreeProgram: (careerGoalDto.degreeProgram) ? careerGoalDto.degreeProgram : this.activeModel.degreeProgram,
          retirementAge: (careerGoalDto.retirementAge) ? careerGoalDto.retirementAge : this.activeModel.retirementAge,
          careerGoalPathType: (careerGoalDto.careerGoalPathType) ? careerGoalDto.careerGoalPathType : this.activeModel.careerGoalPathType,

          institution: this.activeModel.institution,
          startYear: this.activeModel.startYear,
          isFulltime: this.activeModel.isFulltime,
          yearsToCompleteDegree: this.activeModel.yearsToCompleteDegree,

          residencyType: this.activeModel.residencyType,
          livingConditionTypeEnum: this.activeModel.livingConditionTypeEnum,
          costOfAttendance: this.activeModel.costOfAttendance,
          grantsAndScholarships: this.activeModel.grantsAndScholarships,
          expectedFamilyContribution: this.activeModel.expectedFamilyContribution,

          educationFinancing: this.activeModel.educationFinancing,

          radiusInMiles: this.activeModel.radiusInMiles,
          dateCreated: this.activeModel.dateCreated,

          lastUpdated: new Date()
        },
        this.activeModel.roiModelId,
        this.props.userModel
      );

    if (updatedCareerGoalOrError.isSuccess)
    {
      this.addModelToInternalStore(updatedCareerGoalOrError.getValue());
    }
  }
  updateEducationCost(educationCostDto: EducationCostDto): void
  {
    // UPDATE MODEL
    const updatedEducaionCostOrError: Result<Model> = Model.create
      (
        {
          name: this.activeModel.name,

          location: this.activeModel.location,
          occupation: this.activeModel.occupation,
          degreeLevel: this.activeModel.degreeLevel,
          degreeProgram: this.activeModel.degreeProgram,
          retirementAge: this.activeModel.retirementAge,
          careerGoalPathType: this.activeModel.careerGoalPathType,

          institution: (educationCostDto.institution) ? educationCostDto.institution : this.activeModel.institution,
          startYear: (educationCostDto.startYear) ? educationCostDto.startYear : this.activeModel.startYear,
          isFulltime: (educationCostDto.isFulltime) ? educationCostDto.isFulltime : this.activeModel.isFulltime,
          yearsToCompleteDegree: (educationCostDto.yearsToCompleteDegree) ? educationCostDto.yearsToCompleteDegree : this.activeModel.yearsToCompleteDegree,

          residencyType: this.activeModel.residencyType,
          livingConditionTypeEnum: this.activeModel.livingConditionTypeEnum,
          costOfAttendance: this.activeModel.costOfAttendance,
          grantsAndScholarships: this.activeModel.grantsAndScholarships,
          expectedFamilyContribution: this.activeModel.expectedFamilyContribution,

          educationFinancing: this.activeModel.educationFinancing,

          radiusInMiles: this.activeModel.radiusInMiles,
          dateCreated: this.activeModel.dateCreated,

          lastUpdated: new Date()
        },
        this.activeModel.roiModelId,
        this.props.userModel
      );

    if (updatedEducaionCostOrError.isSuccess)
    {
      this.addModelToInternalStore(updatedEducaionCostOrError.getValue());
    }


    // UPDATE USER MODEL
    const updatedUserOrError: Result<UserModel> = UserModel.create
      (
        {
          userId: this.userModel.userId,
          name: this.userModel.name,
          currentAge: this.userModel.currentAge,
          occupation: this.userModel.occupation,
          location: this.userModel.location,
          educationLevel: this.userModel.educationLevel,
          incomeRange: (educationCostDto.incomeRange) ? educationCostDto.incomeRange : this.userModel.incomeRange
        }
      );

    if (updatedUserOrError.isSuccess)
    {
      this.props.userModel = updatedUserOrError.getValue();
    }
  }
  updateEducationFinancing(educationFinancingDto: EducationFinancingDto): void
  {
    const defaultProps: EducationFinancingProps = EducationFinancing.defaultProps;

    const educationFinancingOrError: Result<EducationFinancing> = EducationFinancing.create
      (
        {
          isTaxDependent: educationFinancingDto.isTaxDependent ?? defaultProps.isTaxDependent,
          prefersIncomeBasedRepayment: educationFinancingDto.prefersIncomeBasedRepayment ?? defaultProps.prefersIncomeBasedRepayment,
          outOfPocketExpensesByYear: educationFinancingDto.outOfPocketExpensesByYear ?? defaultProps.outOfPocketExpensesByYear,
          federalSubsidizedLoanAmountByYear: educationFinancingDto.federalSubsidizedLoanAmountByYear ?? defaultProps.federalSubsidizedLoanAmountByYear,
          federalUnsubsidizedLoanAmountByYear: educationFinancingDto.federalUnsubsidizedLoanAmountByYear ?? defaultProps.federalUnsubsidizedLoanAmountByYear,
          federalLoanAmountByYear: educationFinancingDto.federalLoanAmountByYear ?? defaultProps.federalLoanAmountByYear,
          privateLoanAmountByYear: educationFinancingDto.privateLoanAmountByYear ?? defaultProps.privateLoanAmountByYear,
          pellGrantAidByYear: educationFinancingDto.pellGrantAidByYear ?? defaultProps.pellGrantAidByYear,
          yearsToPayOffFederalLoan: educationFinancingDto.yearsToPayOffFederalLoan ?? defaultProps.yearsToPayOffFederalLoan,
          yearsToPayOffPrivateLoan: educationFinancingDto.yearsToPayOffPrivateLoan ?? defaultProps.yearsToPayOffPrivateLoan
        }
      );

    if (educationFinancingOrError.isSuccess)
    {
      // UPDATE MODEL
      const updatedEducationFinancingOrError: Result<Model> = Model.create
        (
          {
            name: this.activeModel.name,

            location: this.activeModel.location,
            occupation: this.activeModel.occupation,
            degreeLevel: this.activeModel.degreeLevel,
            degreeProgram: this.activeModel.degreeProgram,
            retirementAge: this.activeModel.retirementAge,
            careerGoalPathType: this.activeModel.careerGoalPathType,

            institution: this.activeModel.institution,
            startYear: this.activeModel.startYear,
            isFulltime: this.activeModel.isFulltime,
            yearsToCompleteDegree: this.activeModel.yearsToCompleteDegree,

            residencyType: this.activeModel.residencyType,
            livingConditionTypeEnum: this.activeModel.livingConditionTypeEnum,
            costOfAttendance: this.activeModel.costOfAttendance,
            grantsAndScholarships: this.activeModel.grantsAndScholarships,
            expectedFamilyContribution: this.activeModel.expectedFamilyContribution,

            educationFinancing: educationFinancingOrError.getValue(),

            radiusInMiles: this.activeModel.radiusInMiles,
            dateCreated: this.activeModel.dateCreated,

            lastUpdated: new Date()
          },
          this.activeModel.roiModelId,
          this.props.userModel
        );

      if (updatedEducationFinancingOrError.isSuccess)
      {
        this.addModelToInternalStore(updatedEducationFinancingOrError.getValue());
      }
    }
  }

  /* #endregion */





  isCurrentInformationValid(): boolean
  {
    const hasLocation: boolean = (this.props.userModel.location !== null && this.props.userModel.location !== undefined);
    const hasEducationLevelEnum: boolean = (this.props.userModel.educationLevel !== null && this.props.userModel.educationLevel !== undefined);

    return (hasLocation && hasEducationLevelEnum);
  }
  isCareerGoalValid(): boolean
  {
    const hasOccupation: boolean = (this.activeModel.occupation !== null && this.activeModel.occupation !== undefined);
    const hasDegreeLevel: boolean = (this.activeModel.degreeLevel !== null && this.activeModel.degreeLevel !== undefined);
    const hasDegreeProgram: boolean = (this.activeModel.degreeProgram !== null && this.activeModel.degreeProgram !== undefined);

    return (hasOccupation && hasDegreeLevel && hasDegreeProgram);
  }
  isEducationCostValid(): boolean
  {
    const hasInstitution: boolean = this.activeModel.institution !== null && this.activeModel.institution !== undefined;
    const hasStartYear: boolean = this.activeModel.startYear !== null && this.activeModel.startYear !== undefined;
    const hasIncomeRange: boolean = this.props.userModel.incomeRange !== null && this.props.userModel.incomeRange !== undefined;

    return hasInstitution && hasStartYear && hasIncomeRange;
  }




  /* #region  INPUT/OUTPUT */

  calculateRoiCalculatorInput(): Promise<boolean>
  {
    return this.activeModel.calculateRoiCalculatorInput(this.props.userModel).then((shouldCalculatorRun: boolean) =>
    {
      if (!this.isCurrentInformationValid())
      {
        return false;
      }

      return shouldCalculatorRun;
    });
  }
  updateRoiCalculatorOutput(roiCalculatorOutput: RoiCalculatorOutputModel): void
  {
    this.activeModel.updateRoiCalculatorOutput(roiCalculatorOutput);
  }

  /* #endregion */



  toJSON = () =>
  {
    return {
      roiAggregateId: this._roiAggregateId.id.toValue(),
      activeRoiModelId: this._activeModelId.id.toValue(),
      userModel: this.userModel,
      roiModelList: this.modelList
    };
  };




  private addModelToInternalStore(model: Model): void
  {
    if (model)
    {
      const key: string = model.roiModelId.id.toString();

      this._activeModelId = model.roiModelId;
      this.store.set(key, model);
    }
  }

  private getDefaultModelName(): string
  {
    const defaultRoiModelCount: number = this.getCountOfDefaultModels();
    return `${Model.defaultProps.name} ${defaultRoiModelCount + 1}`;
  }

  private getCountOfDefaultModels(): number
  {
    let maxNumber: number = 0;

    for (let roiModel of this.store.values())
    {
      if (roiModel.name.startsWith(Model.defaultProps.name))
      {
        const ordinalFromName: string = roiModel.name.replace(Model.defaultProps.name, '').trim();
        const ordinal: number = (ordinalFromName.length === 0) ? 0 : parseInt(ordinalFromName);

        maxNumber = (ordinal > maxNumber) ? ordinal : maxNumber;
      }
    }

    return maxNumber;
  }

}
