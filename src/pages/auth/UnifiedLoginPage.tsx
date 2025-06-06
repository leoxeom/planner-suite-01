import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Beer, SprayCan as Spray, Shield, AtSign, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';

const PLANNER_APPS = [
  { 
    id: 'stage',
    name: 'STAGEPLANNER',
    icon: <Mic2 size={24} className="transition-colors duration-300" />
  },
  { 
    id: 'bar',
    name: 'BARPLANNER',
    icon: <Beer size={24} className="transition-colors duration-300" />
  },
  { 
    id: 'clean',
    name: 'CLEANPLANNER',
    icon: <Spray size={24} className="transition-colors duration-300" />
  },
  { 
    id: 'secure',
    name: 'SECUREPLANNER',
    icon: <Shield size={24} className="transition-colors duration-300" />
  }
];

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlanner, setSelectedPlanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!email) {
      toast.error('Veuillez saisir votre adresse email');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Veuillez saisir une adresse email valide');
      return;
    }
    
    // For now, always select STAGEPLANNER
    setSelectedPlanner('stage');
    setShowPassword(true);
    setError(null);
  };

  const handleLogin = async () => {
    if (!password) {
      toast.error('Veuillez saisir votre mot de passe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
          toast.error('Email ou mot de passe incorrect');
        } else {
          setError('Une erreur est survenue lors de la connexion');
          toast.error('Une erreur est survenue lors de la connexion');
        }
        return;
      }

      // Get redirect path from location state or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      
      toast.success('Connexion réussie !', {
        duration: 2000,
        icon: '✨'
      });

      // Small delay to show success message before redirect
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur inattendue est survenue');
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            backgroundColor: selectedPlanner ? 'rgba(0, 127, 255, 0.3)' : 'rgba(255, 191, 0, 0.3)',
          }}
          transition={{ duration: 0.6 }}
          className="orb orb-primary"
        />
        <motion.div
          animate={{
            backgroundColor: selectedPlanner ? 'rgba(247, 39, 152, 0.2)' : 'rgba(202, 168, 112, 0.2)',
          }}
          transition={{ duration: 0.6 }}
          className="orb orb-secondary"
        />
      </div>

      <div className="container mx-auto min-h-screen flex flex-col items-center justify-center px-4">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="font-display text-5xl md:text-6xl text-[#FFF8E7] tracking-wider mb-2">
            PLANNER SUITE
          </h1>
          <p className="font-heading text-sm text-[#A0A8C0] tracking-wide uppercase">
            Focus on the essential
          </p>
        </motion.div>

        {/* Planner Apps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mb-12"
        >
          {PLANNER_APPS.map((app) => (
            <motion.div
              key={app.id}
              animate={{
                scale: selectedPlanner === app.id ? 1.1 : 1,
                opacity: selectedPlanner && selectedPlanner !== app.id ? 0.5 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className={`flex items-center gap-2 font-heading text-sm tracking-wide transition-colors duration-300 ${
                selectedPlanner === app.id ? 'text-primary-DEFAULT' : 'text-[#A0A8C0]'
              }`}>
                <motion.div
                  animate={{
                    color: selectedPlanner === app.id ? '#007FFF' : '#CAA870',
                  }}
                >
                  {app.icon}
                </motion.div>
                <span>{app.name}</span>
              </div>
              {selectedPlanner === app.id && (
                <motion.div
                  layoutId="planner-highlight"
                  className="absolute inset-0 -z-10 bg-primary-DEFAULT/10 rounded-lg shadow-[0_0_15px_rgba(0,127,255,0.3)]"
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          <Card 
            glass 
            className={`transition-all duration-300 ${
              selectedPlanner
                ? 'border-primary-DEFAULT/20 shadow-[0_0_30px_rgba(0,127,255,0.15)]'
                : 'border-[#CAA87040] shadow-[0_0_30px_rgba(255,191,0,0.15)]'
            }`}
          >
            <CardContent className="p-8 relative overflow-hidden">
              <h2 className="font-heading text-xl text-center text-[#FFF8E7] mb-6">
                Accès Sécurisé
              </h2>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <motion.div
                  animate={{
                    y: showPassword ? -10 : 0,
                    opacity: showPassword ? 0.7 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    theme={selectedPlanner ? 'stage' : 'amber'}
                    leftIcon={<AtSign size={18} className={`transition-colors duration-300 ${
                      selectedPlanner ? 'text-primary-DEFAULT' : 'text-[#CAA870]'
                    }`} />}
                    className={`bg-[#0A0A0A40] transition-colors duration-300 ${
                      selectedPlanner 
                        ? 'border-primary-DEFAULT/20 focus:border-primary-DEFAULT' 
                        : 'border-[#CAA87020] focus:border-[#FFBF00]'
                    }`}
                    disabled={showPassword}
                  />
                </motion.div>

                <AnimatePresence>
                  {showPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        theme="stage"
                        leftIcon={<Lock size={18} className="text-primary-DEFAULT" />}
                        className="bg-[#0A0A0A40] border-primary-DEFAULT/20 focus:border-primary-DEFAULT"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    y: showPassword ? 0 : 10,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={showPassword ? handleLogin : handleContinue}
                    theme={selectedPlanner ? 'stage' : 'amber'}
                    className={`w-full font-display tracking-wider transition-all duration-300 ${
                      selectedPlanner
                        ? 'bg-gradient-to-r from-primary-DEFAULT to-primary-600 text-white shadow-[0_0_15px_rgba(0,127,255,0.3)] hover:shadow-[0_0_25px_rgba(0,127,255,0.4)]'
                        : 'bg-gradient-to-r from-[#FFBF00] to-[#CAA870] text-[#1C160C] shadow-[0_0_15px_rgba(255,191,0,0.3)] hover:shadow-[0_0_25px_rgba(255,191,0,0.4)]'
                    }`}
                    isLoading={isLoading}
                  >
                    {showPassword ? 'SE CONNECTER' : 'CONTINUER'}
                  </Button>
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-error-DEFAULT"
                  >
                    {error}
                  </motion.p>
                )}

                <p className="text-center text-sm text-[#A0A8C0]">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className={`font-medium transition-colors duration-300 ${
                      selectedPlanner
                        ? 'text-primary-DEFAULT hover:text-primary-600'
                        : 'text-[#FFBF00] hover:text-[#CAA870]'
                    }`}
                  >
                    Créer un compte
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};