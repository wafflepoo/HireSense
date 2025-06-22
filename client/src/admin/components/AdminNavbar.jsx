
import { Link, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { assets } from '../../assets/assets';

const AdminNavbar = () => {
 const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  return (
    <div className='shadow py-2'>
      <div className='container px-4 mx-auto flex justify-between items-center'>
        {/* Logo - Same as main navbar */}
        <img 
          onClick={() => navigate('/admin')} 
          className='cursor-pointer' 
          src={assets.logo} 
          alt="Admin Logo" 
        />

        {/* Right Side - Matches original navbar styling */}
        {isLoaded && user?.id ? (
          <div className='flex items-center gap-4'>
            <Link to='/admin/users' className='text-blue-600'>Gestion Utilisateurs</Link>
            <p> | </p>
            <Link to='/admin/stats' className='text-blue-600'>Statistiques</Link>
            <p> | </p>
            <p className='max-sm:hidden'>Admin: {user.firstName}</p>
            <UserButton afterSignOutUrl='/' />
          </div>
        ) : (
          <div className='flex gap-4 max-sm:text-xs'>
            <button 
              onClick={() => navigate('/')} 
              className='text-gray-600'
            >
              Retour au site
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbar;