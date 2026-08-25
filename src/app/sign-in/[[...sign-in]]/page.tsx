import { SignIn } from "@clerk/nextjs";
import { AFTER_AUTH_PATH, SIGN_UP_PATH } from "@/lib/urls";

export default function Page() {
  return (
    <div className="flex justify-center py-8">
      <SignIn fallbackRedirectUrl={AFTER_AUTH_PATH} signUpUrl={SIGN_UP_PATH} />
    </div>
  );
}
