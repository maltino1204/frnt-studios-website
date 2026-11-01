"use client";

/**
 * Production payment step (PAYMENTS_PROVIDER=stripe). Mounts Stripe's Payment
 * Element for the PaymentIntent created by `createBookingAction` (manual
 * capture). Card data never touches SOMA's servers; the Stripe webhook
 * (`/api/webhooks/stripe`) moves the booking from `pending_payment` to
 * `requested`/`confirmed`.
 *
 * Not verifiable in development (needs NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and
 * access to js.stripe.com) — see docs/STATUS.md.
 */
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
// "pure" defers injecting js.stripe.com until loadStripe() runs (only in the Stripe payment step).
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/sheet";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripeClient() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.includes("placeholder")) return null;
  stripePromise ??= loadStripe(key, { locale: "de" });
  return stripePromise;
}

function PaymentForm({ bookingUrl, ctaLabel }: { bookingUrl: string; ctaLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: new URL(bookingUrl, window.location.origin).toString() },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Die Zahlung konnte nicht autorisiert werden. Bitte versuchen Sie es erneut.");
      setBusy(false);
      return;
    }
    window.location.assign(bookingUrl);
  };

  return (
    <div className="flex flex-col gap-5">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <Notice kind="danger">{error}</Notice> : null}
      <Button variant="accent" size="l" block onClick={pay} loading={busy} disabled={!stripe || !elements} className="num">
        {ctaLabel}
      </Button>
      <p className="type-caption text-ink-muted">
        Der Betrag wird zunächst nur reserviert und erst nach Ihrem Termin eingezogen. Zahlungsdaten verarbeitet ausschließlich Stripe.
      </p>
    </div>
  );
}

export function StripePaymentSheet({
  clientSecret,
  bookingUrl,
  ctaLabel,
  onClose,
}: {
  clientSecret: string | null;
  bookingUrl: string;
  ctaLabel: string;
  onClose: () => void;
}) {
  const stripe = getStripeClient();
  return (
    <Sheet open={!!clientSecret} onClose={onClose} title="Zahlung">
      {!stripe || !clientSecret ? (
        <Notice kind="danger" title="Zahlung derzeit nicht verfügbar">
          Die Zahlungsanbindung ist nicht konfiguriert. Ihr Termin ist noch nicht gebucht und wird nach Ablauf der Reservierung automatisch freigegeben.
        </Notice>
      ) : (
        <Elements
          stripe={stripe}
          options={{
            clientSecret,
            locale: "de",
            appearance: {
              theme: "flat",
              variables: {
                colorPrimary: "#1A1916",
                colorBackground: "#FFFFFF",
                colorText: "#1A1916",
                colorDanger: "#B3261E",
                borderRadius: "2px",
                fontFamily: "Instrument Sans, system-ui, sans-serif",
              },
              rules: { ".Input": { border: "1px solid #857E73" } },
            },
          }}
        >
          <PaymentForm bookingUrl={bookingUrl} ctaLabel={ctaLabel} />
        </Elements>
      )}
    </Sheet>
  );
}
