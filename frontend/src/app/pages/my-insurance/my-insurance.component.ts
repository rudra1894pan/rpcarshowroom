import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InsuranceRequestService } from '../../core/services/insurance-request.service';
import { InsurancePlanService } from '../../core/services/insurance-plan.service';
import { CarService } from '../../core/services/car.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { Car, InsurancePlan, InsuranceRequest } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-insurance',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './my-insurance.component.html',
  styleUrl: './my-insurance.component.scss',
})
export class MyInsuranceComponent implements OnInit {
  requests = signal<InsuranceRequest[]>([]);
  loading = signal(true);
  assetUrl = environment.assetUrl;
  payingId = signal<string | null>(null);
  payError = signal('');

  constructor(
    private requestService: InsuranceRequestService,
    public planService: InsurancePlanService,
    public carService: CarService,
    private paymentService: PaymentService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.requestService.getMine().subscribe({
      next: (r) => {
        this.requests.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asCar(r: InsuranceRequest): Car {
    return r.car as Car;
  }
  asPlan(r: InsuranceRequest): InsurancePlan {
    return r.plan as InsurancePlan;
  }

  cancel(id: string) {
    if (!confirm('Cancel this insurance request?')) return;
    this.requestService.cancel(id).subscribe(() => {
      this.requests.set(
        this.requests().map((r) => (r._id === id ? { ...r, status: 'cancelled' as const } : r))
      );
    });
  }

  async payPremium(r: InsuranceRequest) {
    const user = this.auth.user();
    if (!user) return;
    this.payError.set('');
    this.payingId.set(r._id);
    try {
      await this.paymentService.pay('insurance', r._id, user);
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
