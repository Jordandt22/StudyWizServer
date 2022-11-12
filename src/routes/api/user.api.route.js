const userRouter = require("express-promise-router")();
const { getUser } = require("../../controllers/api/user.api.ct");
const { authUser } = require("../../middleware/auth.mw");
const { getCacheData } = require("../../redis/redis.mw");
const { USER_KEY } = require("../../redis/redis.keys");
const {
  validator,
  schemas: { FirebaseIDSchema },
} = require("../../validators/params.validator");

// Auth Routes
userRouter.get(
  "/:fbId",
  validator(FirebaseIDSchema),
  authUser,
  getCacheData(USER_KEY),
  getUser
);

module.exports = userRouter;
