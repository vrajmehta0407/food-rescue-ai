import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { SurplusCard } from './SurplusCard';
import { SurplusListing } from '../types';

interface ListingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  donorOrgId?: string;
}

export const ListingWizardModal: React.FC<ListingWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  donorOrgId,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    food_category: 'prepared_meals',
    description: '',
    quantity_value: 30,
    quantity_unit: 'portions',
    storage_requirement: 'refrigerated',
    pickup_hours_from_now: 6,
    allergens: [] as string[],
    dietary_tags: [] as string[],
    notes: '',
    publish_immediately: true,
  });

  if (!isOpen) return null;

  const allergenOptions = ['gluten', 'dairy', 'nuts', 'eggs', 'fish', 'soy', 'sesame'];
  const dietaryOptions = ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free'];

  const toggleAllergen = (al: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(al)
        ? prev.allergens.filter(x => x !== al)
        : [...prev.allergens, al]
    }));
  };

  const toggleDietary = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(x => x !== tag)
        : [...prev.dietary_tags, tag]
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.title.trim()) {
      setError('Please provide a descriptive title for the food item.');
      return;
    }
    if (step === 2 && (!formData.quantity_value || formData.quantity_value <= 0)) {
      setError('Please enter a valid positive quantity.');
      return;
    }
    setError(null);
    setStep(s => Math.min(4, s + 1));
  };

  const handleSubmit = async (publish: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + formData.pickup_hours_from_now * 60 * 60 * 1000);

      const payload = {
        title: formData.title,
        food_category: formData.food_category,
        description: formData.description,
        quantity_value: Number(formData.quantity_value),
        quantity_unit: formData.quantity_unit,
        storage_requirement: formData.storage_requirement,
        pickup_deadline_at: deadline.toISOString(),
        allergens: formData.allergens,
        dietary_tags: formData.dietary_tags,
        notes: formData.notes,
        publish_immediately: publish,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save surplus listing.');
    } finally {
      setLoading(false);
    }
  };

  // Construct mock listing for preview
  const previewListing: SurplusListing = {
    id: 'preview-id',
    donor_organization_id: donorOrgId || 'org-id',
    title: formData.title || 'Untitled Surplus Food Offer',
    food_category: formData.food_category,
    description: formData.description || 'Nutritious edible surplus packaged for swift community handoff.',
    quantity_value: formData.quantity_value || 10,
    quantity_unit: formData.quantity_unit,
    pickup_deadline_at: new Date(Date.now() + formData.pickup_hours_from_now * 3600 * 1000).toISOString(),
    storage_requirement: formData.storage_requirement as any,
    allergens: formData.allergens,
    dietary_tags: formData.dietary_tags,
    status: formData.publish_immediately ? 'available' : 'draft',
    notes: formData.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-paper w-full max-w-2xl rounded-3xl shadow-floating border border-surface-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-cream-50">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Publish Surplus Listing</h2>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4].map(num => (
                <span 
                  key={num}
                  className={`w-6 h-1 rounded-full ${num <= step ? 'bg-forest' : 'bg-surface-border'}`}
                />
              ))}
              <span className="text-[11px] text-ink-muted ml-1">Step {step} of 4</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-200 text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-coral/10 border border-coral/30 flex items-center gap-2 text-xs text-coral font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: Food Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Listing Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Roasted Mediterranean Herb Chicken with Wild Rice"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Food Category *
                </label>
                <select
                  value={formData.food_category}
                  onChange={e => setFormData({ ...formData, food_category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest capitalize"
                >
                  <option value="prepared_meals">Prepared Meals & Catering</option>
                  <option value="bakery">Bakery & Pastries</option>
                  <option value="produce">Fresh Produce / Fruits & Veg</option>
                  <option value="dairy">Dairy & Eggs</option>
                  <option value="packaged">Packaged Dry Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Description & Preparation Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail ingredients, how it was packaged, and serving notes..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Quantity, Packaging & Storage */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity_value}
                    onChange={e => setFormData({ ...formData, quantity_value: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Unit *
                  </label>
                  <select
                    value={formData.quantity_unit}
                    onChange={e => setFormData({ ...formData, quantity_unit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <option value="portions">Portions / Meals</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="packs">Packs</option>
                    <option value="crates">Crates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Storage & Handling Requirement *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ambient', label: 'Ambient / Dry (Room Temp)' },
                    { id: 'refrigerated', label: 'Refrigerated (0 - 4°C)' },
                    { id: 'hot_holding', label: 'Hot Holding (60°C+)' },
                    { id: 'frozen', label: 'Frozen (-18°C)' },
                  ].map(item => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormData({ ...formData, storage_requirement: item.id as any })}
                      className={`p-3 rounded-xl border text-xs text-left font-semibold transition-all ${
                        formData.storage_requirement === item.id
                          ? 'border-forest bg-forest/10 text-forest shadow-sm'
                          : 'border-surface-border bg-cream-50 text-ink-muted hover:border-forest/40'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Dietary Attributes
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleDietary(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        formData.dietary_tags.includes(tag)
                          ? 'bg-leaf text-white border-leaf'
                          : 'bg-cream-50 text-ink-muted border-surface-border hover:bg-cream-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Allergens Present
                </label>
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map(al => (
                    <button
                      type="button"
                      key={al}
                      onClick={() => toggleAllergen(al)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        formData.allergens.includes(al)
                          ? 'bg-coral text-white border-coral'
                          : 'bg-cream-50 text-ink-muted border-surface-border hover:bg-cream-100'
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pickup Schedule & Instructions */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Pickup Deadline Window (Hours From Now) *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 12, 24].map(h => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setFormData({ ...formData, pickup_hours_from_now: h })}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.pickup_hours_from_now === h
                          ? 'border-forest bg-forest text-white shadow-sm'
                          : 'border-surface-border bg-cream-50 text-ink-muted hover:border-forest/40'
                      }`}
                    >
                      Within {h}h
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-ink-muted block mt-1">
                  Surplus must be collected before food safety limits.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Logistics Instructions & Entry Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please ring rear delivery doorbell on alleyway. Bring standard food-grade cambro boxes."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-surface-border bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Live Preview & Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-forest">
                <Eye className="w-4 h-4" />
                <span>Recipient Visual Preview</span>
              </div>
              <p className="text-xs text-ink-muted">
                Here is exactly how verified community kitchens and shelters will see your surplus listing on their matching feeds.
              </p>

              <div className="max-w-md mx-auto">
                <SurplusCard listing={previewListing} onSelect={() => {}} />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-surface-border bg-cream-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3">
            {step === 4 ? (
              <>
                <button
                  disabled={loading}
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold text-ink-muted hover:bg-cream-100 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleSubmit(true)}
                  className="px-6 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-tactile flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-citrus" />
                  <span>{loading ? 'Publishing...' : 'Publish to Rescue Network'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-tactile flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

