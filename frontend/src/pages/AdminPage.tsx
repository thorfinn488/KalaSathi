import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { ShieldCheck, Users, ShoppingBag, Building2, MapPin } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [artisans, setArtisans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [artData, prodData, oppData] = await Promise.all([
          apiRequest<any[]>('/admin/artisans'),
          apiRequest<any[]>('/admin/products'),
          apiRequest<any[]>('/admin/opportunities'),
        ]);
        setArtisans(artData || []);
        setProducts(prodData || []);
        setOpportunities(oppData || []);
      } catch (err) {
        console.error('Admin data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) return <div className="text-center py-20 text-stone-500 font-serif text-lg">Loading admin registry...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="relative overflow-hidden bg-heritage-navy p-8 rounded-3xl text-white shadow-xl flex items-center gap-5 border border-heritage-sand/20">
        <div className="absolute inset-0 bg-hero-woven-bg opacity-15 pointer-events-none" />
        <div className="relative z-10 p-3.5 bg-white/10 rounded-2xl border border-white/20 text-heritage-gold shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black font-serif text-white">System Admin Registry</h1>
          <p className="text-xs text-stone-300">Oversee registered artisans, catalogued products, and wholesale enterprise linkages.</p>
        </div>
      </div>

      {/* Artisans List */}
      <div className="bg-white rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-serif text-heritage-navy flex items-center gap-2">
          <Users className="w-5 h-5 text-heritage-terracotta" /> Registered Artisans ({artisans.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artisans.map((art) => (
            <div key={art.artisan_id} className="p-4 rounded-2xl border border-heritage-sand bg-heritage-ivory space-y-1 shadow-sm">
              <span className="font-bold font-serif text-heritage-navy text-sm block">{art.name}</span>
              <span className="text-xs text-stone-600 block font-medium">Craft: {art.craft_specialty}</span>
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-heritage-terracotta" /> {art.region} • Phone: {art.phone}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Overview */}
      <div className="bg-white rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-serif text-heritage-navy flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-heritage-gold" /> Catalogued Products ({products.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-heritage-ivory text-heritage-navy font-bold uppercase text-[10px] tracking-wider border-b border-heritage-sand">
              <tr>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Artisan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Suggested Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-sand/60">
              {products.map((p) => (
                <tr key={p.product_id} className="hover:bg-heritage-ivory/50 transition-colors">
                  <td className="p-3.5 font-bold font-serif text-heritage-navy">{p.catalogue_name || 'Draft Product'}</td>
                  <td className="p-3.5 font-medium text-stone-700">{p.artisan_name}</td>
                  <td className="p-3.5">
                    <span className="gi-badge">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-heritage-terracotta">₹{p.suggested_price ? p.suggested_price.toLocaleString('en-IN') : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wholesale Requests */}
      <div className="bg-white rounded-3xl border border-heritage-sand p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold font-serif text-heritage-navy flex items-center gap-2">
          <Building2 className="w-5 h-5 text-heritage-terracotta" /> Wholesale Requests ({opportunities.length})
        </h2>
        {opportunities.length === 0 ? (
          <p className="text-sm text-stone-500 italic">No wholesale requests have been received yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {opportunities.map((request) => (
              <article key={request.opportunity_id} className="rounded-2xl border border-heritage-sand bg-heritage-ivory p-4 space-y-2 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold font-serif text-heritage-navy">{request.company_name || request.buyer_name}</h3>
                    <p className="text-xs text-stone-500">{request.buyer_name} · {request.buyer_contact || 'No contact supplied'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white border border-heritage-sand px-2.5 py-1 text-[10px] font-bold text-heritage-terracotta">
                    {request.quantity ?? '—'} units · {request.status}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-stone-700">{request.requirement}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
