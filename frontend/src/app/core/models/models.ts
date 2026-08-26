export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  sellerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  dealershipName?: string;
  city?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CarInsurance {
  type: 'comprehensive' | 'third-party' | 'expired' | 'none';
  provider?: string;
  validTill?: string;
  isTransferable?: boolean;
}

export interface Car {
  _id: string;
  seller: string | User;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileageKm: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  transmission: 'manual' | 'automatic';
  ownersCount: number;
  color?: string;
  registrationState?: string;
  description?: string;
  images: string[];
  city: string;
  status: 'available' | 'reserved' | 'sold';
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  insurance: CarInsurance;
  createdAt: string;
}

export interface Booking {
  _id: string;
  car: string | Car;
  buyer: string | User;
  seller: string | User;
  preferredDate: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  adminNote?: string;
  wantsInsuranceHelp: boolean;
  insuranceNotes?: string;
  depositAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface CarFilters {
  make?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
  transmission?: string;
  q?: string;
}

export interface Policy {
  title: string;
  updatedAt: string;
  body: string[];
}

export interface InsurancePlan {
  _id: string;
  name: string;
  provider: string;
  planType: 'comprehensive' | 'third-party' | 'zero-dep' | 'engine-protect';
  description?: string;
  coverageFeatures: string[];
  durationMonths: number;
  premiumRatePercent: number;
  fixedFee: number;
  minPremium: number;
  isActive: boolean;
}

export interface InsuranceRequest {
  _id: string;
  buyer: string | User;
  car: string | Car;
  plan: string | InsurancePlan;
  carPriceAtRequest: number;
  calculatedPremium: number;
  notes?: string;
  status: 'pending' | 'quoted' | 'issued' | 'rejected' | 'cancelled';
  adminNote?: string;
  policyNumber?: string;
  policyDocument?: string;
  policyValidTill?: string;
  finalPremium?: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface Review {
  _id: string;
  car: string | Car;
  seller: string | User;
  buyer: string | User;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface WishlistItem {
  _id: string;
  user: string;
  car: Car;
  createdAt: string;
}
