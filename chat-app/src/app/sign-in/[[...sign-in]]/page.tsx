import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600 text-sm normal-case",
          },
        }}
        routing="path"
        path="/sign-in"
      />
    </div>
  );
} 