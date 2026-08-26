import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CarService } from '../../core/services/car.service';
import { WishlistItem } from '../../core/models/models';

@Component({
  selector: 'app-my-wishlist',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './my-wishlist.component.html',
  styleUrl: './my-wishlist.component.scss',
})
export class MyWishlistComponent implements OnInit {
  items = signal<WishlistItem[]>([]);
  loading = signal(true);

  constructor(public wishlist: WishlistService, public carService: CarService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.wishlist.getMine().subscribe({
      next: (items) => {
        this.items.set(items.filter((i) => i.car));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(carId: string) {
    this.wishlist.remove(carId);
    this.items.set(this.items().filter((i) => i.car._id !== carId));
  }
}
