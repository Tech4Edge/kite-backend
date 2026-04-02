import mongoose from 'mongoose';

const PromotionItemSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  price: Number,
}, { _id: false });

const PromotionPackageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  images: [{ type: String }],
  items: [PromotionItemSchema],
  totalQuantity: Number,
  totalPrice: Number,
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('PromotionPackage', PromotionPackageSchema);

