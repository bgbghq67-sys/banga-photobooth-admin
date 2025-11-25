"use client";

import { useState } from "react";

export default function AdminPage() {
  const [sessionCount, setSessionCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const adjustCount = (delta: number) => {
    setSessionCount((prev) => Math.max(1, prev + delta));
  };

  const activateSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionsToAdd: sessionCount }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Successfully activated ${sessionCount} session(s)!`);
        setSessionCount(1); // Reset to default
      } else {
        alert("Failed: " + data.message);
      }
    } catch (e) {
      alert("Error activating sessions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Kiosk Control</h1>
        <p className="text-gray-500 mb-8">Add sessions to activate the photobooth.</p>

        <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
          <div className="text-sm text-gray-400 mb-4 uppercase tracking-wider font-semibold">Sessions to Add</div>
          
          <div className="flex items-center justify-center gap-6">
            <button 
                onClick={() => adjustCount(-1)}
                className="w-16 h-16 rounded-full bg-gray-200 text-gray-600 text-3xl font-bold hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
                -
            </button>
            
            <div className="text-6xl font-mono font-bold text-blue-600 w-24">
                {sessionCount}
            </div>

            <button 
                onClick={() => adjustCount(1)}
                className="w-16 h-16 rounded-full bg-gray-200 text-gray-600 text-3xl font-bold hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
                +
            </button>
          </div>
        </div>

        <button
          onClick={activateSessions}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 px-6 rounded-xl text-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-200 transform active:scale-95"
        >
          {loading ? (
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          ACTIVATE
        </button>
      </div>
    </div>
  );
}
