import connectionPool from "../utils/db.mjs";

export const validateIfQuestionExist = async (req, res, next) => {
  const questionId = req.params.id;

  try {
    const result = await connectionPool.query(
      `select * from questions where id = $1`,
      [questionId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "The question not found",
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
