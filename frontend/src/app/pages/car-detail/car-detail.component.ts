import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { BookingService } from '../../core/services/booking.service';
import { InsurancePlanService } from '../../core/services/insurance-plan.service';
import { InsuranceRequestService } from '../../core/services/insurance-request.service';
import { ReviewService } from '../../core/services/review.service';
import { BidService } from '../../core/services/bid.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { BidSummary, Car, InsurancePlan, Review, User } from '../../core/models/models';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.scss',
})
export class CarDetailComponent implements OnInit {
  car = signal<Car | null>(null);
  activeImage = signal(0);
  loading = signal(true);

  showBookingModal = signal(false);
  preferredDate = '';
  message = '';
  wantsInsuranceHelp = false;
  insuranceNotes = '';
  bookingError = signal('');
  bookingSuccess = signal(false);

  // Insurance quote flow
  showQuoteModal = signal(false);
  plans = signal<InsurancePlan[]>([]);
  plansLoading = signal(false);
  selectedPlan = signal<InsurancePlan | null>(null);
  quoteNotes = '';
  quoteError = signal('');
  quoteSuccess = signal(false);
  quoteSubmitting = signal(false);

  // Bidding
  bidSummary = signal<BidSummary | null>(null);
  bidAmount: number | null = null;
  bidNote = '';
  bidError = signal('');
  bidSuccess = signal('');
  bidSubmitting = signal(false);

  // Reviews
  reviews = signal<Review[]>([]);
  avgRating = signal(0);
  reviewCount = signal(0);
  reviewsLoading = signal(true);
  newRating = 5;
  newComment = '';
  reviewError = signal('');
  reviewSubmitting = signal(false);

