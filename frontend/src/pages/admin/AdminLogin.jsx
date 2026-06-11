import React, { useState, useEffect } from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import { authService } from "../../services/authService";

import logo from "../../assets/favicon.ico";
import backgroundImage from "../../assets/Admin_bg.jpg";

export default function AdminLogin() {
  const navigate = useNavigate();

  const location = useLocation();

  const {
    user,
    dark,
    setDark,
  } = useAuth();

  const isTempleLogin =
    location.pathname.includes("temple-admin");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   |--------------------------------------------------------------------------
   | AUTO REDIRECT
   |--------------------------------------------------------------------------
   */

  useEffect(() => {
    if (!user) return;

    const userType = Number(user.user_type);

    if (userType === 1) {
      navigate("/admin/dashboard", {
        replace: true,
      });
    }

    if (userType === 2) {
      navigate("/temple-admin/dashboard", {
        replace: true,
      });
    }
  }, [user, navigate]);

  /*
   |--------------------------------------------------------------------------
   | SUBMIT LOGIN
   |--------------------------------------------------------------------------
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      const cleanPassword =
        password.trim();

      const response =
        await authService.adminLogin(
          cleanEmail,
          cleanPassword
        );

      const userData =
        response?.data || response?.user;

      if (
        response &&
        (response.success ||
          response.status === "true") &&
        userData
      ) {
        const userType =
          Number(userData.user_type);

        /*
         |--------------------------------------------------------------------------
         | PORTAL VALIDATION
         |--------------------------------------------------------------------------
         */

        if (
          isTempleLogin &&
          userType !== 2
        ) {
          throw new Error(
            "Access denied. This account is not a Temple Admin."
          );
        }

        if (
          !isTempleLogin &&
          userType !== 1
        ) {
          throw new Error(
            "Access denied. Please use the Temple Admin portal."
          );
        }

        /*
         |--------------------------------------------------------------------------
         | SAFE REDIRECT
         |--------------------------------------------------------------------------
         */

        navigate(
          userType === 1
            ? "/admin/dashboard"
            : "/temple-admin/dashboard",
          {
            replace: true,
          }
        );

      } else {
        throw new Error(
          response?.message ||
            "Invalid credentials."
        );
      }

    } catch (err) {
      let message =
        "Invalid email or password.";

      if (err.response?.status === 404) {
        message =
          "Login endpoint not found.";
      } else if (
        err.response?.data?.message
      ) {
        message =
          err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dark ? "dark" : ""}>

      <div
        className="
          min-h-screen
          relative
          flex
          items-center
          justify-center
          bg-cover
          bg-center
          bg-no-repeat
          px-4
          overflow-hidden
        "
        style={{
          backgroundImage:
            `url(${backgroundImage})`,
        }}
      >

        {/* Overlay */}

        <div
          className="
            absolute
            inset-0
            bg-slate-900/70
            dark:bg-black/80
            backdrop-blur-[2px]
          "
        />

        {/* Card */}

        <div
          className="
            relative
            z-10
            w-full
            max-w-md
            rounded-3xl
            border
            border-white/10
            bg-white/10
            dark:bg-black/30
            backdrop-blur-2xl
            shadow-2xl
            overflow-hidden
            p-8
          "
        >

          {/* Decorative Glow */}

          <div
            className="
              absolute
              -top-16
              -left-16
              w-40
              h-40
              rounded-full
              bg-indigo-500/20
              blur-3xl
            "
          />

          {/* Theme Toggle */}

          <div className="flex justify-end mb-4">

            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="
                p-2
                rounded-full
                border
                border-white/10
                bg-white/10
                hover:bg-white/20
                text-white
                transition-all
              "
            >
              {dark ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

          </div>

          {/* Logo */}

          <div className="text-center">

            <img
              src={logo}
              alt="STM Logo"
              className="
                w-20
                h-20
                object-contain
                mx-auto
                mb-4
                drop-shadow-lg
              "
            />

            <h1
              className="
                text-3xl
                font-black
                text-white
                tracking-tight
              "
            >
              {isTempleLogin
                ? "Temple Admin"
                : "Super Admin"}
            </h1>

            <p
              className="
                text-sm
                text-white/70
                mt-2
                mb-8
              "
            >
              {isTempleLogin
                ? "Temple management portal"
                : "Centralized administrative control"}
            </p>

          </div>

          {/* Error */}

          {error && (
            <div
              className="
                mb-6
                flex
                items-start
                gap-3
                rounded-2xl
                border
                border-red-500/30
                bg-red-500/15
                p-4
                text-red-100
                text-sm
              "
            >
              <AlertCircle
                size={18}
                className="
                  mt-0.5
                  shrink-0
                  text-red-300
                "
              />

              <span>{error}</span>
            </div>
          )}

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  uppercase
                  tracking-[2px]
                  text-white/70
                  font-bold
                  mb-2
                "
              >
                Email Address
              </label>

              <input
                type="email"
                autoComplete="email"
                placeholder="admin@stmclub.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="
                  w-full
                  px-4
                  py-3.5
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  text-white
                  placeholder:text-white/40
                  outline-none
                  transition-all
                  focus:ring-2
                  focus:ring-indigo-400
                  focus:bg-white/20
                "
              />

            </div>

            {/* Password */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  uppercase
                  tracking-[2px]
                  text-white/70
                  font-bold
                  mb-2
                "
              >
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="
                    w-full
                    px-4
                    py-3.5
                    pr-12
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/10
                    text-white
                    placeholder:text-white/40
                    outline-none
                    transition-all
                    focus:ring-2
                    focus:ring-indigo-400
                    focus:bg-white/20
                    appearance-none
                    [&::-ms-reveal]:hidden
                    [&::-ms-clear]:hidden
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    top-1/2
                    right-4
                    -translate-y-1/2
                    text-white/50
                    hover:text-white
                    transition-colors
                  "
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full
                py-4
                rounded-2xl
                font-bold
                text-white
                shadow-xl
                transition-all
                active:scale-[0.98]
                disabled:opacity-60
                disabled:cursor-not-allowed

                ${
                  isTempleLogin
                    ? `
                      bg-gradient-to-r
                      from-orange-600
                      to-orange-500
                      hover:from-orange-500
                      hover:to-orange-400
                    `
                    : `
                      bg-gradient-to-r
                      from-indigo-600
                      to-indigo-500
                      hover:from-indigo-500
                      hover:to-indigo-400
                    `
                }
              `}
            >

              {loading ? (
                <span
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Authenticating...
                </span>
              ) : (
                <span
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  {isTempleLogin
                    ? "Temple Login"
                    : "Admin Login"}

                  <div
                    className="
                      w-2
                      h-2
                      rounded-full
                      bg-green-400
                      animate-pulse
                    "
                  />
                </span>
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

