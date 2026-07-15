import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // البحث عن المستخدم في جدول users
      const { data: users, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true);

      if (dbError || !users || users.length === 0) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const user = users[0];

      // التحقق من كلمة المرور (مؤقت - نصي)
      // في الإنتاج، استخدم bcrypt للمقارنة
      if (password !== '123456' && password !== 'Admin@123') {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // التحقق من أن المستخدم له دور admin
      if (user.role !== 'admin') {
        setError('Unauthorized access. Admin only.');
        setLoading(false);
        return;
      }

      // تسجيل الدخول في audit_log
      await supabase.from('audit_log').insert({
        user_id: user.id,
        user_name: user.name,
        action: 'login',
        ip_address: '127.0.0.1'
      });

      // تحديث آخر تسجيل دخول
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // حفظ بيانات المستخدم
      localStorage.setItem('adminUser', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }));
      
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* ===== بطاقة تسجيل الدخول ===== */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100/50">
          
          {/* ===== الشعار ===== */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-md hover:shadow-xl transition-shadow duration-300">
                <img 
                  src="https://theqapp.com/_next/image?url=%2Fimages%2Fq_app_logo_1.png&w=1920&q=75"
                  alt="theQapp Logo"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23023d6d"/%3E%3Ctext x="32" y="44" font-size="36" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial"%3EQ%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome To theQapp
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Admin Dashboard
            </p>
            
            {/* ===== شارة الأمان ===== */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Secure Connection
              </span>
            </div>
          </div>

          {/* ===== نموذج تسجيل الدخول ===== */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ===== حقل البريد الإلكتروني ===== */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-gray-700 placeholder-gray-400"
                  placeholder="admin@theqapp.com"
                  required
                />
              </div>
            </div>

            {/* ===== حقل كلمة المرور ===== */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-accent transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-gray-700 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ===== تذكرني ===== */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:text-accent transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* ===== رسالة الخطأ ===== */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ===== زر تسجيل الدخول ===== */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full bg-gradient-to-r from-primary to-primary/90 hover:from-accent hover:to-accent/90 text-white py-3.5 rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>

            {/* ===== فوتر ===== */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Secure login • theQapp Admin Panel
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition">Privacy</span>
                <span className="w-px h-3 bg-gray-200"></span>
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition">Terms</span>
                <span className="w-px h-3 bg-gray-200"></span>
                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition">Support</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}