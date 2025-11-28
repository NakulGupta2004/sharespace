import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Calendar,
  CheckSquare,
  Package,
  MessageSquare,
  MessageCircle,
  User,
  Settings,
  Search,
  Filter,
  MoreVertical,
  X,
  Crown,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  RotateCcw
} from 'lucide-react';

// TypeScript interfaces
interface Team {
  _id: string;
  name: string;
  description: string;
  members: { _id: string; name: string; email: string }[];
  role?: string;
  avatar?: string;
  color?: string;
  dp_url?: string;
  admins?: { _id: string; name: string; email: string }[];
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
  assignee?: { _id: string; name: string; email: string } | string;
  assignedTo?: { _id: string; name: string; email: string } | string;
  createdBy?: { _id: string; name: string; email: string } | string;
  dueDate?: string;
  priority: string;
  status: string;
  team?: { _id: string; name: string; email: string } | string;
  labels?: string[];
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Activity {
  _id: string;
  type: string;
  user: { _id: string; name: string; email: string };
  description: string;
  team: { _id: string; name: string; email: string };
  createdAt: string;
}

interface GroupMessage {
  _id: string;
  senderId: { _id: string; name: string; email: string };
  content: string;
  createdAt: string;
  edited?: boolean;
}

export default function TeamWorkspacePage() {
  const { user } = useAuth();
  const { socket, isConnected, sendTeamMessage, joinTeam, leaveTeam } = useSocket();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'inventory' | 'activity' | 'mytasks' | 'groupchat'>('overview');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<string>('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resourceImageFile, setResourceImageFile] = useState<File | null>(null);
  const [isUploadingResource, setIsUploadingResource] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState<'teams' | 'mytasks' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.emoji-picker-container') && !target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Fetch users for team creation modal
  useEffect(() => {
    if (showCreateTeamModal) {
      api.get('/api/users/all')
        .then(res => {
          const data = res.data;
          if (data.success) setAllUsers(data.users);
          else setAllUsers([]);
        })
        .catch(() => setAllUsers([]));
    }
  }, [showCreateTeamModal]);

  // Fetch teams on mount
  async function fetchTeams() {
    try {
      const res = await api.get('/api/teams/my');
      const data = res.data;
      if (data.success && Array.isArray(data.teams)) {
        // Remove duplicates based on _id
        const uniqueTeams = data.teams.filter((team: Team, index: number, self: Team[]) => 
          index === self.findIndex((t: Team) => t._id === team._id)
        );
        setTeams(uniqueTeams);
        setSelectedTeam(uniqueTeams[0] || null);
      } else {
        setTeams([]);
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
      setSelectedTeam(null);
    }
  }

  useEffect(() => {
    fetchTeams();
    fetchMyTasks();
  }, []);

  // Fetch functions
  async function fetchTasks() {
    if (!selectedTeam) return;
    try {
      const res = await api.get(`/api/teams/${selectedTeam._id}/tasks`);
      const data = res.data;
      if (data.success) setTasks(data.tasks);
      else setTasks([]);
    } catch {
      setTasks([]);
    }
  }

  async function fetchActivity() {
    if (!selectedTeam) return;
    try {
      const res = await api.get(`/api/teams/${selectedTeam._id}/activity`);
      const data = res.data;
      if (data.success) setRecentActivity(data.activity);
      else setRecentActivity([]);
    } catch {
      setRecentActivity([]);
    }
  }

  async function fetchGroupMessages() {
    if (!selectedTeam) return;
    try {
      const res = await api.get(`/api/teams/${selectedTeam._id}/messages`);
      const data = res.data;
      if (data.success) setGroupMessages(data.messages);
      else setGroupMessages([]);
    } catch {
      setGroupMessages([]);
    }
  }

  async function fetchMyTasks() {
    try {
      const res = await api.get(`/api/users/my-tasks`);
      const data = res.data;
      if (data.success) setMyTasks(data.tasks);
      else setMyTasks([]);
    } catch {
      setMyTasks([]);
    }
  }

  async function sendGroupMessage() {
    if (!selectedTeam || !newMessage.trim() || !socket || !isConnected) return;

    const messageContent = newMessage.trim();
    setIsSendingMessage(true);

    // Optimistic UI update
    const optimisticMessage: GroupMessage = {
      _id: `temp_${Date.now()}`,
      senderId: {
        _id: user?._id || '',
        name: user?.name || 'You',
        email: user?.email || ''
      },
      content: messageContent,
      createdAt: new Date().toISOString()
    };

    setGroupMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      sendTeamMessage(selectedTeam._id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setGroupMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setNewMessage(messageContent); // Restore message
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function clearGroupChat() {
    if (!selectedTeam) return;
    setShowClearChatConfirm(true);
  }

  async function confirmClearChat() {
    if (!selectedTeam) return;

    try {
      const res = await api.delete(`/api/teams/${selectedTeam._id}/messages/clear`);
      
      const data = res.data;
      if (data.success) {
        setGroupMessages([]);
        setShowClearChatConfirm(false);
      } else {
        alert(data.message || 'Failed to clear chat');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat');
    }
  }

  async function editGroupMessage(messageId: string, newContent: string) {
    if (!newContent.trim()) return;

    try {
      const res = await api.put(`/api/teams/messages/${messageId}/edit`, { content: newContent.trim() });
      
      const data = res.data;
      if (data.success) {
        setGroupMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, content: newContent.trim(), edited: true }
            : msg
        ));
        setEditingMessageId(null);
        setEditingContent('');
      } else {
        alert(data.message || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  }

  async function deleteGroupMessage(messageId: string) {
    setMessageToDelete(messageId);
    setShowDeleteMessageConfirm(true);
  }

  async function confirmDeleteMessage() {
    if (!messageToDelete) return;

    try {
      const res = await api.delete(`/api/teams/messages/${messageToDelete}/delete`);
      
      const data = res.data;
      if (data.success) {
        setGroupMessages(prev => prev.filter(msg => msg._id !== messageToDelete));
        setShowDeleteMessageConfirm(false);
        setMessageToDelete(null);
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  }

  // Fetch resources, tasks, activity for selected team
  useEffect(() => {
    if (!selectedTeam) return;
    async function fetchResources() {
      if (!selectedTeam) return;
      try {
        const res = await api.get(`/api/teams/${selectedTeam._id}/resources`);
        const data = res.data;
        console.log('Resources fetched:', data);
        if (data.success) setResources(data.resources);
        else setResources([]);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setResources([]);
      }
    }
    if (activeTab === 'inventory') fetchResources();
    // Fetch tasks and activity for overview tab as well
    if (activeTab === 'tasks' || activeTab === 'overview') fetchTasks();
    if (activeTab === 'activity' || activeTab === 'overview') fetchActivity();
    if (activeTab === 'groupchat') fetchGroupMessages();
  }, [selectedTeam, activeTab]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewTeamMessage = (data: any) => {
      console.log('Received new team message:', data);
      if (data.teamId === selectedTeam?._id) {
        setGroupMessages(prev => [...prev, data.message]);
      }
    };

    const handleTeamMessageSent = (data: any) => {
      console.log('Team message sent:', data);
      // Message is already added to UI via optimistic update
    };

    const handleTeamMessageError = (data: any) => {
      console.error('Team message error:', data);
      // Could show error toast here
    };

    const handleMessageEdited = (data: { messageId: string; content: string; edited: boolean }) => {
      console.log('Message edited event received:', data);
      setGroupMessages(prev => prev.map(msg =>
        msg._id === data.messageId
          ? { ...msg, content: data.content, edited: data.edited }
          : msg
      ));
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      console.log('Message deleted event received:', data);
      setGroupMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    };

    const handleChatCleared = (data: { clearedBy: string }) => {
      console.log('Chat cleared event received:', data);
      setGroupMessages([]);
      // Could show a toast notification here
      console.log(`Chat cleared by ${data.clearedBy}`);
    };

    const handleInviteAccepted = (data: any) => {
      console.log('🔄 Invite accepted event received in TeamWorkspacePage:', data);
      if (data.teamId === selectedTeam?._id) {
        // Refresh team data to update member list
        fetchTeams();
      }
    };

    const handleInviteRejected = (data: any) => {
      console.log('Invite rejected event received:', data);
      // No need to refresh team data for rejection, as member wasn't added
    };

    const handleTeamMemberJoined = (data: any) => {
      console.log('👥 Team member joined event received:', data);
      if (data.teamId === selectedTeam?._id) {
        // Refresh team data to update member list
        fetchTeams();
        toast.success(`${data.userName || 'Someone'} joined the team!`);
      }
    };

    socket.on('new_team_message', handleNewTeamMessage);
    socket.on('team_message_sent', handleTeamMessageSent);
    socket.on('team_message_error', handleTeamMessageError);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('chatCleared', handleChatCleared);
    socket.on('invite_accepted', handleInviteAccepted);
    socket.on('invite_rejected', handleInviteRejected);
    socket.on('team_member_joined', handleTeamMemberJoined);

    return () => {
      socket.off('new_team_message', handleNewTeamMessage);
      socket.off('team_message_sent', handleTeamMessageSent);
      socket.off('team_message_error', handleTeamMessageError);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('chatCleared', handleChatCleared);
      socket.off('invite_accepted', handleInviteAccepted);
      socket.off('invite_rejected', handleInviteRejected);
      socket.off('team_member_joined', handleTeamMemberJoined);
    };
  }, [socket, isConnected, selectedTeam]);

  // Join/leave team rooms when team changes
  useEffect(() => {
    if (!socket || !isConnected || !selectedTeam) return;

    console.log('Joining team room:', selectedTeam._id);
    joinTeam(selectedTeam._id);

    return () => {
      if (selectedTeam) {
        console.log('Leaving team room:', selectedTeam._id);
        leaveTeam(selectedTeam._id);
      }
    };
  }, [socket, isConnected, selectedTeam, joinTeam, leaveTeam]);

  // Create team handler
  async function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!teamName || selectedUserIds.length === 0) return;
    let dp_url = '';
    // Always add creator as admin
    const creatorId = user?.id || '';
    // Filter out empty strings from user arrays
    let filteredUserIds = selectedUserIds.filter(id => id && id !== '');
    let filteredAdminIds = adminUserIds.filter(id => id && id !== '');
    let finalAdminIds = filteredAdminIds.includes(creatorId)
      ? filteredAdminIds
      : [...filteredAdminIds, creatorId];
    // Remove creator from memberIds if present (creator is automatically added as member)
    filteredUserIds = filteredUserIds.filter(id => id !== creatorId);
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
      const res = await api.post(`/api/teams/create`, {
        name: teamName,
        description: teamDesc,
        memberIds: filteredUserIds,
        adminIds: finalAdminIds,
        dp_url
      });
      const data = res.data;
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
    
    setIsUploadingResource(true);
    
    const form = e.currentTarget as HTMLFormElement & {
      name: { value: string };
      description: { value: string };
      quantity: { value: string };
      status: { value: string };
      image_url: { value: string };
    };
    
    let imageUrl = form.image_url.value.trim();
    
    // If user provided a file instead of URL, upload to Cloudinary
    if (resourceImageFile && !imageUrl) {
      try {
        console.log('Uploading image to Cloudinary...');
        const { uploadImageToCloudinary } = await import('../utils/cloudinaryService');
        imageUrl = await uploadImageToCloudinary(resourceImageFile);
        console.log('Image uploaded successfully:', imageUrl);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        toast.error('Failed to upload image. You can add a resource without an image.');
        // Continue without image
        imageUrl = '';
      }
    }
    
    const body = {
      name: form.name.value,
      description: form.description.value,
      quantity: Number(form.quantity.value),
      status: form.status.value,
      owner: user?.id,
      image_url: imageUrl
    };
    
    console.log('Sending resource data:', body);
    
    try {
      const res = await api.post(`/api/teams/${selectedTeam._id}/resources`, body);
      const data = res.data;
      console.log('Resource response:', data);
      if (data.success) {
        console.log('Resources after add:', data.resources);
        setResources(data.resources);
        setShowAddResourceModal(false);
        setResourceImageFile(null);
        toast.success('Resource added successfully!');
      } else {
        toast.error(`Error: ${data.error || 'Failed to add resource'}`);
      }
    } catch (error: any) {
      console.error('Error adding resource:', error);
      toast.error(error.response?.data?.error || 'Failed to add resource. Please try again.');
    } finally {
      setIsUploadingResource(false);
    }
  }

  // Remove member handler
  async function handleRemoveMember(memberId: string) {
    if (!selectedTeam) return;
    try {
      const res = await api.post(`/api/teams/${selectedTeam._id}/remove-member`, { memberId });
      const data = res.data;
      if (data.success) {
        // Refresh teams
        fetchTeams();
      } else {
        alert('Failed to remove member');
      }
    } catch {
      alert('Error removing member');
    }
  }

  // Create task handler
  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTeam || !taskTitle.trim()) return;

    try {
      const res = await api.post(`/api/tasks`, {
        title: taskTitle,
        description: taskDescription,
        teamId: selectedTeam._id,
        assignedTo: taskAssignee || null,
        priority: taskPriority,
        dueDate: taskDueDate || null
      });

      const data = res.data;
      if (data.success) {
        setIsCreateTaskModalOpen(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('medium');
        setTaskDueDate('');
        setTaskAssignee('');
        fetchTasks();
        fetchActivity();
        fetchMyTasks(); // Refresh personal tasks
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    }
  }

  // Edit team handler
  async function handleEditTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTeam || !editTeamName.trim()) return;
    try {
      const res = await api.put(`/api/teams/${selectedTeam._id}/update`, {
        name: editTeamName,
        description: editTeamDesc
      });
      const data = res.data;
      if (data.success) {
        setIsEditingTeam(false);
        setEditTeamName('');
        setEditTeamDesc('');
        fetchTeams();
      } else {
        alert('Failed to update team');
      }
    } catch {
      alert('Error updating team');
    }
  }

  // Delete team handler
  async function handleDeleteTeam() {
    if (!selectedTeam) return;
    try {
      const res = await api.delete(`/api/teams/${selectedTeam._id}`);
      const data = res.data;
      if (data.success) {
        setShowSettingsModal(false);
        setSelectedTeam(null);
        fetchTeams();
      } else {
        alert('Failed to delete team');
      }
    } catch {
      alert('Error deleting team');
    }
  }

  // Update task status
  async function updateTaskStatus(taskId: string, newStatus: string) {
    try {
      const res = await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      const data = res.data;
      if (data.success) {
        fetchMyTasks();
        fetchTasks();
        fetchActivity();
      } else {
        alert('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
    }
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
    { id: 'activity', label: 'Activity', icon: MessageSquare },
    { id: 'mytasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'groupchat', label: 'Group Chat', icon: MessageCircle }
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
    if (taskFilter === 'my_tasks') {
      if (typeof task.assignee === 'object' && task.assignee) {
        return task.assignee._id === user?.id;
      }
      return task.assignee === user?.id;
    }
    if (taskFilter === 'team') return selectedTeam ? task.team === selectedTeam._id : false;
    return task.status === taskFilter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  function isCurrentUserAdmin(team: Team | null): boolean {
    if (!team || !user?.id) return false;
    return team.admins?.some(admin => admin._id === user.id) || false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 overflow-hidden overflow-x-hidden">
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="text-center sm:text-left">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
            >
              Team Workspace
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-600 dark:text-gray-400 mt-3 text-base sm:text-lg font-medium"
            >
              Collaborate and manage shared resources with elegance ✨
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center space-x-4 mt-3"
            >
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{teams.length} Active Teams</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{selectedTeam ? (Array.isArray(selectedTeam.members) ? selectedTeam.members.length : 0) : 0} Members</span>
              </div>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3"
          >
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors font-medium"
              onClick={() => setShowCreateTeamModal(true)}
            >
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create Team</span>
              </div>
            </motion.button>
            
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 dark:border-gray-700/50"
              title="Workspace Settings"
            >
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </motion.button> */}
          </motion.div>
        </motion.div>

        <div className="flex h-full relative">
          {/* Navigation Buttons - Fixed to left edge - Hidden on mobile */}
          <div className="hidden md:flex fixed left-0 top-1/2 transform -translate-y-1/2 flex-col space-y-2 z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSidebarOpen(!sidebarOpen || sidebarType !== 'teams');
                setSidebarType(sidebarType === 'teams' ? null : 'teams');
              }}
              className={`flex flex-col items-center space-y-1 px-2 py-3 rounded-r-lg transition-all duration-300 w-16 h-16 justify-center -rotate-90 ${
                sidebarOpen && sidebarType === 'teams'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium text-xs text-center leading-tight">Your Teams</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('mytasks');
                setSidebarOpen(false);
                setSidebarType(null);
              }}
              className={`flex flex-col items-center space-y-1 px-2 py-3 rounded-r-lg transition-all duration-300 w-16 h-16 justify-center -rotate-90 ${
                activeTab === 'mytasks'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="font-medium text-xs text-center leading-tight">My Task</span>
            </motion.button>
          </div>

          {/* Teams Sidebar */}
          <AnimatePresence>
            {sidebarOpen && sidebarType === 'teams' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
              >
                <div className="p-6 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Your Teams
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {teams.map((team, _index) => (
                      <motion.button
                        key={team._id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedTeam(team);
                          setSidebarOpen(false);
                        }}
                        className={`group w-full text-left p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm border relative overflow-hidden ${
                          selectedTeam?._id === team._id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {typeof team.dp_url === 'string' && team.dp_url ? (
                            <div className="relative">
                              <img src={team.dp_url} alt="Team DP" className="w-12 h-12 rounded-2xl object-cover shadow-lg" />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                          ) : (
                            <div className={`relative w-12 h-12 rounded-2xl ${typeof team.color === 'string' ? team.color : (team.color as any)?.name ?? 'bg-blue-500'} flex items-center justify-center text-white text-lg`}>
                              {typeof team.avatar === 'string' ? team.avatar : (team.avatar as any)?.name ?? ''}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold truncate ${
                              selectedTeam?._id === team._id ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}>
                              {typeof team.name === 'string' ? team.name : (team.name as any).name}
                            </div>
                            <div className={`text-sm flex items-center space-x-2 ${
                              selectedTeam?._id === team._id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Users className="h-3 w-3" />
                              <span>{Array.isArray(team.members) ? team.members.length : (typeof team.members === 'number' ? team.members : (typeof team.members === 'object' ? (team.members as any).name : team.members))} members</span>
                            </div>
                          </div>
                          <div className={`${selectedTeam?._id === team._id ? 'text-blue-100' : 'text-gray-400'}`}>
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Team Header */}
            <AnimatePresence mode="wait">
              {selectedTeam && (
                <motion.div
                  key={selectedTeam._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/20"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
                      {selectedTeam?.dp_url ? (
                        <img src={selectedTeam.dp_url} alt="Team DP" className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover shadow-xl mx-auto sm:mx-0" />
                      ) : (
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${selectedTeam?.color || 'bg-blue-600'} flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg mx-auto sm:mx-0`}>
                          {selectedTeam?.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                      )}
                      <div className="text-center sm:text-left flex-1 sm:flex-initial">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                          {selectedTeam?.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-base sm:text-lg">
                          {selectedTeam?.description}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-6 mt-4">
                          <div className="flex items-center space-x-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {isCurrentUserAdmin(selectedTeam) ? 'Admin' : 'Member'}
                            </span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all duration-300 text-sm"
                            onClick={() => setIsCreateTaskModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Task
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    {user && isCurrentUserAdmin(selectedTeam) && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-700/50 rounded-2xl backdrop-blur-sm self-center sm:self-start"
                        onClick={() => setShowSettingsModal(true)}
                      >
                        <Settings className="h-6 w-6" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl mb-8 border border-white/20 overflow-hidden"
            >
              <div className="border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <nav className="flex overflow-x-auto scrollbar-hide space-x-1 px-4 sm:px-6 py-2" aria-label="Tabs">
                  {tabs.map((tab, index) => {
                    const Icon = tab.icon
                    return (
                      <motion.button
                        key={tab.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center space-x-2 sm:space-x-3 py-3 sm:py-4 px-4 sm:px-6 rounded-2xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">{tab.label}</span>
                        <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                      </motion.button>
                    )
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Recent Tasks */}
                        <motion.div
                          variants={itemVariants}
                          className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 h-80 sm:h-96 lg:h-[30rem] flex flex-col"
                        >
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-blue-500 rounded-2xl">
                              <CheckSquare className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              Recent Tasks
                            </h3>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            {tasks.map((task, index) => (
                              <motion.div
                                key={task._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/30"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {task.title}
                                  </h4>
                                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[task.status] ?? ''} shadow-sm`}>
                                    {task.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  Assigned to: {typeof task.assignee === 'string' ? task.assignee : task.assignee?.name || 'Unassigned'}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className={`px-3 py-1 text-xs rounded-lg border ${priorityColors[task.priority] ?? ''} shadow-sm`}>
                                    {task.priority} priority
                                  </span>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {tasks.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Team Activity */}
                        <motion.div
                          variants={itemVariants}
                          className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 h-80 sm:h-96 lg:h-[30rem] flex flex-col"
                        >
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-purple-500 rounded-2xl">
                              <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              Recent Activity
                            </h3>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            {recentActivity.map((activity, index) => (
                              <motion.div
                                key={activity._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="flex items-start space-x-4 p-4 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/30"
                              >
                                <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {activity.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {activity.user.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(activity.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            {recentActivity.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Team Members */}
                        <motion.div
                          variants={itemVariants}
                          className="bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 h-80 sm:h-96 lg:h-[30rem] flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 bg-green-500 rounded-2xl">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Team Members ({Array.isArray(selectedTeam?.members) ? selectedTeam.members.length : 0})
                              </h3>
                            </div>
                            {isCurrentUserAdmin(selectedTeam) && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSettingsModal(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300 text-sm font-medium"
                              >
                                Manage Members
                              </motion.button>
                            )}
                          </div>
                          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <div className="space-y-4">
                            {Array.isArray(selectedTeam?.members) ? selectedTeam.members.map((member: any) => (
                              <motion.div
                                key={member._id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, delay: Math.random() * 0.2 }}
                                className="group relative"
                              >
                                <div className="relative bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]">
                                  {/* Decorative background elements */}
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>

                                  {/* Role badge - positioned absolutely */}
                                  <div className="absolute top-4 right-4 z-10">
                                    <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                                      selectedTeam?.admins?.some((admin: any) => admin._id === member._id)
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                      {selectedTeam?.admins?.some((admin: any) => admin._id === member._id) ? (
                                        <Crown className="h-3.5 w-3.5" />
                                      ) : (
                                        <User className="h-3.5 w-3.5" />
                                      )}
                                      <span className="font-bold">
                                        {selectedTeam?.admins?.some((admin: any) => admin._id === member._id) ? 'ADMIN' : 'MEMBER'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Remove button - only for admins to remove non-admin members */}
                                  {isCurrentUserAdmin(selectedTeam) && !selectedTeam?.admins?.some((admin: any) => admin._id === member._id) && (
                                    <div className="absolute top-4 left-4 z-10">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleRemoveMember(member._id)}
                                        className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"
                                        title="Remove member"
                                      >
                                        <X className="h-4 w-4" />
                                      </motion.button>
                                    </div>
                                  )}

                                  {/* Main content */}
                                  <div className="relative z-10 p-6 pt-16">
                                    {/* Avatar and basic info */}
                                    <div className="flex items-center space-x-4 mb-4">
                                      <div className="relative">
                                        <div className={`w-16 h-16 rounded-2xl shadow-xl border-3 overflow-hidden ${
                                          selectedTeam?.admins?.some((admin: any) => admin._id === member._id)
                                            ? 'border-amber-400 shadow-amber-400/20'
                                            : 'border-blue-400 shadow-blue-400/20'
                                        }`}>
                                          <img
                                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=128&color=ffffff&bold=true`}
                                            alt={member.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=128&color=ffffff&bold=true`;
                                            }}
                                          />
                                        </div>
                                        {/* Online status indicator */}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-gray-800 ${
                                          Math.random() > 0.5 ? 'bg-green-400' : 'bg-gray-400'
                                        }`}></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
                                          {member.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">
                                          {member.email}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Additional info section */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Role</span>
                                        <span className={`font-semibold ${
                                          selectedTeam?.admins?.some((admin: any) => admin._id === member._id)
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                          {selectedTeam?.admins?.some((admin: any) => admin._id === member._id) ? 'Administrator' : 'Team Member'}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
                                        <div className="flex items-center space-x-1.5">
                                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                          <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Decorative bottom border */}
                                    <div className={`mt-4 h-1 rounded-full ${
                                      selectedTeam?.admins?.some((admin: any) => admin._id === member._id)
                                        ? 'bg-amber-100 dark:bg-amber-900/30'
                                        : 'bg-blue-100 dark:bg-blue-900/30'
                                    }`}></div>
                                  </div>
                                </div>
                              </motion.div>
                            )) : (
                              <div className="col-span-full">
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center justify-center py-16 px-8 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50"
                                >
                                  <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                                    <Users className="h-10 w-10 text-white" />
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No Team Members</h3>
                                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md leading-relaxed">
                                    This team doesn't have any members yet. Add members to start collaborating on projects and tasks.
                                  </p>
                                </motion.div>
                              </div>
                            )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tasks Tab */}
                  {activeTab === 'tasks' && (
                    <motion.div
                      key="tasks"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Task Filters */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between flex-wrap gap-2 sm:gap-4"
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {['all', 'my_tasks', 'pending', 'in_progress', 'completed'].map((filter, index) => (
                            <motion.button
                              key={filter}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.05 * index }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setTaskFilter(filter)}
                              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-2xl transition-all duration-300 shadow-md ${
                                taskFilter === filter
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-700/90 border border-white/30'
                              }`}
                            >
                              {filter.replace('_', ' ')}
                            </motion.button>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-700/50 rounded-2xl backdrop-blur-sm border border-white/30"
                          >
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-700/50 rounded-2xl backdrop-blur-sm border border-white/30"
                          >
                            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Task List */}
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        {filteredTasks.map((task, _index) => (
                          <motion.div
                            key={task._id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
                              <div className="flex-1 w-full sm:w-auto">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg break-words w-full sm:w-auto">
                                    {task.title}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 sm:px-3 py-1 text-xs rounded-full ${priorityColors[task.priority] ?? ''} shadow-sm`}>
                                      {task.priority}
                                    </span>
                                    <span className={`px-2 sm:px-3 py-1 text-xs rounded-full ${statusColors[task.status] ?? ''} shadow-sm`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base break-words">
                                  {task.description}
                                </p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center space-x-2">
                                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="truncate">{typeof task.assignee === 'string' ? task.assignee : task.assignee?.name || 'Unassigned'}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                                  </div>
                                  <span className="font-medium">{selectedTeam?.name || 'Unknown Team'}</span>
                                </div>
                                {task.labels?.length ? (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {task.labels?.map((label) => (
                                      <motion.span
                                        key={label}
                                        whileHover={{ scale: 1.05 }}
                                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium shadow-sm"
                                      >
                                        {label}
                                      </motion.span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm self-end sm:self-start"
                              >
                                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Inventory Tab */}
                  {activeTab === 'inventory' && (
                    <motion.div
                      key="inventory"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-4 bg-cyan-600 rounded-3xl shadow-lg">
                            <Package className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              Team Inventory
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">Manage shared resources</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                          onClick={() => setShowAddResourceModal(true)}
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add Resource
                        </motion.button>
                      </motion.div>

                      {/* Resource List */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20"
                      >
                        {resources.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                          >
                            <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No resources pooled yet.</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start by adding your first resource!</p>
                          </motion.div>
                        ) : (
                          <div className="overflow-hidden rounded-2xl">
                            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Image</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white/50 dark:bg-gray-800/50 divide-y divide-gray-200/30 dark:divide-gray-700/30">
                                {resources.map((r, idx) => (
                                  <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * idx }}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                    className="transition-colors duration-200"
                                  >
                                    <td className="px-6 py-4">
                                      {r.image_url && r.image_url.trim() ? (
                                        <img 
                                          src={r.image_url} 
                                          alt={r.name}
                                          className="h-12 w-12 rounded-lg object-cover shadow-md"
                                          onError={(e) => {
                                            console.error('Image failed to load:', r.image_url);
                                            e.currentTarget.style.display = 'none';
                                          }}
                                          onLoad={() => console.log('Image loaded:', r.image_url)}
                                        />
                                      ) : (
                                        <div className="h-12 w-12 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                          <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{r.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.description}</td>
                                    <td className="px-6 py-4 text-center font-medium">{r.quantity}</td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                        r.status === 'available' ? 'bg-green-100 text-green-800' :
                                        r.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {r.status}
                                      </span>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Activity Tab */}
                  {activeTab === 'activity' && (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {recentActivity.map((activity, _index) => (
                          <motion.div
                            key={activity._id}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01, y: -1 }}
                            className="flex items-start space-x-6 p-6 bg-white/70 dark:bg-gray-700/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"
                          >
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white leading-relaxed">
                                {activity.description}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full">
                                  by {activity.user.name}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* My Tasks Tab */}
                  {activeTab === 'mytasks' && (
                    <motion.div
                      key="mytasks"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          My Tasks
                        </h2>
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="h-4 w-4 text-orange-500" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{myTasks.length} tasks</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {myTasks.length === 0 ? (
                          <div className="text-center py-12">
                            <CheckSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tasks assigned to you</h3>
                            <p className="text-gray-500 dark:text-gray-400">Tasks will appear here when assigned</p>
                          </div>
                        ) : (
                          myTasks.map((task) => (
                            <motion.div
                              key={task._id}
                              className="group bg-white/60 dark:bg-gray-700/60 rounded-2xl p-6 border border-gray-200/40 dark:border-gray-600/40 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-lg transition-all duration-300 hover:border-orange-200/60"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg truncate group-hover:text-orange-600 transition-colors mb-2">{task.title}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center space-x-2">
                                      <Users className="h-4 w-4" />
                                      <span>Team: {selectedTeam?.name || 'Unknown Team'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4" />
                                      <span>By: {typeof task.createdBy === 'object' && task.createdBy ? task.createdBy.name : 'Unknown'}</span>
                                    </div>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end space-y-3 ml-4">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    task.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                    {task.status}
                                  </span>
                                  {task.status !== 'completed' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => updateTaskStatus(task._id, 'completed')}
                                      className="text-sm bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-sm font-medium"
                                    >
                                      ✓ Mark Done
                                    </motion.button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Group Chat Tab */}
                  {activeTab === 'groupchat' && (
                    <motion.div
                      key="groupchat"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden"
                      >
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <MessageCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:text-white">
                                  Team Chat
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {Array.isArray(selectedTeam?.members) ? selectedTeam.members.length : 0} members online
                                </p>
                              </div>
                            </div>
                            
                            {/* Chat Actions */}
                            <div className="flex items-center space-x-2">
                              {selectedTeam?.admins?.some(admin => admin._id === user?.id) && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={clearGroupChat}
                                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
                                  title="Clear Chat (Admin Only)"
                                >
                                  <RotateCcw className="h-5 w-5" />
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                                title="Chat Settings"
                              >
                                <Settings className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Messages Container */}
                        <div className="h-80 sm:h-96 lg:h-[28rem] overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-900/30 dark:to-gray-800/30">
                          <div className="p-4 space-y-4">
                          {groupMessages.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            groupMessages.map((message) => {
                              const isOwnMessage = message.senderId._id === user?.id;
                              const isEditing = editingMessageId === message._id;
                              
                              return (
                                <motion.div
                                  key={message._id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                                >
                                  <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl relative shadow-sm ${
                                    isOwnMessage
                                      ? 'bg-blue-500 text-white ml-8 sm:ml-12'
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white mr-8 sm:mr-12'
                                  }`}>
                                    {/* Message Header */}
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center space-x-2">
                                        {!isOwnMessage && (
                                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                            {message.senderId.name}
                                          </span>
                                        )}
                                        <span className={`text-xs ${isOwnMessage ? 'opacity-70 text-blue-100' : 'opacity-50 text-gray-500 dark:text-gray-400'}`}>
                                          {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {message.edited && (
                                          <span className={`text-xs ${isOwnMessage ? 'opacity-50 text-blue-200' : 'opacity-50 text-gray-400'}`}>(edited)</span>
                                        )}
                                      </div>
                                      
                                      {/* Edit/Delete Menu (only for own messages) */}
                                      {isOwnMessage && !isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="relative">
                                            <button
                                              onClick={() => {
                                                setEditingMessageId(message._id);
                                                setEditingContent(message.content);
                                              }}
                                              className="p-1 hover:bg-white/20 rounded transition-colors"
                                              title="Edit message"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                            <button
                                              onClick={() => deleteGroupMessage(message._id)}
                                              className="p-1 hover:bg-red-500/30 rounded ml-1 transition-colors"
                                              title="Delete message"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Message Content */}
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={editingContent}
                                          onChange={(e) => setEditingContent(e.target.value)}
                                          className="w-full bg-transparent border-none outline-none resize-none text-sm"
                                          rows={Math.min(editingContent.split('\n').length + 1, 4)}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              editGroupMessage(message._id, editingContent);
                                            } else if (e.key === 'Escape') {
                                              setEditingMessageId(null);
                                              setEditingContent('');
                                            }
                                          }}
                                        />
                                        <div className="flex justify-end space-x-2">
                                          <button
                                            onClick={() => {
                                              setEditingMessageId(null);
                                              setEditingContent('');
                                            }}
                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => editGroupMessage(message._id, editingContent)}
                                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })
                          )}
                          </div>
                        </div>

                        {/* Message Input */}
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-4 border-t border-gray-200/30 dark:border-gray-700/30">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
                                placeholder="Type a message..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500 dark:placeholder-gray-400 pr-12 transition-all duration-200"
                                disabled={isSendingMessage}
                              />
                              <button 
                                className="emoji-button absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              >
                                😊
                              </button>
                              
                              {/* Emoji Picker */}
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                  className="emoji-picker-container absolute bottom-full right-0 mb-2 w-64 max-w-[calc(100vw-2rem)] sm:max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                                >
                                  <div className="grid grid-cols-8 gap-2">
                                    {[
                                      '�', '😂', '�😊', '😍', '🥰', '😘', '😉', '😎',
                                      '🤔', '😮', '😢', '😭', '😤', '😡', '🥺', '😴',
                                      '👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝',
                                      '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                                      '🔥', '⭐', '✨', '💫', '🎉', '🎊', '🎈', '🎁',
                                      '💯', '✅', '❌', '❓', '❗', '💭', '💬', '👋'
                                    ].map((emoji) => (
                                      <motion.button
                                        key={emoji}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                          setNewMessage(prev => prev + emoji);
                                          setShowEmojiPicker(false);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                      >
                                        {emoji}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={sendGroupMessage}
                              disabled={!newMessage.trim() || isSendingMessage}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                newMessage.trim() && !isSendingMessage
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                              }`}
                            >
                              {isSendingMessage ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Task Modal */}
        {isCreateTaskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsCreateTaskModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Assign New Task
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                    required
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe the task..."
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Assign to Team Member
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Unassigned</option>
                    {Array.isArray(selectedTeam?.members) && selectedTeam.members.map((member: any) => (
                      <option key={member._id} value={member._id}>
                        {member.name} {selectedTeam?.admins?.some((admin: any) => admin._id === member._id) ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreateTaskModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all duration-300"
                  >
                    Create Task
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateTeamModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-white/20 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Create Team
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateTeamModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    value={teamDesc}
                    onChange={e => setTeamDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Color Theme
                  </label>
                  <select
                    value={teamColor}
                    onChange={e => setTeamColor(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="from-blue-500 to-green-500">Blue-Green</option>
                    <option value="from-purple-500 to-pink-500">Purple-Pink</option>
                    <option value="from-orange-500 to-yellow-500">Orange-Yellow</option>
                    <option value="from-gray-500 to-gray-800">Gray</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Team Display Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setTeamDpFile(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {teamDpFile && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={URL.createObjectURL(teamDpFile)}
                      alt="Team DP Preview"
                      className="w-20 h-20 rounded-2xl mt-4 shadow-lg object-cover"
                    />
                  )}
                  {isUploadingDp && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-purple-500 text-sm mt-3 flex items-center space-x-2"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                      <span>Uploading image...</span>
                    </motion.div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Add Members
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 mb-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-2xl bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                    {filteredUsers.length === 0 ? (
                      <div className="p-6 text-gray-500 text-center">No users found.</div>
                    ) : (
                      filteredUsers.map(user => (
                        <motion.label
                          key={user._id}
                          whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                          className="flex items-center px-4 py-3 cursor-pointer transition-colors duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => toggleUserSelect(user._id)}
                            className="mr-4 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full mr-3 shadow-sm" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white mr-3">{user.name}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={adminUserIds.includes(user._id)}
                            onChange={() => toggleAdminSelect(user._id)}
                            className="ml-4 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            title="Make admin"
                          />
                          <span className="text-xs text-yellow-600 ml-2 font-medium">Admin</span>
                        </motion.label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">You will be added as an admin automatically.</p>
                </div>
                <div className="flex space-x-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowCreateTeamModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 shadow-lg transition-all duration-300"
                  >
                    Create Team
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Add Resource Modal */}
        {showAddResourceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddResourceModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  Add Resource
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddResourceModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <form onSubmit={handleAddResource} className="space-y-6">
                {/* Image Upload or URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Resource Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* File Upload */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setResourceImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="resource-image-upload"
                      />
                      <label
                        htmlFor="resource-image-upload"
                        className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                      >
                        <div className="text-center">
                          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {resourceImageFile ? resourceImageFile.name : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">or paste URL below</p>
                        </div>
                      </label>
                    </div>
                    {/* OR Divider */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    {/* Image URL Input */}
                    <input
                      type="url"
                      name="image_url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      defaultValue={1}
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Status
                    </label>
                    <select
                      name="status"
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowAddResourceModal(false);
                      setResourceImageFile(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUploadingResource}
                    className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white rounded-2xl shadow-lg transition-all duration-300 font-semibold"
                  >
                    {isUploadingResource ? 'Adding...' : 'Add Resource'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent dark:text-white">
                  Team Settings
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {!isEditingTeam && !showDeleteConfirm && (
                <div className="space-y-6">
                  {/* Edit Team Section */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Team</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Change the team name and description.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsEditingTeam(true);
                        setEditTeamName(typeof selectedTeam?.name === 'string' ? selectedTeam.name : (selectedTeam?.name as any)?.name || '');
                        setEditTeamDesc(typeof selectedTeam?.description === 'string' ? selectedTeam.description : (selectedTeam?.description as any)?.name || '');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all duration-300"
                    >
                      Edit Team Details
                    </motion.button>
                  </div>

                  {/* Manage Members Section */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Members</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Remove non-admin members from the team.</p>
                    <div className="space-y-3">
                      {Array.isArray(selectedTeam?.members) ? selectedTeam.members
                        .filter((member: any) => !selectedTeam?.admins?.some((admin: any) => admin._id === member._id))
                        .map((member: any) => (
                          <div key={member._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveMember(member._id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-300"
                            >
                              Remove
                            </motion.button>
                          </div>
                        )) : <p className="text-gray-500">No removable members.</p>}
                    </div>
                  </div>

                  {/* Delete Team Section */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Danger Zone</h3>
                    <p className="text-red-600 dark:text-red-400 mb-4">Permanently delete this team. This action cannot be undone.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 shadow-lg transition-all duration-300"
                    >
                      Delete Team
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Edit Team Form */}
              {isEditingTeam && (
                <form onSubmit={handleEditTeam} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={e => setEditTeamName(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      value={editTeamDesc}
                      onChange={e => setEditTeamDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsEditingTeam(false)}
                      className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all duration-300"
                    >
                      Update Team
                    </motion.button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Confirm Deletion</h3>
                    <p className="text-red-600 dark:text-red-400 mb-4">
                      Are you sure you want to delete "{typeof selectedTeam?.name === 'string' ? selectedTeam.name : (selectedTeam?.name as any)?.name}"? This will permanently remove the team and all associated data.
                    </p>
                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDeleteTeam}
                        className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 shadow-lg transition-all duration-300"
                      >
                        Delete Team
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearChatConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClearChatConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Clear All Messages
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This will permanently delete all messages in this team chat. This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowClearChatConfirm(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmClearChat}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Clear Chat
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Message Confirmation Modal */}
      <AnimatePresence>
        {showDeleteMessageConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteMessageConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Delete Message
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDeleteMessageConfirm(false);
                      setMessageToDelete(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDeleteMessage}
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
