"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CONSENT_COOKIE = "cookieConsent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readConsentCookie() {
  return document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(true|false)(?:;|$)`))?.[1];
}

function writeConsentCookie(value: "true" | "false") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

/**
 * Touches that start on a fixed bottom banner never reach the document, so
 * the page feels “stuck” while the notice is open. Forward vertical pans to
 * window scroll; leave taps/button presses alone.
 */
function useForwardPageScroll(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  React.useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    let lastY = 0;
    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastY;
      const dy = lastY - y;
      lastY = y;
      if (dy !== 0) window.scrollBy(0, dy);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      window.scrollBy(0, event.deltaY);
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("wheel", onWheel);
    };
  }, [enabled, rootRef]);
}

interface CookieConsentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "small" | "mini";
  demo?: boolean;
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
  description?: string;
  learnMoreHref?: string;
}

const CookieConsent = React.forwardRef<HTMLDivElement, CookieConsentProps>(
  (
    {
      variant = "default",
      demo = false,
      onAcceptCallback = () => {},
      onDeclineCallback = () => {},
      className,
      description = "We use cookies to ensure you get the best experience on our website. For more information on how we use cookies, please see our cookie policy.",
      learnMoreHref = "#",
      ...props
    },
    ref,
  ) => {
    const titleId = React.useId();
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [hide, setHide] = React.useState(true);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    useForwardPageScroll(localRef, isOpen && !hide);

    const dismiss = React.useCallback((next: "true" | "false") => {
      setIsOpen(false);
      writeConsentCookie(next);
      window.setTimeout(() => setHide(true), 700);
    }, []);

    const handleAccept = React.useCallback(() => {
      dismiss("true");
      onAcceptCallback();
    }, [dismiss, onAcceptCallback]);

    const handleDecline = React.useCallback(() => {
      dismiss("false");
      onDeclineCallback();
    }, [dismiss, onDeclineCallback]);

    React.useEffect(() => {
      // The consent cookie can only be read client-side, after mount — not a
      // plain prop/state sync — so this can't move to render.
      /* eslint-disable react-hooks/set-state-in-effect */
      try {
        if (readConsentCookie() && !demo) {
          setHide(true);
          setIsOpen(false);
          return;
        }
        setHide(false);
        setIsOpen(true);
      } catch (error) {
        console.warn("Cookie consent error:", error);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }, [demo]);

    if (hide) return null;

    const containerClasses = cn(
      // inset-x-0/mx-auto/max-w-[1200px] below center this within the site's
      // own content column (same width as the header/logo), rather than
      // pinning it to the true browser viewport edges — otherwise it sits
      // flush with the screen corner on a wide monitor while the logo above
      // it is inset into the centered column, visibly out of line. The
      // inner flex+px-4/md:px-6 then matches PAGE_X so the card's edge lines
      // up with the logo exactly, not just the column's outer border.
      "fixed z-[56] mx-auto flex w-full max-w-[1200px] justify-start pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] transition-all duration-700 md:pl-[calc(1.5rem+env(safe-area-inset-left))] md:pr-[calc(1.5rem+env(safe-area-inset-right))]",
      !isOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
      className,
    );

    const commonWrapperProps = {
      ...props,
      "aria-labelledby": titleId,
      "aria-live": "polite" as const,
      className: cn(
        containerClasses,
        "inset-x-0",
        variant === "mini" ? "bottom-4" : "bottom-0 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:pb-0",
      ),
      "data-slot": "cookie-consent",
      ref: setRefs,
      role: "region" as const,
    };

    const learnMore = (
      <Link
        className="text-xs text-primary underline underline-offset-4 hover:no-underline"
        href={learnMoreHref}
      >
        Learn more
      </Link>
    );

    if (variant === "default") {
      return (
        <div {...commonWrapperProps}>
          <Card className="my-3 w-full shadow-lg sm:max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg" id={titleId}>
                We use cookies
              </CardTitle>
              <Cookie aria-hidden className="h-5 w-5" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardDescription className="text-sm">{description}</CardDescription>
              <p className="text-xs text-muted-foreground">
                By clicking <span className="font-medium">Accept</span>, you agree to our use of
                cookies.
              </p>
              {learnMore}
            </CardContent>
            <CardFooter className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleDecline} type="button" variant="secondary">
                Decline
              </Button>
              <Button className="flex-1" onClick={handleAccept} type="button">
                Accept
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (variant === "small") {
      return (
        <div {...commonWrapperProps}>
          <Card className="my-3 w-full shadow-lg sm:max-w-md">
            <CardHeader className="flex h-0 flex-row items-center justify-between space-y-0 px-4 pb-2">
              <CardTitle className="text-base" id={titleId}>
                We use cookies
              </CardTitle>
              <Cookie aria-hidden className="h-4 w-4" />
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-2">
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardContent>
            <CardFooter className="flex h-0 gap-2 px-4 py-2">
              <Button
                className="flex-1 rounded-full"
                onClick={handleDecline}
                size="sm"
                type="button"
                variant="secondary"
              >
                Decline
              </Button>
              <Button className="flex-1 rounded-full" onClick={handleAccept} size="sm" type="button">
                Accept
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (variant === "mini") {
      return (
        <div {...commonWrapperProps}>
          <Card className="w-full p-0 py-3 shadow-lg sm:max-w-3xl">
            <CardContent className="grid gap-4 p-0 px-3.5 sm:flex">
              <CardDescription className="flex-1 text-xs sm:text-sm" id={titleId}>
                {description}
              </CardDescription>
              <div className="flex items-center justify-end gap-2 sm:gap-3">
                <Button
                  className="h-7 text-xs"
                  onClick={handleDecline}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Decline
                </Button>
                <Button className="h-7 text-xs" onClick={handleAccept} size="sm" type="button">
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  },
);

CookieConsent.displayName = "CookieConsent";
export { CookieConsent };
