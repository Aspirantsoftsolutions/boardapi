import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import path, { extname } from "path";

const s3 = new aws.S3({});

let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldname: file.fieldname,
      });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + path.extname(file.originalname));
    },
  }),
});

const diskUpload = multer({
  dest: "./uploads",
  filename: (req, file, cb) => {
    const { user } = req;
    const filename = `${user.useername}-${
      file.originalname.split(".")[0]
    }-${Date.now()}${extname(file.originalname)}`;
    cb(null, filename);
  },
});

export default {
  upload,
  diskUpload,
};
