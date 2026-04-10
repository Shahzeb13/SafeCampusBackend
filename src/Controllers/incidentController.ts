import { Request, Response } from "express";
import IncidentModel from "../Models/incidentModel.js";
import { isIncidentCreateRequest } from "../Types/TypePredicates/incidentTypePredicates.js";
import { IMedia, IncidentCreateRequest, IncidentMulterFiles } from "../Types/incidentTypes.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import fs from "fs";

// @desc    Submit a new incident
// @route   POST /api/incidents/uploadIncident
// @access  Private (Student/Staff only)
export const createIncident = async (req: Request, res: Response) => {
  console.log("Create Incident route hit");
  try {
    
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot submit incidents" });
    }

    const body = req.body as IncidentCreateRequest;
    if (!isIncidentCreateRequest(body)) {
      // Remove any uploaded files if validation fails
      const files = (req as any).files as IncidentMulterFiles;
      if (files) {
        Object.values(files).flat().forEach((file) => {
           if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
        });
      }
      return res.status(400).json({ message: "Invalid incident data provided" });
    }

    const { title, description, incidentType, locationText, latitude, longitude, voiceDuration } = body;

    // Handle files
    const files = (req as any).files as IncidentMulterFiles;
    const mediaResults: { images: IMedia[], video: IMedia | null, audio: IMedia | null } = {
      images: [],
      video: null,
      audio: null,
    };

    if (files) {
      // Upload Images

      if (files.images) {
        for (const file of files.images) {
          try {
            console.log("Uploading Images to Cloduinary")
            const result = await uploadOnCloudinary(file.path);
            if (result) {
              console.log("Url returned from cloudinary for saved image", result);
              mediaResults.images.push({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
              });
            }
          } catch (uploadErr) {
            console.error("Cloudinary Image Upload Error:", uploadErr);
          } finally {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          }
        }
      }

      // Upload Video
      if (files.video && files.video[0]) {
        const file = files.video[0];
        try {
          console.log("Uploading Video to Cloduinary")
          const result = await uploadOnCloudinary(file.path);
          if (result) {
            const {url , secure_url , playback_url  } = result;
            
            console.log("Url returned from cloudinary for saved video")
            console.log(`URL : ${url} | SecureURL : ${secure_url} | PlayBackURL : ${playback_url}`)
            mediaResults.video = {
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            };
          }
        } catch (uploadErr) {
          console.error("Cloudinary Video Upload Error:", uploadErr);
        } finally {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }

      // Upload Audio
      if (files.audio && files.audio[0]) {
        const file = files.audio[0];
        try {
          console.log("Uploading Audio to cloudinary")
          const result = await uploadOnCloudinary(file.path);
          if (result) {
            console.log("Url retured from Cloudinary for saved Voice message", result)
            mediaResults.audio = {
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            };
          }
        } catch (uploadErr) {
          console.error("Cloudinary Audio Upload Error:", uploadErr);
        } finally {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    }

    const newIncident = new IncidentModel({
      reporter_id: user.id,
      reporter_role: user.role,
      title,
      description,
      incidentType,
      locationText,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      images: mediaResults.images,
      video: mediaResults.video,
      audio: mediaResults.audio,
      voiceDuration,
      status: "pending",
    });

    const savedIncident = await newIncident.save();

      //delete files media from server after saving it in database
    res.status(201).json(savedIncident);
  } catch (error: any) {
    console.error("Error creating incident:", error);
    // Cleanup if something exploded
    const files = (req as any).files as IncidentMulterFiles;
    if (files) {
      Object.values(files).flat().forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all incidents for the current user
// @route   GET /api/incidents/my
// @access  Private
export const getMyIncidents = async (req: Request, res: Response) => {
  console.log("getMyINcident Route hit")
  try {
    const user = (req as any).user;
    if (!user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const incidents = await IncidentModel.find({ reporter_id: user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(incidents);
  } catch (error: any) {
    console.error("Error fetching my incidents:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a single incident by ID (owned by user)
// @route   GET /api/incidents/:id
// @access  Private
export const getIncidentById = async (req: Request, res: Response) => {
  console.log("getIncidentById route hit");
  try {
    const user = (req as any).user;
    if (!user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const incident = await IncidentModel.findOne({
      _id: (req as any).params.id,
      reporter_id: user.id,
    });

    if (!incident) {
      return res.status(404).json({ message: "Incident not found or not authorized" });
    }

    res.status(200).json(incident);
  } catch (error: any) {
    console.error("Error fetching incident by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
