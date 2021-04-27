import { Injectable } from '@angular/core';
import { RoiModelDto } from '@app/domain';
import { Institution, TestScores } from '@gql';

import { CompareModel } from './state';


@Injectable({
  providedIn: 'root'
})
export class CompareService
{

  constructor()
  {
  }

  toCompareModel(input: RoiModelDto): CompareModel
  {
    const institutionAddress: string = (input.institution) ? `${input.institution.city}, ${input.institution.stateAbbr}  ${input.institution.zipCode}` : null;

    const compareModel: CompareModel =
    {
      roiModelId: input.roiModelId,
      goalCareerName: input.occupation?.title ?? null,
      goalLocationCity: input.location?.cityName ?? null,
      goalLocationState: input.location?.stateAbbreviation ?? null,
      goalRetirementAge: input.retirementAge,
      goalBeginningAcademicYear: input.startYear,
      goalDegreeName: input.degreeProgram?.cipTitle ?? null,

      institutionName: input.institution?.name ?? null,
      institutionAddress: institutionAddress,
      institutionWebsite: input.institution?.url ?? null,
      institutionType: input.institution?.levelTypeName ?? null,
      institutionGraduationRate: this.getGraduationRate(input),
      institutionUndergraduateStudentCount: input.institution?.studentBody?.totalCount ?? null,

      scoresSATReadingMinimum: this.getMinimumScoresByType(input, 'SAT', 'READING'),
      scoresSATReadingMaximum: this.getMaximumScoresByType(input, 'SAT', 'READING'),
      scoresSATMathMinimum: this.getMinimumScoresByType(input, 'SAT', 'READING'),
      scoresSATMathMaximum: this.getMaximumScoresByType(input, 'SAT', 'READING'),
      scoresACTReadingMinimum: this.getMinimumScoresByType(input, 'ACT', 'READING'),
      scoresACTReadingMaximum: this.getMaximumScoresByType(input, 'ACT', 'READING'),
      scoresACTMathMinimum: this.getMinimumScoresByType(input, 'ACT', 'READING'),
      scoresACTMathMaximum: this.getMaximumScoresByType(input, 'ACT', 'READING'),
      scoresAcceptanceRate: input.institution?.admissionRate ?? null,

      educationNetPrice: this.getNetPrice(input),
      educationFederalLoanAmount: this.getFederalLoanAmount(input),
      educationPrivateLoanAmount: this.getPrivateLoanAmount(input),
      educationOutOfPocketCost: this.getOutOfPocketExpensesAmount(input),
      educationLoanDefaultRate: null,

      earningsAverageSalary: input.occupation?._salaryAnalysis?.medianAnnualSalary ?? null,
      earningsAverageSalaryAlumni: null,
      earningsAverageLivingExpense: null,
      earningsDispoableIncomeMinimum: null,
      earningsDispoableIncomeMaximum: null,
      earningsYearsToBreakEven: null,

      totalReturnMinimumAmount: null,
      totalReturnMaximumAmount: null,
      totalReturnMinimumPercent: null,
      totalReturnMaximumPercent: null
    };

    return compareModel;
  }

  isReadyForCompare(input: RoiModelDto): boolean
  {
    const isGoalReady: boolean = (input.occupation !== null && input.degreeLevel !== null && input.degreeProgram !== null);
    const isInstitutionReady: boolean = (input.institution !== null);

    return isGoalReady && isInstitutionReady;
  }



  private getGraduationRate(roiModelDto: RoiModelDto): number
  {
    // const degreeLevel: EducationLevelEnum = roiModelDto.degreeLevel;
    const institution: Institution = roiModelDto.institution;
    const yearsToComplete: number = roiModelDto.yearsToCompleteDegree;

    var rates: Map<number, Function> = new Map();
    rates.set(0, () => institution?.gr150Default ?? null);
    rates.set(1, () => institution?.gr100 ?? null);
    rates.set(2, () => institution?.gr100 ?? null);
    rates.set(3, () => institution?.gr100 ?? null);
    rates.set(4, () => institution?.gr100 ?? null);
    rates.set(5, () => institution?.gr150Default ?? null);
    rates.set(6, () => institution?.gr150Default ?? null);
    rates.set(7, () => institution?.gr200 ?? null);
    rates.set(8, () => institution?.gr200 ?? null);

    return (rates.get(yearsToComplete) || rates.get(0))();
  }

  private getMinimumScoresByType(roiModelDto: RoiModelDto, type: string, section: string): number
  {
    const institution: Institution = roiModelDto.institution;
    const key: string = `${type.trim().toUpperCase()}_${section.trim().toUpperCase()}`;

    var scores: Map<string, Function> = new Map();
    scores.set('ACT_MATH', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'ACT' && item.section === 'Math')).percentileScore25 ?? null);
    scores.set('ACT_READING', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'ACT' && item.section === 'English')).percentileScore25 ?? null);
    scores.set('SAT_MATH', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'SAT' && item.section === 'Math')).percentileScore25 ?? null);
    scores.set('SAT_READING', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'SAT' && item.section === 'Evidence-Based Reading and Writing')).percentileScore25 ?? null);

    return (scores.get(key) || null)();
  }

  private getMaximumScoresByType(roiModelDto: RoiModelDto, type: string, section: string): number
  {
    const institution: Institution = roiModelDto.institution;
    const key: string = `${type.trim().toUpperCase()}_${section.trim().toUpperCase()}`;

    var scores: Map<string, Function> = new Map();
    scores.set('ACT_MATH', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'ACT' && item.section === 'Math')).percentileScore75 ?? null);
    scores.set('ACT_READING', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'ACT' && item.section === 'English')).percentileScore75 ?? null);
    scores.set('SAT_MATH', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'SAT' && item.section === 'Math')).percentileScore75 ?? null);
    scores.set('SAT_READING', () => institution?.testScoresList?.find((item: TestScores) => (item.type === 'SAT' && item.section === 'Evidence-Based Reading and Writing')).percentileScore75 ?? null);

    return (scores.get(key) || null)();
  }

  private getNetPrice(roiModelDto: RoiModelDto): number
  {
    const institution: Institution = roiModelDto.institution;

    // TODO: take user's residency into consideration
    const netPrice: number = institution?.costOfAttendanceInfo.tuitionAndFees.inState.expenseAmount ?? null;

    return netPrice;
  }

  private getFederalLoanAmount(roiModelDto: RoiModelDto): number
  {
    const amount: number = (roiModelDto.educationFinancing?.federalLoanAmountByYear) ? roiModelDto.educationFinancing.federalLoanAmountByYear.reduce((p, c) => p + c, 0) : null;

    return amount ?? 0;
  }

  private getPrivateLoanAmount(roiModelDto: RoiModelDto): number
  {
    const amount: number = (roiModelDto.educationFinancing?.privateLoanAmountByYear) ? roiModelDto.educationFinancing.privateLoanAmountByYear.reduce((p, c) => p + c, 0) : null;

    return amount ?? 0;
  }

  private getOutOfPocketExpensesAmount(roiModelDto: RoiModelDto): number
  {
    const amount: number = (roiModelDto.educationFinancing?.outOfPocketExpensesByYear) ? roiModelDto.educationFinancing.outOfPocketExpensesByYear.reduce((p, c) => p + c, 0) : null;

    return amount ?? 0;
  }
}
