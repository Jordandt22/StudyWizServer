const _ = require("lodash");
const { getMultipleFBUsers } = require("../firebase/firebase.utils");

module.exports = {
  getMultipleSetsData: async (multipleSetsData, fbId, res, cb) => {
    // Removing Duplicates of the Creator Firebase IDs
    const multipleSetsFbIDs = _.uniqBy(multipleSetsData, "creatorFbId").map(
      (set) => ({
        fbId: set.creatorFbId,
      })
    );

    // Getting the Creator Data for the Multiple Sets
    await getMultipleFBUsers(multipleSetsFbIDs, res, (data) => {
      const creators = {};
      data.users.map((user) => {
        const { uid, displayName, email, photoURL } = user;
        creators[uid] = {
          fbId: uid,
          displayName: displayName ? displayName : email ? email : null,
          photoURL: photoURL ? photoURL : null,
        };
      });

      // Adding the Creator data to the Set Data
      const setsData = multipleSetsData.map((set) => {
        const setData = set._doc;
        const {
          creatorFbId,
          privacy: { hideCreator },
        } = setData;

        // Check if there is a creator and if it's the correct one
        const creator = creators[creatorFbId];
        if (!creator || creator.fbId !== creatorFbId)
          return {
            ...setData,
            creator: { fbId: null, displayName: "Unknown", photoURL: null },
          };

        // Checking if the user is the creator of this set and
        //  If the user is not the creator,
        //  check if this set is on hide creator mode
        const isCreator = fbId === creatorFbId;
        if (!isCreator && hideCreator)
          return {
            ...setData,
            creator: {
              fbId: creator.fbId,
              displayName: "Anonymous",
              photoURL: null,
            },
          };

        return { ...setData, creator };
      });

      cb(setsData);
    });
  },
};
