import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { PolicyService } from '../../core/services/policy.service';
import { Policy } from '../../core/models/models';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [DatePipe, KeyValuePipe],
  templateUrl: './policies.component.html',
  styleUrl: './policies.component.scss',
})
export class PoliciesComponent implements OnInit {
  policies = signal<Record<string, Policy>>({});
  loading = signal(true);

  constructor(private policyService: PolicyService) {}

  ngOnInit() {
    this.policyService.getAll().subscribe({
      next: (p) => {
        this.policies.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
