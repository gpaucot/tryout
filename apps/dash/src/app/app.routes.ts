import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@dash/home-feature-shell').then((m) => m.HOME_ROUTES),
  },
];
