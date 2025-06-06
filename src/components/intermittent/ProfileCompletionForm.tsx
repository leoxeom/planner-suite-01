import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Phone, MapPin, FileText, CreditCard, Calendar, Lock, Upload, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface ProfileCompletionFormProps {
  profile: {
    id: string;
    user_id: string;
    nom: string;
    prenom: string;
    email: string;
    specialite: string | null;
  };
  onComplete: () => void;
}

export const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
  profile,
  onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    telephone: '',
    specialite: profile.specialite || '',
    adresse: '',
    numero_secu: '',
    num_conges_spectacles: '',
    date_visite_medicale: '',
    password: '',
    confirmPassword: '',
    bio: ''
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${profile.user_id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const removePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields and password match
    if (!formData.telephone || !formData.specialite || !formData.adresse || !formData.numero_secu || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload avatar if selected
      const avatarUrl = await uploadAvatar(profile.id);

      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (passwordError) throw passwordError;

      // Update profile
      const { error } = await supabase
        .from('intermittent_profiles')
        .update({
          ...formData,
          avatar_url: avatarUrl,
          password: undefined,
          confirmPassword: undefined,
          profil_complete: true
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profil complété avec succès !');
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated Orbs */}
        <div className="orb orb-primary" />
        <div className="orb orb-secondary" />
        {/* Grid Overlay */}
        <div className="grid-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card glass glow>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display tracking-wider mb-2">
                COMPLÉTEZ VOTRE PROFIL
              </h1>
              <p className="text-gray-400">
                Bienvenue {profile.prenom} ! Pour continuer, veuillez compléter vos informations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Security Section */}
              <div className="bg-dark-900/30 rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold text-primary-400 flex items-center">
                  <Lock size={20} className="mr-2" />
                  Sécurité du Compte
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Définissez votre mot de passe personnel pour sécuriser votre compte.
                  Il doit contenir au moins 6 caractères.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="password"
                    label="Nouveau mot de passe"
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
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="bg-dark-900/30 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-primary-400 flex items-center mb-4">
                  <Upload size={20} className="mr-2" />
                  Photo de Profil
                </h2>
                <div className="flex items-center space-x-6">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePreview}
                        className="absolute -top-2 -right-2 p-1 bg-error-500 rounded-full text-white hover:bg-error-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-dark-800 flex items-center justify-center">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-block px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg cursor-pointer hover:bg-primary-500/30 transition-colors"
                    >
                      Choisir une photo
                    </label>
                    <p className="text-sm text-gray-400 mt-2">
                      Format JPG, PNG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pre-filled, non-editable fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom"
                  value={profile.nom}
                  disabled
                  className="bg-dark-900/50"
                />
                <Input
                  label="Prénom"
                  value={profile.prenom}
                  disabled
                  className="bg-dark-900/50"
                />
              </div>

              <Input
                label="Email"
                value={profile.email}
                disabled
                className="bg-dark-900/50"
              />

              {/* Required fields */}
              <Input
                label="Numéro de téléphone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="Ex: 06 12 34 56 78"
                required
                leftIcon={<Phone size={18} />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">
                  Spécialité Principale <span className="text-error-500">*</span>
                </label>
                <select
                  value={formData.specialite}
                  onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white"
                  required
                >
                  <option value="">Sélectionner une spécialité</option>
                  <option value="son">Son</option>
                  <option value="lumiere">Lumière</option>
                  <option value="plateau">Plateau</option>
                  <option value="video">Vidéo</option>
                  <option value="generaliste">Généraliste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">
                  Adresse complète <span className="text-error-500">*</span>
                </label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Numéro, rue, code postal, ville"
                  className="w-full h-24 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              <Input
                label="Numéro de Sécurité Sociale"
                value={formData.numero_secu}
                onChange={(e) => setFormData({ ...formData, numero_secu: e.target.value })}
                placeholder="15 chiffres"
                required
                leftIcon={<FileText size={18} />}
              />

              {/* Optional fields */}
              <Input
                label="Numéro Congés Spectacles (optionnel)"
                value={formData.num_conges_spectacles}
                onChange={(e) => setFormData({ ...formData, num_conges_spectacles: e.target.value })}
                placeholder="Votre numéro Congés Spectacles"
                leftIcon={<CreditCard size={18} />}
              />

              <Input
                type="date"
                label="Date de visite médicale (optionnel)"
                value={formData.date_visite_medicale}
                onChange={(e) => setFormData({ ...formData, date_visite_medicale: e.target.value })}
                leftIcon={<Calendar size={18} />}
              />

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">
                  Ma description (optionnel)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Parlez-nous un peu de vous, de votre expérience..."
                  className="w-full h-32 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                glow
              >
                Enregistrer et Continuer
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};