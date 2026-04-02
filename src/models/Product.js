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

const VariantSchema = new mongoose.Schema({
  name: String,
  detail: String,
  packing: String,
  price: Number,
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  productType: { type: String, default: 'general' }, // e.g. matches, detergents, dish-wash
  navGroup: { type: String, default: '' }, // e.g. Safety Matches, Detergents
  iconType: { type: String, enum: ['fire', 'layer', 'dish-wash', null], default: null },
  description: { type: String },
  image: { type: String },
  images: [{ type: String }], // optional gallery images
  color: { type: String },
  tagline: { type: String },
  features: [{ type: String }],
  variants: [VariantSchema],
  brands: [BrandSchema],
  sizes: [SizeSchema],
  skus: [SkuSchema],
  facilities: [FacilitySchema],
  services: { type: String },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  showOnLanding: { type: Boolean, default: true },
  showInProductsPage: { type: Boolean, default: true },
  showInNavbar: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);

