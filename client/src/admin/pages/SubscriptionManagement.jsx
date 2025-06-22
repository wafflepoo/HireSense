import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  HiCheck as CheckIcon, 
  HiX as XIcon, 
  HiExclamation as ExclamationIcon,
  HiArrowUp as ArrowUpIcon,
  HiArrowDown as ArrowDownIcon,
  HiFilter as FilterIcon,
  HiSearch as SearchIcon
} from 'react-icons/hi';
import SubscriptionSummaryCards from '../components/SubscriptionSummaryCards';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { AppContext } from '../../context/AppContext';

const SubscriptionManagement = () => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { backendUrl } = useContext(AppContext);

const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const token = await getToken();
    const response = await axios.get(`${backendUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    

    if (response.data?.success) {
      const formattedUsers = response.data.data.map(user => ({
        id: user._id,
        name: user.name || `${user.firstName} ${user.lastName}` || 'Unknown User',
        email: user.email,
        role: user.role || 'candidate',
        status: user.status || 'active',
        joined: user.createdAt || new Date().toISOString(),
        subscription: {
          tier: user.subscription?.plan || 'Starter',
          startDate: user.subscription?.startDate || new Date().toISOString(),
          cvProcessedThisMonth: user.subscription?.cvProcessedThisMonth || 0,
          maxCvLimit: user.subscription?.maxCvLimit || 
                    (user.subscription?.plan === 'Starter' ? 500 : null)
        }
      }));
      
      setUsers(formattedUsers);
    } else {
      setError(response.data?.message || 'Invalid response format');
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    setError(err.response?.data?.message || 'Failed to fetch users');
  } finally {
    setLoading(false);
  }
}, [getToken, backendUrl]);

useEffect(() => {
  fetchUsers();
}, [fetchUsers]);
const handleSubscriptionChange = async (userId, newTier) => {
  try {
    const token = await getToken();
    // Ensure newTier is exactly 'Starter', 'Pro', or 'Enterprise'
    console.log(newTier)
    const validPlans = ['Starter', 'Pro', 'Enterprise'];
    if (!validPlans.includes(newTier)) {
      throw new Error("Invalid subscription plan selected");
    }

    const response = await axios.put(
      `${backendUrl}/api/admin/subscriptions/${userId}`,
      { plan: newTier },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            subscription: {
              ...user.subscription,
              tier: newTier,
              maxCvLimit: newTier === 'Starter' ? 500 : null,
              cvProcessedThisMonth: newTier === 'Starter' ? 0 : user.subscription.cvProcessedThisMonth
            }
          };
        }
        return user;
      }));
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
};
  const filteredUsers = users
    .filter(user => filter === 'all' || user.subscription.tier === filter)
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getTierColor = (tier) => {
    switch(tier) {
      case 'Starter': return 'bg-blue-100 text-blue-800';
      case 'Pro': return 'bg-green-100 text-green-800';
      case 'Enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isNearLimit = (user) => {
    return user.subscription.tier === "Starter" && 
           user.subscription.cvProcessedThisMonth >= user.subscription.maxCvLimit * 0.9;
  };

  const hasExceededLimit = (user) => {
    return user.subscription.tier === "Starter" && 
           user.subscription.cvProcessedThisMonth > user.subscription.maxCvLimit;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center py-4">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestion des Abonnements</h1>
      
      <SubscriptionSummaryCards users={users} />
      
      <div className="mt-8 bg-white shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Rechercher utilisateurs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <FilterIcon className="h-5 w-5 text-gray-500" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les abonnements</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date début
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisation CV
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={hasExceededLimit(user) ? "bg-red-50" : isNearLimit(user) ? "bg-yellow-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600">{user.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTierColor(user.subscription.tier)}`}>
                        {user.subscription.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.subscription.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription.tier === "Starter" ? (
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${
                                hasExceededLimit(user) ? 'bg-red-600' : 
                                isNearLimit(user) ? 'bg-yellow-500' : 'bg-blue-600'
                              }`} 
                              style={{
                                width: `${Math.min(100, (user.subscription.cvProcessedThisMonth / user.subscription.maxCvLimit) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className={`text-sm ${
                            hasExceededLimit(user) ? 'text-red-600 font-bold' : 
                            isNearLimit(user) ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {user.subscription.cvProcessedThisMonth}/{user.subscription.maxCvLimit}
                          </span>
                          {hasExceededLimit(user) && (
                            <ExclamationIcon className="ml-1 h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {user.subscription.cvProcessedThisMonth} CVs traités
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.subscription.tier !== "Pro" && (
                          <button
                            onClick={() => handleSubscriptionChange(user.id, "Pro")}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                            Passer Pro
                          </button>
                        )}
                        {user.subscription.tier !== "Starter" && (
                          <button
                            onClick={() => handleSubscriptionChange(user.id, "Starter")}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <ArrowDownIcon className="h-4 w-4 mr-1" />
                            Passer Starter
                          </button>
                        )}
                        {user.subscription.tier !== "Enterprise" && (
                          <button
                            onClick={() => handleSubscriptionChange(user.id, "Enterprise")}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Enterprise
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;