// import { useState, useEffect, useRef } from "react";
// import { MapPin, Navigation, Loader2, Search } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";

// export interface AddressData {
//   pincode: string;
//   city: string;
//   state: string;
//   houseNo: string;
//   society: string;
//   landmark: string;
//   area: string;
//   lat?: number;
//   lng?: number;
// }

// interface Props {
//   value: AddressData;
//   onChange: (addr: AddressData) => void;
//   required?: boolean;
// }

// export const AddressInput = ({ value, onChange, required = false }: Props) => {
//   const [loadingLocation, setLoadingLocation] = useState(false);

//   // 🚀 Upgraded Live Location Pickup with Google Geocoding API fallback
//   const pickLocation = () => {
//     if (!navigator.geolocation) {
//       toast.error("Geolocation not supported by your browser");
//       return;
//     }
    
//     setLoadingLocation(true);
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
        
//         try {
//           // Use a free geocoding API (nominatim OpenStreetMap)
//           const response = await fetch(
//             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
//             { headers: { 'User-Agent': 'DrishtiSecurityApp' } }
//           );
          
//           if (response.ok) {
//             const data = await response.json();
//             const addr = data.address || {};
            
//             onChange({
//               ...value,
//               lat: latitude,
//               lng: longitude,
//               pincode: addr.postcode || "",
//               city: addr.city || addr.town || addr.village || addr.state_district || "",
//               state: addr.state || "",
//               society: addr.road || addr.neighbourhood || "",
//               area: addr.suburb || addr.neighbourhood || "",
//               landmark: addr.amenity || addr.building || ""
//             });
            
//             toast.success("Location picked successfully!");
//           } else {
//             // Fallback: Just save coordinates
//             onChange({ ...value, lat: latitude, lng: longitude });
//             toast.info("Location saved. Please fill in address details.");
//           }
//         } catch (error) {
//           onChange({ ...value, lat: latitude, lng: longitude });
//           toast.info("Location saved. Please fill in address details.");
//         }
        
//         setLoadingLocation(false);
//       },
//       (err) => {
//         toast.error("Location access denied. Please type your address.");
//         setLoadingLocation(false);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   };

//   return (
//     <div className="space-y-4">
//       {/* Live location button */}
//       <Button
//         type="button"
//         variant="outline"
//         className="w-full h-12 border-secondary/30 text-secondary hover:bg-secondary/10 font-bold shadow-sm"
//         onClick={pickLocation}
//         disabled={loadingLocation}
//       >
//         {loadingLocation ? (
//           <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pinpointing your exact location...</>
//         ) : (
//           <><Navigation className="w-4 h-4 mr-2" /> Use My Live GPS Location</>
//         )}
//       </Button>

//       {/* Map preview - Using Google Maps Static */}
//       {value.lat && value.lng && (
//         <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm relative">
//           <a 
//             href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="block"
//           >
//             <img
//               src={`https://maps.googleapis.com/maps/api/staticmap?center=${value.lat},${value.lng}&zoom=15&size=600x200&markers=color:red%7C${value.lat},${value.lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
//               alt="Location Map"
//               className="w-full h-40 object-cover"
//               onError={(e) => {
//                 // Fallback to OpenStreetMap iframe if Google Maps fails
//                 e.currentTarget.style.display = 'none';
//                 const iframe = document.createElement('iframe');
//                 iframe.width = '100%';
//                 iframe.height = '160';
//                 iframe.style.border = '0';
//                 iframe.loading = 'lazy';
//                 iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${value.lng - 0.005},${value.lat - 0.003},${value.lng + 0.005},${value.lat + 0.003}&layer=mapnik&marker=${value.lat},${value.lng}`;
//                 e.currentTarget.parentElement?.appendChild(iframe);
//               }}
//             />
//           </a>
//           <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-primary">
//             📍 Click to view in Google Maps
//           </div>
//         </div>
//       )}

