import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Car, CarFilters } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CarService {
  private base = `${environment.apiUrl}/cars`;
  constructor(private http: HttpClient) {}

  getCars(filters: CarFilters = {}) {
    let params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return this.http.get<Car[]>(`${this.base}${qs ? '?' + qs : ''}`);
  }

  getOne(id: string) {
    return this.http.get<Car>(`${this.base}/${id}`);
  }

  // Seller: own listings, any approval status
  getMine() {
    return this.http.get<Car[]>(`${this.base}/mine`);
  }

  // Admin
  getPending() {
    return this.http.get<Car[]>(`${this.base}/admin/pending`);
  }
  decide(id: string, decision: 'approved' | 'rejected') {
    return this.http.put<Car>(`${this.base}/admin/${id}/decide`, { decision });
  }
  getAllAdmin() {
    return this.http.get<Car[]>(`${this.base}/admin/all`);
  }

  create(formData: FormData) {
    return this.http.post<Car>(this.base, formData);
  }

  update(id: string, formData: FormData) {
    return this.http.put<Car>(`${this.base}/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  removeImage(id: string, imageUrl: string) {
    return this.http.put<Car>(`${this.base}/${id}/remove-image`, { imageUrl });
  }

  imageUrl(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.assetUrl}${path}`;
  }

  insuranceLabel(type: string) {
    const map: Record<string, string> = {
      comprehensive: 'Comprehensive',
      'third-party': 'Third-Party',
      expired: 'Expired',
      none: 'No Insurance',
    };
    return map[type] || type;
  }
}
