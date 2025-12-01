"use client";

import { useState } from "react";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function AddHostelForm() {
    const [formData, setFormData] = useState({
        name: "",
        type: "Boys",
        gender_allowed: "Co-ed",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({
        type: null,
        text: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: null, text: "" });

        try {
            const response = await fetch("/api/hostels", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: "success", text: "Hostel added successfully!" });
                setFormData({
                    name: "",
                    type: "Boys",
                    gender_allowed: "Co-ed",
                    address: "",
                });
                // Optional: Trigger a refresh of the hostel list if needed, 
                // but for now we just show success.
            } else {
                setMessage({ type: "error", text: data.error || "Failed to add hostel" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-black">Add New Hostel</h2>

            {message.text && (
                <div className={`p-4 mb-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    } flex items-center gap-2`}>
                    {message.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-black mb-1">Hostel Name</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="e.g. Block A"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Type</label>
                        <select
                            name="type"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="Boys">Boys</option>
                            <option value="Girls">Girls</option>
                            <option value="Co-ed">Co-ed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Gender Allowed</label>
                        <select
                            name="gender_allowed"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                            value={formData.gender_allowed}
                            onChange={handleChange}
                        >
                            <option value="Co-ed">Co-ed</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-black mb-1">Address (Optional)</label>
                    <textarea
                        name="address"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                        placeholder="Campus location..."
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <Building2 className="w-4 h-4" />
                            Add Hostel
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
