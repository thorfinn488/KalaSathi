import React, { useState } from 'react';
import { MapPin, Sparkles, ArrowRight, ShieldCheck, Search, Users, ExternalLink, Award } from 'lucide-react';

export interface CraftCluster {
  id: string;
  name: string;
  state: string;
  giTag: string;
  coordinates: { x: number; y: number }; // percentage position on stylized SVG map
  craftType: string;
  materials: string;
  artisanCount: number;
  description: string;
  highlights: string[];
  sampleImage: string;
}

export const INDIAN_CRAFT_CLUSTERS: CraftCluster[] = [
  {
    id: 'madhubani',
    name: 'Mithila & Madhubani Art',
    state: 'Bihar',
    giTag: 'GI-2007-IN-037',
    coordinates: { x: 67, y: 38 },
    craftType: 'Folk Painting & Murals',
    materials: 'Natural twigs, cotton rags, cow dung wash, mineral & vegetable pigments',
    artisanCount: 4200,
    description: 'Characterized by geometrical patterns and mythological themes originating in the Mithila kingdom.',
    highlights: ['100% natural organic dyes', 'Ancestral Kachni & Bharni line work', 'Women artisan collective led'],
    sampleImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'channapatna',
    name: 'Channapatna Wooden Toys',
    state: 'Karnataka',
    giTag: 'GI-2005-IN-012',
    coordinates: { x: 38, y: 76 },
    craftType: 'Lacquered Turned Wood',
    materials: 'Wrightia tinctoria (Aale Mara / ivory wood), non-toxic vegetable dyes',
    artisanCount: 3100,
    description: 'Popularly known as Gombegala Ooru (toy-town), renowned for child-safe turned wooden toys with natural lacquer polish.',
    highlights: ['Non-toxic organic child-safe vegetable lacquer', 'Hand-lathed Wrightia wood', 'Tipu Sultan historic legacy'],
    sampleImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'pochampally',
    name: 'Pochampally Ikat Handloom',
    state: 'Telangana',
    giTag: 'GI-2004-IN-002',
    coordinates: { x: 48, y: 64 },
    craftType: 'Resist-Dyed Silk & Cotton Weaving',
    materials: 'Mulberry silk, fine combed cotton, azo-free vat dyes',
    artisanCount: 5400,
    description: 'Geometric blur patterns achieved through tie-and-dye warp and weft alignment in Bhoodan Pochampally.',
    highlights: ['Double Ikat complex mathematical weaves', 'UNESCO Best Tourism Village recognized', 'Zero mechanical automation'],
    sampleImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'pashmina',
    name: 'Kashmiri Pashmina & Sozni',
    state: 'Jammu & Kashmir',
    giTag: 'GI-2006-IN-046',
    coordinates: { x: 33, y: 15 },
    craftType: 'Fine Wool Spinning & Needle Embroidery',
    materials: 'Changthangi goat underfleece (Cashmere fiber, 12-15 microns), silk floss',
    artisanCount: 6800,
    description: 'Ultra-luxurious, featherlight warmth hand-spun on traditional yender wheels and needle-embroidered by masters.',
    highlights: ['Sub-15 micron fineness test', 'Hand charkha spun yarn', 'Sozni needlework taking up to 1 year per shawl'],
    sampleImage: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bagru',
    name: 'Bagru & Dabu Mud Resist Block Print',
    state: 'Rajasthan',
    giTag: 'GI-2008-IN-101',
    coordinates: { x: 32, y: 40 },
    craftType: 'Natural Mud Resist Block Printing',
    materials: 'Dabu mud paste, Harda seed myrobalan, indigo fermentation vats',
    artisanCount: 2900,
    description: 'Chippa community block print tradition utilizing clay paste resists and sun bleaching in riverbeds.',
    highlights: ['Fermented natural indigo vats', 'Teakwood engraved printing blocks', 'Eco-friendly biodegradable runoff'],
    sampleImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bidriware',
    name: 'Bidriware Inlaid Metalcraft',
    state: 'Karnataka',
    giTag: 'GI-2005-IN-015',
    coordinates: { x: 44, y: 62 },
    craftType: 'Zinc-Copper Alloy Silver Inlay',
    materials: 'Zinc, copper, 99.9% pure silver inlay wire, Bidar Fort soil darkening flux',
    artisanCount: 1200,
    description: 'Persian-Bahmani metal art where pure silver wires are hammered into hand-carved blackened zinc alloy.',
    highlights: ['Pure silver wire inlay', 'Unique oxidization with Bidar Fort mud', 'Corrosion-resistant permanent jet black finish'],
    sampleImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80'
  }
];

interface CraftMapProps {
  onSelectCluster?: (cluster: CraftCluster) => void;
  onExploreMarketplace?: () => void;
}

export const HeritageMapPage: React.FC<CraftMapProps> = ({ onSelectCluster, onExploreMarketplace }) => {
  const [selectedCluster, setSelectedCluster] = useState<CraftCluster>(INDIAN_CRAFT_CLUSTERS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClusters = INDIAN_CRAFT_CLUSTERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.craftType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-heritage-sand/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-ivory border border-heritage-sand text-heritage-terracotta text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-heritage-gold" /> Ministry of Textiles &amp; GI Cluster Mapping
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-heritage-navy font-serif">
            Living Heritage &amp; Craft Clusters
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mt-2 leading-relaxed">
            Trace the roots of India's ancestral crafts directly to the clusters where master artisans produce GI-certified handmade treasures.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by craft, state, or GI..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-heritage-sand text-xs text-heritage-navy placeholder-stone-400 focus:outline-none focus:border-heritage-gold transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Stylized Geographical Map Canvas (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-heritage-sand rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-heritage-terracotta font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-heritage-terracotta" /> Interactive Cluster Pinpoint
            </span>
            <span className="text-[11px] text-stone-400">Click a node to view provenance</span>
          </div>

          {/* SVG Map of India Stylized Representation */}
          <div className="relative w-full aspect-[4/3] bg-heritage-ivory rounded-2xl border border-heritage-sand/60 flex items-center justify-center p-4">
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full max-h-[460px] drop-shadow select-none"
            >
              {/* Generalized decorative subcontinent outline */}
              <path
                d="M 35 12 
                   Q 40 8 45 14 
                   Q 52 20 48 28 
                   Q 65 30 75 35 
                   Q 80 42 70 48 
                   Q 62 55 58 68 
                   Q 48 88 42 90 
                   Q 34 85 30 70 
                   Q 22 55 25 42 
                   Q 22 30 32 20 Z"
                fill="rgba(27, 35, 82, 0.08)"
                stroke="#B8893A"
                strokeWidth="1"
                strokeDasharray="2 1"
              />

              {/* Cluster Map Pins */}
              {INDIAN_CRAFT_CLUSTERS.map((cluster) => {
                const isSelected = selectedCluster.id === cluster.id;
                return (
                  <g 
                    key={cluster.id} 
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedCluster(cluster);
                      if (onSelectCluster) onSelectCluster(cluster);
                    }}
                  >
                    {/* Pulsing ring for selected pin */}
                    {isSelected && (
                      <circle
                        cx={cluster.coordinates.x}
                        cy={cluster.coordinates.y}
                        r="6"
                        className="animate-ping opacity-30 fill-heritage-terracotta"
                      />
                    )}
                    
                    <circle
                      cx={cluster.coordinates.x}
                      cy={cluster.coordinates.y}
                      r={isSelected ? 4 : 2.8}
                      className={`transition-all duration-300 ${
                        isSelected 
                          ? 'fill-heritage-terracotta stroke-white stroke-[1.5]' 
                          : 'fill-heritage-navy group-hover:fill-heritage-gold'
                      }`}
                    />

                    {/* Pin Label */}
                    <text
                      x={cluster.coordinates.x + 3.5}
                      y={cluster.coordinates.y + 1.5}
                      fontSize="3.2"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fill={isSelected ? '#6E2233' : '#1B2352'}
                      className="pointer-events-none drop-shadow-sm font-sans"
                    >
                      {cluster.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 border border-heritage-sand rounded-xl px-3 py-1.5 text-[10px] text-stone-600 flex items-center gap-3 shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-heritage-terracotta" /> Active Selected Cluster
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-heritage-navy" /> GI Heritage Region
              </span>
            </div>
          </div>

          {/* Horizontal Cluster Pill Selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filteredClusters.map((cluster) => (
              <button
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCluster.id === cluster.id
                    ? 'bg-heritage-navy text-white shadow-sm'
                    : 'bg-heritage-ivory text-heritage-navy border border-heritage-sand hover:bg-stone-100'
                }`}
              >
                <MapPin className="w-3 h-3 text-heritage-terracotta" />
                {cluster.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Cluster Deep-Dive & Provenance Card (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-heritage-sand rounded-3xl p-6 sm:p-7 space-y-6 shadow-md relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] text-heritage-terracotta font-bold uppercase tracking-wider block">
                {selectedCluster.giTag} · {selectedCluster.state}
              </span>
              <h2 className="text-2xl font-black text-heritage-navy font-serif mt-1">
                {selectedCluster.name}
              </h2>
            </div>
            <div className="p-2 bg-heritage-ivory rounded-2xl border border-heritage-sand text-heritage-gold">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            {selectedCluster.description}
          </p>

          {/* Cluster Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-heritage-ivory p-4 rounded-2xl border border-heritage-sand/70 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Artisan Guild</span>
              <strong className="text-heritage-navy text-sm flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-heritage-gold" />
                {selectedCluster.artisanCount.toLocaleString()} Masters
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Craft Category</span>
              <strong className="text-heritage-terracotta text-sm block mt-0.5 truncate">
                {selectedCluster.craftType}
              </strong>
            </div>

            <div className="col-span-2 border-t border-heritage-sand/60 pt-2">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Ancestral Raw Materials</span>
              <span className="text-stone-700 text-xs block mt-0.5">
                {selectedCluster.materials}
              </span>
            </div>
          </div>

          {/* Hallmark Highlights */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-heritage-gold font-bold block">
              Authenticity Hallmarks
            </span>
            <div className="space-y-1.5">
              {selectedCluster.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-heritage-sand/60 pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (onExploreMarketplace) onExploreMarketplace();
              }}
              className="btn btn-primary flex-1 py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <span>Explore Cluster Crafts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
