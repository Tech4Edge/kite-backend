import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Product from '../src/models/Product.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const matchVariants = [
  { name: 'LARGE', detail: '58 Sticks', packing: '500 pcs/ctn', price: 2000 },
  { name: 'CLASSIC', detail: '45 Sticks', packing: '500 pcs/ctn', price: 1750 },
  { name: 'REGULAR', detail: '42 Sticks', packing: '1000 pcs/ctn', price: 2750 },
  { name: 'SMALL', detail: '32 Sticks', packing: '1000 pcs/ctn', price: 2200 },
];

const safetyMatchesData = {
  id: 'safety-matches',
  title: 'Safety Matches Collection',
  category: 'Safety Matches',
  productType: 'matches',
  navGroup: 'Safety Matches',
  iconType: 'fire',
  description: 'Our premium collection of safety matches, trusted across households and industries for superior quality, reliability, and damp-proof performance.',
  color: '#ED028C',
  displayOrder: 1,
  showOnLanding: true,
  showInProductsPage: true,
  showInNavbar: true,
  services: 'Global export and bulk wholesale available. Regional supply and local market distribution.',
  facilities: [
    { name: 'Mohsin Match Factory', location: 'Hayatabad, Peshawar', note: 'Established 1974' },
    { name: 'Mohsin Enterprises', location: 'Hayatabad, Peshawar', note: 'Established 1990' },
    { name: 'AJ Match Factory', location: 'Sheikhupura, Lahore', note: 'Established 2006' }
  ],
  brands: [
    {
      name: 'Kite Safety Matches',
      category: 'Safety Matches',
      tagline: '',
      description: "Our flagship premium brand and Pakistan's leading export match. Known for reliability and superior ignition, Kite represents over 50 years of manufacturing excellence.",
      features: ['Premium Quality', 'Damp proof', 'Carbonised sticks', 'Extra sticks', 'Reliable always'],
      variants: matchVariants
    },
    {
      name: 'Bird Safety Matches',
      category: 'Safety Matches',
      tagline: '',
      description: "A trusted household name providing consistent quality and ease of use. Bird matches are designed for daily domestic utility with high safety standards.",
      features: ['Reliable ignition', 'Damp proof', 'Strong sticks', 'Standard count', 'Safe handling'],
      variants: matchVariants
    },
    {
      name: 'Olympia Safety Matches',
      category: 'Safety Matches',
      tagline: '',
      description: "Designed for high-performance and durability. Olympia matches undergo rigorous quality checks to ensure they perform in various environmental conditions.",
      features: ['High performance', 'Sturdy sticks', 'Damp proof', 'Precision box striking surface', 'Eco-friendly materials'],
      variants: matchVariants
    },
    {
      name: 'Party Safety Matches',
      category: 'Safety Matches',
      tagline: '',
      description: "A vibrant and reliable choice for every occasion. Party matches provide the perfect balance of quantity and quality for busy households.",
      features: ['Fast ignition', 'Easy strike', 'Damp proof', 'Compact packaging', 'Uniform stick size'],
      variants: matchVariants
    },
    {
      name: 'Tanga Safety Matches',
      category: 'Safety Matches',
      tagline: '',
      description: "Our heritage-focused brand that offers traditional reliability. Tanga is known for its sturdy build and consistent strike-to-flame ratio.",
      features: ['Classic design', 'Extra sturdy sticks', 'Reliable chemical coating', 'Damp proof', 'Traditional count'],
      variants: matchVariants
    }
  ]
};

const seedMatches = async () => {
  await connectDB();
  try {
    const existing = await Product.findOne({ id: 'safety-matches' });
    if (existing) {
      console.log('Safety Matches product exists, updating...');
      // Preserve existing images if any
      safetyMatchesData.brands = safetyMatchesData.brands.map((brand, i) => {
        if (existing.brands[i] && existing.brands[i].image) {
          brand.image = existing.brands[i].image;
        }
        return brand;
      });
      await Product.updateOne({ id: 'safety-matches' }, safetyMatchesData);
      console.log('Safety Matches product updated!');
    } else {
      console.log('Creating Safety Matches product...');
      await Product.create(safetyMatchesData);
      console.log('Safety Matches product created!');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error seeding matches:', err);
    process.exit(1);
  }
};

seedMatches();
