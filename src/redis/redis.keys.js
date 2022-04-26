const returnCachedData = (req, res, next, data) => {
  if (!data) return next();

  const cachedData = JSON.parse(data);
  return res.status(200).json({ sets: cachedData });
};

module.exports = {
  USER_KEY: {
    name: "user",
    params: ["fbId"],
    expiresIn: 60 * 60,
    callback: (req, res, next, data) => {
      if (!data) return next();

      const cachedData = JSON.parse(data);
      req.user = cachedData;
      return next();
    },
  },
  SET_KEY: {
    name: "set",
    params: ["setId"],
    expiresIn: 60 * 60 * 12,
  },
  COMMUNITY_KEY: {
    name: "community",
    params: ["fbId", "filter", "page", "limit"],
    expiresIn: 60 * 15,
    callback: returnCachedData,
  },
  SEARCH_KEY: {
    name: "search",
    params: ["fbId", "filter", "page", "limit", "query", "ownedBy"],
    expiresIn: 60 * 15,
    callback: returnCachedData,
  },
};
