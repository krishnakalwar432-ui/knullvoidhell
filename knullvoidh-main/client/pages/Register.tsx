import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";

const Register: React.FC = () => {
  const { register } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("Global");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4">
      <InteractiveCosmicBackground />
      <form
        aria-label="Registration form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await register({ username, email, password, region });
            nav("/profile");
          } catch (err: any) {
            setError(err.message || "Registration failed");
          }
        }}
        className="relative z-20 w-full max-w-sm bg-white/5 border border-gray-700 rounded-lg p-6 space-y-4 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-bold">Create Account</h1>
        {error && (
          <div role="alert" className="text-red-400 text-sm">
            {error}
          </div>
        )}
        <label className="block text-sm">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-black/50 border border-gray-600 rounded"
            required
            aria-required
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-black/50 border border-gray-600 rounded"
            required
            aria-required
          />
        </label>
        <label className="block text-sm">
          Region
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-black/50 border border-gray-600 rounded"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-black/50 border border-gray-600 rounded"
            required
            aria-required
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500"
        >
          Register
        </button>
        <p className="text-sm text-gray-300">
          Have an account?{" "}
          <Link className="text-cyan-400 underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
