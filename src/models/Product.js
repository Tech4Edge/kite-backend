import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
  type: String,
}, { _id: false });

const BrandSchema = new mongoose.Schema({
  name: String,
  category: String,
}, { _id: false });

const SizeSchema = new mongoose.Schema({
  size: String,
  avgSticks: Number,
  matchesPerCotton: Number,
}, { _id: false });

const SkuSchema = new mongoose.Schema({
  size: String,
  gramage: String,
  packing: Number,
  price: Number,
}, { _id: false });

const FacilitySchema = new mongoose.Schema({
  name: String,
  location: String,
  note: String,
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  iconType: { type: String, enum: ['fire', 'layer', 'dish-wash', null], default: null },
  description: { type: String, required: true },
  image: { type: String, required: true },
  color: { type: String, required: true },
  tagline: { type: String },
  features: [{ type: String }],
  brands: [BrandSchema],
  sizes: [SizeSchema],
  skus: [SkuSchema],
  facilities: [FacilitySchema],
  services: { type: String },
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);

