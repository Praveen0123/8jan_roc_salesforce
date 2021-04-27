import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UserFacadeService } from '@app/+state/user';
import { NavigationService } from '@app/core/services';

@Component({
  selector: 'roc-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit
{

  constructor
    (
      private userFacadeService: UserFacadeService,
      private navigationService: NavigationService
    ) { }

  ngOnInit(): void
  {
  }

  onLogout()
  {
    this.userFacadeService.requestLogout();
  }

  onAbout()
  {
    this.navigationService.goToAboutPage();
  }

}
