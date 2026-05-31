import { ShieldCheck, Mail, ArrowRight, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutAuthModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  proceedToGuestCheckout: () => void;
}

export default function CheckoutAuthModal({ isOpen, setIsOpen, proceedToGuestCheckout }: CheckoutAuthModalProps) {
  
  const handleGoogleLogin = async () => {
    // 🚀 This redirects them to Google, and upon success, lands them directly on the checkout page
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/checkout`
      }
    });
    
    if (error) {
      console.error("Google Auth Error:", error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-6 sm:p-8 rounded-3xl bg-card border-primary/20 shadow-2xl">
        <DialogHeader className="space-y-3 text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
            Secure Your Order
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
            Sign in to instantly track your installation, download tax invoices, and claim your Drishti device warranties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 🚀 The Frictionless Google Button */}
          <Button 
            onClick={handleGoogleLogin} 
            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-sm shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {/* Fallback Email Option */}
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/login'} 
            className="w-full h-12 rounded-xl border-primary/20 font-bold text-sm text-foreground hover:bg-primary/5 transition-all"
          >
            <Mail className="w-4 h-4 mr-2 text-primary" />
            Sign in with Email
          </Button>
        </div>

        {/* The "Soft" Part of the Wall - Guest Checkout Bypass */}
        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <button 
            onClick={proceedToGuestCheckout}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <UserCircle2 className="w-4 h-4" />
            Continue as Guest (No tracking)
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}