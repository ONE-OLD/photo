import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast, useTheme } from '../context/AppContext';
import { database, type Gallery, type Client, type Activity, type Album, type Photo } from '../services/database';
import { Button, Input, Textarea, Select, Card, Badge, StatCard, PageHeader, SearchInput, Modal, ConfirmDialog, EmptyState, Spinner } from '../components/UI';
import { Image, Users, Heart, FolderOpen, Plus, Edit, Trash2, Eye, EyeOff, Copy, ExternalLink, Share2, MoreVertical, Calendar, Clock, Archive, LayoutGrid, List, Lock, Shield, Camera } from 'lucide-react';

// DASHBOARD OVERVIEW
export function DashboardOverview() {
  const [stats, setStats] = useState({ totalGalleries: 0, publishedGalleries: 0, totalClients: 0, totalPhotos: 0, totalAlbums: 0, totalFavorites: 0 });
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, g, a] = await Promise.all([database.getStats(), database.getGalleries(), database.getActivity()]);
      setStats(s);
      setGalleries((g as Gallery[]).sort((x: Gallery, y: Gallery) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()).slice(0, 5));
      setActivity(a as Activity[]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Welcome back! Here's an overview of your platform." />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Galleries" value={stats.totalGalleries} icon={<Image size={20} />} />
        <StatCard title="Published" value={stats.publishedGalleries} icon={<Eye size={20} />} />
        <StatCard title="Clients" value={stats.totalClients} icon={<Users size={20} />} />
        <StatCard title="Photos" value={stats.totalPhotos} icon={<FolderOpen size={20} />} />
      </div>

      {/* Quick Actions */}
      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Plus size={14} className="mr-1.5" /> New Gallery
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Users size={14} className="mr-1.5" /> Add Client
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <FolderOpen size={14} className="mr-1.5" /> Create Album
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Image size={14} className="mr-1.5" /> Upload Photos
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Galleries</h3>
          {galleries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No galleries yet. Create your first gallery!</p>
          ) : (
            <div className="space-y-3">
              {galleries.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    <Image size={16} className="text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{g.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(g.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={g.status === 'published' ? 'success' : g.status === 'archived' ? 'warning' : 'default'}>
                    {g.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{a.message}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// GALLERIES PAGE
export function GalleriesPage({ onEditGallery }: { onEditGallery: (id: string) => void }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addToast } = useToast();

  const loadGalleries = useCallback(async () => {
    const g = await database.getGalleries();
    setGalleries((g as Gallery[]).sort((a: Gallery, b: Gallery) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }, []);

  // Open the gallery editor when an "edit" action is requested from the list
  useEffect(() => {
    if (editingGallery) {
      onEditGallery(editingGallery.id);
      setEditingGallery(null);
    }
  }, [editingGallery, onEditGallery]);

  const filtered = galleries.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) || (g.clientName || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || g.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async (id: string) => {
    await database.deleteGallery(id);
    addToast('Gallery deleted', 'success');
    loadGalleries();
  };

  const handleDuplicate = async (gallery: Gallery) => {
    const { id, createdAt, updatedAt, ...rest } = gallery;
    await database.createGallery({ ...rest, title: `${gallery.title} (Copy)`, status: 'draft' });
    addToast('Gallery duplicated', 'success');
    loadGalleries();
  };

  const handleTogglePublish = async (gallery: Gallery) => {
    const newStatus = gallery.status === 'published' ? 'draft' : 'published';
    await database.updateGallery(gallery.id, { status: newStatus });
    addToast(`Gallery ${newStatus === 'published' ? 'published' : 'unpublished'}`, 'success');
    loadGalleries();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Galleries" 
        description="Manage your photography galleries"
        action={<Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />New Gallery</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search galleries..." /></div>
        <Select value={filter} onChange={e => setFilter(e.target.value)} options={[
          { value: 'all', label: 'All Status' },
          { value: 'published', label: 'Published' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ]} />
        <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--bg-card)] shadow-sm' : ''}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm' : ''}`}><List size={16} /></button>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={<Image size={48} />} title="No galleries yet" description="Create your first gallery to start delivering photos to clients." action={<Button onClick={() => setShowCreate(true)}>Create Gallery</Button>} />
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => (
            <Card key={g.id} className="overflow-hidden group">
              <div className="aspect-video bg-[var(--bg-tertiary)] relative overflow-hidden">
                {g.coverImage ? (
                  <img src={g.coverImage} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image size={32} className="text-[var(--text-muted)]" /></div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={g.status === 'published' ? 'success' : g.status === 'archived' ? 'warning' : 'default'}>{g.status}</Badge>
                </div>
                {g.passwordProtected && (
                  <div className="absolute top-2 left-2"><div className="p-1 rounded bg-black/50"><Lock size={12} className="text-white" /></div></div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[var(--text-primary)] truncate">{g.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{g.clientName || 'No client'} • {new Date(g.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-1 mt-3">
                  <button onClick={() => onEditGallery(g.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]" title="Edit"><Edit size={14} /></button>
                  <button onClick={() => handleTogglePublish(g)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]" title={g.status === 'published' ? 'Unpublish' : 'Publish'}>
                    {g.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => handleDuplicate(g)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]" title="Duplicate"><Copy size={14} /></button>
                  <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-red-500 ml-auto" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--border-color)]">
            {filtered.map(g => (
              <div key={g.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)]">
                <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden">
                  {g.coverImage ? <img src={g.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={16} className="text-[var(--text-muted)]" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{g.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{g.clientName || 'No client'} • {new Date(g.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={g.status === 'published' ? 'success' : g.status === 'archived' ? 'warning' : 'default'}>{g.status}</Badge>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEditGallery(g.id)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><Edit size={14} /></button>
                  <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Gallery Modal */}
      <CreateEditGalleryModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); loadGalleries(); }} />
      
      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Delete Gallery" message="Are you sure you want to delete this gallery? This action cannot be undone." confirmText="Delete" danger />
    </div>
  );
}

// Create/Edit Gallery Modal
function CreateEditGalleryModal({ isOpen, onClose, onSaved, gallery }: { isOpen: boolean; onClose: () => void; onSaved: () => void; gallery?: Gallery }) {
  const [title, setTitle] = useState(gallery?.title || '');
  const [description, setDescription] = useState(gallery?.description || '');
  const [clientName, setClientName] = useState(gallery?.clientName || '');
  const [clientEmail, setClientEmail] = useState(gallery?.clientEmail || '');
  const [visibility, setVisibility] = useState(gallery?.visibility || 'private');
  const [passwordProtected, setPasswordProtected] = useState(gallery?.passwordProtected || false);
  const [password, setPassword] = useState(gallery?.password || '');
  const [allowDownloads, setAllowDownloads] = useState(gallery?.allowDownloads ?? true);
  const [allowFavorites, setAllowFavorites] = useState(gallery?.allowFavorites ?? true);
  const [allowComments, setAllowComments] = useState(gallery?.allowComments ?? true);
  const [eventDate, setEventDate] = useState(gallery?.eventDate || '');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (gallery) {
      setTitle(gallery.title);
      setDescription(gallery.description || '');
      setClientName(gallery.clientName || '');
      setClientEmail(gallery.clientEmail || '');
      setVisibility(gallery.visibility);
      setPasswordProtected(gallery.passwordProtected);
      setPassword(gallery.password || '');
      setAllowDownloads(gallery.allowDownloads);
      setAllowFavorites(gallery.allowFavorites);
      setAllowComments(gallery.allowComments);
      setEventDate(gallery.eventDate || '');
    }
  }, [gallery]);

  const handleSave = async () => {
    if (!title.trim()) { addToast('Title is required', 'error'); return; }
    setLoading(true);
    try {
      if (gallery) {
        await database.updateGallery(gallery.id, { title, description, clientName, clientEmail, visibility, passwordProtected, password, allowDownloads, allowFavorites, allowComments, eventDate });
        addToast('Gallery updated', 'success');
      } else {
        await database.createGallery({ title, description, clientName, clientEmail, visibility, passwordProtected, password, allowDownloads, allowFavorites, allowComments, eventDate, status: 'draft', coverImage: '' });
        addToast('Gallery created', 'success');
      }
      onSaved();
    } catch {
      addToast('Failed to save gallery', 'error');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={gallery ? 'Edit Gallery' : 'Create Gallery'} size="lg">
      <div className="space-y-4">
        <Input label="Gallery Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., John & Sarah Wedding" required />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this gallery..." rows={3} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name" />
          <Input label="Client Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" type="email" />
        </div>
        <Input label="Event Date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        
        <div className="border-t border-[var(--border-color)] pt-4">
          <h4 className="font-medium text-sm text-[var(--text-primary)] mb-3">Privacy & Access</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Visibility" value={visibility} onChange={e => setVisibility(e.target.value as any)} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]} />
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] pt-6">
                <input type="checkbox" checked={passwordProtected} onChange={e => setPasswordProtected(e.target.checked)} className="rounded" />
                Password Protected
              </label>
              {passwordProtected && <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Gallery password" />}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-4">
          <h4 className="font-medium text-sm text-[var(--text-primary)] mb-3">Client Options</h4>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={allowDownloads} onChange={e => setAllowDownloads(e.target.checked)} className="rounded" /> Allow Downloads
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={allowFavorites} onChange={e => setAllowFavorites(e.target.checked)} className="rounded" /> Allow Favorites
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={allowComments} onChange={e => setAllowComments(e.target.checked)} className="rounded" /> Allow Comments
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>{gallery ? 'Update' : 'Create'} Gallery</Button>
        </div>
      </div>
    </Modal>
  );
}

// CLIENTS PAGE
export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadClients = useCallback(async () => {
    const c = await database.getClients();
    setClients((c as Client[]).sort((a: Client, b: Client) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    await database.deleteClient(id);
    addToast('Client deleted', 'success');
    loadClients();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Clients" description="Manage your photography clients" action={<Button onClick={() => { setEditingClient(null); setShowCreate(true); }}><Plus size={16} className="mr-2" />Add Client</Button>} />

      <div className="mb-6"><SearchInput value={search} onChange={setSearch} placeholder="Search clients..." /></div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No clients yet" description="Add your first client to start managing galleries." action={<Button onClick={() => setShowCreate(true)}>Add Client</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">{c.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{c.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingClient(c); setShowCreate(true); }} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"><Edit size={14} /></button>
                  <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              {c.phone && <p className="text-xs text-[var(--text-muted)] mt-3">📱 {c.phone}</p>}
              {c.notes && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{c.notes}</p>}
              <p className="text-xs text-[var(--text-muted)] mt-2">Added {new Date(c.createdAt).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}

      <CreateEditClientModal isOpen={showCreate} onClose={() => setShowCreate(false)} client={editingClient} onSaved={() => { setShowCreate(false); loadClients(); }} />
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Delete Client" message="Are you sure? This will not delete associated galleries." confirmText="Delete" danger />
    </div>
  );
}

function CreateEditClientModal({ isOpen, onClose, client, onSaved }: { isOpen: boolean; onClose: () => void; client: Client | null; onSaved: () => void }) {
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [notes, setNotes] = useState(client?.notes || '');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (client) { setName(client.name); setEmail(client.email); setPhone(client.phone || ''); setNotes(client.notes || ''); }
    else { setName(''); setEmail(''); setPhone(''); setNotes(''); }
  }, [client, isOpen]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { addToast('Name and email are required', 'error'); return; }
    setLoading(true);
    try {
      if (client) {
        await database.updateClient(client.id, { name, email, phone, notes });
        addToast('Client updated', 'success');
      } else {
        await database.createClient({ name, email, phone, notes });
        addToast('Client added', 'success');
      }
      onSaved();
    } catch {
      addToast('Failed to save client', 'error');
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Edit Client' : 'Add Client'}>
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Client name" required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" required />
        <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
        <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this client..." rows={3} />
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={loading}>{client ? 'Update' : 'Add'} Client</Button>
        </div>
      </div>
    </Modal>
  );
}

// ALBUMS PAGE
export function AlbumsPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string>('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    database.getGalleries().then(g => {
      const gArr = g as Gallery[];
      setGalleries(gArr);
      if (gArr.length > 0 && !selectedGallery) setSelectedGallery(gArr[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      setLoading(true);
      database.getAlbumsByGallery(selectedGallery).then(a => { setAlbums(a as Album[]); setLoading(false); });
    }
  }, [selectedGallery]);

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    await database.createAlbum({ galleryId: selectedGallery, title: newAlbumTitle, order: albums.length, coverImage: '' });
    addToast('Album created', 'success');
    setNewAlbumTitle('');
    setShowCreate(false);
    const a = await database.getAlbumsByGallery(selectedGallery);
    setAlbums(a as Album[]);
  };

  const handleDeleteAlbum = async (id: string) => {
    await database.deleteAlbum(id);
    addToast('Album deleted', 'success');
    const a = await database.getAlbumsByGallery(selectedGallery);
    setAlbums(a as Album[]);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Albums" description="Organize photos into albums within galleries" action={<Button onClick={() => setShowCreate(true)} disabled={!selectedGallery}><Plus size={16} className="mr-2" />New Album</Button>} />

      <div className="mb-6">
        <Select label="Select Gallery" value={selectedGallery} onChange={e => setSelectedGallery(e.target.value)} options={[
          { value: '', label: 'Choose a gallery...' },
          ...galleries.map(g => ({ value: g.id, label: g.title }))
        ]} />
      </div>

      {loading ? <Spinner /> : albums.length === 0 ? (
        <EmptyState icon={<FolderOpen size={48} />} title="No albums yet" description="Create albums to organize photos in this gallery." action={selectedGallery ? <Button onClick={() => setShowCreate(true)}>Create Album</Button> : undefined} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map(album => (
            <Card key={album.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <FolderOpen size={18} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">{album.title}</h3>
                    <p className="text-xs text-[var(--text-muted)]">Order: {album.order}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteAlbum(album.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-red-500"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Album" size="sm">
        <div className="space-y-4">
          <Input label="Album Title" value={newAlbumTitle} onChange={e => setNewAlbumTitle(e.target.value)} placeholder="e.g., Ceremony Photos" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateAlbum}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// FAVORITES PAGE
export function FavoritesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string>('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    database.getGalleries().then(g => {
      const gArr = g as Gallery[];
      setGalleries(gArr);
      if (gArr.length > 0) setSelectedGallery(gArr[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      setLoading(true);
      database.getFavorites(selectedGallery).then(f => { setFavorites(f as any[]); setLoading(false); });
    }
  }, [selectedGallery]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Favorites" description="View client favorite photos" />
      <div className="mb-6">
        <Select label="Gallery" value={selectedGallery} onChange={e => setSelectedGallery(e.target.value)} options={[
          { value: '', label: 'Choose a gallery...' },
          ...galleries.map(g => ({ value: g.id, label: g.title }))
        ]} />
      </div>
      {loading ? <Spinner /> : favorites.length === 0 ? (
        <EmptyState icon={<Heart size={48} />} title="No favorites yet" description="Client favorites will appear here when they mark photos." />
      ) : (
        <div className="space-y-2">
          {favorites.map((f, i) => (
            <Card key={i} className="p-3 flex items-center gap-3">
              <Heart size={16} className="text-red-500" />
              <span className="text-sm text-[var(--text-primary)]">Photo: {f.photoId}</span>
              <span className="text-xs text-[var(--text-muted)] ml-auto">by {f.clientEmail}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ACTIVITY PAGE
export function ActivityPage() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    database.getActivity(50).then(a => { setActivity(a as Activity[]); setLoading(false); });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Activity" description="Recent platform activity" />
      {loading ? <Spinner /> : activity.length === 0 ? (
        <EmptyState icon={<Clock size={48} />} title="No activity yet" description="Activity will be logged as you use the platform." />
      ) : (
        <Card className="divide-y divide-[var(--border-color)]">
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">{a.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <Badge>{a.type}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// SETTINGS PAGE
export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(profile?.name || '');
  const [studioName, setStudioName] = useState(profile?.studioName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [instagram, setInstagram] = useState(profile?.instagram || '');
  const [facebook, setFacebook] = useState(profile?.facebook || '');
  const [brandColor, setBrandColor] = useState(profile?.brandColor || '#5c7cfa');
  const [loading, setLoading] = useState(false);

  // Site settings
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [siteLoading, setSiteLoading] = useState(false);

  useEffect(() => {
    database.getSettings().then(s => {
      if (s) {
        setHeroTitle(s.heroTitle || '');
        setHeroSubtitle(s.heroSubtitle || '');
        setAboutText(s.aboutText || '');
      }
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await database.updateUserProfile(profile.uid, { name, studioName, email, phone, website, bio, location, instagram, facebook, brandColor });
      await refreshProfile();
      addToast('Profile saved', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    }
    setLoading(false);
  };

  const handleSaveSite = async () => {
    setSiteLoading(true);
    try {
      await database.updateSettings({ heroTitle, heroSubtitle, aboutText });
      addToast('Website settings saved', 'success');
    } catch {
      addToast('Failed to save website settings', 'error');
    }
    setSiteLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'branding', label: 'Branding' },
    { id: 'website', label: 'Portfolio' },
    { id: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="Manage your profile, branding, and platform settings" />
      
      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="p-6 max-w-2xl">
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {(name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{name || 'Photographer'}</h3>
                <p className="text-sm text-[var(--text-muted)]">{studioName || 'Studio'}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
              <Input label="Studio Name" value={studioName} onChange={e => setStudioName(e.target.value)} />
              <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" />
              <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input label="Website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
              <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} />
              <Input label="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
              <Input label="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Page URL" />
            </div>
            <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell clients about yourself..." rows={4} />
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} loading={loading}>Save Profile</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Gallery Branding</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Customize how your galleries appear to clients.</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg border border-[var(--border-color)] cursor-pointer" />
                <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} placeholder="#5c7cfa" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <Camera size={14} className="text-white" />
                </div>
                <span className="font-semibold text-sm" style={{ color: brandColor }}>{studioName || 'Your Studio'}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} loading={loading}>Save Branding</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Website/Portfolio Tab */}
      {activeTab === 'website' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Portfolio Website</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Customize your public-facing portfolio website content.</p>
          <div className="space-y-5">
            <Input label="Hero Title" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="Your headline..." />
            <Input label="Hero Subtitle" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Brief description..." />
            <Textarea label="About Section" value={aboutText} onChange={e => setAboutText(e.target.value)} placeholder="Tell your story..." rows={4} />
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveSite} loading={siteLoading}>Save Website</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Integrations</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Connect external services to enhance your platform.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">C</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-[var(--text-primary)]">Cloudinary</p>
                  <p className="text-xs text-[var(--text-muted)]">Image storage & optimization</p>
                </div>
              </div>
              <Badge variant={import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME !== 'demo' ? 'success' : 'warning'}>
                {import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME !== 'demo' ? 'Connected' : 'Not configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">F</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-[var(--text-primary)]">Firebase</p>
                  <p className="text-xs text-[var(--text-muted)]">Authentication & Database</p>
                </div>
              </div>
              <Badge variant={import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key' ? 'success' : 'warning'}>
                {import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key' ? 'Connected' : 'Demo Mode'}
              </Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ADMIN PAGE
export function AdminPage() {
  const { isAdmin, profile } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    database.getStats().then(setStats);
  }, []);

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <EmptyState icon={<Shield size={48} />} title="Access Denied" description="You need admin privileges to access this page." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Admin Panel" description="Platform administration and system settings" />
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.totalClients || 0} icon={<Users size={20} />} />
        <StatCard title="Total Galleries" value={stats?.totalGalleries || 0} icon={<Image size={20} />} />
        <StatCard title="Total Photos" value={stats?.totalPhotos || 0} icon={<FolderOpen size={20} />} />
        <StatCard title="Total Favorites" value={stats?.totalFavorites || 0} icon={<Heart size={20} />} />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">System Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
            <span className="text-[var(--text-muted)]">Platform</span>
            <span className="text-[var(--text-primary)]">Lumina v1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
            <span className="text-[var(--text-muted)]">Admin Email</span>
            <span className="text-[var(--text-primary)]">{profile?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
            <span className="text-[var(--text-muted)]">Database</span>
            <span className="text-[var(--text-primary)]">Firebase Realtime Database</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
            <span className="text-[var(--text-muted)]">Media Storage</span>
            <span className="text-[var(--text-primary)]">Cloudinary</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[var(--text-muted)]">Mode</span>
            <Badge variant={import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key' ? 'success' : 'warning'}>
              {import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'demo-api-key' ? 'Production' : 'Demo'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

// GALLERY EDITOR PAGE
export function GalleryEditorPage({ galleryId, onBack }: { galleryId: string; onBack: () => void }) {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const { addToast } = useToast();

  useEffect(() => {
    const load = async () => {
      const g = await database.getGallery(galleryId);
      setGallery(g as Gallery);
      const a = await database.getAlbumsByGallery(galleryId);
      setAlbums(a as Album[]);
      const p = await database.getPhotosByGallery(galleryId);
      setPhotos(p as Photo[]);
      if ((a as Album[]).length > 0) setSelectedAlbum((a as Album[])[0].id);
      setLoading(false);
    };
    load();
  }, [galleryId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/gallery/${galleryId}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast('Gallery link copied!', 'success');
    }).catch(() => {
      addToast('Failed to copy link', 'error');
    });
  };

  const handleUploadPhotos = async (files: FileList) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset || cloudName === 'demo') {
      // Demo mode - simulate upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        await database.addPhoto({
          galleryId,
          albumId: selectedAlbum || albums[0]?.id || '',
          publicId: `demo_${Date.now()}_${i}`,
          secureUrl: url,
          thumbnailUrl: url,
          width: 1200,
          height: 800,
          format: file.type.split('/')[1] || 'jpg',
          bytes: file.size,
        });
      }
      addToast(`${files.length} photo(s) uploaded`, 'success');
      const p = await database.getPhotosByGallery(galleryId);
      setPhotos(p as Photo[]);
      return;
    }

    // Real Cloudinary upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        
        await database.addPhoto({
          galleryId,
          albumId: selectedAlbum || albums[0]?.id || '',
          publicId: data.public_id,
          secureUrl: data.secure_url,
          thumbnailUrl: data.eager?.[0]?.secure_url || `https://res.cloudinary.com/${cloudName}/image/upload/w_300,h_300,c_fill/${data.public_id}.${data.format}`,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
        });
      } catch (err) {
        addToast(`Failed to upload ${file.name}`, 'error');
      }
    }
    addToast(`${files.length} photo(s) uploaded`, 'success');
    const p = await database.getPhotosByGallery(galleryId);
    setPhotos(p as Photo[]);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await database.deletePhoto(photoId);
    addToast('Photo deleted', 'success');
    const p = await database.getPhotosByGallery(galleryId);
    setPhotos(p as Photo[]);
  };

  if (loading) return <Spinner />;
  if (!gallery) return <EmptyState title="Gallery not found" />;

  const albumPhotos = selectedAlbum ? photos.filter(p => p.albumId === selectedAlbum) : photos;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{gallery.title}</h1>
        <Badge variant={gallery.status === 'published' ? 'success' : 'default'}>{gallery.status}</Badge>
      </div>

      {/* Gallery Info */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
          {gallery.clientName && <span>👤 {gallery.clientName}</span>}
          {gallery.eventDate && <span>📅 {new Date(gallery.eventDate).toLocaleDateString()}</span>}
          <span>📷 {photos.length} photos</span>
          <span>📁 {albums.length} albums</span>
          {gallery.passwordProtected && <span>🔒 Password protected</span>}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setShowShare(true)}><Share2 size={14} className="mr-1" />Share Gallery</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowUpload(true)}><Plus size={14} className="mr-1" />Upload Photos</Button>
          <a href={`/gallery/${galleryId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm"><ExternalLink size={14} className="mr-1" />Preview</Button>
          </a>
        </div>
      </Card>

      {/* Albums */}
      {albums.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {albums.map(a => (
              <button key={a.id} onClick={() => setSelectedAlbum(a.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedAlbum === a.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                {a.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {albumPhotos.length === 0 ? (
        <EmptyState icon={<Image size={48} />} title="No photos" description="Upload photos to this gallery." action={<Button onClick={() => setShowUpload(true)}>Upload Photos</Button>} />
      ) : (
        <div className="gallery-grid">
          {albumPhotos.map(photo => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
              <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button onClick={() => handleDeletePhoto(photo.id)} className="p-2 rounded-full bg-red-500 text-white"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUpload={handleUploadPhotos} albums={albums} selectedAlbum={selectedAlbum} onSelectAlbum={setSelectedAlbum} />

      {/* Share Modal */}
      <ShareGalleryModal isOpen={showShare} onClose={() => setShowShare(false)} gallery={gallery} />
    </div>
  );
}

// Share Gallery Modal
function ShareGalleryModal({ isOpen, onClose, gallery }: { isOpen: boolean; onClose: () => void; gallery: Gallery }) {
  const { addToast } = useToast();
  const galleryUrl = `${window.location.origin}/gallery/${gallery.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(galleryUrl)}&bgcolor=transparent`;

  const handleCopy = () => {
    navigator.clipboard.writeText(galleryUrl).then(() => {
      addToast('Link copied to clipboard!', 'success');
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: gallery.title, text: gallery.description || `View ${gallery.title}`, url: galleryUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Gallery" size="sm">
      <div className="text-center space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
            <Image size={18} className="text-[var(--accent)]" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{gallery.title}</p>
            <p className="text-xs text-[var(--text-muted)]">{gallery.status === 'published' ? 'Published' : 'Draft'} • {gallery.passwordProtected ? '🔒 Password protected' : 'Public'}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl">
            <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
          </div>
        </div>

        {/* URL */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)] truncate font-mono">
            {galleryUrl}
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}><Copy size={14} /></Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleShare}><Share2 size={14} className="mr-2" />Share</Button>
          <a href={galleryUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full"><ExternalLink size={14} className="mr-2" />Open</Button>
          </a>
        </div>

        {gallery.passwordProtected && gallery.password && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-xs text-yellow-700 dark:text-yellow-400">
            🔒 Password: <strong>{gallery.password}</strong>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Upload Modal
function UploadModal({ isOpen, onClose, onUpload, albums, selectedAlbum, onSelectAlbum }: {
  isOpen: boolean; onClose: () => void; onUpload: (files: FileList) => void; albums: Album[]; selectedAlbum: string; onSelectAlbum: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) setFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    await onUpload(files);
    setUploading(false);
    setFiles(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Photos" size="lg">
      <div className="space-y-4">
        {albums.length > 0 && (
          <Select label="Upload to Album" value={selectedAlbum} onChange={e => onSelectAlbum(e.target.value)} options={albums.map(a => ({ value: a.id, label: a.title }))} />
        )}
        
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-color)]'}`}
        >
          <Image size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-2">Drag & drop photos here</p>
          <p className="text-xs text-[var(--text-muted)] mb-3">or</p>
          <label className="inline-block cursor-pointer">
            <span className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">Choose Photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && setFiles(e.target.files)} />
          </label>
        </div>

        {files && files.length > 0 && (
          <div className="text-sm text-[var(--text-secondary)]">
            {files.length} photo(s) selected ({(Array.from(files).reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB)
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} loading={uploading} disabled={!files || files.length === 0}>Upload</Button>
        </div>
      </div>
    </Modal>
  );
}
