import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';

aws.config.update({
    secretAccessKey: 'lfm2KHZjO2EWr+yypJ0PqkUbbC1KcKnHIOeMGx3z',
    accessKeyId: 'AKIARBF3UHUUZNG42BG3',
    region: 'us-east-1' //E.g us-east-1
});

const s3 = new aws.S3();
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/avif', 'image/bmp', 'image/gif', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/tiff', 'image/webp'];
const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];
const audioMimeTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav']

/* In case you want to validate your file type */
const fileFilter = (req, file, cb) => {
    if (imageMimeTypes.includes(file.mimetype) || videoMimeTypes.includes(file.mimetype) || audioMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Wrong file type.'),
            false);
    }
};

const upload = multer({
    fileFilter: fileFilter,
    storage: multerS3({
        s3,
        bucket: 'stream-board-media-coll',
        key: function (req, file, cb) {
            /*I'm using Date.now() to make sure my file has a unique name*/
            req.file = file;
            req.fileName = Date.now() + file.originalname;
            cb(null, Date.now() + file.originalname);
        }
    })
});

export default upload