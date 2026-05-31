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

// 🚀 Load Mappls (MapmyIndia) Scripts dynamically
const loadMapplsScripts = (apiKey: string) => {
  return new Promise((resolve) => {
    if (window.mappls) {
      resolve(true);
      return;
    }
    
    // Load Core Map SDK
    const coreScript = document.createElement("script");
    coreScript.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
    
    coreScript.onload = () => {
      // Load Plugins (for Autocomplete & Search)
      const pluginScript = document.createElement("script");
      pluginScript.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk_plugins?v=3.0`;
      pluginScript.onload = () => resolve(true);
      pluginScript.onerror = () => resolve(false);
      document.head.appendChild(pluginScript);
    };
    
    coreScript.onerror = () => resolve(false);
    document.head.appendChild(coreScript);
  });
};

export const AddressInput = ({ value, onChange, required = false }: Props) => {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mappls API Key .env se aayegi
  const API_KEY = import.meta.env.VITE_MAPPLS_API_KEY || "";

  useEffect(() => {
    if (API_KEY) {
      loadMapplsScripts(API_KEY).then((loaded) => {
        if (loaded) {
          setMapsLoaded(true);
          initMapplsAutocomplete();
        }
      });
    } else {
      console.warn("Mappls API Key is missing in .env");
    }
  }, [API_KEY]);

  const initMapplsAutocomplete = () => {
    if (!searchInputRef.current || !window.mappls) return;

    // 🚀 Mappls Smart Search Plugin
    new window.mappls.search({
      keyword: "",
      location: [28.61, 77.23], // Default India center
      pod: "City,State,SubLocality,Locality,Village",
    }, (data: any) => {
       if (data && data.length > 0) {
           const place = data[0]; // Best match
           parseAndSetAddressMappls(place);
       }
    });
  };

  // 🚀 Mappls Data Mapper
  const parseAndSetAddressMappls = (placeData: any) => {
    const newAddress = { ...value, lat: placeData.latitude, lng: placeData.longitude };

    if (placeData.pincode) newAddress.pincode = placeData.pincode;
    if (placeData.city) newAddress.city = placeData.city;
    if (placeData.state) newAddress.state = placeData.state;
    if (placeData.district) newAddress.city = placeData.district; // Fallback
    
    if (placeData.subLocality || placeData.locality) {
      newAddress.area = placeData.subLocality || placeData.locality;
    }
    if (placeData.poi || placeData.placeName) {
      newAddress.landmark = placeData.placeName;
      newAddress.society = placeData.poi || placeData.subLocality;
    }

    onChange(newAddress);
    toast.success("Address auto-filled securely!");
  };

  // 🚀 Upgraded Live Location Pickup (Using Mappls Native Reverse Geocoding)
  const pickLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Ensure Mappls SDK is loaded
        if (window.mappls && window.mappls.reverseGeocode) {
          window.mappls.reverseGeocode({
            lat: latitude,
            lng: longitude
          }, (data: any) => {
            if (data && data.length > 0) {
              const place = data[0];
              
              onChange({
                ...value,
                lat: latitude,
                lng: longitude,
                // Mappls accurately maps Indian postal codes and local districts
                pincode: place.pincode || "",
                city: place.city || place.district || "",
                state: place.state || "",
                society: place.street || place.poi || place.locality || "",
                area: place.subLocality || place.locality || "",
                landmark: place.poi || ""
              });
              
              toast.success("Exact location and pincode pinned securely!");
            } else {
              toast.error("Could not fetch address details for this location.");
              onChange({ ...value, lat: latitude, lng: longitude });
            }
            setLoadingLocation(false);
          });
        } else {
          toast.error("Mappls SDK is still loading. Please try again.");
          setLoadingLocation(false);
        }
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
      
      {/* 🚀 Smart Search Bar (Mappls) */}
      {mapsLoaded && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
          <Label className="text-xs font-black uppercase tracking-widest text-primary mb-2 block">
            Smart Search (MapmyIndia)
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
            <Input
              ref={searchInputRef}
              id="mappls-search"
              placeholder="Search your building, society, or area..."
              className="pl-10 h-12 bg-background border-primary/20 font-medium shadow-inner"
            />
          </div>
        </div>
      )}

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

      {/* Map preview */}
      {value.lat && value.lng && (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20 h-40 shadow-sm relative">
          <iframe
            title="Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${value.lng - 0.005},${value.lat - 0.003},${value.lng + 0.005},${value.lat + 0.003}&layer=mapnik&marker=${value.lat},${value.lng}`}
          />
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
