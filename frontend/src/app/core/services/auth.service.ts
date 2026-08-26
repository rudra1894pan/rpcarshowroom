import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/models';
import { tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { WishlistService } from './wishlist.service';

const TOKEN_KEY = 'rpcs_token';
const USER_KEY = 'rpcs_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<User | null>(this.readUser());
  user = computed(() => this.userSignal());
  isLoggedIn = computed(() => !!this.userSignal());
  isAdmin = computed(() => this.userSignal()?.role === 'admin');
  isApprovedSeller = computed(
    () => this.userSignal()?.role === 'seller' && this.userSignal()?.sellerStatus === 'approved'
  );
  sellerStatus = computed(() => this.userSignal()?.sellerStatus ?? 'none');

  constructor(
    private http: HttpClient,
    private router: Router,
    private notifications: NotificationService,
    private wishlist: WishlistService
  ) {
    if (this.userSignal()) {
      this.notifications.startPolling();
      this.wishlist.load();
    }
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  register(data: { name: string; email: string; password: string; phone?: string; city?: string }) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res) => this.setSession(res)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, {
      email,
    });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      password,
    });
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSignal.set(res.user);
    this.notifications.startPolling();
    this.wishlist.load();
  }

  applyAsSeller(dealershipName?: string) {
    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/auth/apply-seller`, { dealershipName })
      .pipe(tap((res) => this.updateUser(res.user)));
  }

  private updateUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.notifications.stopPolling();
    this.wishlist.clear();
    this.router.navigate(['/login']);
  }
}