//       {/* Manual Input Fields */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
//         <div>
//           <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">House / Flat No.</Label>
//           <Input required={required} value={value.houseNo} onChange={e => onChange({ ...value, houseNo: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="e.g. Flat 201" />
//         </div>
//         <div>
//           <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pincode</Label>
//           <div className="relative mt-1.5">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
//             <Input required={required} maxLength={6} value={value.pincode} onChange={e => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="pl-9 bg-muted/20" placeholder="6-digit pincode" />
//           </div>
//         </div>
//       </div>

//       <div>
//         <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Society / Street / Colony</Label>
//         <Input required={required} value={value.society} onChange={e => onChange({ ...value, society: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="e.g. Model Town" />
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">City</Label>
//           <Input required={required} value={value.city} onChange={e => onChange({ ...value, city: e.target.value })} className="mt-1.5 bg-muted/20" />
//         </div>
//         <div>
//           <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">State</Label>
//           <Input required={required} value={value.state} onChange={e => onChange({ ...value, state: e.target.value })} className="mt-1.5 bg-muted/20" />
//         </div>
//       </div>

//       <div>
//         <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Landmark (optional)</Label>
//         <Input value={value.landmark} onChange={e => onChange({ ...value, landmark: e.target.value })} className="mt-1.5 bg-muted/20" placeholder="Near Geeta University..." />
//       </div>
//     </div>
//   );
// };


import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader2, Search, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icon paths in Vite builds
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

interface SearchSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

