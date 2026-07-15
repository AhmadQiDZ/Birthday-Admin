import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Eye, CheckCircle, XCircle, Clock, RefreshCw, Calendar, X, Filter, User, Edit2 } from 'lucide-react';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [cities, setCities] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // استخدام useCallback لتثبيت الدالة ومنع إعادة الإنشاء
  const fetchCities = useCallback(async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name_ar, name_en')
      .order('name_ar');

    if (!error && data) {
      setCities(data);
    }
  }, []);

  // استخدام useCallback لتثبيت الدالة
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setDebugInfo('Loading...');
    
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          customer_name,
          phone,
          email,
          child_count,
          booking_date,
          status,
          admin_note,
          customer_note,
          created_at,
          updated_at,
          package_id,
          package_tier_id,
          branch_id,
          packages:package_id (
            id,
            venue_name_ar,
            venue_name_en,
            city_id,
            cities (
              name_ar,
              name_en
            )
          ),
          package_tiers:package_tier_id (
            id,
            name_ar,
            name_en,
            price
          ),
          branches:branch_id (
            id,
            name_ar,
            name_en,
            address_ar,
            address_en
          )
        `)
        .order('created_at', { ascending: false });

      if (cityFilter !== 'all') {
        query = query.eq('packages.city_id', parseInt(cityFilter));
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error:', error);
        setDebugInfo('Error: ' + error.message);
        setBookings([]);
        setLoading(false);
        return;
      }

      const formattedData = data?.map(booking => ({
        ...booking,
        packages: booking.packages || null,
        package_tiers: booking.package_tiers || null,
        branches: booking.branches || null
      })) || [];

      setBookings(formattedData);
      setDebugInfo(`✅ ${formattedData.length} bookings loaded`);
    } catch (err) {
      console.error('❌ Error:', err);
      setDebugInfo('Error: ' + err.message);
      setBookings([]);
    }
    setLoading(false);
  }, [cityFilter]); // إضافة cityFilter كdependency

  // useEffect الأول - تحميل المدن
  useEffect(() => {
    fetchCities();
  }, [fetchCities]); // إضافة fetchCities كdependency

  // useEffect الثاني - تحميل الحجوزات
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // إضافة fetchBookings كdependency

  async function updateBookingStatus(id, status, adminNoteText) {
    if (!window.confirm(`Are you sure you want to mark this booking as ${status}?`)) return;
    
    setUpdating(true);
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: status,
          admin_note: adminNoteText || adminNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Update error:', error);
        alert('Error updating booking: ' + error.message);
        setUpdating(false);
        return;
      }

      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: user.name,
        action: `booking_${status}`,
        table_name: 'bookings',
        record_id: id,
        new_data: { status, admin_note: adminNoteText || adminNote }
      });

      alert(`✅ Booking marked as ${status} successfully!`);
      setSelectedBooking(null);
      setAdminNote('');
      fetchBookings();
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error: ' + err.message);
    }
    setUpdating(false);
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700"><Clock size={12} /> Pending</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"><CheckCircle size={12} /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPackageName = (booking) => {
    if (booking.packages) {
      return booking.packages.venue_name_en || booking.packages.venue_name_ar || 'N/A';
    }
    return 'N/A';
  };

  const getTierName = (booking) => {
    if (booking.package_tiers) {
      return booking.package_tiers.name_en || booking.package_tiers.name_ar || 'N/A';
    }
    return null;
  };

  const getBranchName = (booking) => {
    if (booking.branches) {
      return booking.branches.name_en || booking.branches.name_ar || 'N/A';
    }
    return null;
  };

  const getCityName = (booking) => {
    if (booking.packages?.cities) {
      return booking.packages.cities.name_en || booking.packages.cities.name_ar || 'N/A';
    }
    return 'N/A';
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      booking.customer_name?.toLowerCase().includes(search) ||
      booking.phone?.includes(search) ||
      booking.email?.toLowerCase().includes(search) ||
      getPackageName(booking).toLowerCase().includes(search) ||
      getBranchName(booking)?.toLowerCase().includes(search) ||
      getCityName(booking).toLowerCase().includes(search)
    );
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Bookings</h1>
          <p className="text-sm text-gray-500">Manage customer booking requests</p>
          {debugInfo && <p className="text-xs text-gray-400 mt-1">{debugInfo}</p>}
        </div>
        <button 
          onClick={() => fetchBookings()}
          className="btn-outline flex items-center gap-2 text-sm px-4 py-2 self-start"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition">
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition ${
              filter === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Completed ({stats.completed})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm transition ${
              filter === 'cancelled' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Cancelled ({stats.cancelled})
          </button>
        </div>
        
        {/* City Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name_en} - {city.name_ar}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, email, package, branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bookings found</p>
          <p className="text-gray-400 text-sm">
            {filter !== 'all' ? `No ${filter} bookings` : 'Bookings will appear here when customers make a reservation'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">#</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Customer</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Package / Branch</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Tier</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Customer Note</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Date</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-600">Children</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, index) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 text-center text-sm text-gray-500">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{booking.customer_name}</div>
                      <div className="text-xs text-gray-500">{booking.phone}</div>
                      {booking.email && <div className="text-xs text-gray-400 truncate max-w-[120px]">{booking.email}</div>}
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{getPackageName(booking)}</div>
                      {booking.branches && (
                        <div className="text-xs text-gray-500">📍 {getBranchName(booking)}</div>
                      )}
                      <div className="text-xs text-gray-400">{getCityName(booking)}</div>
                    </td>
                    <td className="p-3">
                      {booking.package_tiers ? (
                        <div>
                          <div className="text-sm font-medium">{getTierName(booking)}</div>
                          <div className="text-xs text-accent font-semibold">{booking.package_tiers.price} SAR</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No tier</span>
                      )}
                    </td>
                    <td className="p-3">
                      {booking.customer_note ? (
                        <span className="text-xs text-gray-600 line-clamp-2 max-w-[150px]">
                          {booking.customer_note}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{new Date(booking.booking_date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{new Date(booking.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3 text-center text-sm">{booking.child_count}</td>
                    <td className="p-3">{getStatusBadge(booking.status)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setAdminNote(booking.admin_note || '');
                        }}
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet Cards */}
          <div className="hidden sm:block lg:hidden divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-bold text-primary text-lg">{booking.customer_name}</div>
                    <div className="text-sm text-gray-500">{booking.phone}</div>
                    {booking.email && <div className="text-sm text-gray-400">{booking.email}</div>}
                  </div>
                  <div>{getStatusBadge(booking.status)}</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Package:</span>
                    <span className="ml-1 font-medium block sm:inline">{getPackageName(booking)}</span>
                  </div>
                  {booking.branches && (
                    <div>
                      <span className="text-gray-500">Branch:</span>
                      <span className="ml-1 font-medium block sm:inline">{getBranchName(booking)}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Tier:</span>
                    <span className="ml-1 font-medium block sm:inline">
                      {booking.package_tiers ? getTierName(booking) : 'No tier'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 font-medium text-accent block sm:inline">
                      {booking.package_tiers ? `${booking.package_tiers.price} SAR` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer Note:</span>
                    <span className="ml-1 font-medium block sm:inline">
                      {booking.customer_note || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-1 block sm:inline">{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Children:</span>
                    <span className="ml-1 block sm:inline">{booking.child_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Requested:</span>
                    <span className="ml-1 block sm:inline">{new Date(booking.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">City:</span>
                    <span className="ml-1 block sm:inline">{getCityName(booking)}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setAdminNote(booking.admin_note || '');
                  }}
                  className="mt-3 w-full sm:w-auto btn-outline text-sm py-1.5 px-4 flex items-center justify-center gap-1"
                >
                  <Eye size={16} /> View Details
                </button>
              </div>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-primary">{booking.customer_name}</div>
                    <div className="text-sm text-gray-500">{booking.phone}</div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Package:</span>
                    <span className="font-medium text-right">{getPackageName(booking)}</span>
                  </div>
                  {booking.branches && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Branch:</span>
                      <span className="font-medium text-right">{getBranchName(booking)}</span>
                    </div>
                  )}
                  {booking.package_tiers && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tier:</span>
                      <span className="font-medium text-right">{getTierName(booking)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Children:</span>
                    <span>{booking.child_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer Note:</span>
                    <span className="truncate max-w-[120px]">{booking.customer_note || '—'}</span>
                  </div>
                  {booking.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="truncate max-w-[140px]">{booking.email}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setAdminNote(booking.admin_note || '');
                  }}
                  className="mt-3 w-full btn-primary text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Eye size={16} /> View Details
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2">
            <span>Showing {filteredBookings.length} of {bookings.length} bookings</span>
            <span>Updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">Booking Details</h2>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAdminNote('');
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Customer</label>
                  <p className="font-semibold text-base">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Phone</label>
                  <p className="font-semibold text-base">{selectedBooking.phone}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Email</label>
                  <p className="font-semibold text-base">{selectedBooking.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Children</label>
                  <p className="font-semibold text-base">{selectedBooking.child_count}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Booking Date</label>
                  <p className="font-semibold text-base">{new Date(selectedBooking.booking_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider">Requested</label>
                  <p className="font-semibold text-base">{new Date(selectedBooking.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Package Info */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider">Package</label>
                <p className="font-semibold text-base">{getPackageName(selectedBooking)}</p>
                {selectedBooking.branches && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 Branch: <span className="font-medium">{getBranchName(selectedBooking)}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  🏙️ City: <span className="font-medium">{getCityName(selectedBooking)}</span>
                </p>
                {selectedBooking.package_tiers && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-500">Tier:</span>
                    <span className="font-medium text-sm">{getTierName(selectedBooking)}</span>
                    <span className="text-accent font-bold text-lg">{selectedBooking.package_tiers.price} SAR</span>
                  </div>
                )}
              </div>

              {/* Customer Note */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Customer Note
                </label>
                {selectedBooking.customer_note ? (
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedBooking.customer_note}</p>
                    <p className="text-xs text-gray-400 mt-1">Note added by customer at booking time</p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">No customer note</p>
                )}
              </div>

              {/* Status */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider">Current Status</label>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>

              {/* Update Status */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Update Status</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'completed', adminNote)}
                    disabled={updating}
                    className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition disabled:opacity-50 text-sm font-medium"
                  >
                    ✅ Mark Completed
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled', adminNote)}
                    disabled={updating}
                    className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm font-medium"
                  >
                    ❌ Mark Cancelled
                  </button>
                </div>
              </div>

              {/* Admin Note */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Edit2 size={14} /> Admin Note
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add admin note about this booking..."
                  className="w-full mt-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  rows="3"
                />
                {selectedBooking.admin_note && (
                  <p className="text-xs text-gray-400 mt-1">
                    Previous admin note: {selectedBooking.admin_note}
                  </p>
                )}
              </div>

              {/* Last Activity */}
              <div className="border-t pt-4">
                <label className="text-gray-500 text-xs uppercase tracking-wider">Last Activity</label>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedBooking.updated_at ? (
                    <>Updated: {new Date(selectedBooking.updated_at).toLocaleString()}</>
                  ) : (
                    <>Created: {new Date(selectedBooking.created_at).toLocaleString()}</>
                  )}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAdminNote('');
                }}
                className="px-6 py-2.5 btn-primary text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}