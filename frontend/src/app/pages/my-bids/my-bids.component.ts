import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BidService } from '../../core/services/bid.service';
import { CarService } from '../../core/services/car.service';
import { Bid } from '../../core/models/models';

@Component({
  selector: 'app-my-bids',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './my-bids.component.html',
  styleUrl: '../bids/bids.scss',
})
export class MyBidsComponent implements OnInit {
  bids = signal<Bid[]>([]);
  loading = signal(true);

  constructor(private bidService: BidService, public carService: CarService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.bidService.getMine().subscribe({
      next: (b) => {
        this.bids.set(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  label(b: Bid): string {
    if (b.status === 'active') return b.highest === b.amount ? 'leading' : 'outbid';
    return b.status;
  }

  withdraw(b: Bid) {
    if (!confirm('Withdraw this bid?')) return;
    this.bidService.withdraw(b._id).subscribe(() => this.load());
  }
}
