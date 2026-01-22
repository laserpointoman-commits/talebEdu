import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, LogOut } from "lucide-react";
import { kioskService } from "@/services/kioskService";
import { toast } from "sonner";

/**
 * Hidden kiosk exit: long-press on the wrapped children to open PIN dialog.
 */
export function KioskExitGesture({
  children,
  onExit,
}: {
  children: React.ReactNode;
  onExit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const onDown = useCallback(() => {
    clearTimer();
    timer.current = window.setTimeout(() => {
      setPin("");
      setOpen(true);
    }, 1200);
  }, [clearTimer]);

  const onUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const confirm = async () => {
    if (pin !== kioskService.getExitPin()) {
      toast.error("رمز غير صحيح");
      setPin("");
      return;
    }
    await kioskService.stopKiosk();
    setOpen(false);
    onExit();
  };

  return (
    <>
      <div onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp}>
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              خروج من وضع الجهاز
            </DialogTitle>
            <DialogDescription>
              أدخل الرمز السري للخروج.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center" dir="ltr">
            <InputOTP maxLength={4} value={pin} onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}>
              <InputOTPGroup>
                <InputOTPSlot index={0} mask />
                <InputOTPSlot index={1} mask />
                <InputOTPSlot index={2} mask />
                <InputOTPSlot index={3} mask />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button className="mt-4 h-12 w-full" onClick={confirm} disabled={pin.length !== 4}>
            <LogOut className="mr-2 h-5 w-5" />
            خروج
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
