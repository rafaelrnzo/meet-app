"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg =
          (data && (data.error || data.message)) ||
          `Login failed with status ${res.status}`
        throw new Error(msg)
      }

      const data = await res.json()
      const token = data.token

      if (!token) {
        throw new Error("Token not found in response")
      }

      // Simpan token & user info ke localStorage (untuk useAuth di FE)
      if (typeof window !== "undefined") {
        localStorage.setItem("vc_token", token)
        localStorage.setItem(
          "vc_user",
          JSON.stringify({
            username,
            role: data.role || "user",
          })
        )
      }

      // Arahkan ke dashboard utama (ubah ke /dashboard kalau kamu pakai route itu)
      router.push("/")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Login to your account
          </h1>
          <p className="text-xs text-slate-400">
            Enter your username and password to continue.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center bg-red-950/40 border border-red-900 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="username" className="text-slate-200">
            Username
          </FieldLabel>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="superadmin"
            className="bg-slate-950 border-slate-700 text-slate-50 placeholder:text-slate-500 focus-visible:ring-slate-500"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-slate-200">
              Password
            </FieldLabel>
            <a
              href="#"
              className="ml-auto text-xs text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="bg-slate-950 border-slate-700 text-slate-50 placeholder:text-slate-500 focus-visible:ring-slate-500"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator className="text-slate-500">
          Or continue with
        </FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            className="w-full border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 h-4 w-4"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 
                  0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61
                  C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729
                  1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 
                  3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 
                  0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 
                  0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 
                  2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 
                  1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 
                  0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 
                  24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Login with GitHub
          </Button>
          <FieldDescription className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
