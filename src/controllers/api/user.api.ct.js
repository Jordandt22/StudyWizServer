const User = require("../../models/user/user.model");
const { cacheData } = require("../../redis/redis.mw");
const { USER_KEY } = require("../../redis/redis.keys");

module.exports = {
  getUser: async (req, res, next) => {
    const { fbId, provider } = req.body;
    const cachedUser = req.user;
    if (cachedUser) return res.status(200).json({ user: cachedUser });

    // Checking if the User exists or not
    const userInfo = { fbId, provider };
    const dbUser = await User.findOne(userInfo);
    if (!dbUser) {
      const newUser = await User.create(userInfo);
      await cacheData(USER_KEY, { fbId }, newUser);
      res.status(200).json({
        user: newUser,
      });
    } else {
      res.status(200).json({
        user: dbUser,
      });
    }
  },
};
