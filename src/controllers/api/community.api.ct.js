const Sets = require("../../models/sets/sets.model");
const { cacheData } = require("../../redis/redis.mw");
const { COMMUNITY_KEY, SEARCH_KEY } = require("../../redis/redis.keys");
const { getMultipleSetsData } = require("../../utils/sets.utils");
const {
  errorHandler,
  cleanStringForRegex,
} = require("../../utils/global.utils");

// Check Filter
const checkFilter = (filter, options) => {
  const formatedFilter = filter.toLowerCase().trim();
  let filterOptions = {};
  options.map(
    (opt) =>
      (filterOptions[`is${opt}Filter`] = formatedFilter === opt.toLowerCase())
  );
  return filterOptions;
};

// Check Owned By Value
const checkOwnedBy = (ownedBy, options) => {
  const formatedOwnedBy = ownedBy.toLowerCase().trim();
  let ownedByOptions = {};
  options.map(
    (opt) =>
      (ownedByOptions[`ownedBy${opt}`] = formatedOwnedBy === opt.toLowerCase())
  );
  return ownedByOptions;
};

// Get Current Skip
const getCurrentSkip = (page, limit) => (page > 0 ? limit * (page - 1) : 0);

// Get Next Info
const getNextInfo = (limit, page, setsLength) => ({
  limit,
  page: setsLength <= limit ? null : Number(page) + 1,
});

module.exports = {
  getCommunitySets: async (req, res, next) => {
    const { fbId } = req.user;
    const { filter, page, limit } = req.params;
    const { isNewestFilter, isOldestFilter, isPopularityFilter } = checkFilter(
      filter,
      ["Newest", "Oldest", "Popularity"]
    );
    if (!isNewestFilter && !isOldestFilter && !isPopularityFilter)
      return errorHandler(res, 422, "SETS", "INVALID FILTER");

    // Getting Community Sets
    const currentSkip = getCurrentSkip(page, limit);
    const communitySets = await Sets.find({ "privacy.private": false })
      .sort(
        isPopularityFilter
          ? { totalUsers: -1, createdAt: -1 }
          : { createdAt: isNewestFilter ? -1 : 1 }
      )
      .limit(Number(limit) + 1)
      .skip(currentSkip);

    // Checking if there are any community sets
    const setsLength = communitySets.length;
    if (setsLength <= 0)
      return res.status(200).json({ sets: [], next: { limit, page: 1 } });

    // Get Sets Data with Creator Data
    await getMultipleSetsData(
      communitySets.slice(0, limit),
      fbId,
      res,
      (setsData) => {
        // Updating Cache
        const data = {
          sets: setsData,
          next: getNextInfo(limit, page, setsLength),
        };
        cacheData(COMMUNITY_KEY, { ...req.params, fbId }, data);
        res.status(200).json(data);
      }
    );
  },
  searchCommunitySets: async (req, res, next) => {
    const { fbId } = req.user;
    const { filter, ownedBy } = req.body;
    const { page, limit, query } = req.params;

    // Checking Filter Value
    const { isNewestFilter, isOldestFilter, isPopularityFilter } = checkFilter(
      filter,
      ["Newest", "Oldest", "Popularity"]
    );
    if (!isNewestFilter && !isOldestFilter && !isPopularityFilter)
      return errorHandler(res, 422, "SETS", "INVALID FILTER");

    // Checking OwnedBy Value
    const { ownedByAnyone, ownedByMe, ownedByOthers } = checkOwnedBy(ownedBy, [
      "Anyone",
      "Me",
      "Others",
    ]);
    if (!ownedByAnyone && !ownedByMe && !ownedByOthers)
      return errorHandler(res, 422, "SETS", "INVALID OWNED BY VALUE");

    // Queriess
    const titleQuery = {
      title: { $regex: cleanStringForRegex(query), $options: "ig" },
    };
    const ownedByMeQuery = {
      $and: [{ creatorFbId: fbId }, titleQuery],
    };
    const ownedByOthersQuery = {
      $and: [
        { creatorFbId: { $not: { $regex: cleanStringForRegex(fbId) } } },
        { "privacy.private": false },
        titleQuery,
      ],
    };

    // Getting Community Sets
    const currentSkip = getCurrentSkip(page, limit);
    const communitySets = await Sets.find(
      // Owned by the user
      ownedByMe
        ? ownedByMeQuery
        : // Owned by other users
        ownedByOthers
        ? ownedByOthersQuery
        : // Owned by any user
          {
            $or: [ownedByMeQuery, ownedByOthersQuery],
          }
    )
      .sort(
        isPopularityFilter
          ? { totalUsers: -1, createdAt: -1 }
          : { createdAt: isNewestFilter ? -1 : 1 }
      )
      .limit(Number(limit) + 1)
      .skip(currentSkip);

    // Checking if there are any community sets
    const setsLength = communitySets.length;
    if (setsLength <= 0)
      return res.status(200).json({ sets: [], next: { limit, page: 1 } });

    // Get Sets Data with Creator Data
    await getMultipleSetsData(
      communitySets.slice(0, limit),
      fbId,
      res,
      (setsData) => {
        // Updating Cache
        const data = {
          sets: setsData,
          next: getNextInfo(limit, page, setsLength),
        };
        cacheData(SEARCH_KEY, { ...req.params, fbId, ...req.body }, data);
        res.status(200).json(data);
      }
    );
  },
};
