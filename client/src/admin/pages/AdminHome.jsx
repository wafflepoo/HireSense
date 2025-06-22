/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';

// StatCard Component
const StatCard = ({ icon, title, value, trend, link, accentColor, iconColor, cardBg }) => {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50'
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 01-1.414 0L10 5.586 8.414 7a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2A1 1 0 0112 7z" clipRule="evenodd" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 13a1 1 0 01-1.414 0L10 11.414 8.414 13a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l2 2A1 1 0 0112 13z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={`${cardBg} rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 text-gray-800">{value?.toLocaleString() || '0'}</p>
          </div>
          <div className={`p-3 rounded-lg ${accentColor}`}>
            <img src={icon} className={`w-6 h-6 ${iconColor}`} alt="" />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center">
            <span className={`inline-flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${trendColors[trend.direction]}`}>
              {trendIcons[trend.direction]}
              <span>{trend.value}%</span>
            </span>
            <span className="text-xs text-gray-500 ml-2">vs last month</span>
          </div>
        )}
      </div>

      {link && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 group-hover:bg-gray-100 transition-colors">
          <Link to={link} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center group">
            View details
            <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

// SubscriptionPill Component
const SubscriptionPill = ({ tier, count, percentage, colorScheme, icon }) => {
  const colorMap = {
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200'
    }
  };

  const colors = colorMap[colorScheme] || colorMap.indigo;

  return (
    <div className={`${colors.bg} ${colors.border} ${colors.text} border rounded-full px-4 py-2 flex items-center shadow-xs hover:shadow-sm transition-shadow`}>
      <span className="mr-2">{icon}</span>
      <span className="font-medium">{tier.toUpperCase()}</span>
      <span className="mx-2">·</span>
      <span className="font-bold">{count}</span>
      <span className="ml-2 text-xs">({percentage}%)</span>
    </div>
  );
};

