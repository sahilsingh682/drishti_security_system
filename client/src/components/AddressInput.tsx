import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface AddressData {
  pincode: string;
  city: string;
  state: string;
  houseNo: string;
  society: string;
  landmark: string;
  area: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value: AddressData;
  onChange: (addr: AddressData) => void;
  required?: boolean;
}

export const AddressInput = ({ value, onChange, required = false }: Props) => {
  const [loadingLocation, setLoadingLocation] = useState(false);

  // 🚀 Upgraded Live Location Pickup with Google Geocoding API fallback
  const pickLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        try {
          // Use a free geocoding API (nominatim OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'User-Agent': 'DrishtiSecurityApp' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            
            onChange({
              ...value,
              lat: latitude,
              lng: longitude,
              pincode: addr.postcode || "",
              city: addr.city || addr.town || addr.village || addr.state_district || "",
              state: addr.state || "",
              society: addr.road || addr.neighbourhood || "",
              area: addr.suburb || addr.neighbourhood || "",
              landmark: addr.amenity || addr.building || ""
            });
            
            toast.success("Location picked successfully!");
          } else {
            // Fallback: Just save coordinates
            onChange({ ...value, lat: latitude, lng: longitude });
            toast.info("Location saved. Please fill in address details.");
          }
        } catch (error) {
          onChange({ ...value, lat: latitude, lng: longitude });
          toast.info("Location saved. Please fill in address details.");
        }
        
        setLoadingLocation(false);
      },
      (err) => {
        toast.error("Location access denied. Please type your address.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Live location button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 border-secondary/30 text-secondary hover:bg-secondary/10 font-bold shadow-sm"
        onClick={pickLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pinpointing your exact location...</>
        ) : (
          <><Navigation className="w-4 h-4 mr-2" /> Use My Live GPS Location</>
        )}
      </Button>

      {/* Map preview - Using Google Maps Static */}
      {value.lat && value.lng && (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm relative">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${value.lat},${value.lng}&zoom=15&size=600x200&markers=color:red%7C${value.lat},${value.lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
              alt="Location Map"
              className="w-full h-40 object-cover"
              onError={(e) => {
                // Fallback to OpenStreetMap iframe if Google Maps fails
                e.currentTarget.style.display = 'none';
                const iframe = document.createElement('iframe');
                iframe.width = '100%';
                iframe.height = '160';
                iframe.style.border = '0';
                iframe.loading = 'lazy';
                iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${value.lng - 0.005},${value.lat - 0.003},${value.lng + 0.005},${value.lat + 0.003}&layer=mapnik&marker=${value.lat},${value.lng}`;
                e.currentTarget.parentElement?.appendChild(iframe);
              }}
            />
          </a>
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-primary">
            📍 Click to view in Google Maps
          </div>
        </div>
      )}

      {/* Manual Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">House / Flat No.</Label>
          <Input required={required} value={value.houseNo} onChange={e => onChange({ ...value, houseNo: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="e.g. Flat 201" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pincode</Label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input required={required} maxLength={6} value={value.pincode} onChange={e => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="pl-9 bg-muted/20" placeholder="6-digit pincode" />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Society / Street / Colony</Label>
        <Input required={required} value={value.society} onChange={e => onChange({ ...value, society: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="e.g. Model Town" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">City</Label>
          <Input required={required} value={value.city} onChange={e => onChange({ ...value, city: e.target.value })} className="mt-1.5 bg-muted/20" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">State</Label>
          <Input required={required} value={value.state} onChange={e => onChange({ ...value, state: e.target.value })} className="mt-1.5 bg-muted/20" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Landmark (optional)</Label>
        <Input value={value.landmark} onChange={e => onChange({ ...value, landmark: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="Near Geeta University..." />
      </div>
    </div>
  );
};
