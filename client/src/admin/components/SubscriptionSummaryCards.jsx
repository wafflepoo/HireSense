import React from 'react';
import {
  FaChartPie,
  FaUser,
  FaBriefcase,
  FaInfinity,
  FaBuilding,
  FaCrown
} from 'react-icons/fa';

const SubscriptionSummaryCards = ({ users = [] }) => {
const starterUsers = users.filter(u => u.subscription?.tier?.toLowerCase() === "starter");
const proUsers = users.filter(u => u.subscription?.tier?.toLowerCase() === "pro");
const enterpriseUsers = users.filter(u => u.subscription?.tier?.toLowerCase() === "enterprise");
  console.log(users,proUsers,starterUsers,enterpriseUsers );
  console.log(users.map(u => u.subscription?.tier));


  const starterOverLimit = starterUsers.filter(
    u => u.subscription.cvProcessedThisMonth > u.subscription.maxCvLimit
  ).length;

  return (
    <div className="bg-white shadow p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <FaChartPie className="text-indigo-600 mr-2" /> Résumé des Abonnements
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-blue-800 flex items-center">
                <FaUser className="mr-2" /> Starter
              </h3>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {starterUsers.length}
              </p>
              <p className="text-sm text-blue-700 mt-1">utilisateurs</p>
            </div>
            <div className="bg-blue-200 text-blue-800 p-3 rounded-full">
              <FaUser size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-200">
            <div className="flex items-center text-sm">
              <div className={`px-2 py-1 rounded-full ${
                starterOverLimit > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <span className="font-medium">
                  {starterOverLimit}
                </span> dépassements
              </div>
            </div>
          </div>
        </div>

        {/* Pro Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-green-800 flex items-center">
                <FaBriefcase className="mr-2" /> Pro
              </h3>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {proUsers.length}
              </p>
              <p className="text-sm text-green-700 mt-1">utilisateurs</p>
            </div>
            <div className="bg-green-200 text-green-800 p-3 rounded-full">
              <FaBriefcase size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-green-200">
            <div className="flex items-center text-sm text-green-700">
              <FaInfinity className="mr-1" /> CVs illimités
            </div>
          </div>
        </div>

        {/* Entreprise Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-purple-800 flex items-center">
                <FaBuilding className="mr-2" /> Entreprise
              </h3>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {enterpriseUsers.length}
              </p>
              <p className="text-sm text-purple-700 mt-1">utilisateurs</p>
            </div>
            <div className="bg-purple-200 text-purple-800 p-3 rounded-full">
              <FaBuilding size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-200">
            <div className="flex items-center text-sm text-purple-700">
              <FaCrown className="mr-1" /> Solution premium
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSummaryCards;