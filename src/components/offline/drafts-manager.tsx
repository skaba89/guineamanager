/**
 * GuinéaManager - Offline Drafts Manager
 * Gestion des brouillons sauvegardés localement
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Save,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOffline, type OfflineDataType } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Draft {
  localId: string;
  data: Record<string, unknown>;
  createdAt: number;
}

interface DraftsManagerProps {
  type: OfflineDataType;
  title: string;
  onLoadDraft: (data: Record<string, unknown>) => void;
  className?: string;
}

export function DraftsManager({ 
  type, 
  title, 
  onLoadDraft,
  className 
}: DraftsManagerProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { getDrafts, deleteDraft } = useOffline();

  // Charger les brouillons
  useEffect(() => {
    const loadDrafts = async () => {
      const loadedDrafts = await getDrafts<Record<string, unknown>>(type);
      setDrafts(loadedDrafts.sort((a, b) => b.createdAt - a.createdAt));
    };
    loadDrafts();
  }, [getDrafts, type]);

  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft.data);
    // Optionnel: supprimer le brouillon après chargement
    // await deleteDraft(draft.localId);
  };

  const handleDeleteDraft = async (localId: string) => {
    await deleteDraft(localId);
    setDrafts(drafts.filter(d => d.localId !== localId));
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  {title}
                </CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {drafts.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              {drafts.map((draft) => (
                <DraftItem
                  key={draft.localId}
                  draft={draft}
                  onLoad={() => handleLoadDraft(draft)}
                  onDelete={() => handleDeleteDraft(draft.localId)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface DraftItemProps {
  draft: Draft;
  onLoad: () => void;
  onDelete: () => void;
}

function DraftItem({ draft, onLoad, onDelete }: DraftItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Extraire un résumé des données
  const getSummary = (data: Record<string, unknown>): string => {
    if (data.clientName) return `Client: ${data.clientName}`;
    if (data.reference) return `Réf: ${data.reference}`;
    if (data.name) return data.name as string;
    return 'Brouillon sans titre';
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {getSummary(draft.data)}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(draft.createdAt, { 
              addSuffix: true, 
              locale: fr 
            })}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={onLoad}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Charger
        </Button>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le brouillon ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le brouillon sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Bouton de sauvegarde de brouillon
interface SaveDraftButtonProps {
  type: OfflineDataType;
  data: Record<string, unknown>;
  onSave?: () => void;
  className?: string;
}

export function SaveDraftButton({ 
  type, 
  data, 
  onSave,
  className 
}: SaveDraftButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { saveDraft } = useOffline();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveDraft(type, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave?.();
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={isSaving}
      className={className}
    >
      {isSaving ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : saved ? (
        <Save className="h-4 w-4 mr-2 text-green-500" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {saved ? 'Sauvegardé !' : 'Sauvegarder brouillon'}
    </Button>
  );
}
