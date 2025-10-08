'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardBody } from '@heroui/react';
import { IconUser, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError(''); 
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Username atau password salah');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1d2e] relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4a9b9b] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4a9b9b] rounded-full translate-x-1/2 translate-y-1/2 opacity-20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl">
        <CardBody className="p-8">
          <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
            LOGIN
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Username"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={handleChange('username')}
              startContent={
                <IconUser size={20} className="text-gray-400" stroke={1.5} />
              }
              variant="bordered"
              classNames={{
                input: 'text-gray-800',
                inputWrapper: 'border-2 border-gray-300 hover:border-[#4a9b9b] focus-within:border-[#4a9b9b]',
              }}
              isRequired
            />

            <Input
              label="Password"
              placeholder="Masukkan password"
              value={formData.password}
              onChange={handleChange('password')}
              startContent={
                <IconLock size={20} className="text-gray-400" stroke={1.5} />
              }
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <IconEyeOff size={20} className="text-gray-400" stroke={1.5} />
                  ) : (
                    <IconEye size={20} className="text-gray-400" stroke={1.5} />
                  )}
                </button>
              }
              type={isVisible ? 'text' : 'password'}
              variant="bordered"
              classNames={{
                input: 'text-gray-800',
                inputWrapper: 'border-2 border-gray-300 hover:border-[#4a9b9b] focus-within:border-[#4a9b9b]',
              }}
              isRequired
            />

            <Button
              type="submit"
              className="w-full bg-[#4a9b9b] hover:bg-[#3d8585] text-white font-semibold shadow-md"
              size="lg"
              isLoading={isLoading}
              isDisabled={!formData.username || !formData.password}
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}