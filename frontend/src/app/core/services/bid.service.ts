import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Bid, BidSummary } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BidService {
  private base = `${environment.apiUrl}/bids`;
  constructor(private http: HttpClient) {}

  summary(carId: string) {
    return this.http.get<BidSummary>(`${this.base}/car/${carId}/summary`);
  }
  place(carId: string, amount: number, note?: string) {
    return this.http.post<Bid>(`${this.base}/car/${carId}`, { amount, note });
  }
  getMine() {
    return this.http.get<Bid[]>(`${this.base}/my`);
  }
  getReceived() {
    return this.http.get<Bid[]>(`${this.base}/received`);
  }
  accept(id: string) {
    return this.http.put(`${this.base}/${id}/accept`, {});
  }
  reject(id: string) {
    return this.http.put(`${this.base}/${id}/reject`, {});
  }
  withdraw(id: string) {
    return this.http.put(`${this.base}/${id}/withdraw`, {});
  }
}
