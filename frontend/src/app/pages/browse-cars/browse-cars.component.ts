import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { Car, CarFilters } from '../../core/models/models';

@Component({
  selector: 'app-browse-cars',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './browse-cars.component.html',
  styleUrl: './browse-cars.component.scss',
})
export class BrowseCarsComponent implements OnInit {
  cars = signal<Car[]>([]);
  loading = signal(true);
  showFilters = signal(false);

  filters: CarFilters = {};

  constructor(
    public carService: CarService,
    public wishlist: WishlistService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.search();
    if (this.auth.isLoggedIn()) this.wishlist.ensureLoaded();
  }

  search() {
    this.loading.set(true);
    this.carService.getCars(this.filters).subscribe({
      next: (cars) => {
        this.cars.set(cars);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() {
    this.filters = {};
    this.search();
  }

  toggleWishlist(event: Event, carId: string) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlist.toggle(carId);
  }
}
