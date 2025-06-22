import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineEye, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';


const UserManagement = () => {
  const { backendUrl } = useContext(AppContext);
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`${backendUrl}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          // Transform backend data to match frontend structure
          const formattedUsers = response.data.data.map(user => ({
            id: user._id,
            name: user.name || `${user.firstName} ${user.lastName}` || 'Unknown User',
            email: user.email,
            role: user.role || 'candidate',
            status: user.status || 'active',
            joined: user.createdAt || new Date().toISOString(),
            subscription: user.subscription // Include subscription data if needed
          }));
          
          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        } else {
          setError(response.data.message || 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [backendUrl, getToken]);

  // Filter logic
  useEffect(() => {
    let results = users;
    
    if (searchTerm) {
      results = results.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      results = results.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      results = results.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(results);
  }, [searchTerm, roleFilter, statusFilter, users]);

const handleDelete = async (userId) => {
  if (window.confirm('Are you sure you want to delete this user?')) {
    try {
      const token = await getToken();
      const response = await axios.delete(
        `${backendUrl}/api/admin/users/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.error || 
        'Failed to delete user. Please try again.'
      );
    }
  }
};

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.put(
        `${backendUrl}/api/admin/users/${editingUser.id}/role`,
        { role: editingUser.role, status: editingUser.status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update local state with the edited user
        const updatedUsers = users.map(user => 
          user.id === editingUser.id ? { ...user, ...editingUser } : user
        );
        setUsers(updatedUsers);
        setEditingUser(null);
      } else {
        alert(response.data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  // Role Badge Component
  const RoleBadge = ({ role }) => {
    const roleStyles = {
      candidate: 'bg-blue-50 text-blue-800 border-blue-200',
      recruiter: 'bg-purple-50 text-purple-800 border-purple-200',
      admin: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    };

    const roleLabels = {
      candidate: 'Candidat',
      recruiter: 'Recruteur',
      admin: 'Admin'
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleStyles[role]}`}>
        {roleLabels[role]}
      </div>
    );
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      active: 'bg-green-50 text-green-800 border-green-200',
      pending: 'bg-amber-50 text-amber-800 border-amber-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    const statusLabels = {
      active: 'Actif',
      pending: 'En attente',
      inactive: 'Inactif'
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status]}`}>
        {statusLabels[status]}
      </div>
    );
  };

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
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
          {/* <Link 
            to="/admin/users/new" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Nouvel Utilisateur
          </Link> */}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* ... (keep the existing search and filter UI code) */}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joined).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Modifier"
                          >
                            <HiOutlinePencilAlt className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <HiOutlineTrash className="h-5 w-5" />
                          </button>
                          {/* <Link
                            to={`/admin/users/${user.id}`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Voir"
                          >
                            <HiOutlineEye className="h-5 w-5" />
                          </Link> */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Modifier l'Utilisateur</h2>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <HiOutlineX className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSaveEdit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <select
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        >
                          <option value="candidate">Candidat</option>
                          <option value="recruiter">Recruteur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                        >
                          <option value="active">Actif</option>
                          <option value="pending">En attente</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;