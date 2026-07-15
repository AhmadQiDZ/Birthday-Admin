import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Edit, Trash2, Plus, X, Upload, Save, Eye, EyeOff, 
  Image as ImageIcon, Search, RefreshCw, Package, 
  ExternalLink, Link as LinkIcon, CheckCircle
} from 'lucide-react';

export default function Cities() {
  // ============================================
  // State: Hero الرئيسي (للصفحة الرئيسية)
  // ============================================
  const [mainHeroes, setMainHeroes] = useState([]);
  const [showMainHeroModal, setShowMainHeroModal] = useState(false);
  const [editingMainHero, setEditingMainHero] = useState(null);
  
  // ============================================
  // State: Hero الثانوي (للصفحة الرئيسية)
  // ============================================
  const [secondaryHeroes, setSecondaryHeroes] = useState([]);
  const [showSecondaryHeroModal, setShowSecondaryHeroModal] = useState(false);
  const [editingSecondaryHero, setEditingSecondaryHero] = useState(null);
  
  // ============================================
  // State: الباقات
  // ============================================
  const [packages, setPackages] = useState([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ============================================
  // State: نماذج الإدخال
  // ============================================
  const [submitting, setSubmitting] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  
  // ============================================
  // State: رفع الصور
  // ============================================
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  
  // ============================================
  // State: نموذج الهيرو
  // ============================================
  const [formData, setFormData] = useState({
    image_url: '',
    title_ar: '',
    title_en: '',
    link: '',
    package_id: null,
    is_active: true,
    sort_order: 0
  });

  // ============================================
  // جلب البيانات
  // ============================================
  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([
      fetchMainHeroes(),
      fetchSecondaryHeroes(),
      fetchPackages()
    ]);
    setLoading(false);
  }

  async function fetchMainHeroes() {
    const { data, error } = await supabase
      .from('main_heroes')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setMainHeroes(data);
      console.log('🖼️ Main heroes loaded:', data);
    } else {
      console.error('❌ Error fetching main heroes:', error);
    }
  }

  async function fetchSecondaryHeroes() {
    const { data, error } = await supabase
      .from('secondary_heroes')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setSecondaryHeroes(data);
      console.log('🖼️ Secondary heroes loaded:', data);
    } else {
      console.error('❌ Error fetching secondary heroes:', error);
    }
  }

  async function fetchPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('id, venue_name_ar, venue_name_en, city_id, cities(name_ar, name_en, slug, slug_ar, slug_en), status')
      .is('deleted_at', null)
      .eq('status', 'live')
      .order('venue_name_ar');
    if (!error && data) {
      setPackages(data);
      console.log('📦 Packages loaded:', data);
    } else {
      console.error('❌ Error fetching packages:', error);
    }
  }

  // ============================================
  // دوال رفع الصور
  // ============================================
  async function uploadHeroImageToStorage(file) {
    if (!file) return null;
    
    setHeroUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `heroes/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('heroes-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        alert('Upload failed: ' + error.message);
        setHeroUploading(false);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('heroes-images')
        .getPublicUrl(fileName);

      setHeroUploading(false);
      return publicUrl;
    } catch (err) {
      console.error('❌ Upload error:', err);
      setHeroUploading(false);
      return null;
    }
  }

  function handleHeroImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setHeroImageFile(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  }

  // ============================================
  // دالة إنشاء الرابط للباقة
  // ============================================
  function generatePackageLink(pkgId, locale = 'en') {
    if (!pkgId) return '';
    
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return '';
    
    // الحصول على city_slug من الباقة
    const citySlug = pkg.cities?.slug || pkg.cities?.slug_ar || pkg.cities?.slug_en || '';
    if (!citySlug) {
      console.warn('⚠️ No city slug found for package:', pkgId);
      return '';
    }
    
    // إنشاء slug للباقة
    const packageName = pkg.venue_name_ar || pkg.venue_name_en || '';
    const packageSlug = packageName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!packageSlug) {
      console.warn('⚠️ Could not generate package slug for:', pkgId);
      return '';
    }
    
    return `/${locale}/${citySlug}/${packageSlug}`;
  }

  // ============================================
  // دوال الهيرو الرئيسي
  // ============================================
  async function handleMainHeroSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = formData.image_url.trim();
    
    if (heroImageFile) {
      const uploadedUrl = await uploadHeroImageToStorage(heroImageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setSubmitting(false);
        return;
      }
    }

    if (!imageUrl) {
      alert('⚠️ Please provide an image');
      setSubmitting(false);
      return;
    }

    // 🔧 FIX: إنشاء الرابط تلقائياً من الباقة المختارة
    let finalLink = formData.link || '';
    
    // إذا تم اختيار باقة ولم يتم تعيين رابط مخصص، قم بإنشاء الرابط تلقائياً
    if (formData.package_id && !formData.link) {
      const autoLink = generatePackageLink(formData.package_id, 'en');
      if (autoLink) {
        finalLink = autoLink;
        console.log('🔗 Auto-generated link:', finalLink);
      }
    }

    const heroData = {
      image_url: imageUrl,
      title_ar: formData.title_ar || null,
      title_en: formData.title_en || null,
      link: finalLink || null,
      package_id: formData.package_id || null,
      sort_order: mainHeroes.length,
      is_active: true
    };

    try {
      let error;
      if (editingMainHero) {
        const { error: updateError } = await supabase
          .from('main_heroes')
          .update(heroData)
          .eq('id', editingMainHero.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('main_heroes')
          .insert(heroData);
        error = insertError;
      }

      if (error) {
        console.error('❌ Submit error:', error);
        alert('Error saving: ' + error.message);
      } else {
        alert('✅ Main hero saved successfully!');
        setShowMainHeroModal(false);
        resetHeroForm();
        await fetchMainHeroes();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }

    setSubmitting(false);
  }

  async function handleMainHeroDelete(id) {
    if (!window.confirm('⚠️ Are you sure you want to delete this main hero?')) return;
    
    const { error } = await supabase.from('main_heroes').delete().eq('id', id);
    if (!error) {
      await fetchMainHeroes();
    } else {
      alert('Error: ' + error.message);
    }
  }

  // ============================================
  // دوال الهيرو الثانوي
  // ============================================
  async function handleSecondaryHeroSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = formData.image_url.trim();
    
    if (heroImageFile) {
      const uploadedUrl = await uploadHeroImageToStorage(heroImageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setSubmitting(false);
        return;
      }
    }

    if (!imageUrl) {
      alert('⚠️ Please provide an image');
      setSubmitting(false);
      return;
    }

    // 🔧 FIX: إنشاء الرابط تلقائياً من الباقة المختارة
    let finalLink = formData.link || '';
    
    // إذا تم اختيار باقة ولم يتم تعيين رابط مخصص، قم بإنشاء الرابط تلقائياً
    if (formData.package_id && !formData.link) {
      const autoLink = generatePackageLink(formData.package_id, 'en');
      if (autoLink) {
        finalLink = autoLink;
        console.log('🔗 Auto-generated link:', finalLink);
      }
    }

    const heroData = {
      image_url: imageUrl,
      title_ar: formData.title_ar || null,
      title_en: formData.title_en || null,
      link: finalLink || null,
      package_id: formData.package_id || null,
      sort_order: secondaryHeroes.length,
      is_active: true
    };

    try {
      let error;
      if (editingSecondaryHero) {
        const { error: updateError } = await supabase
          .from('secondary_heroes')
          .update(heroData)
          .eq('id', editingSecondaryHero.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('secondary_heroes')
          .insert(heroData);
        error = insertError;
      }

      if (error) {
        console.error('❌ Submit error:', error);
        alert('Error saving: ' + error.message);
      } else {
        alert('✅ Secondary hero saved successfully!');
        setShowSecondaryHeroModal(false);
        resetHeroForm();
        await fetchSecondaryHeroes();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }

    setSubmitting(false);
  }

  async function handleSecondaryHeroDelete(id) {
    if (!window.confirm('⚠️ Are you sure you want to delete this secondary hero?')) return;
    
    const { error } = await supabase.from('secondary_heroes').delete().eq('id', id);
    if (!error) {
      await fetchSecondaryHeroes();
    } else {
      alert('Error: ' + error.message);
    }
  }

  function resetHeroForm() {
    setHeroImageFile(null);
    setHeroImagePreview(null);
    setHeroImageUrl('');
    setFormData({
      image_url: '',
      title_ar: '',
      title_en: '',
      link: '',
      package_id: null,
      is_active: true,
      sort_order: 0
    });
    setEditingMainHero(null);
    setEditingSecondaryHero(null);
    setPackageSearchTerm('');
  }

  function openMainHeroEdit(hero) {
    setEditingMainHero(hero);
    setFormData({
      image_url: hero.image_url || '',
      title_ar: hero.title_ar || '',
      title_en: hero.title_en || '',
      link: hero.link || '',
      package_id: hero.package_id || null,
      is_active: hero.is_active !== undefined ? hero.is_active : true,
      sort_order: hero.sort_order || 0
    });
    setHeroImagePreview(null);
    setHeroImageFile(null);
    setHeroImageUrl('');
    setPackageSearchTerm('');
    setShowMainHeroModal(true);
  }

  function openSecondaryHeroEdit(hero) {
    setEditingSecondaryHero(hero);
    setFormData({
      image_url: hero.image_url || '',
      title_ar: hero.title_ar || '',
      title_en: hero.title_en || '',
      link: hero.link || '',
      package_id: hero.package_id || null,
      is_active: hero.is_active !== undefined ? hero.is_active : true,
      sort_order: hero.sort_order || 0
    });
    setHeroImagePreview(null);
    setHeroImageFile(null);
    setHeroImageUrl('');
    setPackageSearchTerm('');
    setShowSecondaryHeroModal(true);
  }

  // Filter packages for dropdown
  const filteredPackages = packages.filter(pkg =>
    pkg.venue_name_ar?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
    pkg.venue_name_en?.toLowerCase().includes(packageSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Hero Management</h1>

      {/* ============================================
          القسم الأول: الهيرو الرئيسي
      ============================================ */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ImageIcon size={24} /> Main Hero (Homepage)
          </h2>
          <button
            onClick={() => {
              resetHeroForm();
              setShowMainHeroModal(true);
            }}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus size={18} /> Add Main Hero
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainHeroes.map((hero) => (
            <div key={hero.id} className="relative rounded-xl overflow-hidden shadow-lg group bg-white border border-gray-200">
              <div className="h-48">
                <img 
                  src={hero.image_url} 
                  alt={hero.title_ar || 'Main Hero'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x300/023d6d/ffffff?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="font-bold text-sm">{hero.title_ar || hero.title_en || 'Untitled'}</p>
                {hero.package_id && (
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <Package size={12} /> 
                    {packages.find(p => p.id === hero.package_id)?.venue_name_ar || 'Package'}
                  </p>
                )}
                {hero.link && <p className="text-xs opacity-60 truncate">{hero.link}</p>}
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {hero.is_active && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                <button
                  onClick={() => openMainHeroEdit(hero)}
                  className="bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleMainHeroDelete(hero.id)}
                  className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {mainHeroes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-30" />
              <p>No main heroes added yet</p>
              <p className="text-sm">Click "Add Main Hero" to create one</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          القسم الثاني: الهيرو الثانوي
      ============================================ */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ImageIcon size={24} /> Secondary Hero (Homepage)
          </h2>
          <button
            onClick={() => {
              resetHeroForm();
              setShowSecondaryHeroModal(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={18} /> Add Secondary Hero
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {secondaryHeroes.map((hero) => (
            <div key={hero.id} className="relative rounded-xl overflow-hidden shadow-lg group bg-white border border-gray-200">
              <div className="h-32">
                <img 
                  src={hero.image_url} 
                  alt={hero.title_ar || 'Secondary Hero'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200/023d6d/ffffff?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                <p className="font-bold text-xs truncate">{hero.title_ar || hero.title_en || 'Untitled'}</p>
                {hero.package_id && (
                  <p className="text-[10px] opacity-80 truncate">
                    📦 {packages.find(p => p.id === hero.package_id)?.venue_name_ar || 'Package'}
                  </p>
                )}
              </div>
              <div className="absolute top-1 right-1 flex gap-1">
                {hero.is_active && (
                  <span className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <div className="absolute top-1 left-1 flex gap-1">
                <button
                  onClick={() => openSecondaryHeroEdit(hero)}
                  className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition"
                  title="Edit"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => handleSecondaryHeroDelete(hero.id)}
                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {secondaryHeroes.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
              <p>No secondary heroes added yet</p>
              <p className="text-sm">Click "Add Secondary Hero" to create one</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          مودال: إضافة/تعديل هيرو (رئيسي أو ثانوي)
      ============================================ */}
      {(showMainHeroModal || showSecondaryHeroModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">
                {showMainHeroModal ? 'Add Main Hero' : 'Add Secondary Hero'}
                {editingMainHero || editingSecondaryHero ? ' (Edit)' : ''}
              </h2>
              <button 
                onClick={() => {
                  setShowMainHeroModal(false);
                  setShowSecondaryHeroModal(false);
                  resetHeroForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={showMainHeroModal ? handleMainHeroSubmit : handleSecondaryHeroSubmit} className="p-6 space-y-4">
              {/* Hero Image */}
              <div>
                <label className="block text-gray-700 mb-2 font-semibold">Hero Image *</label>
                
                {heroImagePreview && (
                  <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-primary">
                    <img 
                      src={heroImagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setHeroImageFile(null);
                        setHeroImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {formData.image_url && !heroImagePreview && (
                  <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={formData.image_url} 
                      alt="Hero" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-4 cursor-pointer hover:border-primary transition">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="flex flex-1 gap-2 items-center">
                    <input
                      type="url"
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="Or paste image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (heroImageUrl.trim()) {
                          setFormData({...formData, image_url: heroImageUrl.trim()});
                          setHeroImageUrl('');
                        }
                      }}
                      className="bg-primary text-white px-3 rounded-lg hover:bg-primary/90 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Upload an image or provide a URL
                </p>
              </div>

              {/* Title Arabic */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Title (Arabic) - Optional</label>
                <input
                  type="text"
                  value={formData.title_ar || ''}
                  onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  dir="rtl"
                  placeholder="أفضل حفلات أعياد الميلاد"
                />
              </div>

              {/* Title English */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Title (English) - Optional</label>
                <input
                  type="text"
                  value={formData.title_en || ''}
                  onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  dir="ltr"
                  placeholder="Best Birthday Parties"
                />
              </div>

              {/* Package Selection with Search */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Link to Package (Optional)</label>
                <div className="space-y-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for a package..."
                      value={packageSearchTerm}
                      onChange={(e) => setPackageSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  
                  {/* Package dropdown */}
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <select
                      value={formData.package_id || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value);
                        setFormData({...formData, package_id: val});
                        
                        // 🔧 FIX: عند اختيار باقة، قم بإنشاء الرابط تلقائياً
                        if (val) {
                          const autoLink = generatePackageLink(val, 'en');
                          if (autoLink) {
                            setFormData(prev => ({
                              ...prev,
                              link: autoLink
                            }));
                            console.log('🔗 Auto-generated link on selection:', autoLink);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 bg-white text-sm"
                    >
                      <option value="">🏠 Default (Homepage)</option>
                      {filteredPackages.map(pkg => {
                        const cityName = pkg.cities?.name_ar || pkg.cities?.name_en || 'N/A';
                        return (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.venue_name_ar} ({cityName})
                          </option>
                        );
                      })}
                      {filteredPackages.length === 0 && packageSearchTerm && (
                        <option value="" disabled>No packages found</option>
                      )}
                    </select>
                  </div>
                  
                  {formData.package_id && (
                    <div className="mt-1 text-xs text-green-700 bg-green-50 p-1.5 rounded flex items-center gap-2">
                      <CheckCircle size={14} />
                      <span>
                        Selected: <strong>{packages.find(p => p.id === formData.package_id)?.venue_name_ar}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  When clicked, the hero will redirect to this package page
                </p>
              </div>

              {/* Custom Link */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Custom Link (Optional)</label>
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-gray-400" />
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Overrides package link if both are provided
                </p>
                {formData.package_id && formData.link && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚠️ Custom link overrides auto-generated package link
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowMainHeroModal(false);
                    setShowSecondaryHeroModal(false);
                    resetHeroForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
                  disabled={submitting || heroUploading}
                >
                  <Save size={18} />
                  {submitting ? 'Saving...' : 'Save Hero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}