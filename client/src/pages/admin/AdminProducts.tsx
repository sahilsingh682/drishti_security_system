import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, Star, Upload, ImageIcon, Search, Filter, Copy, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductForm {
  name: string; category: string; brand: string; price: string; stock: string;
  image_url: string; features: string; featured: boolean; description: string;
}

const emptyForm: ProductForm = {
  name: "", category: "", brand: "", price: "", stock: "",
  image_url: "", features: "", featured: false, description: "",
};

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name" | "stock-asc" | "stock-desc">("newest");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const openEdit = (p: any) => {
    setEditId(p.id);
    const feat = Array.isArray(p.features) ? p.features : [];
    setForm({
      name: p.name, category: p.category || "", brand: p.brand || "",
      price: String(p.price), stock: String(p.stock), image_url: p.image_url || "",
      features: feat.join(", "), featured: feat.includes("__featured__") || false,
      description: (feat.find((f: string) => f.startsWith("__desc__")) || "").replace("__desc__", "") || "",
    });
    setPreviewImg(p.image_url || null);
    setFormOpen(true);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setPreviewImg(null); setFormOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      setPreviewImg(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = form.features.split(",").map(f => f.trim()).filter(Boolean);
    // Store featured flag and description in features array (lightweight approach)
    if (form.featured && !featuresList.includes("__featured__")) featuresList.push("__featured__");
    if (form.description) featuresList.push(`__desc__${form.description}`);

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      image_url: form.image_url.trim(),
      features: featuresList.filter(f => !f.startsWith("__desc__") || f === `__desc__${form.description}`),
    };

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Product added");
    }
    setFormOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    fetchProducts();
  };

  const toggleFeatured = async (p: any) => {
    const feat = Array.isArray(p.features) ? [...p.features] : [];
    const isFeatured = feat.includes("__featured__");
    const updated = isFeatured ? feat.filter((f: string) => f !== "__featured__") : [...feat, "__featured__"];
    const { error } = await supabase.from("products").update({ features: updated }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(isFeatured ? "Removed from featured" : "Added to featured");
    fetchProducts();
  };

  const duplicateProduct = async (p: any) => {
    const { error } = await supabase.from("products").insert({
      name: `${p.name} (Copy)`, category: p.category, brand: p.brand,
      price: p.price, stock: p.stock, image_url: p.image_url, features: p.features,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Product duplicated");
    fetchProducts();
  };

  // Filter, search, sort
  const specialFilters = ["all", "in-stock", "out-of-stock", "featured"];
  let filtered = products.filter(p => {
    if (filterCat === "out-of-stock") { if (p.stock > 0) return false; }
    else if (filterCat === "in-stock") { if (p.stock <= 0) return false; }
    else if (filterCat === "featured") { if (!(Array.isArray(p.features) && p.features.includes("__featured__"))) return false; }
    else if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort — featured-first only when sort is "newest" (default)
  filtered.sort((a, b) => {
    if (sortBy === "newest") {
      const aFeat = Array.isArray(a.features) && a.features.includes("__featured__") ? 1 : 0;
      const bFeat = Array.isArray(b.features) && b.features.includes("__featured__") ? 1 : 0;
      if (bFeat !== aFeat) return bFeat - aFeat;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    switch (sortBy) {
      case "price-asc": return Number(a.price) - Number(b.price);
      case "price-desc": return Number(b.price) - Number(a.price);
      case "name": return a.name.localeCompare(b.name);
      case "stock-asc": return Number(a.stock) - Number(b.stock);
      case "stock-desc": return Number(b.stock) - Number(a.stock);
      default: return 0;
    }
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
    featured: products.filter(p => Array.isArray(p.features) && p.features.includes("__featured__")).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-primary" /> Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{stats.total} products · {stats.featured} featured · {stats.outOfStock} out of stock</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "In Stock", value: stats.inStock, color: "text-green-500" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-destructive" },
          { label: "Featured", value: stats.featured, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44 bg-muted/30"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="in-stock">In Stock Only</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-48 bg-muted/30"><ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
            <SelectItem value="stock-asc">Stock: Low → High</SelectItem>
            <SelectItem value="stock-desc">Stock: High → Low</SelectItem>
            <SelectItem value="name">Name A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          {search || filterCat !== "all" ? "No products match your filters" : "No products yet. Add your first product!"}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p, i) => {
            const isFeatured = Array.isArray(p.features) && p.features.includes("__featured__");
            const displayFeatures = Array.isArray(p.features) ? p.features.filter((f: string) => !f.startsWith("__")) : [];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={`glass-card p-4 transition-colors ${isFeatured ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
                {/* Image */}
                {p.image_url && (
                  <div className="relative mb-3 rounded-lg overflow-hidden bg-muted/20 aspect-video">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    {isFeatured && (
                      <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px]">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Featured
                      </Badge>
                    )}
                  </div>
                )}
                {!p.image_url && isFeatured && (
                  <Badge className="mb-2 bg-primary/90 text-primary-foreground text-[10px] w-fit">
                    <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Featured
                  </Badge>
                )}

                {/* Info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{[p.brand, p.category].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 0 ? "bg-green-500/15 text-green-500" : "bg-destructive/15 text-destructive"}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </span>
                </div>

                {/* Features */}
                {displayFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {displayFeatures.slice(0, 4).map((f: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{f}</span>
                    ))}
                    {displayFeatures.length > 4 && <span className="text-[10px] text-muted-foreground">+{displayFeatures.length - 4}</span>}
                  </div>
                )}

                {/* Price & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <span className="text-lg font-bold text-primary">₹{Number(p.price).toLocaleString("en-IN")}</span>
                  <div className="flex gap-1">
                    <button onClick={() => toggleFeatured(p)} className={`p-1.5 rounded-md transition-colors ${isFeatured ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`} data-clickable title="Toggle featured">
                      <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => duplicateProduct(p)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md" data-clickable title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(p)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md" data-clickable title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md" data-clickable title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="glass-card border-border/40 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Input maxLength={50} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-muted/30" placeholder="CCTV, DVR, NVR..." /></div>
              <div><Label>Brand</Label><Input maxLength={50} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="bg-muted/30" placeholder="Hikvision, CP Plus..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (₹) *</Label><Input type="number" required min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="bg-muted/30" /></div>
              <div><Label>Stock *</Label><Input type="number" required min={0} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="bg-muted/30" /></div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>Product Image</Label>
              <div className="mt-1.5 space-y-2">
                {previewImg && (
                  <div className="relative rounded-lg overflow-hidden bg-muted/20 aspect-video">
                    <img src={previewImg} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPreviewImg(null); setForm(f => ({ ...f, image_url: "" })); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-destructive" data-clickable>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 border-border/40" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1" /> Uploading...</>
                      : <><Upload className="w-3 h-3 mr-1" /> Browse Image</>}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">or</span>
                  <Input placeholder="Paste image URL" value={form.image_url} onChange={e => { setForm({ ...form, image_url: e.target.value }); setPreviewImg(e.target.value || null); }}
                    className="bg-muted/30 text-xs flex-1" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description (optional)</Label>
              <Textarea rows={2} maxLength={500} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-muted/30 text-sm" placeholder="Brief product description..." />
            </div>

            {/* Features */}
            <div>
              <Label>Features <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input maxLength={300} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} className="bg-muted/30" placeholder="4K, Night Vision, IP67, 2MP" />
            </div>

            {/* Featured toggle */}
            <label className="flex items-center gap-2 cursor-pointer" data-clickable>
              <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.featured ? "bg-primary" : "bg-muted"}`}
                onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm flex items-center gap-1">
                <Star className={`w-3.5 h-3.5 ${form.featured ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                Featured Product
              </span>
            </label>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{editId ? "Update" : "Add"} Product</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
