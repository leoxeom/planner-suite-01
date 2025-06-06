import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialite: string;
}

export const CreateIntermittent: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialite: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      // Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'intermittent',
            nom: formData.nom,
            prenom: formData.prenom,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // Create intermittent profile
      const { error: profileError } = await supabase
        .from('intermittent_profiles')
        .insert({
          user_id: signUpData.user.id,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          specialite: formData.specialite || null,
          organisme_principal_id: user!.id
        });

      if (profileError) throw profileError;

      // Show success message with credentials
      toast.success(
        <div>
          <p>Compte intermittent créé avec succès !</p>
          <p className="mt-2 text-sm">
            <strong>Email :</strong> {formData.email}<br />
            <strong>Mot de passe :</strong> {formData.password}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Email : ${formData.email}\nMot de passe : ${formData.password}`
              );
              toast.success('Identifiants copiés !');
            }}
            className="mt-2 px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20"
          >
            Copier les identifiants
          </button>
        </div>,
        {
          duration: 10000,
          style: {
            minWidth: '300px',
          },
        }
      );

      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        specialite: '',
      });
    } catch (error: any) {
      console.error('Error creating intermittent:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Créer un Profil Intermittent</h1>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Dupont"
            required
          />

          <Input
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            placeholder="Jean"
            required
          />

          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jean.dupont@example.com"
            required
          />

          <Input
            type="password"
            label="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Input
            type="password"
            label="Confirmer le mot de passe"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Spécialité
            </label>
            <select
              value={formData.specialite}
              onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-dark-900 border dark:border-dark-700 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une spécialité</option>
              <option value="son">Son</option>
              <option value="lumiere">Lumière</option>
              <option value="plateau">Plateau</option>
              <option value="general">Général</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Créer le compte
          </Button>
        </form>
      </div>
    </div>
  );
};