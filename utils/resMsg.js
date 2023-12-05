module.exports = {
    sendResponse: (res, status, success, message, data) => {
      const response = {
        code: status,
        success,
        message,
        data: data
      };
  
      res.status(status).json(response);
    },
};