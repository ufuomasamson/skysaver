"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    city: "",
    country: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Protect route: only admin
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!cookie) {
      router.replace('/login');
      return;
    }
    try {
      const userObj = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      if (userObj.role !== 'admin') {
        router.replace('/search');
        return;
      }
      setIsAdmin(true);
    } catch {
      router.replace('/login');
      return;
    }
    fetchLocations();
  }, [router]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data || []);
    } catch (err) {
      setError('Failed to fetch locations');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.city.trim() || !formData.country.trim()) {
      setError("Both city and country are required");
      return;
    }
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/locations/${editingId}` : '/api/locations';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save location');
      }
      setSuccess(editingId ? 'Location updated successfully!' : 'Location created successfully!');
      setFormData({ city: "", country: "" });
      setEditingId(null);
      setShowForm(false);
      fetchLocations();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const handleEdit = (location: any) => {
    setFormData({ city: location.city, country: location.country });
    setEditingId(location.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete location');
      }
      setSuccess("Location deleted successfully!");
      fetchLocations();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18176b] mx-auto mb-4"></div>
          <p className="text-[#18176b] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Locations</h1>
              <p className="text-gray-200 mt-2">Add, edit, or remove locations from the system</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({ city: "", country: "" });
                }}
                className="bg-[#cd7e0f] text-white px-6 py-2 rounded-lg hover:bg-[#cd7e0f]/90 transition"
              >
                {showForm ? "Cancel" : "Add Location"}
              </button>
              <a
                href="/admin/dashboard"
                className="border border-white text-white px-6 py-2 rounded-lg hover:bg-white hover:text-[#18176b] transition"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#18176b] mb-6">
              {editingId ? "Edit Location" : "Add New Location"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city name"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter country name"
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#cd7e0f] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition"
                >
                  {editingId ? "Update Location" : "Add Location"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ city: "", country: "" });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Locations List */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[#18176b] mb-6">All Locations</h2>
          
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600">No locations found. Add your first location to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <div key={location.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{location.city}</h3>
                        <p className="text-gray-600">{location.country}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 