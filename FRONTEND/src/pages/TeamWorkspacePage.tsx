import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Calendar, 
  CheckSquare, 
  Package, 
  MessageSquare, 
  Settings, 
  MoreVertical,
  Clock,
  AlertCircle,
  User,
  Edit,
  Trash2,
  Archive,
  Filter,
  Search,
  Star
} from 'lucide-react'

const teams = [
  {
    id: 1,
    name: 'Robotics Club',
    description: 'Building autonomous robots for competitions',
    members: 12,
    role: 'Admin',
    avatar: '🤖',
    color: 'from-blue-500 to-indigo-500',
    stats: {
      items: 24,
      activeTasks: 8,
      completedTasks: 45
    }
  },
  {
    id: 2,
    name: 'Chemistry Lab Team',
    description: 'Managing lab equipment and research materials',
    members: 8,
    role: 'Member',
    avatar: '⚗️',
    color: 'from-green-500 to-emerald-500',
    stats: {
      items: 18,
      activeTasks: 3,
      completedTasks: 22
    }
  },
  {
    id: 3,
    name: 'Photography Society',
    description: 'Sharing cameras and photography equipment',
    members: 15,
    role: 'Member',
    avatar: '📸',
    color: 'from-purple-500 to-pink-500',
    stats: {
      items: 31,
      activeTasks: 5,
      completedTasks: 38
    }
  }
]

const tasks = [
  {
    id: 1,
    title: 'Organize camera equipment inventory',
    description: 'Catalog all lenses, cameras, and accessories with condition reports',
    assignee: 'Sarah Johnson',
    dueDate: '2024-01-25',
    priority: 'high',
    status: 'in_progress',
    team: 'Photography Society',
    labels: ['inventory', 'urgent']
  },
  {
    id: 2,
    title: 'Schedule maintenance for lab microscopes',
    description: 'Contact vendor for annual maintenance of all microscopes',
    assignee: 'Alex Kumar',
    dueDate: '2024-01-30',
    priority: 'medium',
    status: 'pending',
    team: 'Chemistry Lab Team',
    labels: ['maintenance', 'equipment']
  },
  {
    id: 3,
    title: 'Update robot parts checklist',
    description: 'Create comprehensive checklist for competition preparation',
    assignee: 'You',
    dueDate: '2024-01-22',
    priority: 'high',
    status: 'completed',
    team: 'Robotics Club',
    labels: ['competition', 'documentation']
  }
]

const recentActivity = [
  {
    id: 1,
    type: 'task_completed',
    user: 'Sarah Johnson',
    action: 'completed task',
    target: 'Equipment calibration',
    team: 'Chemistry Lab Team',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'item_added',
    user: 'Mike Chen',
    action: 'added new item',
    target: 'Canon EOS R5',
    team: 'Photography Society',
    time: '4 hours ago'
  },
  {
    id: 3,
    type: 'member_joined',
    user: 'Emma Davis',
    action: 'joined team',
    target: 'Robotics Club',
    team: 'Robotics Club',
    time: '1 day ago'
  }
]

export default function TeamWorkspacePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTeam, setSelectedTeam] = useState(teams[0])
  const [taskFilter, setTaskFilter] = useState('all')
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'activity', label: 'Activity', icon: MessageSquare }
  ]

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true
    if (taskFilter === 'my_tasks') return task.assignee === 'You'
    if (taskFilter === 'team') return task.team === selectedTeam.name
    return task.status === taskFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Team Workspace
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Collaborate and manage shared resources
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <Plus className="h-5 w-5 mr-2" />
              Create Team
            </button>
            <button 
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Task
            </button>
          </div>
        </motion.div>

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
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTeam.id === team.id
                        ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${team.color} flex items-center justify-center text-white text-lg`}>
                        {team.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {team.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {team.members} members • {team.role}
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
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${selectedTeam.color} flex items-center justify-center text-white text-2xl`}>
                    {selectedTeam.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTeam.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedTeam.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{selectedTeam.members} members</span>
                      <span>•</span>
                      <span>Your role: {selectedTeam.role}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Settings className="h-5 w-5" />
                </button>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-3 gap-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedTeam.stats.items}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedTeam.stats.activeTasks}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedTeam.stats.completedTasks}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                </div>
              </div>
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
                        onClick={() => setActiveTab(tab.id)}
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
                            <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Assigned to: {task.assignee}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 text-xs rounded border ${priorityColors[task.priority]}`}>
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
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                        <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {task.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded border ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${statusColors[task.status]}`}>
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
                              {task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {task.labels.map((label) => (
                                    <span
                                      key={label}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
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
                    className="text-center py-12"
                  >
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Team Inventory
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Coming soon - Manage your team's shared equipment and resources
                    </p>
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
                      <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
    </div>
  )
}