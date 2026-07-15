import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Edit, Trash2, Plus, X, Upload, Save, Eye, EyeOff, 
  Image as ImageIcon, Search, RefreshCw, CheckCircle, Link as LinkIcon,
  Globe, MapPin, Package
} from 'lucide-react';

export default function CitiesHero() {
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  
  // Hero images - multiple images support
  const [heroImageFiles, setHeroImageFiles] = useState([]);
  const [heroImagePreviews, setHeroImagePreviews] = useState([]);
  const [heroUploading, setHeroUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  const [formData, setFormData] = useState({
    country_id: '',
    name_ar: '',
    name_en: '',
    slug: '',
    is_visible: true,
    hero_images: [],
    hero_titles_ar: [],
    hero_titles_en: [],
    hero_subtitles_ar: [],
    hero_subtitles_en: [],
    hero_links: [],
    hero_package_ids: [],
    meta_title_ar: '',
    meta_title_en: '',
    meta_desc_ar: '',
    meta_desc_en: ''
  });

  const [packages, setPackages] = useState([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([
      fetchCountries(),
      fetchCities(),
      fetchPackages()
    ]);
    setLoading(false);
  }

  async function fetchCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name_ar');

      if (error) {
        console.error('❌ Error fetching countries:', error);
      } else {
        setCountries(data || []);
        console.log('✅ Countries loaded:', data);
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  }

  async function fetchCities() {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries (
            id,
            name_ar,
            name_en,
            code,
            flag_emoji
          )
        `)
        .order('name_ar');

      if (error) {
        console.error('❌ Error fetching cities:', error);
      } else {
        const formattedData = data.map(item => ({
          ...item,
          hero_images: item.hero_images || [],
          hero_titles_ar: item.hero_titles_ar || [],
          hero_titles_en: item.hero_titles_en || [],
          hero_subtitles_ar: item.hero_subtitles_ar || [],
          hero_subtitles_en: item.hero_subtitles_en || [],
          hero_links: item.hero_links || [],
          hero_package_ids: item.hero_package_ids || []
        }));
        setCities(formattedData);
        console.log('✅ Cities loaded:', formattedData);
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  }

  async function fetchPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('id, venue_name_ar, venue_name_en, city_id, status')
      .is('deleted_at', null)
      .eq('status', 'live')
      .order('venue_name_ar');

    if (!error && data) {
      setPackages(data);
      console.log('📦 Packages loaded:', data);
    }
  }

  async function uploadHeroImage(file) {
    if (!file) return null;
    
    setHeroUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `city-hero/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('city-hero-images')
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
        .from('city-hero-images')
        .getPublicUrl(fileName);

      setHeroUploading(false);
      return publicUrl;
    } catch (err) {
      console.error('❌ Upload error:', err);
      setHeroUploading(false);
      return null;
    }
  }

  function handleHeroImagesSelect(e) {
    const files = Array.from(e.target.files);
    setHeroImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setHeroImagePreviews(previews);
  }

  function addImageByUrl() {
    if (!imageUrlInput.trim()) {
      alert('⚠️ Please enter an image URL');
      return;
    }
    
    setFormData({
      ...formData,
      hero_images: [...formData.hero_images, imageUrlInput.trim()],
      hero_titles_ar: [...formData.hero_titles_ar, ''],
      hero_titles_en: [...formData.hero_titles_en, ''],
      hero_subtitles_ar: [...formData.hero_subtitles_ar, ''],
      hero_subtitles_en: [...formData.hero_subtitles_en, ''],
      hero_links: [...formData.hero_links, ''],
      hero_package_ids: [...formData.hero_package_ids, null]
    });
    setImageUrlInput('');
  }

  async function uploadMultipleImages() {
    if (!heroImageFiles.length) return;
    
    setHeroUploading(true);
    const uploadedUrls = [];
    
    for (const file of heroImageFiles) {
      const url = await uploadHeroImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }
    
    if (uploadedUrls.length > 0) {
      setFormData({
        ...formData,
        hero_images: [...formData.hero_images, ...uploadedUrls],
        hero_titles_ar: [...formData.hero_titles_ar, ...uploadedUrls.map(() => '')],
        hero_titles_en: [...formData.hero_titles_en, ...uploadedUrls.map(() => '')],
        hero_subtitles_ar: [...formData.hero_subtitles_ar, ...uploadedUrls.map(() => '')],
        hero_subtitles_en: [...formData.hero_subtitles_en, ...uploadedUrls.map(() => '')],
        hero_links: [...formData.hero_links, ...uploadedUrls.map(() => '')],
        hero_package_ids: [...formData.hero_package_ids, ...uploadedUrls.map(() => null)]
      });
      alert(`✅ Successfully uploaded ${uploadedUrls.length} image(s)!`);
    }
    
    setHeroImageFiles([]);
    setHeroImagePreviews([]);
    setHeroUploading(false);
  }

  function removeImage(index) {
    const newImages = [...formData.hero_images];
    const newTitlesAr = [...formData.hero_titles_ar];
    const newTitlesEn = [...formData.hero_titles_en];
    const newSubtitlesAr = [...formData.hero_subtitles_ar];
    const newSubtitlesEn = [...formData.hero_subtitles_en];
    const newLinks = [...formData.hero_links];
    const newPackageIds = [...formData.hero_package_ids];
    
    newImages.splice(index, 1);
    newTitlesAr.splice(index, 1);
    newTitlesEn.splice(index, 1);
    newSubtitlesAr.splice(index, 1);
    newSubtitlesEn.splice(index, 1);
    newLinks.splice(index, 1);
    newPackageIds.splice(index, 1);
    
    setFormData({
      ...formData,
      hero_images: newImages,
      hero_titles_ar: newTitlesAr,
      hero_titles_en: newTitlesEn,
      hero_subtitles_ar: newSubtitlesAr,
      hero_subtitles_en: newSubtitlesEn,
      hero_links: newLinks,
      hero_package_ids: newPackageIds
    });
  }

  function updateHeroField(index, field, value) {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  }

  function resetForm() {
    setFormData({
      country_id: '',
      name_ar: '',
      name_en: '',
      slug: '',
      is_visible: true,
      hero_images: [],
      hero_titles_ar: [],
      hero_titles_en: [],
      hero_subtitles_ar: [],
      hero_subtitles_en: [],
      hero_links: [],
      hero_package_ids: [],
      meta_title_ar: '',
      meta_title_en: '',
      meta_desc_ar: '',
      meta_desc_en: ''
    });
    setHeroImageFiles([]);
    setHeroImagePreviews([]);
    setEditingCity(null);
    setImageUrlInput('');
    setPackageSearchTerm('');
    setSelectedCountryId('');
  }

  function openEditModal(city) {
    setEditingCity(city);
    setSelectedCountryId(city.country_id || '');
    setFormData({
      country_id: city.country_id || '',
      name_ar: city.name_ar || '',
      name_en: city.name_en || '',
      slug: city.slug || '',
      is_visible: city.is_visible !== undefined ? city.is_visible : true,
      hero_images: city.hero_images || [],
      hero_titles_ar: city.hero_titles_ar || [],
      hero_titles_en: city.hero_titles_en || [],
      hero_subtitles_ar: city.hero_subtitles_ar || [],
      hero_subtitles_en: city.hero_subtitles_en || [],
      hero_links: city.hero_links || [],
      hero_package_ids: city.hero_package_ids || [],
      meta_title_ar: city.meta_title_ar || '',
      meta_title_en: city.meta_title_en || '',
      meta_desc_ar: city.meta_desc_ar || '',
      meta_desc_en: city.meta_desc_en || ''
    });
    setHeroImageFiles([]);
    setHeroImagePreviews([]);
    setImageUrlInput('');
    setPackageSearchTerm('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    // Auto-generate slug if empty
    let slug = formData.slug.trim();
    if (!slug) {
      slug = formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const dataToSubmit = {
      country_id: parseInt(formData.country_id),
      name_ar: formData.name_ar.trim(),
      name_en: formData.name_en.trim(),
      slug: slug,
      is_visible: formData.is_visible,
      hero_images: formData.hero_images || [],
      hero_titles_ar: formData.hero_titles_ar || [],
      hero_titles_en: formData.hero_titles_en || [],
      hero_subtitles_ar: formData.hero_subtitles_ar || [],
      hero_subtitles_en: formData.hero_subtitles_en || [],
      hero_links: formData.hero_links || [],
      hero_package_ids: formData.hero_package_ids || [],
      meta_title_ar: formData.meta_title_ar || '',
      meta_title_en: formData.meta_title_en || '',
      meta_desc_ar: formData.meta_desc_ar || '',
      meta_desc_en: formData.meta_desc_en || '',
      updated_at: new Date().toISOString()
    };

    try {
      let error;
      if (editingCity) {
        const { error: updateError } = await supabase
          .from('cities')
          .update(dataToSubmit)
          .eq('id', editingCity.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cities')
          .insert({
            ...dataToSubmit,
            created_at: new Date().toISOString()
          });
        error = insertError;
      }

      if (error) {
        console.error('❌ Submit error:', error);
        alert('Error saving: ' + error.message);
      } else {
        alert('✅ Saved successfully!');
        setShowModal(false);
        resetForm();
        await fetchCities();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }

    setSubmitting(false);
  }

  async function toggleVisibility(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('cities')
        .update({ is_visible: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('❌ Error toggling visibility:', error);
        alert('Error: ' + error.message);
      } else {
        await fetchCities();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('⚠️ Are you sure you want to delete this city?')) return;
    
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete error:', error);
        alert('Error deleting: ' + error.message);
      } else {
        alert('✅ Deleted successfully!');
        await fetchCities();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }
  }

  const filteredCities = cities.filter(city => {
    const searchMatch = 
      city.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let visibilityMatch = true;
    if (filter === 'visible') visibilityMatch = city.is_visible === true;
    if (filter === 'hidden') visibilityMatch = city.is_visible === false;
    
    return searchMatch && visibilityMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">City Hero Settings</h1>
          <p className="text-gray-500 text-sm">Manage cities and their hero settings</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 transition"
        >
          <Plus size={18} /> Add City
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All ({cities.length})
          </button>
          <button
            onClick={() => setFilter('visible')}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              filter === 'visible' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Visible ({cities.filter(c => c.is_visible).length})
          </button>
          <button
            onClick={() => setFilter('hidden')}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              filter === 'hidden' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Hidden ({cities.filter(c => !c.is_visible).length})
          </button>
        </div>
        <button
          onClick={fetchCities}
          className="p-2 text-gray-500 hover:text-primary transition rounded-lg hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Cities Grid */}
      {filteredCities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">🏙️</div>
          <p className="text-gray-500">No cities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCities.map((city) => {
            const country = countries.find(c => c.id === city.country_id);
            return (
              <div 
                key={city.id} 
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl ${
                  !city.is_visible ? 'opacity-60' : ''
                }`}
              >
                {/* Hero Images Preview */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {city.hero_images && city.hero_images.length > 0 ? (
                    <div className="flex h-full">
                      {city.hero_images.slice(0, 3).map((img, idx) => (
                        <div key={idx} className="flex-1 h-full relative">
                          <img
                            src={img}
                            alt={`${city.name_ar} hero ${idx}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/400x200/023d6d/ffffff?text=No+Image';
                            }}
                          />
                          {city.hero_package_ids && city.hero_package_ids[idx] && (
                            <div className="absolute top-1 right-1 bg-accent/80 text-white text-[8px] px-1 py-0.5 rounded">
                              📦
                            </div>
                          )}
                        </div>
                      ))}
                      {city.hero_images.length > 3 && (
                        <div className="flex items-center justify-center bg-gray-800/50 text-white text-xs px-2">
                          +{city.hero_images.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ImageIcon size={40} className="opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <div className="text-white">
                      <h3 className="font-bold text-sm">{city.name_ar}</h3>
                      <p className="text-xs opacity-80">{city.name_en}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      city.is_visible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {city.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {country?.flag_emoji || '🌍'} {country?.name_ar || 'N/A'}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">/{city.slug}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{city.hero_images?.length || 0} images</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {city.hero_titles_ar && city.hero_titles_ar.some(t => t) && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">📝 Titles</span>
                    )}
                    {city.hero_subtitles_ar && city.hero_subtitles_ar.some(s => s) && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">📄 Subtitles</span>
                    )}
                    {city.hero_links && city.hero_links.some(l => l) && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">🔗 Links</span>
                    )}
                    {city.hero_package_ids && city.hero_package_ids.some(p => p) && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">📦 Packages</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(city)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => toggleVisibility(city.id, city.is_visible)}
                        className={`p-1.5 rounded-lg transition ${
                          city.is_visible 
                            ? 'text-red-500 hover:bg-red-50' 
                            : 'text-green-500 hover:bg-green-50'
                        }`}
                        title={city.is_visible ? 'Hide' : 'Show'}
                      >
                        {city.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(city.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(city.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">
                {editingCity ? 'Edit City' : 'Add New City'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Country Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Country *</label>
                <select
                  required
                  value={formData.country_id}
                  onChange={(e) => {
                    const countryId = e.target.value;
                    setFormData({...formData, country_id: countryId});
                    setSelectedCountryId(countryId);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {country.flag_emoji || '🌍'} {country.name_ar} - {country.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">City Name (Arabic) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">City Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name_en}
                    onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="e.g. jeddah"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">Will appear in URL: /ar/{formData.slug || '...'}</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_visible}
                    onChange={(e) => setFormData({...formData, is_visible: e.target.checked})}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Visible to everyone</span>
                </label>
              </div>

              {/* Hero Images - Multiple Upload */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-gray-700 text-sm font-medium mb-2">Hero Images (Multiple)</label>
                
                {formData.hero_images.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hero images added yet</p>
                  </div>
                )}

                {formData.hero_images.map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary shadow-sm transition mb-3">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-40 h-32 md:h-auto bg-gray-100 flex-shrink-0">
                        <img 
                          src={img} 
                          alt={`Hero ${idx}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/200x150/023d6d/ffffff?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                              formData.hero_package_ids[idx] ? 'bg-accent' :
                              formData.hero_links[idx] ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {formData.hero_package_ids[idx] ? '📦 Package' :
                               formData.hero_links[idx] ? '🔗 Custom' :
                               '🏠 Default'}
                            </span>
                            <span className="text-xs text-gray-400">#{idx + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={formData.hero_titles_ar[idx] || ''}
                            onChange={(e) => updateHeroField(idx, 'hero_titles_ar', e.target.value)}
                            placeholder="Title (Arabic)"
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            dir="rtl"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={formData.hero_titles_en[idx] || ''}
                            onChange={(e) => updateHeroField(idx, 'hero_titles_en', e.target.value)}
                            placeholder="Title (English)"
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={formData.hero_subtitles_ar[idx] || ''}
                            onChange={(e) => updateHeroField(idx, 'hero_subtitles_ar', e.target.value)}
                            placeholder="Subtitle (Arabic)"
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            dir="rtl"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={formData.hero_subtitles_en[idx] || ''}
                            onChange={(e) => updateHeroField(idx, 'hero_subtitles_en', e.target.value)}
                            placeholder="Subtitle (English)"
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <LinkIcon size={14} className="text-gray-400" />
                            <input
                              type="url"
                              value={formData.hero_links[idx] || ''}
                              onChange={(e) => updateHeroField(idx, 'hero_links', e.target.value)}
                              placeholder="Custom link (optional)"
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Link to Package:</span>
                          </div>
                          <select
                            value={formData.hero_package_ids[idx] || ''}
                            onChange={(e) => {
                              const newPackageIds = [...formData.hero_package_ids];
                              newPackageIds[idx] = e.target.value === '' ? null : parseInt(e.target.value);
                              setFormData({...formData, hero_package_ids: newPackageIds});
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary bg-white"
                          >
                            <option value="">🏠 Default (Homepage)</option>
                            {packages.map(pkg => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.venue_name_ar} ({pkg.city_id || 'N/A'})
                              </option>
                            ))}
                          </select>
                          {formData.hero_package_ids[idx] && (
                            <div className="mt-1 text-xs text-green-700 bg-green-50 p-1 rounded flex items-center gap-1">
                              <CheckCircle size={12} />
                              Selected: {packages.find(p => p.id === formData.hero_package_ids[idx])?.venue_name_ar}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 flex-wrap mt-2">
                  <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-3 cursor-pointer hover:border-primary transition">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleHeroImagesSelect}
                      className="hidden"
                    />
                  </label>
                  
                  <div className="flex flex-1 gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={addImageByUrl}
                      className="bg-primary text-white px-3 rounded-lg hover:bg-primary/90 text-sm"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
                
                {heroImageFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={uploadMultipleImages}
                    disabled={heroUploading}
                    className="mt-3 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
                  >
                    {heroUploading ? 'Uploading...' : `Upload ${heroImageFiles.length} image(s)`}
                  </button>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  💡 Each image can have its own title, subtitle, and link
                </p>
              </div>

              {/* Meta Tags */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-primary mb-3">SEO Meta Tags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Meta Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.meta_title_ar}
                      onChange={(e) => setFormData({...formData, meta_title_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Meta Title (English)</label>
                    <input
                      type="text"
                      value={formData.meta_title_en}
                      onChange={(e) => setFormData({...formData, meta_title_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Meta Description (Arabic)</label>
                    <textarea
                      rows="2"
                      value={formData.meta_desc_ar}
                      onChange={(e) => setFormData({...formData, meta_desc_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Meta Description (English)</label>
                    <textarea
                      rows="2"
                      value={formData.meta_desc_en}
                      onChange={(e) => setFormData({...formData, meta_desc_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  disabled={submitting || heroUploading}
                >
                  <Save size={18} />
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}