import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-apply',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './apply.component.html',
  styleUrl: '../management.scss',
})
export class SellerApplyComponent {
  dealershipName = '';
  error = signal('');
  loading = signal(false);

  constructor(public auth: AuthService) {}

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.auth.applyAsSeller(this.dealershipName || undefined).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Application failed');
      },
    });
  }
}
