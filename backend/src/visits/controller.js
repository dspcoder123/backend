const Visit = require("../models/Visit");

// Get last 20 visits (most recent first)
exports.getLastVisits = async (req, res) => {
  try {
    const visits = await Visit.find().sort({ createdAt: -1 }).limit(20);

    if (!visits || visits.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No visits found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visits fetched successfully",
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visits",
      error: error.message,
    });
  }
};

// Get visit by ID
exports.getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findById(id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Visit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visit fetched successfully",
      data: visit,
    });
  } catch (error) {
    console.error("Error fetching visit:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visit",
      error: error.message,
    });
  }
};
