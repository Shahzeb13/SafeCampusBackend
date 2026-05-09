import { Request, Response } from "express";
import Organization from "../Models/organizationModel.js";
import { isOrganization } from "../Types/TypePredicates/organizationPredicate.js";



/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private (Super Admin / etc)
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const data = req.body;

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
    const isSuperAdmin = loggedInUserRole === "super_admin" ? true : false;
    if(!isSuperAdmin){
      return res.status(401).json({
        success: false,
        message: "Current Logged In user does not have the authority to create an organization";
      })
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
 * @desc    Delete an organization
 * @route   DELETE /api/organizations/:id
 * @access  Private (Super Admin only)
 */
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
