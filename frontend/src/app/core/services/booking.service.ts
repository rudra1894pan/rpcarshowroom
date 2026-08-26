import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Booking } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiUrl}/bookings`;
  constructor(private http: HttpClient) {}

  create(data: {
    car: string;
    preferredDate: string;
    message?: string;
    wantsInsuranceHelp?: boolean;
    insuranceNotes?: string;
  }) {
    return this.http.post<Booking>(this.base, data);
  }

  getMine() {
    return this.http.get<Booking[]>(`${this.base}/my`);
  }

  getSellerBookings() {
    return this.http.get<Booking[]>(`${this.base}/seller`);
  }

  getAll() {
    return this.http.get<Booking[]>(this.base);
  }

  decide(id: string, decision: 'confirmed' | 'rejected', adminNote?: string) {
    return this.http.put<Booking>(`${this.base}/${id}/decide`, { decision, adminNote });
  }

  updateStatus(id: string, status: Booking['status']) {
    return this.http.put<Booking>(`${this.base}/${id}/status`, { status });
  }
}
