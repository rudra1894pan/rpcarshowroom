import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InsurancePlan } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InsurancePlanService {
  private base = `${environment.apiUrl}/insurance-plans`;
  constructor(private http: HttpClient) {}

  getPlans() {
    return this.http.get<InsurancePlan[]>(this.base);
  }

  calculate(planId: string, carId: string) {
    return this.http.get<{ premium: number; carPrice: number; plan: InsurancePlan }>(
      `${this.base}/${planId}/calculate?carId=${carId}`
    );
  }

  // Admin
  getAllAdmin() {
    return this.http.get<InsurancePlan[]>(`${this.base}/admin/all`);
  }
  create(data: Partial<InsurancePlan>) {
    return this.http.post<InsurancePlan>(this.base, data);
  }
  update(id: string, data: Partial<InsurancePlan>) {
    return this.http.put<InsurancePlan>(`${this.base}/${id}`, data);
  }
  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  planTypeLabel(type: string) {
    const map: Record<string, string> = {
      comprehensive: 'Comprehensive',
      'third-party': 'Third-Party',
      'zero-dep': 'Zero Depreciation',
      'engine-protect': 'Engine Protection',
    };
    return map[type] || type;
  }
}
