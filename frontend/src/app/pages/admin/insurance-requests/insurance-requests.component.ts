import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsuranceRequestService } from '../../../core/services/insurance-request.service';
import { Car, InsurancePlan, InsuranceRequest, User } from '../../../core/models/models';

@Component({
  selector: 'app-insurance-requests',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './insurance-requests.component.html',
  styleUrl: '../management.scss',
})
export class InsuranceRequestsComponent implements OnInit {
  requests = signal<InsuranceRequest[]>([]);
  loading = signal(true);

  activeRequest = signal<InsuranceRequest | null>(null);
  decision: 'issued' | 'rejected' = 'issued';
  adminNote = '';
  policyNumber = '';
  policyValidTill = '';
  finalPremium: number | null = null;
  selectedFile: File | null = null;
  submitting = signal(false);

  constructor(private requestService: InsuranceRequestService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.requestService.getAll().subscribe({
      next: (r) => {
        this.requests.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  asCar(r: InsuranceRequest): Car {
    return r.car as Car;
  }
  asPlan(r: InsuranceRequest): InsurancePlan {
    return r.plan as InsurancePlan;
  }
  asBuyer(r: InsuranceRequest): User {
    return r.buyer as User;
  }

  openDecision(r: InsuranceRequest, decision: 'issued' | 'rejected') {
    this.activeRequest.set(r);
    this.decision = decision;
    this.adminNote = '';
    this.policyNumber = '';
    this.policyValidTill = '';
    this.finalPremium = r.calculatedPremium;
    this.selectedFile = null;
  }

  closeModal() {
    this.activeRequest.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  confirmDecision() {
    const r = this.activeRequest();
    if (!r) return;
    const fd = new FormData();
    fd.append('decision', this.decision);
    if (this.adminNote) fd.append('adminNote', this.adminNote);
    if (this.decision === 'issued') {
      if (this.policyNumber) fd.append('policyNumber', this.policyNumber);
      if (this.policyValidTill) fd.append('policyValidTill', this.policyValidTill);
      if (this.finalPremium) fd.append('finalPremium', String(this.finalPremium));
      if (this.selectedFile) fd.append('policyDocument', this.selectedFile);
    }
    this.submitting.set(true);
    this.requestService.decide(r._id, fd).subscribe({
      next: () => {
        this.submitting.set(false);
        this.activeRequest.set(null);
        this.load();
      },
      error: () => this.submitting.set(false),
    });
  }
}
