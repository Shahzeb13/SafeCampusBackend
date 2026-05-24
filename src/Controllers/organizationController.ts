import { Request, Response } from "express";
import Organization from "../Models/organizationModel.js";
import { isOrganization } from "../Types/TypePredicates/organizationPredicate.js";
import { isSuperAdmin, isOrganizationOwner } from "../Types/TypePredicates/roleHelpers.js";
import { validateEmail } from "../Utils/ValidateAuthData.js";



/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private (Super Admin / etc)
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    console.log("createOrganization route hit");
    const data = req.body;
    const isEmailValid = validateEmail(data.contactEmail);
    if (!isEmailValid.ok) {
        res.status(400).json({ success: false, message: isEmailValid.reason })
        return;
    }
    // 1. Validate incoming data using the Type Predicate!
    if (!isOrganization(data)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid organization data. Please ensure 'name', 'slug', and 'contactEmail' are provided correctly." 
      });
    }

    // 2. Check for slug uniqueness
    const existingOrg = await Organization.findOne({ slug: data.slug });
    if (existingOrg) {
      return res.status(409).json({ 
        success: false, 
        message: `An organization with the slug '${data.slug}' already exists.` 
      });
    }

    // 3. Ensure we have the user who is creating it
    const createdBy = req.user?.id;
    if (!createdBy) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. User context is missing." 
      });
    }

    const loggedInUserRole = req.user?.role;
    if(loggedInUserRole !== undefined){
        if(!isSuperAdmin(loggedInUserRole)){
      return res.status(401).json({
        success: false,
        message: "Current Logged In user does not have the authority to create an organization"
      })
    }
    }
  


    // 4. Save to Database
    const newOrganization = new Organization({
      ...data,
      createdBy: createdBy,
      ownerUserId: createdBy // Assigning the creator as the initial owner
    });

    await newOrganization.save();

    return res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      data: newOrganization
    });

  } catch (error) {
    console.error("Error in createOrganization:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Public / Private
 */
export const getAllOrganizations = async (req: Request, res: Response) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error("Error in getAllOrganizations:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * @desc    Get a single organization by its slug
 * @route   GET /api/organizations/:slug
 * @access  Public / Private
 */
export const getOrganizationBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const organization = await Organization.findOne({ slug });

    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found." });
    }

    return res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error("Error in getOrganizationBySlug:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

/**
 * @desc    Update an organization
 * @route   PUT /api/organizations/:id
 * @access  Private (Super Admin or Organization Owner)
 */
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized. User context missing." });
    }

    // 1. Authorization Check
    const isSuper = isSuperAdmin(user.role);
    const isOrgOwner = isOrganizationOwner(user.role) && user.organizationId === id;

    if (!isSuper && !isOrgOwner) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only Super Admins or the Organization Owner can update this record." 
      });
    }

    // 2. Prevent sensitive field updates by non-SuperAdmins
    if (!isSuper) {
      delete updateData.slug; // Owners shouldn't change slugs usually (breaks URLs)
      delete updateData.status;
      delete updateData.ownerUserId;
      delete updateData.createdBy;
    }

    // 3. If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingWithSlug = await Organization.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: id } 
      });
      if (existingWithSlug) {
        return res.status(409).json({ 
          success: false, 
          message: `The slug '${updateData.slug}' is already taken by another organization.` 
        });
      }
    }

    // 4. Perform Update
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrg) {
      return res.status(404).json({ success: false, message: "Organization not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
      data: updatedOrg
    });

  } catch (error: any) {
    console.error("Error in updateOrganization:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error.", 
      error: error.message 
    });
  }
};

/**
 * @desc    Delete an organization
 * @route   DELETE /api/organizations/:id
 * @access  Private (Super Admin only)
 */
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user || !isSuperAdmin(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only Super Admins can delete an organization." 
      });
    }

    const deletedOrg = await Organization.findByIdAndDelete(id);

    if (!deletedOrg) {
      return res.status(404).json({ success: false, message: "Organization not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Organization deleted successfully."
    });
  } catch (error) {
    console.error("Error in deleteOrganization:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
