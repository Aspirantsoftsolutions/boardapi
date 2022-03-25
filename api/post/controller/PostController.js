import PostModel from "../model/PostModel.js";
import HastagSchema from "../model/hashtag.js";

/**
 * @description API Response Utility functions
 * @param {Function} successResponse - Success Response with message
 * @param successResponseWithData - Success Response with data
 * @param ErrorResponse - Error Response with message
 * @param ErrorResponseWithData - Error Response with data
 * @param validationErrorWithData - Validation Error with data
 * @param validationError - Validation Error with message
 * @param unauthorizedResponse - Unauthorized Error response handling
 * @param unprocessable - Unprocessable Error response handling
 */
import {
  successResponse,
  successResponseWithData,
  ErrorResponse,
  ErrorResponseWithData,
  notFoundResponse,
  validationErrorWithData,
  validationError,
  unauthorizedResponse,
  unprocessable,
} from "../../utils/apiResponse.js";

import validator from "express-validator";

const { param, validationResult } = validator;

/**
 * @description User Constants
 * @param UserConstants
 */
import postConstants from "../const.js";

/**
 *  Create Post
 *
 */
const createPost = [
  async (req, res) => {
    const { user, files } = req;
    const userId = user._id;
    try {
      const { hashtags } = req.body;

      if (!files) {
        return ErrorResponse(res, postConstants.fileError);
      }

      const fileNameArr = [];

      files.forEach((f) => {
        fileNameArr.push(f.filename);
      });

      let hashTagData = await HastagSchema.findOne();
      if (!hashTagData) {
        hashTagData = await HastagSchema.create();
      }
      console.log(hashTagData);

      hashTagData.hashtags = Array.from(
        new Set([...hashTagData.hashtags, ...hashtags])
      );

      const promiseArr = [
        hashTagData.save(),
        PostModel.create({ userId, hashtags }),
      ];

      await Promise.all(promiseArr);
      return successResponse(res, postConstants.postCreated);
    } catch (err) {
      console.log(err);
      return ErrorResponse(res, postConstants.postCannotBeCreated);
    }
  },
];

const createPosts = [
  async (req, res) => {
    const {
      user,
      files
    } = req;
    const userId = user._id;
    try {
      const {
        hashtags
      } = req.body;

      if (!files) {
        return ErrorResponse(res, postConstants.fileError);
      }

      const fileNameArr = [];

      files.forEach((f) => {
        fileNameArr.push(f.filename);
      });

      let hashTagData = await HastagSchema.findOne();
      if (!hashTagData) {
        hashTagData = await HastagSchema.create();
      }
      console.log(hashTagData);

      hashTagData.hashtags = Array.from(
        new Set([...hashTagData.hashtags, ...hashtags])
      );

      const promiseArr = [
        hashTagData.save(),
        PostModel.create({
          userId,
          hashtags
        }),
      ];

      await Promise.all(promiseArr);
      return successResponse(res, postConstants.postCreated);
    } catch (err) {
      console.log(err);
      return ErrorResponse(res, postConstants.postCannotBeCreated);
    }
  },
];


/**
 *  Fetch all hashtags
 *
 */
const fetchHastags = [
  async (req, res) => {
    try {
      const hashTagData = await HastagSchema.findOne().lean();

      return successResponseWithData(res, postConstants.hashtagsFetched, {
        hashtags: hashTagData.hashtags,
      });
    } catch (err) {
      console.log(err);
      return ErrorResponse(res, postConstants.hashtagsNotFethced);
    }
  },
];

/*
 * Get all posts for user
 */
const getPosts = [
  async (req, res) => {
    const { user } = req;
    const userId = user._id;
    try {
      const postsData = await PostModel.find({ userId, isDeleted: false });
      return successResponseWithData(
        res,
        postConstants.postsFetched,
        postsData
      );
    } catch (err) {
      return ErrorResponse(res, postConstants.postCannotBeFetched);
    }
  },
];

/*
 * Updated a user posts
 */
const updatePosts = [
  param("postId").isMongoId().withMessage(postConstants.postIdNotProvided),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Display sanitized values/errors messages.
      return validationErrorWithData(
        res,
        postConstants.validationError,
        errors.array()
      );
    } else {
      const { user } = req;
      const userId = user._id;
      const { postId } = req.params;

      try {
        await PostModel.findOneAndUpdate({ _id: postId, userId }, req.body);
        return successResponse(res, postConstants.postUpdated);
      } catch (err) {
        return ErrorResponse(res, postConstants.postCannotBeUpdated);
      }
    }
  },
];

/*
 * Delete a posts
 */
const deletePost = [
  param("postId").isMongoId().withMessage(postConstants.postIdNotProvided),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Display sanitized values/errors messages.
      return validationErrorWithData(
        res,
        postConstants.validationError,
        errors.array()
      );
    } else {
      const { user } = req;
      const userId = user._id;

      const { postId } = req.params;

      try {
        await PostModel.findOneAndUpdate(
          { postId, userId },
          { isDeleted: true }
        );
        return successResponse(res, postConstants.postDeleted);
      } catch (err) {
        return ErrorResponse(res, postConstants.postCannoteBeDeleted);
      }
    }
  },
];

export default {
  createPost,
  getPosts,
  updatePosts,
  deletePost,
  fetchHastags,
};
