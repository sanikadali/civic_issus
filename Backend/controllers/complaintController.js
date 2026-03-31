const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const User = require('../models/User');
const mongoose = require('mongoose');
// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Public
const getComplaints = asyncHandler(async (req, res) => {
    // Use aggregation to joining votes and comments
    const complaints = await Complaint.aggregate([
        {
            $lookup: {
                from: 'votes',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'votesData'
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'commentsData'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userData'
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$userData', 0] }, // Map userData to user field for frontend compatibility
                upvotes: {
                    $map: {
                        input: {
                            $filter: {
                                input: '$votesData',
                                as: 'v',
                                cond: { $eq: ['$$v.vote_type', 'upvote'] }
                            }
                        },
                        as: 'v',
                        in: '$$v.user_id'
                    }
                },
                downvotes: {
                    $map: {
                        input: {
                            $filter: {
                                input: '$votesData',
                                as: 'v',
                                cond: { $eq: ['$$v.vote_type', 'downvote'] }
                            }
                        },
                        as: 'v',
                        in: '$$v.user_id'
                    }
                },
                comments: {
                    $map: {
                        input: '$commentsData',
                        as: 'c',
                        in: {
                            _id: '$$c._id',
                            user: '$$c.user_id',
                            text: '$$c.content', // Map content to text for frontend compatibility
                            createdAt: '$$c.createdAt'
                        }
                    }
                }
            }
        },
        {
            $project: {
                votesData: 0,
                commentsData: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    // Populate user details for comments manually if needed or via further lookups
    // For now, simpler to just return. 
    // Ideally we want comment user names, but let's stick to basic structure first.

    console.log(`[GET] Complaint List Requested. Found: ${complaints.length} records.`);
    res.status(200).json(complaints);
});

// @desc    Get user complaints
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = asyncHandler(async (req, res) => {
    // Support both new user_id and old user field
    const complaints = await Complaint.find({
        $or: [{ user_id: req.user.id }, { user: req.user.id }]
    }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
});


// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
    if (!req.body.title || !req.body.description) {
        res.status(400);
        throw new Error('Please add title and description');
    }

    // Auto-assignment logic: Find volunteer in same location (simple string match on address)
    // In a real app, this would use geospatial query on location_coords
    const addressKeyword = req.body.address ? req.body.address.split(' ')[0] : '';
    const volunteer =  await User.findOne({
        role: 'volunteer',
        location: { $regex: req.body.address,$options: 'i' } // Match city/area loosely
    }) ;
    let issueType = req.body.issueType;
    if (!issueType) {
        issueType = await detectIssueType(req.body.description);
    }
    const complaint = await Complaint.create({
        user_id: req.user.id,
        title: req.body.title,
        issueType: issueType,
        description: req.body.description,
        address: req.body.address,
        location_coords: req.body.location ? { lat: req.body.location.lat, lng: req.body.location.lng } : undefined,
        photo: req.body.photo,
        assigned_to: volunteer ? volunteer.name : 'Unassigned',
        status: 'received'
    });

    res.status(200).json(complaint);
});

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(400);
        throw new Error('Complaint not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Allow update if user is owner OR admin OR the assigned volunteer
    const isOwner = complaint.user_id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isAssigned = complaint.assigned_to === req.user.name; // Simple name match for now

    if (!isOwner && !isAdmin && !isAssigned) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedComplaint);
});

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
const deleteComplaint = asyncHandler(async (req, res) => {
    const complaintId = req.params.id.trim();

    console.log(`[DELETE] Request to delete complaint ID: ${complaintId}`);
    console.log(`[DELETE] Requesting user ID: ${req.user?.id}, role: ${req.user?.role}`);

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    try {
        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            console.log(`[DELETE] Complaint ${complaintId} not found in DB`);
            res.status(404);
            throw new Error('Complaint not found (findById failed)');
        }

        // Log exact values for debugging
        const storedOwnerIdStr = complaint.user_id ? complaint.user_id.toString() : 'null';
        const requestingUserIdStr = req.user.id ? req.user.id.toString() : 'null';
        console.log(`[DELETE] Complaint owner user_id (raw): "${storedOwnerIdStr}"`);
        console.log(`[DELETE] Requesting user id (from JWT): "${requestingUserIdStr}"`);
        console.log(`[DELETE] IDs match: ${storedOwnerIdStr === requestingUserIdStr}`);

        // Allow delete if user is owner (by user_id OR legacy user field) OR admin
        const isOwner = storedOwnerIdStr === requestingUserIdStr ||
            (complaint.user && complaint.user.toString() === requestingUserIdStr);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            console.log(`[DELETE] Authorization failed — not owner and not admin`);
            res.status(401);
            throw new Error('User not authorized');
        }
        console.log(`[DELETE] Authorization passed (isOwner: ${isOwner}, isAdmin: ${isAdmin})`);

        const result = await Complaint.findByIdAndDelete(complaintId);
        console.log(`[DELETE] findByIdAndDelete result:`, result ? `Deleted doc with id ${result._id}` : 'null (not found)');

        // Verify deletion
        const stillExists = await Complaint.findById(complaintId);
        if (stillExists) {
            console.error(`[DELETE] ERROR: Complaint ${complaintId} still exists after delete!`);
        } else {
            console.log(`[DELETE] SUCCESS: Complaint ${complaintId} confirmed deleted from DB`);
        }

        res.status(200).json({ id: complaintId });

    } catch (err) {
        console.error('[DELETE] DB Error:', err);
        throw err;
    }
});

// @desc    Get complaint stats
// @route   GET /api/complaints/stats
// @access  Private
const getComplaintStats = asyncHandler(async (req, res) => {
    // Backward compatibility for old schema (user field instead of user_id)
    const query = { $or: [{ user_id: req.user.id }, { user: req.user.id }] };

    const totalIssues = await Complaint.countDocuments(query);

    // Count 'received' (new) OR 'pending' (old)
    const pending = await Complaint.countDocuments({
        ...query,
        status: { $in: ['received', 'pending'] }
    });

    // Count 'in_review' (new) OR 'in_progress' (old)
    const inProgress = await Complaint.countDocuments({
        ...query,
        status: { $in: ['in_review', 'in_progress'] }
    });

    const resolved = await Complaint.countDocuments({
        ...query,
        status: 'resolved'
    });

    res.status(200).json({
        totalIssues,
        pending,   // UI maps this to 'Received'
        inProgress, // UI maps this to 'In Review'
        resolved
    });
});

// @desc    Vote on a complaint
// @route   PUT /api/complaints/:id/vote
// @access  Private
const voteComplaint = asyncHandler(async (req, res) => {
    const { voteType } = req.body; // Frontend sends 'voteType', we map to 'vote_type'
    const complaintId = req.params.id;
    const userId = req.user.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
        res.status(400);
        throw new Error('Invalid vote type');
    }

    // Check existing vote
    const existingVote = await Vote.findOne({ user_id: userId, complaint_id: complaintId });

    if (existingVote) {
        if (existingVote.vote_type === voteType) {
            // Toggle off (remove vote)
            await existingVote.deleteOne();
        } else {
            // Change vote
            existingVote.vote_type = voteType;
            await existingVote.save();
        }
    } else {
        // Create new vote
        await Vote.create({
            user_id: userId,
            complaint_id: complaintId,
            vote_type: voteType
        });
    }

    // Return the updated complaint object structure so frontend can update state
    // We basically need to simple re-fetch this single complaint with the aggregation
    // Reuse specific aggregation logic or just manual fetch for speed

    // Quick aggregation for single doc
    const updatedComplaintData = await Complaint.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(complaintId) } },
        {
            $lookup: {
                from: 'votes',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'votesData'
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'commentsData'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userData'
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$userData', 0] },
                upvotes: {
                    $map: {
                        input: { $filter: { input: '$votesData', as: 'v', cond: { $eq: ['$$v.vote_type', 'upvote'] } } },
                        as: 'v', in: '$$v.user_id'
                    }
                },
                downvotes: {
                    $map: {
                        input: { $filter: { input: '$votesData', as: 'v', cond: { $eq: ['$$v.vote_type', 'downvote'] } } },
                        as: 'v', in: '$$v.user_id'
                    }
                },
                comments: {
                    $map: {
                        input: '$commentsData',
                        as: 'c',
                        in: { _id: '$$c._id', user: '$$c.user_id', text: '$$c.content', createdAt: '$$c.createdAt' }
                    }
                }
            }
        },
        { $project: { votesData: 0, commentsData: 0, userData: 0 } }
    ]);

    if (!updatedComplaintData.length) {
        res.status(404);
        throw new Error('Complaint not found after update');
    }

    res.status(200).json(updatedComplaintData[0]);
});

// @desc    Add a comment
// @route   POST /api/complaints/:id/comment
// @access  Private
const commentComplaint = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const complaintId = req.params.id;
    const userId = req.user.id;

    if (!text) {
        res.status(400);
        throw new Error('Comment text required');
    }

    await Comment.create({
        user_id: userId,
        complaint_id: complaintId,
        content: text
    });

    // Re-fetch aggregated data to return
    const updatedComplaintData = await Complaint.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(complaintId) } },
        {
            $lookup: {
                from: 'votes',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'votesData'
            }
        },
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'complaint_id',
                as: 'commentsData'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userData'
            }
        },
        {
            $addFields: {
                user: { $arrayElemAt: ['$userData', 0] },
                upvotes: {
                    $map: {
                        input: { $filter: { input: '$votesData', as: 'v', cond: { $eq: ['$$v.vote_type', 'upvote'] } } },
                        as: 'v', in: '$$v.user_id'
                    }
                },
                downvotes: {
                    $map: {
                        input: { $filter: { input: '$votesData', as: 'v', cond: { $eq: ['$$v.vote_type', 'downvote'] } } },
                        as: 'v', in: '$$v.user_id'
                    }
                },
                comments: {
                    $map: {
                        input: '$commentsData',
                        as: 'c',
                        in: { _id: '$$c._id', user: '$$c.user_id', text: '$$c.content', createdAt: '$$c.createdAt' }
                    }
                }
            }
        },
        { $project: { votesData: 0, commentsData: 0, userData: 0 } }
    ]);

    res.status(200).json(updatedComplaintData[0]);
});

module.exports = {
    getComplaints,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    getMyComplaints,
    getComplaintStats,
    voteComplaint,
    commentComplaint
};
