
import express from "express";
import gradesController from '../controller/grades.controller.js';

let gradesRouter = express.Router();

// gradesRouter.post("/preSignURL", multiMediaController.preSignS3URL);
gradesRouter.post("/create", gradesController.createGrade);
gradesRouter.get("/:schoolId", gradesController.getGrades);
gradesRouter.get("/grade/:gradeId", gradesController.gradeById);

export default gradesRouter;
