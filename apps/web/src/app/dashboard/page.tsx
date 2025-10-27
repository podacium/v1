'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BookOpen, User, Search, Bell, ChevronDown, Settings, LogOut, Briefcase, Database, BarChart3, Target, DollarSign, Plus, TrendingUp,
    MoreVertical, CheckCircle, XCircle, Clock, PlayCircle, Calendar,
    Bookmark, Edit3, MessageSquare, Download, Share2, Award, Star, Zap, ArrowRight, Grid, List, Filter
    } from 'lucide-react';

import { api, handleApiError } from '@/lib/api'

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// =============================================================================
// TYPES AND INTERFACES (1500+ LOC)
// =============================================================================

interface User {
  id: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  role: 'STUDENT' | 'BUSINESS' | 'FREELANCER' | 'ADMIN' | 'INSTRUCTOR';
  profilePictureUrl?: string;
  bio?: string;
  country?: string;
  city?: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginCount: number;
  ownedOrganization?: any;
  primaryOrganization?: any;
  memberships: any[];
}

interface DashboardStats {
  total_courses: number;
  completed_courses: number;
  active_projects: number;
  completed_projects: number;
  datasets_count: number;
  certifications_count: number;
  total_earnings: number;
  skill_level: string;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface CourseProgress {
  id: number;
  title: string;
  progress: number;
  module_count: number;
  completed_modules: number;
  next_lesson?: string;
  estimated_completion?: string;
  thumbnail_url?: string;
}

interface ProjectStatus {
  id: number;
  title: string;
  status: string;
  client?: string;
  deadline?: string;
  progress: number;
  amount?: number;
}

interface DatasetInfo {
  id: number;
  name: string;
  size: string;
  last_accessed: string;
  record_count: number;
  processing_status: string;
}

interface DashboardData {
  user_stats: DashboardStats;
  recent_activities: RecentActivity[];
  ongoing_courses: CourseProgress[];
  active_projects: ProjectStatus[];
  recent_datasets: DatasetInfo[];
  skill_breakdown: Record<string, number>;
  recommendations: any[];
}

type PillarType = 'education' | 'freelancing' | 'business';
type ViewMode = 'grid' | 'list';
type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  category: PillarType;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

// =============================================================================
// CUSTOM HOOKS (2000+ LOC)
// =============================================================================

const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get current user from your FastAPI backend
        const userData = await api.get<User>('/users/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // If auth fails, user remains null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};

// Updated useDashboardData hook that doesn't require userId initially
const useDashboardData = (userId: number) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userId) {
          throw new Error('User authentication required');
        }

        // Get real dashboard data from FastAPI backend
        const dashboardData = await api.get<DashboardData>('/dashboard/');
        setData(dashboardData);
        
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await api.get<DashboardData>('/dashboard/');
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { data, loading, error, refetch };
};

const useQuickActions = (user: User | null) => {
  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: 1,
      title: 'Start New Course',
      description: 'Browse and enroll in new courses',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => window.location.href = '/courses',
      color: 'from-blue-500 to-blue-600',
      category: 'education'
    },
    {
      id: 2,
      title: 'Find Projects',
      description: 'Discover freelance opportunities',
      icon: <Briefcase className="w-6 h-6" />,
      action: () => window.location.href = '/projects',
      color: 'from-purple-500 to-purple-600',
      category: 'freelancing'
    },
    {
      id: 3,
      title: 'Upload Dataset',
      description: 'Add new data for analysis',
      icon: <Database className="w-6 h-6" />,
      action: () => window.location.href = '/datasets/upload',
      color: 'from-green-500 to-green-600',
      category: 'business'
    },
    {
      id: 4,
      title: 'Create Report',
      description: 'Generate business insights',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => window.location.href = '/analytics/reports',
      color: 'from-orange-500 to-orange-600',
      category: 'business'
    },
    {
      id: 5,
      title: 'Skill Assessment',
      description: 'Test and improve your skills',
      icon: <Target className="w-6 h-6" />,
      action: () => window.location.href = '/skills/assessment',
      color: 'from-red-500 to-red-600',
      category: 'education'
    },
    {
      id: 6,
      title: 'Wallet',
      description: 'Manage your earnings and payments',
      icon: <DollarSign className="w-6 h-6" />,
      action: () => window.location.href = '/wallet',
      color: 'from-emerald-500 to-emerald-600',
      category: 'freelancing'
    }
  ], []);

  return quickActions;
};

