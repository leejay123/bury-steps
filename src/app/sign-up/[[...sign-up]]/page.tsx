import { SignUp } from "@clerk/nextjs";
import { AFTER_AUTH_PATH, SIGN_IN_PATH } from "@/lib/urls";

export default function Page() {
  return (
    <div className="flex justify-center py-8">
      <SignUp fallbackRedirectUrl={AFTER_AUTH_PATH} signInUrl={SIGN_IN_PATH} />
    </div>
  );
}
