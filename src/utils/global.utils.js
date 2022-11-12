module.exports = {
  errorHandler: (res, status, route, msg, props) =>
    res
      .status(status)
      .json({ error: `${route} - ${msg}`, extra: props ? props : null }),
  cleanStringForRegex: (str) => str.replaceAll(/[^a-zA-Z\d:]/gi, ""),
};
