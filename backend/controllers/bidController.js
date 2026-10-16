const Bid = require('../models/Bid');
const Car = require('../models/Car');
const { notify } = require('../utils/notify');

const highestActive = (carId) => Bid.findOne({ car: carId, status: 'active' }).sort('-amount');

const canManage = (car, user) =>
  user.role === 'admin' || car.seller.toString() === user._id.toString();

// Public: bidding status of a car (no bidder identities)
exports.getSummary = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId).select(
      'biddingEnabled minBid biddingEndsAt status price'
    );
    if (!car) return res.status(404).json({ message: 'Car not found' });
    const [top, count] = await Promise.all([
      highestActive(car._id),
      Bid.countDocuments({ car: car._id, status: 'active' }),
    ]);
    res.json({
      biddingEnabled: car.biddingEnabled,
      minBid: car.minBid || 0,
      endsAt: car.biddingEndsAt,
      highest: top ? top.amount : 0,
      count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    if (req.user.role === 'admin' || car.seller.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot bid on your own listing' });
    }
    if (car.approvalStatus !== 'approved' || !car.isActive || car.status !== 'available') {
      return res.status(400).json({ message: 'This car is not open for bidding' });
    }
    if (!car.biddingEnabled) return res.status(400).json({ message: 'Bidding is not enabled for this car' });
    if (car.biddingEndsAt && car.biddingEndsAt < new Date()) {
      return res.status(400).json({ message: 'Bidding has ended for this car' });
    }

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Enter a valid bid amount' });
    if (car.minBid && amount < car.minBid) {
      return res.status(400).json({ message: `Minimum bid is ₹${car.minBid.toLocaleString('en-IN')}` });
    }
    const top = await highestActive(car._id);
    if (top && amount <= top.amount) {
      return res
        .status(400)
        .json({ message: `Your bid must be higher than the current highest bid (₹${top.amount.toLocaleString('en-IN')})` });
    }

    // Replace this bidder's earlier active bids with the new one.
    await Bid.updateMany({ car: car._id, bidder: req.user._id, status: 'active' }, { status: 'outbid' });
    const bid = await Bid.create({ car: car._id, bidder: req.user._id, amount, note: req.body.note });

    notify(
      car.seller,
      'bid_new',
      'New bid received',
      `${req.user.name} bid ₹${amount.toLocaleString('en-IN')} on "${car.title}".`,
      '/seller/bids'
    );
    if (top && top.bidder.toString() !== req.user._id.toString()) {
      notify(
        top.bidder,
        'bid_outbid',
        'You have been outbid',
        `Someone bid ₹${amount.toLocaleString('en-IN')} on "${car.title}". Place a higher bid to stay in.`,
        `/cars/${car._id}`
      );
    }
    res.status(201).json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Buyer: own bids, with the current highest for each car so the UI can show "leading / outbid"
exports.getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate('car', 'title images price status make model year')
      .sort('-createdAt')
      .lean();
    for (const b of bids) {
      if (!b.car) continue;
      const top = await highestActive(b.car._id);
      b.highest = top ? top.amount : 0;
    }
    res.json(bids.filter((b) => b.car));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller (own cars) / admin (all cars): bids received
exports.getReceived = async (req, res) => {
  try {
    let carIds;
    if (req.user.role === 'admin') {
      carIds = await Car.find({ biddingEnabled: true }).distinct('_id');
    } else {
      carIds = await Car.find({ seller: req.user._id }).distinct('_id');
    }
    const bids = await Bid.find({ car: { $in: carIds } })
      .populate('bidder', 'name email phone city')
      .populate('car', 'title images price status minBid biddingEndsAt purchasePrice reconditioning')
      .sort('-amount')
      .lean({ virtuals: true });
    res.json(bids.filter((b) => b.car));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seller/admin accepts a bid: car is marked sold at that price, every other bid is declined.
exports.acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ message: 'Bid not found' });
    const car = await Car.findById(bid.car);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    if (!canManage(car, req.user)) return res.status(403).json({ message: 'Not authorized' });
    if (bid.status !== 'active') return res.status(400).json({ message: 'Only active bids can be accepted' });
    if (car.status === 'sold') return res.status(400).json({ message: 'Car is already sold' });

    bid.status = 'accepted';
    await bid.save();
    car.status = 'sold';
    car.soldPrice = bid.amount;
    car.soldTo = bid.bidder;
    car.biddingEnabled = false;
    await car.save();

    const others = await Bid.find({ car: car._id, _id: { $ne: bid._id }, status: { $in: ['active', 'outbid'] } });
    await Bid.updateMany({ _id: { $in: others.map((o) => o._id) } }, { status: 'rejected' });

    notify(
      bid.bidder,
      'bid_accepted',
      'Your bid was accepted!',
      `Congratulations! Your bid of ₹${bid.amount.toLocaleString('en-IN')} for "${car.title}" was accepted. The seller will contact you.`,
      '/my-bids'
    );
    [...new Set(others.filter((o) => o.status === 'active').map((o) => o.bidder.toString()))]
      .filter((id) => id !== bid.bidder.toString())
      .forEach((id) =>
        notify(id, 'bid_rejected', 'Bid not selected', `"${car.title}" was sold to another bidder.`, '/my-bids')
      );

    res.json({ bid, car });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.rejectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ message: 'Bid not found' });
    const car = await Car.findById(bid.car);
    if (!car || !canManage(car, req.user)) return res.status(403).json({ message: 'Not authorized' });
    if (bid.status !== 'active') return res.status(400).json({ message: 'Only active bids can be rejected' });
    bid.status = 'rejected';
    await bid.save();
    notify(bid.bidder, 'bid_rejected', 'Bid declined', `Your bid on "${car.title}" was declined.`, '/my-bids');
    res.json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, bidder: req.user._id });
    if (!bid) return res.status(404).json({ message: 'Bid not found' });
    if (bid.status !== 'active') return res.status(400).json({ message: 'Only active bids can be withdrawn' });
    bid.status = 'withdrawn';
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
