import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Product } from '../models/product';
import { User } from '../models/user';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conex';

const seedProducts = [
  {
    name: 'NDT Ultrasonic Flaw Detector UFD-01',
    sku: 'NDT-UFD-01',
    slug: 'ndt-ultrasonic-flaw-detector-ufd-01',
    description: 'High-performance digital ultrasonic flaw detector designed for rapid and accurate testing, inspection, and measurement of weld integrity, castings, and structural metals. Features a vibrant LCD display, comprehensive calibration capabilities, and robust industrial casing.',
    category: 'Ultrasonic Testing',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Frequency Range', value: '0.5 MHz - 20 MHz' },
      { name: 'Gain', value: '0 - 110 dB' },
      { name: 'Display', value: '5.7 inch TFT Color LCD' },
      { name: 'Measurement Mode', value: 'Flaw detection, thickness measurement' },
      { name: 'Power Supply', value: 'Li-ion rechargeable battery pack' }
    ],
    datasheetUrl: '/datasheets/UFD-01_datasheet.pdf',
    basePrice: 95000,
    tieredPrices: {
      tier_1: 95000, // 1-9 units
      tier_2: 90000, // 10-49 units
      tier_3: 85000  // 50+ units
    },
    stock: 25,
    status: 'active' as const
  },
  {
    name: 'High-Voltage Armored Power Cable 11kV',
    sku: 'CBL-HV-11KV',
    slug: 'high-voltage-armored-power-cable-11kv',
    description: '11kV high-voltage aluminum/copper conductor power cable with XLPE insulation, inner PVC sheathing, galvanized steel flat strip armoring, and PVC outer sheath. Ideal for heavy duty industrial grids, mining operations, and underground distribution lines.',
    category: 'Cables & Accessories',
    images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Voltage Rating', value: '11 kV' },
      { name: 'Conductor Material', value: 'Electrolytic Grade Copper' },
      { name: 'Insulation', value: 'Cross-Linked Polyethylene (XLPE)' },
      { name: 'Armoring Type', value: 'Galvanized Steel Strip' },
      { name: 'Core Count', value: '3 Core' }
    ],
    datasheetUrl: '/datasheets/CBL-HV-11KV_datasheet.pdf',
    basePrice: 4500, // price per meter
    tieredPrices: {
      tier_1: 4500, // 1-49 meters
      tier_2: 4200, // 50-199 meters
      tier_3: 3900  // 200+ meters
    },
    stock: 1200, // in meters
    status: 'active' as const
  },
  {
    name: 'Handheld Electromagnetic Yoke MY-100',
    sku: 'NDT-MY-100',
    slug: 'handheld-electromagnetic-yoke-my-100',
    description: 'An ergonomic AC electromagnetic yoke designed for magnetic particle inspection to detect surface and sub-surface cracking in ferromagnetic materials. Articulating legs enable easy adaptation to different component shapes.',
    category: 'Magnetic Particle',
    images: ['https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Supply Voltage', value: '230 V AC, 50 Hz' },
      { name: 'Lifting Capacity', value: '4.5 kg (AC Mode)' },
      { name: 'Leg Span', value: '50 mm - 250 mm' },
      { name: 'Weight', value: '3.1 kg' },
      { name: 'Duty Cycle', value: '50%' }
    ],
    datasheetUrl: '/datasheets/MY-100_datasheet.pdf',
    basePrice: 32000,
    tieredPrices: {
      tier_1: 32000,
      tier_2: 30000,
      tier_3: 28000
    },
    stock: 40,
    status: 'active' as const
  },
  {
    name: 'Fluorescent Magnetic Ink - Magnaflux 14A',
    sku: 'CHM-M14A-1L',
    slug: 'fluorescent-magnetic-ink-magnaflux-14a',
    description: 'Premium fluorescent magnetic particle ink designed for high-sensitivity wet method magnetic particle testing. Reveals microscopic cracks under ultraviolet light (blacklight). Delivered in a concentrated 1-liter bottle.',
    category: 'Chemicals',
    images: ['https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Form', value: 'Liquid Concentrate' },
      { name: 'Sensitivity', value: 'ASME Class V' },
      { name: 'Color Under UV', value: 'Fluorescent Green' },
      { name: 'Container Volume', value: '1 Litre' },
      { name: 'Standards Compliance', value: 'ASTM E1444, ISO 9934' }
    ],
    datasheetUrl: '/datasheets/M14A-1L_datasheet.pdf',
    basePrice: 8500,
    tieredPrices: {
      tier_1: 8500,
      tier_2: 8000,
      tier_3: 7500
    },
    stock: 150,
    status: 'active' as const
  },
  {
    name: 'Dye Penetrant Inspection Aerosol Kit',
    sku: 'CHM-DP-KIT',
    slug: 'dye-penetrant-inspection-aerosol-kit',
    description: 'A complete three-part liquid penetrant testing system comprising red penetrant, solvent cleaner, and developer aerosol spray cans. Perfect for field inspection of weld seams, castings, and structural components.',
    category: 'Chemicals',
    images: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Kit Contents', value: '1x Cleaner, 1x Penetrant, 1x Developer' },
      { name: 'Can Size', value: '400 ml Aerosol' },
      { name: 'Dye Color', value: 'Vibrant Red' },
      { name: 'Sensitivity Level', value: 'Level 2 (Normal)' },
      { name: 'Operating Temp', value: '5°C to 50°C' }
    ],
    datasheetUrl: '/datasheets/DP-KIT_datasheet.pdf',
    basePrice: 1850,
    tieredPrices: {
      tier_1: 1850,
      tier_2: 1700,
      tier_3: 1550
    },
    stock: 500,
    status: 'active' as const
  },
  {
    name: 'Coaxial BNC to Lemo 00 Cable 2m',
    sku: 'CBL-BNC-LEMO2M',
    slug: 'coaxial-bnc-to-lemo-00-cable-2m',
    description: 'Premium RG-174 coaxial connector cable terminating with a male BNC plug on one end and a Lemo 00 connector on the other. Designed specifically for connecting ultrasonic transducers to flaw detectors without signal degradation.',
    category: 'Cables & Accessories',
    images: ['https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Cable Type', value: 'RG-174 Coaxial' },
      { name: 'Connectors', value: 'BNC Male to Lemo 00' },
      { name: 'Cable Length', value: '2.0 Metres' },
      { name: 'Impedance', value: '50 Ohms' },
      { name: 'Shielding', value: 'Double braided copper' }
    ],
    datasheetUrl: '/datasheets/BNC-LEMO2M_datasheet.pdf',
    basePrice: 2400,
    tieredPrices: {
      tier_1: 2400,
      tier_2: 2200,
      tier_3: 2000
    },
    stock: 350,
    status: 'active' as const
  },
  {
    name: 'Ultrasonic Transducer (2.25 MHz, 0.5" Dia)',
    sku: 'NDT-UT-TR2.25',
    slug: 'ultrasonic-transducer-2.25-mhz-0.5-dia',
    description: 'Standard contact ultrasonic transducer designed for general thickness gauging and crack detection. Features a rugged stainless steel housing, top-mount microdot connector, and high sensitivity.',
    category: 'Ultrasonic Testing',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'],
    specifications: [
      { name: 'Nominal Frequency', value: '2.25 MHz' },
      { name: 'Element Diameter', value: '0.5 inches (12.7 mm)' },
      { name: 'Connector Type', value: 'Microdot (Unpaired)' },
      { name: 'Contact Face Material', value: 'Wear-resistant Ceramic' },
      { name: 'Housing Material', value: '304 Stainless Steel' }
    ],
    datasheetUrl: '/datasheets/UT-TR2.25_datasheet.pdf',
    basePrice: 12500,
    tieredPrices: {
      tier_1: 12500,
      tier_2: 11800,
      tier_3: 11000
    },
    stock: 75,
    status: 'active' as const
  }
];

async function seedDatabase() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');
    
    // Clear products
    console.log('Clearing existing products from collection...');
    await Product.deleteMany({});
    console.log('Cleared successfully.');

    // Insert new seed products
    console.log('Inserting seed products...');
    const inserted = await Product.insertMany(seedProducts);
    console.log(`Successfully seeded ${inserted.length} products! 🌱`);

    // Seed Admin User
    console.log('Checking for default admin user...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@conex.in';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      if (isProduction && !adminPassword) {
        console.warn('WARNING: SEED_ADMIN_PASSWORD is not set in production. Skipping admin user creation for security reasons.');
      } else {
        console.log(`Creating admin user (${adminEmail})...`);
        await User.create({
          name: 'System Admin',
          email: adminEmail,
          password: adminPassword || 'adminpassword123',
          role: 'admin',
          pricingTier: 'tier_1'
        });
        console.log('Admin user created successfully.');
      }
    } else {
      console.log('Admin user already exists.');
    }

  } catch (error) {
    console.error('Seeding process encountered an error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