  constructor(
    private route: ActivatedRoute,
    private carService: CarService,
    private bookingService: BookingService,
    private planService: InsurancePlanService,
    private requestService: InsuranceRequestService,
    private reviewService: ReviewService,
    private bidService: BidService,
    public wishlist: WishlistService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.carService.getOne(id).subscribe({
      next: (car) => {
        this.car.set(car);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.loadReviews(id);
    this.loadBids(id);
    if (this.auth.isLoggedIn()) this.wishlist.ensureLoaded();
  }

  loadBids(carId: string) {
    this.bidService.summary(carId).subscribe({ next: (s) => this.bidSummary.set(s) });
  }

  bidsOpen(): boolean {
    const c = this.car();
    const s = this.bidSummary();
    if (!c || !s || !s.biddingEnabled || c.status !== 'available') return false;
    return !s.endsAt || new Date(s.endsAt) > new Date();
  }

  canBid(): boolean {
    const c = this.car();
    const u = this.auth.user();
    if (!c || !u) return false;
    if (u.role === 'admin') return false;
    const sellerId = typeof c.seller === 'object' ? (c.seller as User)._id : c.seller;
    return sellerId !== u._id;
  }

  minNextBid(): number {
    const s = this.bidSummary();
    if (!s) return 0;
    return s.highest > 0 ? s.highest + 1 : s.minBid || 1;
  }

  submitBid() {
    const car = this.car();
    if (!car) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.bidError.set('');
    this.bidSuccess.set('');
    if (!this.bidAmount || this.bidAmount < this.minNextBid()) {
      this.bidError.set(`Enter at least ₹${this.minNextBid().toLocaleString('en-IN')}.`);
      return;
    }
    this.bidSubmitting.set(true);
    this.bidService.place(car._id, this.bidAmount, this.bidNote).subscribe({
      next: () => {
        this.bidSubmitting.set(false);
        this.bidSuccess.set('Your bid was placed. You will be notified if someone outbids you.');
        this.bidAmount = null;
        this.bidNote = '';
        this.loadBids(car._id);
      },
      error: (err) => {
        this.bidSubmitting.set(false);
        this.bidError.set(err.error?.message || 'Could not place bid');
      },
    });
  }

  toggleWishlist() {
    const car = this.car();
    if (!car) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlist.toggle(car._id);
  }

  loadReviews(carId: string) {
    this.reviewsLoading.set(true);
    this.reviewService.getForCar(carId).subscribe({
      next: (res) => {
        this.reviews.set(res.reviews);
        this.avgRating.set(res.avgRating);
        this.reviewCount.set(res.count);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false),
    });
  }

  sellerInfo(): User | null {
    const c = this.car();
    return c && typeof c.seller === 'object' ? (c.seller as User) : null;
  }

  reviewerName(r: Review): string {
    return typeof r.buyer === 'object' ? (r.buyer as User).name : 'Buyer';
  }

  stars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  submitReview() {
    const car = this.car();
    if (!car) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.reviewError.set('');
    this.reviewSubmitting.set(true);
    this.reviewService
      .create({ car: car._id, rating: this.newRating, comment: this.newComment })
      .subscribe({
        next: () => {
          this.reviewSubmitting.set(false);
          this.newComment = '';
          this.newRating = 5;
          this.loadReviews(car._id);
        },
        error: (err) => {
          this.reviewSubmitting.set(false);
          this.reviewError.set(err.error?.message || 'Could not submit review');
        },
      });
  }

  imgUrl(path: string) {
    return this.carService.imageUrl(path);
  }

  insuranceLabel(type: string) {
    return this.carService.insuranceLabel(type);
  }

  planTypeLabel(type: string) {
    return this.planService.planTypeLabel(type);
  }

  premiumFor(plan: InsurancePlan): number {
    const car = this.car();
    if (!car) return 0;
    const base = (car.price * plan.premiumRatePercent) / 100;
    return Math.round(Math.max(base, plan.minPremium) + plan.fixedFee);
  }

  openBooking() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.bookingError.set('');
    this.bookingSuccess.set(false);
    this.showBookingModal.set(true);
  }

  closeBooking() {
    this.showBookingModal.set(false);
  }

  submitBooking() {
    const car = this.car();
    if (!car) return;
    if (!this.preferredDate) {
      this.bookingError.set('Please pick a preferred date and time.');
      return;
    }
    this.bookingService
      .create({
        car: car._id,
        preferredDate: new Date(this.preferredDate).toISOString(),
        message: this.message,
        wantsInsuranceHelp: this.wantsInsuranceHelp,
        insuranceNotes: this.wantsInsuranceHelp ? this.insuranceNotes : undefined,
      })
      .subscribe({
        next: () => {
          this.bookingSuccess.set(true);
          this.preferredDate = '';
          this.message = '';
          this.wantsInsuranceHelp = false;
          this.insuranceNotes = '';
        },
        error: (err) => this.bookingError.set(err.error?.message || 'Booking failed'),
      });
  }

  openQuote() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.quoteError.set('');
    this.quoteSuccess.set(false);
    this.selectedPlan.set(null);
    this.quoteNotes = '';
    this.showQuoteModal.set(true);
    if (this.plans().length === 0) {
      this.plansLoading.set(true);
      this.planService.getPlans().subscribe({
        next: (p) => {
          this.plans.set(p);
          this.plansLoading.set(false);
        },
        error: () => this.plansLoading.set(false),
      });
    }
  }

  closeQuote() {
    this.showQuoteModal.set(false);
  }

  selectPlan(plan: InsurancePlan) {
    this.selectedPlan.set(plan);
  }

  submitQuoteRequest() {
    const car = this.car();
    const plan = this.selectedPlan();
    if (!car || !plan) {
      this.quoteError.set('Please select a plan first.');
      return;
    }
    this.quoteSubmitting.set(true);
    this.requestService
      .create({ car: car._id, plan: plan._id, notes: this.quoteNotes })
      .subscribe({
        next: () => {
          this.quoteSubmitting.set(false);
          this.quoteSuccess.set(true);
        },
        error: (err) => {
          this.quoteSubmitting.set(false);
          this.quoteError.set(err.error?.message || 'Request failed');
        },
      });
  }
}
