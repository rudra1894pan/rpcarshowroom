import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarService } from '../../../core/services/car.service';
import { Car } from '../../../core/models/models';

@Component({
  selector: 'app-manage-cars',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './manage-cars.component.html',
  styleUrl: '../management.scss',
})
export class ManageCarsComponent implements OnInit {
  cars = signal<Car[]>([]);
  loading = signal(true);

  constructor(public carService: CarService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.carService.getAllAdmin().subscribe({
      next: (c) => {
        this.cars.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(id: string) {
    if (!confirm('Delete this listing permanently?')) return;
    this.carService.delete(id).subscribe(() => this.load());
  }

  markSold(car: Car) {
    const fd = new FormData();
    fd.append('status', 'sold');
    this.carService.update(car._id, fd).subscribe(() => this.load());
  }

  toggleActive(car: Car) {
    const fd = new FormData();
    fd.append('isActive', String(!car.isActive));
    this.carService.update(car._id, fd).subscribe(() => this.load());
  }
}
