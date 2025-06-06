import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, Mail, Eye, AlertCircle, Users, X, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Team } from '../../types/auth.types';

interface IntermittentProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  specialite: string | null;
  teams?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    name: string;
    color: string;
    description: string;
    memberIds: string[];
  }) => Promise<void>;
  intermittents: IntermittentProfile[];
  editingTeam?: {
    id: string;
    name: string;
    color: string;
    description: string | null;
    memberIds: string[];
  };
}

const TEAM_COLORS = [
  { hex: '#007FFF', name: 'Bleu' },
  { hex: '#F72798', name: 'Rose' },
  { hex: '#66BB6A', name: 'Vert' },
  { hex: '#FFB800', name: 'Jaune' },
  { hex: '#9C27B0', name: 'Violet' },
  { hex: '#FF6B57', name: 'Orange' },
  { hex: '#00BCD4', name: 'Cyan' },
];

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  intermittents,
  editingTeam
}) => {
  const [teamName, setTeamName] = useState(editingTeam?.name || '');
  const [selectedColor, setSelectedColor] = useState(editingTeam?.color || TEAM_COLORS[0].hex);
  const [description, setDescription] = useState(editingTeam?.description || '');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(editingTeam?.memberIds || []));
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredIntermittents = intermittents.filter(intermittent => {
    const searchLower = searchTerm.toLowerCase();
    return (
      intermittent.nom.toLowerCase().includes(searchLower) ||
      intermittent.prenom.toLowerCase().includes(searchLower) ||
      (intermittent.specialite?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Le nom de l\'équipe est requis');
      return;
    }
    if (selectedMembers.size === 0) {
      toast.error('Sélectionnez au moins un membre');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: editingTeam?.id,
        name: teamName,
        color: selectedColor,
        description,
        memberIds: Array.from(selectedMembers)
      });
      setTeamName('');
      setSelectedColor(TEAM_COLORS[0].hex);
      setDescription('');
      setSelectedMembers(new Set());
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-dark-800 rounded-xl shadow-xl z-50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {editingTeam ? `Modifier l'Équipe : ${editingTeam.name}` : 'Créer une Nouvelle Équipe'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom de l'équipe"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ex: Équipe Technique Principale"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Couleur de l'équipe
            </label>
            <div className="flex flex-wrap gap-3">
              {TEAM_COLORS.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setSelectedColor(color.hex)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color.hex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle de l'équipe..."
              className="w-full h-24 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-200">
              Membres de l'équipe
            </label>
            
            <Input
              placeholder="Rechercher un intermittent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
            />

            <div className="max-h-64 overflow-y-auto space-y-2 bg-dark-900 rounded-lg p-2">
              {filteredIntermittents.map((intermittent) => (
                <label
                  key={intermittent.id}
                  className="flex items-center p-3 hover:bg-dark-700 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(intermittent.id)}
                    onChange={() => toggleMember(intermittent.id)}
                    className="mr-3 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium">
                      {intermittent.prenom} {intermittent.nom}
                    </span>
                    {intermittent.specialite && (
                      <span className="ml-2 text-sm text-primary-400">
                        ({intermittent.specialite})
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-dark-700">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!teamName.trim() || selectedMembers.size === 0 || isSubmitting}
            >
              {editingTeam ? 'Mettre à jour' : 'Créer l\'équipe'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export const IntermittentManagement: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [intermittents, setIntermittents] = useState<IntermittentProfile[]>([]);
  const [teams, setTeams] = useState<(Team & { memberIds?: string[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'intermittents' | 'teams'>('intermittents');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{
    id: string;
    name: string;
    color: string;
    description: string | null;
    memberIds: string[];
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [managingIntermittent, setManagingIntermittent] = useState<IntermittentProfile | null>(null);
  const [isUpdatingTeams, setIsUpdatingTeams] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchIntermittents(),
        fetchTeams()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  const fetchIntermittents = async () => {
    try {
      // First get all intermittents
      const { data, error } = await supabase
        .from('intermittent_profiles')
        .select('*')
        .order('nom');

      if (error) throw error;
      
      // Then get team memberships for each intermittent
      const intermittentsWithTeams = await Promise.all(
        (data || []).map(async (intermittent) => {
          const { data: teamMembers, error: teamError } = await supabase
            .from('team_members')
            .select(`
              team:teams (
                id,
                name,
                color
              )
            `)
            .eq('intermittent_profile_id', intermittent.id);

          if (teamError) throw teamError;

          return {
            ...intermittent,
            teams: teamMembers?.map(tm => tm.team) || []
          };
        })
      );

      setIntermittents(intermittentsWithTeams);
    } catch (error) {
      console.error('Error fetching intermittents:', error);
      toast.error('Erreur lors du chargement des intermittents');
    }
  };

  const fetchTeams = async () => {
    try {
      // First get all teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          color,
          description
        `);

      if (teamsError) throw teamsError;

      // Then get member counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('intermittent_profile_id')
            .eq('team_id', team.id);

          if (membersError) throw membersError;

          return {
            ...team,
            member_count: members?.length || 0,
            memberIds: members?.map(m => m.intermittent_profile_id)
          };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    }
  };

  const handleTeamSubmit = async ({
    id,
    name,
    color,
    description,
    memberIds
  }: {
    id?: string;
    name: string;
    color: string;
    description: string;
    memberIds: string[];
  }) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      let teamId = id;

      if (id) {
        // Update existing team
        const { error: updateError } = await supabase
          .from('teams')
          .update({ name, color, description })
          .eq('id', id);

        if (updateError) throw updateError;

        // Delete existing members
        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', id);

        if (deleteError) throw deleteError;
      } else {
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            name,
            color,
            description,
            regisseur_id: user.id
          })
          .select()
          .single();

        if (teamError) throw teamError;
        teamId = newTeam.id;
      }

      if (!teamId) throw new Error('Team ID not found');

      // Add team members
      const teamMembers = memberIds.map(intermittentId => ({
        team_id: teamId,
        intermittent_profile_id: intermittentId
      }));

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(teamMembers);

      if (membersError) throw membersError;

      toast.success(id ? 'Équipe mise à jour avec succès !' : 'Équipe créée avec succès !');
      await fetchTeams();
      setEditingTeam(null);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(id ? 'Erreur lors de la mise à jour de l\'équipe' : 'Erreur lors de la création de l\'équipe');
      throw error;
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!event) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast.success('Équipe supprimée avec succès !');
      await fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Erreur lors de la suppression de l\'équipe');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(null);
    }
  };

  const handleTeamAssignments = async (intermittentId: string, selectedTeamIds: string[]) => {
    setIsUpdatingTeams(true);
    try {
      // Delete existing team memberships
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('intermittent_profile_id', intermittentId);

      if (deleteError) throw deleteError;

      // Insert new team memberships
      if (selectedTeamIds.length > 0) {
        const teamMembers = selectedTeamIds.map(teamId => ({
          team_id: teamId,
          intermittent_profile_id: intermittentId
        }));

        const { error: insertError } = await supabase
          .from('team_members')
          .insert(teamMembers);

        if (insertError) throw insertError;
      }

      toast.success('Équipes mises à jour avec succès !');
      await fetchIntermittents();
      setManagingIntermittent(null);
    } catch (error) {
      console.error('Error updating team assignments:', error);
      toast.error('Erreur lors de la mise à jour des équipes');
    } finally {
      setIsUpdatingTeams(false);
    }
  };

  const isMedicalVisitExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const visitDate = new Date(date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return visitDate <= threeMonthsFromNow;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Intermittents</h1>
          <div className="flex mt-4 space-x-4">
            <button
              onClick={() => setActiveTab('intermittents')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'intermittents'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'hover:bg-dark-800/50'
              }`}
            >
              Intermittents
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'teams'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'hover:bg-dark-800/50'
              }`}
            >
              Équipes
            </button>
          </div>
        </div>
        <div className="space-x-4">
          {activeTab === 'teams' ? (
            <Button
              onClick={() => setShowCreateTeamModal(true)}
              leftIcon={<Plus size={20} />}
              glow
            >
              Créer une Équipe
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/dashboard/intermittents/create')}
              leftIcon={<Plus size={20} />}
              glow
            >
              Créer un Profil Intermittent
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card
              key={team.id}
              glass 
              glow
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              {/* Color Bar */}
              <div 
                className="absolute top-0 left-0 w-full h-1.5 opacity-80"
                style={{ backgroundColor: team.color }}
              />
              
              {/* Background Gradient */}
              <div 
                className="absolute inset-0 opacity-5"
                style={{ 
                  background: `linear-gradient(135deg, ${team.color}, transparent)` 
                }}
              />
              
              <div className="relative p-6">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: team.color }}
                      />
                      <h3 className="text-xl font-semibold">{team.name}</h3>
                    </div>
                    <div 
                      className="flex items-center px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: `${team.color}15`,
                        color: team.color
                      }}
                    >
                      <Users size={14} className="mr-1.5" />
                      {team.member_count} membre{team.member_count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {team.description && (
                  <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTeam({
                        id: team.id,
                        name: team.name,
                        color: team.color,
                        description: team.description || '',
                        memberIds: team.memberIds || []
                      });
                    }}
                    leftIcon={<Pencil size={18} />}
                    >
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(team.id);
                    }}
                    leftIcon={<Trash2 size={18} className="text-error-500" />}
                    className="text-error-500 hover:bg-error-500/10"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-dark-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                Aucune équipe créée
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intermittents.map((intermittent) => (
            <motion.div
              key={intermittent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => {
                // Prevent click from bubbling if clicking the "Voir le profil" button
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                navigate(`/dashboard/intermittents/profile/${intermittent.id}`);
              }}
            >
              {/* Static Team Color Indicators */}
              {intermittent.teams && intermittent.teams.length > 0 && (
                <div 
                  className="absolute -top-[2px] left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none"
                  style={{
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'
                  }}
                >
                  {intermittent.teams.slice(0, 3).map(team => (
                    <div
                      key={team.id}
                      className="h-[3px] rounded-full"
                      style={{
                        width: intermittent.teams!.length > 2 ? '24px' : '32px',
                        backgroundColor: team.color,
                        boxShadow: `0 0 6px ${team.color}, inset 0 0 1px ${team.color}`,
                      }}
                    />
                  ))}
                  {intermittent.teams.length > 3 && (
                    <div className="h-[3px] w-4 rounded-full bg-white/20" />
                  )}
                </div>
              )}

              <Card 
                glass 
                className={`relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 ${
                  intermittent.teams?.length ? 'mt-[2px]' : ''
                }`}
                style={{
                  ...(intermittent.teams && intermittent.teams.length > 0 && {
                    borderTop: intermittent.teams.length > 1
                      ? `1px solid ${intermittent.teams[0].color}20`
                      : 'none',
                  }),
                }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {intermittent.prenom} {intermittent.nom}
                      </h3>
                      {intermittent.specialite && (
                        <p className="text-sm text-primary-400 mt-1">
                          {intermittent.specialite}
                        </p>
                      )}
                    </div>
                    {isMedicalVisitExpiringSoon(intermittent.date_visite_medicale) && (
                      <div className="tooltip-container">
                        <AlertCircle 
                          size={20} 
                          className="text-warning-500"
                        />
                        <div className="tooltip">
                          Visite médicale à renouveler prochainement
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Team Badges */}
                  {intermittent.teams && intermittent.teams.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                      {intermittent.teams.map(team => (
                        <div
                          key={team.id}
                          className="flex items-center px-3 py-1.5 rounded-full backdrop-blur-[8px] border transition-colors"
                          style={{
                            backgroundColor: `${team.color}20`,
                            borderColor: `${team.color}40`,
                            boxShadow: `0 0 12px ${team.color}10`,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-xs font-heading text-white/90">
                            {team.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={16} className="mr-2" />
                      {intermittent.email}
                    </div>
                    {intermittent.telephone && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Phone size={16} className="mr-2" />
                        {intermittent.telephone}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingIntermittent(intermittent);
                      }}
                      className="p-2 rounded-lg bg-dark-900/50 backdrop-blur-[8px] border border-white/10 hover:bg-dark-800/70 hover:border-primary-500/30 transition-all duration-300 group"
                    >
                      <Users size={18} className="text-gray-400 group-hover:text-primary-400 transition-colors" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/intermittents/profile/${intermittent.id}`);
                      }}
                      className="p-2 rounded-lg bg-dark-900/50 backdrop-blur-[8px] border border-white/10 hover:bg-dark-800/70 hover:border-primary-500/30 transition-all duration-300 group"
                    >
                      <Eye size={18} className="text-gray-400 group-hover:text-primary-400 transition-colors" />
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {intermittents.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-dark-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun intermittent enregistré
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreateTeamModal && (
          <CreateTeamModal
            isOpen={true}
            onClose={() => setShowCreateTeamModal(false)}
            onSubmit={handleTeamSubmit}
            intermittents={intermittents}
          />
        )}
        {editingTeam && (
          <CreateTeamModal
            isOpen={true}
            onClose={() => setEditingTeam(null)}
            onSubmit={handleTeamSubmit}
            intermittents={intermittents}
            editingTeam={editingTeam}
          />
        )}
        {showDeleteModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => !isDeleting && setShowDeleteModal(null)}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-dark-800 rounded-xl shadow-xl z-50 p-6">
              <h3 className="text-xl font-semibold mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible et supprimera tous les membres de l'équipe.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => !isDeleting && setShowDeleteModal(null)}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleDelete(showDeleteModal)}
                  isLoading={isDeleting}
                  className="bg-error-600 hover:bg-error-700"
                >
                  Oui, supprimer
                </Button>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Team Management Modal */}
      <AnimatePresence>
        {managingIntermittent && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => !isUpdatingTeams && setManagingIntermittent(null)}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-dark-800 rounded-xl shadow-xl z-50 p-6">
              <h3 className="text-xl font-semibold mb-2">
                Gérer les équipes de {managingIntermittent.prenom} {managingIntermittent.nom}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Sélectionnez les équipes auxquelles cet intermittent appartient
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teams.map(team => (
                  <label
                    key={team.id}
                    className="flex items-center p-3 bg-dark-900 hover:bg-dark-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={managingIntermittent.teams?.some(t => t.id === team.id)}
                      onChange={(e) => {
                        const currentTeams = managingIntermittent.teams || [];
                        const updatedTeamIds = e.target.checked
                          ? [...currentTeams.map(t => t.id), team.id]
                          : currentTeams.map(t => t.id).filter(id => id !== team.id);
                        handleTeamAssignments(managingIntermittent.id, updatedTeamIds);
                      }}
                      className="mr-3 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: team.color }}
                      />
                      <span>{team.name}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-dark-700">
                <Button
                  variant="ghost"
                  onClick={() => !isUpdatingTeams && setManagingIntermittent(null)}
                  disabled={isUpdatingTeams}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}