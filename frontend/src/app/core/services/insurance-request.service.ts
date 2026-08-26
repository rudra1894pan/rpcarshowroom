import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InsuranceRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InsuranceRequestService {
  private base = `${environment.apiUrl}/insurance-requests`;
  constructor(private http: HttpClient) {}

  create(data: { car: string; plan: string; notes?: string }) {
    return this.http.post<InsuranceRequest>(this.base, data);
  }

  getMine() {
    return this.http.get<InsuranceRequest[]>(`${this.base}/my`);
  }

  getAll() {
    return this.http.get<InsuranceRequest[]>(this.base);
  }

  decide(id: string, formData: FormData) {
    return this.http.put<InsuranceRequest>(`${this.base}/${id}/decide`, formData);
  }

  cancel(id: string) {
    return this.http.put<InsuranceRequest>(`${this.base}/${id}/cancel`, {});
  }
}
