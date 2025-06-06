import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom as At, Lock, User, Building2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { RegisterFormData, UserRole } from '../../types/auth.types';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'regisseur',
    companyName: '',
    profession: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!formData.fullName) {
      newErrors.fullName = 'Le nom complet est requis';
    }
    
    if (formData.role === 'intermittent' && !formData.profession) {
      newErrors.profession = 'La profession est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        {
          role: formData.role,
          fullName: formData.fullName,
          profession: formData.profession,
          companyName: formData.companyName,
        }
      );
      
      if (error) {
        toast.error('Erreur lors de l\'inscription');
        return;
      }
      
      toast.success('Inscription réussie');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card glass className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Inscription
        </h2>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Role selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Votre rôle
            </label>
            <div className="flex space-x-4">
              <RoleButton 
                isSelected={formData.role === 'regisseur'} 
                onClick={() => handleRoleChange('regisseur')}
                icon={<Building2 size={18} />}
                label="Régisseur"
              />
              <RoleButton 
                isSelected={formData.role === 'intermittent'} 
                onClick={() => handleRoleChange('intermittent')}
                icon={<Briefcase size={18} />}
                label="Intermittent"
              />
            </div>
          </div>
          
          <Input
            id="fullName"
            name="fullName"
            type="text"
            label="Nom complet"
            placeholder="Jean Dupont"
            required
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            leftIcon={<User size={18} className="text-gray-500" />}
          />
          
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
          
          {formData.role === 'regisseur' && (
            <Input
              id="companyName"
              name="companyName"
              type="text"
              label="Nom de la compagnie/structure (optionnel)"
              placeholder="Nom de votre structure"
              value={formData.companyName}
              onChange={handleChange}
              leftIcon={<Building2 size={18} className="text-gray-500" />}
            />
          )}
          
          {formData.role === 'intermittent' && (
            <Input
              id="profession"
              name="profession"
              type="text"
              label="Profession"
              placeholder="Ex: Technicien son, Éclairagiste..."
              required
              value={formData.profession}
              onChange={handleChange}
              error={errors.profession}
              leftIcon={<Briefcase size={18} className="text-gray-500" />}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            glow
          >
            S'inscrire
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Vous avez déjà un compte ? 
            </span>{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Se connecter
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

interface RoleButtonProps {
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const RoleButton: React.FC<RoleButtonProps> = ({ isSelected, onClick, icon, label }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
        isSelected 
          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300' 
          : 'bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300'
      } transition-colors duration-200`}
    >
      <span className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}>
        {icon}
      </span>
      <span>{label}</span>
    </motion.button>
  );
};