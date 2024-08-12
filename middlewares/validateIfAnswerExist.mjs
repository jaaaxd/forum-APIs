import connectionPool from "../utils/db.mjs";

export const validateIfAnswerExist = async (req, res, next) => {
  const answerId = req.params.id;

  try {
    const result = await connectionPool.query(
      `select * from answers where id = $1`,
      [answerId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "The answer not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      Message:
        "Server could not process the request due to a database connection issue.",
    });
  }

  next();
};
