import { RequestHandler } from "express";
import { populateSampleData } from "../scripts/populate-sample-data";

export const populateData: RequestHandler = async (req, res) => {
  try {
    console.log("🔄 Starting sample data population via API...");

    await populateSampleData();

    res.json({
      success: true,
      message: "Sample data populated successfully",
    });
  } catch (error) {
    console.error("Error populating sample data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to populate sample data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
