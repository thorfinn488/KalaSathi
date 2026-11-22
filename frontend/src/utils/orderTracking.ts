import { apiRequest } from '../api/client';

export interface TrackingEvent {
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface DetailedOrder {
  order_id: string;
  product_name: string;
  product_image?: string;
  artisan_name: string;
  cluster_region: string;
  customer_name?: string;
  customer_phone?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method?: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  delivery_status: 'CRAFTING' | 'QUALITY_CHECK' | 'SHIPPED' | 'DELIVERED';
  created_at: string;
  estimated_delivery: string;
  carrier_name?: string;
  awb_number?: string;
  gi_tag_cert?: string;
  escrow_advance_percent?: number;
  timeline: TrackingEvent[];
}

const STORAGE_KEY = 'kalasathi_placed_orders';

// Authentic seed orders representing different stages of GI-tagged craft logistics
export const SEED_TRACKING_ORDERS: DetailedOrder[] = [
  {
    order_id: 'KS-98421',
    product_name: 'Channapatna Wooden Stacking Toy & Rocking Horse',
    product_image: '/images/9fa7d10e-db62-4aa8-b118-a6d10c812d7c.jpg',
    artisan_name: 'Gowda Toy Craftsmen Cooperative',
    cluster_region: 'Channapatna, Karnataka (GI Code: GI-IND-0012)',
    customer_name: 'Rohan Mehta',
    customer_phone: '9811122233',
    quantity: 2,
    unit_price: 1225,
    total_amount: 2450,
    payment_method: 'RAZORPAY_ESCROW',
    payment_status: 'PAID',
    delivery_status: 'SHIPPED',
    created_at: '2026-11-20T10:30:00Z',
    estimated_delivery: '25 Nov 2026 (In 3 Days)',
    carrier_name: 'BlueDart Heritage Express',
    awb_number: 'BD-849201948IN',
    gi_tag_cert: 'GI-KA-CH-9842',
    escrow_advance_percent: 40,
    timeline: [
      {
        title: 'Artisan Cooperative Order Assigned',
        location: 'Channapatna Crafts Cluster, Karnataka',
        timestamp: '20 Nov 2026, 11:15 AM',
        completed: true,
      },
      {
        title: '40% Upfront Material Advance Disbursed to Artisan',
        location: 'Direct UPI Bank Settlement',
        timestamp: '20 Nov 2026, 11:20 AM',
        completed: true,
      },
      {
        title: 'Passed Physical GI Verification & Eco-Lacquer Safety Scan',
        location: 'Karnataka State GI Inspection Centre, Ramanagara',
        timestamp: '21 Nov 2026, 03:45 PM',
        completed: true,
      },
      {
        title: 'Dispatched with Anti-Tamper Heritage Seal',
        location: 'Bengaluru Logistics Hub (Out for Delivery to Hub)',
        timestamp: '22 Nov 2026, 09:10 AM',
        completed: true,
        current: true,
      },
      {
        title: 'Final Buyer Delivery & 60% Escrow Release',
        location: 'Destination Shipping Address',
        timestamp: 'Expected 25 Nov 2026',
        completed: false,
      },
    ],
  },
  {
    order_id: 'KS-78102',
    product_name: 'Madhubani Peacock & Lotus Hand-Painted Scroll',
    product_image: '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg',
    artisan_name: 'Sita Devi Mahila Samooh',
    cluster_region: 'Madhubani, Bihar (GI Code: GI-IND-0044)',
    customer_name: 'Priya Sharma',
    customer_phone: '9805242817',
    quantity: 1,
    unit_price: 14500,
    total_amount: 14500,
    payment_method: 'ESCROW_ADVANCE',
    payment_status: 'PAID',
    delivery_status: 'QUALITY_CHECK',
    created_at: '2026-11-21T08:15:00Z',
    estimated_delivery: '27 Nov 2026 (In 5 Days)',
    carrier_name: 'India Post Speed Post Logistics',
    awb_number: 'IP-992014881IN',
    gi_tag_cert: 'GI-BH-MD-7810',
    escrow_advance_percent: 40,
    timeline: [
      {
        title: 'Natural Mineral Pigments & Handmade Paper Sourced',
        location: 'Ranti Artisan Cooperative, Bihar',
        timestamp: '21 Nov 2026, 09:30 AM',
        completed: true,
      },
      {
        title: 'Hand-Painting Completed by Master Artisan',
        location: 'Madhubani Heritage Cluster Studio',
        timestamp: '21 Nov 2026, 06:00 PM',
        completed: true,
      },
      {
        title: 'GI Tag Provenance Audit & Pigment Fastness Testing',
        location: 'Patna Regional Craft Testing Facility',
        timestamp: '22 Nov 2026, 11:30 AM',
        completed: true,
        current: true,
      },
      {
        title: 'Dispatch Scheduled via Speed Post AWB',
        location: 'Patna GPO Transit Station',
        timestamp: 'Expected 23 Nov 2026',
        completed: false,
      },
      {
        title: 'Delivery & Escrow Settlement',
        location: 'Buyer Destination',
        timestamp: 'Expected 27 Nov 2026',
        completed: false,
      },
    ],
  },
  {
    order_id: 'KS-33491',
    product_name: 'Jaipur Cobalt Blue Pottery Floral Urn',
    product_image: '/images/0a985587-0c5b-4017-b387-ee7e3084f982.jpg',
    artisan_name: 'Neerja Kiln Collective',
    cluster_region: 'Jaipur, Rajasthan (GI Code: GI-IND-0008)',
    customer_name: 'Arun Patel',
    customer_phone: '9876543210',
    quantity: 1,
    unit_price: 6800,
    total_amount: 6800,
    payment_method: 'RAZORPAY_ESCROW',
    payment_status: 'PAID',
    delivery_status: 'DELIVERED',
    created_at: '2026-11-14T14:20:00Z',
    estimated_delivery: '19 Nov 2026 (Delivered)',
    carrier_name: 'Delhivery Fragile Craft Freight',
    awb_number: 'DEL-883719401IN',
    gi_tag_cert: 'GI-RJ-BP-3349',
    escrow_advance_percent: 40,
    timeline: [
      {
        title: 'Order Placed & Egyptian Paste Prepared',
        location: 'Sanganer Kiln Guild, Jaipur',
        timestamp: '14 Nov 2026, 02:45 PM',
        completed: true,
      },
      {
        title: 'Kiln Fired at 850°C with Lead-Free Certification',
        location: 'Neerja Artisans Workshop',
        timestamp: '16 Nov 2026, 04:00 PM',
        completed: true,
      },
      {
        title: 'Dispatched with Custom Shockproof Wooden Crate',
        location: 'Jaipur Air Cargo Hub',
        timestamp: '17 Nov 2026, 10:15 AM',
        completed: true,
      },
      {
        title: 'Delivered & Buyer Zero-Breakage Inspection Cleared',
        location: 'Buyer Destination Address',
        timestamp: '19 Nov 2026, 02:30 PM',
        completed: true,
        current: true,
      },
      {
        title: '100% Escrow Released to Master Artisan Bank Account',
        location: 'KalaSaathi Fair-Trade Treasury',
        timestamp: '19 Nov 2026, 03:00 PM',
        completed: true,
      },
    ],
  },
];

// Helper to retrieve user placed orders from localStorage
export function getLocalPlacedOrders(): DetailedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to save a new or updated order in localStorage
export function saveLocalPlacedOrder(order: any): DetailedOrder {
  const current = getLocalPlacedOrders();
  const orderId = order.order_id || order.id || `KS-${Date.now().toString().slice(-5)}`;

  const detailed: DetailedOrder = {
    order_id: orderId,
    product_name: order.product_name || 'Handcrafted Heritage Masterpiece',
    product_image: order.product_image || '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg',
    artisan_name: order.artisan_name || 'Verified Heritage Artisan Guild',
    cluster_region: order.cluster_region || 'Certified National Craft Cluster',
    customer_name: order.customer_name || 'Verified Buyer',
    customer_phone: order.customer_phone || order.phone || '',
    quantity: order.quantity || 1,
    unit_price: order.unit_price || order.total_amount || 2450,
    total_amount: order.total_amount || 2450,
    payment_method: order.payment_method || 'RAZORPAY_ESCROW',
    payment_status: (order.payment_status || 'PAID') as any,
    delivery_status: (order.delivery_status || 'CRAFTING') as any,
    created_at: order.created_at || new Date().toISOString(),
    estimated_delivery: order.estimated_delivery || 'Within 7 Business Days',
    carrier_name: order.carrier_name || 'India Post Heritage Express',
    awb_number: order.awb_number || `INP-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
    gi_tag_cert: order.gi_tag_cert || `GI-IND-${Math.floor(1000 + Math.random() * 9000)}`,
    escrow_advance_percent: 40,
    timeline: [
      {
        title: 'Order Received & 40% Escrow Advance Allocated',
        location: 'KalaSaathi Cooperative Escrow',
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        completed: true,
        current: true,
      },
      {
        title: 'Master Artisan Crafting & Raw Material Curation',
        location: 'Heritage Cluster Studio',
        timestamp: 'In Progress',
        completed: false,
      },
      {
        title: 'Geographical Indication Quality & Provenance Audit',
        location: 'Regional GI Testing Laboratory',
        timestamp: 'Scheduled',
        completed: false,
      },
      {
        title: 'Dispatched via Certified Insured Courier',
        location: 'Logistics Hub',
        timestamp: 'Pending Handover',
        completed: false,
      },
      {
        title: 'Final Delivery & Remaining 60% Escrow Release',
        location: 'Destination Address',
        timestamp: 'Expected 7 Days',
        completed: false,
      },
    ],
  };

  const filtered = current.filter((o) => o.order_id !== orderId);
  const updated = [detailed, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return detailed;
}

// Convert server response into DetailedOrder format
function normalizeServerOrder(serverOrder: any): DetailedOrder {
  const status = (serverOrder.delivery_status || 'CRAFTING').toUpperCase();
  const orderId = serverOrder.order_id || serverOrder.id;

  const stageIndex =
    status === 'DELIVERED' ? 4 : status === 'SHIPPED' ? 3 : status === 'QUALITY_CHECK' ? 2 : 1;

  return {
    order_id: orderId,
    product_name: serverOrder.product_name || 'Handcrafted Heritage Piece',
    product_image: serverOrder.product_image || '/images/2adeba65-a3b6-448a-88bb-71068feed09a.jpg',
    artisan_name: serverOrder.artisan_name || 'Heritage Craft Cooperative',
    cluster_region: serverOrder.region || 'National GI Craft Cluster',
    customer_name: serverOrder.customer_name || 'Registered Patron',
    customer_phone: serverOrder.customer_phone || '',
    quantity: serverOrder.quantity || 1,
    unit_price: serverOrder.unit_price || serverOrder.total_amount || 0,
    total_amount: serverOrder.total_amount || 0,
    payment_method: serverOrder.payment_method || 'ESCROW_PROTECTED',
    payment_status: (serverOrder.payment_status || 'PAID') as any,
    delivery_status: (serverOrder.delivery_status || 'CRAFTING') as any,
    created_at: serverOrder.created_at || new Date().toISOString(),
    estimated_delivery: serverOrder.estimated_delivery || 'Within 5-7 Business Days',
    carrier_name: 'India Post Speed Post / BlueDart Logistics',
    awb_number: `INP-${Math.abs(orderId.hashCode ? orderId.hashCode() : 84920194)}IN`,
    gi_tag_cert: `GI-CERT-${orderId.slice(-4)}`,
    escrow_advance_percent: 40,
    timeline: [
      {
        title: 'Artisan Allocated & 40% Material Advance Disbursed',
        location: 'KalaSaathi Cooperative Escrow',
        timestamp: serverOrder.created_at ? new Date(serverOrder.created_at).toLocaleString() : 'Confirmed',
        completed: stageIndex >= 1,
        current: stageIndex === 1,
      },
      {
        title: 'Geographical Indication Quality & Physical Testing',
        location: 'Regional Craft Inspection Lab',
        timestamp: stageIndex >= 2 ? 'Audit Passed' : 'In Progress',
        completed: stageIndex >= 2,
        current: stageIndex === 2,
      },
      {
        title: 'Dispatched with Tamper-Proof Seal & Courier AWB',
        location: 'Central Logistics Dispatch Hub',
        timestamp: stageIndex >= 3 ? 'In Transit' : 'Scheduled',
        completed: stageIndex >= 3,
        current: stageIndex === 3,
      },
      {
        title: 'Delivered & 60% Escrow Released to Master Artisan',
        location: 'Destination Address',
        timestamp: stageIndex >= 4 ? 'Delivery Completed' : 'Pending Delivery',
        completed: stageIndex >= 4,
        current: stageIndex === 4,
      },
    ],
  };
}

// Master search function: searches server API first, falls back to local and seeds
export async function searchTrackingOrders(query: string): Promise<DetailedOrder[]> {
  const cleanQuery = query.trim().toUpperCase();
  const digitsOnly = query.replace(/\D/g, '');

  let serverResults: DetailedOrder[] = [];

  try {
    const raw = await apiRequest<any[]>(`/orders/track/${encodeURIComponent(query.trim())}`);
    if (Array.isArray(raw) && raw.length > 0) {
      serverResults = raw.map(normalizeServerOrder);
    }
  } catch (err) {
    // Backend may be offline or 404 in preview/demo mode
    console.info('Server track query returned no results, consulting local and seed catalog:', err);
  }

  // Local storage orders
  const localOrders = getLocalPlacedOrders();

  // Combine seed orders and local orders
  const allOffline = [...localOrders, ...SEED_TRACKING_ORDERS];

  const matchedOffline = allOffline.filter((order) => {
    const orderIdMatch = order.order_id.toUpperCase().includes(cleanQuery);
    const phoneMatch =
      digitsOnly.length >= 4 && order.customer_phone?.replace(/\D/g, '').includes(digitsOnly);
    const artisanMatch = order.artisan_name.toUpperCase().includes(cleanQuery);
    const productMatch = order.product_name.toUpperCase().includes(cleanQuery);
    return orderIdMatch || phoneMatch || artisanMatch || productMatch;
  });

  // Deduplicate by order_id
  const seen = new Set<string>();
  const combined: DetailedOrder[] = [];

  for (const item of [...serverResults, ...matchedOffline]) {
    if (!seen.has(item.order_id)) {
      seen.add(item.order_id);
      combined.push(item);
    }
  }

  return combined;
}
