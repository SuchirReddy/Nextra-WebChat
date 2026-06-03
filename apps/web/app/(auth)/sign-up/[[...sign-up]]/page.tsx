import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SignUp
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#00A3D7"
          }
        }}
      />
    </div>
  );
}
