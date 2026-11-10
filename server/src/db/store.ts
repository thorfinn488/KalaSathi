import bcrypt from 'bcryptjs';

export interface UserRecord {
  user_id: string;
  name: string;
  phone: string;
  password_hash: string;
  role: 'ARTISAN' | 'ADMIN' | 'BUYER';
  region?: string;
  craft_specialty?: string;
  company_name?: string;
  requirements?: string;
  created_at: string;
}

export interface ProductRecord {
  product_id: string;
  artisan_id: string;
  artisan_name?: string;
  region?: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED';
  created_at: string;
  image_url?: string;
  images: { id: string; url: string }[];
  audio: { id: string; url: string }[];
  heritage_story?: string;
  moq?: number;
  lead_time_days?: number;
  catalogue?: {
    id?: string;
    product_id?: string;
    name: string;
    category: string;
    material: string;
    craft: string;
    description: string;
    tags: string[];
  };
  price?: {
    suggested_price: number;
    price_range: [number, number];
    explanation: string;
  };
  pricing?: {
    id: string;
    suggested_price: number;
    price_range_low: number;
    price_range_high: number;
    explanation: string;
  };
  opportunities: {
    buyer_name: string;
    match_score: number;
    location: string;
    requirement: string;
  }[];
}

export interface OpportunityRecord {
  opportunity_id: string;
  product_id: string;
  buyer_name: string;
  company_name: string;
  match_score: number;
  status: string;
  requirement: string;
  quantity?: number;
  budget?: string;
}

// In-Memory persistent data store
const defaultHash = bcrypt.hashSync('Password123', 10);

export const users: UserRecord[] = [
  {
    user_id: 'usr_artisan_sunita',
    name: 'Sunita Devi',
    phone: '9811122233',
    password_hash: defaultHash,
    role: 'ARTISAN',
    region: 'Madhubani, Bihar',
    craft_specialty: 'Mithila / Madhubani Painting',
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    user_id: 'usr_buyer_fabindia',
    name: 'FabIndia Procurement',
    phone: '9844455566',
    password_hash: defaultHash,
    role: 'BUYER',
    company_name: 'FabIndia Overseas Pvt Ltd',
    requirements: 'Handmade terracotta home decor, GI certified textiles, wooden artifacts',
    created_at: new Date('2026-02-01').toISOString(),
  },
  {
    user_id: 'usr_admin_manager',
    name: 'State Handloom Officer',
    phone: '9876543210',
    password_hash: defaultHash,
    role: 'ADMIN',
    region: 'National Capital Region',
    created_at: new Date('2026-01-01').toISOString(),
  },
];

