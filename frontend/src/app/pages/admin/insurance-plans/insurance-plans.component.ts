import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InsurancePlanService } from '../../../core/services/insurance-plan.service';
import { InsurancePlan } from '../../../core/models/models';

const emptyForm = {
  name: '',
  provider: '',
  planType: 'comprehensive' as InsurancePlan['planType'],
  description: '',
  coverageFeatures: '', // comma-separated in the form, split on submit
  durationMonths: 12,
  premiumRatePercent: 3,
  fixedFee: 0,
  minPremium: 0,
  isActive: true,
};

@Component({
  selector: 'app-insurance-plans',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './insurance-plans.component.html',
  styleUrl: '../management.scss',
})
export class InsurancePlansComponent implements OnInit {
  plans = signal<InsurancePlan[]>([]);
  editingId = signal<string | null>(null);
  showForm = signal(false);
  form = { ...emptyForm };
  error = signal('');

  constructor(private planService: InsurancePlanService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.planService.getAllAdmin().subscribe((p) => this.plans.set(p));
  }

  startCreate() {
    this.form = { ...emptyForm };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  startEdit(p: InsurancePlan) {
    this.form = {
      name: p.name,
      provider: p.provider,
      planType: p.planType,
      description: p.description || '',
      coverageFeatures: p.coverageFeatures.join(', '),
      durationMonths: p.durationMonths,
      premiumRatePercent: p.premiumRatePercent,
      fixedFee: p.fixedFee,
      minPremium: p.minPremium,
      isActive: p.isActive,
    };
    this.editingId.set(p._id);
    this.showForm.set(true);
  }

  save() {
    this.error.set('');
    const id = this.editingId();
    const payload = {
      ...this.form,
      coverageFeatures: this.form.coverageFeatures
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const req = id ? this.planService.update(id, payload) : this.planService.create(payload);
    req.subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
      error: (err) => this.error.set(err.error?.message || 'Save failed'),
    });
  }

  remove(id: string) {
    if (!confirm('Delete this insurance plan?')) return;
    this.planService.delete(id).subscribe(() => this.load());
  }

  cancel() {
    this.showForm.set(false);
  }
}
