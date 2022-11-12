const admin = require("./firebase.admin");
const { errorHandler } = require("../utils/global.utils");

module.exports = {
  verifyAccessToken: (accessToken, res, cb) =>
    admin
      .auth()
      .verifyIdToken(accessToken)
      .then(cb)
      .catch((err) => {
        const errorInfo = err.errorInfo;
        if (process.env.NODE_ENV === "development" && errorInfo)
          console.log(errorInfo.code, errorInfo.message);

        switch (errorInfo.code) {
          case "auth/argument-error":
          case "auth/invalid-id-token":
          case "auth/id-token-revoked":
            return errorHandler(
              res,
              400,
              "FIREBASE AUTH",
              "INVALID ACCESS TOKEN",
              errorInfo
            );

          case "auth/id-token-expired":
            return errorHandler(
              res,
              400,
              "FIREBASE AUTH",
              "EXPIRED ACCESS TOKEN",
              errorInfo
            );

          default:
            return errorHandler(
              res,
              500,
              "FIREBASE AUTH",
              "ERROR OCCURED - VERIFYING AN ACCESS TOKEN"
            );
        }
      }),
  getFBUser: async (fbId, res, cb) =>
    await admin
      .auth()
      .getUser(fbId)
      .then(cb)
      .catch((err) => {
        const errorInfo = err.errorInfo;
        if (process.env.NODE_ENV === "development" && errorInfo)
          console.log(errorInfo.code, errorInfo.message);

        switch (errorInfo.code) {
          case "auth/user-not-found":
            return errorHandler(
              res,
              404,
              "FIREBASE AUTH",
              "UNABLE TO FIND USER"
            );

          default:
            return errorHandler(
              res,
              500,
              "FIREBASE AUTH",
              "ERROR OCCURED - GETTING A USER"
            );
        }
      }),
  getMultipleFBUsers: async (users, res, cb) =>
    await admin
      .auth()
      .getUsers(
        users.map((user) => ({
          uid: user.fbId,
        }))
      )
      .then(cb)
      .catch((err) => {
        const errorInfo = err.errorInfo;
        if (process.env.NODE_ENV === "development" && errorInfo)
          console.log(errorInfo.code, errorInfo.message);

        switch (errorInfo.code) {
          default:
            return errorHandler(
              res,
              500,
              "FIREBASE AUTH",
              "ERROR OCCURED - GETTING MULTIPLE USERS"
            );
        }
      }),
};