export const products: ProductRecord[] = [
  {
    product_id: 'prod_madhubani_tree',
    artisan_id: 'usr_artisan_sunita',
    artisan_name: 'Sunita Devi',
    region: 'Madhubani, Bihar',
    status: 'READY',
    created_at: new Date('2026-03-01').toISOString(),
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    images: [
      { id: 'img_1', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80' },
      { id: 'img_1b', url: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80' },
    ],
    audio: [
      { id: 'aud_1', url: '/static/audio/sample_audio.mp3' },
    ],
    heritage_story: 'Practiced across 4 generations in Jitwarpur village. Painted with crushed bougainvillea, turmeric paste, and soot mixed with acacia gum on unbleached handmade cotton pulp paper.',
    moq: 15,
    lead_time_days: 14,
    catalogue: {
      id: 'cat_1',
      product_id: 'prod_madhubani_tree',
      name: 'Tree of Life - Madhubani Folk Art on Handmade Rice Paper',
      category: 'Paintings & Wall Art',
      material: 'Organic vegetable dyes, Handmade Rice Paper',
      craft: 'Mithila / Kachni Technique',
      description: 'Hand-painted masterpiece depicting the sacred Tree of Life, crafted using natural bamboo twigs, organic charcoal, turmeric, and indigo extracts.',
      tags: ['GI Tagged', '100% Organic', 'Fair Trade Certified', 'Export Ready'],
    },
    price: {
      suggested_price: 3850,
      price_range: [3400, 4200],
      explanation: 'Priced based on 18 hours of detailed line-work, heritage artisan origin, and export gallery benchmark rates.',
    },
    pricing: {
      id: 'prc_1',
      suggested_price: 3850,
      price_range_low: 3400,
      price_range_high: 4200,
      explanation: 'Priced based on 18 hours of detailed line-work and natural dye preparation.',
    },
    opportunities: [
      {
        buyer_name: 'FabIndia Home Decor',
        match_score: 95,
        location: 'New Delhi, India',
        requirement: 'Seeking 50 authentic framed Madhubani wall panels for upcoming festive catalog.',
      },
      {
        buyer_name: 'The India Craft House',
        match_score: 91,
        location: 'Bengaluru, India',
        requirement: 'High-end artisan pieces for curated boutique exhibitions.',
      },
    ],
  },
  {
    product_id: 'prod_blue_pottery_vase',
    artisan_id: 'usr_artisan_sunita',
    artisan_name: 'Kailash Chand & Guild',
    region: 'Kot Jewar, Jaipur, Rajasthan',
    status: 'READY',
    created_at: new Date('2026-03-05').toISOString(),
    image_url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80',
    images: [
      { id: 'img_2', url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80' },
    ],
    audio: [],
    heritage_story: 'A Turko-Persian craft revived by Maharaja Sawai Ram Singh II. Contains zero clay; molded from Egyptian paste composed of ground quartz, Katira gond gum, and natural minerals fired at 850°C.',
    moq: 25,
    lead_time_days: 21,
    catalogue: {
      id: 'cat_2',
      product_id: 'prod_blue_pottery_vase',
      name: 'Jaipur Blue Pottery Persian Floral Urn Vase',
      category: 'Ceramics & Vases',
      material: 'Quartz powder, Raw Glass, Fuller Earth',
      craft: 'Jaipur Glazed Blue Pottery',
      description: 'No clay used. Made from crushed quartz and fired once at low heat with classic cobalt oxide and copper oxide floral arabesque patterns.',
      tags: ['GI Tagged', 'Lead-Free Glaze', 'Eco-Conscious', 'Hand-Painted'],
    },
    price: {
      suggested_price: 2450,
      price_range: [2100, 2900],
      explanation: 'Benchmark based on artisanal kiln capacity, fragility handling, and luxury interior demand.',
    },
    pricing: {
      id: 'prc_2',
      suggested_price: 2450,
      price_range_low: 2100,
      price_range_high: 2900,
      explanation: 'Based on quartz composition and hand-painted motifs.',
    },
    opportunities: [
      {
        buyer_name: 'Good Earth Luxury Retail',
        match_score: 93,
        location: 'Mumbai, India',
        requirement: 'Looking for 100 table accents for luxury hospitality suites.',
      },
    ],
  },
  {
    product_id: 'prod_channapatna_toy',
    artisan_id: 'usr_artisan_sunita',
    artisan_name: 'Syed Noor & Family',
    region: 'Channapatna (Gombegala Ooru), Karnataka',
    status: 'READY',
    created_at: new Date('2026-03-08').toISOString(),
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    images: [
      { id: 'img_3', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80' },
    ],
    audio: [],
    heritage_story: 'Originated during the reign of Tipu Sultan who invited Persian masters to train local artisans. Buffed on high-speed foot lathe using prickly pandanus leaves for a glass-like organic polish.',
    moq: 50,
    lead_time_days: 10,
    catalogue: {
      id: 'cat_3',
      product_id: 'prod_channapatna_toy',
      name: 'Channapatna Wooden Stacking Toy Train',
      category: 'Eco Toys & Collectibles',
      material: 'Wrightia Tinctoria (Ivory Wood), Vegetable Lacquer',
      craft: 'Channapatna Lacquerware Woodcraft',
      description: 'Safe, non-toxic organic lacquer toys made from seasoned softwood and vegetable-derived food-grade natural pigments (turmeric, indigo, kumkum).',
      tags: ['Non-Toxic', 'Child Safe (EN71)', 'GI Tagged', 'Sustainable Wood'],
    },
    price: {
      suggested_price: 1150,
      price_range: [950, 1350],
      explanation: 'Educational toy market benchmark with non-toxic certified child safety premium.',
    },
    opportunities: [
      {
        buyer_name: 'FirstCry Artisan Line',
        match_score: 89,
        location: 'Pune, India',
        requirement: 'Sustainable Montessori wooden toy collections.',
      },
    ],
  },
  {
    product_id: 'prod_dhokra_horse',
    artisan_id: 'usr_artisan_sunita',
    artisan_name: 'Manglu Kashyap',
    region: 'Bastar, Chhattisgarh',
    status: 'READY',
    created_at: new Date('2026-03-10').toISOString(),
    image_url: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=800&auto=format&fit=crop&q=80',
    images: [
      { id: 'img_4', url: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=800&auto=format&fit=crop&q=80' },
    ],
    audio: [],
    heritage_story: 'Ancient non-ferrous metal casting using the 4,000-year-old lost-wax technique (Cire Perdue) dating back to the Mohenjo-Daro Dancing Girl figurine. Every single mold is broken during casting, guaranteeing uniqueness.',
    moq: 20,
    lead_time_days: 25,
    catalogue: {
      id: 'cat_4',
      product_id: 'prod_dhokra_horse',
      name: 'Bastar Tribal Dhokra Lost-Wax Bell-Metal Steed',
      category: 'Metal Sculptures',
      material: 'Recycled Bell Metal & Pure Beeswax',
      craft: 'Bastar Dhokra Lost-Wax Casting',
      description: 'Hand-threaded wax filaments molded around anthill clay core and fired in pit kilns. Intricate folk motifs honoring tribal forest guardian spirits.',
      tags: ['Ancient Craft (4000 yrs)', 'One-of-a-Kind', 'GI Tagged', 'Solid Brass Alloy'],
    },
    price: {
      suggested_price: 4600,
      price_range: [4100, 5200],
      explanation: 'Reflects unrepeatable individual mold breakdown, beeswax artisan sculpting, and high metal density.',
    },
    opportunities: [
      {
        buyer_name: 'Taj Khazana Boutiques',
        match_score: 96,
        location: 'New Delhi, India',
        requirement: 'Authentic museum-grade tribal bronzes for heritage hotel galleries.',
      },
    ],
  },
  {
    product_id: 'prod_pashmina_stole',
    artisan_id: 'usr_artisan_sunita',
    artisan_name: 'Bashir Ahmad Wani',
    region: 'Srinagar, Jammu & Kashmir',
    status: 'READY',
    created_at: new Date('2026-03-12').toISOString(),
    image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=80',
    images: [
      { id: 'img_5', url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=80' },
    ],
    audio: [],
    heritage_story: 'Handspun from the delicate underfleece of Changthangi mountain goats in Ladakh at 14,000 ft altitude. Embroidered using single-strand needlework (Sozni) over 4 months.',
    moq: 10,
    lead_time_days: 30,
    catalogue: {
      id: 'cat_5',
      product_id: 'prod_pashmina_stole',
      name: 'Kashmiri Hand-Woven Pashmina Sozni Stole',
      category: 'Textiles & Shawls',
      material: '100% Pure Changthangi Cashmere Wool',
      craft: 'Kashmir Handloom Pashmina & Sozni Needlework',
      description: 'Ultra-soft featherweight authentic pashmina hand-woven on traditional wooden looms and finished with intricate Paisley borders.',
      tags: ['GI Certified Kashmir Pashmina', 'Ultra-Soft (12-15 microns)', 'Pure Cashmere', 'Heirloom Quality'],
    },
    price: {
      suggested_price: 16500,
      price_range: [14800, 18500],
      explanation: 'Rare highland wool raw material certified under Pashmina Testing Quality Standards with 120 hours of hand embroidery.',
    },
    opportunities: [
      {
        buyer_name: 'Harrods Artisan Selection',
        match_score: 97,
        location: 'London, UK',
        requirement: 'Export-grade certified Cashmere stoles with verifiable GI provenance testing certificates.',
      },
    ],
  },
];

export const opportunities: OpportunityRecord[] = [
  {
    opportunity_id: 'opp_1',
    product_id: 'prod_madhubani_tree',
    buyer_name: 'Aditi Sharma (Chief Merchandiser)',
    company_name: 'FabIndia Lifestyle',
    match_score: 96,
    status: 'ACTIVE',
    requirement: 'Urgent requirement for 150 authentic folk paintings for national Diwali catalog. Direct procurement with guaranteed upfront 40% advance.',
    quantity: 150,
    budget: '₹5,50,000',
  },
  {
    opportunity_id: 'opp_2',
    product_id: 'prod_blue_pottery_vase',
    buyer_name: 'Marcus Vance',
    company_name: 'Artisan Roots UK / Europe',
    match_score: 92,
    status: 'ACTIVE',
    requirement: 'Export order for 250 handcrafted ceramic vases with export packing for London boutique distribution.',
    quantity: 250,
    budget: '£6,000',
  },
  {
    opportunity_id: 'opp_3',
    product_id: 'prod_channapatna_toy',
    buyer_name: 'Rohan Mehra',
    company_name: 'Cottage Emporium Federation',
    match_score: 88,
    status: 'ACTIVE',
    requirement: 'Bulk corporate gifting order: 500 sets of traditional lacquerware handcrafted wooden games.',
    quantity: 500,
    budget: '₹4,75,000',
  },
];

export const processingJobs = new Map<string, { step: string; progress: number; status: 'PROCESSING' | 'READY' | 'FAILED' }>();
