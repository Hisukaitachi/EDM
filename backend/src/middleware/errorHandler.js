// backend/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    message = 'Duplicate entry. This record already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Invalid reference. The related record does not exist.';
  }

  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Database connection failed. Please try again later.';
  }

  // Handle stored procedure errors (SIGNAL SQLSTATE '45000')
  if (err.sqlState === '45000') {
    statusCode = 400;
    // Use the custom error message from stored procedure
    message = err.sqlMessage || message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code,
      sqlState: err.sqlState
    })
  });
};

module.exports = errorHandler;