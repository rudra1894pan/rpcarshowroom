import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Review } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private base = `${environment.apiUrl}/reviews`;
  constructor(private http: HttpClient) {}

  getForCar(carId: string) {
    return this.http.get<{ reviews: Review[]; avgRating: number; count: number }>(
      `${this.base}/car/${carId}`
    );
  }

  getForSeller() {
    return this.http.get<Review[]>(`${this.base}/seller/mine`);
  }

  create(data: { car: string; rating: number; comment?: string }) {
    return this.http.post<Review>(this.base, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
