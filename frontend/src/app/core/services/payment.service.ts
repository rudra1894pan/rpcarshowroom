import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';
import { RazorpaySuccessResponse } from '../models/razorpay.d';

interface CreateOrderResponse {
  orderId: string;
  amount: number; // in paise
  currency: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiUrl}/payments`;
  private cachedKeyId: string | null = null;

  constructor(private http: HttpClient) {}

  private async getKeyId(): Promise<string> {
    if (this.cachedKeyId) return this.cachedKeyId;
    const res = await firstValueFrom(this.http.get<{ keyId: string }>(`${this.base}/config`));
    this.cachedKeyId = res.keyId;
    return res.keyId;
  }

  /**
   * Runs the full pay flow: create order on the backend, open Razorpay
   * checkout, verify the payment server-side on success.
   * Resolves when payment is verified; rejects/throws on failure or if the
   * user closes the checkout modal without paying.
   */
  async pay(type: 'booking' | 'insurance', id: string, user: User): Promise<void> {
    const keyId = await this.getKeyId();
    if (!keyId) {
      throw new Error('Payments are not configured yet. Please contact the showroom.');
    }

    const order = await firstValueFrom(
      this.http.post<CreateOrderResponse>(`${this.base}/create-order`, { type, id })
    );

    return new Promise<void>((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RP Car Showroom',
        description: order.label,
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: '#d4af37' },
        handler: (response: RazorpaySuccessResponse) => {
          this.http
            .post(`${this.base}/verify`, {
              type,
              id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            .subscribe({
              next: () => resolve(),
              error: (err) => reject(err),
            });
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      });
      razorpay.open();
    });
  }
}
