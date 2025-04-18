import { auth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.firstName || "User"}!</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
        <p className="text-gray-600 mb-6">
          You are now logged in with Clerk authentication. This page is protected and only
          accessible to authenticated users.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Your Profile</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
              <p><span className="font-medium">Email:</span> {user?.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>- View Matches</li>
              <li>- Messages</li>
              <li>- Update Profile</li>
              <li>- Settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 