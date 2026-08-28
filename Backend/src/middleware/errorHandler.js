const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Prisma unique constraint violation (equivalent to Mongoose code 11000)
  if (err.code === 'P2002') {
    statusCode = 400;
    const field = err.meta?.target?.[0] || 'field';
    message = `Duplicate value for ${field}. Please use a unique ${field}.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = err.meta?.cause || 'Record not found';
  }

  // Prisma validation error
  if (err.code === 'P2000') {
    statusCode = 400;
    message = err.meta?.cause || 'Value too long for the column';
  }

  // Prisma foreign key constraint failure
  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Related record not found. Please check the referenced data.';
  }

  // Generic Prisma client known request error
  if (err.name === 'PrismaClientKnownRequestError' && !['P2002', 'P2025', 'P2000', 'P2003'].includes(err.code)) {
    statusCode = 400;
    message = err.message;
  }

  // Prisma client validation error (bad query parameters)
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };