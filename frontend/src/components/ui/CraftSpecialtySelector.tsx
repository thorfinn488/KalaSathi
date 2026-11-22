import React, { useState } from 'react';
import { Palette, Plus, X, Globe, Sparkles, Check } from 'lucide-react';

interface CraftSpecialtySelectorProps {
  selectedCrafts: string[];
  onChange: (crafts: string[]) => void;
}

// Popular craft specialties with English and Native Mother Tongue representations
const PRESET_CRAFTS = [
  { id: 'madhubani', nameEn: 'Madhubani Painting', nameNative: 'मधुबनी चित्रकला', region: 'Bihar' },
  { id: 'phulkari', nameEn: 'Phulkari Embroidery', nameNative: 'ਫੁਲਕਾਰੀ / फुलकारी', region: 'Punjab' },
  { id: 'blue_pottery', nameEn: 'Blue Pottery', nameNative: 'ब्लू पॉटरी', region: 'Jaipur' },
  { id: 'channapatna', nameEn: 'Channapatna Woodcraft', nameNative: 'ಚನ್ನಪಟ್ಟಣ ಗೊಂಬೆಗಳು', region: 'Karnataka' },
  { id: 'dhokra', nameEn: 'Bastar Dhokra', nameNative: 'बस्तर ढोकरा कांस्य', region: 'Chhattisgarh' },
  { id: 'pashmina', nameEn: 'Kashmir Pashmina', nameNative: 'کشمیر پشمینہ / पश्मीना', region: 'Kashmir' },
  { id: 'pattachitra', nameEn: 'Pattachitra', nameNative: 'ପଟ୍ଟଚିତ୍ର / पट्टचित्र', region: 'Odisha' },
  { id: 'kalamkari', nameEn: 'Kalamkari Handblock', nameNative: 'కలంకారీ / कलमकारी', region: 'Andhra' },
  { id: 'bidriware', nameEn: 'Bidriware Inlay', nameNative: 'ಬಿದ್ರಿ ಕಲೆ / बिदरी', region: 'Karnataka' },
  { id: 'zardozi', nameEn: 'Zari Zardozi', nameNative: 'ज़रदोज़ी / زردوزی', region: 'Uttar Pradesh' },
  { id: 'warli', nameEn: 'Warli Folk Art', nameNative: 'वारली चित्रकला', region: 'Maharashtra' },
  { id: 'bandhani', nameEn: 'Bandhani Tie-Dye', nameNative: 'બાંધણી / बांधनी', region: 'Gujarat' },
  { id: 'terracotta', nameEn: 'Terracotta Sculpting', nameNative: 'टेराकोटा मिट्टी कला', region: 'Bengal' },
  { id: 'toda', nameEn: 'Toda Embroidery', nameNative: 'தோடா எம்ப்ராய்டரி', region: 'Tamil Nadu' },
  { id: 'aranmula', nameEn: 'Aranmula Metal Mirror', nameNative: 'ആറന്മുള കണ്ണാടി', region: 'Kerala' },
];

const LANGUAGE_PROMPTS = [
  { label: 'हिंदी', placeholder: 'उदा. मीनाकारी, जरदोजी, सुजनी...' },
  { label: 'বাংলা', placeholder: 'উদাঃ কাঁথা স্টিচ, ডোকরা...' },
  { label: 'ਪੰਜਾਬੀ', placeholder: 'ਉਦਾਹਰਣ: ਫੁਲਕਾਰੀ, ਤਿੱਲਾ ਜੁੱਤੀ...' },
  { label: 'ગુજરાતી', placeholder: 'દા.ત. બાંધણી, અજરખ...' },
  { label: 'मराठी', placeholder: 'उदा. पैठणी, वारली...' },
  { label: 'தமிழ்', placeholder: 'உதா: தஞ்சாவூர் தட்டு...' },
  { label: 'తెలుగు', placeholder: 'ఉదా: కలంకారీ, కొండపల్లి...' },
  { label: 'ಕನ್ನಡ', placeholder: 'ಉದಾ: ಚನ್ನಪಟ್ಟಣ, ಬಿದ್ರಿ...' },
  { label: 'English', placeholder: 'e.g. Wood Inlay, Handloom Silk...' },
];

export const CraftSpecialtySelector: React.FC<CraftSpecialtySelectorProps> = ({
  selectedCrafts,
  onChange,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [activeLang, setActiveLang] = useState('हिंदी');

  const togglePreset = (craftLabel: string) => {
    if (selectedCrafts.includes(craftLabel)) {
      onChange(selectedCrafts.filter((c) => c !== craftLabel));
    } else {
      onChange([...selectedCrafts, craftLabel]);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    if (!selectedCrafts.includes(clean)) {
      onChange([...selectedCrafts, clean]);
    }
    setCustomInput('');
  };

  const removeCraft = (craftToRemove: string) => {
    onChange(selectedCrafts.filter((c) => c !== craftToRemove));
  };

  const currentPlaceholder =
    LANGUAGE_PROMPTS.find((l) => l.label === activeLang)?.placeholder ||
    'अपनी मातृभाषा में कला लिखें (Write craft in mother tongue)...';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-terracotta-500" />
          <span>Craft Specialties (हस्तशिल्प कला - एक या अधिक चुनें)</span>
        </label>
        <span className="text-[10px] font-bold text-terracotta-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          {selectedCrafts.length} Selected
        </span>
      </div>

      {/* Selected Craft Tags (Pills) */}
      {selectedCrafts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-amber-50/60 border border-amber-200/80 animate-in fade-in duration-200">
          {selectedCrafts.map((craft) => (
            <span
              key={craft}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-heritage-navy text-white text-xs font-semibold shadow-xs animate-in zoom-in-95"
            >
              <span>{craft}</span>
              <button
                type="button"
                onClick={() => removeCraft(craft)}
                className="w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-amber-300"
                aria-label={`Remove ${craft}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Mother Tongue Input Box */}
      <div className="rounded-2xl border border-heritage-border bg-white p-3 space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span className="font-bold text-stone-600 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigoCraft-600" />
            <span>अपनी मातृभाषा में लिखें (Write in Mother Tongue):</span>
          </span>

          {/* Quick Script Selector Chips */}
          <div className="flex flex-wrap items-center gap-1">
            {LANGUAGE_PROMPTS.map((lang) => (
              <button
                key={lang.label}
                type="button"
                onClick={() => setActiveLang(lang.label)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activeLang === lang.label
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            placeholder={currentPlaceholder}
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-heritage-bg/40 text-heritage-navy font-medium text-xs focus:border-terracotta-500 focus:bg-white focus:ring-2 focus:ring-terracotta-500/20 outline-none transition-all placeholder-stone-400"
          />
          <button
            type="button"
            onClick={() => handleAddCustom()}
            disabled={!customInput.trim()}
            className="px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Popular Preset Craft Chips (Click to Multi-Select) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick Select from Heritage Clusters (क्लिक करके चुनें):</span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 scrollbar-thin">
          {PRESET_CRAFTS.map((craft) => {
            const displayLabel = `${craft.nameEn} · ${craft.nameNative}`;
            const isSelected = selectedCrafts.includes(displayLabel);

            return (
              <button
                key={craft.id}
                type="button"
                onClick={() => togglePreset(displayLabel)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border text-left transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-terracotta-500 bg-terracotta-500 text-white shadow-xs font-bold'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:bg-amber-50/40'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3 h-3 text-white shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                )}
                <span>{craft.nameEn}</span>
                <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-stone-400'}`}>
                  ({craft.nameNative})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
