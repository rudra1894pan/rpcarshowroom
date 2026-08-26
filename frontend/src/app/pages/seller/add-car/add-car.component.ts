import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarService } from '../../../core/services/car.service';

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
  };

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
    Object.entries(this.form).forEach(([key, value]) => fd.append(key, String(value)));
    this.selectedFiles.forEach((file) => fd.append('images', file));

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
