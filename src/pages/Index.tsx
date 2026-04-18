import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { PRODUCTS } from "@/lib/constants";
import { placeOrder, type OrderItem } from "@/lib/sheets";
import ProductRow from "@/components/ProductRow";
import OrderSuccess from "@/components/OrderSuccess";
import { useToast } from "@/hooks/use-toast";

interface RowState {
  product: string;
  option: string;
  quantity: number;
}

const emptyRow = (): RowState => ({ product: "", option: "", quantity: 1 });

export default function Index() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<RowState[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ orderId: number; total: number; items: OrderItem[] } | null>(null);
  const { toast } = useToast();

  const updateRow = useCallback((index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }, []);

  const getPrice = (row: RowState) => {
    const p = PRODUCTS.find((pr) => pr.name === row.product);
    if (!p) return 0;
    if (p.options) return p.options.find((o) => o.label === row.option)?.price ?? 0;
    return p.fixedPrice ?? 0;
  };

  const total = rows.reduce((sum, r) => sum + getPrice(r) * r.quantity, 0);
  const isValid = name.trim() && /^[6-9]\d{9}$/.test(phone) && rows.every((r) => {
    if (!r.product) return false;
    const p = PRODUCTS.find((pr) => pr.name === r.product);
    if (p?.options && !r.option) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const items: OrderItem[] = rows.map((r) => ({
        product: r.product,
        option: r.option || "-",
        quantity: r.quantity,
        price: getPrice(r),
        subtotal: getPrice(r) * r.quantity,
      }));
      const res = await placeOrder({ name, phone, items, total });

      // Auto-notify admin via WhatsApp
      const itemsText = items.map((i) => `${i.product}${i.option && i.option !== "-" ? ` (${i.option})` : ""} x${i.quantity} = ₹${i.subtotal}`).join("\n");
      const thankYouMsg = encodeURIComponent(`🌸 *Thank you for choosing EVERLUSH CUSTOMS, ${name}!*\n\nYour order has been placed successfully! 🎉\n\nOrder #${res.orderId}\n\n${itemsText}\n\n*Total: ₹${total}*\n\nWe'll get in touch with you soon! 💕`);
      const adminMsg = encodeURIComponent(`🛍️ *New Order Received!*\n\nOrder #${res.orderId}\nCustomer: ${name}\nPhone: ${phone}\n\n${itemsText}\n\n*Total: ₹${total}*\n\n👇 Send thank you to customer:\nhttps://wa.me/91${phone}?text=${thankYouMsg}`);
      window.open(`https://wa.me/918147016408?text=${adminMsg}`, "_blank");

      setSuccess({ orderId: res.orderId, total, items });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to place order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <OrderSuccess
          orderId={success.orderId}
          total={success.total}
          items={success.items}
          customerName={name}
          customerPhone={phone}
          onNewOrder={() => { setSuccess(null); setName(""); setPhone(""); setRows([emptyRow()]); }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">EVERLUSH CUSTOMS 🌿</h1>
        <p className="mt-2 text-muted-foreground">Handmade gifts crafted with love</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Place Your Order</CardTitle>
          <CardDescription>Fill in your details and select products below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="10-digit number" maxLength={10} value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
              {phone && !/^[6-9]\d{9}$/.test(phone) && (
                <p className="text-xs text-destructive mt-1">Enter a valid 10-digit Indian number</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Products</Label>
            {rows.map((row, i) => (
              <ProductRow
                key={i}
                index={i}
                product={row.product}
                option={row.option}
                quantity={row.quantity}
                onProductChange={(idx, product) => {
                  const p = PRODUCTS.find((pr) => pr.name === product);
                  updateRow(idx, { product, option: p?.options ? "" : "-" });
                }}
                onOptionChange={(idx, option) => updateRow(idx, { option })}
                onQuantityChange={(idx, quantity) => updateRow(idx, { quantity })}
                onRemove={(idx) => setRows((prev) => prev.filter((_, j) => j !== idx))}
                canRemove={rows.length > 1}
              />
            ))}
            <Button variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, emptyRow()])} className="gap-1">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accent p-4">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">₹{total}</span>
          </div>

          <Button onClick={handleSubmit} disabled={!isValid || loading} className="w-full text-lg py-6">
            {loading ? "Placing Order..." : "Place Order 🌿"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
