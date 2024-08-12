import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import { validateIfAnswerExist } from "../middlewares/validateIfAnswerExist.mjs";

export const answersRouter = Router();

answersRouter.post("/:id/upvote", [validateIfAnswerExist], async (req, res) => {
  const answerId = req.params.id;
  let result;

  try {
    await connectionPool.query(
      `insert into answer_votes (answer_id, vote) VALUES ($1, 1)`,
      [answerId]
    );
    result = await connectionPool.query(
      `select 
              answers.id,
              answers.question_id,
              answers.content,
              answers.created_at,
              answers.updated_at,
              COALESCE(SUM(CASE WHEN answer_votes.vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
              COALESCE(SUM(CASE WHEN answer_votes.vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
          from answers
          left join answer_votes
              on answers.id = answer_votes.answer_id
          where answers.id = $1
          group by answers.id,
              answers.id,
              answers.question_id,
              answers.content,
              answers.created_at,
              answers.updated_at`,
      [answerId]
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server could not upvote because database connection",
    });
  }

  return res.status(200).json({
    data: result.rows[0],
    message: "Successfully upvoted the answer.",
  });
});

answersRouter.post(
  "/:id/downvote",
  [validateIfAnswerExist],
  async (req, res) => {
    const answerId = req.params.id;
    let result;

    try {
      await connectionPool.query(
        `insert into answer_votes (answer_id, vote) VALUES ($1, -1)`,
        [answerId]
      );
      result = await connectionPool.query(
        `select 
                answers.id,
                answers.question_id,
                answers.content,
                answers.created_at,
                answers.updated_at,
                COALESCE(SUM(CASE WHEN answer_votes.vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
                COALESCE(SUM(CASE WHEN answer_votes.vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
            from answers
            left join answer_votes
                on answers.id = answer_votes.answer_id
            where answers.id = $1
            group by answers.id,
                answers.id,
                answers.question_id,
                answers.content,
                answers.created_at,
                answers.updated_at`,
        [answerId]
      );
    } catch (error) {
      return res.status(500).json({
        message: "Server could not downvote because database connection",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
      message: "Successfully downvoted the answer.",
    });
  }
);
