const setsRouter = require("express-promise-router")();
const {
  getSet,
  getSetCreator,
  getSetUsers,
  getMultipleSets,
} = require("../../controllers/api/sets.get.api.ct");
const {
  createSet,
  updateSet,
  deleteSet,
  copySet,
} = require("../../controllers/api/sets.action.api.ct");
const {
  getCommunitySets,
  searchCommunitySets,
} = require("../../controllers/api/community.api.ct");
const {
  validator: paramsValidator,
  schemas: {
    SetIdSchema,
    CommunitySetsSchema,
    CommunitySearchSchema: CommunitySearchParamsSchema,
  },
} = require("../../validators/params.validator");
const {
  validator: bodyValidator,
  schemas: {
    SetSchema,
    MultipleSetsSchema,
    CommunitySearchSchema: CommunitySearchBodySchema,
  },
} = require("../../validators/body.validator");
const { getCacheData } = require("../../redis/redis.mw");
const {
  SET_KEY,
  COMMUNITY_KEY,
  SEARCH_KEY,
} = require("../../redis/redis.keys");
const { checkSet } = require("../../middleware/api.mw");

// Sets API

// ---- Get Data ----

// POST - Get Multiple Sets
setsRouter.post(
  "/multiple",
  bodyValidator(MultipleSetsSchema),
  getMultipleSets
);

// GET - Get a Set
setsRouter.get(
  "/:setId",
  paramsValidator(SetIdSchema),
  getCacheData(SET_KEY),
  checkSet,
  getSet
);

// GET - Get a set's creator
setsRouter.get(
  "/:setId/creator",
  paramsValidator(SetIdSchema),
  getCacheData(SET_KEY),
  checkSet,
  getSetCreator
);

// GET - Get a set's users
setsRouter.get(
  "/:setId/users",
  paramsValidator(SetIdSchema),
  getCacheData(SET_KEY),
  checkSet,
  getSetUsers
);

// ---- Actions ----

// POST - Create a Set
setsRouter.post("/", bodyValidator(SetSchema), createSet);

// PATCH - Update a Set
setsRouter.patch(
  "/:setId",
  paramsValidator(SetIdSchema),
  bodyValidator(SetSchema),
  getCacheData(SET_KEY),
  checkSet,
  updateSet
);

// DELETE - Delete a Set
setsRouter.delete(
  "/:setId",
  paramsValidator(SetIdSchema),
  getCacheData(SET_KEY),
  checkSet,
  deleteSet
);

// POST - Copy Set
setsRouter.post(
  "/:setId/copy",
  paramsValidator(SetIdSchema),
  getCacheData(SET_KEY),
  checkSet,
  copySet,
  bodyValidator(SetSchema),
  createSet
);

// ---- Community ----

// GET - Get Community Sets
setsRouter.get(
  "/community/:filter/page/:page/limit/:limit",
  paramsValidator(CommunitySetsSchema),
  getCacheData(COMMUNITY_KEY),
  getCommunitySets
);

// POST - Search Community Sets
setsRouter.post(
  "/community/page/:page/limit/:limit/search/:query",
  paramsValidator(CommunitySearchParamsSchema),
  bodyValidator(CommunitySearchBodySchema),
  getCacheData(SEARCH_KEY),
  searchCommunitySets
);

module.exports = setsRouter;
