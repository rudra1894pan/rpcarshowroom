import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarService } from '../../../core/services/car.service';
import { ReconItem } from '../../../core/models/models';

interface CarForm {
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  ownersCount: number;
  color: string;
  registrationState: string;
  description: string;
  city: string;
  insuranceType: string;
  insuranceProvider: string;
  insuranceValidTill: string;
  insuranceTransferable: boolean;
  purchasePrice: number | null;
  biddingEnabled: boolean;
  minBid: number | null;
  biddingEndsAt: string;
}

@Component({
  selector: 'app-seller-add-car',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-car.component.html',
  styleUrl: '../management.scss',
})
export class SellerAddCarComponent {
  form: CarForm = {
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileageKm: 0,
    fuelType: 'petrol',
    transmission: 'manual',
    ownersCount: 1,
    color: '',
    registrationState: '',
    description: '',
    city: '',
    insuranceType: 'none',
    insuranceProvider: '',
    insuranceValidTill: '',
    insuranceTransferable: true,
    purchasePrice: null,
    biddingEnabled: false,
    minBid: null,
    biddingEndsAt: '',
  };

  categories: ReconItem['category'][] = ['service', 'repair', 'modification', 'paint', 'tyres', 'interior', 'documents', 'other'];
  recon: ReconItem[] = [];

  categoryLabels: Record<string, string> = {
    service: 'Service',
    repair: 'Repair',
    modification: 'Modification',
    paint: 'Paint',
    tyres: 'Tyres',
    interior: 'Interior',
    documents: 'Documents',
    other: 'Other',
  };

  addRecon(category: ReconItem['category'] = 'service') {
    this.recon.push({ category, description: '', cost: 0 });
  }
  removeRecon(i: number) {
    this.recon.splice(i, 1);
  }
  get reconTotal() {
    return this.recon.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  }
  get totalInvested() {
    return (Number(this.form.purchasePrice) || 0) + this.reconTotal;
  }

  selectedFiles: File[] = [];
  previews: string[] = [];
  error = signal('');
  loading = signal(false);
  success = signal(false);

  constructor(private carService: CarService, private router: Router) {}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files).slice(0, 8 - this.selectedFiles.length);
    this.selectedFiles.push(...files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => this.previews.push(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  submit() {
    this.error.set('');
    if (!this.form.title || !this.form.make || !this.form.model || !this.form.city) {
      this.error.set('Please fill in all required fields.');
      return;
    }

    const fd = new FormData();
    Object.entries(this.form).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      fd.append(key, String(value));
    });
    fd.append('reconditioning', JSON.stringify(this.recon.filter((r) => r.description.trim())));
    this.selectedFiles.forEach((file) => fd.append('images', file));

    if (this.form.biddingEnabled && this.form.minBid && this.form.minBid > this.form.price) {
      this.error.set('Minimum bid cannot be higher than the asking price.');
      return;
    }

    this.loading.set(true);
    this.carService.create(fd).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to create listing');
      },
    });
  }

  goToListings() {
    this.router.navigate(['/seller/listings']);
  }
}
