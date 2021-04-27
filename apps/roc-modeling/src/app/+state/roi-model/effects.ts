import { Injectable } from '@angular/core';
import { CareerGoalForm, CurrentInformationForm, EducationCostForm } from '@app/core/models';
import { NotificationService } from '@app/core/services/notification/notification.service';
import { ActiveRoiDto, CareerGoalDto, CurrentInformationDto, EducationCostDto, LifetimeEarningsService, RoiModelService, RoiModelToSaveDto } from '@app/domain';
import { ExchangeAutoCompleteForLocationGQL, ExchangeAutoCompleteForOccupationGQL, GetRoiAggregateGQL, InstitutionByUnitIdGQL, InstructionalProgramGQL, RoiAggregateInput, SaveRoiAggregateGQL } from '@gql';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { AutoCompleteModel } from '@vantage-point/auto-complete-textbox';
import { UseCaseError } from '@vantage-point/ddd-core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { checkRoiModelValidity, determineActiveAccordionPanel } from '../accordion/actions';
import { setError } from '../errors/actions';
import { selectTenant } from '../tenant/selectors';
import { getUserProfile } from '../user/selectors';
import {
  clearAll,
  cloneRoiModel,
  createNewRoiModel,
  deleteRoiModel,
  loadModelFromDatastore,
  NoopAction,
  processCareerGoalForm,
  processCurrentInformationForm,
  processEducationCostForm,
  processEducationFinancingForm,
  requestMakeActive,
  saveModelErrorHappened,
  updateRoiAggregate,
} from './actions';
import { getSelectedRoiModel } from './selectors';


@Injectable()
export class RoiModelStoreEffects
{

  constructor
    (
      private store: Store,
      private actions$: Actions,
      private exchangeAutoCompleteForLocationGQL: ExchangeAutoCompleteForLocationGQL,
      private exchangeAutoCompleteForOccupationGQL: ExchangeAutoCompleteForOccupationGQL,
      private instructionalProgramGQL: InstructionalProgramGQL,
      private institutionByUnitIdGQL: InstitutionByUnitIdGQL,
      private roiModelService: RoiModelService,
      private lifetimeEarningsService: LifetimeEarningsService,
      private saveRoiAggregate: SaveRoiAggregateGQL,
      private getRoiAggregateGQL: GetRoiAggregateGQL,
      private notificationService: NotificationService
    )
  {
  }


  loadModelFromDatastore$ = createEffect(() => this.actions$.pipe
    (
      ofType(loadModelFromDatastore),
      withLatestFrom
        (
          this.store.pipe(select(selectTenant)),
          this.store.pipe(select(getUserProfile))
        ),
      switchMap(([_, tenant, userProfile]) =>
      {
        return this.getRoiAggregateGQL
          .fetch(
            {
              tenantId: tenant.id,
              userId: userProfile.id
            }
          )
          .pipe
          (
            switchMap((results) =>
            {
              if (results.data.getRoiAggregate && results.data.getRoiAggregate.roiAggregate)
              {
                const roiModelToSaveDto: RoiModelToSaveDto = results.data.getRoiAggregate.roiAggregate;

                return this.roiModelService.fromSaveModelToAggregate(roiModelToSaveDto);
              }
              else
              {
                // THIS LOADS DEFAULT ROI AGGREGATE
                return this.roiModelService.getActiveRoiModel();
              }
            })
          );
      }),
      switchMap((activeRoiDto: ActiveRoiDto) =>
        [
          updateRoiAggregate({ activeRoiDto }),
          checkRoiModelValidity(),
          determineActiveAccordionPanel()
        ])
    ));

  createNewRoiModel$ = createEffect(() => this.actions$.pipe
    (
      ofType(createNewRoiModel),
      switchMap(() => this.roiModelService.createEmptyRoiModel(null)),
      switchMap((activeRoiDto) => [updateRoiAggregate({ activeRoiDto }), checkRoiModelValidity()])
    ));


