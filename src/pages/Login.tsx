import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Globe, Apple, Utensils } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    }
  });

  const onSubmit = (_data: LoginForm) => {
    setLoading(true);
    // Simulate login success after 1.5s
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-md bg-[#F9FAFB] w-full">
      <main className="w-full max-w-[480px]">
        {/* Logo Branding */}
        <div className="mb-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center mb-md shadow-sm">
            <Utensils className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#151c27] tracking-tight mb-xs">ServeFlow</h1>
          <p className="font-body-md text-body-md text-outline">Management Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-outline-variant login-card-shadow p-xl space-y-lg">
          <header>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Welcome back</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Please enter your credentials to access the console.</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            {/* Email Field */}
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-md top-1/2 -translate-y-1/2 text-outline" />
                <input
                  {...register('email')}
                  className={`w-full h-12 pl-11 pr-md bg-white border rounded-lg font-body-md text-body-md outline-none transition-all placeholder:text-outline-variant ${
                    errors.email ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:ring-primary/20'
                  } focus:ring-2`}
                  id="email"
                  placeholder="manager@restaurant.com"
                  type="email"
                />
              </div>
              {errors.email && <p className="text-error text-xs">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-primary hover:underline transition-all" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-md top-1/2 -translate-y-1/2 text-outline" />
                <input
                  {...register('password')}
                  className={`w-full h-12 pl-11 pr-11 bg-white border rounded-lg font-body-md text-body-md outline-none transition-all placeholder:text-outline-variant ${
                    errors.password ? 'border-error focus:ring-error/20' : 'border-outline-variant focus:ring-primary/20'
                  } focus:ring-2`}
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-sm">
              <input
                {...register('remember')}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                id="remember"
                type="checkbox"
              />
              <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="remember">
                Remember this device for 30 days
              </label>
            </div>

            {/* Primary Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center space-x-sm disabled:opacity-75"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* SSO Dividers */}
          <div className="relative py-sm">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-md font-label-sm text-label-sm text-outline uppercase tracking-wider">or sign in with</span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-2 gap-md">
            <button
              type="button"
              className="flex items-center justify-center h-11 px-md border border-outline-variant rounded-lg hover:bg-surface-bright transition-colors space-x-sm"
            >
              <Globe className="w-5 h-5 text-on-surface" />
              <span className="font-label-md text-label-md text-on-surface font-medium">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center h-11 px-md border border-outline-variant rounded-lg hover:bg-surface-bright transition-colors space-x-sm"
            >
              <Apple className="w-5 h-5 text-on-surface" />
              <span className="font-label-md text-label-md text-on-surface font-medium">Apple</span>
            </button>
          </div>
        </div>

        {/* Footer Call to Action */}
        <footer className="mt-xl text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            New to ServeFlow? 
            <a className="font-label-md text-label-md text-primary font-semibold ml-xs hover:underline" href="#">Create Restaurant Account</a>
          </p>
          <div className="mt-2xl flex justify-center items-center space-x-lg">
            <a className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors" href="#">Terms of Service</a>
            <a className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors" href="#">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
};
export default Login;
