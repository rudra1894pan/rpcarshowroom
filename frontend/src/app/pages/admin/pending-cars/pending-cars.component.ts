import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CarService } from '../../../core/services/car.service';
import { Car, User } from '../../../core/models/models';

@Component({
  selector: 'app-pending-cars',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './pending-cars.component.html',
  styleUrl: '../management.scss',
})
export class PendingCarsComponent implements OnInit {
  cars = signal<Car[]>([]);
  loading = signal(true);

  constructor(public carService: CarService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.carService.getPending().subscribe({
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

  decide(id: string, decision: 'approved' | 'rejected') {
    this.carService.decide(id, decision).subscribe(() => this.load());
  }
}
