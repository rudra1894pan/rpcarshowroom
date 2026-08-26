import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, Car, User } from '../../../core/models/models';

@Component({
  selector: 'app-all-bookings',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './all-bookings.component.html',
  styleUrl: '../management.scss',
})
export class AllBookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);

  activeBooking = signal<Booking | null>(null);
  decision: 'confirmed' | 'rejected' = 'confirmed';
  adminNote = '';
  submitting = signal(false);

  constructor(private bookingService: BookingService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bookingService.getAll().subscribe({
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

  openDecision(b: Booking, decision: 'confirmed' | 'rejected') {
    this.activeBooking.set(b);
    this.decision = decision;
    this.adminNote = '';
  }

  closeModal() {
    this.activeBooking.set(null);
  }

  confirmDecision() {
    const b = this.activeBooking();
    if (!b) return;
    this.submitting.set(true);
    this.bookingService.decide(b._id, this.decision, this.adminNote || undefined).subscribe({
      next: () => {
        this.submitting.set(false);
        this.activeBooking.set(null);
        this.load();
      },
      error: () => this.submitting.set(false),
    });
  }
}
