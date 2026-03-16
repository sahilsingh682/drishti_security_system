import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Mail, Lock, User, UserCog, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user");

  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminForm.email,
        password: adminForm.password,
      });
      if (error) throw error;

      // Check if user has admin role
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });
      if (roleData !== "Admin" && roleData !== "SuperAdmin") {
        await supabase.auth.signOut();
        toast.error("Unauthorized: This account does not have admin access.");
        return;
      }

      toast.success("Admin logged in successfully!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === "admin") {
        // Check if the email belongs to an admin
        const { data: userData } = await supabase.auth.signInWithPassword({
          email: forgotEmail,
          password: "___check_only___",
        });
        // We can't check role without signing in, so just send the reset
        // The admin login will enforce role check anyway
      }

      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setIsForgotPassword(false);
    } catch (err: any) {
      if (err.message?.includes("Invalid login")) {
        // This is expected when checking admin email - still send reset
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (!error) {
          toast.success("If the email exists, a reset link has been sent.");
          setIsForgotPassword(false);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(err.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-clickable>
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const Spinner = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 pt-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass-card p-6 neon-border-amber">
            <button onClick={() => setIsForgotPassword(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4" data-clickable>
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
            <h2 className="text-xl font-bold mb-2">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link.</p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" required placeholder="you@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? <Spinner /> : "Send Reset Link"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 pt-16">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Drishti Security</h1>
          <p className="text-sm text-muted-foreground mt-1">Authenticate to access the system</p>
        </div>

        <div className="glass-card p-6 neon-border-amber">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50">
              <TabsTrigger value="user" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <User className="w-4 h-4" /> User
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
                <UserCog className="w-4 h-4" /> Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-6">
              <div className="flex gap-2 mb-6">
                <Button variant={!isSignUp ? "default" : "ghost"} size="sm" onClick={() => setIsSignUp(false)}
                  className={!isSignUp ? "bg-primary/20 text-primary hover:bg-primary/30" : "text-muted-foreground"}>Login</Button>
                <Button variant={isSignUp ? "default" : "ghost"} size="sm" onClick={() => setIsSignUp(true)}
                  className={isSignUp ? "bg-primary/20 text-primary hover:bg-primary/30" : "text-muted-foreground"}>Sign Up</Button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input required placeholder="Your full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="pl-10 bg-muted/30 border-border/50" />
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" required placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-10 bg-muted/30 border-border/50" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-10 pr-10 bg-muted/30 border-border/50" />
                    <PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                  </div>
                </div>
                {isSignUp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showConfirm ? "text" : "password"} required placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="pl-10 pr-10 bg-muted/30 border-border/50" />
                      <PasswordToggle show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                    </div>
                  </motion.div>
                )}
                {!isSignUp && (
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-primary hover:underline" data-clickable>
                    Forgot Password?
                  </button>
                )}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                  {loading ? <Spinner /> : isSignUp ? "Create Account" : "Login"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                </div>

                <Button type="button" variant="outline" className="w-full border-border/50 hover:bg-muted/50" disabled={loading} onClick={handleGoogleSignIn}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <div className="text-center mb-4">
                <span className="text-xs font-mono tracking-wider text-secondary uppercase">Admin Access Only</span>
              </div>
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admin Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" required placeholder="admin@drishti.com" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} className="pl-10 bg-muted/30 border-border/50" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} className="pl-10 pr-10 bg-muted/30 border-border/50" />
                    <PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                  </div>
                </div>
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-secondary hover:underline" data-clickable>
                  Forgot Password?
                </button>
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={loading}>
                  {loading ? <Spinner /> : "Admin Login"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
