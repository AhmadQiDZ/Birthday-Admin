import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Package, Lock } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [packagesCount, setPackagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('adminUser') || '{}');
    setUser(userData);
    fetchUserPackagesCount(userData.id);
  }, []);

  async function fetchUserPackagesCount(userId) {
    const { count, error } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .is('deleted_at', null);

    if (!error) {
      setPackagesCount(count || 0);
    }
    setLoading(false);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    // تحديث كلمة المرور (مؤقت - سيتم تحديثه مع bcrypt لاحقاً)
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordForm.newPassword })
      .eq('id', user?.id);

    if (!error) {
      setMessage('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setMessage('Error updating password');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <User size={20} /> Account Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-2">
                <User size={16} /> Full Name
              </label>
              <p className="text-lg font-medium">{user?.name}</p>
            </div>
            
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-2">
                <Package size={16} /> Packages Added
              </label>
              <p className="text-3xl font-bold text-primary">{packagesCount}</p>
            </div>
            
            <div>
              <label className="text-gray-500 text-sm">Role</label>
              <p className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <Lock size={20} /> Change Password
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
                minLength="6"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-center text-sm ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-500'
              }`}>
                {message}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full btn-primary py-2"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}