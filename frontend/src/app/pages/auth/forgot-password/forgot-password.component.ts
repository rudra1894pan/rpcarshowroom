import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../auth.scss',
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  submitted = signal(false);
  responseMessage = signal('');

  constructor(private auth: AuthService) {}

  submit() {
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.submitted.set(true);
        this.responseMessage.set(res.message);
      },
      error: () => {
        // Same generic message even on error, to avoid leaking whether the email exists.
        this.loading.set(false);
        this.submitted.set(true);
        this.responseMessage.set('If an account exists for that email, a reset link has been sent.');
      },
    });
  }
}
