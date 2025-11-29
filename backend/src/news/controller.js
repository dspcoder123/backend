const mongoose = require('mongoose');

// Direct access to the `newsanalyses` collection
const NewsCollection = mongoose.connection.collection('newsanalyses');

// Get all news documents
const getAllNews = async (req, res) => {
  try {
    const news = await NewsCollection.find({}).toArray();

    if (!news || news.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No news records found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'News records fetched successfully',
      count: news.length,
      data: news,
    });
  } catch (error) {
    console.error('Error fetching news records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching news records',
      error: error.message,
    });
  }
};

module.exports = { getAllNews };
