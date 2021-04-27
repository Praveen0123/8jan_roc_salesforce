import { CareerGoalPathEnum, EducationLevelEnum, IncomeRangeEnum, LivingConditionTypeEnum, ResidencyTypeEnum } from '@app/core/models';
import { Institution, InstructionalProgram, Location, Occupation } from '@gql';

import { CostOfAttendance, GrantsAndScholarships } from '../domain/model';
import { RoiCalculatorInput, RoiCalculatorOutputModel } from '../models';


export interface RoiModelToSaveDto
{
  roiAggregateId: string;
  activeModelId: string;
  userModelDto: UserModelDto;
  roiModelList: RoiModelDto[];
}

export interface RoiModelDto
{
  roiModelId?: string;
  roiAggregateId: string;
  name: string;

  location: Location;
  occupation: Occupation;
  degreeLevel: EducationLevelEnum;
  degreeProgram: InstructionalProgram;
  retirementAge: number;
  careerGoalPathType: CareerGoalPathEnum;

  institution: Institution;
  startYear: number;
  isFulltime: boolean;
  yearsToCompleteDegree: number;

  residencyType: ResidencyTypeEnum;
  livingConditionTypeEnum: LivingConditionTypeEnum;
  costOfAttendance: CostOfAttendance;
  grantsAndScholarships: GrantsAndScholarships;
  expectedFamilyContribution: number;

  educationFinancing: EducationFinancingDto;

  radiusInMiles: number;
  dateCreated: Date;
  lastUpdated: Date;

  roiCalculatorInput: RoiCalculatorInput;
  roiCalculatorInputHash: string;
  roiCalculatorOutput: RoiCalculatorOutputModel;

  costOfAttendanceByYear: number[];
  grantOrScholarshipAidExcludingPellGrant: number;
  efc: number;
  netPriceByYear: number[];
  federalSubsidizedLoanLimitByYear: number[];
  federalUnsubsidizedLoanLimitByYear: number[];
  outOfPocketExpensesByYear: number[];
  isReadyForCompare: boolean;
}

export interface UserModelDto
{
  userId: string;
  name: string;
  currentAge: number;
  occupation?: Occupation;
  location: Location;
  educationLevel: EducationLevelEnum;
  incomeRange: IncomeRangeEnum;
}

export interface ActiveRoiDto
{
  roiModelDto: RoiModelDto;
  userModelDto: UserModelDto;
}





/* #region  DATA ENTRY FORMS */

export interface CurrentInformationDto
{
  currentAge: number;
  occupation?: Occupation;
  location: Location;
  educationLevel: EducationLevelEnum;
}
export interface CareerGoalDto
{
  location: Location;
  occupation: Occupation;
  degreeLevel: EducationLevelEnum;
  degreeProgram: InstructionalProgram;
  retirementAge: number;
  careerGoalPathType: CareerGoalPathEnum;
}
export interface EducationCostDto
{
  institution: Institution;
  startYear: number;
  incomeRange: IncomeRangeEnum;
  isFulltime: boolean;
  yearsToCompleteDegree: number;
}


export interface EducationCostRefinementDto
{
  residencyType: ResidencyTypeEnum;
  livingConditionTypeEnum: LivingConditionTypeEnum;
  costOfAttendance: CostOfAttendanceDto;
  grantsAndScholarships: GrantsAndScholarshipsDto;
  expectedFamilyContribution: number;
}
export interface CostOfAttendanceDto
{
  tuitionAndFees: number;
  booksAndSupplies: number;
  roomAndBoard: number;
  otherExpenses: number;
}
export interface GrantsAndScholarshipsDto
{
  federalPellGrant: number;
  otherFederalGrants: number;
  stateOrLocalGrants: number;
  institutionalGrants: number;
  otherGrants: number;
  giBillBenefits: number;
  dodTuitionAssistance: number;
}

export interface EducationFinancingDto
{
  isTaxDependent: boolean;
  prefersIncomeBasedRepayment: boolean;
  outOfPocketExpensesByYear: number[];
  federalSubsidizedLoanAmountByYear: number[];
  federalUnsubsidizedLoanAmountByYear: number[];
  federalLoanAmountByYear: number[];
  privateLoanAmountByYear: number[];
  pellGrantAidByYear: number[];
  yearsToPayOffFederalLoan: number;
  yearsToPayOffPrivateLoan: number;
}

/* #endregion */




export interface DialogDataToKeepModel
{
  modelName: string;
  isGoalLocationCloned: boolean;
  isGoalOccupationCloned: boolean;
  isGoalDegreeLevelCloned: boolean;
  isGoalDegreeProgramCloned: boolean;
  isGoalRetirementAgeCloned: boolean;
  isEducationCostInstitutionCloned: boolean;
  isEducationCostStartSchoolCloned: boolean;
  isEducationCostPartTimeFullTimeCloned: boolean;
  isEducationCostYearsToCompleteCloned: boolean;
}
