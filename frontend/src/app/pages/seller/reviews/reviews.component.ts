import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { Car, Review, User } from '../../../core/models/models';

@Component({
  selector: 'app-seller-reviews',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './reviews.component.html',
  styleUrl: '../management.scss',
})
export class SellerReviewsComponent implements OnInit {
  reviews = signal<Review[]>([]);
  loading = signal(true);

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.reviewService.getForSeller().subscribe({
      next: (r) => {
        this.reviews.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asCar(r: Review): Car {
    return r.car as Car;
  }
  asBuyer(r: Review): User {
    return r.buyer as User;
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
