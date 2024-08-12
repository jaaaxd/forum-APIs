import express from "express";
import { questionsRouter } from "./routes/questions.mjs";
import { answersRouter } from "./routes/answers.mjs";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

app.use("/questions", questionsRouter);
app.use("/answers", answersRouter);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      description: "sdfjsdf",
      servers: ["http://localhost:4000"],
    },
  },
  apis: ["app.mjs"],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Retrieve a list of all questions
 *     description: Retrieve a list of all questions available in the system.
 *     responses:
 *       '200':
 *         description: A list of questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The question ID
 *                     example: 1
 *                   question:
 *                     type: string
 *                     description: The question text
 *                     example: What is the capital of France?
 *                   answer:
 *                     type: string
 *                     description: The answer to the question
 *                     example: Paris
 *       '500':
 *         description: Internal server error
 */
