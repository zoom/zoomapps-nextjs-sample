import { authServerService } from "@/lib/services/auth-server.service";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    try {
        const user = await authServerService.getCurrentUser();

        if (!user) {
            return redirect("/");
        }

        return (
            <div className="flex flex-col w-full max-w-full">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-600">Welcome, {user.email}!</p>
            </div>
        );
    } catch (error) {
        console.error("Dashboard error:", error);
        return redirect("/");
    }
}