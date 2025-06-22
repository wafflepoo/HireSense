import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { ROLES, SUBSCRIPTION_TYPES, CV_LIMITS } from "../utils/constant.js";

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -__v');
    res.status(200).json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Server error while fetching users" 
    });
  }
};

// Statistics - Enhanced version
export const getDashboardStats = async (req, res) => {
  try {
    // Count all documents
    const [totalUsers, activeJobs, processedCVs] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      JobApplication.countDocuments()
    ]);

    // Calculate trends (30 days comparison)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [lastMonthUsers, lastMonthJobs, lastMonthCVs] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, status: 'active' }),
      JobApplication.countDocuments({ date: { $gte: thirtyDaysAgo } })
    ]);

    // Calculate percentage changes
    const calculateTrend = (current, lastPeriod) => {
      if (lastPeriod === 0) return { direction: 'neutral', value: 0 };
      const change = ((current - lastPeriod) / lastPeriod) * 100;
      return {
        direction: change >= 0 ? 'up' : 'down',
        value: Math.round(Math.abs(change))
      };
    };

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalUsersTrend: calculateTrend(totalUsers, lastMonthUsers),
        activeJobs,
        jobTrend: calculateTrend(activeJobs, lastMonthJobs),
        processedCVs,
        cvTrend: calculateTrend(processedCVs, lastMonthCVs)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Server error while fetching statistics" 
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid user role" 
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Server error while updating user role" 
    });
  }
};

export const getSubscriptionSummary = async (req, res) => {
  try {
    const [starter, pro, enterprise] = await Promise.all([
      User.aggregate([
        { $match: { 'subscription.tier':req.body.plan} },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            overLimit: {
              $sum: {
                $cond: [
                  { $gt: ['$subscription.cvProcessedThisMonth', '$subscription.maxCvLimit'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      User.countDocuments({ 'subscription.tier': 'Pro' }),
      User.countDocuments({ 'subscription.tier': 'Enterprise' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        starter: {
          count: starter[0]?.count || 0,
          overLimit: starter[0]?.overLimit || 0
        },
        pro: {
          count: pro || 0
        },
        enterprise: {
          count: enterprise || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscription summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription summary'
    });
  }
};

// Subscription Management
export const updateUserSubscription = async (req, res) => {

  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!Object.values(SUBSCRIPTION_TYPES).includes(plan)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid subscription plan" 
      });
    }

    const user = await User.findOneAndUpdate(
      {_id:userId} ,
      { 
        'subscription.plan': plan,
        'subscription.cvLimit': CV_LIMITS[plan],
        'subscription.startDate': new Date()
      },
      { new: true }
    );


    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error while updating subscription" 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // If using Clerk IDs, you might need to first find the user
    // in your database that matches this Clerk ID
    const user = await User.findOne({ _id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found in database"
      });
    }

    // Delete using the database _id
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting user"
    });
  }
};

export const getAdminActivities = async (req, res) => {
  try {
    // Get recent job applications (last 50)
    const recentApplications = await JobApplication.find()
      .sort({ date: -1 })
      .limit(50)
      .populate('user_id', 'name email image')
      .populate('job_id', 'title')
      .populate('company_id', 'name')
      .lean();

    // Get recent job postings (last 20)
    const recentJobs = await Job.find()
      .sort({ date: -1 })
      .limit(20)
      .populate('companyId', 'name')
      .lean();

    // Get recent user signups (last 20)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('name email image role createdAt')
      .lean();

    // Format the activities
    const activities = [
      ...recentApplications.map(app => ({
        id: app._id,
        type: 'application',
        action: `applied for ${app.job_id?.title || 'a job'}`,
        userName: app.user_id?.name || 'Unknown user',
        timestamp: app.date,
        metadata: {
          jobId: app.job_id?._id,
          companyId: app.company_id?._id,
          userId: app.user_id?._id
        }
      })),
      ...recentJobs.map(job => ({
        id: job._id,
        type: 'job_post',
        action: `posted a new job: ${job.title}`,
        userName: job.companyId?.name || 'Unknown company',
        timestamp: job.date,
        metadata: {
          jobId: job._id,
          companyId: job.companyId?._id
        }
      })),
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user_signup',
        action: `signed up as ${user.role}`,
        userName: user.name,
        timestamp: user.createdAt,
        metadata: {
          userId: user._id
        }
      }))
    ];

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return only the most recent 30 activities
    const recentActivities = activities.slice(0, 30);

    res.status(200).json({
      success: true,
      activities: recentActivities
    });

  } catch (error) {
    console.error("Error fetching admin activities:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching activities"
    });
  }
};