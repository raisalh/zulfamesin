"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { IconUser, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      setError("");
    };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
        setIsLoading(false);

        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1d2e] relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#4a9b9b] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#4a9b9b] rounded-full translate-x-1/2 translate-y-1/2 opacity-20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md shadow-2xl">
        <CardBody className="p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
            LOGIN
          </h1>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Input
              isRequired
              classNames={{
                input: "text-gray-800 text-sm sm:text-base",
                inputWrapper:
                  "border-2 border-gray-300 hover:border-[#4a9b9b] focus-within:border-[#4a9b9b] h-12 sm:h-14",
                label: "text-sm sm:text-base",
              }}
              label="Username"
              placeholder="Masukkan username"
              startContent={
                <IconUser
                  className="text-gray-400 sm:w-5 sm:h-5"
                  size={18}
                  stroke={1.5}
                />
              }
              type="text"
              value={formData.username}
              variant="bordered"
              onChange={handleChange("username")}
            />

            <Input
              isRequired
              classNames={{
                input: "text-gray-800 text-sm sm:text-base",
                inputWrapper:
                  "border-2 border-gray-300 hover:border-[#4a9b9b] focus-within:border-[#4a9b9b] h-12 sm:h-14",
                label: "text-sm sm:text-base",
              }}
              endContent={
                <button
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  className="focus:outline-none touch-manipulation"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <IconEyeOff
                      className="text-gray-400 sm:w-5 sm:h-5"
                      size={18}
                      stroke={1.5}
                    />
                  ) : (
                    <IconEye
                      className="text-gray-400 sm:w-5 sm:h-5"
                      size={18}
                      stroke={1.5}
                    />
                  )}
                </button>
              }
              label="Password"
              placeholder="Masukkan password"
              startContent={
                <IconLock
                  className="text-gray-400 sm:w-5 sm:h-5"
                  size={18}
                  stroke={1.5}
                />
              }
              type={isVisible ? "text" : "password"}
              value={formData.password}
              variant="bordered"
              onChange={handleChange("password")}
            />

            <Button
              className="w-full bg-[#4a9b9b] hover:bg-[#3d8585] text-white font-semibold shadow-md text-sm sm:text-base touch-manipulation"
              isDisabled={!formData.username || !formData.password}
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              © 2025 Zulfa Mesin. All rights reserved.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
