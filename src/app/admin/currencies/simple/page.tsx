"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function SimpleCurrencyPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      try {
        // Get user ID from session or local storage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.replace("/login");
          return;
        }
        
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();
        
      if (error || !data || data.role !== "admin") {
        router.replace("/search");
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
      } catch (error) {
        console.error("Error checking user role:", error);
        router.replace("/login");
      }
    };
    
    checkRole();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f1032] mx-auto mb-4"></div>
          <p className="text-[#4f1032] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-gradient-to-r from-[#4f1032] to-[#4f1032]/90 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Simple Currency Management</h1>
              <p className="text-gray-200 mt-2">Test page for currency management</p>
            </div>
            <a
              href="/admin/dashboard"
              className="bg-[#cd7e0f] text-white px-6 py-2 rounded-lg hover:bg-[#cd7e0f]/90 transition"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#4f1032] mb-6">Currency Management Test</h2>
          <p className="text-gray-600 mb-4">This is a test page to verify that routing is working correctly.</p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ If you can see this page, the routing is working correctly!
          </div>
        </div>
      </div>
    </div>
  );
} 