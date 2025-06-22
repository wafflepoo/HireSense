
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useUser } from '@clerk/clerk-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const logout = () => {
    localStorage.removeItem('clerk_session');
    navigate('/');
  };

  return (
    <div className='min-h-screen'>
      {/* Navbar - Matches recruiter dashboard style */}
      <div className='shadow py-4'>
        <div className='px-5 flex justify-between items-center'>
          <img 
            onClick={() => navigate('/admin')} 
            className='cursor-pointer max-sm' 
            src={assets.logo} 
            alt="Admin Logo" 
          />
          
          {user && (
            <div className='flex items-center gap-3'>
              <p className='max-sm:hidden'>Admin: {user.firstName}</p>
              <div className='relative group'>
                <img 
                  className='w-8 border rounded-full' 
                  src={user.imageUrl} 
                  alt="Admin Profile" 
                />
                <div className='absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-12'>
                  <ul className='list-none m-0 p-2 bg-white rounded-md border text-sm'>
                    <li 
                      onClick={logout} 
                      className='py-1 px-2 cursor-pointer pr-10'
                    >
                      Déconnexion
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='flex items-start'>
        {/* Left Sidebar  */}
        <div className='inline-block min-h-screen border-r-2'>
          <ul className='flex flex-col items-start pt-5 text-gray-800'>
            <NavLink 
              className={({isActive}) => `flex items-center p-3 sm:px-6 gap-2 w-full hover:bg-gray-100 ${isActive && 'bg-blue-100 border-r-4 border-blue-500'}`} 
              to={'/admin/users'}
            >
              <img className='min-w-4' src={assets.person_icon} alt="" />
              <p className='max-sm:hidden'>Gestion Utilisateurs</p>
            </NavLink>

            {/* <NavLink 
              className={({isActive}) => `flex items-center p-3 sm:px-6 gap-2 w-full hover:bg-gray-100 ${isActive && 'bg-blue-100 border-r-4 border-blue-500'}`} 
              to={'/admin/stats'}
            >
              <img className='min-w-4' src={assets.chart_icon} alt="" />
              <p className='max-sm:hidden'>Statistiques</p>
            </NavLink> */}

            <NavLink 
              className={({isActive}) => `flex items-center p-3 sm:px-6 gap-2 w-full hover:bg-gray-100 ${isActive && 'bg-blue-100 border-r-4 border-blue-500'}`} 
              to={'/admin/subscriptions'}
            >
              <img className='min-w-4 h-4' src={assets.dollar_icon} alt="" />
              <p className='max-sm:hidden'>Abonnements</p>
            </NavLink>
          </ul>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 p-6'>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;