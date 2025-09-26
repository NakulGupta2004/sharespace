import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Calendar,
  CheckSquare,
  Package,
  MessageSquare,
  User,
  Settings,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';

// TypeScript interfaces
interface Team {
  _id: string;
  name: string;
  description: string;
  members: number;
  role: string;
  avatar?: string;
  color?: string;
  dp_url?: string;
  admins?: string[];
}

interface Resource {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  status: string;
  owner?: { _id: string; name: string };
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: string;
  status: string;
  team: string;
  labels?: string[];
}

interface Activity {
  _id: string;
  type: string;
  user: string;
  action: string;
  target: string;
  team: string;
  time: string;
}


export default function TeamWorkspacePage() {
  // User selection for team creation
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [allUsers, setAllUsers] = useState<{_id: string, name: string, email: string, avatar_url?: string}[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamColor, setTeamColor] = useState('from-blue-500 to-green-500');
  const [teamDpFile, setTeamDpFile] = useState<File | null>(null);
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [isUploadingDp, setIsUploadingDp] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'inventory' | 'activity'>('overview');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Fetch users for team creation modal
  useEffect(() => {
    if (showCreateTeamModal) {
      fetch('http://localhost:5000/api/users/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setAllUsers(data.users);
          else setAllUsers([]);
        })
        .catch(() => setAllUsers([]));
    }
  }, [showCreateTeamModal]);

  // Fetch teams on mount
  async function fetchTeams() {
    try {
      const res = await fetch('http://localhost:5000/api/teams/my', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.teams)) {
        setTeams(data.teams);
        setSelectedTeam(data.teams[0] || null);
      } else {
        setTeams([]);
        setSelectedTeam(null);
      }
    } catch {
      setTeams([]);
      setSelectedTeam(null);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch resources, tasks, activity for selected team
  useEffect(() => {
    if (!selectedTeam) return;
    async function fetchResources() {
      if (!selectedTeam) return;
      try {
        const res = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/resources`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}` }
        });
        const data = await res.json();
        if (data.success) setResources(data.resources);
        else setResources([]);
      } catch {
        setResources([]);
      }
    }
    async function fetchTasks() {
      if (!selectedTeam) return;
      try {
        const res = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/tasks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}` }
        });
        const data = await res.json();
        if (data.success) setTasks(data.tasks);
        else setTasks([]);
      } catch {
        setTasks([]);
      }
    }
    async function fetchActivity() {
      if (!selectedTeam) return;
      try {
        const res = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/activity`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}` }
        });
        const data = await res.json();
        if (data.success) setRecentActivity(data.activity);
        else setRecentActivity([]);
      } catch {
        setRecentActivity([]);
      }
    }
    if (activeTab === 'inventory') fetchResources();
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'activity') fetchActivity();
  }, [selectedTeam, activeTab]);

  // Create team handler
  async function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!teamName || selectedUserIds.length === 0) return;
    let dp_url = '';
    // Always add creator as admin
    const creatorId = localStorage.getItem('sharespace_userid') ?? '';
    // Filter out empty strings from user arrays
    let filteredUserIds = selectedUserIds.filter(id => id && id !== '');
    let filteredAdminIds = adminUserIds.filter(id => id && id !== '');
    let finalAdminIds = filteredAdminIds.includes(creatorId)
      ? filteredAdminIds
      : [...filteredAdminIds, creatorId];
    if (!filteredUserIds.includes(creatorId)) {
      filteredUserIds.push(creatorId);
    }
    if (teamDpFile) {
      setIsUploadingDp(true);
      try {
        const { uploadImageToCloudinary } = await import('../utils/cloudinaryService');
        dp_url = await uploadImageToCloudinary(teamDpFile);
      } catch {
        alert('Failed to upload team display picture.');
        setIsUploadingDp(false);
        return;
      }
      setIsUploadingDp(false);
    }
    try {
      const res = await fetch('http://localhost:5000/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}`
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDesc,
          memberIds: filteredUserIds,
          adminIds: finalAdminIds,
          dp_url
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateTeamModal(false);
        setTeamName(''); setTeamDesc(''); setSelectedUserIds([]); setUserSearch(''); setTeamDpFile(null); setAdminUserIds([]);
        // Always refresh teams after creation
        fetchTeams();
      }
    } catch {}
  }

  // Add resource handler
  async function handleAddResource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTeam) return;
    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      description: { value: string };
      quantity: { value: string };
      status: { value: string };
    };
    const body = {
      name: form.name.value,
      description: form.description.value,
      quantity: Number(form.quantity.value),
      status: form.status.value,
      owner: localStorage.getItem('sharespace_userid')
    };
    try {
      const res = await fetch(`http://localhost:5000/api/teams/${selectedTeam._id}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sharespace_token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) setResources(data.resources);
      setShowAddResourceModal(false);
    } catch {
      setShowAddResourceModal(false);
    }
  }

  // Helper to check if current user is admin
  const currentUserId = localStorage.getItem('sharespace_userid');
  function isCurrentUserAdmin(team: Team | null) {
    if (!team || !team.admins) return false;
    return team.admins.includes(currentUserId ?? '');
  }

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  function toggleUserSelect(userId: string) {
    setSelectedUserIds(ids =>
      ids.includes(userId) ? ids.filter(id => id !== userId) : [...ids, userId]
    );
  }

  function toggleAdminSelect(userId: string) {
    setAdminUserIds(ids =>
      ids.includes(userId) ? ids.filter(id => id !== userId) : [...ids, userId]
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'activity', label: 'Activity', icon: MessageSquare }
  ];

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'my_tasks') return task.assignee === 'You';
    if (taskFilter === 'team') return selectedTeam ? task.team === selectedTeam.name : false;
    return task.status === taskFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Team Workspace
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Collaborate and manage shared resources
            </p>
          </div>
          <div>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setShowCreateTeamModal(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Team
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Teams */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Teams
              </h2>
              <div className="space-y-3">
                {teams.map((team) => (
                  <button
                    key={team._id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTeam?._id === team._id
                        ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {team.dp_url ? (
                        <img src={team.dp_url} alt="Team DP" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${team.color ?? ''} flex items-center justify-center text-white text-lg`}>
                          {team.avatar ?? ''}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {team.name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Team Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 mb-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedTeam?.dp_url ? (
                    <img src={selectedTeam.dp_url} alt="Team DP" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${selectedTeam?.color ?? ''} flex items-center justify-center text-white text-2xl`}>
                      {selectedTeam?.avatar ?? ''}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTeam?.name ?? ''}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedTeam?.description ?? ''}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Your role: {isCurrentUserAdmin(selectedTeam) ? 'Admin' : 'Member'}</span>
                      <button
                        className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 text-xs"
                        onClick={() => setIsCreateTaskModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign Task
                      </button>
                    </div>
                  </div>
                </div>
                {isCurrentUserAdmin(selectedTeam) && (
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setShowSettingsModal(true)}>
                    <Settings className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Team Stats */}
              {/* Team stats removed, not present in backend model */}
            </motion.div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recent Tasks */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Recent Tasks
                        </h3>
                        <div className="space-y-3">
                          {tasks.slice(0, 3).map((task) => (
                            <div key={task._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status] ?? ''}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Assigned to: {task.assignee}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 text-xs rounded border ${priorityColors[task.priority] ?? ''}`}>
                                  {task.priority} priority
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Activity */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Recent Activity
                        </h3>
                        <div className="space-y-3">
                          {recentActivity.map((activity) => (
                            <div key={activity._id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  <span className="font-medium">{activity.user}</span> {activity.action} 
                                  <span className="font-medium"> {activity.target}</span>
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {activity.team}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {activity.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Task Filters */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {['all', 'my_tasks', 'pending', 'in_progress', 'completed'].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setTaskFilter(filter)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                              taskFilter === filter
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            {filter.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <Search className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <Filter className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                      {filteredTasks.map((task) => (
                        <div key={task._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded border ${priorityColors[task.priority] ?? ''}`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${statusColors[task.status] ?? ''}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {task.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {task.assignee}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                                <span>{task.team}</span>
                              </div>
                              {task.labels?.length ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {task.labels?.map((label) => (
                                    <span
                                      key={label}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-blue-500" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Team Inventory</h3>
                      </div>
                      <button
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600"
                        onClick={() => setShowAddResourceModal(true)}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Resource
                      </button>
                    </div>
                    {/* Resource List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                      {resources.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">No resources pooled yet.</div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Owner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resources.map((r, idx) => (
                              <tr key={idx} className="border-b dark:border-gray-700">
                                <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{r.name}</td>
                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{r.description}</td>
                                <td className="px-4 py-2 text-center">{r.quantity}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs ${r.status === 'available' ? 'bg-green-100 text-green-800' : r.status === 'in_use' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
                                </td>
                                <td className="px-4 py-2">{r.owner?.name || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {/* Add Resource Modal */}
                    {showAddResourceModal && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-strong p-6 w-full max-w-md"
                        >
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Resource</h2>
                          <form onSubmit={handleAddResource} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                              <input type="text" name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                              <textarea name="description" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                              <input type="number" name="quantity" min={1} defaultValue={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                              <select name="status" className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <option value="available">Available</option>
                                <option value="in_use">In Use</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            </div>
                            <div className="flex space-x-3 mt-6">
                              <button type="button" onClick={() => setShowAddResourceModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                              <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600">Add</button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {recentActivity.map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-medium">{activity.user}</span> {activity.action} 
                            <span className="font-medium"> {activity.target}</span>
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              in {activity.team}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-strong p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Task
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the task..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600"
              >
                Create Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-strong p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Name</label>
                <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={teamDesc} onChange={e => setTeamDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <select value={teamColor} onChange={e => setTeamColor(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <option value="from-blue-500 to-green-500">Blue-Green</option>
                  <option value="from-purple-500 to-pink-500">Purple-Pink</option>
                  <option value="from-orange-500 to-yellow-500">Orange-Yellow</option>
                  <option value="from-gray-500 to-gray-800">Gray</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Display Picture</label>
                <input type="file" accept="image/*" onChange={e => setTeamDpFile(e.target.files?.[0] || null)} className="w-full mb-2 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {teamDpFile && <img src={URL.createObjectURL(teamDpFile)} alt="Team DP Preview" className="w-16 h-16 rounded-lg mt-2" />}
                {isUploadingDp && <div className="text-blue-500 text-sm mt-2">Uploading image...</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Members</label>
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name or email..." className="w-full mb-2 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                <div className="max-h-48 overflow-y-auto border rounded-lg dark:border-gray-600">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-gray-500 text-center">No users found.</div>
                  ) : (
                    filteredUsers.map(user => (
                      <label key={user._id} className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id)}
                          onChange={() => toggleUserSelect(user._id)}
                          className="mr-3"
                        />
                        <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white mr-2">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                        <input
                          type="checkbox"
                          checked={adminUserIds.includes(user._id)}
                          onChange={() => toggleAdminSelect(user._id)}
                          className="ml-3"
                          title="Make admin"
                        />
                        <span className="text-xs text-blue-500 ml-1">Admin</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">You will be added as an admin automatically.</div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowCreateTeamModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600">Create Team</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}


      {/* Settings Modal for admin actions */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-strong p-6 w-full max-w-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Team Settings</h2>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Edit Team</button>
              <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete Team</button>
              <button className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Remove User Privileges</button>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