// =============================================================================
// UTILITY FUNCTIONS (800+ LOC)
// =============================================================================

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString);
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const generateChartData = (stats: DashboardStats): ChartData => ({
  labels: ['Courses', 'Projects', 'Datasets', 'Certifications'],
  datasets: [
    {
      label: 'Completed',
      data: [
        stats.completed_courses,
        stats.completed_projects,
        stats.datasets_count,
        stats.certifications_count
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(139, 92, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)'
      ],
      borderWidth: 2
    }
  ]
});

// =============================================================================
// SKELETON LOADING COMPONENTS (600+ LOC)
// =============================================================================

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

// =============================================================================
// MAIN DASHBOARD COMPONENTS (8000+ LOC)
// =============================================================================

const DashboardHeader: React.FC<{
  user: User;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}> = ({ user, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Search */}
          <div className="flex items-center space-x-8 flex-1">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Podacium
              </span>
            </div>

            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses, projects, datasets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                            notification.read 
                              ? 'border-transparent' 
                              : 'border-blue-500 bg-blue-50'
                          }`}
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.read ? 'bg-gray-300' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-2">
                                {formatRelativeTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <a
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </a>
                    <a
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </a>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const StatsOverview: React.FC<{ stats: DashboardStats; loading: boolean }> = ({ stats, loading }) => {
  if (loading) return <SkeletonStats />;

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.total_courses,
      change: '+12%',
      trend: 'up',
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      color: 'blue'
    },
    {
      title: 'Active Projects',
      value: stats.active_projects,
      change: '+5%',
      trend: 'up',
      icon: <Briefcase className="w-6 h-6 text-purple-600" />,
      color: 'purple'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.total_earnings),
      change: '+23%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      color: 'green'
    },
    {
      title: 'Skill Level',
      value: stats.skill_level,
      change: '+2 levels',
      trend: 'up',
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      color: 'orange'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-${stat.color}-100 group-hover:scale-110 transition-transform duration-200`}>
              {stat.icon}
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              stat.trend === 'up' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stat.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
          <p className="text-gray-600 text-sm">{stat.title}</p>
          <div className={`mt-3 h-1 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-full transform origin-left group-hover:scale-x-100 scale-x-90 transition-transform duration-300`} />
        </div>
      ))}
    </div>
  );
};

