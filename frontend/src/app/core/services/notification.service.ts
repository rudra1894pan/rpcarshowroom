import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;
  unreadCount = signal(0);
  private pollSub: Subscription | null = null;

  constructor(private http: HttpClient) {}

  getMine() {
    return this.http.get<AppNotification[]>(this.base);
  }

  refreshUnreadCount() {
    this.http.get<{ count: number }>(`${this.base}/unread-count`).subscribe({
      next: (res) => this.unreadCount.set(res.count),
      error: () => {},
    });
  }

  markRead(id: string) {
    return this.http.put<AppNotification>(`${this.base}/${id}/read`, {});
  }

  markAllRead() {
    return this.http.put(`${this.base}/read-all`, {});
  }

  // Called once on login; stops on logout.
  startPolling() {
    this.refreshUnreadCount();
    this.stopPolling();
    this.pollSub = interval(30000).subscribe(() => this.refreshUnreadCount());
  }

  stopPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.unreadCount.set(0);
  }
}
