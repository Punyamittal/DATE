import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600 text-sm normal-case",
          },
        }}
        routing="path"
        path="/sign-up"
      />
    </div>
  );
} 