import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['product', 'promotion'], default: 'product' },
  productId: { type: String },
  promotionId: { type: String },
  brandName: { type: String },
  selectedVariant: { type: String },
  quantity: { type: Number, required: true, min: 1, max: 1000 },
  price: { type: Number }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  type: { type: String, enum: ['product', 'promotion', 'cart'], required: true },
  productId: { type: String },
  promotionId: { type: String },
  selectedSkuOrSize: { type: String },
  quantity: { type: Number, min: 1, max: 1000 }, // No longer strictly required for cart orders
  items: [OrderItemSchema],
  totalAmount: { type: Number },
  shippingCost: { type: Number },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  note: { type: String },
  paymentMethod: { type: String, enum: ['COD', 'Easypaisa', 'JazzCash'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);

