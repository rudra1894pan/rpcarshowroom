import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { CarService } from '../../core/services/car.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking, Car } from '../../core/models/models';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss',
})
export class MyBookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  payingId = signal<string | null>(null);
  payError = signal('');

  constructor(
    private bookingService: BookingService,
    public carService: CarService,
    private paymentService: PaymentService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.bookingService.getMine().subscribe({
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

  async payDeposit(b: Booking) {
    const user = this.auth.user();
    if (!user) return;
    this.payError.set('');
    this.payingId.set(b._id);
    try {
      await this.paymentService.pay('booking', b._id, user);
      this.load();
    } catch (err: any) {
      if (err?.message !== 'Payment cancelled') {
        this.payError.set(err?.error?.message || err?.message || 'Payment failed');
      }
    } finally {
      this.payingId.set(null);
    }
  }
}
