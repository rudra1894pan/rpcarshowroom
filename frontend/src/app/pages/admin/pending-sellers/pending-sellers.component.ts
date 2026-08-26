import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-pending-sellers',
  standalone: true,
  templateUrl: './pending-sellers.component.html',
  styleUrl: '../management.scss',
})
export class PendingSellersComponent implements OnInit {
  sellers = signal<User[]>([]);
  loading = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<User[]>(`${environment.apiUrl}/auth/sellers/pending`).subscribe({
      next: (s) => {
        this.sellers.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  decide(id: string, decision: 'approved' | 'rejected') {
    this.http
      .put(`${environment.apiUrl}/auth/sellers/${id}/decide`, { decision })
      .subscribe(() => this.load());
  }
}
