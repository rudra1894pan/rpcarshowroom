import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  open = signal(false);
  notifications = signal<AppNotification[]>([]);
  loading = signal(false);
  loaded = false;

  constructor(public notificationService: NotificationService, private router: Router) {}

  ngOnInit() {
    this.notificationService.refreshUnreadCount();
  }

  toggle() {
    this.open.set(!this.open());
    if (this.open() && !this.loaded) {
      this.load();
    }
  }

  close() {
    this.open.set(false);
  }

  load() {
    this.loading.set(true);
    this.notificationService.getMine().subscribe({
      next: (n) => {
        this.notifications.set(n);
        this.loading.set(false);
        this.loaded = true;
      },
      error: () => this.loading.set(false),
    });
  }

  select(n: AppNotification) {
    if (!n.isRead) {
      this.notificationService.markRead(n._id).subscribe(() => {
        this.notificationService.refreshUnreadCount();
        this.notifications.set(
          this.notifications().map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
        );
      });
    }
    this.close();
    if (n.link) this.router.navigateByUrl(n.link);
  }

  markAllRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllRead().subscribe(() => {
      this.notifications.set(this.notifications().map((x) => ({ ...x, isRead: true })));
      this.notificationService.refreshUnreadCount();
    });
  }
}
