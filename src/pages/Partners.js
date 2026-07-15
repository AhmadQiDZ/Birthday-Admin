import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle, Eye, MessageCircle, Calendar, User, Building2, MapPin, Phone, Mail, Clock, RefreshCw, X, Search } from 'lucide-react';

export default function Partners() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // تم إزالة currentUser لأنه غير مستخدم

  useEffect(() => {
    // تم إزالة setCurrentUser لأنه غير مستخدم
    fetchRequests();

    // الاستماع للأحداث الجديدة من الموقع العام
    const handleNewRequest = () => {
      console.log('🔄 New partner request detected! Refreshing...');
      fetchRequests();
    };

    window.addEventListener('partnerRequestSubmitted', handleNewRequest);

    return () => {
      window.removeEventListener('partnerRequestSubmitted', handleNewRequest);
    };
  }, []);

  async function fetchRequests() {
    setLoading(true);
    setError(null);
    console.log('🔍 Fetching partner requests...');
    
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase Error:', error);
        setError(error.message);
      } else {
        console.log(`✅ Loaded ${data?.length || 0} partner requests`);
        console.log('📋 Data:', data);
        setRequests(data || []);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
    }
    
    setLoading(false);
    setRefreshing(false);
  }

  async function updateRequestStatus(id, status) {
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({
          status: status,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        await supabase.from('audit_log').insert({
          user_id: user.id,
          user_name: user.name,
          action: `partner_request_${status}`,
          table_name: 'partner_requests',
          record_id: id
        });
        
        fetchRequests();
        setSelectedRequest(null);
      } else {
        console.error('❌ Update error:', error);
        alert('Error updating status: ' + error.message);
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert('Error: ' + err.message);
    }
  }

  async function deleteRequest(id) {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const { error } = await supabase
        .from('partner_requests')
        .delete()
        .eq('id', id);

      if (!error) {
        console.log('🗑️ Request deleted successfully');
        fetchRequests();
        setSelectedRequest(null);
      } else {
        console.error('❌ Delete error:', error);
        alert('Error deleting: ' + error.message);
      }
    } catch (err) {
      console.error('❌ Error deleting:', err);
      alert('Error: ' + err.message);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // تصفية الطلبات
  const filteredRequests = requests.filter(request => {
    // فلتر الحالة
    if (filter !== 'all' && request.status !== filter) return false;
    
    // فلتر البحث
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        request.name?.toLowerCase().includes(term) ||
        request.venue_name?.toLowerCase().includes(term) ||
        request.city?.toLowerCase().includes(term) ||
        request.email?.toLowerCase().includes(term) ||
        request.phone?.toLowerCase().includes(term) ||
        request.notes?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  // إحصائيات
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Partner Requests</h1>
          <p className="text-gray-500 mt-1">Manage venue registration requests from partners</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 size={24} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Clock size={24} className="text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contacted</p>
              <p className="text-2xl font-bold text-green-600">{stats.contacted}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'contacted' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Contacted ({stats.contacted})
          </button>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, venue, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          <p className="font-medium">⚠️ Error loading data:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchRequests}
            className="mt-2 px-4 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">#</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Venue</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">City</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Notes</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="font-medium">No partner requests found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm ? 'Try adjusting your search or filter' : 'New requests will appear here'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 text-sm text-gray-400">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-800">{request.name}</td>
                      <td className="p-4 text-gray-600">{request.venue_name}</td>
                      <td className="p-4 text-gray-600">{request.city}</td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">{request.phone}</div>
                        <div className="text-sm text-gray-400">{request.email}</div>
                      </td>
                      <td className="p-4">
                        {request.notes ? (
                          <div className="text-sm max-w-[150px] truncate text-gray-600" title={request.notes}>
                            <MessageCircle size={14} className="inline mr-1 text-gray-400" />
                            {request.notes}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'contacted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status === 'contacted' ? '✅ Contacted' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {request.status === 'pending' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'contacted')}
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                              title="Mark as Contacted"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Request Details */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-800 p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 size={24} />
                Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white/80 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <User size={14} /> Name
                  </label>
                  <p className="font-medium text-gray-800">{selectedRequest.name}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <Building2 size={14} /> Venue
                  </label>
                  <p className="font-medium text-gray-800">{selectedRequest.venue_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin size={14} /> City
                  </label>
                  <p className="font-medium text-gray-800">{selectedRequest.city}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock size={14} /> Status
                  </label>
                  <p className={`font-medium ${
                    selectedRequest.status === 'contacted' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedRequest.status === 'contacted' ? '✅ Contacted' : '⏳ Pending'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <Phone size={14} /> Phone
                  </label>
                  <p className="font-medium text-gray-800">{selectedRequest.phone}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <Mail size={14} /> Email
                  </label>
                  <p className="font-medium text-gray-800 break-all">{selectedRequest.email}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <MessageCircle size={14} /> Notes
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-700 whitespace-pre-wrap border border-gray-200">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-500 text-sm flex items-center gap-1">
                  <Calendar size={14} /> Request Date
                </label>
                <p className="font-medium text-gray-800">
                  {new Date(selectedRequest.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>

              {selectedRequest.processed_at && (
                <div>
                  <label className="text-gray-500 text-sm flex items-center gap-1">
                    <CheckCircle size={14} /> Processed Date
                  </label>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedRequest.processed_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex flex-wrap gap-3 justify-between">
              <button
                onClick={() => deleteRequest(selectedRequest.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <X size={16} />
                Delete
              </button>
              <div className="flex gap-3">
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => updateRequestStatus(selectedRequest.id, 'contacted')}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Mark as Contacted
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}