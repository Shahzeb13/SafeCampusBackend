import { Request, Response } from "express";
import campusModel from "../Models/campusModel.js";
import Organization from "../Models/organizationModel.js";
import { isCampusCreateRequest, isCampusUpdateRequest } from "../Types/TypePredicates/campusPredicate.js";
import { isSuperAdmin, isOrganizationOwner, isAdminLike, isCampusAdmin } from "../Types/TypePredicates/roleHelpers.js";

/**
 * @desc    Create a new campus
 * @route   POST /api/campuses
 * @access  Private (Super Admin or Organization Owner)
 */
export const createCampus = async (req: Request, res: Response) => {
  console.log("Create campus Controller hit");
  try {
    const data = req.body;
    const user = req.user;

    console.log("data", data);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    // 1. Validate incoming data
    if (!isCampusCreateRequest(data)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campus data. Name, code, city, address, organizationId, and location are required."
      });
    }

    // 2. Authorization Check
    const isSuper = isSuperAdmin(user.role);
    const isOrgOwner = isOrganizationOwner(user.role) && user.organizationId === data.organizationId.toString();

    if (!isSuper && !isOrgOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admins or the Organization Owner can create a campus for this organization."
      });
    }

    // 3. Verify Organization exists
    const organization = await Organization.findById(data.organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Target organization not found." });
    }

    // 4. Check for duplicate campus code within the same organization
    const existingCampus = await campusModel.findOne({
      organizationId: data.organizationId,
      code: data.code.toUpperCase()
    });

    if (existingCampus) {
      return res.status(409).json({
        success: false,
        message: `A campus with code '${data.code}' already exists in this organization.`
      });
    }

    // 5. Create Campus
    const newCampus = new campusModel({
      ...data,
      createdBy: user.id
    });

    await Organization.findByIdAndUpdate(
      data.organizationId,
      {
        $push: {campuses: newCampus._id}
      }
    )

    await newCampus.save();
    

    return res.status(201).json({
      success: true,
      message: "Campus created successfully.",
      data: newCampus
    });

  } catch (error: any) {
    console.error("Error in createCampus:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

/**
 * @desc    Get all campuses
 * @route   GET /api/campuses
 * @access  Private (Scoped by Organization for Owners)
 */
export const getAllCampuses = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    let query: any = {};

    // Super Admin sees all. Organization Owner sees only their campuses.
    if (isSuperAdmin(user.role)) {
      query = {}
    } else if (isOrganizationOwner(user.role)) {
      if (!user.organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization not found in token."
        });
      }

      query.organizationId = user.organizationId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin or Organization Owner can view all campuses."
      });
    }

    const campuses = await campusModel.find(query).populate("organizationId", "name slug").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: campuses
    });
  } catch (error) {
    console.error("Error in getAllCampuses:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * @desc    Get a single campus by ID
 * @route   GET /api/campuses/:id
 * @access  Private
 */
export const getCampusById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

   
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const campus = await campusModel.findById(id).populate("organizationId", "name slug");

    if (!campus) {
      return res.status(404).json({ success: false, message: "Campus not found." });
    }


    if(isSuperAdmin(user.role)){
      return res.status(200).json({
        success : true,
        message: "Campus Sucessfully Retreived",
        data: campus
      })
    }
    

    if(isOrganizationOwner(user.role)){
      if(!user.organizationId){
         return res.status(403).json({
          success: false,
          message: "Organization not found in token."
        });
      }

      if(user.organizationId.toString() !== campus.organizationId._id.toString()){
         return res.status(403).json({
          success: false,
          message: "Access denied. This campus belongs to another organization."
        }
      )
      }

     return res.status(200).json({
        success : true,
        message: "Campus Sucessfully Retreived",
        data: campus

     
    })
  }


    
    if(isCampusAdmin(user.role)){

      if (!user.campusId) {
        return res.status(403).json({
          success: false,
          message: "Campus not found in token."
        });
      }

      if(user.campusId.toString() !== campus._id.toString()){
         return res.status(403).json({
          success: false,
          message: "Access denied. You can only access your own campus."
        });
      
      }

      return res.status(200).json({
        success : true,
        message: "Campus Sucessfully Retreived",
        data: campus
      }
    )
    }
    

    
 

      return res.status(403).json({
      success: false,
      message: "Access denied."
    });
  } catch (error) {
    console.error("Error in getCampusById:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * @desc    Update a campus
 * @route   PATCH /api/campuses/:id
 * @access  Private (Super Admin or Organization Owner)
 */
export const updateCampus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const campus = await campusModel.findById(id);
    if (!campus) {
      return res.status(404).json({ success: false, message: "Campus not found." });
    }

    // 1. Authorization Check
    const isSuper = isSuperAdmin(user.role);
    const isOrgOwner = isOrganizationOwner(user.role) && user.organizationId === campus.organizationId.toString();

    if (!isSuper && !isOrgOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admins or the Organization Owner can update this campus."
      });
    }

    // 2. Validate update data
    if (!isCampusUpdateRequest(updateData)) {
      return res.status(400).json({ success: false, message: "Invalid update data." });
    }

    // 3. Prevent non-super admins from changing organizationId
    if (!isSuper) {
      delete updateData.organizationId;
      delete updateData.createdBy;
    }

    // 3.5 Check for duplicate code if code is being updated
    if (updateData.code) {
      const targetOrgId = updateData.organizationId || campus.organizationId;
      const duplicateCode = await campusModel.findOne({
        _id: { $ne: id },
        organizationId: targetOrgId,
        code: updateData.code.toUpperCase()
      });

      if (duplicateCode) {
        return res.status(409).json({
          success: false,
          message: `A campus with code '${updateData.code}' already exists in this organization.`
        });
      }
    }

    // 4. Update
    const updatedCampus = await campusModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Campus updated successfully.",
      data: updatedCampus
    });

  } catch (error: any) {
    console.error("Error in updateCampus:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

/**
 * @desc    Delete a campus
 * @route   DELETE /api/campuses/:id
 * @access  Private (Super Admin or Organization Owner)
 */
export const deleteCampus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const campus = await campusModel.findById(id);
    if (!campus) {
      return res.status(404).json({ success: false, message: "Campus not found." });
    }

    // 1. Authorization Check
    const isSuper = isSuperAdmin(user.role);
    const isOrgOwner = isOrganizationOwner(user.role) && user.organizationId === campus.organizationId.toString();

    if (!isSuper && !isOrgOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admins or the Organization Owner can delete this campus."
      });
    }

    await campusModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Campus deleted successfully."
    });

  } catch (error) {
    console.error("Error in deleteCampus:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
