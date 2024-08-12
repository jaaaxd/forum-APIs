export const checkCategoryInput = (req, res, next) => {
  const categories = [
    "technology",
    "cuisine",
    "travelling",
    "science",
    "literature",
    "music",
    "sports",
    "movies",
    "history",
    "miscellaneous",
  ];
  if (req.body.category && !categories.includes(req.body.category)) {
    return res.status(400).json({
      message:
        "Please enter a category from the following options: technology, cuisine, travelling, science, literature, music, sports, movies, history, miscellaneous.",
    });
  }
  next();
};
