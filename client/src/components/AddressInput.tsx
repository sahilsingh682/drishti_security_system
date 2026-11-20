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
import { MapPin, Navigation, Loader2, Search, CheckCircle2, X, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  postcode?: string;
  city?: string;
  state?: string;
  street?: string;
  district?: string;
}

export const AddressInput = ({ value, onChange, required = false }: Props) => {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
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
            addr.university ||
            addr.college ||
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
          landmark:
            addr.university ||
            addr.college ||
            addr.school ||
            addr.amenity ||
            addr.building ||
            current.landmark ||
            "",
        });

        if (showToast) toast.success("Pin location updated!");
      } else {
        onChange({ ...latestValueRef.current, lat, lng });
      }
    } catch {
      onChange({ ...latestValueRef.current, lat, lng });
    }
  };

  // Initialize & sync interactive Leaflet map with rich Indian landmarks & Satellite toggle
  useEffect(() => {
    if (value.lat === undefined || value.lng === undefined || !mapContainerRef.current) {
      return;
    }

    const tileUrl =
      mapType === "hybrid"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" // Satellite + Labels
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Detailed Street Map with Landmarks, Universities & Villages

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [value.lat, value.lng],
        zoom: 16,
        zoomControl: true,
      });

      const layer = L.tileLayer(tileUrl, {
        attribution: "© Map Data",
        maxZoom: 20,
      }).addTo(map);

      const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocodeAndFill(pos.lat, pos.lng, true);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        reverseGeocodeAndFill(e.latlng.lat, e.latlng.lng, true);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
      tileLayerRef.current = layer;
    } else {
      mapInstanceRef.current.setView([value.lat, value.lng], 16);
      markerInstanceRef.current?.setLatLng([value.lat, value.lng]);
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
      }
    }
  }, [value.lat, value.lng, mapType]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // India-specific fuzzy autocomplete using Photon API (handles universities, villages, landmarks & typos)
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
        // Bias results toward current pin (or Panipat/Haryana NCR center if unset)
        const biasLat = latestValueRef.current.lat ?? 29.3909;
        const biasLng = latestValueRef.current.lng ?? 76.9635;

        // bbox=68.1,6.5,97.4,35.6 restricts results strictly to India
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          trimmed
        )}&lat=${biasLat}&lon=${biasLng}&bbox=68.1,6.5,97.4,35.6&limit=6&lang=en`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const features = data.features || [];

          const mapped: SearchSuggestion[] = features.map((f: any, idx: number) => {
            const p = f.properties || {};
            const [lng, lat] = f.geometry?.coordinates || [0, 0];

            const title =
              p.name ||
              p.street ||
              p.locality ||
              p.district ||
              p.city ||
              trimmed;

            const subtitleParts = [
              p.street && p.street !== title ? p.street : null,
              p.locality || p.district,
              p.city,
              p.state,
              p.postcode,
            ].filter(Boolean);

            return {
              id: `${p.osm_id || idx}-${lat}-${lng}`,
              title,
              subtitle: subtitleParts.join(", ") || "India",
              lat,
              lng,
              postcode: p.postcode || "",
              city: p.city || p.county || p.district || "",
              state: p.state || "",
              street: p.street || p.locality || p.name || "",
              district: p.locality || p.district || "",
            };
          });

          setSuggestions(mapped);
          setShowDropdown(mapped.length > 0);
        }
      } catch {
        // Ignore transient network errors
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a search suggestion -> move map pin & fill address
  const handleSelectSuggestion = (item: SearchSuggestion) => {
    onChange({
      ...value,
      lat: item.lat,
      lng: item.lng,
      pincode: item.postcode || value.pincode || "",
      city: item.city || value.city || "",
      state: item.state || value.state || "",
      society: item.street || item.title || value.society || "",
      area: item.district || value.area || "",
      landmark: item.title || value.landmark || "",
    });

    setSearchQuery(`${item.title}${item.city ? `, ${item.city}` : ""}`);
    setShowDropdown(false);
    toast.success("Location pinned! Drag the marker or switch to Satellite view to pinpoint your exact building.");
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
          onChange({
            ...latestValueRef.current,
            lat: latitude,
            lng: longitude,
          });
          toast.info(
            "Approximate IP location shown. Search your college/colony above or drag the pin to your exact spot."
          );
          setLoadingLocation(false);
          return;
        }

        await reverseGeocodeAndFill(latitude, longitude, false);
        toast.success("GPS location detected! Drag the pin if needed.");
        setLoadingLocation(false);
      },
      () => {
        onChange({
          ...latestValueRef.current,
          lat: 29.3909,
          lng: 76.9635,
        });
        toast.info("Location access blocked. Search your area above or drag the pin.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Flipkart-Style India Location Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search village, university, colony, or landmark in India..."
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

        {/* Rich 2-Line Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 bg-background border border-border rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-muted/60 flex items-start gap-2.5 border-b border-border/50 last:border-none transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {item.subtitle}
                  </div>
                </div>
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

      {/* Interactive Map with Street / Satellite View Switcher */}
      {value.lat !== undefined && value.lng !== undefined && (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm relative">
          <div ref={mapContainerRef} className="w-full h-56 z-0" />

          {/* Map / Satellite Toggle Button */}
          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === "roadmap" ? "hybrid" : "roadmap"))}
            className="absolute top-2.5 right-2.5 z-[400] bg-background/95 backdrop-blur-sm border border-border shadow-md px-2.5 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-muted flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            {mapType === "roadmap" ? "Satellite" : "Map"}
          </button>

          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Drag pin or tap map for exact spot
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
          Society / Street / Village
        </Label>
        <Input
          required={required}
          value={value.society}
          onChange={(e) => onChange({ ...value, society: e.target.value })}
          className="mt-1.5 bg-muted/20"
          placeholder="e.g. Naultha / Model Town"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            City / District
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
