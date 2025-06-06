import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom as At, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { AuthFormData } from '../../types/auth.types';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<AuthFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof AuthFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<AuthFormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast.error('Identifiants incorrects');
        return;
      }
      
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la connexion');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card glass className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Connexion
        </h2>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="votre@email.com"
            required
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={<At size={18} className="text-gray-500" />}
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            required
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<Lock size={18} className="text-gray-500" />}
          />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            glow
          >
            Se connecter
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Vous n'avez pas de compte ? 
            </span>{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              S'inscrire
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};