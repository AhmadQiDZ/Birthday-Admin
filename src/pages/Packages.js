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

  const currencies = [
    { code: 'SAR', label: '🇸🇦 SAR - Saudi Riyal', symbol: 'ر.س' },
    { code: 'AED', label: '🇦🇪 AED - UAE Dirham', symbol: 'د.إ' },
    { code: 'BHD', label: '🇧🇭 BHD - Bahraini Dinar', symbol: 'د.ب' },
    { code: 'QAR', label: '🇶🇦 QAR - Qatari Riyal', symbol: 'ر.ق' },
    { code: 'EUR', label: '🇪🇺 EUR - Euro', symbol: '€' },
    { code: 'GBP', label: '🇬🇧 GBP - British Pound', symbol: '£' }
  ];

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
          id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          _isNew: true,
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
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      _isNew: true,
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
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      _isNew: true
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
  // ✅ دالة حفظ الباقة (تم إعادة كتابتها بالكامل لحل مشكلة التكرار)
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
        // ===== تحديث باقة موجودة =====
        const { error: updateError } = await supabase
          .from('packages')
          .update({
            ...packageData,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
            notes: note
          })
          .eq('id', editingPackage.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          alert('Error updating package: ' + updateError.message);
          setSubmitting(false);
          return;
        }

        packageId = editingPackage.id;
        console.log('✅ Package updated, ID:', packageId);

        // ===== جلب الفروع الموجودة في قاعدة البيانات =====
        const { data: existingBranches, error: fetchBrErr } = await supabase
          .from('branches')
          .select('id')
          .eq('package_id', packageId);

        if (fetchBrErr) {
          console.error('❌ Error fetching existing branches:', fetchBrErr);
        }

        const existingBranchIds = (existingBranches || []).map(b => b.id);

        // ===== تحديد الفروع: موجودة للتحديث / جديدة للإضافة / محذوفة للحذف =====
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

          if (!branch._isNew && branch.id && existingBranchIds.includes(branch.id)) {
            // ✅ فرع موجود → تحديثه فقط
            console.log('🔄 Updating existing branch:', branch.id);
            const { error: brUpdateErr } = await supabase
              .from('branches')
              .update(branchData)
              .eq('id', branch.id);

            if (brUpdateErr) {
              console.error('❌ Error updating branch:', brUpdateErr);
              continue;
            }
            branchId = branch.id;
          } else {
            // ✅ فرع جديد → إدراجه
            console.log('➕ Inserting new branch');
            const { data: newBrData, error: brInsertErr } = await supabase
              .from('branches')
              .insert(branchData)
              .select();

            if (brInsertErr) {
              console.error('❌ Error inserting branch:', brInsertErr);
              continue;
            }
            branchId = newBrData?.[0]?.id;
          }

          if (!branchId) continue;

          // ===== جلب الـ tiers الموجودة في قاعدة البيانات لهذا الفرع =====
          const { data: existingTiers, error: fetchTiersErr } = await supabase
            .from('package_tiers')
            .select('id')
            .eq('branch_id', branchId);

          const existingTierIds = (existingTiers || []).map(t => t.id);

          // ===== تحديد الـ tiers: موجودة للتحديث / جديدة للإضافة / محذوفة للحذف =====
          const formTierExistingIds = branch.tiers
            .filter(t => !t._isNew && t.id && existingTierIds.includes(t.id))
            .map(t => t.id);

          // 1) حذف الـ tiers التي أُزيلت من الفورم فقط
          const tiersToDelete = existingTierIds.filter(id => !formTierExistingIds.includes(id));
          if (tiersToDelete.length > 0) {
            console.log('🗑️ Deleting removed tiers:', tiersToDelete);
            const { error: delTierErr } = await supabase
              .from('package_tiers')
              .delete()
              .in('id', tiersToDelete);

            if (delTierErr) {
              console.warn('⚠️ Could not delete tiers (may have booking references), trying soft delete:', delTierErr.message);
              // محاولة الحذف الناعم إذا كان هناك عمود deleted_at
              try {
                await supabase
                  .from('package_tiers')
                  .update({ deleted_at: new Date().toISOString() })
                  .in('id', tiersToDelete);
                console.log('✅ Soft deleted tiers instead');
              } catch (softErr) {
                console.warn('⚠️ Soft delete also failed, skipping:', softErr);
              }
            }
          }

          // 2) تحديث أو إدراج كل tier في الفورم
          for (const tier of branch.tiers) {
            const tierData = {
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
            };

            if (!tier._isNew && tier.id && existingTierIds.includes(tier.id)) {
              // ✅ tier موجود → تحديثه فقط (بدون حذف!)
              console.log('🔄 Updating existing tier:', tier.id);
              const { error: tierUpdErr } = await supabase
                .from('package_tiers')
                .update(tierData)
                .eq('id', tier.id);

              if (tierUpdErr) {
                console.error('❌ Error updating tier:', tierUpdErr);
              }
            } else {
              // ✅ tier جديد → إدراجه فقط
              console.log('➕ Inserting new tier');
              const { error: tierInsErr } = await supabase
                .from('package_tiers')
                .insert(tierData);

              if (tierInsErr) {
                console.error('❌ Error inserting tier:', tierInsErr);
              }
            }
          }
        }

        // 3) حذف الفروع التي أُزيلت من الفورم
        const formBranchExistingIds = formData.branches
          .filter(b => !b._isNew && b.id && existingBranchIds.includes(b.id))
          .map(b => b.id);

        const branchesToDelete = existingBranchIds.filter(id => !formBranchExistingIds.includes(id));
        for (const brIdToDelete of branchesToDelete) {
          console.log('🗑️ Deleting removed branch:', brIdToDelete);

          // محاولة حذف الـ tiers المرتبطة
          const { data: brTiers } = await supabase
            .from('package_tiers')
            .select('id')
            .eq('branch_id', brIdToDelete);

          if (brTiers && brTiers.length > 0) {
            const brTierIds = brTiers.map(t => t.id);
            const { error: delBrTiersErr } = await supabase
              .from('package_tiers')
              .delete()
              .in('id', brTierIds);

            if (delBrTiersErr) {
              console.warn('⚠️ Could not delete branch tiers, trying soft delete:', delBrTiersErr.message);
              try {
                await supabase
                  .from('package_tiers')
                  .update({ deleted_at: new Date().toISOString() })
                  .in('id', brTierIds);
              } catch (e) {
                console.warn('⚠️ Soft delete failed for branch tiers:', e);
              }
            }
          }

          // حذف الفرع نفسه
          const { error: delBrErr } = await supabase
            .from('branches')
            .delete()
            .eq('id', brIdToDelete);

          if (delBrErr) {
            console.warn('⚠️ Could not delete branch:', delBrErr.message);
            // فصل الفرع عن الباقة بدلاً من حذفه
            await supabase
              .from('branches')
              .update({ package_id: null })
              .eq('id', brIdToDelete);
          }
        }

      } else {
        // ===== إنشاء باقة جديدة =====
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
        await supabase
          .from('packages')
          .update({ has_multiple_branches: formData.branches.length > 1 })
          .eq('id', packageId);

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
  // دالة تحميل البيانات للتعديل (تم تعديلها لتمييز البيانات الموجودة)
  // ============================================
  async function loadPackageForEdit(pkg) {
    setEditingPackage(pkg);
    setSelectedCountryId(pkg.cities?.country_id || '');

    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('*')
      .eq('package_id', pkg.id)
      .order('name_ar');

    if (branchesError) {
      console.error('❌ Error loading branches:', branchesError);
    }

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
          _isNew: false, // ✅ علامة مهمة: هذا فرع موجود في قاعدة البيانات
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
            _isNew: false, // ✅ علامة مهمة: هذا tier موجود في قاعدة البيانات
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
  // دوال الحذف وتغيير الحالة (تم تعديلها للتعامل مع 409)
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
      try {
        await supabase.from('reviews').delete().eq('package_id', id);
      } catch (e) {
        console.warn('⚠️ Could not delete reviews:', e);
      }

      // 3. جلب الـ tier IDs أولاً لمحاولة حذفها بشكل آمن
      const { data: allTiers } = await supabase
        .from('package_tiers')
        .select('id')
        .eq('package_id', id);

      if (allTiers && allTiers.length > 0) {
        const tierIds = allTiers.map(t => t.id);
        const { error: delTiersErr } = await supabase
          .from('package_tiers')
          .delete()
          .in('id', tierIds);

        if (delTiersErr) {
          console.warn('⚠️ Could not delete tiers, trying soft delete:', delTiersErr.message);
          try {
            await supabase
              .from('package_tiers')
              .update({ deleted_at: new Date().toISOString() })
              .in('id', tierIds);
          } catch (e) {
            console.warn('⚠️ Soft delete of tiers also failed:', e);
          }
        }
      }

      // 4. حذف الفروع
      const { error: delBrErr } = await supabase
        .from('branches')
        .delete()
        .eq('package_id', id);

      if (delBrErr) {
        console.warn('⚠️ Could not delete branches, unlinking instead:', delBrErr.message);
        await supabase
          .from('branches')
          .update({ package_id: null })
          .eq('package_id', id);
      }

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
  // دوال FAQ
  // ============================================
  function addFaq(lang) {
    const key = lang === 'ar' ? 'faq_ar' : 'faq_en';
    setFormData({
      ...formData,
      [key]: [...(formData[key] || []), { question: '', answer: '' }]
    });
  }

  function updateFaq(lang, index, field, value) {
    const key = lang === 'ar' ? 'faq_ar' : 'faq_en';
    const updated = [...(formData[key] || [])];
    updated[index][field] = value;
    setFormData({ ...formData, [key]: updated });
  }

  function removeFaq(lang, index) {
    const key = lang === 'ar' ? 'faq_ar' : 'faq_en';
    const updated = [...(formData[key] || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, [key]: updated });
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
                {editingPackage ? '✏️ Edit Package' : '➕ Add New Package'}
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
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">SEO Keywords (Arabic)</label>
                    <input
                      type="text"
                      value={formData.seo_keywords_ar}
                      onChange={(e) => setFormData({...formData, seo_keywords_ar: e.target.value})}
                      placeholder="كلمة1, كلمة2, كلمة3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">SEO Keywords (English)</label>
                    <input
                      type="text"
                      value={formData.seo_keywords_en}
                      onChange={(e) => setFormData({...formData, seo_keywords_en: e.target.value})}
                      placeholder="word1, word2, word3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ===== الشروط والأحكام ===== */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-primary mb-3">📜 Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Terms (Arabic)</label>
                    <textarea
                      rows="4"
                      value={formData.terms_ar}
                      onChange={(e) => setFormData({...formData, terms_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Terms (English)</label>
                    <textarea
                      rows="4"
                      value={formData.terms_en}
                      onChange={(e) => setFormData({...formData, terms_en: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ===== FAQ ===== */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-primary mb-3">❓ FAQ</h3>

                {/* Arabic FAQ */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 text-sm font-semibold">FAQ (Arabic)</label>
                    <button
                      type="button"
                      onClick={() => addFaq('ar')}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      <Plus size={14} className="inline" /> Add
                    </button>
                  </div>
                  {(formData.faq_ar || []).map((faq, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-gray-50">
                      <div className="flex justify-end mb-2">
                        <button type="button" onClick={() => removeFaq('ar', idx)} className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq('ar', idx, 'question', e.target.value)}
                        placeholder="Question (Arabic)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm mb-2 focus:outline-none focus:border-primary"
                      />
                      <textarea
                        rows="2"
                        value={faq.answer}
                        onChange={(e) => updateFaq('ar', idx, 'answer', e.target.value)}
                        placeholder="Answer (Arabic)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>

                {/* English FAQ */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 text-sm font-semibold">FAQ (English)</label>
                    <button
                      type="button"
                      onClick={() => addFaq('en')}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                    >
                      <Plus size={14} className="inline" /> Add
                    </button>
                  </div>
                  {(formData.faq_en || []).map((faq, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-gray-50">
                      <div className="flex justify-end mb-2">
                        <button type="button" onClick={() => removeFaq('en', idx)} className="text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq('en', idx, 'question', e.target.value)}
                        placeholder="Question (English)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm mb-2 focus:outline-none focus:border-primary"
                      />
                      <textarea
                        rows="2"
                        value={faq.answer}
                        onChange={(e) => updateFaq('en', idx, 'answer', e.target.value)}
                        placeholder="Answer (English)"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== الفروع والباقات ===== */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-primary">🏢 Branches & Package Tiers</h3>
                  <button
                    type="button"
                    onClick={addBranch}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Branch
                  </button>
                </div>

                {formData.branches.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Building size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No branches added yet. Click "Add Branch" to start.</p>
                  </div>
                )}

                {formData.branches.map((branch, branchIndex) => (
                  <div key={branch.id} className="border-2 border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Building size={18} />
                        Branch {branchIndex + 1}
                        {!branch._isNew && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Existing</span>
                        )}
                        {branch._isNew && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">New</span>
                        )}
                      </h4>
                      <div className="flex gap-2 items-center">
                        {/* زر نسخ الباقات بين الفروع */}
                        {formData.branches.length > 1 && branch.tiers.length > 0 && (
                          <select
                            onChange={(e) => {
                              const toIdx = parseInt(e.target.value);
                              if (toIdx !== branchIndex && !isNaN(toIdx)) {
                                if (window.confirm(`Copy tiers from Branch ${branchIndex + 1} to Branch ${toIdx + 1}?`)) {
                                  copyTiersToBranch(branchIndex, toIdx);
                                }
                                e.target.value = '';
                              }
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary"
                            defaultValue=""
                          >
                            <option value="" disabled>Copy tiers to...</option>
                            {formData.branches.map((_, i) => (
                              i !== branchIndex && <option key={i} value={i}>Branch {i + 1}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => removeBranch(branchIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove branch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Branch Name (Arabic) *</label>
                        <input
                          type="text"
                          required
                          value={branch.name_ar}
                          onChange={(e) => updateBranch(branchIndex, 'name_ar', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="اسم الفرع بالعربي"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Branch Name (English) *</label>
                        <input
                          type="text"
                          required
                          value={branch.name_en}
                          onChange={(e) => updateBranch(branchIndex, 'name_en', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="Branch name in English"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Branch City</label>
                        <select
                          value={branch.city_id}
                          onChange={(e) => updateBranch(branchIndex, 'city_id', parseInt(e.target.value) || '')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="">Same as package city</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.id}>
                              {city.countries?.flag_emoji || ''} {city.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Phone</label>
                        <input
                          type="text"
                          value={branch.phone}
                          onChange={(e) => updateBranch(branchIndex, 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="+966 5x xxx xxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Address (Arabic)</label>
                        <input
                          type="text"
                          value={branch.address_ar}
                          onChange={(e) => updateBranch(branchIndex, 'address_ar', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="العنوان بالعربي"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Address (English)</label>
                        <input
                          type="text"
                          value={branch.address_en}
                          onChange={(e) => updateBranch(branchIndex, 'address_en', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="Address in English"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Google Maps URL</label>
                        <input
                          type="url"
                          value={branch.location_map_url}
                          onChange={(e) => updateBranch(branchIndex, 'location_map_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">Map Embed URL</label>
                        <input
                          type="url"
                          value={branch.map_embed_url}
                          onChange={(e) => updateBranch(branchIndex, 'map_embed_url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="https://www.google.com/maps/embed?..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-xs mb-1">Working Hours</label>
                        <input
                          type="text"
                          value={branch.working_hours}
                          onChange={(e) => updateBranch(branchIndex, 'working_hours', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                          placeholder="Sat-Thu: 10:00 AM - 10:00 PM"
                        />
                      </div>
                    </div>

                    {/* ===== Package Tiers ===== */}
                    <div className="border-t pt-3 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-gray-700 text-sm">📦 Package Tiers</h5>
                        <button
                          type="button"
                          onClick={() => addTierToBranch(branchIndex)}
                          className="text-xs bg-accent text-white px-3 py-1.5 rounded-full hover:bg-accent/80 flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Tier
                        </button>
                      </div>

                      {branch.tiers.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-4 bg-white rounded border">
                          No tiers added. Click "Add Tier" to add packages.
                        </p>
                      )}

                      {branch.tiers.map((tier, tierIndex) => (
                        <div key={tier.id} className="border rounded-lg p-3 mb-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-500">
                              Tier {tierIndex + 1}
                              {!tier._isNew && (
                                <span className="ml-1 text-green-600">(Existing)</span>
                              )}
                              {tier._isNew && (
                                <span className="ml-1 text-blue-600">(New)</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTierFromBranch(branchIndex, tierIndex)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-gray-500 text-xs mb-1">Tier Name (Arabic) *</label>
                              <input
                                type="text"
                                required
                                value={tier.name_ar}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'name_ar', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="اسم الباقة"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 text-xs mb-1">Tier Name (English) *</label>
                              <input
                                type="text"
                                required
                                value={tier.name_en}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'name_en', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="Tier name"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 text-xs mb-1">Price * ({formData.currency})</label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={tier.price}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'price', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 text-xs mb-1">Price Before Discount</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tier.price_before_discount}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'price_before_discount', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-500 text-xs mb-1">Max Children</label>
                              <input
                                type="number"
                                min="0"
                                value={tier.max_children}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'max_children', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="0"
                              />
                            </div>
                            {tier.show_discount && (
                              <div className="flex items-end">
                                <span className="text-green-600 text-xs bg-green-50 px-3 py-1.5 rounded border border-green-200">
                                  ✅ Discount shown ({Math.round((1 - (parseFloat(tier.price) || 0) / (parseFloat(tier.price_before_discount) || 1)) * 100)}% off)
                                </span>
                              </div>
                            )}
                            <div className="md:col-span-2">
                              <label className="block text-gray-500 text-xs mb-1">Description (Arabic)</label>
                              <textarea
                                rows="2"
                                value={tier.description_ar}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'description_ar', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="وصف الباقة بالعربي"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-gray-500 text-xs mb-1">Description (English)</label>
                              <textarea
                                rows="2"
                                value={tier.description_en}
                                onChange={(e) => updateTierInBranch(branchIndex, tierIndex, 'description_en', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                                placeholder="Tier description in English"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== ملاحظة ===== */}
              {editingPackage && (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h3 className="font-bold text-yellow-700 mb-2">📝 Note</h3>
                  <textarea
                    rows="2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for this update..."
                    className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                  />
                </div>
              )}

              {/* ===== أزرار الحفظ ===== */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPackage(null);
                    setSelectedFiles([]);
                    setImageUrlInput('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-8 py-2 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingPackage ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingPackage ? '✅ Update Package' : '➕ Create Package'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}