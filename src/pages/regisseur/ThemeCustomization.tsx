import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Palette, Upload, X, Building2, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

interface ThemeSettings {
  nom_organisme: string | null;
  logo_url: string | null;
  couleur_gradient_1: string;
  couleur_gradient_2: string;
  global_border_radius: number;
}

const DEFAULT_COLORS = {
  couleur_gradient_1: '#007FFF',
  couleur_gradient_2: '#F72798',
  global_border_radius: 12
};

export const ThemeCustomization: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ThemeSettings>({
    nom_organisme: '',
    logo_url: null,
    ...DEFAULT_COLORS
  });

  useEffect(() => {
    if (user) {
      fetchThemeSettings();
    }
  }, [user]);

  const fetchThemeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('regisseur_profiles')
        .select('nom_organisme, logo_url, couleur_gradient_1, couleur_gradient_2, global_border_radius')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          ...data,
          couleur_gradient_1: data.couleur_gradient_1 || DEFAULT_COLORS.couleur_gradient_1,
          couleur_gradient_2: data.couleur_gradient_2 || DEFAULT_COLORS.couleur_gradient_2
        });

        if (data.logo_url) {
          setPreviewUrl(data.logo_url);
        }

        // Apply theme colors
        document.documentElement.style.setProperty('--color-primary', data.couleur_gradient_1);
        document.documentElement.style.setProperty('--color-secondary', data.couleur_gradient_2);
        document.documentElement.style.setProperty('--global-border-radius', `${data.global_border_radius || DEFAULT_COLORS.global_border_radius}px`);
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

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

  const uploadLogo = async (): Promise<string | null> => {
    if (!selectedFile) return formData.logo_url;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user!.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos-organismes')
        .upload(filePath, selectedFile, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('logos-organismes')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const removePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl && previewUrl !== formData.logo_url) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Upload logo if selected
      const logoUrl = await uploadLogo();

      // Update profile
      const { error } = await supabase
        .from('regisseur_profiles')
        .update({
          nom_organisme: formData.nom_organisme,
          logo_url: logoUrl,
          couleur_gradient_1: formData.couleur_gradient_1,
          couleur_gradient_2: formData.couleur_gradient_2,
          global_border_radius: formData.global_border_radius
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      // Apply theme colors
      document.documentElement.style.setProperty('--color-primary', formData.couleur_gradient_1);
      document.documentElement.style.setProperty('--color-secondary', formData.couleur_gradient_2);
      document.documentElement.style.setProperty('--global-border-radius', `${formData.global_border_radius}px`);

      toast.success('Personnalisation enregistrée avec succès');
      await fetchThemeSettings();
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-4xl font-display tracking-wider bg-gradient-to-r from-white to-dark-200 dark:from-white dark:to-dark-400 bg-clip-text text-transparent animate-glow-text">
          RÉGLAGES
        </h1>
        <p className="text-dark-400 font-heading">
          Personnalisez votre interface et gérez vos informations
        </p>
      </motion.div>

      <div className="grid gap-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            glass 
            glow 
            onClick={() => navigate('/dashboard/settings/venue')}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Building2 size={24} className="text-primary-400" />
                <div>
                  <h3 className="text-lg font-semibold">Informations Salle</h3>
                  <p className="text-sm text-gray-400">
                    Gérez les informations de votre salle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            glass 
            glow 
            onClick={() => navigate('/dashboard/settings/theme')}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Settings size={24} className="text-primary-400" />
                <div>
                  <h3 className="text-lg font-semibold">Personnalisation</h3>
                  <p className="text-sm text-gray-400">
                    Personnalisez l'apparence de l'application
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Customization */}
        <Card glass glow>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8 p-6">
              {/* Organization Name */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Informations de l'Organisme</h2>
                <Input
                  label="Nom de l'organisme"
                  value={formData.nom_organisme || ''}
                  onChange={(e) => setFormData({ ...formData, nom_organisme: e.target.value })}
                  placeholder="Ex: Théâtre Municipal"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Logo</h2>
                <div className="flex items-center space-x-6">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Logo Preview"
                        className="h-24 w-auto object-contain"
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
                    <div className="h-24 w-24 bg-dark-800 flex items-center justify-center rounded-lg">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-block px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg cursor-pointer hover:bg-primary-500/30 transition-colors"
                    >
                      Choisir un logo
                    </label>
                    <p className="text-sm text-gray-400 mt-2">
                      Format JPG, PNG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Theme Colors */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Palette size={24} className="mr-2 text-primary-400" />
                  Couleurs du Thème
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1.5">
                      Couleur d'accent principale
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.couleur_gradient_1}
                        onChange={(e) => setFormData({ ...formData, couleur_gradient_1: e.target.value })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={formData.couleur_gradient_1}
                        onChange={(e) => setFormData({ ...formData, couleur_gradient_1: e.target.value })}
                        placeholder="#007FFF"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1.5">
                      Couleur d'accent secondaire
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.couleur_gradient_2}
                        onChange={(e) => setFormData({ ...formData, couleur_gradient_2: e.target.value })}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={formData.couleur_gradient_2}
                        onChange={(e) => setFormData({ ...formData, couleur_gradient_2: e.target.value })}
                        placeholder="#F72798"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-6 rounded-lg" style={{
                  background: `linear-gradient(135deg, ${formData.couleur_gradient_1}20, ${formData.couleur_gradient_2}20)`,
                  border: `1px solid ${formData.couleur_gradient_1}40`
                }}>
                  <h3 className="text-lg font-semibold mb-2">Aperçu du Thème</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button style={{
                      background: `linear-gradient(135deg, ${formData.couleur_gradient_1}, ${formData.couleur_gradient_2})`,
                    }}>
                      Bouton Principal
                    </Button>
                    <Button variant="outline" style={{
                      borderColor: formData.couleur_gradient_1,
                      color: formData.couleur_gradient_1
                    }}>
                      Bouton Secondaire
                    </Button>
                  </div>
                </div>
              </div>

              {/* Border Radius Control */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Style des Coins</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Anguleux</span>
                    <span className="text-sm text-gray-400">Arrondi</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={formData.global_border_radius}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData({ ...formData, global_border_radius: value });
                        // Apply immediately for live preview
                        document.documentElement.style.setProperty('--global-border-radius', `${value}px`);
                      }}
                      className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-mono w-12 text-center">
                      {formData.global_border_radius}px
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  glow
                >
                  Enregistrer la Personnalisation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};