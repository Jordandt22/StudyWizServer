const User = require("../../models/user/user.model");
const Sets = require("../../models/sets/sets.model");
const { cacheData } = require("../../redis/redis.mw");
const { USER_KEY, SET_KEY } = require("../../redis/redis.keys");
const { getMultipleSetsData } = require("../../utils/sets.utils");
const {
  errorHandler,
  cleanStringForRegex,
} = require("../../utils/global.utils");
const {
  getFBUser,
  getMultipleFBUsers,
} = require("../../firebase/firebase.utils");

// Update User Cache
const updateUserCache = async (fbId, updatedUser) =>
  await cacheData(USER_KEY, { fbId }, updatedUser);

// Update Set Cache
const updateSetCache = async (setId, updatedSet) =>
  await cacheData(SET_KEY, { setId }, updatedSet);

module.exports = {
  getSet: async (req, res, next) => {
    const { fbId, sets } = req.user;
    const { setId } = req.params;

    // Updated User & Set Data
    let updatedUser = req.user;
    let setData = req.set;
    const { creatorFbId, users } = setData;
    const isCreator = fbId === creatorFbId;

    // If the user is not the creator, check if the set is private
    if (!isCreator && setData.privacy.private)
      return errorHandler(res, 200, "SETS", "THIS SET IS ON PRIVATE MODE");

    // Checking if the set has been added already to the user's set list
    const setAdded = sets.some((set) => set.setId === setId);
    if (!setAdded) {
      // Adds the new set to the user's list
      updatedUser = await User.findOneAndUpdate(
        { fbId },
        {
          $push: { sets: { setId, creatorFbId } },
        },
        { returnDocument: "after" }
      );
    } else {
      // Updates the last requested time for the set in the user's list
      updatedUser = await User.findOneAndUpdate(
        { fbId, "sets.setId": setId },
        {
          $set: { "sets.$.lastRequested": new Date() },
        },
        { returnDocument: "after" }
      );
    }

    // Adding a user to the set if it isn't the creator
    const alreadyAddedToUsers = users.some((user) => user.fbId === fbId);
    if (!isCreator && !alreadyAddedToUsers) {
      setData = await Sets.findByIdAndUpdate(
        setId,
        { $push: { users: { fbId } }, $inc: { totalUsers: 1 } },
        { returnDocument: "after" }
      );
    }

    // Updating the Redis Cache
    updateUserCache(fbId, updatedUser);
    updateSetCache(setId, setData);
    res.status(200).json({ user: { sets: updatedUser.sets }, set: setData });
  },
  getSetCreator: async (req, res, next) => {
    const { fbId } = req.user;

    // Updated User & Set Data
    let setData = req.set;
    const {
      creatorFbId,
      privacy: { private, hideCreator },
    } = setData;
    const isCreator = fbId === creatorFbId;

    // If the user is not the creator, check if the set is private
    if (!isCreator && private)
      return errorHandler(res, 200, "SETS", "THIS SET IS ON PRIVATE MODE");

    // If the user is not the creator, check if hide creator mode is on
    if (!isCreator && hideCreator)
      return res.status(200).json({
        isCreator,
        creator: {
          fbId: "AnonymousUser1234",
          displayName: "Anonymous",
          photoURL: null,
        },
      });

    // Creator
    if (isCreator) {
      const { name, picture, email } = req.fbUser;
      res.status(200).json({
        isCreator,
        creator: {
          fbId,
          displayName: name ? name : email ? email : null,
          photoURL: picture ? picture : null,
        },
      });
    } else {
      // If not creator, get Firebaes user info
      await getFBUser(creatorFbId, res, (data) => {
        const { uid, displayName, email, photoURL } = data;

        res.status(200).json({
          isCreator,
          creator: {
            fbId: uid,
            displayName: displayName ? displayName : email ? email : null,
            photoURL: photoURL ? photoURL : null,
          },
        });
      });
    }
  },
  getSetUsers: async (req, res, next) => {
    const { fbId } = req.user;

    // Updated User & Set Data
    let setData = req.set;
    const {
      creatorFbId,
      privacy: { private },
      users,
      totalUsers,
    } = setData;
    const isCreator = fbId === creatorFbId;

    // If the user is not the creator, check if the set is private
    if (!isCreator && private)
      return errorHandler(res, 200, "SETS", "THIS SET IS ON PRIVATE MODE");

    // Checking if there are any users
    if (users.length < 1) return res.status(200).json({ users: [] });

    // Get Firebase info of the set users
    await getMultipleFBUsers(users, res, (data) => {
      res.status(200).json({
        totalUsers,
        users: data.users.map((user) => {
          const { uid, displayName, email, photoURL } = user;

          return {
            fbId: uid,
            displayName: displayName ? displayName : email ? email : null,
            photoURL: photoURL ? photoURL : null,
          };
        }),
      });
    });
  },
  getMultipleSets: async (req, res, next) => {
    const { sets } = req.body;
    const { fbId } = req.user;
    const formatedSets = sets.map((set) => ({ _id: set.setId }));

    // Getting Data for the Multiple Sets
    const multipleSetsData = await Sets.find({
      $or: [
        { $and: [{ creatorFbId: fbId }, { $or: formatedSets }] },
        {
          $and: [
            { creatorFbId: { $not: { $regex: cleanStringForRegex(fbId) } } },
            { "privacy.private": false },
            { $or: formatedSets },
          ],
        },
      ],
    });

    // Checking the Sets
    let setsIdObj = {};
    formatedSets.map((set) => (setsIdObj[set._id] = true));
    const checkedMultipleSetsData = multipleSetsData.filter((set) => {
      return setsIdObj[set.id];
    });
    if (checkedMultipleSetsData.length <= 0)
      return res.status(200).json({ sets: [] });

    // Get Sets Data with Creator Data
    await getMultipleSetsData(
      checkedMultipleSetsData,
      fbId,
      res,
      (setsData) => {
        // Add the Creator Data to Each Set Data
        res.status(200).json({
          sets: setsData,
        });
      }
    );
  },
};
