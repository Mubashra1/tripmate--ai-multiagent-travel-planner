import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";

const BG_IMAGE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
        role="img"
        aria-label="Tropical beach paradise"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/80 via-[#0F172A]/60 to-[#0F172A]/80" />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8 fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-2">
              <Logo size="lg" showTagline />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Welcome back</h1>
          <p className="text-white/60 mt-1 font-sans">Sign in to access your saved trips</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/20 backdrop-blur-xl rounded-2xl p-8 space-y-5 border border-accent/20 shadow-2xl shadow-accent/10 fade-in-up stagger-2">
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-sm text-red-200" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                placeholder="Enter your password"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-accent/80 cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm group relative overflow-hidden">
            <span className="absolute inset-0 bg-gradient-to-r from-accent-dark via-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {loading ? (
              <span className="flex items-center gap-2 relative z-10">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="relative z-10">Sign In</span>
            )}
          </button>

          <p className="text-center text-sm text-white/50 font-sans">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent font-medium hover:text-accent-light transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}