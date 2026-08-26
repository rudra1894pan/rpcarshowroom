import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, Car, User } from '../../../core/models/models';

@Component({
  selector: 'app-seller-bookings',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './seller-bookings.component.html',
  styleUrl: '../management.scss',
})
export class SellerBookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);

  constructor(private bookingService: BookingService) {}

  ngOnInit() {
    this.bookingService.getSellerBookings().subscribe({
      next: (b) => {
        this.bookings.set(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asCar(b: Booking): Car {
    return b.car as Car;
  }
  asBuyer(b: Booking): User {
    return b.buyer as User;
  }
}
