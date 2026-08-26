import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WishlistItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private base = `${environment.apiUrl}/wishlist`;

  // Set of wishlisted car IDs, kept in sync so any page can check/toggle instantly.
  carIds = signal<Set<string>>(new Set());
  private loaded = false;

  constructor(private http: HttpClient) {}

  isWishlisted(carId: string): boolean {
    return this.carIds().has(carId);
  }

  // Call once after login, or lazily the first time it's needed.
  load() {
    this.http.get<WishlistItem[]>(this.base).subscribe({
      next: (items) => {
        this.carIds.set(new Set(items.map((i) => i.car._id)));
        this.loaded = true;
      },
      error: () => {},
    });
  }

  ensureLoaded() {
    if (!this.loaded) this.load();
  }

  toggle(carId: string) {
    if (this.isWishlisted(carId)) {
      this.remove(carId);
    } else {
      this.add(carId);
    }
  }

  add(carId: string) {
    const next = new Set(this.carIds());
    next.add(carId); // optimistic
    this.carIds.set(next);
    this.http.post(this.base, { carId }).subscribe({
      error: () => {
        const reverted = new Set(this.carIds());
        reverted.delete(carId);
        this.carIds.set(reverted);
      },
    });
  }

  remove(carId: string) {
    const next = new Set(this.carIds());
    next.delete(carId); // optimistic
    this.carIds.set(next);
    this.http.delete(`${this.base}/${carId}`).subscribe({
      error: () => {
        const reverted = new Set(this.carIds());
        reverted.add(carId);
        this.carIds.set(reverted);
      },
    });
  }

  getMine() {
    return this.http.get<WishlistItem[]>(this.base);
  }

  clear() {
    this.carIds.set(new Set());
    this.loaded = false;
  }
}
