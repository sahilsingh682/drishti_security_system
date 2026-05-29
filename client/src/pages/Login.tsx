import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, Mail, Lock, User, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  
  // 🚀 Consolidated View State (Removed 'admin' view)
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'otp' | 'new-password'>('login');
  const [otpType, setOtpType] = useState<'signup' | 'recovery'>('signup');

  // Single Form State for Everyone
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  // UI & Timer States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer Effect for OTP
  useEffect(() => {
    let interval: any;
    if (timer > 0) interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // --- VALIDATION HELPERS ---
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(form.password);
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-600'];
  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  // --- 🛡️ SMART AUTH ACTIONS (Role-Based Routing) ---
  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) return toast.error("Invalid email format");

    if (view === 'signup') {
      if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
      if (strengthScore < 4) return toast.error("Password must contain Uppercase, Number & Special Character");
      
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password, options: { data: { full_name: form.fullName } },
      });
      setLoading(false);

      if (error) toast.error(error.message);
      else {
        toast.success("OTP sent to your email!");
        setOtpType('signup');
        setView('otp');
        setTimer(60);
      }
    } else if (view === 'login') {
      setLoading(true);
      try {
        // 1. Authenticate the User
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;

        // 2. Fetch User Role
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });

        // 3. Smart Redirect
        if (roleData === "Admin" || roleData === "SuperAdmin") {
          toast.success("Welcome back, Admin! 🛡️");
          navigate("/admin", { replace: true });
        } else {
          toast.success("Logged in successfully!");
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        toast.error(err.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) return toast.error("Invalid email format");
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success("Recovery OTP sent!");
      setOtpType('recovery');
      setView('otp');
      setTimer(60);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");

    setLoading(true);
    const targetEmail = otpType === 'signup' ? form.email : forgotEmail;
    const { error } = await supabase.auth.verifyOtp({ email: targetEmail, token: otp, type: otpType });
    setLoading(false);

    if (error) toast.error("Invalid or expired OTP.");
    else {
      if (otpType === 'signup') {
        toast.success("Account Verified & Created!");
        navigate("/", { replace: true });
      } else {
        toast.success("OTP Verified. Create a new password.");
        setView('new-password');
        setForm({ ...form, password: "", confirmPassword: "" });
      }
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strengthScore < 4) return toast.error("Password must be strong.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success("Password Updated Successfully!");
      setView('login');
      setForm({ ...form, password: "", confirmPassword: "" });
    }
  };

  // --- UI COMPONENTS ---
  const PasswordToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
  );

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#0a0f1c] flex items-center justify-center px-4 overflow-y-auto pt-10 pb-10">
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Logo (Cleaned from secret clicks) */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-slate-800/50 border border-white/5 shadow-xl mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Drishti Security</h1>
          <p className="text-sm text-slate-400 mt-1">Authenticate to access the system</p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* ---------------- LOGIN & SIGNUP VIEW ---------------- */}
          {(view === 'login' || view === 'signup') && (
            <motion.div key="main-auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-6 md:p-8 neon-border-amber bg-slate-900/60 backdrop-blur-xl border-slate-700/50 rounded-2xl shadow-2xl">
              
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white">{view === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
                <p className="text-sm text-slate-400 mt-1">{view === 'login' ? 'Enter your details to sign in' : 'Join us to secure your premises'}</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {view === 'signup' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Full Name</Label>
                    <div className="relative mt-1.5"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input required placeholder="John Doe" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="pl-10 h-11 bg-slate-800/50 border-slate-700 text-white focus-visible:ring-primary/50" /></div>
                  </motion.div>
                )}
                
                <div>
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Email</Label>
                  <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type="email" required placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`pl-10 h-11 bg-slate-800/50 text-white focus-visible:ring-primary/50 ${form.email && !isValidEmail(form.email) ? 'border-red-500/50' : 'border-slate-700'}`} /></div>
                </div>
                
                <div>
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Password</Label>
                  <div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700 text-white focus-visible:ring-primary/50" /><PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} /></div>
                  
                  {/* Strength Meter */}
                  {view === 'signup' && form.password && (
                    <div className="pt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        {[...Array(4)].map((_, i) => ( <div key={i} className={`h-full flex-1 ${i < strengthScore ? strengthColors[strengthScore] : 'bg-transparent'} transition-all duration-300`} /> ))}
                      </div>
                      <p className={`text-[10px] font-bold text-right ${strengthScore === 4 ? 'text-emerald-400' : 'text-slate-500'}`}>{strengthText[strengthScore]} {strengthScore < 4 && '(Upper, Number, Special needed)'}</p>
                    </div>
                  )}
                </div>
                
                {view === 'signup' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Confirm Password</Label>
                    <div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type={showConfirm ? "text" : "password"} required placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={`pl-10 pr-10 h-11 bg-slate-800/50 text-white focus-visible:ring-primary/50 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : 'border-slate-700'}`} /><PasswordToggle show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} /></div>
                  </motion.div>
                )}

                {view === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setView('forgot')} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Forgot Password?</button>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl mt-2" disabled={loading || (view === 'signup' && (strengthScore < 4 || form.password !== form.confirmPassword))}>
                  {loading ? <Spinner /> : view === 'signup' ? "Create Secure Account" : "Sign In"}
                </Button>

                {view === 'login' && (
                  <>
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700/50" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-4 text-slate-500 font-medium rounded-full">Or continue with</span></div>
                    </div>
                    <Button type="button" variant="outline" className="w-full h-11 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white font-medium rounded-xl" disabled={loading} onClick={handleGoogleSignIn}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google Account
                    </Button>
                  </>
                )}

                <div className="pt-4 text-center text-sm">
                  <span className="text-slate-400">{view === 'login' ? "Don't have an account?" : "Already have an account?"}</span>{' '}
                  <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-white font-bold hover:text-primary transition-colors">
                    {view === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ---------------- FORGOT PASSWORD VIEW ---------------- */}
          {view === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-6 md:p-8 neon-border-amber bg-slate-900/60 backdrop-blur-xl border-slate-700/50 rounded-2xl shadow-2xl">
              <button onClick={() => setView('login')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to login</button>
              <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-sm text-slate-400 mb-6">Enter your email to receive a 6-digit recovery code.</p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Registered Email</Label>
                  <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type="email" required placeholder="you@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white focus-visible:ring-primary/50" /></div>
                </div>
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" disabled={loading}>{loading ? <Spinner /> : "Send Recovery OTP"}</Button>
              </form>
            </motion.div>
          )}

          {/* ---------------- OTP VERIFICATION VIEW ---------------- */}
          {view === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card p-6 md:p-8 neon-border-amber bg-slate-900/60 backdrop-blur-xl border-slate-700/50 rounded-2xl shadow-2xl text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4"><ShieldCheck className="w-7 h-7 text-primary" /></div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Required</h2>
              <p className="text-sm text-slate-400 mb-8">Enter the 6-digit code sent to <br/><span className="text-white font-semibold">{otpType === 'signup' ? form.email : forgotEmail}</span></p>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="px-2">
                  <Input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="h-16 text-center text-4xl font-mono tracking-[0.4em] font-black bg-slate-950/80 border-slate-700 text-primary focus-visible:ring-primary/50 rounded-2xl shadow-inner placeholder:text-slate-700" />
                </div>
                <Button disabled={loading || otp.length !== 6} type="submit" className="w-full h-12 font-bold text-[15px] bg-white text-black hover:bg-slate-200 rounded-xl transition-all">{loading ? <Spinner /> : 'Verify Code'}</Button>
                <div className="text-xs text-slate-400 font-medium">
                  {timer > 0 ? ( <p>Resend code in <span className="text-primary">{timer}s</span></p> ) : ( <button type="button" onClick={otpType === 'signup' ? handleAuthSubmit : handleForgotPassword} className="text-white hover:text-primary transition-colors">Didn't receive code? Resend</button> )}
                </div>
                <button type="button" onClick={() => { setView('login'); setOtp(""); }} className="text-xs text-slate-500 hover:text-white mt-2 block mx-auto transition-colors">Cancel & Return</button>
              </form>
            </motion.div>
          )}

          {/* ---------------- NEW PASSWORD VIEW ---------------- */}
          {view === 'new-password' && (
            <motion.div key="new-password" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 md:p-8 neon-border-amber bg-slate-900/60 backdrop-blur-xl border-slate-700/50 rounded-2xl shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Create New Password</h2>
              <p className="text-sm text-slate-400 mb-6">Your email is verified. Set a strong new password.</p>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">New Password</Label>
                  <div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 h-11 bg-slate-800/50 border-slate-700 text-white focus-visible:ring-primary/50" /><PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} /></div>
                  {form.password && (
                    <div className="pt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">{[...Array(4)].map((_, i) => ( <div key={i} className={`h-full flex-1 ${i < strengthScore ? strengthColors[strengthScore] : 'bg-transparent'} transition-all duration-300`} /> ))}</div>
                      <p className={`text-[10px] font-bold text-right ${strengthScore === 4 ? 'text-emerald-400' : 'text-slate-500'}`}>{strengthText[strengthScore]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Confirm Password</Label>
                  <div className="relative mt-1.5"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input type={showConfirm ? "text" : "password"} required placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={`pl-10 pr-10 h-11 bg-slate-800/50 text-white focus-visible:ring-primary/50 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : 'border-slate-700'}`} /><PasswordToggle show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} /></div>
                </div>
                <Button disabled={loading || strengthScore < 4 || form.password !== form.confirmPassword} type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-4">{loading ? <Spinner /> : 'Update Password & Login'}</Button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;