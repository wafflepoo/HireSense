import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const AdminRoute = () => {
  const { isLoaded, user } = useUser();
  const { isAdmin } = useContext(AppContext);
  const location = useLocation();

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    // Redirect to home but preserve the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet/>;
};

export default AdminRoute;