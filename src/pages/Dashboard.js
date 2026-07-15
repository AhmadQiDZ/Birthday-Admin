import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Calendar, Users, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    packages: 0,
    bookings: 0,
    pending: 0,
    partners: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [packagesRes, bookingsRes, pendingRes, partnersRes, completedRes, cancelledRes] = await Promise.all([
      supabase.from('packages').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('partner_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')
    ]);
    
    setStats({
      packages: packagesRes.count || 0,
      bookings: bookingsRes.count || 0,
      pending: pendingRes.count || 0,
      partners: partnersRes.count || 0,
      completed: completedRes.count || 0,
      cancelled: cancelledRes.count || 0
    });
    setLoading(false);
  }

  const statCards = [
    { title: 'Active Packages', value: stats.packages, icon: <Package size={24} />, color: 'bg-blue-500' },
    { title: 'Total Bookings', value: stats.bookings, icon: <Calendar size={24} />, color: 'bg-green-500' },
    { title: 'Pending', value: stats.pending, icon: <Eye size={24} />, color: 'bg-yellow-500' },
    { title: 'Completed', value: stats.completed, icon: <CheckCircle size={24} />, color: 'bg-purple-500' },
    { title: 'Cancelled', value: stats.cancelled, icon: <XCircle size={24} />, color: 'bg-red-500' },
    { title: 'Partner Requests', value: stats.partners, icon: <Users size={24} />, color: 'bg-indigo-500' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to theQapp Admin Panel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="card-stats">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-2 md:p-3 rounded-full text-white flex-shrink-0`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}