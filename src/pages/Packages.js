import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, Eye, EyeOff, Plus, X, Upload, Package as PackageIcon, MapPin, Star, Building, Copy, Check } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  // ===== خيارات العملات =====
  const currencies = [
    { code: 'SAR', label: '🇸🇦 SAR - Saudi Riyal', symbol: 'ر.س' },
    { code: 'AED', label: '🇦🇪 AED - UAE Dirham', symbol: 'د.إ' },
    { code: 'BHD', label: '🇧🇭 BHD - Bahraini Dinar', symbol: 'د.ب' },
    { code: 'QAR', label: '🇶🇦 QAR - Qatari Riyal', symbol: 'ر.ق' },
    { code: 'EUR', label: '🇪🇺 EUR - Euro', symbol: '€' },
    { code: 'GBP', label: '🇬🇧 GBP - British Pound', symbol: '£' }
  ];

  // ===== State للفورم =====
  const [formData, setFormData] = useState({
    venue_name_ar: '',
    venue_name_en: '',
    description_ar: '',
    description_en: '',
    city_id: '',
    country_id: '',
    terms_ar: '',
    terms_en: '',
    images: [],
    status: 'live',
    currency: 'SAR',
    seo_title_ar: '',
    seo_title_en: '',
    seo_description_ar: '',
    seo_description_en: '',
    seo_keywords_ar: '',
    seo_keywords_en: '',
    featured: false,
    popular: false,
    booking_count: 0,
    rating: 0,
    reviews_count: 0,
    faq_ar: [],
    faq_en: [],
    branches: [],
    tiers: []
  });

  // ===== جلب البيانات =====
  useEffect(() => {
    fetchPackages();
    fetchCountriesAndCities();
  }, []);

  async function fetchPackages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          cities (
            id,
            name_ar,
            name_en,
            slug,
            country_id,
            countries (
              id,
              name_ar,
              name_en,
              code,
              flag_emoji
            )
          ),
          branches(*),
          package_tiers(*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPackages(data);
        console.log('✅ Packages loaded:', data);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    }
    setLoading(false);
  }

  async function fetchCountriesAndCities() {
    try {
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name_ar');

      if (!countriesError && countriesData) {
        setCountries(countriesData);
        console.log('✅ Countries loaded:', countriesData);
      }

      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*, countries(*)')
        .eq('is_visible', true)
        .order('name_ar');

      if (!citiesError && citiesData) {
        setCities(citiesData);
        console.log('✅ Cities loaded:', citiesData);
      }
    } catch (err) {
      console.error('Error fetching countries/cities:', err);
    }
  }

  // ============================================
  // دوال إدارة الفروع
  // ============================================
  function addBranch() {
    setFormData({
      ...formData,
      branches: [
        ...formData.branches,
        {
          id: Date.now(),
          name_ar: '',
          name_en: '',
          city_id: formData.city_id || '',
          address_ar: '',
          address_en: '',
          location_map_url: '',
          map_embed_url: '',
          phone: '',
          working_hours: '',
          tiers: []
        }
      ]
    });
  }

  function updateBranch(index, field, value) {
    const updatedBranches = [...formData.branches];
    updatedBranches[index][field] = value;
    setFormData({ ...formData, branches: updatedBranches });
  }

  function removeBranch(index) {
    const updatedBranches = [...formData.branches];
    updatedBranches.splice(index, 1);
    setFormData({ ...formData, branches: updatedBranches });
  }

  // ============================================
  // دوال إدارة الباقات (Tiers)
  // ============================================
  function addTierToBranch(branchIndex) {
    const updatedBranches = [...formData.branches];
    updatedBranches[branchIndex].tiers.push({
      id: Date.now(),
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      price: '',
      price_before_discount: '',
      show_discount: false,
      max_children: ''
    });
    setFormData({ ...formData, branches: updatedBranches });
  }

  function updateTierInBranch(branchIndex, tierIndex, field, value) {
    const updatedBranches = [...formData.branches];
    const tier = updatedBranches[branchIndex].tiers[tierIndex];
    tier[field] = value;
    
    if (field === 'price' || field === 'price_before_discount') {
      const price = parseFloat(tier.price) || 0;
      const priceBefore = parseFloat(tier.price_before_discount) || 0;
      tier.show_discount = priceBefore > price;
    }
    
    setFormData({ ...formData, branches: updatedBranches });
  }

  function removeTierFromBranch(branchIndex, tierIndex) {
    const updatedBranches = [...formData.branches];
    updatedBranches[branchIndex].tiers.splice(tierIndex, 1);
    setFormData({ ...formData, branches: updatedBranches });
  }

  function copyTiersToBranch(fromBranchIndex, toBranchIndex) {
    const updatedBranches = [...formData.branches];
    const sourceTiers = updatedBranches[fromBranchIndex].tiers;
    
    const copiedTiers = sourceTiers.map(tier => ({
      ...tier,
      id: Date.now() + Math.random()
    }));
    
    updatedBranches[toBranchIndex].tiers = copiedTiers;
    setFormData({ ...formData, branches: updatedBranches });
  }

  // ============================================
  // دوال رفع الصور
  // ============================================
  async function uploadImage(file) {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `package_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    try {
      const { data, error } = await supabase.storage
        .from('package-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        alert('❌ Upload failed: ' + error.message);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('package-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('❌ Upload error:', err);
      return null;
    }
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  }

  async function handleImageUpload() {
    if (!selectedFiles.length) return;
    
    setUploading(true);
    setUploadProgress(0);
    const uploadedUrls = [];
    let completed = 0;
    
    for (const file of selectedFiles) {
      const url = await uploadImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
      completed++;
      setUploadProgress(Math.round((completed / selectedFiles.length) * 100));
    }
    
    if (uploadedUrls.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls]
      });
      alert(`✅ Successfully uploaded ${uploadedUrls.length} image(s)!`);
    }
    
    setSelectedFiles([]);
    setUploading(false);
    setUploadProgress(0);
  }

  function addImageByUrl() {
    if (!imageUrlInput.trim()) {
      alert('⚠️ Please enter an image URL');
      return;
    }
    
    setFormData({
      ...formData,
      images: [...formData.images, imageUrlInput.trim()]
    });
    setImageUrlInput('');
  }

  function removeImage(index) {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  }

  // ============================================
  // دالة حفظ الباقة (المعدلة)
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    if (formData.branches.length === 0) {
      alert('⚠️ Please add at least one branch.');
      setSubmitting(false);
      return;
    }

    for (let i = 0; i < formData.branches.length; i++) {
      if (formData.branches[i].tiers.length === 0) {
        alert(`⚠️ Branch "${formData.branches[i].name_ar || formData.branches[i].name_en || i + 1}" has no packages.`);
        setSubmitting(false);
        return;
      }
    }

    let allPrices = [];
    formData.branches.forEach(branch => {
      branch.tiers.forEach(tier => {
        if (tier.price) allPrices.push(parseFloat(tier.price));
      });
    });
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    
    const packageData = {
      venue_name_ar: formData.venue_name_ar.trim(),
      venue_name_en: formData.venue_name_en.trim(),
      description_ar: formData.description_ar?.trim() || '',
      description_en: formData.description_en?.trim() || '',
      city_id: formData.city_id || null,
      terms_ar: formData.terms_ar?.trim() || '',
      terms_en: formData.terms_en?.trim() || '',
      images: formData.images || [],
      min_price: minPrice,
      currency: formData.currency || 'SAR',
      created_by: user.id || null,
      status: formData.status || 'live',
      seo_title_ar: formData.seo_title_ar?.trim() || formData.venue_name_ar,
      seo_title_en: formData.seo_title_en?.trim() || formData.venue_name_en,
      seo_description_ar: formData.seo_description_ar?.trim() || formData.description_ar,
      seo_description_en: formData.seo_description_en?.trim() || formData.description_en,
      seo_keywords_ar: formData.seo_keywords_ar?.trim() || '',
      seo_keywords_en: formData.seo_keywords_en?.trim() || '',
      has_multiple_branches: formData.branches.length > 1,
      featured: formData.featured || false,
      popular: formData.popular || false,
      booking_count: formData.booking_count || 0,
      rating: formData.rating || 0,
      reviews_count: formData.reviews_count || 0,
      faq_ar: formData.faq_ar || [],
      faq_en: formData.faq_en || []
    };
    
    console.log('📦 Submitting package:', packageData);
    
    try {
      let packageId;
      
      if (editingPackage) {
        // تحديث الباقة الرئيسية
        const { error, data } = await supabase
          .from('packages')
          .update({
            ...packageData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
            notes: note
          })
          .eq('id', editingPackage.id)
          .select();

        if (error) {
          console.error('❌ Update error:', error);
          alert('Error updating package: ' + error.message);
          setSubmitting(false);
          return;
        }
        
        if (data && data[0]) {
          packageId = editingPackage.id;
          
          // 🔥 حل المشكلة: تحديث الفروع بدلاً من حذفها
          // 1. جلب الفروع الحالية من قاعدة البيانات
          const { data: existingBranches, error: fetchError } = await supabase
            .from('branches')
            .select('id, package_id')
            .eq('package_id', packageId);

          if (fetchError) {
            console.error('❌ Error fetching existing branches:', fetchError);
          }

          // 2. قائمة IDs الفروع الحالية
          const existingBranchIds = existingBranches?.map(b => b.id) || [];
          const newBranchIds = formData.branches
            .filter(b => typeof b.id === 'number' && b.id > 0)
            .map(b => b.id);

          // 3. حذف الفروع التي تم إزالتها (مع التعامل مع الـ Constraints)
          for (const branchId of existingBranchIds) {
            if (!newBranchIds.includes(branchId)) {
              try {
                // حذف الـ tiers المرتبطة بالفرع أولاً
                await supabase
                  .from('package_tiers')
                  .delete()
                  .eq('branch_id', branchId);
                
                // ثم حذف الفرع
                await supabase
                  .from('branches')
                  .delete()
                  .eq('id', branchId);
              } catch (err) {
                console.warn('⚠️ Could not delete branch:', branchId, err);
                // إذا كان هناك حجوزات مرتبطة، نقوم بتحديثها بدلاً من الحذف
                await supabase
                  .from('branches')
                  .update({ package_id: null })
                  .eq('id', branchId);
              }
            }
          }

          // 4. تحديث أو إضافة الفروع الجديدة
          for (const branch of formData.branches) {
            const branchData = {
              package_id: packageId,
              name_ar: branch.name_ar.trim(),
              name_en: branch.name_en.trim(),
              city_id: branch.city_id || formData.city_id,
              address_ar: branch.address_ar?.trim() || '',
              address_en: branch.address_en?.trim() || '',
              location_map_url: branch.location_map_url?.trim() || '',
              map_embed_url: branch.map_embed_url?.trim() || '',
              phone: branch.phone?.trim() || '',
              working_hours: branch.working_hours?.trim() || ''
            };

            let branchId;
            
            // إذا كان الفرع موجوداً (لديه id رقمي)، نقوم بتحديثه
            if (typeof branch.id === 'number' && branch.id > 0 && existingBranchIds.includes(branch.id)) {
              const { data, error } = await supabase
                .from('branches')
                .update(branchData)
                .eq('id', branch.id)
                .select();
              
              if (error) {
                console.error('❌ Error updating branch:', error);
                continue;
              }
              branchId = branch.id;
            } else {
              // فرع جديد - نقوم بإضافته
              const { data, error } = await supabase
                .from('branches')
                .insert(branchData)
                .select();
              
              if (error) {
                console.error('❌ Error inserting branch:', error);
                continue;
              }
              branchId = data[0].id;
            }

            if (branchId) {
              // 5. تحديث الـ Tiers للفرع
              // حذف الـ tiers القديمة للفرع
              await supabase
                .from('package_tiers')
                .delete()
                .eq('branch_id', branchId);
              
              // إضافة الـ tiers الجديدة
              for (const tier of branch.tiers) {
                const { error: tierError } = await supabase
                  .from('package_tiers')
                  .insert({
                    package_id: packageId,
                    branch_id: branchId,
                    name_ar: tier.name_ar.trim(),
                    name_en: tier.name_en.trim(),
                    description_ar: tier.description_ar?.trim() || '',
                    description_en: tier.description_en?.trim() || '',
                    price: parseFloat(tier.price) || 0,
                    price_before_discount: parseFloat(tier.price_before_discount) || 0,
                    show_discount: tier.show_discount || false,
                    max_children: parseInt(tier.max_children) || 0,
                    sort_order: 0
                  });

                if (tierError) {
                  console.error('❌ Tier error:', tierError);
                }
              }
            }
          }
        }
      } else {
        // إنشاء باقة جديدة
        const { data, error } = await supabase
          .from('packages')
          .insert(packageData)
          .select();

        if (error) {
          console.error('❌ Insert error:', error);
          alert('Error creating package: ' + error.message);
          setSubmitting(false);
          return;
        }
        
        if (data && data[0]) {
          packageId = data[0].id;
          
          // إضافة الفروع
          for (const branch of formData.branches) {
            const { data: branchData, error: branchError } = await supabase
              .from('branches')
              .insert({
                package_id: packageId,
                name_ar: branch.name_ar.trim(),
                name_en: branch.name_en.trim(),
                city_id: branch.city_id || formData.city_id,
                address_ar: branch.address_ar?.trim() || '',
                address_en: branch.address_en?.trim() || '',
                location_map_url: branch.location_map_url?.trim() || '',
                map_embed_url: branch.map_embed_url?.trim() || '',
                phone: branch.phone?.trim() || '',
                working_hours: branch.working_hours?.trim() || ''
              })
              .select();

            if (branchError) {
              console.error('❌ Branch error:', branchError);
              continue;
            }

            if (branchData && branchData[0]) {
              const branchId = branchData[0].id;
              
              for (const tier of branch.tiers) {
                const { error: tierError } = await supabase
                  .from('package_tiers')
                  .insert({
                    package_id: packageId,
                    branch_id: branchId,
                    name_ar: tier.name_ar.trim(),
                    name_en: tier.name_en.trim(),
                    description_ar: tier.description_ar?.trim() || '',
                    description_en: tier.description_en?.trim() || '',
                    price: parseFloat(tier.price) || 0,
                    price_before_discount: parseFloat(tier.price_before_discount) || 0,
                    show_discount: tier.show_discount || false,
                    max_children: parseInt(tier.max_children) || 0,
                    sort_order: 0
                  });

                if (tierError) {
                  console.error('❌ Tier error:', tierError);
                }
              }
            }
          }
        }
      }
      
      if (packageId) {
        // تحديث has_multiple_branches
        await supabase
          .from('packages')
          .update({ has_multiple_branches: formData.branches.length > 1 })
          .eq('id', packageId);

        // تسجيل في audit_log
        await supabase.from('audit_log').insert({
          user_id: user.id,
          user_name: user.name,
          action: editingPackage ? 'update_package' : 'create_package',
          table_name: 'packages',
          record_id: packageId,
          new_data: packageData
        });
        
        alert(`✅ Package ${editingPackage ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        setEditingPackage(null);
        resetForm();
        fetchPackages();
        setNote('');
      }
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('Error: ' + err.message);
    }
    
    setSubmitting(false);
  }

  function resetForm() {
    setFormData({
      venue_name_ar: '',
      venue_name_en: '',
      description_ar: '',
      description_en: '',
      city_id: '',
      country_id: '',
      terms_ar: '',
      terms_en: '',
      images: [],
      status: 'live',
      currency: 'SAR',
      seo_title_ar: '',
      seo_title_en: '',
      seo_description_ar: '',
      seo_description_en: '',
      seo_keywords_ar: '',
      seo_keywords_en: '',
      featured: false,
      popular: false,
      booking_count: 0,
      rating: 0,
      reviews_count: 0,
      faq_ar: [],
      faq_en: [],
      branches: [],
      tiers: []
    });
    setSelectedCountryId('');
  }

  // ============================================
  // دالة تحميل البيانات للتعديل
  // ============================================
  async function loadPackageForEdit(pkg) {
    setEditingPackage(pkg);
    setSelectedCountryId(pkg.cities?.country_id || '');
    
    // جلب الفروع
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .eq('package_id', pkg.id)
      .order('name_ar');

    if (branchesError) {
      console.error('❌ Error loading branches:', branchesError);
    }

    // جلب الباقات (tiers) لكل فرع
    const branches = [];
    if (branchesData) {
      for (const branch of branchesData) {
        const { data: tiersData, error: tiersError } = await supabase
          .from('package_tiers')
          .select('*')
          .eq('branch_id', branch.id)
          .order('sort_order');

        if (tiersError) {
          console.error('❌ Error loading tiers:', tiersError);
        }

        branches.push({
          id: branch.id,
          name_ar: branch.name_ar || '',
          name_en: branch.name_en || '',
          city_id: branch.city_id || '',
          address_ar: branch.address_ar || '',
          address_en: branch.address_en || '',
          location_map_url: branch.location_map_url || '',
          map_embed_url: branch.map_embed_url || '',
          phone: branch.phone || '',
          working_hours: branch.working_hours || '',
          tiers: tiersData?.map(tier => ({
            id: tier.id,
            name_ar: tier.name_ar || '',
            name_en: tier.name_en || '',
            description_ar: tier.description_ar || '',
            description_en: tier.description_en || '',
            price: tier.price || '',
            price_before_discount: tier.price_before_discount || '',
            show_discount: tier.show_discount || false,
            max_children: tier.max_children || ''
          })) || []
        });
      }
    }

    setFormData({
      venue_name_ar: pkg.venue_name_ar,
      venue_name_en: pkg.venue_name_en,
      description_ar: pkg.description_ar || '',
      description_en: pkg.description_en || '',
      city_id: pkg.city_id || '',
      country_id: pkg.cities?.country_id || '',
      terms_ar: pkg.terms_ar || '',
      terms_en: pkg.terms_en || '',
      images: pkg.images || [],
      status: pkg.status || 'live',
      currency: pkg.currency || 'SAR',
      seo_title_ar: pkg.seo_title_ar || '',
      seo_title_en: pkg.seo_title_en || '',
      seo_description_ar: pkg.seo_description_ar || '',
      seo_description_en: pkg.seo_description_en || '',
      seo_keywords_ar: pkg.seo_keywords_ar || '',
      seo_keywords_en: pkg.seo_keywords_en || '',
      featured: pkg.featured || false,
      popular: pkg.popular || false,
      booking_count: pkg.booking_count || 0,
      rating: pkg.rating || 0,
      reviews_count: pkg.reviews_count || 0,
      faq_ar: pkg.faq_ar || [],
      faq_en: pkg.faq_en || [],
      branches: branches,
      tiers: []
    });
    
    setSelectedFiles([]);
    setImageUrlInput('');
    setShowModal(true);
  }

  // ============================================
  // دوال الحذف وتغيير الحالة
  // ============================================
  async function handleDelete(id) {
    if (!window.confirm('⚠️ Are you sure you want to delete this package?')) return;
    
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    setSubmitting(true);
    
    try {
      // 1. تحديث الحجوزات المرتبطة
      await supabase
        .from('bookings')
        .update({ package_id: null, package_tier_id: null, branch_id: null })
        .eq('package_id', id);
      
      // 2. حذف التقييمات
      await supabase.from('reviews').delete().eq('package_id', id);
      
      // 3. حذف الـ tiers
      await supabase.from('package_tiers').delete().eq('package_id', id);
      
      // 4. حذف الفروع
      await supabase.from('branches').delete().eq('package_id', id);
      
      // 5. حذف الباقة (soft delete)
      const { error } = await supabase
        .from('packages')
        .update({ 
          deleted_at: new Date().toISOString(),
          notes: note || 'Deleted by admin'
        })
        .eq('id', id);
      
      if (error) {
        alert('❌ Error deleting package: ' + error.message);
        setSubmitting(false);
        return;
      }
      
      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: user.name,
        action: 'delete_package',
        table_name: 'packages',
        record_id: id,
        new_data: { deleted_at: new Date().toISOString(), notes: note }
      });
      
      alert('✅ Package deleted successfully!');
      fetchPackages();
      setNote('');
      
    } catch (err) {
      console.error('❌ Delete error:', err);
      alert('Error: ' + err.message);
    }
    
    setSubmitting(false);
  }

  async function handleStatusChange(id, currentStatus) {
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const newStatus = currentStatus === 'live' ? 'draft' : 'live';
    
    const newNote = window.prompt('Enter note for status change:', newStatus === 'live' ? 'Branch Opened' : 'Branch closed');
    if (newNote === null) return;
    
    const { error } = await supabase
      .from('packages')
      .update({ 
        status: newStatus,
        notes: newNote,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: user.name,
        action: `status_change_${newStatus}`,
        table_name: 'packages',
        record_id: id,
        new_data: { status: newStatus, notes: newNote }
      });
      
      fetchPackages();
    }
  }

  // ============================================
  // عرض الباقات
  // ============================================
  const filteredPackages = packages.filter(pkg =>
    pkg.venue_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.venue_name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredPackages.map((pkg) => (
        <div key={pkg.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="relative h-48 bg-gray-100">
            {pkg.images && pkg.images.length > 0 ? (
              <img 
                src={pkg.images[0]} 
                alt={pkg.venue_name_ar}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400/023d6d/ffffff?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <PackageIcon size={48} className="text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-wrap gap-1">
              {pkg.featured && (
                <span className="bg-accent text-white px-2 py-0.5 rounded-full text-xs">⭐ Featured</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                pkg.status === 'live' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {pkg.status === 'live' ? <Eye size={12} /> : <EyeOff size={12} />}
                {pkg.status}
              </span>
            </div>
            {pkg.branches && pkg.branches.length > 0 && (
              <div className="absolute bottom-2 left-2 bg-primary/80 text-white px-2 py-0.5 rounded-full text-xs">
                🏢 {pkg.branches.length} {pkg.branches.length > 1 ? 'فروع' : 'فرع'}
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
              {pkg.currency || 'SAR'}
            </div>
            {pkg.cities && (
              <div className="absolute bottom-2 right-2 bg-accent/80 text-white px-2 py-0.5 rounded-full text-xs">
                {pkg.cities.countries?.flag_emoji || '📍'} {pkg.cities.name_ar}
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-bold text-primary truncate">{pkg.venue_name_ar}</h3>
            <p className="text-sm text-gray-500 truncate">{pkg.venue_name_en}</p>
            <p className="text-sm text-gray-600 mt-1">
              {pkg.cities ? (
                <span className="flex items-center gap-1">
                  {pkg.cities.countries?.flag_emoji || '📍'} 
                  {pkg.cities.name_ar}
                </span>
              ) : (
                'غير محدد'
              )}
            </p>
            
            {pkg.branches && pkg.branches.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {pkg.branches.slice(0, 3).map((branch, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {branch.name_ar}
                  </span>
                ))}
                {pkg.branches.length > 3 && (
                  <span className="text-xs text-gray-400">+{pkg.branches.length - 3}</span>
                )}
              </div>
            )}
            
            <div className="flex gap-1 mt-2">
              {pkg.images?.slice(0, 3).map((img, idx) => (
                <div key={idx} className="w-8 h-8 bg-gray-100 rounded overflow-hidden border">
                  <img 
                    src={img} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/40x40/023d6d/ffffff?text=No+Image';
                    }}
                  />
                </div>
              ))}
              {pkg.images?.length > 3 && (
                <span className="text-xs text-gray-500 flex items-center">+{pkg.images.length - 3}</span>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button 
                onClick={() => handleStatusChange(pkg.id, pkg.status)}
                className={`text-xs px-2 py-1 rounded ${
                  pkg.status === 'live' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {pkg.status === 'live' ? 'Set Draft' : 'Set Live'}
              </button>
              <button 
                onClick={() => loadPackageForEdit(pkg)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => handleDelete(pkg.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-primary">Packages</h1>
        <button 
          onClick={() => {
            setEditingPackage(null);
            resetForm();
            setSelectedFiles([]);
            setImageUrlInput('');
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add New Package
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <input
          type="text"
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      {filteredPackages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg">
          <PackageIcon size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No packages found</p>
          <button 
            onClick={() => {
              setEditingPackage(null);
              resetForm();
              setSelectedFiles([]);
              setImageUrlInput('');
              setShowModal(true);
            }}
            className="mt-4 btn-primary"
          >
            Add Your First Package
          </button>
        </div>
      ) : (
        renderGrid()
      )}

      {/* ============================================
          Modal - إضافة/تعديل الباقة
      ============================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h2>
              <button onClick={() => {
                setShowModal(false);
                setEditingPackage(null);
                setSelectedFiles([]);
                setImageUrlInput('');
              }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ===== معلومات الباقة الأساسية ===== */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-primary mb-3">📋 Basic Package Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">📍 Venue Name (Arabic) *</label>
                    <input
                      type="text"
                      required
                      value={formData.venue_name_ar}
                      onChange={(e) => setFormData({...formData, venue_name_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">📍 Venue Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={formData.venue_name_en}
                      onChange={(e) => setFormData({...formData, venue_name_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 mb-2">🏙️ City *</label>
                    <select
                      required
                      value={formData.city_id}
                      onChange={(e) => {
                        const cityId = parseInt(e.target.value);
                        const selectedCity = cities.find(c => c.id === cityId);
                        setFormData({
                          ...formData,
                          city_id: cityId,
                          country_id: selectedCity?.country_id || ''
                        });
                        setSelectedCountryId(selectedCity?.country_id || '');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.countries?.flag_emoji || '📍'} {city.name_ar} - {city.name_en}
                        </option>
                      ))}
                    </select>
                    {formData.country_id && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Country: {countries.find(c => c.id === parseInt(formData.country_id))?.name_ar}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">💰 Currency *</label>
                    <select
                      required
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 mb-2">📌 Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="live">✅ Live</option>
                      <option value="draft">📝 Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">⭐ Featured</label>
                    <select
                      value={formData.featured ? 'true' : 'false'}
                      onChange={(e) => setFormData({...formData, featured: e.target.value === 'true'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">🔥 Popular</label>
                    <select
                      value={formData.popular ? 'true' : 'false'}
                      onChange={(e) => setFormData({...formData, popular: e.target.value === 'true'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">📝 Description (Arabic)</label>
                  <textarea
                    rows="3"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">📝 Description (English)</label>
                  <textarea
                    rows="3"
                    value={formData.description_en}
                    onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* ===== رفع الصور ===== */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-primary mb-3">📸 Images</h3>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border">
                      <img 
                        src={img} 
                        alt={`Package ${idx}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/400x400/023d6d/ffffff?text=No+Image';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-4 cursor-pointer hover:border-primary">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm text-gray-500 mt-1">Select Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="btn-primary px-4"
                    >
                      {uploading ? `Uploading... ${uploadProgress}%` : `Upload ${selectedFiles.length} image(s)`}
                    </button>
                  )}
                </div>
                
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={addImageByUrl}
                    className="btn-primary px-4 text-sm"
                  >
                    Add URL
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">First image will be used as thumbnail.</p>
              </div>

              {/* ===== SEO ===== */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                  🔍 SEO Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">SEO Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.seo_title_ar}
                      onChange={(e) => setFormData({...formData, seo_title_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">SEO Title (English)</label>
                    <input
                      type="text"
                      value={formData.seo_title_en}
                      onChange={(e) => setFormData({...formData, seo_title_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2 text-sm">SEO Description (Arabic)</label>
                    <textarea
                      rows="2"
                      value={formData.seo_description_ar}
                      onChange={(e) => setFormData({...formData, seo_description_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2 text-sm">SEO Description (English)</label>
                    <textarea
                      rows="2"
                      value={formData.seo_description_en}
                      onChange={(e) => setFormData({...formData, seo_description_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ===== الشروط والأحكام ===== */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-primary mb-3">📜 Terms & Conditions</h3>
                <div className="mt-2">
                  <label className="block text-gray-700 mb-2">Terms (Arabic)</label>
                  <textarea
                    rows="3"
                    value={formData.terms_ar}
                    onChange={(e) => setFormData({...formData, terms_ar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-gray-700 mb-2">Terms (English)</label>
                  <textarea
                    rows="3"
                    value={formData.terms_en}
                    onChange={(e) => setFormData({...formData, terms_en: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* ============================================
                  الفروع مع الباقات الخاصة بكل فرع
              ============================================ */}
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-primary text-lg flex items-center gap-2">
                    <Building size={24} />
                    Branches & Packages
                    <span className="text-sm text-gray-400 font-normal">
                      ({formData.branches.length} {formData.branches.length > 1 ? 'فروع' : 'فرع'})
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={addBranch}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> Add Branch
                  </button>
                </div>

                {formData.branches.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Building size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No branches added yet. Click "Add Branch" to get started.</p>
                  </div>
                )}

                {formData.branches.map((branch, branchIndex) => (
                  <div key={branch.id} className="bg-white rounded-xl border border-gray-200 p-4 mt-4 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {branchIndex + 1}
                        </div>
                        <h4 className="font-bold text-primary">
                          {branch.name_ar || branch.name_en || `Branch ${branchIndex + 1}`}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBranch(branchIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Branch Name (Arabic) *</label>
                        <input
                          type="text"
                          value={branch.name_ar}
                          onChange={(e) => updateBranch(branchIndex, 'name_ar', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">Branch Name (English) *</label>
                        <input
                          type="text"
                          value={branch.name_en}
                          onChange={(e) => updateBranch(branchIndex, 'name_en', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm mb-1">City</label>
                        <select
                          value={branch.city_id}
                          onChange={(e) => updateBranch(branchIndex, 'city_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                        >
                          <option value="">Same as main city</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name_ar} - {city.name_en}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm mb-1">Address (Arabic)</label>
                        <input
                          type="text"
                          value={branch.address_ar}
                          onChange={(e) => updateBranch(branchIndex, 'address_ar', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm mb-1">Address (English)</label>
                        <input
                          type="text"
                          value={branch.address_en}
                          onChange={(e) => updateBranch(branchIndex, 'address_en', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">📍 Location URL</label>
                        <input
                          type="url"
                          value={branch.location_map_url}
                          onChange={(e) => updateBranch(branchIndex, 'location_map_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">🗺️ Embed URL</label>
                        <input
                          type="url"
                          value={branch.map_embed_url}
                          onChange={(e) => updateBranch(branchIndex, 'map_embed_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">📞 Phone</label>
                        <input
                          type="text"
                          value={branch.phone}
                          onChange={(e) => updateBranch(branchIndex, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-sm mb-1">⏰ Working Hours</label>
                        <input
                          type="text"
                          value={branch.working_hours}
                          onChange={(e) => updateBranch(branchIndex, 'working_hours', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                          placeholder="9:00 AM - 10:00 PM"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-700 flex items-center gap-2">
                          <PackageIcon size={16} />
                          Packages for this branch
                          <span className="text-xs text-gray-400">
                            ({branch.tiers.length} {branch.tiers.length > 1 ? 'باقات' : 'باقة'})
                          </span>
                        </h5>
                        <div className="flex gap-2">
                          {formData.branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const fromIndex = window.prompt(
                                  `Enter the branch number (1-${formData.branches.length}) to copy packages from:`,
                                  '1'
                                );
                                if (fromIndex) {
                                  const idx = parseInt(fromIndex) - 1;
                                  if (idx >= 0 && idx < formData.branches.length && idx !== branchIndex) {
                                    if (formData.branches[idx].tiers.length > 0) {
                                      if (window.confirm(`Copy packages from "${formData.branches[idx].name_ar}" to "${branch.name_ar}"?`)) {
                                        copyTiersToBranch(idx, branchIndex);
                                      }
                                    } else {
                                      alert('The selected branch has no packages to copy.');
                                    }
                                  } else {
                                    alert('Invalid branch number.');
                                  }
                                }
                              }}
                              className="text-sm text-primary hover:text-accent flex items-center gap-1"
                            >
                              <Copy size={14} /> Copy from another branch
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => addTierToBranch(branchIndex)}
                            className="text-sm text-primary hover:text-accent flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Package
                          </button>
                        </div>
                      </div>

                      {branch.tiers.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-4">
                          No packages for this branch yet. Click "Add Package" to create one.
                        </p>
                      )}

                      {branch.tiers.map((tier, tierIndex) => {
                        const hasTierDiscount = tier.price_before_discount > 0 && tier.price_before_discount > tier.price;
                        const discountPercentTier = hasTierDiscount 
                          ? Math.round(((tier.price_before_discount - tier.price) / tier.price_before_discount) * 100)
                          : 0;

                        return (
                          <div key={tier.id} className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-primary">
                                Package {tierIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTierFromBranch(branchIndex, tierIndex)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Name (Arabic) *</label>
                                <input
                                  type="text"
                                  value={tier.name_ar}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'name_ar', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Name (English) *</label>
                                <input
                                  type="text"
                                  value={tier.name_en}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'name_en', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Max Children</label>
                                <input
                                  type="number"
                                  value={tier.max_children}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'max_children', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-gray-600 text-xs mb-1">Description (Arabic)</label>
                                <input
                                  type="text"
                                  value={tier.description_ar}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'description_ar', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-gray-600 text-xs mb-1">Description (English)</label>
                                <input
                                  type="text"
                                  value={tier.description_en}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'description_en', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Price *</label>
                                <input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'price', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-xs mb-1">Price Before Discount</label>
                                <input
                                  type="number"
                                  value={tier.price_before_discount}
                                  onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'price_before_discount', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                  placeholder="Leave empty for no discount"
                                />
                              </div>
                              {hasTierDiscount && (
                                <div className="col-span-2 text-xs text-green-600 bg-green-50 p-1.5 rounded">
                                  💰 Discount: {tier.price_before_discount} → {tier.price} SAR ({discountPercentTier}% OFF)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== أزرار الإرسال ===== */}
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPackage(null);
                    setSelectedFiles([]);
                    setImageUrlInput('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2"
                  disabled={uploading || submitting || formData.branches.length === 0}
                >
                  {submitting ? (editingPackage ? 'Updating...' : 'Creating...') : (editingPackage ? 'Update Package' : 'Create Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}