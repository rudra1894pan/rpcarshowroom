import { Routes } from '@angular/router';
import { authGuard, adminGuard, sellerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'browse',
    loadComponent: () =>
      import('./pages/browse-cars/browse-cars.component').then((m) => m.BrowseCarsComponent),
  },
  {
    path: 'cars/:id',
    loadComponent: () =>
      import('./pages/car-detail/car-detail.component').then((m) => m.CarDetailComponent),
  },
  {
    path: 'policies',
    loadComponent: () =>
      import('./pages/policies/policies.component').then((m) => m.PoliciesComponent),
  },
  {
    path: 'my-bookings',
    loadComponent: () =>
      import('./pages/my-bookings/my-bookings.component').then((m) => m.MyBookingsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-insurance',
    loadComponent: () =>
      import('./pages/my-insurance/my-insurance.component').then((m) => m.MyInsuranceComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-bids',
    loadComponent: () => import('./pages/my-bids/my-bids.component').then((m) => m.MyBidsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-wishlist',
    loadComponent: () =>
      import('./pages/my-wishlist/my-wishlist.component').then((m) => m.MyWishlistComponent),
    canActivate: [authGuard],
  },
  {
    path: 'sell',
    loadComponent: () =>
      import('./pages/seller/apply/apply.component').then((m) => m.SellerApplyComponent),
    canActivate: [authGuard],
  },
  {
    path: 'seller',
    canActivate: [sellerGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/seller/dashboard/dashboard.component').then(
            (m) => m.SellerDashboardComponent
          ),
      },
      {
        path: 'add-car',
        loadComponent: () =>
          import('./pages/seller/add-car/add-car.component').then((m) => m.SellerAddCarComponent),
      },
      {
        path: 'listings',
        loadComponent: () =>
          import('./pages/seller/my-listings/my-listings.component').then(
            (m) => m.MyListingsComponent
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/seller/bookings/bookings.component').then(
            (m) => m.SellerBookingsComponent
          ),
      },
      {
        path: 'bids',
        loadComponent: () =>
          import('./pages/bids/manage-bids.component').then((m) => m.ManageBidsComponent),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/seller/reviews/reviews.component').then(
            (m) => m.SellerReviewsComponent
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'pending-sellers',
        loadComponent: () =>
          import('./pages/admin/pending-sellers/pending-sellers.component').then(
            (m) => m.PendingSellersComponent
          ),
      },
      {
        path: 'pending-cars',
        loadComponent: () =>
          import('./pages/admin/pending-cars/pending-cars.component').then(
            (m) => m.PendingCarsComponent
          ),
      },
      {
        path: 'add-car',
        loadComponent: () =>
          import('./pages/admin/add-car/add-car.component').then((m) => m.AdminAddCarComponent),
      },
      {
        path: 'cars',
        loadComponent: () =>
          import('./pages/admin/manage-cars/manage-cars.component').then(
            (m) => m.ManageCarsComponent
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/admin/all-bookings/all-bookings.component').then(
            (m) => m.AllBookingsComponent
          ),
      },
      {
        path: 'bids',
        loadComponent: () =>
          import('./pages/bids/manage-bids.component').then((m) => m.ManageBidsComponent),
      },
      {
        path: 'insurance-plans',
        loadComponent: () =>
          import('./pages/admin/insurance-plans/insurance-plans.component').then(
            (m) => m.InsurancePlansComponent
          ),
      },
      {
        path: 'insurance-requests',
        loadComponent: () =>
          import('./pages/admin/insurance-requests/insurance-requests.component').then(
            (m) => m.InsuranceRequestsComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
