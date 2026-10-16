import { Component, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { BidService } from '../../core/services/bid.service';
import { Bid, Car, User } from '../../core/models/models';

interface CarBids {
  car: Car;
  bids: Bid[];
  top: Bid | null;
}

@Component({
  selector: 'app-manage-bids',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './manage-bids.component.html',
  styleUrl: './bids.scss',
})
export class ManageBidsComponent implements OnInit {
  bids = signal<Bid[]>([]);
  loading = signal(true);
  error = signal('');

  groups = computed<CarBids[]>(() => {
    const map = new Map<string, CarBids>();
    for (const b of this.bids()) {
      const g = map.get(b.car._id) || { car: b.car, bids: [], top: null };
      g.bids.push(b);
      map.set(b.car._id, g);
    }
    const out = [...map.values()];
    out.forEach((g) => {
      g.bids.sort((a, b) => b.amount - a.amount);
      g.top = g.bids.find((b) => b.status === 'active') || null;
    });
    return out;
  });

  constructor(private bidService: BidService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.bidService.getReceived().subscribe({
      next: (bids) => {
        this.bids.set(bids);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  bidder(b: Bid): User {
    return b.bidder as User;
  }

  accept(b: Bid) {
    if (!confirm(`Accept ₹${b.amount.toLocaleString('en-IN')} from ${this.bidder(b).name}? The car will be marked SOLD and other bids declined.`)) return;
    this.error.set('');
    this.bidService.accept(b._id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e.error?.message || 'Could not accept bid'),
    });
  }

  reject(b: Bid) {
    this.bidService.reject(b._id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e.error?.message || 'Could not reject bid'),
    });
  }

  invested(car: Car): number {
    const work = (car.reconditioning || []).reduce((s, r) => s + (r.cost || 0), 0);
    return (car.purchasePrice || 0) + work;
  }
}
