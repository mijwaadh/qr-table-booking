import React, { useState } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import TopNavBar from '../components/TopNavBar';
import { 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Upload, 
  X,
  UtensilsCrossed
} from 'lucide-react';
import type { MenuItem } from '../types';

export const Menu: React.FC = () => {
  const { menuItems, addMenuItem, toggleMenuItemAvailability, deleteMenuItem, updateMenuItem } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Starters' | 'Main Course' | 'Beverages' | 'Desserts'>('All');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Starters' | 'Main Course' | 'Beverages' | 'Desserts'>('Main Course');
  const [price, setPrice] = useState(10);
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setImageUrl(compressedDataUrl);
        } else {
          setImageUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Filtering
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editItemId) {
      const existing = menuItems.find(i => i.id === editItemId);
      if (existing) {
        const success = await updateMenuItem({
          ...existing,
          name,
          price,
          description,
          category,
          type: isVeg ? 'VEG' : 'NON-VEG',
          imageUrl: imageUrl || existing.imageUrl
        });
        if (success) {
          alert('Menu item updated successfully!');
          handleCloseDrawer();
        }
      }
    } else {
      const success = await addMenuItem({
        name,
        price,
        description,
        category,
        available: true,
        type: isVeg ? 'VEG' : 'NON-VEG',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300'
      });
      if (success) {
        alert('Menu item added successfully!');
        handleCloseDrawer();
      }
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditItemId(item.id);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setDescription(item.description);
    setIsVeg(item.type === 'VEG');
    setImageUrl(item.imageUrl || '');
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setName('');
    setDescription('');
    setPrice(10);
    setIsVeg(true);
    setImageUrl('');
    setEditItemId(null);
    setShowDrawer(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
      {/* Top Navigation */}
      <TopNavBar title="Menu Management" onSearchChange={setSearchTerm} />

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-container-margin">
        <div className="max-w-[1440px] mx-auto space-y-lg">
          
          {/* Category Tabs & Header */}
          <div className="flex items-center justify-between mb-xl gap-lg flex-wrap">
            <div className="flex items-center gap-xs p-1 bg-surface-container-low rounded-xl">
              {(['All', 'Starters', 'Main Course', 'Beverages', 'Desserts'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-xl py-2 rounded-lg font-label-md text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-surface-container-highest text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {cat === 'Main Course' ? 'Mains' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-md text-outline font-label-sm text-xs">
              <span>Showing {filteredItems.length} items</span>
              <button 
                onClick={() => alert('Filter options opened')}
                className="flex items-center gap-1 border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-all font-semibold"
              >
                <Filter className="w-4 h-4" />
                <span>Sort</span>
              </button>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter mb-3xl">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-outline-variant rounded-xl overflow-hidden card-shadow group transition-transform hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden bg-surface-container-low">
                  {item.imageUrl ? (
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={item.name} 
                      src={item.imageUrl} 
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline">
                      <UtensilsCrossed className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-outline-variant/20">
                    <div className={`w-2 h-2 rounded-full ${item.type === 'VEG' ? 'bg-primary' : 'bg-tertiary'}`}></div>
                    <span className={`text-[9px] font-extrabold ${item.type === 'VEG' ? 'text-primary' : 'text-tertiary'}`}>
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="p-md">
                  <div className="flex justify-between items-start mb-1 gap-sm">
                    <h3 className="font-headline-sm text-on-surface truncate pr-2 font-bold text-base" title={item.name}>{item.name}</h3>
                    <span className="font-headline-sm text-primary font-bold text-base">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-outline text-body-sm line-clamp-2 mb-md text-xs min-h-[32px]">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-md border-t border-outline-variant/60">
                    {/* Availability Switch */}
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <div className={`w-9 h-5 rounded-full transition-all ${
                          item.available ? 'bg-primary' : 'bg-outline-variant'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-all ${
                            item.available ? 'left-[18px]' : 'left-[2px]'
                          }`}></div>
                        </div>
                      </div>
                      <span className={`font-label-sm text-xs font-semibold ${item.available ? 'text-on-surface' : 'text-outline'}`}>
                        {item.available ? 'Available' : 'Sold Out'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-outline hover:text-primary hover:bg-primary-container/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                            deleteMenuItem(item.id);
                          }
                        }}
                        className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setShowDrawer(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40 group"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform text-white" />
      </button>

      {/* Overlay Backdrop */}
      {showDrawer && (
        <div 
          onClick={handleCloseDrawer}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface-bright z-[70] transition-transform duration-300 ease-out shadow-2xl overflow-hidden flex flex-col ${
        showDrawer ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-lg border-b border-outline-variant flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
              {editItemId ? 'Edit Food Item' : 'Add New Food'}
            </h2>
            <p className="font-label-sm text-outline text-xs mt-1">Fill in the details to expand your menu.</p>
          </div>
          <button 
            onClick={handleCloseDrawer}
            className="p-2 rounded-full hover:bg-surface-container-low transition-all"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSaveDish} className="flex-1 overflow-y-auto no-scrollbar p-lg space-y-xl">
          {/* Image Upload Box */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-on-surface font-semibold text-sm">Food Image</label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-error font-semibold hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              className="hidden" 
            />
            {imageUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-xl overflow-hidden relative border-2 border-outline-variant cursor-pointer group bg-surface-container-low"
                title="Click to change photo"
              >
                <img 
                  src={imageUrl} 
                  alt="Food preview" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>Click to change photo</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-md hover:border-primary/50 transition-colors cursor-pointer group bg-surface-container-low"
              >
                <Upload className="w-8 h-8 text-outline group-hover:text-primary transition-colors" />
                <div className="text-center">
                  <p className="font-label-md text-on-surface font-semibold text-xs">Upload food photo</p>
                  <p className="text-[10px] text-outline mt-0.5">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
            {/* Optional URL input for direct image link */}
            <div className="pt-1">
              <input 
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-xs bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-lg">
            <div className="space-y-sm">
              <label className="font-label-md text-on-surface font-semibold text-sm">Food Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="e.g. Grilled Salmon Steak"
                required
                type="text"
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-sm">
                <label className="font-label-md text-on-surface font-semibold text-sm">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                >
                  <option value="Starters">Starters</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>
              <div className="space-y-sm">
                <label className="font-label-md text-on-surface font-semibold text-sm">Price ($)</label>
                <input 
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  min={0}
                  step="0.01"
                  required
                  type="number"
                />
              </div>
            </div>
          </div>

          <div className="space-y-sm">
            <label className="font-label-md text-on-surface font-semibold text-sm">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-bright focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              placeholder="Briefly describe ingredients, preparation, or highlights..."
              rows={4}
            />
          </div>

          {/* Toggle Veg */}
          <div className="p-md bg-surface-container-low rounded-xl flex items-center justify-between">
            <div>
              <p className="font-label-md text-on-surface font-semibold text-sm">Vegetarian Dish</p>
              <p className="text-xs text-outline mt-0.5">Toggle if this dish contains no meat.</p>
            </div>
            <div 
              onClick={() => setIsVeg(!isVeg)}
              className="relative inline-flex items-center cursor-pointer"
            >
              <div className={`w-11 h-6 rounded-full transition-all ${
                isVeg ? 'bg-primary' : 'bg-outline-variant'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-all ${
                  isVeg ? 'left-[24px]' : 'left-[2px]'
                }`}></div>
              </div>
            </div>
          </div>
        </form>

        {/* Drawer Actions */}
        <div className="p-lg border-t border-outline-variant bg-surface-bright grid grid-cols-2 gap-md">
          <button 
            type="button"
            onClick={handleCloseDrawer}
            className="px-xl py-3 rounded-xl border border-outline-variant font-label-md hover:bg-surface-container-low transition-all text-sm font-semibold"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveDish}
            className="px-xl py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
          >
            Save Dish
          </button>
        </div>
      </div>
    </div>
  );
};
export default Menu;
