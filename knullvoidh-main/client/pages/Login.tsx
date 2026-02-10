import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";

const Login: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4">
      <InteractiveCosmicBackground />
      <form
        aria-label="Login form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await login(identifier, password);
            nav("/profile");
          } catch (err: any) {
            setError(err.message || "Login failed");
          }
        }}
        className="relative z-20 w-full max-w-sm bg-white/5 border border-gray-700 rounded-lg p-6 space-y-4 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-bold">Login</h1>
        {error && (
          <div role="alert" className="text-red-400 text-sm">
            {error}
          </div>
        )}
        <label className="block text-sm">
          Email or Username
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-black/50 border border-gray-600 rounded"
            required
            aria-required
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
          Sign In
        </button>
        <p className="text-sm text-gray-300">
          No account?{" "}
          <Link className="text-cyan-400 underline" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
