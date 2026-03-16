import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2, ChevronDown } from "lucide-react";
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
  const [postOffices, setPostOffices] = useState<any[]>([]);
  const [areaOpen, setAreaOpen] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setAreaOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch city/state/areas from pincode
  const prevPincodeRef = useRef(value.pincode);
  useEffect(() => {
    if (value.pincode.length !== 6) {
      setPostOffices([]);
      return;
    }
    const pincodeChanged = prevPincodeRef.current !== value.pincode;
    prevPincodeRef.current = value.pincode;
    setLoadingPin(true);
    fetch(`https://api.postalpincode.in/pincode/${value.pincode}`)
      .then(res => res.json())
      .then(data => {
        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const offices = data[0].PostOffice;
          setPostOffices(offices);
          // Reset area when pincode changes, default to first office
          onChange({
            ...value,
            city: offices[0].District,
            state: offices[0].State,
            area: pincodeChanged ? "" : (value.area || ""),
          });
        } else {
          setPostOffices([]);
          toast.error("Invalid pincode");
        }
      })
      .catch(() => setPostOffices([]))
      .finally(() => setLoadingPin(false));
  }, [value.pincode]);

  // Live location pickup
  const pickLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange({ ...value, lat: latitude, lng: longitude });
        // Reverse geocode using free Nominatim API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&countrycodes=in&accept-language=en`);
          const data = await res.json();
          if (data?.address && data.address.country_code === "in") {
            const a = data.address;
            const rawPincode = (a.postcode || "").replace(/\D/g, "");
            const pincode = rawPincode.length === 6 ? rawPincode : value.pincode;
            onChange({
              ...value,
              lat: latitude,
              lng: longitude,
              pincode,
              city: a.city || a.town || a.county || a.state_district || value.city,
              state: a.state || value.state,
              society: a.road || a.neighbourhood || a.suburb || value.society,
              landmark: a.amenity || a.building || value.landmark,
              area: a.suburb || a.neighbourhood || value.area,
            });
            toast.success("Location picked successfully!");
          }
        } catch {
          toast.info("Location coordinates saved, fill address manually");
        }
        setLoadingLocation(false);
      },
      (err) => {
        toast.error("Location access denied");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Live location button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-secondary/30 text-secondary hover:bg-secondary/10"
        onClick={pickLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting Location...</>
        ) : (
          <><Navigation className="w-4 h-4 mr-2" /> Use My Live Location</>
        )}
      </Button>

      {/* Map preview */}
      {value.lat && value.lng && (
        <div className="rounded-lg overflow-hidden border border-border/30 h-36">
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

      {/* Pincode */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pincode</Label>
        <div className="relative mt-1.5">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            required={required}
            maxLength={6}
            value={value.pincode}
            onChange={e => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            className="pl-10 bg-muted/30 border-border/50"
            placeholder="6-digit pincode"
          />
          {loadingPin && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        </div>
      </div>

      {/* City & State (auto-filled) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">City</Label>
          <Input required={required} value={value.city} onChange={e => onChange({ ...value, city: e.target.value })} className="mt-1.5 bg-muted/30 border-border/50" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">State</Label>
          <Input required={required} value={value.state} onChange={e => onChange({ ...value, state: e.target.value })} className="mt-1.5 bg-muted/30 border-border/50" />
        </div>
      </div>

      {/* Area / Sector dropdown */}
      <div ref={areaRef} className="relative">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Area / Sector</Label>
        <div className="relative mt-1.5">
          <Input
            value={value.area}
            onChange={e => { onChange({ ...value, area: e.target.value }); setAreaOpen(true); }}
            onFocus={() => postOffices.length > 0 && setAreaOpen(true)}
            className="bg-muted/30 border-border/50 pr-8"
            placeholder={postOffices.length > 0 ? "Select area / sector" : "Enter pincode first"}
          />
          {postOffices.length > 0 && (
            <button type="button" onClick={() => setAreaOpen(!areaOpen)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" data-clickable>
              <ChevronDown className={`w-4 h-4 transition-transform ${areaOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
        {areaOpen && postOffices.length > 0 && (
          <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-lg bg-card border border-border/40 shadow-lg backdrop-blur-xl">
            {postOffices
              .filter(po => po.Name.toLowerCase().includes((value.area || "").toLowerCase()))
              .map((po: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => { onChange({ ...value, area: po.Name }); setAreaOpen(false); }}
                  data-clickable
                >
                  <span className="font-medium">{po.Name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{po.BranchType}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* House No. */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">House / Flat / Plot No.</Label>
        <Input
          required={required}
          value={value.houseNo}
          onChange={e => onChange({ ...value, houseNo: e.target.value })}
          className="mt-1.5 bg-muted/30 border-border/50"
          placeholder="e.g. 4/76, B-201, Plot 12"
        />
      </div>

      {/* Society / Street */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Society / Street / Colony</Label>
        <Input
          required={required}
          value={value.society}
          onChange={e => onChange({ ...value, society: e.target.value })}
          className="mt-1.5 bg-muted/30 border-border/50"
          placeholder="e.g. Shivaji Nagar, Green Valley"
        />
      </div>

      {/* Landmark */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Landmark (optional)</Label>
        <Input
          value={value.landmark}
          onChange={e => onChange({ ...value, landmark: e.target.value })}
          className="mt-1.5 bg-muted/30 border-border/50"
          placeholder="Near temple, school, etc."
        />
      </div>
    </div>
  );
};
