import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  type: { type: String, enum: ['product', 'promotion'], required: true },
  productId: { type: String },
  promotionId: { type: String },
  selectedSkuOrSize: { type: String },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  note: { type: String },
  paymentMethod: { type: String, enum: ['COD', 'Easypaisa', 'JazzCash'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);

