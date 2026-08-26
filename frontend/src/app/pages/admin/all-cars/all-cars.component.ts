import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CarService } from '../../../core/services/car.service';
import { Car, User } from '../../../core/models/models';

@Component({
  selector: 'app-all-cars',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './all-cars.component.html',
  styleUrl: '../../seller/management.scss',
})
export class AllCarsComponent implements OnInit {
  cars = signal<Car[]>([]);
  loading = signal(true);

  constructor(public carService: CarService) {}

  ngOnInit() {
    this.carService.getAllAdmin().subscribe({
      next: (c) => {
        this.cars.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asSeller(car: Car): User {
    return car.seller as User;
  }
}
