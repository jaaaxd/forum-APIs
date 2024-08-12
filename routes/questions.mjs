import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import { validateIfQuestionExist } from "../middlewares/validateIfQuestionExist.mjs";
import { checkCategoryInput } from "../middlewares/checkCategoryInput.mjs";

export const questionsRouter = Router();

questionsRouter.post("/", [checkCategoryInput], async (req, res) => {
  const newQuestion = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };
  let result;

  if (!newQuestion.title) {
    return res.status(400).json({
      message: "The title field is required. Please enter a title.",
    });
  }
  try {
    await connectionPool.query(
      `insert into questions (title, description, category, created_at, updated_at) values ($1, $2, $3, $4, $5)`,
      [
        newQuestion.title,
        newQuestion.description,
        newQuestion.category,
        newQuestion.created_at,
        newQuestion.updated_at,
      ]
    );
    result = await connectionPool.query(
      `select * from questions order by id desc limit 1`
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server could not create question because database connection",
    });
  }

  return res.status(201).json({
    data: result.rows[0],
    message: "Question created successfully.",
  });
});

questionsRouter.get("/", async (req, res) => {
  let result;
  const title = req.query.title;
  const category = req.query.category;

  try {
    result = await connectionPool.query(
      `select * from questions where 
      (title like '%' || $1 || '%' or $1 is null or $1 = '') 
      and (category like '%' || $2 || '%' or $2 is null or $2 = '')`,
      [title, category]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Invalid query parameters.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read questions because database connection",
    });
  }

  return res.status(200).json({
    data: result.rows,
    message: "Successfully retrieved the list of questions.",
  });
});

questionsRouter.get("/:id", [validateIfQuestionExist], async (req, res) => {
  const questionId = req.params.id;
  let result;

  try {
    result = await connectionPool.query(
      `select * from questions where id = $1`,
      [questionId]
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read question because database connection",
    });
  }

  return res.status(200).json({
    data: result.rows[0],
    message: "Successfully retrieved the question.",
  });
});

questionsRouter.put(
  "/:id",
  [validateIfQuestionExist],
  [checkCategoryInput],
  async (req, res) => {
    const questionId = req.params.id;
    const updatedQuestion = {
      ...req.body,
      updated_at: new Date(),
    };
    let result;

    if (!updatedQuestion.title) {
      return res.status(400).json({
        message: "The title field is required. Please enter a title.",
      });
    }

    try {
      await connectionPool.query(
        `update questions set 
        title = $1, 
        description = $2, 
        category = $3, 
        updated_at = $4 where id = $5`,
        [
          updatedQuestion.title,
          updatedQuestion.description,
          updatedQuestion.category,
          updatedQuestion.updated_at,
          questionId,
        ]
      );
      result = await connectionPool.query(
        `select * from questions where id = $1`,
        [questionId]
      );
    } catch (error) {
      return res.status(500).json({
        message:
          "Server could not update the question because database connection",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
      message: "Successfully updated the question.",
    });
  }
);

questionsRouter.delete("/:id", [validateIfQuestionExist], async (req, res) => {
  const questionId = req.params.id;

  try {
    await connectionPool.query(`delete from questions where id = $1`, [
      questionId,
    ]);
    //--- database ลบ answer ให้อยู่แล้วจาก questions(id) ON DELETE CASCADE
    // await connectionPool.query(`delete from answers where question_id = $1`, [
    //   questionId,
    // ]);
  } catch (error) {
    return res.status(500).json({
      message:
        "Server could not delete question and answers because database connection",
    });
  }
  return res
    .status(200)
    .json({ message: "Question and answers deleted successfully" });
});

questionsRouter.post("/:id/answers", async (req, res) => {
  const questionId = req.params.id;
  const newAnswer = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
  };
  let result;

  if (!newAnswer.content) {
    return res.status(400).json({
      message: "Please enter an answer",
    });
  }

  if (newAnswer.content.length > 300) {
    return res.status(400).json({
      message: "Please ensure your answer does not exceed 300 characters.",
    });
  }

  try {
    await connectionPool.query(
      `insert into answers (question_id, content, created_at, updated_at) values ($1, $2, $3, $4)`,
      [
        questionId,
        newAnswer.content,
        newAnswer.created_at,
        newAnswer.updated_at,
      ]
    );
    result = await connectionPool.query(
      `select * from answers order by id desc limit 1`
    );
  } catch (error) {
    return res.status(500).json({
      message: "Server could not create an answer because database connection",
    });
  }
  return res.status(201).json({
    data: result.rows[0],
    message: "Answer created successfully.",
  });
});

questionsRouter.get(
  "/:id/answers",
  [validateIfQuestionExist],
  async (req, res) => {
    const questionId = req.params.id;
    let result;
    try {
      result = await connectionPool.query(
        `select * from answers where question_id = $1`,
        [questionId]
      );
    } catch (error) {
      return res.status(500).json({
        message: "Server could not read answers because database connection",
      });
    }
    return res.status(200).json({
      data: result.rows,
      message: "Successfully retrieved answers.",
    });
  }
);

questionsRouter.post(
  "/:id/upvote",
  [validateIfQuestionExist],
  async (req, res) => {
    const questionId = req.params.id;
    let result;

    try {
      await connectionPool.query(
        `insert into question_votes (question_id, vote) VALUES ($1, 1)`,
        [questionId]
      );
      result = await connectionPool.query(
        `select 
            questions.id,
            questions.title,
            questions.description,
            questions.category,
            questions.created_at,
            questions.updated_at,
            COALESCE(SUM(CASE WHEN question_votes.vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
            COALESCE(SUM(CASE WHEN question_votes.vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
        from questions
        left join question_votes
            on questions.id = question_votes.question_id
        where questions.id = $1
        group by questions.id,
            questions.title,
            questions.description,
            questions.category,
            questions.created_at,
            questions.updated_at`,
        [questionId]
      );
    } catch (error) {
      return res.status(500).json({
        message: "Server could not upvote because database connection",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
      message: "Successfully upvoted the question.",
    });
  }
);

questionsRouter.post(
  "/:id/downvote",
  [validateIfQuestionExist],
  async (req, res) => {
    const questionId = req.params.id;
    let result;

    try {
      await connectionPool.query(
        `insert into question_votes (question_id, vote) VALUES ($1, -1)`,
        [questionId]
      );
      result = await connectionPool.query(
        `select 
              questions.id,
              questions.title,
              questions.description,
              questions.category,
              questions.created_at,
              questions.updated_at,
              COALESCE(SUM(CASE WHEN question_votes.vote = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
              COALESCE(SUM(CASE WHEN question_votes.vote = -1 THEN 1 ELSE 0 END), 0) AS downvotes
          from questions
          left join question_votes
              on questions.id = question_votes.question_id
          where questions.id = $1
          group by questions.id,
              questions.title,
              questions.description,
              questions.category,
              questions.created_at,
              questions.updated_at`,
        [questionId]
      );
    } catch (error) {
      return res.status(500).json({
        message: "Server could not downvote because database connection",
      });
    }

    return res.status(200).json({
      data: result.rows[0],
      message: "Successfully downvoted the question.",
    });
  }
);