  processCurrentInformationForm$ = createEffect(() => this.actions$.pipe
    (
      ofType(processCurrentInformationForm),
      switchMap((action) =>
      {
        const formData: CurrentInformationForm = action.currentInformationForm;
        const location: AutoCompleteModel = formData?.currentLocation;
        const occupation: AutoCompleteModel = formData?.currentOccupation;

        // console.log('EFFECTS | CAREER GOAL FORM DATA', formData);

        /*
        RETRIEVE LOCATION AND OCCUPATION FROM BACKEND....
        */
        return forkJoin
          (
            {
              location: (location) ? this.exchangeAutoCompleteForLocationGQL.fetch({ autoCompleteModel: location }) : of(null),
              occupation: (occupation) ? this.exchangeAutoCompleteForOccupationGQL.fetch({ autoCompleteModel: occupation }) : of(null)
            }
          )
          .pipe
          (
            switchMap((results) =>
            {
              // console.log('EFFECTS | RESULTS:', results);

              const currentInformation: CurrentInformationDto =
              {
                currentAge: formData.currentAge,
                occupation: (results.occupation) ? results.occupation.data.exchangeAutoCompleteForOccupation : null,
                location: (results.location) ? results.location.data.exchangeAutoCompleteForLocation : null,
                educationLevel: formData.educationLevel
              };

              return this.roiModelService.updateCurrentInformation(currentInformation);
            })
          );
      }),
      switchMap((activeRoiDto: ActiveRoiDto) => [updateRoiAggregate({ activeRoiDto }), checkRoiModelValidity()]),
      catchError((errorMessage) =>
      {
        const useCaseError: UseCaseError =
        {
          message: errorMessage,
          error: null,
          errorType: 'PROCESS CURRENT INFORMATION',
          details: null
        };

        return of(setError({ useCaseError }));
      })
    ));
  processCareerGoalForm$ = createEffect(() => this.actions$.pipe
    (
      ofType(processCareerGoalForm),
      withLatestFrom(this.store.pipe(select(getSelectedRoiModel))),
      switchMap(([action, activeRoiModel]) =>
      {
        const formData: CareerGoalForm = action.careerGoalForm;
        const location: AutoCompleteModel = formData?.location;
        const occupation: AutoCompleteModel = formData?.occupation;
        const cipCode: string = formData?.degreeProgram?.id;

        // console.log('EFFECTS | CAREER GOAL FORM DATA', formData);
        // console.log('EFFECTS | ACTIVE ROI MODEL', activeRoiModel);

        const hasLocationChanged: boolean = (formData.location?.id !== activeRoiModel.location?.zipCode);
        const hasOccupationChanged: boolean = (formData.occupation?.id !== activeRoiModel.occupation?.onetCode);
        const hasProgramChanged: boolean = (formData.degreeProgram?.id !== activeRoiModel.degreeProgram?.cipCode);

        // console.log('EFFECTS | hasLocationChanged', hasLocationChanged);
        // console.log('EFFECTS | hasOccupationChanged', hasOccupationChanged);
        // console.log('EFFECTS | hasProgramChanged', hasProgramChanged);

        /*
        RETRIEVE LOCATION AND OCCUPATION FROM BACKEND....
        */
        return forkJoin
          (
            {
              location: (location && hasLocationChanged) ? this.exchangeAutoCompleteForLocationGQL.fetch({ autoCompleteModel: location }) : of(null),
              occupation: (occupation && hasOccupationChanged) ? this.exchangeAutoCompleteForOccupationGQL.fetch({ autoCompleteModel: occupation }) : of(null),
              program: (cipCode && hasProgramChanged) ? this.instructionalProgramGQL.fetch({ cipCode: cipCode }) : of(null)
            }
          )
          .pipe
          (
            switchMap((results) =>
            {
              // console.log('RESULTS', results);

              const careerGoal: CareerGoalDto =
              {
                location: (results.location) ? results.location.data.exchangeAutoCompleteForLocation : (!hasLocationChanged) ? activeRoiModel.location : null,
                occupation: (results.occupation) ? results.occupation.data.exchangeAutoCompleteForOccupation : (!hasOccupationChanged) ? activeRoiModel.occupation : null,
                degreeLevel: formData.degreeLevel,
                degreeProgram: (results.program) ? results.program.data.instructionalProgram : (!hasProgramChanged) ? activeRoiModel.degreeProgram : null,
                retirementAge: formData.retirementAge,
                careerGoalPathType: formData.careerGoalPathType
              };

              return this.roiModelService.updateCareerGoal(careerGoal);
            })
          );
      }),
      switchMap((activeRoiDto: ActiveRoiDto) => [updateRoiAggregate({ activeRoiDto }), checkRoiModelValidity()]),
      catchError((errorMessage) =>
      {
        const useCaseError: UseCaseError =
        {
          message: errorMessage,
          error: null,
          errorType: 'PROCESS CAREER GOAL',
          details: null
        };

        return of(setError({ useCaseError }));
      })
    ));
  processEducationCostForm$ = createEffect(() => this.actions$.pipe
    (
      ofType(processEducationCostForm),
      switchMap((action) =>
      {
        const formData: EducationCostForm = action.educationCostForm;
        const institutionId: string = formData?.institution?.id;

        /*
        RETRIEVE INSTITUTION FROM BACKEND....
        */
        return forkJoin
          (
            {
              institution: (institutionId) ? this.institutionByUnitIdGQL.fetch({ unitId: institutionId }) : of(null),
            }
          )
          .pipe
          (
            switchMap((results) =>
            {
              const educationCost: EducationCostDto =
              {
                institution: (results.institution) ? results.institution.data.institution : null,
                startYear: formData.startYear,
                incomeRange: formData.incomeRange,
                isFulltime: formData.isFulltime,
                yearsToCompleteDegree: formData.yearsToCompleteDegree
              };

              return this.roiModelService.updateEducationCost(educationCost);
            })
          );
      }),
      switchMap((activeRoiDto: ActiveRoiDto) => [updateRoiAggregate({ activeRoiDto }), checkRoiModelValidity()]),
      catchError((errorMessage) =>
      {
        const useCaseError: UseCaseError =
        {
          message: errorMessage,
          error: null,
          errorType: 'PROCESS EDUCATION COST',
          details: null
        };

        return of(setError({ useCaseError }));
      })
    ));
  processEducationFinancingForm$ = createEffect(() => this.actions$.pipe
    (
      ofType(processEducationFinancingForm),
      switchMap((action) => this.roiModelService.updateEducationFinancing(action.educationFinancingForm)),
      switchMap((activeRoiDto: ActiveRoiDto) => [updateRoiAggregate({ activeRoiDto }), checkRoiModelValidity()]),
      catchError((errorMessage) =>
      {
        const useCaseError: UseCaseError =
        {
          message: errorMessage,
          error: null,
          errorType: 'PROCESS EDUCATION FINANCING',
          details: null
        };

        return of(setError({ useCaseError }));
      })
    ));