// ActivityItem Component
const ActivityItem = ({ activity }) => {
  const iconColors = {
    subscription: 'bg-indigo-100 text-indigo-600',
    job: 'bg-purple-100 text-purple-600',
    cv: 'bg-teal-100 text-teal-600'
  };

  const timeColors = {
    subscription: 'text-indigo-500',
    job: 'text-purple-500',
    cv: 'text-teal-500'
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors duration-150 group">
      <div className="flex items-start">
        <div className={`flex-shrink-0 p-2 rounded-lg ${iconColors[activity.type]} group-hover:bg-opacity-80 transition-all`}>
          <img src={activity.icon} className="w-5 h-5" alt="" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            <span className="font-semibold">{activity.user}</span> {activity.action}
          </p>
          <div className="flex justify-between items-center mt-1">
            <p className={`text-xs ${timeColors[activity.type]} font-medium`}>{activity.time}</p>
            <div className="text-xs text-gray-400 group-hover:text-gray-500">
              {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds/60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds/3600)} hours ago`;
  return `${Math.floor(diffInSeconds/86400)} days ago`;
};

// Main AdminHome Component
const AdminHome = () => {
  const { backendUrl, isAdmin } = useContext(AppContext);
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        
        const api = axios.create({
          baseURL: backendUrl,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Fetch all data in parallel
        const [statsRes, usersRes, jobsRes, activitiesRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/users'),
          api.get('/api/jobs?status=active'),
          api.get('/api/admin/activities').catch(() => ({ data: { activities: [] } })) // Make activities optional
        ]);

        // Process users data for subscriptions
        const users = usersRes.data?.data || [];
        const subscriptionCounts = users.reduce((acc, user) => {
          const plan = user.subscription?.plan || 'none';
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        }, { starter: 0, pro: 0, enterprise: 0 });

        const totalSubscribed = subscriptionCounts.Starter + subscriptionCounts.Pro + subscriptionCounts.Enterprise;

        // Format activities
        const activities = activitiesRes.data?.activities || [];
        const formattedActivities = activities.map(activity => ({
          id: activity.id,
          user: activity.userName || 'Unknown',
          action: activity.action || 'performed an action',
          time: formatTimeAgo(activity.timestamp || new Date()),
          type: activity.type === 'application' ? 'cv' : 
                activity.type === 'job_post' ? 'job' : 'subscription',
          icon: activity.type === 'application' ? assets.cv_icon :
                activity.type === 'job_post' ? assets.job_icon : assets.subscription_icon,
          timestamp: activity.timestamp || new Date()
        }));

        setStats({
          totalUsers: { 
            value: statsRes.data?.data?.totalUsers || 0,
            trend: statsRes.data?.data?.totalUsersTrend || { direction: 'neutral', value: 0 }
          },
          activeJobs: {
            value: jobsRes.data?.jobs?.length || 0,
            trend: statsRes.data?.data?.jobTrend || { direction: 'neutral', value: 0 }
          },
          processedCVs: {
            value: statsRes.data?.data?.processedCVs || 0,
            trend: statsRes.data?.data?.cvTrend || { direction: 'neutral', value: 0 }
          },
          subscriptions: {
            starter: {
              count: subscriptionCounts.Starter,
              percentage: totalSubscribed > 0 ? Math.round((subscriptionCounts.Starter / totalSubscribed) * 100) : 0
            },
            pro: {
              count: subscriptionCounts.Pro,
              percentage: totalSubscribed > 0 ? Math.round((subscriptionCounts.Pro / totalSubscribed) * 100) : 0
            },
            enterprise: {
              count: subscriptionCounts.Enterprise,
              percentage: totalSubscribed > 0 ? Math.round((subscriptionCounts.Enterprise / totalSubscribed) * 100) : 0
            }
          },
          recentActivities: formattedActivities
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError({
          message: err.response?.data?.message || err.message,
          status: err.response?.status
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl, isAdmin, getToken]);



  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">You don't have admin privileges</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">
          {error.status === 404 
            ? "API endpoint not found. Please check your backend configuration."
            : `Error: ${error.message}`}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={assets.users_icon}
          title="Users" 
          value={stats.totalUsers.value}
          trend={stats.totalUsers.trend}
          link="/admin/users"
          accentColor="bg-gradient-to-br from-indigo-100 to-indigo-50"
          iconColor="text-indigo-600"
          cardBg="bg-gradient-to-br from-indigo-50 to-white"
        />
        <StatCard 
          icon={assets.job_icon}
          title="Active Jobs" 
          value={stats.activeJobs.value}
          trend={stats.activeJobs.trend}
          link="/admin/jobs"
          accentColor="bg-gradient-to-br from-purple-100 to-purple-50"
          iconColor="text-purple-600"
          cardBg="bg-gradient-to-br from-purple-50 to-white"
        />
        <StatCard 
          icon={assets.cv_icon}
          title="Processed CVs" 
          value={stats.processedCVs.value}
          trend={stats.processedCVs.trend}
          accentColor="bg-gradient-to-br from-teal-100 to-teal-50"
          iconColor="text-teal-600"
          cardBg="bg-gradient-to-br from-teal-50 to-white"
        />
        <StatCard 
          icon={assets.clock_icon}
          title="Recent Activity" 
          value={stats.recentActivities.length}
          trend={{ direction: 'up', value: 18 }}
          accentColor="bg-gradient-to-br from-amber-100 to-amber-50"
          iconColor="text-amber-600"
          cardBg="bg-gradient-to-br from-amber-50 to-white"
        />
      </div>

      {/* Subscription Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-800">Subscription Distribution</h2>
          <p className="text-sm text-gray-500 mt-1">Current subscription plans</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3 mb-6">
            <SubscriptionPill 
              tier="starter" 
              count={stats.subscriptions.starter.count} 
              percentage={stats.subscriptions.starter.percentage}
              colorScheme="orange"
              icon="⭐"
            />
            <SubscriptionPill 
              tier="pro" 
              count={stats.subscriptions.pro.count} 
              percentage={stats.subscriptions.pro.percentage}
              colorScheme="indigo"
              icon="🚀"
            />
            <SubscriptionPill 
              tier="enterprise" 
              count={stats.subscriptions.enterprise.count} 
              percentage={stats.subscriptions.enterprise.percentage}
              colorScheme="emerald"
              icon="🏢"
            />
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-500" 
                style={{ width: `${stats.subscriptions.starter.percentage}%` }}
              ></div>
              <div 
                className="bg-gradient-to-r from-indigo-400 to-indigo-500" 
                style={{ width: `${stats.subscriptions.pro.percentage}%` }}
              ></div>
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500" 
                style={{ width: `${stats.subscriptions.enterprise.percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Starter</span>
            <span>Pro</span>
            <span>Enterprise</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-sm text-gray-500 mt-1">Latest actions on the platform</p>
            </div>
            <Link to="/admin/activities" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center group">
              View all
              <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;