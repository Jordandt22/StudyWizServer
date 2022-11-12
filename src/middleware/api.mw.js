const Sets = require("../models/sets/sets.model");
const { errorHandler } = require("../utils/global.utils");

module.exports = {
  checkSet: async (req, res, next) => {
    const { setId } = req.params;
    let cachedSet = req.set;
    if (!cachedSet) {
      const dbSet = await Sets.findById(setId);
      if (!dbSet) return errorHandler(res, 404, "SETS", "UNABLE TO FIND SET");

      // If Database set exists, set the set data to the database one
      req.set = dbSet;
    }

    next();
  },
};
