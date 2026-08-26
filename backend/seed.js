// Seeds an admin, a demo approved seller, sample car listings, and insurance plans.
// Run with: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Car = require('./models/Car');
const InsurancePlan = require('./models/InsurancePlan');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  const adminEmail = 'admin@rpcarshowroom.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Showroom Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
    });
    console.log(`Created admin: ${adminEmail} / admin123`);
  } else {
    console.log('Admin already exists.');
  }

  const sellerEmail = 'seller@rpcarshowroom.com';
  let seller = await User.findOne({ email: sellerEmail });
  if (!seller) {
    seller = await User.create({
      name: 'Demo Seller',
      email: sellerEmail,
      password: 'seller123',
      role: 'seller',
      sellerStatus: 'approved',
      dealershipName: 'RP Approved Motors',
      city: 'Ahmedabad',
    });
    console.log(`Created approved seller: ${sellerEmail} / seller123`);
  } else {
    console.log('Seller already exists.');
  }

  const carCount = await Car.countDocuments();
  if (carCount === 0) {
    await Car.insertMany([
      {
        seller: seller._id,
        title: '2019 Honda City VX CVT',
        make: 'Honda',
        model: 'City',
        year: 2019,
        price: 950000,
        mileageKm: 42000,
        fuelType: 'petrol',
        transmission: 'automatic',
        ownersCount: 1,
        color: 'White',
        registrationState: 'GJ',
        description: 'Single owner, full service history, showroom maintained.',
        city: 'Ahmedabad',
        images: [],
        approvalStatus: 'approved',
        insurance: {
          type: 'comprehensive',
          provider: 'ICICI Lombard',
          validTill: new Date('2027-03-15'),
          isTransferable: true,
        },
      },
      {
        seller: seller._id,
        title: '2020 Hyundai Creta SX',
        make: 'Hyundai',
        model: 'Creta',
        year: 2020,
        price: 1350000,
        mileageKm: 28000,
        fuelType: 'diesel',
        transmission: 'manual',
        ownersCount: 1,
        color: 'Grey',
        registrationState: 'GJ',
        description: 'Top variant, sunroof, well maintained.',
        city: 'Surat',
        images: [],
        approvalStatus: 'approved',
        insurance: {
          type: 'comprehensive',
          provider: 'HDFC Ergo',
          validTill: new Date('2026-11-20'),
          isTransferable: true,
        },
      },
      {
        seller: admin._id,
        title: '2018 Maruti Swift VXI',
        make: 'Maruti Suzuki',
        model: 'Swift',
        year: 2018,
        price: 550000,
        mileageKm: 61000,
        fuelType: 'petrol',
        transmission: 'manual',
        ownersCount: 2,
        color: 'Red',
        registrationState: 'GJ',
        description: 'Good condition, new tyres, ready to drive.',
        city: 'Ahmedabad',
        images: [],
        approvalStatus: 'approved',
        insurance: {
          type: 'third-party',
          provider: 'Bajaj Allianz',
          validTill: new Date('2026-09-05'),
          isTransferable: true,
        },
      },
    ]);
    console.log('Seeded 3 sample car listings (2 from seller, 1 from admin).');
  } else {
    console.log('Cars already exist, skipping.');
  }

  const planCount = await InsurancePlan.countDocuments();
  if (planCount === 0) {
    await InsurancePlan.insertMany([
      {
        name: 'Comprehensive Shield',
        provider: 'ICICI Lombard',
        planType: 'comprehensive',
        description: 'Full coverage against accidents, theft, fire, and natural calamities.',
        coverageFeatures: [
          'Own damage + third-party cover',
          '24x7 roadside assistance',
          'Cashless garage network',
          'Personal accident cover',
        ],
        durationMonths: 12,
        premiumRatePercent: 3.5,
        fixedFee: 500,
        minPremium: 8000,
      },
      {
        name: 'Zero-Dep Plus',
        provider: 'HDFC Ergo',
        planType: 'zero-dep',
        description: 'Comprehensive cover with zero depreciation on claims — get full part value.',
        coverageFeatures: [
          'No depreciation deduction on claims',
          'Engine protection add-on included',
          '24x7 roadside assistance',
          'Free annual inspection',
        ],
        durationMonths: 12,
        premiumRatePercent: 4.8,
        fixedFee: 800,
        minPremium: 12000,
      },
      {
        name: 'Essential Third-Party',
        provider: 'Bajaj Allianz',
        planType: 'third-party',
        description: 'Legally mandatory minimum cover — protects against third-party liability.',
        coverageFeatures: ['Third-party liability cover', 'Legally compliant', 'Budget-friendly'],
        durationMonths: 12,
        premiumRatePercent: 1.2,
        fixedFee: 200,
        minPremium: 2500,
      },
    ]);
    console.log('Seeded 3 insurance plans.');
  } else {
    console.log('Insurance plans already exist, skipping.');
  }

  console.log('Done.');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
