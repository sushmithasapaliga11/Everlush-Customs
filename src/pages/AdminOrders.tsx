import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllOrders, updateCancelRequest, type Order } from "@/lib/sheets";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, MessageCircle, LogOut } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (sessionStorage.getItem("everlush_admin") !== "true") {
      navigate("/admin");
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      setOrders(res);
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: number, action: "Approved" | "Rejected", phone: string) => {
    try {
      await updateCancelRequest(orderId, action);
      toast({ title: `Cancel ${action.toLowerCase()}` });
      if (action === "Approved") {
        const msg = encodeURIComponent(`Hi! Your order #${orderId} from EVERLUSH CUSTOMS has been cancelled as requested.`);
        window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
      }
      fetchOrders();
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const logout = () => {
    sessionStorage.removeItem("everlush_admin");
    navigate("/admin");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      {loading && <p className="text-center py-8 text-muted-foreground">Loading orders...</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.name} — {order.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={order.status === "Cancelled" ? "destructive" : "secondary"}>{order.status}</Badge>
                  {order.cancelRequest !== "No" && (
                    <Badge variant={order.cancelRequest === "Approved" ? "destructive" : "secondary"}>
                      Cancel: {order.cancelRequest}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{order.createdAt}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.product}{item.option !== "-" ? ` (${item.option})` : ""} x{item.quantity}</span>
                    <span className="font-medium">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold text-primary text-lg">₹{order.total}</span>
                <div className="flex gap-2">
                  {order.cancelRequest === "Yes" && (
                    <>
                      <Button size="sm" variant="outline" className="gap-1 text-success border-success"
                        onClick={() => handleCancel(order.id!, "Approved", order.phone)}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive"
                        onClick={() => handleCancel(order.id!, "Rejected", order.phone)}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" asChild title="Chat with customer">
                    <a href={`https://wa.me/91${order.phone}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-primary border-primary" asChild title="Send Order Details & Thank You Message">
                    <a href={`https://wa.me/91${order.phone}?text=${encodeURIComponent(`🌸 *Thank you for choosing EVERLUSH CUSTOMS!*\n\nHere are your order details:\nOrder #${order.id}\n\n${order.items.map((i) => `${i.product}${i.option !== "-" ? ` (${i.option})` : ""} x${i.quantity} = ₹${i.subtotal}`).join("\n")}\n\n*Total: ₹${order.total}*`)}`} target="_blank" rel="noopener noreferrer">
                      <CheckCircle className="h-4 w-4" /> Send Details
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