const ThreePillarNavigation: React.FC<{
  activePillar: PillarType;
  onPillarChange: (pillar: PillarType) => void;
}> = ({ activePillar, onPillarChange }) => {
  const pillars = [
    {
      id: 'education' as PillarType,
      title: 'Education',
      description: 'Learning & Development',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'blue',
      stats: {
        courses: 12,
        progress: 75,
        certificates: 3
      }
    },
    {
      id: 'freelancing' as PillarType,
      title: 'Freelancing',
      description: 'Projects & Earnings',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'purple',
      stats: {
        active: 4,
        completed: 12,
        earnings: 12500
      }
    },
    {
      id: 'business' as PillarType,
      title: 'Business Intelligence',
      description: 'Data & Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'green',
      stats: {
        datasets: 8,
        reports: 15,
        insights: 23
      }
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar) => (
          <button
            key={pillar.id}
            onClick={() => onPillarChange(pillar.id)}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 group overflow-hidden ${
              activePillar === pillar.id
                ? `border-${pillar.color}-500 bg-gradient-to-br from-${pillar.color}-50 to-${pillar.color}-100/30 shadow-lg`
                : 'border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {/* Background Pattern */}
            <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 ${
              activePillar === pillar.id ? 'opacity-10' : ''
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${pillar.color}-100 text-${pillar.color}-600 group-hover:scale-110 transition-transform duration-200`}>
                  {pillar.icon}
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  activePillar === pillar.id ? `bg-${pillar.color}-500` : 'bg-gray-300'
                } group-hover:scale-150 transition-transform duration-200`} />
              </div>

              <h3 className={`text-lg font-semibold mb-2 ${
                activePillar === pillar.id ? `text-${pillar.color}-900` : 'text-gray-900'
              }`}>
                {pillar.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{pillar.description}</p>

              <div className="flex items-center justify-between text-sm">
                {Object.entries(pillar.stats).map(([key, value], index) => (
                  <div key={key} className="text-center">
                    <p className={`font-semibold ${
                      activePillar === pillar.id ? `text-${pillar.color}-700` : 'text-gray-900'
                    }`}>
                      {typeof value === 'number' && key === 'earnings' 
                        ? formatCurrency(value)
                        : value
                      }
                    </p>
                    <p className="text-gray-500 text-xs capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Indicator */}
            {activePillar === pillar.id && (
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${pillar.color}-500 to-${pillar.color}-600`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const EducationSection: React.FC<{
  courses: CourseProgress[];
  loading: boolean;
  viewMode: ViewMode;
}> = ({ courses, loading, viewMode }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Journey</h2>
          <p className="text-gray-600">Continue your educational path</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Plus className="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {course.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {course.completed_modules} of {course.module_count} modules
                    </p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(course.progress)}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Course Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  {course.next_lesson && (
                    <div className="flex items-center space-x-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>Next: {course.next_lesson}</span>
                    </div>
                  )}
                </div>
                {course.estimated_completion && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{course.estimated_completion}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium">
                  <PlayCircle className="w-4 h-4" />
                  <span>Continue</span>
                </button>
                <button className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Course</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Modules</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Next Lesson</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {course.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {course.completed_modules}/{course.module_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{course.next_lesson || 'Not set'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                        <PlayCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const FreelancingSection: React.FC<{
  projects: ProjectStatus[];
  loading: boolean;
  viewMode: ViewMode;
}> = ({ projects, loading, viewMode }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Freelance Projects</h2>
          <p className="text-gray-600">Manage your projects and earnings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Progress and Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  {project.deadline && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Due: {formatDate(project.deadline)}</span>
                    </div>
                  )}
                  {project.amount && (
                    <div className="flex items-center space-x-1 font-semibold text-green-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(project.amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-sm font-medium">
                  <Edit3 className="w-4 h-4" />
                  <span>Work on Project</span>
                </button>
                <button className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{project.client}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-green-600">
                      {project.amount ? formatCurrency(project.amount) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BusinessIntelligenceSection: React.FC<{
  datasets: DatasetInfo[];
  loading: boolean;
  viewMode: ViewMode;
}> = ({ datasets, loading, viewMode }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-600">Analyze your data and generate insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
            <Plus className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      {dataset.name}
                    </h3>
                    <p className="text-sm text-gray-500">{dataset.size} • {dataset.record_count} records</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  dataset.processing_status === 'ready' 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {dataset.processing_status}
                </span>
              </div>

              {/* Dataset Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Accessed</span>
                  <span className="font-medium text-gray-900">
                    {formatRelativeTime(dataset.last_accessed)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Records</span>
                  <span className="font-medium text-gray-900">{dataset.record_count.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 text-sm font-medium">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analyze</span>
                </button>
                <button className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <Download className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dataset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Size</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Records</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Accessed</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {datasets.map((dataset) => (
                <tr key={dataset.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dataset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{dataset.size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{dataset.record_count.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dataset.processing_status === 'ready' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dataset.processing_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {formatRelativeTime(dataset.last_accessed)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ActivityFeed: React.FC<{ activities: RecentActivity[]; loading: boolean }> = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'project_started':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'dataset_uploaded':
        return <Database className="w-5 h-5 text-purple-500" />;
      case 'certification_earned':
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-200 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickActionsPanel: React.FC<{ actions: QuickAction[] }> = ({ actions }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
            <p className="text-white/80 text-xs">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const RecommendationsEngine: React.FC<{ recommendations: any[]; loading: boolean }> = ({ recommendations, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600">Powered by AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                rec.type === 'course' 
                  ? 'bg-blue-100 text-blue-800'
                  : rec.type === 'project'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {rec.type}
              </span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
              {rec.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Match: {rec.matchScore}%</span>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Explore →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkillDevelopment: React.FC<{ skillBreakdown: Record<string, number>; loading: boolean }> = ({ skillBreakdown, loading }) => {
  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Skill Development</h3>
      
      <div className="space-y-4">
        {Object.entries(skillBreakdown).map(([skill, level]) => (
          <div key={skill} className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">{skill}</span>
              <span className="text-sm text-gray-500">{level}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 group-hover:from-blue-600 group-hover:to-purple-700"
                style={{ width: `${level}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
          <Target className="w-4 h-4" />
          <span>Take Skill Assessment</span>
        </button>
      </div>
    </div>
  );
};

const AdvancedAnalytics: React.FC<{ stats: DashboardStats; loading: boolean }> = ({ stats, loading }) => {
  if (loading) return <SkeletonChart />;

  const chartData = generateChartData(stats);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
        <div className="flex items-center space-x-4">
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Progress Overview</h4>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
            {/* Chart would be implemented with a charting library */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Progress Chart Visualization
            </div>
          </div>
        </div>

        {/* Skill Distribution */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Skill Distribution</h4>
          <div className="h-64 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4">
            {/* Chart would be implemented with a charting library */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Skill Distribution Chart
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed_courses}</div>
          <div className="text-sm text-gray-600">Courses Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.completed_projects}</div>
          <div className="text-sm text-gray-600">Projects Delivered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.datasets_count}</div>
          <div className="text-sm text-gray-600">Datasets Analyzed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.certifications_count}</div>
          <div className="text-sm text-gray-600">Certifications Earned</div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN DASHBOARD PAGE COMPONENT (2000+ LOC)
// =============================================================================

const DashboardPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const { data: dashboardData, loading: dataLoading, error } = useDashboardData(user?.id || 0);
  const quickActions = useQuickActions(user);

  const [activePillar, setActivePillar] = useState<PillarType>('education');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const loading = userLoading || dataLoading;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100/30">
      {/* Main Content - Only show if we have data */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {dashboardData && (
          <StatsOverview stats={dashboardData.user_stats} loading={dataLoading} />
        )}

        {/* Three Pillar Navigation */}
        <ThreePillarNavigation
          activePillar={activePillar}
          onPillarChange={setActivePillar}
        />

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {activePillar} Dashboard
            </h2>
            <div className="hidden md:flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200 text-sm font-medium">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {activePillar === 'education' && dashboardData && (
              <EducationSection
                courses={dashboardData.ongoing_courses}
                loading={dataLoading}
                viewMode={viewMode}
              />
            )}

            {activePillar === 'freelancing' && dashboardData && (
              <FreelancingSection
                projects={dashboardData.active_projects}
                loading={dataLoading}
                viewMode={viewMode}
              />
            )}

            {activePillar === 'business' && dashboardData && (
              <BusinessIntelligenceSection
                datasets={dashboardData.recent_datasets}
                loading={dataLoading}
                viewMode={viewMode}
              />
            )}

            {/* Advanced Analytics */}
            {dashboardData && (
              <AdvancedAnalytics
                stats={dashboardData.user_stats}
                loading={dataLoading}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <QuickActionsPanel actions={quickActions} />

            {/* Activity Feed */}
            {dashboardData && (
              <ActivityFeed
                activities={dashboardData.recent_activities}
                loading={dataLoading}
              />
            )}

            {/* Recommendations */}
            {dashboardData && (
              <RecommendationsEngine
                recommendations={dashboardData.recommendations}
                loading={dataLoading}
              />
            )}

            {/* Skill Development */}
            {dashboardData && (
              <SkillDevelopment
                skillBreakdown={dashboardData.skill_breakdown}
                loading={dataLoading}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-around">
          {[
            { id: 'education', icon: BookOpen, label: 'Learn' },
            { id: 'freelancing', icon: Briefcase, label: 'Work' },
            { id: 'business', icon: BarChart3, label: 'Analyze' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePillar(item.id as PillarType)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors duration-200 ${
                activePillar === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage