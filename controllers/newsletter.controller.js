

import Newsletter from "../models/newsletter.model.js";
import { User } from "../models/user.model.js";

// Create newsletter
export const createNewsletter = async (req, res) => {
  try {
    const { title, content, isPrivate = false } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and content are required." 
      });
    }

    const newsletter = await Newsletter.create({
      title,
      content,
      isPrivate,
      createdBy: req.user._id,
    });

    // Populate the createdBy field for the response
    await newsletter.populate('createdBy', 'fullname email role');
    
    // Map fullname to name for frontend compatibility
    const newsletterResponse = {
      ...newsletter.toObject(),
      createdBy: newsletter.createdBy ? {
        ...newsletter.createdBy.toObject(),
        name: newsletter.createdBy.fullname,
        _id: newsletter.createdBy._id,
        email: newsletter.createdBy.email,
        role: newsletter.createdBy.role
      } : null
    };
    
    res.status(201).json({ 
      success: true, 
      newsletter: newsletterResponse,
      message: "Newsletter created successfully"
    });
  } catch (error) {
    console.error("Create newsletter error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create newsletter." 
    });
  }
};

// Get only public newsletters (for unauthenticated access)
export const getPublicNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find({ isPrivate: false })
      .populate('createdBy', 'fullname email role')
      .sort({ createdAt: -1 });

    // Map fullname to name for frontend compatibility
    const newslettersWithMappedAuthors = newsletters.map(newsletter => ({
      ...newsletter.toObject(),
      createdBy: newsletter.createdBy ? {
        ...newsletter.createdBy.toObject(),
        name: newsletter.createdBy.fullname,
        _id: newsletter.createdBy._id,
        email: newsletter.createdBy.email,
        role: newsletter.createdBy.role
      } : null
    }));

    res.status(200).json({ 
      success: true, 
      newsletters: newslettersWithMappedAuthors 
    });
  } catch (error) {
    console.error("Get public newsletters error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch public newsletters." 
    });
  }
};

// Get all newsletters (public + user's private ones if authenticated)
export const getAllNewsletters = async (req, res) => {
  try {
    let query = {};
    
    if (req.user) {
      // If user is authenticated, show public newsletters + their own private ones
      query = {
        $or: [
          { isPrivate: false },
          { createdBy: req.user._id, isPrivate: true }
        ]
      };
    } else {
      // If not authenticated, only show public newsletters
      query = { isPrivate: false };
    }

    const newsletters = await Newsletter.find(query)
      .populate('createdBy', 'fullname email role')
      .sort({ createdAt: -1 });

    // Map fullname to name for frontend compatibility
    const newslettersWithMappedAuthors = newsletters.map(newsletter => ({
      ...newsletter.toObject(),
      createdBy: newsletter.createdBy ? {
        ...newsletter.createdBy.toObject(),
        name: newsletter.createdBy.fullname,
        _id: newsletter.createdBy._id,
        email: newsletter.createdBy.email,
        role: newsletter.createdBy.role
      } : null
    }));
      
    res.status(200).json({ 
      success: true, 
      newsletters: newslettersWithMappedAuthors 
    });
  } catch (error) {
    console.error("Get all newsletters error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch newsletters." 
    });
  }
};

// Get newsletters by author
export const getNewslettersByAuthor = async (req, res) => {
  try {
    const authorId = req.query.authorId;
    const includePrivate = req.query.includePrivate === 'true';
    
    if (!authorId) {
      return res.status(400).json({ 
        success: false, 
        message: "Author ID required" 
      });
    }

    let query = { createdBy: authorId };
    
    // If includePrivate is requested, check if user is authenticated and is the author
    if (includePrivate) {
      if (!req.user || req.user._id.toString() !== authorId) {
        return res.status(403).json({ 
          success: false, 
          message: "You can only view your own private newsletters" 
        });
      }
      // Include both public and private newsletters for the author
    } else {
      // Only include public newsletters
      query.isPrivate = false;
    }

    const newsletters = await Newsletter.find(query)
      .populate('createdBy', 'fullname email role')
      .sort({ createdAt: -1 });

    // Map fullname to name for frontend compatibility
    const newslettersWithMappedAuthors = newsletters.map(newsletter => ({
      ...newsletter.toObject(),
      createdBy: newsletter.createdBy ? {
        ...newsletter.createdBy.toObject(),
        name: newsletter.createdBy.fullname,
        _id: newsletter.createdBy._id,
        email: newsletter.createdBy.email,
        role: newsletter.createdBy.role
      } : null
    }));

    res.status(200).json({ 
      success: true, 
      newsletters: newslettersWithMappedAuthors 
    });
  } catch (error) {
    console.error("Get newsletters by author error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch newsletters by author." 
    });
  }
};

// Update newsletter
export const updateNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPrivate } = req.body;

    const newsletter = await Newsletter.findById(id);
    
    if (!newsletter) {
      return res.status(404).json({ 
        success: false, 
        message: "Newsletter not found." 
      });
    }

    // Check if user is the author
    if (newsletter.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only update your own newsletters." 
      });
    }

    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      id,
      { 
        ...(title && { title }),
        ...(content && { content }),
        ...(typeof isPrivate === 'boolean' && { isPrivate })
      },
      { new: true }
    ).populate('createdBy', 'fullname email role');

    // Map fullname to name for frontend compatibility
    const newsletterResponse = {
      ...updatedNewsletter.toObject(),
      createdBy: updatedNewsletter.createdBy ? {
        ...updatedNewsletter.createdBy.toObject(),
        name: updatedNewsletter.createdBy.fullname,
        _id: updatedNewsletter.createdBy._id,
        email: updatedNewsletter.createdBy.email,
        role: updatedNewsletter.createdBy.role
      } : null
    };

    res.status(200).json({ 
      success: true, 
      newsletter: newsletterResponse,
      message: "Newsletter updated successfully"
    });
  } catch (error) {
    console.error("Update newsletter error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update newsletter." 
    });
  }
};

// Delete newsletter
export const deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;

    const newsletter = await Newsletter.findById(id);
    
    if (!newsletter) {
      return res.status(404).json({ 
        success: false, 
        message: "Newsletter not found." 
      });
    }

    // Check if user is the author
    if (newsletter.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete your own newsletters." 
      });
    }

    await Newsletter.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Newsletter deleted successfully"
    });
  } catch (error) {
    console.error("Delete newsletter error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete newsletter." 
    });
  }
};

// Toggle newsletter privacy
export const toggleNewsletterPrivacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPrivate } = req.body;

    const newsletter = await Newsletter.findById(id);
    
    if (!newsletter) {
      return res.status(404).json({ 
        success: false, 
        message: "Newsletter not found." 
      });
    }

    // Check if user is the author
    if (newsletter.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only modify your own newsletters." 
      });
    }

    const newPrivateStatus = typeof isPrivate === 'boolean' ? isPrivate : !newsletter.isPrivate;

    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      id,
      { isPrivate: newPrivateStatus },
      { new: true }
    ).populate('createdBy', 'fullname email role');

    // Map fullname to name for frontend compatibility
    const newsletterResponse = {
      ...updatedNewsletter.toObject(),
      createdBy: updatedNewsletter.createdBy ? {
        ...updatedNewsletter.createdBy.toObject(),
        name: updatedNewsletter.createdBy.fullname,
        _id: updatedNewsletter.createdBy._id,
        email: updatedNewsletter.createdBy.email,
        role: updatedNewsletter.createdBy.role
      } : null
    };

    res.status(200).json({ 
      success: true, 
      newsletter: newsletterResponse,
      message: `Newsletter ${newPrivateStatus ? 'made private' : 'made public'} successfully`
    });
  } catch (error) {
    console.error("Toggle newsletter privacy error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update newsletter privacy." 
    });
  }
};