export const AddressInput = ({ value, onChange, required = false }: Props) => {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const latestValueRef = useRef<AddressData>(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Reverse-geocode coordinates whenever pin is dropped or dragged
  const reverseGeocodeAndFill = async (lat: number, lng: number, showToast = false) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const current = latestValueRef.current;

        onChange({
          ...current,
          lat,
          lng,
          pincode: addr.postcode || current.pincode || "",
          city:
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            current.city ||
            "",
          state: addr.state || current.state || "",
          society:
            addr.residential ||
            addr.road ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.hamlet ||
            current.society ||
            "",
          area:
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            current.area ||
            "",
          landmark: addr.amenity || addr.building || current.landmark || "",
        });

        if (showToast) toast.success("Pin location updated!");
      } else {
        onChange({ ...latestValueRef.current, lat, lng });
      }
    } catch {
      onChange({ ...latestValueRef.current, lat, lng });
    }
  };

  // Initialize & sync interactive Leaflet map whenever lat/lng is set
  useEffect(() => {
    if (value.lat === undefined || value.lng === undefined || !mapContainerRef.current) {
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [value.lat, value.lng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);

      // Drag pin to adjust exact house/building
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocodeAndFill(pos.lat, pos.lng, true);
      });

      // Click anywhere on map to move pin there
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        reverseGeocodeAndFill(e.latlng.lat, e.latlng.lng, true);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    } else {
      mapInstanceRef.current.setView([value.lat, value.lng], 16);
      markerInstanceRef.current?.setLatLng([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Live address autocomplete search (debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}&countrycodes=in&addressdetails=1&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const results: SearchSuggestion[] = await res.json();
          setSuggestions(results);
          setShowDropdown(true);
        }
      } catch {
        // Ignore transient search errors
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a search suggestion -> move map pin & fill address
  const handleSelectSuggestion = (item: SearchSuggestion) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const addr = item.address || {};

    onChange({
      ...value,
      lat,
      lng,
      pincode: addr.postcode || value.pincode || "",
      city:
        addr.city ||
        addr.town ||
        addr.village ||
        addr.county ||
        addr.state_district ||
        value.city ||
        "",
      state: addr.state || value.state || "",
      society:
        addr.residential ||
        addr.road ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.suburb ||
        item.display_name.split(",")[0] ||
        value.society ||
        "",
      area: addr.suburb || addr.neighbourhood || value.area || "",
      landmark: addr.amenity || addr.building || value.landmark || "",
    });

    setSearchQuery(item.display_name.split(",").slice(0, 2).join(", "));
    setShowDropdown(false);
    toast.success("Location selected! Drag the pin on map for exact doorstep accuracy.");
  };

  // Auto-fill City & State + center map when a 6-digit Indian Pincode is entered
  const handlePincodeChange = async (rawPin: string) => {
    const cleanPin = rawPin.replace(/\D/g, "").slice(0, 6);
    onChange({ ...value, pincode: cleanPin });

    if (cleanPin.length === 6) {
      setFetchingPincode(true);
      try {
        const [poRes, geoRes] = await Promise.all([
          fetch(`https://api.postalpincode.in/pincode/${cleanPin}`),
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&postalcode=${cleanPin}&country=India&limit=1`
          ),
        ]);

        let updated = { ...value, pincode: cleanPin };

        if (poRes.ok) {
          const poData = await poRes.json();
          if (poData?.[0]?.Status === "Success" && poData[0].PostOffice?.length > 0) {
            const po = poData[0].PostOffice[0];
            updated = {
              ...updated,
              city: po.District || updated.city,
              state: po.State || updated.state,
              area: po.Name || updated.area,
            };
          }
        }

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.[0]) {
            updated.lat = parseFloat(geoData[0].lat);
            updated.lng = parseFloat(geoData[0].lon);
          }
        }

        onChange(updated);
      } catch {
        // Let user enter manually on network error
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  // Use Current GPS Location button
  const pickLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (accuracy > 5000) {
          // On laptops without GPS, center map on Panipat/India or let user search/drag instead of filling wrong Delhi IP
          toast.warning(
            "Laptop GPS unavailable (IP estimate). Search your area above or enter Pincode to drop your pin."
          );
          setLoadingLocation(false);
          return;
        }

        await reverseGeocodeAndFill(latitude, longitude, false);
        toast.success("GPS location detected! Drag the pin if needed.");
        setLoadingLocation(false);
      },
      () => {
        toast.error("Location access blocked. Search your area above or enter Pincode.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Flipkart-Style Search Bar + Use Current Location Row */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area, street, colony, or landmark (e.g. Naultha, Panipat)..."
            className="pl-10 pr-9 h-11 bg-muted/20 border-primary/20 focus-visible:ring-primary"
          />
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-3.5 top-1/2 -translate-y-1/2" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setShowDropdown(false);
              }}
              className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Autocomplete Results Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-muted/60 flex items-start gap-2.5 border-b border-border/50 last:border-none transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2 text-foreground font-medium">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use Current Location Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-secondary/30 text-secondary hover:bg-secondary/10 font-bold shadow-sm"
        onClick={pickLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting your GPS location...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 mr-2" /> Use My Current Location
          </>
        )}
      </Button>

      {/* Interactive Draggable / Clickable Map Pin Picker */}
      {value.lat !== undefined && value.lng !== undefined && (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm">
          <div ref={mapContainerRef} className="w-full h-48 z-0" />
          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Drag the pin or tap map for exact installation spot
            </span>
            <span className="text-muted-foreground font-mono text-[11px]">
              {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Structured Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            House / Flat / Shop No.
          </Label>
          <Input
            required={required}
            value={value.houseNo}
            onChange={(e) => onChange({ ...value, houseNo: e.target.value })}
            className="mt-1.5 bg-muted/20"
            placeholder="e.g. House 42, First Floor"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            Pincode
          </Label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              required={required}
              maxLength={6}
              value={value.pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              className="pl-9 pr-8 bg-muted/20"
              placeholder="6-digit pincode"
            />
            {fetchingPincode && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
          Society / Street / Colony
        </Label>
        <Input
          required={required}
          value={value.society}
          onChange={(e) => onChange({ ...value, society: e.target.value })}
          className="mt-1.5 bg-muted/20"
          placeholder="e.g. Model Town / Naultha"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            City
          </Label>
          <Input
            required={required}
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="mt-1.5 bg-muted/20"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            State
          </Label>
          <Input
            required={required}
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            className="mt-1.5 bg-muted/20"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
          Landmark (optional)
        </Label>
        <Input
          value={value.landmark}
          onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          className="mt-1.5 bg-muted/20"
          placeholder="Near Geeta University..."
        />
      </div>
    </div>
  );
};