  updateRoiAggregate$ = createEffect(() => this.actions$.pipe
    (
      ofType(updateRoiAggregate),
      switchMap(() => this.roiModelService.fromAggregateToSaveModel()),
      withLatestFrom
        (
          this.store.pipe(select(selectTenant)),
          this.store.pipe(select(getUserProfile))
        ),
      switchMap(([roiModelToSaveDto, tenant, userProfile]) =>
      {
        const roiAggregateInput: RoiAggregateInput =
        {
          tenantId: tenant.id,
          userId: userProfile.id,
          roiAggregateId: roiModelToSaveDto.roiAggregateId,
          roiAggregate: JSON.stringify(roiModelToSaveDto)
        };

        return this.saveRoiAggregate
          .mutate({ roiAggregateInput })
          .pipe
          (
            map((_results) =>
            {
              return NoopAction();
            })
          );
      }),
      catchError((errorMessage) =>
      {
        const useCaseError: UseCaseError =
        {
          message: errorMessage,
          error: null,
          errorType: 'SAVE ROI MODEL',
          details: null
        };

        return of(saveModelErrorHappened({ useCaseError }));
      })
    ));



  cloneRoiModel$ = createEffect(() => this.actions$.pipe
    (
      ofType(cloneRoiModel),
      switchMap((action) => this.roiModelService.cloneRoiModel(action.dialogDataToKeepModel)),
      switchMap((activeRoiDto: ActiveRoiDto) =>
        [
          updateRoiAggregate({ activeRoiDto }),
          checkRoiModelValidity(),
          determineActiveAccordionPanel()
        ])
    ));

  deleteRoiModel$ = createEffect(() => this.actions$.pipe
    (
      ofType(deleteRoiModel),
      switchMap((action) => this.roiModelService.deleteRoiModel(action.roiModelDto)),
      switchMap((activeRoiDto: ActiveRoiDto) =>
        [
          updateRoiAggregate({ activeRoiDto }),
          checkRoiModelValidity(),
          determineActiveAccordionPanel()
        ])
    ));

  clearAll$ = createEffect(() => this.actions$.pipe
    (
      ofType(clearAll),
      switchMap(() => this.roiModelService.clear()),
      switchMap((activeRoiDto: ActiveRoiDto) =>
      {
        this.lifetimeEarningsService.clear();

        return [
          updateRoiAggregate({ activeRoiDto }),
          checkRoiModelValidity(),
          determineActiveAccordionPanel()
        ];
      })
    ));

  requestMakeActive$ = createEffect(() => this.actions$.pipe
    (
      ofType(requestMakeActive),
      switchMap((action) => this.roiModelService.makeActive(action.roiModelDto)),
      switchMap((activeRoiDto: ActiveRoiDto) =>
      {
        this.lifetimeEarningsService.loadGraph(activeRoiDto.roiModelDto);

        return [
          updateRoiAggregate({ activeRoiDto }),
          checkRoiModelValidity(),
          determineActiveAccordionPanel()
        ];
      })
    ));



  saveModelErrorHappened$ = createEffect(() => this.actions$.pipe
    (
      ofType(saveModelErrorHappened),
      switchMap((action) => this.notificationService.error(action.useCaseError).afterDismissed())
    ), { dispatch: false });

}
